import pytest
import datetime

from combocurve.shared.contexts import current_context


@pytest.fixture
def dates_dict():
    return {
        "first_production_date": datetime.date(2020, 1, 1),
        "cf_start_date": datetime.date(2020, 1, 30),
        "cf_end_date": datetime.date(2024, 1, 30),
    }


class TestContext():
    def __init__(self, tenant_info):
        self.tenant_info = tenant_info


@pytest.fixture(autouse=True, scope="module")
def add_tenant_info_to_context():
    current_context.set(TestContext({"subdomain": "test"}))
