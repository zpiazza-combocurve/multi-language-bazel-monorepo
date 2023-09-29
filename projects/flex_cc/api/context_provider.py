from api.context import Context
from combocurve.shared.contexts import current_context
from combocurve.utils.tenant_info import TenantInfo


class ContextProvider:
    def __init__(self):
        self._cached = {}

    def get_context(self, tenant_info: TenantInfo):
        tenant_key = tenant_info['db_connection_string']

        if tenant_key in self._cached:
            cached_context = self._cached[tenant_key]
            current_context.set(cached_context)
            return cached_context
        else:
            new_context = Context(tenant_info)
            self._cached[tenant_key] = new_context
            current_context.set(new_context)
            return new_context


context_provider = ContextProvider()
