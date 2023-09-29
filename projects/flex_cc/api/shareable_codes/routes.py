from combocurve.utils.routes import complete_routing
from flask import Blueprint, request

from threading import Thread

from api.decorators import with_context
from combocurve.utils.db_info import DbInfo
from combocurve.shared.gcp_buckets import GCPBuckets
from combocurve.shared.helpers import jsonify
from combocurve.shared.requests import extract_parameters

shareable_codes = Blueprint('shareable-codes', __name__)


@shareable_codes.route('/import-project', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def import_project(context):
    body = request.json

    [origin_db_info_params, origin_bucket_params, project_id, name, user_id, notification_id,
     archive_version] = extract_parameters(
         body, ['originDbInfo', 'originBuckets', 'projectId', 'name', 'user', 'notificationId', 'archiveVersion'],
         required=True)
    [archived_project_id] = extract_parameters(body, ['archivedProjectId'])

    origin_db_info: DbInfo = {
        'db_cluster': origin_db_info_params['dbCluster'],
        'db_connection_string': origin_db_info_params['dbConnectionString'],
        'db_name': origin_db_info_params['dbName'],
        'db_password': origin_db_info_params['dbPassword'],
        'db_username': origin_db_info_params['dbUsername']
    }

    origin_buckets: GCPBuckets = {
        'file_storage_bucket': origin_bucket_params['fileStorageBucket'],
        'batch_storage_bucket': origin_bucket_params['batchStorageBucket'],
        'econ_storage_bucket': origin_bucket_params['econStorageBucket'],
        'archive_storage_bucket': origin_bucket_params['archiveStorageBucket']
    }

    thread = Thread(target=context.shareable_code_service.import_project,
                    args=(origin_db_info, origin_buckets, project_id, name, user_id, notification_id, archive_version,
                          archived_project_id))

    thread.start()

    return 'Import started'
