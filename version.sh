#!/usr/bin/env bash

PACKAGE_NAME=`node -pe 'JSON.parse(process.argv[1]).name' "$(cat package.json)"`
if [ $? -ne 0 ]; then
    echo "Error determining package name"
    exit 1
fi

PUBLISHED_VERSION=`npm view ${PACKAGE_NAME} version`
if [ $? -ne 0 ]; then
    echo "Error determining currently published version"
    exit 1
fi

PACKAGE_VERSION=`node -pe 'JSON.parse(process.argv[1]).version' "$(cat package.json)"`
if [ $? -ne 0 ]; then
    echo "Error determining package version"
    exit 1
fi

IS_NEWER_VERSION=`node -pe 'require("semver").lt(process.argv[1], process.argv[2])' $PUBLISHED_VERSION $PACKAGE_VERSION`
if [ $? -ne 0 ]; then
    echo "Error comparing package version with currently published version"
    exit 1
fi

if [ "$IS_NEWER_VERSION" != "true" ]; then
    echo "FAILED! The version is same as (or older than) last release ($PUBLISHED_VERSION >= $PACKAGE_VERSION) :("
    echo "Update 'package.json' with the appropriate major/minor version"
#    exit 1
fi
