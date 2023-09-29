import logging
import json

from combocurve.utils.exceptions import get_exception_info
from combocurve.shared.google_auth import get_auth_headers

_WARMUP_TARGET_CF = 'warmup_target'
_WARMUP_TARGET_METHOD = 'POST'
_WARMUP_TARGET_PAYLOAD = json.dumps({})


class WarmupManagerService():
    def __init__(self, context):
        self.context = context

    def warmup(self):
        queues = list(self.context.queues_collection.find({'kind': {'$ne': None}}))

        target_url = f'{self.context.cloud_functions_url}/{_WARMUP_TARGET_CF}'
        target_headers = get_auth_headers(target_url)

        for q in queues:
            queue_name = q['name']
            logging.info(f'Warming up {queue_name}')
            try:
                self.context.tasks_client.add_task(queue=queue_name,
                                                   url=target_url,
                                                   method=_WARMUP_TARGET_METHOD,
                                                   payload=_WARMUP_TARGET_PAYLOAD,
                                                   headers=target_headers)
            except Exception as e:
                logging.warn(f'Failed to warmup queue {queue_name}', extra={'error': get_exception_info(e)})
