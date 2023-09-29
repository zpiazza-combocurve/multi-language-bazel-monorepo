from flask import jsonify

from combocurve.shared.shared_db_info import get_shared_db_tenant_info
from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID
from combocurve.utils.routes import log_cloud_function_crashes
from combocurve.utils.shared_database import open_connection
from cloud_functions.warmup_manager.context import WarmupManagerContext


@log_cloud_function_crashes
def handle(request, **kwargs):
    shared_db_info = get_shared_db_tenant_info(GCP_PRIMARY_PROJECT_ID)

    with open_connection(shared_db_info) as db:
        context = WarmupManagerContext(db)
        context.warmup_manager_service.warmup()

    return jsonify({'message': 'Warmup performed'}), 200
