import logging
import requests
from pusher import Pusher
from pusher.errors import PusherError
from combocurve.utils.constants import COMPANY_NOTIFICATION_UPDATE_EVENT_NAME, USER_NOTIFICATION_UPDATE_EVENT_NAME
from combocurve.utils.exceptions import get_exception_info

# Client is declared at the global state for reuse between cloud function invocation.
# https://cloud.google.com/functions/docs/bestpractices/tips#use_global_variables_to_reuse_objects_in_future_invocations
_pusher_client = None


class PusherWrapper(object):
    def __init__(self, pusher_info):
        self.app_id = pusher_info['pusher_app_id']
        self.key = pusher_info['pusher_key']
        self.secret = pusher_info['pusher_secret']
        self.cluster = pusher_info['pusher_cluster']

    def _trigger(self, channel, socket_name, data):
        global _pusher_client
        if _pusher_client is None:
            _pusher_client = Pusher(
                app_id=self.app_id,
                key=self.key,
                secret=self.secret,
                cluster=self.cluster,
                ssl=True,
            )
        try:
            res = _pusher_client.trigger(channel, socket_name, data)
            if res is None:
                logging.error(f'Error in pusher.trigger() for {channel}/{socket_name}')
            return res
        except (requests.exceptions.ReadTimeout, PusherError) as e:
            error_info = get_exception_info(e)
            logging.error(
                error_info['message'],
                extra={'metadata': {
                    'error': error_info,
                }},
            )

    def trigger_user_channel(self, tenant_name, user_id, socket_name, data):
        return self._trigger(f'private-{tenant_name}-{user_id}', socket_name, data)

    def trigger_company_channel(self, tenant_name, socket_name, data):
        return self._trigger(f'private-{tenant_name}', socket_name, data)

    def trigger_from_channel_info(self, channel_info, data):
        if channel_info['type'] == 'company':
            return self.trigger_company_channel(channel_info['tenant'], COMPANY_NOTIFICATION_UPDATE_EVENT_NAME, data)
        return self.trigger_user_channel(channel_info['tenant'], channel_info['user_id'],
                                         USER_NOTIFICATION_UPDATE_EVENT_NAME, data)


def init_pusher_client(pusher_info):
    tenant = pusher_info["subdomain"]
    pusher_app_id = pusher_info["pusher_app_id"]
    # Debug logs for issue with pusher
    print(f'Tenant: {tenant}, Pusher App Id: {pusher_app_id}')  # noqa: T001
    return PusherWrapper(pusher_info)
