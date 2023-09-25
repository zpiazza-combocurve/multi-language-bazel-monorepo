from combocurve.utils.tenant import TENANT_HEADER_MAPPINGS


def rearrange_environment_headers(headers):
    return {
        key: value
        for key, value in headers.items() if key.lower() in [pair[1].lower() for pair in TENANT_HEADER_MAPPINGS]
    }
