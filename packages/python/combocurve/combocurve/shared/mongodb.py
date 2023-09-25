from urllib.parse import quote, urlencode


def build_connection_string(username: str, password: str, cluster: str, database: str, params: dict = None):
    encoded_user = quote(username)
    encoded_password = quote(password)

    url = f'mongodb+srv://{encoded_user}:{encoded_password}@{cluster}/{database}'

    if params is None:
        return url
    encoded_params = urlencode(params)
    return f'{url}?{encoded_params}'
