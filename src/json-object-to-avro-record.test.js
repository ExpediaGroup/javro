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

const JsonSchemaToAvro = require('./json-object-to-avro-record');

test('gets namespace, name and type right', () => {
  const avsc = new JsonSchemaToAvro({ properties: {}, type: 'object' }).mapObjectToRecord('namespace', 'name');
  expect(avsc.namespace).toBe('namespace');
  expect(avsc.name).toBe('name');
  expect(avsc.type).toBe('record');
  expect(avsc.fields).toStrictEqual([]);
});

test('fails if try and convert a non-object to a record', () => {
  expect(() => {
    JsonSchemaToAvro({ type: 'string' });
  }).toThrow('Can only convert objects to records (got type \'string\')');
});

test('maps a string', () => {
  const avsc = new JsonSchemaToAvro({
    properties: {
      test: { type: 'string' },
    },
    type: 'object',
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].name).toBe('test');
  expect(avsc.fields[0].type).toStrictEqual(['null', 'string']);
});

test('maps a number', () => {
  const avsc = new JsonSchemaToAvro({
    properties: {
      test: { type: 'number' },
    },
    type: 'object',
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].name).toBe('test');
  expect(avsc.fields[0].type).toStrictEqual(['null', 'double']);
});

test('maps an integer', () => {
  const avsc = new JsonSchemaToAvro({
    properties: {
      test: { type: 'integer' },
    },
    type: 'object',
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].name).toBe('test');
  expect(avsc.fields[0].type).toStrictEqual(['null', 'long']);
});

test('maps a string', () => {
  const avsc = new JsonSchemaToAvro({
    properties: {
      test: { type: 'string' },
    },
    type: 'object',
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].name).toBe('test');
  expect(avsc.fields[0].type).toStrictEqual(['null', 'string']);
});

test('maps a boolean', () => {
  const avsc = new JsonSchemaToAvro({
    properties: {
      test: { type: 'boolean' },
    },
    type: 'object',
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].name).toBe('test');
  expect(avsc.fields[0].type).toStrictEqual(['null', 'boolean']);
});

test('maps an optional object', () => {
  const avsc = new JsonSchemaToAvro({
    properties: {
      foo: {
        type: 'object',
        properties: {
          bar: { type: 'string' },
        },
      },
    },
    type: 'object',
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].name).toBe('foo');
  expect(avsc.fields[0].type[0]).toBe('null');
  expect(avsc.fields[0].default).toBe(null);
  expect(avsc.fields[0].type[1].type).toBe('record');
  expect(avsc.fields[0].type[1].fields[0].name).toBe('bar');
  expect(avsc.fields[0].type[1].fields[0].type).toStrictEqual(['null', 'string']);
});

test('maps an array of numbers', () => {
  const avsc = new JsonSchemaToAvro({
    properties: {
      test: {
        type: 'array',
        items: { type: 'number' },
      },
    },
    type: 'object',
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].name).toBe('test');
  expect(avsc.fields[0].type).toStrictEqual(['null', { type: 'array', items: 'double' }]);
});

test('maps an array of objects', () => {
  const avsc = new JsonSchemaToAvro({
    type: 'object',
    properties: {
      foo: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            bar: { type: 'string' },
          },
          required: ['bar'],
        },
      },
    },
    required: ['foo'],
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].name).toBe('foo');
  expect(avsc.fields[0].type.type).toBe('array');
  expect(avsc.fields[0].type.items.type).toBe('record');
  expect(avsc.fields[0].type.items.fields[0].name).toBe('bar');
  expect(avsc.fields[0].type.items.fields[0].type).toBe('string');
});

test('rejects an array which doesn\'t have a type', () => {
  expect(() => {
    new JsonSchemaToAvro({
      properties: {
        foo: {
          type: 'array',
        },
      },
      type: 'object',
    }).mapObjectToRecord('namespace', 'name');
  }).toThrow('Array for key \'foo\' must specify what type its \'items\' are');
});

test('maps a required object', () => {
  const avsc = new JsonSchemaToAvro({
    properties: {
      foo: {
        type: 'object',
        properties: {
          bar: { type: 'string' },
        },
      },
    },
    required: ['foo'],
    type: 'object',
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].name).toBe('foo');
  expect(avsc.fields[0].type.type).toBe('record');
  expect(avsc.fields[0].type.fields[0].name).toBe('bar');
  expect(avsc.fields[0].type.fields[0].type).toStrictEqual(['null', 'string']);
});

test('fails to map something unexpected', () => {
  expect(() => {
    new JsonSchemaToAvro({
      properties: {
        foo: { type: 'bar' },
      },
      type: 'object',
    }).mapObjectToRecord('namespace', 'name');
  }).toThrow('Can\'t work out what type \'bar\' for key \'foo\' should be in Avro');
});

test('knows when something is required and makes unions ["null", "blah"] for optionals', () => {
  const avsc = new JsonSchemaToAvro({
    type: 'object',
    properties: {
      optional: { type: 'string' },
      required: { type: 'string' },
    },
    required: ['required'],
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].name).toBe('optional');
  expect(avsc.fields[0].type).toStrictEqual(['null', 'string']);
  expect(avsc.fields[0].default).toBe(null);

  expect(avsc.fields[1].name).toBe('required');
  expect(avsc.fields[1].type).toBe('string');
  expect(avsc.fields[1].default).toBeUndefined();
});

test('nested object ignores the title', () => {
  const avsc = new JsonSchemaToAvro({
    title: 'topLevelObject',
    type: 'object',
    properties: {
      foo: {
        title: 'nestedObject',
        type: 'object',
        properties: {
          bar: { type: 'string' },
        },
        required: ['bar'],
      },
    },
    required: ['foo'],
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].type.name).toBe('foo');
});

test('nested object gets a new namespace from its parent', () => {
  const avsc = new JsonSchemaToAvro({
    title: 'topLevelObject',
    type: 'object',
    properties: {
      foo: {
        title: 'nestedObject',
        type: 'object',
        properties: {
          bar: { type: 'string' },
        },
        required: ['bar'],
      },
    },
    required: ['foo'],
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].type.namespace).toBe('namespace.namePackage');
  expect(avsc.fields[0].type.name).toBe('foo');
});

test('if `allowMultipleTypes` is `true`, map a required property which has multiple types', () => {
  const avsc = new JsonSchemaToAvro({
    type: 'object',
    properties: {
      foo: { type: ['string', 'integer'] },
    },
    required: ['foo'],
  }, true).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].type).toStrictEqual(['string', 'long']);
});

test('if `allowMultipleTypes` is `true`, map an optional property which has multiple types', () => {
  const avsc = new JsonSchemaToAvro({
    type: 'object',
    properties: {
      foo: { type: ['string', 'integer'] },
    },
  }, true).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].type).toStrictEqual(['null', 'string', 'long']);
});

test('if `allowMultipleTypes` is `false` or `undefined`, map a required property which has multiple types', () => {
  const avsc = new JsonSchemaToAvro({
    type: 'object',
    properties: {
      foo: { type: ['string', 'integer'] },
    },
    required: ['foo'],
  }, false).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].type).toStrictEqual('long');
});

test('if `allowMultipleTypes` is `false` or `undefined`, map an optional property which has multiple types', () => {
  const avsc = new JsonSchemaToAvro({
    type: 'object',
    properties: {
      foo: { type: ['boolean', 'number'] },
    },
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].type).toStrictEqual(['null', 'double']);
});

test('supports `oneOf` for a property', () => {
  const avsc = new JsonSchemaToAvro({
    type: 'object',
    properties: {
      foo: {
        oneOf: [
          {
            type: 'object',
            properties: {
              spam: { type: 'string' },
            },
            required: ['spam'],
          },
          {
            type: 'object',
            properties: {
              ham: { type: 'number' },
            },
            required: ['ham'],
          },
          {
            type: 'object',
            properties: {
              eggs: { type: 'boolean' },
            },
          },
        ],
      },
    },
    required: ['foo'],
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].type.namespace).toBe('namespace.namePackage');
  expect(avsc.fields[0].type.name).toBe('foo');

  expect(avsc.fields[0].type.fields[0].name).toBe('eggs');
  expect(avsc.fields[0].type.fields[0].type[1]).toBe('boolean');

  expect(avsc.fields[0].type.fields[1].name).toBe('ham');
  expect(avsc.fields[0].type.fields[1].type[1]).toBe('double');

  expect(avsc.fields[0].type.fields[2].name).toBe('spam');
  expect(avsc.fields[0].type.fields[2].type[1]).toBe('string');
});

test('supports `allOf` for a property', () => {
  const avsc = new JsonSchemaToAvro({
    type: 'object',
    properties: {
      foo: {
        allOf: [
          {
            type: 'object',
            properties: {
              spam: { type: 'string' },
            },
            required: ['spam'],
          },
          {
            type: 'object',
            properties: {
              ham: { type: 'number' },
            },
            required: ['ham'],
          },
          {
            type: 'object',
            properties: {
              eggs: { type: 'boolean' },
            },
          },
        ],
      },
    },
    required: ['foo'],
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].type.namespace).toBe('namespace.namePackage');
  expect(avsc.fields[0].type.name).toBe('foo');

  expect(avsc.fields[0].type.fields[0].name).toBe('eggs');
  expect(avsc.fields[0].type.fields[0].type[1]).toBe('boolean');

  expect(avsc.fields[0].type.fields[1].name).toBe('ham');
  expect(avsc.fields[0].type.fields[1].type[1]).toBe('double');

  expect(avsc.fields[0].type.fields[2].name).toBe('spam');
  expect(avsc.fields[0].type.fields[2].type[1]).toBe('string');
});

test('supports `oneOf` for array of objects', () => {
  const avsc = new JsonSchemaToAvro({
    type: 'object',
    properties: {
      info: {
        type: 'array',
        items: {
          type: 'object',
          oneOf: [
            { properties: { foo: { type: 'string' } }, required: ['bar'] },
            { properties: { bar: { type: 'string' } }, additionalProperties: false },
          ],
        },
      },
    },
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].type[1].items.namespace).toBe('namespace.namePackage');

  expect(avsc.fields[0].type[1].items.fields[0].name).toBe('bar');
  expect(avsc.fields[0].type[1].items.fields[0].type[1]).toBe('string');

  expect(avsc.fields[0].type[1].items.fields[1].name).toBe('foo');
  expect(avsc.fields[0].type[1].items.fields[1].type[1]).toBe('string');
});

test('supports `allOf` for array of objects', () => {
  const avsc = new JsonSchemaToAvro({
    type: 'object',
    properties: {
      info: {
        type: 'array',
        items: {
          type: 'object',
          allOf: [
            { properties: { foo: { type: 'string' } }, required: ['foo'] },
            { properties: { bar: { type: 'string' } }, additionalProperties: false },
          ],
        },
      },
    },
  }).mapObjectToRecord('namespace', 'name');

  expect(avsc.fields[0].type[1].items.namespace).toBe('namespace.namePackage');

  expect(avsc.fields[0].type[1].items.fields[0].name).toBe('bar');
  expect(avsc.fields[0].type[1].items.fields[0].type[1]).toBe('string');

  expect(avsc.fields[0].type[1].items.fields[1].name).toBe('foo');
  expect(avsc.fields[0].type[1].items.fields[1].type[1]).toBe('string');
});
