/*
 * Copyright 2019 Expedia Group Inc.
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

const dockerComposeTimeoutMillis = 60 * 1000;
const localSchemaRegistry = new LocalSchemaResitry(1);

beforeAll(() => localSchemaRegistry.startSchemaRegistry(), dockerComposeTimeoutMillis);
afterAll(() => localSchemaRegistry.destroySchemaRegistry(), dockerComposeTimeoutMillis);

function readSchemaFromLocalFile(avscSchemaFilePath) {
  return fs.readFile(avscSchemaFilePath, { encoding: 'UTF-8' });
}

function checkSchemaCompatibility(schemaSubject, schemaFileName) {
  return readSchemaFromLocalFile(path.resolve(__dirname, schemaFileName)).then((content) => {
    const options = {
      schemaRegistryUrl: 'http://localhost:8081',
    };
    return new SchemaRegistry(options).isSchemaCompatible(schemaSubject, content.toString());
  });
}

function registerSchema(schemaSubject, schemaFileName) {
  return readSchemaFromLocalFile(path.resolve(__dirname, schemaFileName)).then((content) => {
    const options = {
      schemaRegistryUrl: 'http://localhost:8081',
    };
    return new SchemaRegistry(options).registerSchema(schemaSubject, content.toString());
  });
}

test('Subject not found in schema registry', () => checkSchemaCompatibility('non-existing-subject', './schemas/schema_v1.avsc')
  .then(response => expect(response).toBe(true))
  .catch((error) => {
    expect(error !== undefined).toBe(true);
    expect(error.toString().includes('Subject not found')).toBe(true);
  }));

function verifyRegisteredSchema(value) {
  expect(value).toBe('{"id":1}');
  return Promise.resolve(value);
}

function checkCompatibilityOfNewVersion(subject, schemaFileName, value) {
  expect(value).toBe('{"id":1}');
  return checkSchemaCompatibility(subject, schemaFileName);
}

function verifyCompatibility(isCompatible, expected) {
  expect(isCompatible).toBe(expected);
  return Promise.resolve(isCompatible);
}
function verifyThatNewVersionIsCompatible(isCompatible) {
  return verifyCompatibility(isCompatible, true);
}

function verifyThatNewVersionIsNotCompatible(isCompatible) {
  return verifyCompatibility(isCompatible, false);
}

function addNewVersionOfSchema(subject, schemaFileName) {
  return registerSchema(subject, schemaFileName);
}

function verifyNewVerionOfSchema(versionResponse) {
  expect(versionResponse).toBe('{"id":2}');
  return Promise.resolve(versionResponse);
}

function handleError(error) {
  expect(error.toString().includes('Error')).toBe(true);
  return Promise.resolve(error);
}

function verifyInCompatibleError(error) {
  expect(error.toString().includes('Schema being registered is incompatible with an earlier schema')).toBe(true);
  return Promise.resolve(error);
}

test('Add new schema, verify it is added,'
  + ' check compatibility of new version of scheme'
  + ' and add new version if compatible', () => registerSchema('test-subject', './schemas/schema.avsc')
  .then(verifyRegisteredSchema)
  .then(checkCompatibilityOfNewVersion.bind(null, 'test-subject', './schemas/schema_v1.avsc'))
  .then(verifyThatNewVersionIsCompatible)
  .then(addNewVersionOfSchema.bind(null, 'test-subject', './schemas/schema_v1.avsc'))
  .then(verifyNewVerionOfSchema)
  .catch(handleError), 10000);

test('Add new schema, verify it is added,'
  + ' check compatibility of new version of scheme'
  + ' and not add new version if not compatible', () => registerSchema('test-subject-2', './schemas/schema.avsc')
  .then(verifyRegisteredSchema)
  .then(checkCompatibilityOfNewVersion.bind(null, 'test-subject-2', './schemas/schema_v2.avsc'))
  .then(verifyThatNewVersionIsNotCompatible)
  .then(addNewVersionOfSchema.bind(null, 'test-subject-2', './schemas/schema_v2.avsc'))
  .catch(verifyInCompatibleError), 100000);
