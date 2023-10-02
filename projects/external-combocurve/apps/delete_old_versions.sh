versions=$(gcloud app versions list \
				  --service "$SERVICE" \
				  --project "$PROJECT" \
				  --sort-by '~version' \
				  --filter "version.servingStatus:STOPPED" \
				  --format 'value(VERSION.ID)' | sed 1,10d)

for version in $versions; do
	gcloud app versions delete "$version" \
		   --service "$SERVICE" \
		   --project "$PROJECT" \
		   --quiet
done
