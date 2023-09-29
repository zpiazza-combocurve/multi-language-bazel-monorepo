import json
import logging
from typing import List, Mapping, Iterable, Callable

from bson import ObjectId
from bson.json_util import loads, dumps
from google.protobuf.json_format import MessageToDict
from combocurve.dal.types import to_field_mask, to_timestamp_from_str
from combocurve.shared.redis_client import RedisClient
from combocurve.services.archive_store_service import ArchiveStoreService
from combocurve.shared.db_context import DbContext
from combocurve.shared.doc_mapper import DocMapper
from combocurve.shared.gcp_buckets import GCPBuckets
from combocurve.shared.mongo import get_ids_query
from combocurve.dal.client import DAL
from combocurve.dal.helpers import (map_monthly_production_mongodb_doc_to_dal_upsert_records,
                                    map_daily_production_mongodb_doc_to_dal_upsert_records)


def _get_archive_file_name(files_archiving_directory: str, file_name: str):
    return f'{files_archiving_directory}/{file_name}'


class ArchiveCFService:
    def __init__(self, context: DbContext, storage_client, gcp_buckets: GCPBuckets):
        self.context = context
        self.storage_client = storage_client
        self.gcp_buckets = gcp_buckets
        self.archive_store_service = ArchiveStoreService(storage_client, gcp_buckets)
        self.extra_updates: Mapping[str, Callable[[Iterable[dict], Mapping[str, str], str], Iterable[dict]]] = {
            self.context.shapefiles_collection.name: self._update_shapefiles
        }

    def _get_collection(self, collection_name: str):
        return self.context.db[collection_name]

    def archive(self, db_context: DbContext, collection_name: str, file_name: str, ids: List[str]):
        query = get_ids_query([ObjectId(id) for id in ids])
        collection = db_context.db[collection_name]
        self.archive_store_service.store_docs_to_gcs(collection, file_name, query)
        return 'ok'

    def archive_production_dal(self, dal: DAL, collection_name: str, file_name: str, well_str_id: str):
        wells = [well_str_id]
        dal_production = dal.daily_production if collection_name == 'daily-productions' else dal.monthly_production

        response = dal_production.fetch_by_well(wells=wells)
        rows = (MessageToDict(message, preserving_proto_field_name=True) for message in response)

        self.archive_store_service.store_production_dal_rows_to_gcs(file_name, rows)
        return 'ok'

    def archive_files(self, source_bucket_name: str, files_archiving_directory: str, file_names: List[str]):
        """
        Copy files from source_storage_bucket to gcp_buckets['archive_storage_bucket']
        """
        source_storage_bucket = self.storage_client.get_bucket(source_bucket_name)
        target_archive_storage_bucket = self.storage_client.get_bucket(self.gcp_buckets['archive_storage_bucket'])

        for source_file_name in file_names:
            file_archiving_name = _get_archive_file_name(files_archiving_directory, source_file_name)
            self.archive_store_service.copy_blob(source_file_name, source_storage_bucket, file_archiving_name,
                                                 target_archive_storage_bucket)

        return 'ok'

    def restore(self, db_context: DbContext, file_name: str, collection_name: str):
        docs = self.archive_store_service.load_docs_from_gcs(file_name)
        collection = db_context.db[collection_name]
        if len(docs):
            collection.insert_many(docs)
        else:
            logging.warning(
                f'No documents to insert for collection `{collection_name}` after loading from file `{file_name}`')
        return 'ok'

    def restore_production_dal_from_v1(self, dal: DAL, tmp_db_context: DbContext, collection_name: str):

        dal_production = dal.daily_production if collection_name == 'daily-productions' else dal.monthly_production

        doc_to_records_mapper = (map_daily_production_mongodb_doc_to_dal_upsert_records if collection_name
                                 == 'daily-productions' else map_monthly_production_mongodb_doc_to_dal_upsert_records)
        collection = tmp_db_context.db[collection_name]

        def to_upsert_generator():
            for doc in collection.find().sort('_id', 1):
                doc_records_generator = doc_to_records_mapper(doc)

                for record in doc_records_generator:
                    yield dal_production.to_upsert_request(**record)

        dal_production.upsert(to_upsert_generator())

        return 'ok'

    def restore_production_dal(self, dal: DAL, restored_project_id: str, restored_well_id: str, collection_name: str,
                               file_name: str):
        rows = self.archive_store_service.load_docs_from_gcs(file_name)
        requests = []
        dal_production = dal.daily_production if collection_name == 'daily-productions' else dal.monthly_production

        for row in rows:
            row['well'] = restored_well_id

            if 'project' in row:
                row['project'] = restored_project_id if row['project'] is not None else None

            row['field_mask'] = to_field_mask(list(row.keys()))

            if 'date' in row:
                row['date'] = to_timestamp_from_str(row['date'])

            requests.append(dal_production.to_upsert_request(**row))

        if requests:
            dal_production.upsert(iter(requests))
        else:
            logging.warning(f'No rows to insert for restored well {restored_well_id} {collection_name} data '
                            f'after loading from file `{file_name}`')
        return 'ok'

    def restore_files(self, target_bucket_name: str, file_names_mapping: Mapping[str, str]):
        """
        Copy files from gcp_buckets['archive_storage_bucket'] to target_bucket_name
        """
        source_archive_storage_bucket = self.storage_client.get_bucket(self.gcp_buckets['archive_storage_bucket'])
        target_storage_bucket = self.storage_client.get_bucket(target_bucket_name)

        for source_file_name, target_file_name in file_names_mapping.items():
            self.archive_store_service.copy_blob(source_file_name, source_archive_storage_bucket, target_file_name,
                                                 target_storage_bucket)

        return 'ok'

    def update(self, db_context: DbContext, collection_name: str, temporary_db_name: str, ids: List[str],
               set_fields: Mapping[str, str], original_project_id: str, dependencies: List[str]):
        # load
        collection = db_context.db[collection_name]
        query = {'_id': {'$in': [ObjectId(id) for id in ids]}}
        docs = collection.find(query)

        redis_client = RedisClient(host=self.context.tenant_info['redis_host'],
                                   port=self.context.tenant_info['redis_port']).client
        ids_mapping = {}

        for dependency in dependencies:
            redis_key = f'archive:updater:{temporary_db_name}:{dependency}'
            collection_id_mapping = redis_client.get(redis_key)

            if collection_id_mapping:
                ids_mapping.update(json.loads(collection_id_mapping))
            else:
                logging.warning(f'No ids mapping for {collection}')

        # map
        object_ids_mapping = {ObjectId(old_id): ObjectId(new_id) for old_id, new_id in ids_mapping.items()}
        object_id_set_fields = {k: loads(v) for k, v in set_fields.items()}
        mapper = DocMapper(object_ids_mapping, object_id_set_fields, ids_mapping)
        mapped_docs = (mapper.map(d) for d in docs)

        extra_updates = self.extra_updates.get(collection_name, lambda x, *args: x)
        final_docs = list(extra_updates(mapped_docs, ids_mapping, original_project_id))

        # delete old ones
        collection.delete_many(query)

        # insert new ones
        if final_docs:
            collection.insert_many(final_docs)

        return 'ok'

    def _update_shapefiles(self, shapefile_docs: Iterable[dict], ids_mapping: Mapping[str, str],
                           original_project_id: str):
        current_count = self.context.shapefiles_collection.estimated_document_count()

        shapefiles_lst = list(shapefile_docs)

        # if there's a matching company shapefile, the archived one does not need to be inserted
        sh_ids = [d['idShapefile'] for d in shapefiles_lst]
        existing_docs = self.context.shapefiles_collection.find(
            {
                'visibility': 'company',
                'idShapefile': {
                    '$in': sh_ids
                }
            }, projection=['idShapefile'])
        existing_sh_ids = {d['idShapefile'] for d in existing_docs}
        to_update = [d for d in shapefiles_lst if d['idShapefile'] not in existing_sh_ids]

        for i, shapefile in enumerate(to_update):
            try:
                new_project_id = ids_mapping[original_project_id]
            except KeyError:
                logging.error('Error updating shapefiles: Wrong original project id, or it was not included in mapping',
                              extra={
                                  'metadata': {
                                      'shapefiles_lst': dumps(shapefiles_lst),
                                      'to_update': dumps(to_update),
                                      'shapefile': dumps(shapefile),
                                      'ids_mapping': ids_mapping,
                                      'original_project_id': original_project_id,
                                  }
                              })
                continue
            yield {
                **shapefile,
                'position': current_count + i,
                'visibility': ['project'],
                'projectIds': [new_project_id],
            }
