import google.auth
import google.oauth2.id_token

import requests


def generate_id_token(service_account_email, target_audience):
    '''
        Creates a OIDC token for the given service account and audience.
        Inspired by https://github.com/insidepetroleum/main-combocurve/blob/95191f5258e5606cdb18ab9eb85ed2b45a55faff/apps/combocurve-cli/utils/google/auth.mjs#L19

        Note: This won't work when GOOGLE_APPLICATION_CREDENTIALS is set to a JSON file.
    '''
    credentials, _ = google.auth.default()
    auth_req = google.auth.transport.requests.Request()
    credentials.refresh(auth_req)

    response = requests.post(
        f'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/{service_account_email}:generateIdToken',
        headers={
            'Authorization': f'Bearer {credentials.token}',
            'Content-Type': 'application/json'
        },
        json={'audience': target_audience})

    if response.status_code == 200:
        id_token = response.json().get('token')
        return id_token
    else:
        raise Exception('ID token generation failed: ' + response.text)


def get_auth_token(service_url):
    '''
        Uses the default service account to generate a token valid to call `service_url`.
        Based on https://cloud.google.com/functions/docs/securing/authenticating#generating_tokens_programmatically.
    '''
    auth_req = google.auth.transport.requests.Request()
    return google.oauth2.id_token.fetch_id_token(auth_req, service_url)


def get_auth_headers(service_url):
    '''
        Use as replacement for https://github.com/insidepetroleum/combocurve-utils-py/blob/master/utils/cloud_caller.py
    '''
    id_token = get_auth_token(service_url)

    return {'Authorization': f'Bearer {id_token}'}


def get_credentials_with_token():
    '''
        Uses the default service account to generate an `IDTokenCredentials` instance with a fresh token.
        Based on https://stackoverflow.com/a/64245028/5003820
    '''
    credentials, _ = google.auth.default()
    auth_req = google.auth.transport.requests.Request()
    credentials.refresh(auth_req)
    return credentials
