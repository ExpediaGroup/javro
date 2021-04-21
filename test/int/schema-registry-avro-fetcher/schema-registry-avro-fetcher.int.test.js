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
const fs = require('fs').promises;
const Promise = require('promise');
const SchemaRegistry = require('../../../src/schema-registry/schema-registry');
const LocalSchemaResitry = require('../docker/docker-compose');
const { javro, SchemaRegistryAvroFetcher } = require('../../../src/javro');

const dockerComposeTimeoutMillis = 60 * 1000;
const localSchemaRegistry = new LocalSchemaResitry(1);

beforeAll(() => localSchemaRegistry.startSchemaRegistry(), dockerComposeTimeoutMillis);
afterAll(() => localSchemaRegistry.destroySchemaRegistry(), dockerComposeTimeoutMillis);

function readSchemaFromLocalFile(avscSchemaFilePath) {
  return fs.readFile(avscSchemaFilePath, { encoding: 'UTF-8' });
}

function createAvroFetcher(subject) {
  const options = {
    schemaRegistryUrl: 'http://localhost:8081',
    schemaSubject: subject,
  };
  return new SchemaRegistryAvroFetcher(options);
}

function getJavroOptions(subject, schemaPath, registerAvroFetcher = true) {
  return {
    jsonSchemaFile: path.resolve(__dirname, schemaPath),
    namespace: 'test.jsonschema.to.avro.namespace',
    avroFetcher: registerAvroFetcher ? createAvroFetcher(subject) : undefined,
  };
}


function registerSchema(schemaSubject, schemaFileName, registerAvroFetcher = true) {
  return readSchemaFromLocalFile(path.resolve(__dirname, schemaFileName)).then((content) => {
    const options = {
      schemaRegistryUrl: 'http://localhost:8081',
    };
    let schemaContent = content;
    if (schemaContent) {
      const parsedContent = JSON.parse(content);
      if (!parsedContent.schema) {
        schemaContent = JSON.stringify({ schema: content });
      }
    }
    return new SchemaRegistry(options).registerSchema(schemaSubject, schemaContent.toString())
      .then(() => javro(getJavroOptions(schemaSubject, './schemas/sample_schema.json', registerAvroFetcher)));
  });
}

function generateNewAvsc(subject, avscPath, schemaPath) {
  return javro(getJavroOptions(subject, schemaPath)).then(data => fs.writeFile(path.resolve(__dirname, avscPath), JSON.stringify(data.avsc))
    .then(() => registerSchema('avro-fetcher-subject', avscPath)));
}

function verifyCompatibilityOfRegisteredSchema(value) {
  expect(value.isCompatible).toBe(true);
  return Promise.resolve(value);
}

function verifyIfSchemaRegistryAvroFetcherNotProvided(value) {
  expect(value.isCompatible).toBe('AVRO_FETCHER_NOT_FOUND');
  return Promise.resolve(value);
}

function handleError(error) {
  expect(error.toString().includes('Schema being registered is incompatible with an earlier schema')).toBe(true);
  return Promise.resolve(error);
}

test('Add new schema, verify if its subject added,'
  + ' check compatibility of new version of schema',
() => registerSchema('avro-fetcher-subject', './schemas/sample_schema.avsc')
  .then(verifyCompatibilityOfRegisteredSchema)
  .catch(handleError), 20000);

test('Add new schema, verify if its subject added, push new version of avsc'
  + ' check compatibility of new version of schema',
() => registerSchema('avro-fetcher-subject', './schemas/sample_schema.avsc')
  .then(() => generateNewAvsc('avro-fetcher-subject', './schemas/sample_schema_evolved.avsc', './schemas/sample_schema_evolved.json')
    .then(verifyCompatibilityOfRegisteredSchema))
  .catch(handleError), 20000);

test('Add new schema, verify if its subject added, push new version of avsc with incompatible fields'
  + ' check compatibility of new version of schema',
() => registerSchema('avro-fetcher-subject', './schemas/sample_schema.avsc')
  .then(() => generateNewAvsc('avro-fetcher-subject', './schemas/sample_schema_evolved_incompatible.avsc', './schemas/sample_schema_evolved_incompatible.json'))
  .catch(handleError), 20000);

test('Add new schema, verify if its subject added, do not provide any avro fetcher'
  + ' check compatibility of new version of schema',
() => registerSchema('avro-fetcher-subject', './schemas/sample_schema.avsc', false)
  .then(verifyIfSchemaRegistryAvroFetcherNotProvided)
  .catch(handleError), 20000);
