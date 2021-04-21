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

const JsonObjectToAvroRecord = function JsonSchemaToAvro(jsonSchema, allowMultipleTypes = false) {
  if (jsonSchema.type !== 'object') {
    throw new Error(`Can only convert objects to records (got type '${jsonSchema.type}')`);
  }

  function mapAnArray(nestedNamespace, key, property, jsonPropertyToAvroTypesFunc) {
    if (!property.items) {
      throw new Error(`Array for key '${key}' must specify what type its 'items' are`);
    }

    return {
      type: 'array',
      items: jsonPropertyToAvroTypesFunc(nestedNamespace, key, property.items),
    };
  }

  function jsonTypeToAvroType(nestedNamespace, key, type, property, jsonPropertyToAvroTypesFunc) {
    switch (type) {
      case 'string': return 'string';
      case 'number': return 'double';
      case 'integer': return 'long';
      case 'boolean': return 'boolean';
      case 'object': return new JsonObjectToAvroRecord(property).mapObjectToRecord(nestedNamespace, key);
      case 'array': return mapAnArray(nestedNamespace, key, property, jsonPropertyToAvroTypesFunc);
      default: throw new Error(`Can't work out what type '${type}' for key '${key}' should be in Avro`);
    }
  }

  function jsonPropertyToAvroTypes(nestedNamespace, key, property) {
    // Favor oneOf or allOf property if present if not, fall back to type parameter
    if (property.oneOf || property.allOf) {
      // flatten its nested object(s)
      const flattened = {
        type: 'object',
        properties: {},
      };
      if (property.oneOf) {
        property.oneOf.forEach((obj) => {
          Object.assign(flattened.properties, obj.properties);
        });
      }
      if (property.allOf) {
        property.allOf.forEach((obj) => {
          Object.assign(flattened.properties, obj.properties);
        });
      }
      return jsonPropertyToAvroTypes(nestedNamespace, key, flattened);
    }
    // type parameter flow
    if (property.type) {
      if (Array.isArray(property.type)) {
        if (allowMultipleTypes) {
          return property.type.map(prop => jsonTypeToAvroType(nestedNamespace, key, prop, property,
            jsonPropertyToAvroTypes));
        }
        return jsonTypeToAvroType(nestedNamespace, key, property.type[property.type.length - 1], property,
          jsonPropertyToAvroTypes);
      }
      return jsonTypeToAvroType(nestedNamespace, key, property.type, property,
        jsonPropertyToAvroTypes);
    }
    throw new Error('Unable to determine Avro type(s) for JSON Schema property '
      + `${JSON.stringify(property)} with namespace ${nestedNamespace} and key ${key}`);
  }

  function isPropertyRequired(key, required) {
    if (required) {
      return required.find(r => r === key);
    }
    return false;
  }

  function turnJsonPropertyIntoAvroField(nestedNamespace, key, property, required) {
    if (isPropertyRequired(key, required)) {
      return {
        name: key,
        type: jsonPropertyToAvroTypes(nestedNamespace, key, property),
      };
    }

    return {
      name: key,
      type: ['null'].concat(jsonPropertyToAvroTypes(nestedNamespace, key, property)),
      default: null,
    };
  }

  function turnJsonPropertiesIntoAvroFields(nestedNamespace, properties, required) {
    return Object.keys(properties).sort().map(key => turnJsonPropertyIntoAvroField(nestedNamespace,
      key, properties[key], required));
  }

  this.mapObjectToRecord = function mapObjectToRecord(namespace, name) {
    return {
      namespace,
      name,
      type: 'record',
      fields: turnJsonPropertiesIntoAvroFields(`${namespace}.${name}Package`, jsonSchema.properties, jsonSchema.required),
    };
  };
};

module.exports = JsonObjectToAvroRecord;
