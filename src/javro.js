/*
 * Copyright 2019-2021 Expedia, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path');
const Promise = require('promise');
const resolveReferences = require('./resolve_references');
const JsonSchemaToAvro = require('./json-object-to-avro-record');
const maintainOrderOfFields = require('./maintain-order-of-fields');
const SchemaRegistryAvroFetcher = require('./schema-registry-avro-fetcher/schema-registry-avro-fetcher');

function grabAvroName(jsonSchemaFile, jsonSchema) {
  if (jsonSchema.title) {
    return jsonSchema.title;
  }

  const file = path.parse(jsonSchemaFile).base;
  return file.substring(0, file.indexOf('.json'));
}

function fetchCorrespondingAvro(json, options) {
  if (options.avroFetcher) {
    return options.avroFetcher.fetchAvro().then(avroJson => JSON.parse(avroJson));
  }
  return new Promise((resolve) => { resolve(undefined); });
}

function fetchAvroCompatibility(options, res) {
  if (options.avroFetcher) {
    return options.avroFetcher.isCompatible(JSON.stringify({ schema: JSON.stringify(res) }));
  }
  return new Promise((resolve => resolve('AVRO_FETCHER_NOT_FOUND')));
}

function resolveReferencesAndTurnIntoAvro(options) {
  return resolveReferences(options.jsonSchemaFile, options.jsonSchema).then((resolvedJson) => {
    const newAvsc = new JsonSchemaToAvro(resolvedJson, options.allowMultipleTypes || false)
      .mapObjectToRecord(options.namespace, grabAvroName(options.jsonSchemaFile, resolvedJson));
    return fetchCorrespondingAvro(resolvedJson, options).then((oldAvsc) => {
      if (oldAvsc) {
        return maintainOrderOfFields(oldAvsc, newAvsc);
      }
      return newAvsc;
    }).then(avsc => fetchAvroCompatibility(options, avsc)
      .then(isCompatible => ({ isCompatible, avsc })));
  });
}

function javro(options) {
  return resolveReferencesAndTurnIntoAvro(options);
}
module.exports = {
  javro,
  SchemaRegistryAvroFetcher,
};
