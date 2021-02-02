#!/usr/bin/env bash

set -e

ENV=$1

echo "Installing dependencies..."
npm install

echo "Running tests..."
npm test


echo "Build successful"
