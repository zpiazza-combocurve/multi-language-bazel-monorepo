from collections.abc import Sequence, Iterable
from hashlib import md5
from json import dumps, loads
from typing import Any, Callable, Dict, Hashable, Optional, TYPE_CHECKING

from redis.exceptions import ConnectionError

from combocurve.shared.redis_client import RedisClient
from combocurve.shared.serialization import make_serializable

if TYPE_CHECKING:
    from api.context import APIContext

THREE_HOUR_EXPIRATION = 60 * 60 * 3


class DataCacheService:
    def __init__(self, context: 'APIContext'):
        self.context = context
        self.redis_client = RedisClient(host=self.context.tenant_info['redis_host'],
                                        port=self.context.tenant_info['redis_port']).client

    def set(self, key: str, value: Any, overwrite_if_exists: bool = True, expiration: int = THREE_HOUR_EXPIRATION):
        '''
        Adds a key/value pair to the cache.

        Args:
            key (str): The key.
            value (Any): The value.
            overwrite_if_exists (bool): Should we overwrite an already-cached value?
            expiration (int): How long should we cache the key/value for (in seconds)?

        Returns:
            None
        '''
        val = dumps(make_serializable(value))
        try:
            self.redis_client.set(key, val, nx=(not overwrite_if_exists), ex=expiration)
        except ConnectionError:
            pass

    def safe_get(
        self,
        key: str,
        failed_callback: Optional[Callable] = None,
        callback_args: Optional[Iterable] = [],
        callback_kwargs: Optional[Dict] = {},
    ) -> Any:
        '''
        Gets a value from the cache.  If no value exists for `key`, generate the result using
        `failed_callback`, and cache that result.

        Args:
            key (str): The key.
            failed_callback (Callable): The function to be called if there is no data cached for the given key.
            callback_args (Optional[Iterable]): Positional arguments to be passed to the failed callback.
            callback_kwargs (Optional[Dict]): Keyword arguments to be passed to the failed callback.

        Returns:
            Any: The value from the cache associated with the provided key, or the value generated from
                the callback.  If a result was present in the cache, the JSON is parsed and returned.
        '''
        has_connection_error = False
        try:
            redis_result = self.redis_client.get(key)
        except ConnectionError:
            redis_result = None
            has_connection_error = True

        # Was the key found in redis?  Or do we lack a fallback?
        if (redis_result is not None) or (failed_callback is None):
            if redis_result is None:
                return None
            else:
                return loads(redis_result)

        fallback_result = failed_callback(*(callback_args if callback_args is not None else []),
                                          **(callback_kwargs if callback_kwargs is not None else {}))

        # Save result in cache
        if not has_connection_error:
            self.set(key, fallback_result)

        return fallback_result

    def create_cache_key(self, prefix: str, components: Sequence[Hashable]) -> str:
        '''
        Create a unique key for use with redis.  This can be used to determine if the value needs
        to be refreshed, similar to how react's `useMemo` works.  Components are order-sensitive

        Example:
            >>> x = create_cache_key("proximity:candidate_wells:", ['forecast1', 'forecast2'])
            >>> x
            'proximity:candidate_wells:7295966109230307291'

        A quick note about component selection.  The `Sequence`  abc will be converted to a tuple,
        and then hashed to provide an indicator if a value in `components` has changed.  Re-ordering
        the values in the sequence will also create a different key.  This can be used to determine
        when the cache should be invalidated.  In the example above, the list of candidate wells
        depends only on the selected forecasts.  Changing either of the forecasts would thus mean
        a different set of wells.

        Sorting the components ahead of time is a good idea, rather than relying on whatever order
        they are in by default.

        Note: Builtin `hash` function has a random seed applied to it, making it unsuitable for use
        in this instance.  We could write a custom hash, but md5 is old and this hash isn't used for
        security purposes.

        Args:
            prefix (str): The fixed prefix for the key.
            components (Sequence[Hashable]): A sequence of hashable objects to be turned into
                the final portion of the key.
        Returns:
            str: The final key that starts with the specified prefix, and accounts for the components.

        '''
        hash_key = md5(dumps(make_serializable(components)).encode()).hexdigest()
        final_key = prefix + hash_key
        return final_key

    def get(self, key: str) -> str:
        '''
        Gets a value from the cache using the provided `key`.  Wraps the `get` function of the redis client.

        Args:
            key (str): The key.

        Returns:
            str: the raw string value associated with the provided key.
        '''
        return self.redis_client.get(key)
