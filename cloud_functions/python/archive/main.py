from combocurve.utils.routes import log_cloud_function_crashes

from cloud_functions.archive.archive_cf_service import ArchiveCFService
from combocurve.shared.db_context import DbContext
from cloud_functions.archive.context import ArchiveCFContext
from cloud_functions.archive.errors import InvalidArchiveOperation
from combocurve.cloud.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.shared.requests import extract_parameters


@log_cloud_function_crashes
@with_db
@with_context(ArchiveCFContext)
def handle(request, context: ArchiveCFContext):
    body = request.json

    [operation, gcp_buckets] = extract_parameters(body, ['operation', 'gcp_buckets'], required=True)

    storage_client = context.google_services.storage_client
    archive_cf_service = ArchiveCFService(context, storage_client, gcp_buckets)

    if operation == 'archive':
        params = ['db_info', 'collection', 'fileName', 'ids']
        [db_info, collection_name, file_name, ids] = extract_parameters(body, params, required=True)
        db_context = DbContext(db_info)
        return archive_cf_service.archive(db_context, collection_name, file_name, ids)

    if operation == 'archive-production-dal':
        params = ['collectionName', 'fileName', 'wellId']
        [collection_name, file_name, well_str_id] = extract_parameters(body, params, required=True)
        return archive_cf_service.archive_production_dal(context.dal, collection_name, file_name, well_str_id)

    if operation == 'archive_files':
        params = ['sourceBucketName', 'filesArchivingDirectory', 'fileNames']
        [source_bucket_name, files_archiving_directory, file_names] = extract_parameters(body, params, required=True)
        return archive_cf_service.archive_files(source_bucket_name, files_archiving_directory, file_names)

    if operation == 'restore':
        params = ['db_info', 'fileName', 'collection']
        [db_info, file_name, collection_name] = extract_parameters(body, params, required=True)
        db_context = DbContext(db_info)
        return archive_cf_service.restore(db_context, file_name, collection_name)

    if operation == 'restore-production-dal-from-v1':
        params = ['tmpDbInfo', 'collectionName']
        [tmp_db_info, collection_name] = extract_parameters(body, params, required=True)
        tmp_db_context = DbContext(tmp_db_info)
        return archive_cf_service.restore_production_dal_from_v1(context.dal, tmp_db_context, collection_name)

    if operation == 'restore-production-dal':
        params = ['restoredProjectId', 'restoredWellId', 'collectionName', 'fileName']
        [restored_project_id, restored_well_id, collection_name, file_name] = extract_parameters(body,
                                                                                                 params,
                                                                                                 required=True)
        return archive_cf_service.restore_production_dal(context.dal, restored_project_id, restored_well_id,
                                                         collection_name, file_name)

    if operation == 'restore_files':
        params = ['targetBucketName', 'fileNamesMapping']
        [target_bucket_name, file_names_mapping] = extract_parameters(body, params, required=True)
        return archive_cf_service.restore_files(target_bucket_name, file_names_mapping)

    if operation == 'update':
        params = [
            'db_info', 'collection', 'ids', 'temporary_db_name', 'set_fields', 'original_project_id', 'dependencies'
        ]
        [
            db_info,
            collection_name,
            ids,
            temporary_db_name,
            set_fields,
            original_project_id,
            dependencies,
        ] = extract_parameters(body, params, required=True)
        db_context = DbContext(db_info)
        return archive_cf_service.update(db_context, collection_name, temporary_db_name, ids, set_fields,
                                         original_project_id, dependencies)

    raise InvalidArchiveOperation(operation)
