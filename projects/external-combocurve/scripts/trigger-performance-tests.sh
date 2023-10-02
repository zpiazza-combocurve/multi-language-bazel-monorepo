#!/bin/bash

if [ -z "$1" ]
    then
        echo "ERROR: Argument 1 (ENV) is required"
        exit 1
    else
        ENV=$1
fi

cd ./test && gcloud builds submit ./ \
    --config=./performance/cloudbuild.yaml \
    --ignore-file=./.gcloudignore.performance \
    --substitutions _ENV="$ENV" \
    --format=yaml \
    --async
