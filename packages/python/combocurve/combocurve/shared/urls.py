from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID, REGION
from combocurve.shared.config import MAIN_URL, CF_URL, MIGRATE_CF_URL


def get_main_url(subdomain):
    return MAIN_URL or f'https://{subdomain}.combocurve.com'


def get_cf_url(cf_name):
    base = CF_URL or f'https://{REGION}-{GCP_PRIMARY_PROJECT_ID}.cloudfunctions.net'
    return f'{base}/{cf_name}'


def get_migrate_cf_url():
    base = MIGRATE_CF_URL or f'https://{REGION}-{GCP_PRIMARY_PROJECT_ID}.cloudfunctions.net'
    return f'{base}/migrate'
