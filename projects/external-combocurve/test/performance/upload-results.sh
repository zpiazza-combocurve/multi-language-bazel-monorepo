#!/bin/bash

if [ -z "$1" ]
    then
        echo "ERROR: Argument 1 (test_name) is required"
        exit 1
    else
        test_name=$1
fi

environment=${2:-$ENV}

date=$(date '+%Y-%m-%d')
time=$(date '+%H:%M')

url="gs://$environment-combocurve-external-api-performance/reports/$date/$time/$test_name"

echo Uploading to "$url" ...
gsutil cp -r report "$url"
