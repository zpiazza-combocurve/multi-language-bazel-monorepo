from functools import wraps
from .tenant import get_tenant_info
from ..shared.contexts import current_context


class _TenantContextDecorator(object):
    """
        A decorator to initialize a context before executing a cloud function request handler
    """
    def __init__(self, context_class):
        self._context_class = context_class

    def __call__(self, fn):
        @wraps(fn)
        def decorated(request, *args, **kwargs):
            tenant_info = get_tenant_info(request.headers)
            context = self._context_class(tenant_info)
            current_context.set(context)
            return fn(request, context=context, *args, **kwargs)

        return decorated


with_context = _TenantContextDecorator
