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
const avsc = require('avsc');
const fs = require('fs').promises;
const { javro } = require('../../../src/javro');

test('serialises and deserialises JSON correctly', () => javro({
  jsonSchemaFile: path.resolve(__dirname, './sample_schema.json'),
  namespace: 'test.jsonschema.to.avro.namespace',
}).then((res) => {
  const type = avsc.Type.forSchema(res.avsc);
  return fs.readFile(path.resolve(__dirname, './sample_msg.json'), { encoding: 'UTF-8' }).then((sampleJson) => {
    const sample = JSON.parse(sampleJson);
    const buf = type.toBuffer(sample);
    const actual = type.fromBuffer(buf);
    const actualWithoutTheWeirdObjectName = JSON.parse(JSON.stringify(actual));
    expect(actualWithoutTheWeirdObjectName).toStrictEqual(sample);
  });
}));
