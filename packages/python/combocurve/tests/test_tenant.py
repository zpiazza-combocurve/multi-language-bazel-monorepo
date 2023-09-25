from .tenant import get_tenant_info
import pytest


@pytest.mark.unittest
def test_get_tenant_info():
    headers = {'subdomain': 'test', 'inpt-db-name': 'dev'}

    tenant_info = get_tenant_info(headers)

    assert tenant_info['subdomain'] == 'test'
    assert tenant_info['db_name'] == 'dev'
