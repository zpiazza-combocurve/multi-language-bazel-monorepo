#!/bin/bash

if [ -z "$1" ]
    then
        echo "ERROR: Argument 1 (project_prefix) is required"
        exit 1
    else
        project_prefix=$1
fi

npm --version || exit 1
npm ci || exit 1
cd node_modules/combocurve-utils || exit 1
npm pack || exit 1
mv combocurve-utils-*.tgz ../../ || exit 1
cd ../../ || exit 1
PACKAGE_NAME=combocurve-utils-*.tgz || exit 1
npm install file:`echo ${PACKAGE_NAME}` || exit 1
npm run build || exit 1
npm run spec:build "$project_prefix" includeSecurity || exit 1
npm run spec:build doc || exit 1
