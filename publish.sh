#!/usr/bin/env bash

set -e

echo "Checking to see if should publish artifacts (version has incremented)..."
. version.sh

if [ "$IS_NEWER_VERSION" == true ]; then
    echo "Version in package.json has been updated. Starting a new release..."

    if [[ -e ${ARTIFACTORY_NPMRC} && ! -z ${ARTIFACTORY_REGISTRY} ]]; then
        echo "Publishing artifacts to additional NPM registry..."
        current_npm_config=${npm_config_userconfig}
        export npm_config_userconfig=${ARTIFACTORY_NPMRC}
        npm publish --registry $ARTIFACTORY_REGISTRY || { echo "Failed publishing npm module to Artifactory."; exit 1; }
        export npm_config_userconfig=${current_npm_config}
    fi

    echo "Tagging release in GitHub..."
    git tag -a "v${PACKAGE_VERSION}" -m "Released: $(date)"
    git push origin "v${PACKAGE_VERSION}"

    echo "Version $PACKAGE_VERSION has been released."

fi
