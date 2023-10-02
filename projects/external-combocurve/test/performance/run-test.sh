#!/bin/bash

if [ -z "$1" ]
    then
        echo "ERROR: Argument 1 (test_name) is required"
        exit 1
    else
        test_name=$1
fi

environment=${2:-$ENV}

npm run performance -- ./v1/"$test_name"/load.yaml -e "$environment" || exit 1
npm run performance:report
