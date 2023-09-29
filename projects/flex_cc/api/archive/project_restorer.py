from functools import partial
import logging
import time
from datetime import datetime
from typing import List, Mapping, Optional
from concurrent.futures import ThreadPoolExecutor

from bson import ObjectId

from api.archive.abstract_progress_event_receiver import AbstractProgressEventReceiver, get_progress_name
from api.archive.collection_id_mappings import CollectionIdMappings
from api.archive.project_updater import ProjectUpdater
from api.archive.utils import (get_ids_file_name, get_docs_file_name, get_archive_extra_file_name,
                               make_archive_cf_request, make_migrate_cf_request, get_econ_file_names, FILES_BATCH_SIZE,
                               make_cloud_run_request)
from combocurve.shared.config import COPY_CLOUD_RUN_URL
from combocurve.models.access_policy import ResourceType, MemberType, PROJECT_ADMIN_ROLE
from combocurve.models.archived_project import ARCHIVE_PROJECT_VERSIONS
from combocurve.services.archive_store_service import ArchiveStoreService
from combocurve.shared.db_context import DbContext
from combocurve.utils.db_info import DbInfo
from combocurve.shared.error_helpers import execute_all
from combocurve.shared.gcp_buckets import GCPBuckets
from combocurve.shared.helpers import split_in_chunks
from combocurve.shared.debugging.timings import timeit_context


def _generate_temporary_db_name(db, archived_project_id):
    timestamp = int(time.time())  # seconds since epoch
    return f'{db.name}_copy_{archived_project_id}_{timestamp}'


PRODUCTION_COLLECTIONS = ['daily-productions', 'monthly-productions']
COLLECTIONS = [
    'assumptions',
    'deterministic-forecast-datas',
    'econ-runs',
    'econ-groups',
    'econ-report-export-configurations',
    'econ-report-export-default-user-configurations',
    'econ-runs-datas',
    'embedded-lookup-tables',
    'facilities',
    'filters',
    'forecast-buckets',
    'forecast-datas',
    'forecast-lookup-tables',
    'forecast-well-assignments',
    'forecasts',
    'ghg-runs',
    'lookup-tables',
    'networks',
    'project-custom-headers',
    'project-custom-headers-datas',
    'projects',
    'proximity-forecast-datas',
    'scen-roll-up-runs',
    'scenario-well-assignments',
    'scenarios',
    'schedule-constructions',
    'schedule-input-qualifiers',
    'schedule-settings',
    'schedule-well-outputs',
    'schedules',
    'shapefiles',
    'type-curve-fits',
    'type-curve-normalization-wells',
    'type-curve-normalizations',
    'type-curve-umbrellas',
    'type-curve-well-assignments',
    'type-curves',
    'well-directional-surveys',
    'wells',
]

WITH_PRODUCTION_DATA_COLLECTIONS = COLLECTIONS + PRODUCTION_COLLECTIONS


class ProjectRestorer:
    """Restores a project with id=archived_project_id from db_context

    Loads the serialized project's files from gcp_buckets['archive_storage_directory'] in a temporary db
    Migrates the temporary db
    Moves the documents from the temporary db to their respective collections in context"""
    # project restorer
    @staticmethod
    def _get_timestamp_fields():
        now = datetime.utcnow()
        return {"createdAt": now, "updatedAt": now}

    @staticmethod
    def _get_new_ids(mapping: Mapping[ObjectId, ObjectId]) -> List[ObjectId]:
        return [] if mapping is None else list(mapping.values())

    @staticmethod
    def _get_old_ids(mapping: Mapping[ObjectId, ObjectId]) -> List[ObjectId]:
        return [] if mapping is None else list(mapping.keys())

    def __init__(self,
                 db_context: DbContext,
                 gcp_buckets: GCPBuckets,
                 context,
                 archived_project_id: str,
                 user_id: str,
                 progress_event_receiver: AbstractProgressEventReceiver,
                 restore_to_version: str,
                 new_project_name: Optional[str] = None):
        self.db_context = db_context
        self.gcp_buckets = gcp_buckets
        self.context = context
        self.archived_project_id = archived_project_id
        self.new_project_name = new_project_name
        self.user_id = user_id
        self.progress_event_receiver = progress_event_receiver
        self.restore_to_version = restore_to_version

        self.archive_store_service = ArchiveStoreService(context.google_services.storage_client, self.gcp_buckets)

        self.temporary_db_name = _generate_temporary_db_name(context.db, archived_project_id)

        self.archived_project = None
        self.collection_names = []

        self.file_names = []

    def restore(self):
        self._get_archived_project()

        self.progress_event_receiver.init(self.archived_project.projectName)

        try:
            self._create_id_mappings()
            self._restore_collections()
            self._restore_files()
            self._migrate_temporary_db()
            self._update_collections()
            self._create_project_access_policies()
            self._copy_temporary_db_to_destination_db()

            self._apply_versions()
        except Exception as e:
            # https://stackoverflow.com/questions/62551488/why-does-flake8-say-undefined-name-for-something-i-defined-in-an-as-block
            # flake8 gets confused without this
            error = e
            execute_all([self.cleanup, lambda: self.progress_event_receiver.error(error)])
            raise error
        finally:
            # TODO: SIMILAR SHOULD BE DONE FOR THE DAL DATA IN CASE RESTORE FAILS
            self._drop_temporary_db()

        self._send_final_notification()

        return self.id_mappings.projects[self.archived_project.projectId]

    def _get_archived_project(self):
        self.archived_project = self.db_context.archived_project_model.objects.get(
            id=ObjectId(self.archived_project_id))

        if 'version' not in self.archived_project:
            self.archived_project['version'] = None

        if self.archived_project.version == ARCHIVE_PROJECT_VERSIONS['V_2']:
            self.collection_names = COLLECTIONS
        else:
            self.collection_names = WITH_PRODUCTION_DATA_COLLECTIONS

    def _create_id_mappings(self):
        self.id_mappings = CollectionIdMappings(self.db_context, self.archived_project, self.archive_store_service)
        self.progress_event_receiver.progress(get_progress_name('restore', 'ids'), 1)

    def _restore_collections(self):
        collection_names_to_restore = self.collection_names + ['migrations']

        for collection_name in collection_names_to_restore:
            self._restore_collection(collection_name)

    def _update_collections(self):
        # here we use the temporary db as db_context
        temporary_db_context = DbContext(self._temporary_db_info())
        project_updater = ProjectUpdater(temporary_db_context, self.gcp_buckets, self.context, self.archived_project,
                                         self.id_mappings, self.temporary_db_name, self.progress_event_receiver,
                                         self.user_id, self.new_project_name)
        self.new_project_name = project_updater.update()

    def _create_project_access_policies(self):
        logging.info('Creating access-policies')
        # here we use the temporary db as db_context
        temporary_db_context = DbContext(self._temporary_db_info())

        # add project admin role
        temporary_db_context.access_policy_model.objects(
            resourceType=ResourceType.project.value,
            resourceId=self.id_mappings.projects[self.archived_project.projectId],
            memberType=MemberType.users.value,
            memberId=ObjectId(self.user_id)).update_one(set__roles=[PROJECT_ADMIN_ROLE], upsert=True)

    def _temporary_db_info(self) -> DbInfo:
        # we are going to use the db info from context but we could also use the one from db_context
        # from the shareable codes standpoint this means:
        # context: user importing the project
        # db_context: user the project belongs to
        return {
            'db_cluster': self.context.db_info['db_cluster'],
            'db_connection_string': self.context.db_info['db_connection_string'],
            'db_name': self.temporary_db_name,
            'db_password': self.context.db_info['db_password'],
            'db_username': self.context.db_info['db_username']
        }

    def _migrate_temporary_db(self):
        with timeit_context('Migrate temporary DB'):
            temporary_db_info = self._temporary_db_info()

            body = {
                'dbConnectionString': temporary_db_info['db_connection_string'],
                'dbName': temporary_db_info['db_name']
            }

        make_migrate_cf_request(body)

    def _copy_temporary_db_to_destination_db(self):
        collection_names_to_copy = self.collection_names + ['access-policies']

        if self.archived_project.version == ARCHIVE_PROJECT_VERSIONS[
                'V_1'] and self.restore_to_version == ARCHIVE_PROJECT_VERSIONS['V_2']:
            collection_names_to_copy = [
                collection_name for collection_name in collection_names_to_copy
                if collection_name not in PRODUCTION_COLLECTIONS
            ]

        for collection_name in collection_names_to_copy:
            with timeit_context(f'Copying collection {collection_name}'):

                make_cloud_run_request(
                    COPY_CLOUD_RUN_URL, {
                        'username': self.context.db_info['db_username'],
                        'password': self.context.db_info['db_password'],
                        'cluster': self.context.db_info['db_cluster'],
                        'fromDb': self.temporary_db_name,
                        'toDb': self.context.db_info['db_name'],
                        'collection': collection_name
                    })

                self.progress_event_receiver.progress(get_progress_name('copy', collection_name), 1)

    def _apply_versions(self):
        # original version, no need to apply anything
        if self.restore_to_version == ARCHIVE_PROJECT_VERSIONS['V_1']:
            return

        self._apply_v2_restore()
        if self.restore_to_version == ARCHIVE_PROJECT_VERSIONS['V_2']:
            return

        # below is example of how to apply future versions
        # self._apply_v3_restore()
        # if self.restore_to_version == ARCHIVE_PROJECT_VERSIONS['V_3']:
        #     return

        # self._apply_v4_restore()
        # if self.restore_to_version == ARCHIVE_PROJECT_VERSIONS['V_4']:
        #     return

    def _apply_v2_restore(self):
        if self.archived_project.version == ARCHIVE_PROJECT_VERSIONS['V_1']:
            self._restore_v1_production_data_to_dal()
        else:
            self._restore_dal_production_data('monthly-productions')
            self._restore_dal_production_data('daily-productions')

    def _drop_temporary_db(self):
        db_name = self.temporary_db_name

        # double check db_name
        if db_name.startswith(f'{self.context.db.name}_copy_{self.archived_project_id}'):
            self.context.db.client.drop_database(db_name)

    def _send_final_notification(self):
        restored_project_id = self.id_mappings.projects[self.archived_project.projectId]

        self.progress_event_receiver.end({
            'restored_project_id': restored_project_id,
            'new_project_name': self.new_project_name,
            'archived_project_name': self.archived_project.projectName,
            'archived_version_name': self.archived_project.versionName
        })

    def _delete_files(self, file_names, bucket_name):
        self.archive_store_service.delete_gcs_files(file_names, bucket_name)

    def cleanup(self):
        self._delete_files(self.file_names, self.gcp_buckets['econ_storage_bucket'])

    def _call_restore_cf(self, collection_name: str, file_name: str):
        body = {
            'operation': 'restore',
            'gcp_buckets': self.gcp_buckets,
            'db_info': self._temporary_db_info(),
            'fileName': file_name,
            'collection': collection_name,
        }

        make_archive_cf_request(body=body, headers=self.context.headers)

    def _call_restore_dal_production_data_from_v1_cf(self, collection_name: str):

        body = {
            'operation': 'restore-production-dal-from-v1',
            'collectionName': collection_name,
            'tmpDbInfo': self._temporary_db_info(),
            'gcp_buckets': self.gcp_buckets,
        }

        make_archive_cf_request(body=body, headers=self.context.headers)

    def _call_restore_dal_production_data_cf(self, collection_name: str, file_name: str):
        restored_project_id = str(self.id_mappings.projects[self.archived_project.projectId])
        original_well_id_from_file_name = ObjectId(file_name.split('_').pop())
        restored_well_id = str(self.id_mappings.wells[original_well_id_from_file_name])

        body = {
            'operation': 'restore-production-dal',
            'gcp_buckets': self.gcp_buckets,
            'fileName': file_name,
            'collectionName': collection_name,
            'restoredProjectId': restored_project_id,
            'restoredWellId': restored_well_id
        }

        make_archive_cf_request(body=body, headers=self.context.headers)

    def _call_restore_files_cf(self, target_bucket_name: str, file_names_mapping=None):
        if file_names_mapping is None:
            file_names_mapping = {}

        body = {
            'operation': 'restore_files',
            'gcp_buckets': self.gcp_buckets,
            'targetBucketName': target_bucket_name,
            'fileNamesMapping': file_names_mapping
        }

        make_archive_cf_request(body=body, headers=self.context.headers)

    def _restore_collection(self, collection_name: str):
        # here we use the temporary db as db_context
        temporary_db_context = DbContext(self._temporary_db_info())
        self._create_indexes_for_tmp_db(collection_name, temporary_db_context)

        with timeit_context(f'Restore collection {collection_name}'):
            files_prefix = get_docs_file_name(self.archived_project.storageDirectory, collection_name)
            ids_file_name = get_ids_file_name(self.archived_project.storageDirectory, collection_name)

            doc_files = list(self.archive_store_service.list_files(files_prefix, exclude={ids_file_name}))

            if doc_files:
                restore_fn = partial(self._call_restore_cf, collection_name)

                with ThreadPoolExecutor(max_workers=20) as executor:
                    list(executor.map(restore_fn, doc_files))

            self.progress_event_receiver.progress(get_progress_name('restore', collection_name), 1)

    def _create_indexes_for_tmp_db(self, collection_name: str, temporary_db_context: DbContext):
        collection_indexes = self.db_context.db[collection_name].index_information()

        for index_name in collection_indexes:
            if index_name == '_id_':
                continue

            index_info = collection_indexes[index_name]
            temporary_db_context.db[collection_name].create_index(index_info['key'],
                                                                  name=index_name,
                                                                  unique=index_info.get('unique', False))

    def _restore_v1_production_data_to_dal(self):
        with timeit_context('Restore v1 production data to DAL (monthly)'):
            self._call_restore_dal_production_data_from_v1_cf('monthly-productions')
            self.progress_event_receiver.progress(get_progress_name('restore', 'monthly-productions'), 1)

        with timeit_context('Restore v1 production data to DAL (daily)'):
            self._call_restore_dal_production_data_from_v1_cf('daily-productions')
            self.progress_event_receiver.progress(get_progress_name('restore', 'daily-productions'), 1)

    def _restore_dal_production_data(self, collection_name: str):
        with timeit_context(f'Restore {collection_name} DAL'):
            files_prefix = get_docs_file_name(self.archived_project.storageDirectory, collection_name)

            files = list(self.archive_store_service.list_files(files_prefix))

            if files:
                restore_fn = partial(self._call_restore_dal_production_data_cf, collection_name)

                with ThreadPoolExecutor(max_workers=20) as executor:
                    list(executor.map(restore_fn, files))

            self.progress_event_receiver.progress(get_progress_name('restore', collection_name), 1)

    def _restore_files(self):
        storage_directory = self.archived_project.storageDirectory
        file_groups = (zip(get_econ_file_names(old_id), get_econ_file_names(new_id))
                       for old_id, new_id in self.id_mappings.econ_runs.items())
        file_name_pairs = [(get_archive_extra_file_name(storage_directory, old_file_name), new_file_name)
                           for file_group in file_groups for old_file_name, new_file_name in file_group]

        for batch in split_in_chunks(file_name_pairs, FILES_BATCH_SIZE):
            file_names_mapping = {old_file_name: new_file_name for old_file_name, new_file_name in batch}
            self._call_restore_files_cf(self.context.econ_bucket, file_names_mapping)

            new_files = list(file_names_mapping.values())
            self.file_names.extend(new_files)
            self.progress_event_receiver.progress(get_progress_name('restore', 'files'),
                                                  len(batch) / len(file_name_pairs))

        if not file_name_pairs:
            self.progress_event_receiver.progress(get_progress_name('restore', 'files'), 1)
