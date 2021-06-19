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
const fs = require('fs');
const javroWithValidation = require('../../utils/javro-with-validation');

test('primitive types', () => javroWithValidation(path.resolve(__dirname, './primitives.avsc'), {
  jsonSchemaFile: path.resolve(__dirname, './primitives.json'),
  namespace: 'test.jsonschema.to.avro.namespace',
}).then((res) => {
  expect(res.actualAvro).toStrictEqual(res.expectedAvro);
}));

test('primitive with multi types', () => javroWithValidation(path.resolve(__dirname, './primitives_with_multitype.avsc'), {
  jsonSchemaFile: path.resolve(__dirname, './primitives_with_multitype.json'),
  namespace: 'test.jsonschema.to.avro.namespace',
  allowMultipleTypes: true,
}).then((res) => {
  expect(res.actualAvro).toStrictEqual(res.expectedAvro);
}));

test('titled schema', () => javroWithValidation(path.resolve(__dirname, './titled.avsc'), {
  jsonSchemaFile: path.resolve(__dirname, './titled.json'),
  namespace: 'test.jsonschema.to.avro.namespace',
}).then((res) => {
  expect(res.actualAvro).toStrictEqual(res.expectedAvro);
}));

test('nested objects', () => javroWithValidation(path.resolve(__dirname, './nested_objects.avsc'), {
  jsonSchemaFile: path.resolve(__dirname, './nested_objects.json'),
  namespace: 'test.jsonschema.to.avro.namespace',
}).then((res) => {
  expect(res.actualAvro).toStrictEqual(res.expectedAvro);
}));

test('arrays', () => javroWithValidation(path.resolve(__dirname, './some_arrays.avsc'), {
  jsonSchemaFile: path.resolve(__dirname, './some_arrays.json'),
  namespace: 'test.jsonschema.to.avro.namespace',
}).then((res) => {
  expect(res.actualAvro).toStrictEqual(res.expectedAvro);
}));

test('enum', () => javroWithValidation(path.resolve(__dirname, './some_enum.avsc'), {
  jsonSchemaFile: path.resolve(__dirname, './some_enum.json'),
  namespace: 'test.jsonschema.to.avro.namespace',
}).then((res) => {
  expect(res.actualAvro).toStrictEqual(res.expectedAvro);
}));

test('with jsonSchema', () => javroWithValidation(path.resolve(__dirname, './some_enum.avsc'), {
  jsonSchemaFile: path.resolve(__dirname, './some_enum.json'),
  jsonSchema: fs.readFileSync(path.resolve(__dirname, './some_enum.json')),
  namespace: 'test.jsonschema.to.avro.namespace',
}).then((res) => {
  expect(res.actualAvro).toStrictEqual(res.expectedAvro);
}));
