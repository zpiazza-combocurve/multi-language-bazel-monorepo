#!/bin/bash

if [ -z "$1" ]
    then
        echo "ERROR: Argument 1 (keys_project_id) is required"
        exit 1
    else
        keys_project_id=$1
fi

mv ./deploy/known_hosts /root/.ssh/known_hosts || exit 1
mv ./deploy/config /root/.ssh/config || exit 1

. ./deploy/decrypt.sh $keys_project_id combocurve-utils-js-key /root/.ssh/id_rsa_combocurve_utils || exit 1
. ./deploy/decrypt.sh $keys_project_id external-combocurve-docs-key /root/.ssh/id_rsa_external_combocurve_docs || exit 1
