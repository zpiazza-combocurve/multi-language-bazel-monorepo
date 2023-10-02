#!/bin/bash

if [ -z "$1" ]
    then
        echo "ERROR: Argument 1 (project_id) is required"
        exit 1
    else
        project_id=$1
fi

app_yaml="./app.yaml"

cp "./deploy/$project_id/app.yaml" $app_yaml || exit 1

gcloud -q app deploy $app_yaml --project="$project_id" || exit 1

rm $app_yaml
