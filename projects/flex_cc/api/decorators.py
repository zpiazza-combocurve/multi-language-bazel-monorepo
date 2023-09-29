from functools import wraps

from flask import request

from combocurve.utils.tenant import get_tenant_info
from api.context_provider import context_provider
from combocurve.shared.contexts import current_context


def with_context(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        tenant_info = get_tenant_info(request.headers)
        context = context_provider.get_context(tenant_info)
        current_context.set(context)
        return func(*args, **kwargs, context=context)

    return wrapper
