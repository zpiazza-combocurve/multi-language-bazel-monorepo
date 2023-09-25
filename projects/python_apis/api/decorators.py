from functools import wraps
from flask import request

from combocurve.shared.contexts import current_context
from combocurve.utils.tenant import get_tenant_info
from api.context import context_provider


def with_api_context(handler):
    '''
        A decorator to pass a context instance to an App Engine route handler
    '''
    @wraps(handler)
    def decorated(**kwargs):
        tenant_info = get_tenant_info(request.headers)
        context = context_provider.get_context(tenant_info)
        current_context.set(context)
        return handler(context=context, **kwargs)

    return decorated
