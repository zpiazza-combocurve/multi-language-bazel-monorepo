#!/bin/bash

if [ -z "$1" ]
    then
        echo "ERROR: Argument 1 (keys_project_id) is required"
        exit 1
    else
        keys_project_id=$1
fi

if [ -z "$2" ]
    then
        echo "ERROR: Argument 2 (key_name) is required"
        exit 1
    else
        key_name=$2
fi

if [ -z "$3" ]
    then
        echo "ERROR: Argument 3 (output_file) is required"
        exit 1
    else
        output_file=$3
fi

gcloud kms decrypt \
    --ciphertext-file=./deploy/$keys_project_id/$key_name.enc \
    --plaintext-file=$output_file \
    --location=global \
    --keyring=build-keyring \
    --key=$key_name \
    --project=$keys_project_id \
    || exit 1

chmod 600 $output_file
