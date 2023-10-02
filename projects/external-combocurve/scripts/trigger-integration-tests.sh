#!/bin/bash

if [ -z "$1" ]
    then
        echo "ERROR: Argument 1 (API_URL) is required"
        exit 1
    else
        API_URL=$1
fi

if [ -z "$2" ]
    then
        echo "ERROR: Argument 2 (TENANT_NAME) is required"
        exit 1
    else
        TENANT_NAME=$2
fi

cd ./test && gcloud builds submit ./ \
    --config=./integration/cloudbuild.yaml \
    --ignore-file=./.gcloudignore.integration \
    --substitutions _API_URL="$API_URL",_TENANT_NAME="$TENANT_NAME" \
    --format=yaml
