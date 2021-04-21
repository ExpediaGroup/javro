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
const dockerCompose = require('docker-compose');
const Promise = require('promise');
const requestPromise = require('request-promise-native');

const maxRetries = 60;
const delayBetweenRetriesMillis = 1000;

const DockerComposeLocal = function LocalSchemaResitry(retryCount) {
  function retryUntilSchemaRegistryHasStarted() {
    return new Promise((resolve, reject) => {
      requestPromise('http://localhost:8081/subjects').then((res) => {
        resolve(res);
      }).catch((err) => {
        if (retryCount < maxRetries) {
          setTimeout(() => {
            retryUntilSchemaRegistryHasStarted(retryCount + 1).then(() => resolve());
          }, delayBetweenRetriesMillis);
        } else {
          reject(new Error(`Schema registry didn't startup after ${maxRetries} attempts`, err));
        }
      });
    });
  }

  function startWithEmptySchemaRegistry() {
    return requestPromise('http://localhost:8081/subjects');
  }

  function verifyEmptyRegistry(html) {
    expect(html).toBe('[]');
    Promise.resolve(html);
  }

  function localSchemaRegistryExits() {
    return new Promise((resolve) => {
      requestPromise('http://localhost:8081/subjects').then((res) => {
        console.log(res);
        resolve(true);
      }).catch((error) => {
        console.log(`scheme registry is not present, creating new, error: ${error}`);
        resolve(false);
      });
    });
  }

  this.startSchemaRegistry = function startSchemaRegistry() {
    return localSchemaRegistryExits().then((res) => {
      if (!res) {
        console.log('Creating local schema registry');
        return new Promise((resolve) => {
          dockerCompose.upOne('schema-registry', {
            cwd: path.join(__dirname),
            log: true,
          }).then(() => retryUntilSchemaRegistryHasStarted(retryCount))
            .then(startWithEmptySchemaRegistry)
            .then(verifyEmptyRegistry)
            .then(() => resolve(true))
            .catch((error) => {
              console.log(`Error starting scheme registry, ${error}`);
              resolve(false);
            });
        });
      }
    });
  };

  this.destroySchemaRegistry = function destroySchemaRegistry() {
    console.log('destroying');
    return dockerCompose.down({
      cwd: path.join(__dirname),
      log: true,
    });
  };
};

module.exports = DockerComposeLocal;
