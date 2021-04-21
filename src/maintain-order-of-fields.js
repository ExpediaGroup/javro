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

function findField(fields, name) {
  return fields.find(f => f.name === name);
}

function reOrderFields(oldFields, newFields) {
  const allFieldsWithPreservedOrder = [];

  // Remove any fields that no longer exist in the new schema (argh breaking change!)
  oldFields.forEach((oldField) => {
    const newField = findField(newFields, oldField.name);
    if (newField) {
      allFieldsWithPreservedOrder.push(newField);
    }
  });

  // Add net new keys to the end
  newFields.forEach((newField) => {
    const oldField = findField(allFieldsWithPreservedOrder, newField.name);
    if (!oldField) {
      allFieldsWithPreservedOrder.push(newField);
    }
  });

  return allFieldsWithPreservedOrder;
}

function findNestedRecord(field) {
  if (field.type && field.type.type === 'record') {
    return field.type;
  }

  if (field.type && Array.isArray(field.type)) {
    return field.type.find(type => type.type === 'record');
  }

  return undefined;
}

function reOrderFieldsWithRecursion(oldFields, newFields) {
  newFields.forEach((newField) => {
    const newNestedRecord = findNestedRecord(newField);
    if (newNestedRecord) {
      const oldField = findField(oldFields, newField.name);
      if (oldField) {
        const oldNestedRecord = findNestedRecord(oldField);
        if (oldNestedRecord) {
          newNestedRecord.fields = reOrderFieldsWithRecursion(oldNestedRecord.fields,
            newNestedRecord.fields);
        }
      }
    }
  });

  // Re-order this level of fields
  return reOrderFields(oldFields, newFields);
}

function maintainOrderOfFields(oldAvsc, newAvsc) {
  // Will clone the new avsc so not modifying the source - don't really need to be efficient here :D
  const cloned = JSON.parse(JSON.stringify(newAvsc));
  cloned.fields = reOrderFieldsWithRecursion(oldAvsc.fields, cloned.fields);
  return cloned;
}

module.exports = maintainOrderOfFields;
