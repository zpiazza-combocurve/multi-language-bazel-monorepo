class ContextProvider(object):
    def __init__(self, context_class):
        self._context_class = context_class
        self._context_cache = {}

    def get_context(self, tenant_info):
        cache_key = tenant_info['db_connection_string']
        context = self._context_cache.get(cache_key)
        if context is None:
            context = self._context_class(tenant_info)
            self._context_cache[cache_key] = context
        return context
