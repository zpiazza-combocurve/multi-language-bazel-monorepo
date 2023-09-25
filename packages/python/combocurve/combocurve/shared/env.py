'''
    Environment configuration that is shared across all runtimes.
    The goal is provide one intuitive way to access essential configuration regardless of the runtime.
    This tries to replace `config.py`, which contain service and runtime specific configuration.
    All env variables expected here must be set when the service using this module is deployed.
'''
import os

REGION = os.environ.get("REGION")

GCP_REGIONAL_PROJECT_ID = os.environ.get("GCP_REGIONAL_PROJECT_ID")

GCP_PRIMARY_PROJECT_ID = os.environ.get("GCP_PRIMARY_PROJECT_ID")
