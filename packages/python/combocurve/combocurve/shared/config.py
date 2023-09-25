import os

ENVIRONMENT = os.environ.get("FLASK_ENV")

MAIN_URL = os.environ.get("MAIN_URL", None)
CF_URL = os.environ.get("CF_URL", None)
MIGRATE_CF_URL = os.environ.get("MIGRATE_CF_URL", None)
COPY_CLOUD_RUN_URL = os.environ.get("COPY_CLOUD_RUN_URL", None)
MERGE_PDF_CLOUD_RUN_URL = os.environ.get("MERGE_PDF_CLOUD_RUN_URL", None)
ECON_CSV_EXPORT_CLOUD_RUN_URL = os.environ.get("ECON_CSV_EXPORT_CLOUD_RUN_URL", None)
JOBS_API_CLOUD_RUN_URL = os.environ.get("JOBS_API_CLOUD_RUN_URL", None)

DI_WELL_PRODUCTION_DETAILS = "well-production-details"
DI_WELL_ROLLUPS = "well-rollups"
