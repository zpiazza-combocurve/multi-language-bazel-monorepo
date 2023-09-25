from contextvars import ContextVar
from typing import Callable

current_context: ContextVar = ContextVar('current_context', default=None)


class FeatureFlagContext():
    def __init__(self, tenant_info):
        self.tenant_info = {'db_name': tenant_info.get('db_name')}


def with_feature_flag_context(function: Callable, tenant_info, *args):
    context = FeatureFlagContext(tenant_info)
    current_context.set(context)
    return function(*args)
