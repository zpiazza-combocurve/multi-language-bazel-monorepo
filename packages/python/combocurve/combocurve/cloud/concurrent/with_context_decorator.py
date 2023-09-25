from functools import wraps

from combocurve.utils.tenant import get_tenant_info

from .context_provider import ConcurrentContextProvider


class _ConcurrentContextDecorator():
    '''
        A decorator to provide request handlers with an initialized context.

        For services with instances that handle multiple concurrent requests potentially from different tenants,
        i.e., App Engine and Cloud Run services.
        Added with the idea of DRYing similar implementations we have across our codebase.

        Based on https://github.com/insidepetroleum/combocurve-utils-py/blob/master/utils/with_context_decorator.py
    '''
    def __init__(self, context_class) -> None:
        self._context_provider = ConcurrentContextProvider(context_class)

    def __call__(self, handler):
        @wraps(handler)
        def decorated(request, *args, **kwargs):
            tenant_info = get_tenant_info(request.headers)
            context = self._context_provider.get_context(tenant_info)
            return handler(request, context=context, *args, **kwargs)

        return decorated


with_context = _ConcurrentContextDecorator
