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
const Promise = require('promise');
const requestPromise = require('request-promise-native');

const defaultAcceptHeader = 'application/vnd.schemaregistry.v1+json, application/vnd.schemaregistry+json, application/json';

/*
  Returns boolean new version is compatible with latest in schema or not
 */
function checkCompatibility(schemaRegistryUrl, subject, avscSchemaJson, acceptHeader) {
  const options = {
    method: 'POST',
    uri: `${schemaRegistryUrl}/compatibility/subjects/${subject}/versions/latest`,
    headers: {
      Accept: acceptHeader || defaultAcceptHeader,
    },
    body: avscSchemaJson,
  };

  return new Promise((resolve, reject) => {
    requestPromise(options).then((res) => {
      resolve(JSON.parse(res).is_compatible);
    }).catch((err) => {
      reject(new Error(`Could not get response from schema registry with error ${err.toString()}`));
    });
  });
}

function fetchLatestAvro(schemaRegistryUrl, subject) {
  return new Promise((resolve, reject) => {
    requestPromise(`${schemaRegistryUrl}/subjects/${subject}/versions/latest`).then((res) => {
      resolve(JSON.parse(res).schema);
    }).catch((err) => {
      reject(new Error(`Could not fetch schema from schema registry with error ${err.toString()}`));
    });
  });
}

function register(schemaRegistryUrl, subject, avscSchemaJson, acceptHeader) {
  const options = {
    method: 'POST',
    uri: `${schemaRegistryUrl}/subjects/${subject}/versions`,
    headers: {
      Accept: acceptHeader || defaultAcceptHeader,
    },
    body: avscSchemaJson,
  };
  return new Promise((resolve, reject) => {
    requestPromise(options).then((res) => {
      resolve(res);
    }).catch((err) => {
      reject(new Error(`Could not register schema with error ${err.toString()}`));
    });
  });
}

class SchemaRegistry {
  constructor(options) {
    this.schemaRegistryUrl = options.schemaRegistryUrl;
    this.acceptHeader = options.acceptHeader;
  }

  isSchemaCompatible(subject, avscSchemaJson) {
    return checkCompatibility(this.schemaRegistryUrl, subject, avscSchemaJson, this.acceptHeader);
  }

  registerSchema(subject, avscSchemaJson) {
    return register(this.schemaRegistryUrl, subject, avscSchemaJson, this.acceptHeader);
  }

  fetchLatestAvro(subject) {
    return fetchLatestAvro(this.schemaRegistryUrl, subject);
  }
}

module.exports = SchemaRegistry;
