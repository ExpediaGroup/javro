# Javro - JSON Schema to Avro Mapper

## Overview

This library has a specific purpose to generate fully transitive (backward and forward compatible) AVSC (Avro Schema)
from source JSON Schema. The generated AVSC is intended for serialising JSON to Avro, so validation rules are not
carried over.

Here are some of its features:

* Creates an AVSC representation of a JSON Schema
* Follows JSON References used in your input JSON Schema
* Maintains fully transitive compatibility by:
    * Reading in the previously generated AVSC from
      [Confluent's Schema Registry](https://docs.confluent.io/current/schema-registry/index.html)
    * Making sure any new fields are appended to the end of the previously generated list
    * Calling Confluent's Schema Registry to perform a FULL_TRANSITIVE check on the new schema
    * Note you can do a pre-check that your JSON Schema changes are backward compatible using something like
      [json-schema-diff-validator](https://www.npmjs.com/package/json-schema-diff-validator)

Here's what it doesn't do:

* Try to carry over validation rules
    * Enums in JSON Schema are primitive fields with validation rules on what's possible to enter in that field. So
      Javro will convert 
      
      ```json
      {
        "properties": {
          "example": {
            "type": "string",
            "enum": ["Foo", "Bar"]
          }
        },
        "required": ["example"]
      }
      ```
      
      to
      
      ```json
      {
        "name": "example",
        "type": "string"
      }
      ```

### When would I want to use Javro?

Javro was designed to be used when you've got an application using JSON Schema to validate input JSON data and you then
want to feed that JSON data into an Avro data ecosystem (e.g. a Confluent Kafka world). You already know the input data
is valid, so what you need is AVSC generated from your JSON Schema and another library such as
[avsc](https://www.npmjs.com/package/avsc) or [json-avro-converter](https://github.com/allegro/json-avro-converter) to
serialise your input JSON to the Javro generated AVSC.

## Usage

It's expected that you use Javro as part of an existing JSON Schema build process.

### Add Javro as a dependency in your project

First up add Javro to your existing JSON Schema project.

```bash
npm install --save-dev javro
```

### Use Javro in your build

In your JavaScript-based build you can `require` Javro and call it as follows:

```javascript
const { jvro, SchemaRegistryAvroFetcher } = require('javro');

javro({
  // The location of your JSON Schema
  jsonSchemaFile: '/path/to/your/jsonSchemaFile.json',
  
  // The 'namespace' used in the generated AVSC - the 'name' will be taken either from the 'title' in the JSON Schema or
  // the file name if 'title' isn't present (in this case that would be 'jsonSchemaFile')
  namespace: 'your.namespace',
  
  // avroFetcher is optional - remove it if you don't care about fully transitive compatibility
  //   schemaRegistryUrl: the URL of your Confluent Schema Registry where you've registered your schema
  //   schemaSubject: the Subject you have given your schema in Confluent's Schema Registry. As per Confluent's
  //                  documentation: "A subject refers to the name under which the schema is registered".
  avroFetcher: new SchemaRegistryAvroFetcher({ schemaRegistryUrl, schemaSubject })
}).then((jsonSchemaConvertedToAvro) => {
  console.log(JSON.stringify(jsonSchemaConvertedToAvro.avsc, null, 2));
});
```

### API response

In the callback from Javro you'll get back an object that looks like this:

```json
{
  "data": {
    "isCompatible": true,
    "avsc": { ... }
  }
}
```

* `isCompatible` will contain one of `true`, `false`, or `"AVRO_FETCHER_NOT_FOUND"` depending on how `avroFetcher`
  faired
* `avsc` will contain the generated AVSC as JavaScript objects which can then be serialised using
  `JSON.stringify(avsc)`

### More Examples

There are a load of examples contained in [./test/int/](./test/int/).

### Maintaining full transitive compatibility

Javro accepts an optional `avroFetcher` which goes and gets the previous version of a generated AVSC for your schema
which allows Javro to ensure any changes are compatible. There is an implementation `SchemaRegistryAvroFetcher` which
ties into [Confluent's Schema Registry](https://docs.confluent.io/current/schema-registry/index.html) (see example
above).

If you want full transitive compatibility but aren't using Confluent's Schema Registry then you can provide your own
implementation.
 
If `avroFetcher` is not provided then Javro will return the converted AVSC without maintaining or checking for
compatibility with previous version(s).

## Contributing

Pull requests are welcome. Please refer to our [CONTRIBUTING](./CONTRIBUTING.md) file.

# Legal

This project is available under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0.html).

Copyright 2019 Expedia, Inc.
