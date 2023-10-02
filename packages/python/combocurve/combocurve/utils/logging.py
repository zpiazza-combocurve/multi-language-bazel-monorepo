import datetime
import queue
import logging
import atexit
import os
from collections.abc import Mapping
from enum import Enum

from flask import request
from google.cloud.logging import Client as LoggingClient
from google.cloud.logging.handlers import AppEngineHandler, setup_logging
from google.cloud.logging import Resource

from combocurve.shared.env import GCP_REGIONAL_PROJECT_ID, REGION

from .tenant import get_tenant_info

_FUNCTION_PROJECT = os.environ.get('GOOGLE_CLOUD_PROJECT', default='')
_FUNCTION_NAME = os.environ.get('FUNCTION_NAME', default='')


class AppType(Enum):
    GAE_APP = 'gae_app'
    CLOUD_FUNCTION = 'cloud_function'


_logging_initialized = False


def setup_cloud_logging(logger_name, min_level=logging.INFO, app_type=AppType.GAE_APP):
    global _logging_initialized

    if _logging_initialized:
        return

    logging_client = LoggingClient()

    structured_handler = StructLogHandler(logging_client, logger_name, app_type)
    structured_logger = logging.getLogger('cloud_structured')  # dummy logger to be able to get the handler
    structured_logger.addHandler(structured_handler)

    logs_queue = queue.Queue()
    queue_handler = logging.handlers.QueueHandler(logs_queue)
    queue_listener = logging.handlers.QueueListener(logs_queue, structured_handler)
    queue_listener.start()
    atexit.register(lambda: queue_listener.stop())

    setup_logging(queue_handler, excluded_loggers=('werkzeug', ), log_level=min_level)
    root_logger = logging.getLogger()
    root_logger.handlers = [queue_handler]
    root_logger.addFilter(TenantInfoFilter())

    _logging_initialized = True


def config_tenant_logging(tenant_info, use_as_default=False, app_type=AppType.GAE_APP):
    labels = {'project': GCP_REGIONAL_PROJECT_ID, 'tenant': tenant_info['subdomain']}
    if app_type == AppType.CLOUD_FUNCTION:
        labels['execution_id'] = tenant_info['headers'].get('Function-Execution-Id', '')

    logger = logging.getLogger('cloud_structured')
    for handler in logger.handlers:
        if not isinstance(handler, StructLogHandler):
            continue
        handler.set_tenant_data(tenant_info['db_connection_string'], labels, use_as_default=use_as_default)


def add_to_logging_metadata(metadata):
    root_logger = logging.getLogger()
    metadata_filter = ExtraMetadataFilter(metadata)
    root_logger.addFilter(metadata_filter)


def reset_logging_metadata():
    root_logger = logging.getLogger()
    metadata_filters = [f for f in root_logger.filters if isinstance(f, ExtraMetadataFilter)]
    for f in metadata_filters:
        root_logger.removeFilter(f)


class TenantInfoFilter(logging.Filter):
    def filter(self, record):
        if request:
            tenant_info = get_tenant_info(request.headers)
            meta = getattr(record, 'metadata', {})
            meta['request_tenant'] = tenant_info['subdomain']
            record.tenant_info = tenant_info

        return True


class ExtraMetadataFilter(logging.Filter):
    def __init__(self, data):
        self.data = data

    def filter(self, record):
        record_metadata = getattr(record, 'metadata', {})
        record.metadata = {**record_metadata, **self.data}
        return True


class StructLogHandler(logging.Handler):
    _severity_map = {
        logging.CRITICAL: 600,
        logging.ERROR: 500,
        logging.WARNING: 400,
        logging.INFO: 200,
        logging.DEBUG: 100,
        logging.NOTSET: 0
    }

    def __init__(self, logging_client, logger_name, app_type=AppType.GAE_APP):
        super(StructLogHandler, self).__init__()

        self.logger = logging_client.logger(logger_name)

        if app_type == AppType.GAE_APP:
            app_engine_handler = AppEngineHandler(logging_client)
            self.default_resource = app_engine_handler.get_gae_resource()
            self.default_labels = app_engine_handler.get_gae_labels()
        elif app_type == AppType.CLOUD_FUNCTION:
            self.default_resource = Resource(type=app_type.value,
                                             labels={
                                                 "project_id": _FUNCTION_PROJECT,
                                                 "function_name": _FUNCTION_NAME,
                                                 "region": REGION
                                             })
            self.default_labels = {}

        self._tenant_data = {}
        self._default_tenant_data = {'labels': {}, 'extra_data': {}}

    def set_tenant_data(self, connection_string, labels, extra_data=None, use_as_default=False):
        data = {'labels': labels or {}, 'extra_data': extra_data if isinstance(extra_data, Mapping) else {}}
        self._tenant_data[connection_string] = data
        if use_as_default:
            self._default_tenant_data = data

    def _get_tenant_data(self, record):
        try:
            tenant_info = record.tenant_info
        except AttributeError:
            return self._default_tenant_data
        return self._tenant_data.get(tenant_info['db_connection_string'], self._default_tenant_data)

    def emit(self, record):
        tenant_data = self._get_tenant_data(record)

        message = self.format(record)

        current_metadata = getattr(record, 'metadata', {})
        if not isinstance(current_metadata, Mapping):
            current_metadata = {}
        metadata = {**tenant_data['extra_data'], **current_metadata}

        log_info = {'message': message, 'python_logger': record.name, 'metadata': metadata}

        extra_data = {
            'severity': self._normalize_severity(record.levelno),
            'resource': self.default_resource,
            'labels': tenant_data['labels'] or self.default_labels,
            'timestamp': datetime.datetime.utcfromtimestamp(record.created),
            'http_request': getattr(record, 'http_request', None)
        }

        self.logger.log_struct(log_info, **extra_data)

    def _normalize_severity(self, level):
        return self._severity_map[level]
