class ConcurrentContextProvider(object):
    '''
        Abstraction for context initialization and caching for multiple tenants.

        For services with instances that handle multiple concurrent requests potentially from different tenants,
        i.e., App Engine and Cloud Run services.
        Added with the idea of DRYing similar implementations we have across our codebase.

        Based on https://github.com/insidepetroleum/python-combocurve/blob/master/shared/context_provider.py
    '''
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
