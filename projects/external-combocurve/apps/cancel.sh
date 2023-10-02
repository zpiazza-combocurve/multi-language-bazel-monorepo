#!/bin/bash

# cancel ongoing deploy builds for the given product + service within the current project
builds=$(gcloud builds list \
				--project="$PROJECT_ID" \
				--filter="id!=$CURRENT_BUILD_ID AND tags=$PRODUCT_TAG AND tags=$SERVICE_NAME AND tags=deploy" \
				--format="value[terminator=' '](id)" \
				--ongoing
				)

for build in $builds; do
	gcloud builds cancel "$build" \
		   --project "$PROJECT_ID"
done
