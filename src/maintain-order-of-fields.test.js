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

const maintainOrderOfFields = require('./maintain-order-of-fields');

test('based on a prior AVSC, adds new fields to the end to avoid breaking changes', () => {
  const res = maintainOrderOfFields({
    fields: [
      { name: 'show', type: 'string' },
      { name: 'me', type: 'int' },
    ],
  }, {
    fields: [
      { name: 'me', type: 'int' },
      { name: 'the', type: 'double' },
      { name: 'show', type: 'string' },
      { name: 'money', type: 'boolean' },
    ],
  });

  expect(res).toStrictEqual({
    fields: [
      { name: 'show', type: 'string' },
      { name: 'me', type: 'int' },
      { name: 'the', type: 'double' },
      { name: 'money', type: 'boolean' },
    ],
  });
});

test('does the recursion thing into nested records', () => {
  const res = maintainOrderOfFields({
    fields: [
      {
        name: 'foo1',
        type: {
          type: 'record',
          fields: [
            {
              name: 'foo2',
              type: {
                type: 'record',
                fields: [
                  {
                    name: 'foo3',
                    type: {
                      type: 'record',
                      fields: [
                        { name: 'foo4', type: 'boolean' },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      { name: 'bar1', type: 'string' },
    ],
  }, {
    fields: [
      { name: 'bar1', type: 'string' },
      {
        name: 'foo1',
        type: {
          type: 'record',
          fields: [
            { name: 'bar2', type: 'string' },
            {
              name: 'foo2',
              type: {
                type: 'record',
                fields: [
                  { name: 'bar3', type: 'string' },
                  {
                    name: 'foo3',
                    type: {
                      type: 'record',
                      fields: [
                        { name: 'foo4', type: 'boolean' },
                        { name: 'bar4', type: 'string' },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  });

  expect(res).toStrictEqual({
    fields: [
      {
        name: 'foo1',
        type: {
          type: 'record',
          fields: [
            {
              name: 'foo2',
              type: {
                type: 'record',
                fields: [
                  {
                    name: 'foo3',
                    type: {
                      type: 'record',
                      fields: [
                        { name: 'foo4', type: 'boolean' },
                        { name: 'bar4', type: 'string' },
                      ],
                    },
                  },
                  { name: 'bar3', type: 'string' },
                ],
              },
            },
            { name: 'bar2', type: 'string' },
          ],
        },
      },
      { name: 'bar1', type: 'string' },
    ],
  });
});

test('does the recursion thing into optional nested records', () => {
  const res = maintainOrderOfFields({
    fields: [
      {
        name: 'foo1',
        type: ['null', {
          type: 'record',
          fields: [
            {
              name: 'foo2',
              type: ['null', {
                type: 'record',
                fields: [
                  { name: 'foo3', type: ['null', 'boolean'] },
                ],
              }],
            },
          ],
        }],
      },
      { name: 'bar1', type: ['null', 'string'] },
    ],
  }, {
    fields: [
      { name: 'bar1', type: ['null', 'string'] },
      {
        name: 'foo1',
        type: ['null', {
          type: 'record',
          fields: [
            { name: 'bar2', type: ['null', 'string'] },
            {
              name: 'foo2',
              type: ['null', {
                type: 'record',
                fields: [
                  { name: 'bar3', type: ['null', 'string'] },
                  { name: 'foo3', type: ['null', 'boolean'] },
                ],
              }],
            },
          ],
        }],
      },
    ],
  });

  expect(res).toStrictEqual({
    fields: [
      {
        name: 'foo1',
        type: ['null', {
          type: 'record',
          fields: [
            {
              name: 'foo2',
              type: ['null', {
                type: 'record',
                fields: [
                  { name: 'foo3', type: ['null', 'boolean'] },
                  { name: 'bar3', type: ['null', 'string'] },
                ],
              }],
            },
            { name: 'bar2', type: ['null', 'string'] },
          ],
        }],
      },
      { name: 'bar1', type: ['null', 'string'] },
    ],
  });
});

test('removes fields that no longer exist (this would be a breaking change - but that\'s the '
  + 'concern of the JSON Schema author)', () => {
  const res = maintainOrderOfFields({
    fields: [
      { name: 'show', type: 'string' },
      { name: 'me', type: 'int' },
      { name: 'the', type: 'double' },
    ],
  }, {
    fields: [
      { name: 'me', type: 'int' },
      { name: 'show', type: 'string' },
      { name: 'money', type: 'boolean' },
    ],
  });

  expect(res).toStrictEqual({
    fields: [
      { name: 'show', type: 'string' },
      { name: 'me', type: 'int' },
      { name: 'money', type: 'boolean' },
    ],
  });
});
