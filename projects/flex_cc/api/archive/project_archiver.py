from functools import partial
import math
from datetime import datetime
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor

from bson import ObjectId
from pymongo.collection import Collection

from api.archive.abstract_progress_event_receiver import AbstractProgressEventReceiver, get_progress_name
from combocurve.services.archive_store_service import ArchiveStoreService
from combocurve.shared.error_helpers import execute_all
from combocurve.shared.debugging.timings import timeit_context
from combocurve.shared.gcp_buckets import GCPBuckets
from combocurve.shared.helpers import split_in_chunks, padded_indexes
from combocurve.shared.mongo import (get_ids_query, get_shapefile_belongs_to_project_query, get_wells_data_query,
                                     get_belongs_to_project_query, get_belongs_to_forecasts_query,
                                     get_belongs_to_type_curves_query)
from .errors import InvalidProjectError
from .utils import (generate_version_name, get_docs_file_name, get_ids_file_name, get_storage_directory,
                    make_archive_cf_request, get_econ_file_names, FILES_BATCH_SIZE)
from combocurve.shared.db_context import DbContext

PROJECT_METADATA_LIMIT = 10000


def _get_ids(collection: Collection, query) -> List[ObjectId]:
    docs = collection.find(filter=query, projection={})
    return [d['_id'] for d in docs]


class ProjectArchiver:
    """
    Archives a project with id=project_id from db_context

    Saves the serialized project with all the relations in gcp_buckets['archive_storage_bucket']
    Creates an ArchivedProject document with createdBy=created_by_id in db_context
    """
    def __init__(self,
                 db_context: DbContext,
                 gcp_buckets: GCPBuckets,
                 context,
                 project_id: str,
                 created_by_id: str,
                 progress_event_receiver: AbstractProgressEventReceiver,
                 version: Optional[str],
                 time_zone='UTC'):
        self.db_context = db_context
        self.gcp_buckets = gcp_buckets
        self.context = context
        self.project_id = project_id
        self.created_by_id = created_by_id
        self.progress_event_receiver = progress_event_receiver
        self.version = version
        self.time_zone = time_zone

        self.version_name = generate_version_name(time_zone)
        self.storage_directory = get_storage_directory(self.project_id, self.version_name)

        self.archive_store_service = ArchiveStoreService(context.google_services.storage_client, gcp_buckets)

        self.project = None
        self.archived_project = None
        self._initialize_ids()

    def archive(self) -> ObjectId:
        self._get_project()

        self.progress_event_receiver.init(self.project.name)

        try:
            self._validate_project()
            self._archive_collections()
            self._create_archived_project()
        except Exception as e:
            # https://stackoverflow.com/questions/62551488/why-does-flake8-say-undefined-name-for-something-i-defined-in-an-as-block
            # flake8 gets confused without this
            error = e
            execute_all([self.cleanup, lambda: self.progress_event_receiver.error(error)])
            raise error

        self.progress_event_receiver.end({
            'archived_project_id': self.archived_project.id,
            'archived_project_name': self.archived_project.projectName,
            'archived_version_name': self.archived_project.versionName
        })

        return self.archived_project.id

    def _initialize_ids(self):
        self.wells_ids: Optional[List[ObjectId]] = None

        self.scenarios_ids: Optional[List[ObjectId]] = None
        self.scenario_well_assignments_ids: Optional[List[ObjectId]] = None
        self.assumptions_ids: Optional[List[ObjectId]] = None

        self.forecasts_ids: Optional[List[ObjectId]] = None
        self.forecast_buckets_ids: Optional[List[ObjectId]] = None
        self.deterministic_forecast_datas_ids: Optional[List[ObjectId]] = None
        self.forecast_datas_ids: Optional[List[ObjectId]] = None
        self.forecast_well_assignments_ids: Optional[List[ObjectId]] = None
        self.proximity_forecast_datas_ids: Optional[List[ObjectId]] = None

        self.type_curves_ids: Optional[List[ObjectId]] = None
        self.type_curve_normalizations_ids: Optional[List[ObjectId]] = None
        self.type_curve_fits_ids: Optional[List[ObjectId]] = None
        self.type_curve_umbrellas_ids: Optional[List[ObjectId]] = None
        self.type_curve_normalization_wells_ids: Optional[List[ObjectId]] = None
        self.type_curve_well_assignments_ids: Optional[List[ObjectId]] = None

        self.schedules_ids: Optional[List[ObjectId]] = None
        self.schedule_settings_ids: Optional[List[ObjectId]] = None
        self.schedule_constructions_ids: Optional[List[ObjectId]] = None
        self.schedule_input_qualifiers_ids: Optional[List[ObjectId]] = None
        self.schedule_well_outputs_ids: Optional[List[ObjectId]] = None

        self.scen_roll_up_runs_ids: Optional[List[ObjectId]] = None
        self.econ_runs_ids: Optional[List[ObjectId]] = None
        self.econ_runs_datas_ids: Optional[List[ObjectId]] = None
        self.econ_groups_ids: Optional[List[ObjectId]] = None

        # ghg
        self.ghg_runs_ids: Optional[List[ObjectId]] = None
        self.networks_ids: Optional[List[ObjectId]] = None
        self.facilities_ids: Optional[List[ObjectId]] = None

        # lookup tables
        self.lookup_tables_ids: Optional[List[ObjectId]] = None
        self.forecast_lookup_tables_ids: Optional[List[ObjectId]] = None
        self.embedded_lookup_tables_ids: Optional[List[ObjectId]] = None

        # econ report templates
        self.econ_report_export_configurations_ids: Optional[List[ObjectId]] = None
        self.econ_report_export_default_user_configurations_ids: Optional[List[ObjectId]] = None

        self.shapefiles_ids: Optional[List[ObjectId]] = None

        self.migrations_ids: Optional[List[ObjectId]] = None

        self.filters_ids: Optional[List[ObjectId]] = None

        self.project_custom_headers_ids: Optional[List[ObjectId]] = None
        self.project_custom_headers_datas_ids: Optional[List[ObjectId]] = None

    def _archive_collections(self):
        self._archive_wells()
        self._archive_monthly_prod_data()
        self._archive_daily_prod_data()
        self._archive_well_directional_surveys()

        self._archive_scenarios()
        self._archive_scenario_well_assignments()
        self._archive_assumptions()

        self._archive_forecasts()
        self._archive_forecast_buckets()
        self._archive_deterministic_forecast_datas()
        self._archive_forecast_datas()
        self._archive_forecast_well_assignments()
        self._archive_proximity_forecast_datas()

        self._archive_type_curves()
        self._archive_type_curve_normalizations()
        self._archive_type_curve_fits()
        self._archive_type_curve_umbrellas()
        self._archive_type_curve_normalization_wells()
        self._archive_type_curve_well_assignments()

        self._archive_schedules()
        self._archive_schedule_settings()
        self._archive_schedule_constructions()
        self._archive_schedule_input_qualifiers()
        self._archive_schedule_well_outputs()

        self._archive_scen_roll_up_runs()
        self._archive_econ_runs()
        self._archive_econ_groups()
        self._archive_econ_runs_datas()
        self._archive_files()

        ## ghg
        self._archive_ghg_runs()
        self._archive_networks()
        self._archive_facilities()

        self._archive_lookup_tables()
        self._archive_forecast_lookup_tables()
        self._archive_embedded_lookup_tables()

        self._archive_econ_report_export_configurations()
        self._archive_econ_report_export_default_user_configurations()

        self._archive_shapefiles()

        self._archive_migrations()

        self._archive_filters()

        self._archive_project_custom_headers()
        self._archive_project_custom_headers_datas()

        self._archive_project()

    def cleanup(self):
        execute_all([
            lambda: self.archived_project is not None and self.archived_project.delete(),
            lambda: self.archive_store_service.delete_gcs_directory(self.storage_directory)
        ])

    def _get_project(self):
        self.project = self.db_context.project_model.objects.get(id=ObjectId(self.project_id))

    def _validate_project(self):
        if self.project.expireAt:
            raise InvalidProjectError('Cannot archive a project marked for deletion. Undo deletion and try again.')

    def _call_archive_cf(self, collection_name: str, ids: List[str], file_name: str):
        body = {
            'operation': 'archive',
            'db_info': self.db_context.db_info,
            'gcp_buckets': self.gcp_buckets,
            'collection': collection_name,
            'fileName': file_name,
            'ids': ids
        }

        make_archive_cf_request(body=body, headers=self.context.headers)

    def _call_archive_production_dal_cf(self, collection_name: str, well_str_id: str, file_name: str):
        body = {
            'operation': 'archive-production-dal',
            'gcp_buckets': self.gcp_buckets,
            'collectionName': collection_name,
            'fileName': file_name,
            'wellId': well_str_id
        }

        make_archive_cf_request(body=body, headers=self.context.headers)

    def _call_archive_files_cf(self, source_bucket_name: str, file_names: List[str]):
        body = {
            'operation': 'archive_files',
            'gcp_buckets': self.gcp_buckets,
            'sourceBucketName': source_bucket_name,
            'filesArchivingDirectory': f'{self.storage_directory}/files',
            'fileNames': file_names
        }
        make_archive_cf_request(body=body, headers=self.context.headers)

    def _archive_batch(self, collection_name: str, ids_count, index, batch):
        str_ids = [str(document_id) for document_id in batch]
        file_name = get_docs_file_name(self.storage_directory, collection_name, index)
        self._call_archive_cf(collection_name, str_ids, file_name)
        self.progress_event_receiver.progress(get_progress_name('archive', collection_name), len(batch) / ids_count)

    def _archive_production_dal_batch(self, collection_name: str, batches: int, well_str_id: str, batch_index: int):
        file_name = get_docs_file_name(self.storage_directory, collection_name, well_str_id)
        self._call_archive_production_dal_cf(collection_name, well_str_id, file_name)
        self.progress_event_receiver.progress(get_progress_name('archive', collection_name), batch_index / batches)

    def _archive_collection(self, collection: Collection, ids: List[ObjectId], batch_size=1000):
        collection_name = collection.name

        with timeit_context(f'Archive collection {collection_name}'):
            archive_fn = partial(self._archive_batch, collection_name, len(ids))

            with ThreadPoolExecutor(max_workers=20) as executor:
                list(
                    executor.map(archive_fn, list(padded_indexes(math.ceil(len(ids) / batch_size))),
                                 list(split_in_chunks(ids, batch_size))))

            if not ids:
                self.progress_event_receiver.progress(get_progress_name('archive', collection_name), 1)

            ids_file_name = get_ids_file_name(self.storage_directory, collection_name)
            self.archive_store_service.store_ids_to_gcs(ids, ids_file_name)

        return ids

    def _archive_dal_production(self, collection_name: str, wells: List[str]):
        """
        Method for archiving production data using DAL.

        Parameters
        ----------
        collection_name : str
            'monthly-productions' or 'daily-productions'

        wells : List[str]
            wells string ids to archive using DAL
        """

        with timeit_context(f'Archive {collection_name} with DAL'):
            archive_fn = partial(self._archive_production_dal_batch, collection_name, len(wells))

            for index, well_str_id in enumerate(wells):
                archive_fn(well_str_id, index)

            if not wells:
                self.progress_event_receiver.progress(get_progress_name('archive', collection_name), 1)

    def _archive_wells(self):
        well_ids = self.project.wells
        self.wells_ids = self._archive_collection(self.db_context.wells_collection, well_ids)

    def _archive_prod_data(self, collection: Collection):
        ids = _get_ids(collection, get_wells_data_query(self.wells_ids))
        return self._archive_collection(collection, ids)

    def _archive_prod_data_with_dal(self, collection_name: str):
        wells = [str(well_id) for well_id in self.wells_ids]

        self._archive_dal_production(collection_name, wells)

    def _archive_monthly_prod_data(self):
        if self.version is not None:
            self._archive_prod_data_with_dal(self.db_context.monthly_production_collection.name)
        else:
            self._archive_prod_data(self.db_context.monthly_production_collection)

    def _archive_daily_prod_data(self):
        if self.version is not None:
            self._archive_prod_data_with_dal(self.db_context.daily_production_collection.name)
        else:
            self._archive_prod_data(self.db_context.daily_production_collection)

    def _archive_well_directional_surveys(self):
        collection = self.db_context.well_directional_surveys_collection
        ids = _get_ids(collection, get_wells_data_query(self.wells_ids))
        self._archive_collection(collection, ids)

    def _archive_scenarios(self):
        scenario_ids = self.project.scenarios
        self.scenarios_ids = self._archive_collection(self.db_context.scenarios_collection, scenario_ids)

    def _archive_scenario_well_assignments(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.scenario_well_assignments_collection
        ids = _get_ids(collection, query)
        self.scenario_well_assignments_ids = self._archive_collection(collection, ids)

    def _archive_assumptions(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.assumptions_collection
        ids = _get_ids(collection, query)
        self.assumptions_ids = self._archive_collection(collection, ids)

    def _archive_forecasts(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.forecasts_collection
        ids = _get_ids(collection, query)
        self.forecasts_ids = self._archive_collection(collection, ids)

    def _archive_forecast_buckets(self):
        query = get_belongs_to_forecasts_query(self.forecasts_ids)
        collection = self.db_context.forecast_buckets_collection
        ids = _get_ids(collection, query)
        self.forecast_buckets_ids = self._archive_collection(collection, ids)

    def _archive_deterministic_forecast_datas(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.deterministic_forecast_datas_collection
        ids = _get_ids(collection, query)
        self.deterministic_forecast_datas_ids = self._archive_collection(collection, ids)

    def _archive_proximity_forecast_datas(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.proximity_forecast_datas_collection
        ids = _get_ids(collection, query)
        self.proximity_forecast_datas_ids = self._archive_collection(collection, ids)

    def _archive_forecast_datas(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.forecast_datas_collection
        ids = _get_ids(collection, query)
        self.forecast_datas_ids = self._archive_collection(collection, ids)

    def _archive_forecast_well_assignments(self):
        query = get_belongs_to_forecasts_query(self.forecasts_ids)
        collection = self.db_context.forecast_well_assignments_collection
        ids = _get_ids(collection, query)
        self.forecast_well_assignments_ids = self._archive_collection(collection, ids)

    def _archive_type_curves(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.type_curves_collection
        ids = _get_ids(collection, query)
        self.type_curves_ids = self._archive_collection(collection, ids)

    def _archive_type_curve_normalizations(self):
        query = get_belongs_to_type_curves_query(self.type_curves_ids)
        collection = self.db_context.type_curve_normalizations_collection
        ids = _get_ids(collection, query)
        self.type_curve_normalizations_ids = self._archive_collection(collection, ids)

    def _archive_type_curve_fits(self):
        query = get_belongs_to_type_curves_query(self.type_curves_ids)
        collection = self.db_context.type_curve_fits_collection
        ids = _get_ids(collection, query)
        self.type_curve_fits_ids = self._archive_collection(collection, ids)

    def _archive_type_curve_umbrellas(self):
        query = get_belongs_to_type_curves_query(self.type_curves_ids)
        collection = self.db_context.type_curve_umbrellas_collection
        ids = _get_ids(collection, query)
        self.type_curve_umbrellas_ids = self._archive_collection(collection, ids)

    def _archive_type_curve_normalization_wells(self):
        query = get_belongs_to_type_curves_query(self.type_curves_ids)
        collection = self.db_context.type_curve_normalization_wells_collection
        ids = _get_ids(collection, query)
        self.type_curve_normalization_wells_ids = self._archive_collection(collection, ids)

    def _archive_type_curve_well_assignments(self):
        query = get_belongs_to_type_curves_query(self.type_curves_ids)
        collection = self.db_context.type_curve_well_assignments_collection
        ids = _get_ids(collection, query)
        self.type_curve_well_assignments_ids = self._archive_collection(collection, ids)

    def _archive_schedules(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.schedule_collection
        ids = _get_ids(collection, query)
        self.schedules_ids = self._archive_collection(collection, ids)

    def _archive_schedule_settings(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.schedule_settings_collection
        ids = _get_ids(collection, query)
        self.schedule_settings_ids = self._archive_collection(collection, ids)

    def _archive_schedule_constructions(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.schedule_constructions_collection
        ids = _get_ids(collection, query)
        self.schedule_constructions_ids = self._archive_collection(collection, ids)

    def _archive_schedule_input_qualifiers(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.schedule_input_qualifiers_collection
        ids = _get_ids(collection, query)
        self.schedule_input_qualifiers_ids = self._archive_collection(collection, ids)

    def _archive_schedule_well_outputs(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.schedule_well_outputs_collection
        ids = _get_ids(collection, query)
        self.schedule_well_outputs_ids = self._archive_collection(collection, ids)

    def _archive_files(self):
        econ_run_files = [
            file_name for document_id in self.econ_runs_ids for file_name in get_econ_file_names(document_id)
        ]

        for batch in split_in_chunks(econ_run_files, FILES_BATCH_SIZE):
            self._call_archive_files_cf(self.gcp_buckets['econ_storage_bucket'], batch)
            self.progress_event_receiver.progress(get_progress_name('archive', 'files'),
                                                  len(batch) / len(econ_run_files))

        if not econ_run_files:
            self.progress_event_receiver.progress(get_progress_name('archive', 'files'), 1)

    def _archive_scen_roll_up_runs(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.scen_roll_up_runs_collection
        ids = _get_ids(collection, query)
        self.scen_roll_up_runs_ids = self._archive_collection(collection, ids)

    def _archive_econ_runs(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.econ_runs_collection
        ids = _get_ids(collection, query)
        self.econ_runs_ids = self._archive_collection(collection, ids)

    def _archive_econ_groups(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.econ_groups_collection
        ids = _get_ids(collection, query)
        self.econ_group_ids = self._archive_collection(collection, ids)

    def _archive_econ_runs_datas(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.econ_runs_datas_collection
        ids = _get_ids(collection, query)
        self.econ_runs_datas_ids = self._archive_collection(collection, ids)

    def _archive_ghg_runs(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.ghg_runs_collection
        ids = _get_ids(collection, query)
        self.ghg_runs_ids = self._archive_collection(collection, ids)

    def _archive_networks(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.networks_collection
        ids = _get_ids(collection, query)
        self.networks_ids = self._archive_collection(collection, ids)

    def _archive_facilities(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.facilities_collection
        ids = _get_ids(collection, query)
        self.facilities_ids = self._archive_collection(collection, ids)

    def _archive_lookup_tables(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.lookup_tables_collection
        ids = _get_ids(collection, query)
        self.lookup_tables_ids = self._archive_collection(collection, ids)

    def _archive_forecast_lookup_tables(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.forecast_lookup_tables_collection
        ids = _get_ids(collection, query)
        self.forecast_lookup_tables_ids = self._archive_collection(collection, ids)

    def _archive_embedded_lookup_tables(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.embedded_lookup_tables_collection
        ids = _get_ids(collection, query)
        self.embedded_lookup_tables_ids = self._archive_collection(collection, ids)

    def _archive_econ_report_export_configurations(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.econ_report_export_configurations
        ids = _get_ids(collection, query)
        self.econ_report_export_configurations_ids = self._archive_collection(collection, ids)

    def _archive_econ_report_export_default_user_configurations(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.econ_report_export_default_user_configurations
        ids = _get_ids(collection, query)
        self.econ_report_export_default_user_configurations_ids = self._archive_collection(collection, ids)

    def _archive_shapefiles(self):
        query = get_shapefile_belongs_to_project_query(self.project.id)
        collection = self.db_context.shapefiles_collection
        ids = _get_ids(collection, query)
        self.shapefiles_ids = self._archive_collection(collection, ids)

    def _archive_migrations(self):
        collection = self.db_context.migrations_collection
        ids = _get_ids(collection, {})
        self.migrations_ids = self._archive_collection(collection, ids)

    def _archive_filters(self):
        collection = self.db_context.filters_collection
        ids = _get_ids(collection, {'projectId': str(self.project.id)})
        self.filters_ids = self._archive_collection(collection, ids)

    def _archive_project_custom_headers(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.project_custom_headers_collection
        ids = _get_ids(collection, query)
        self.project_custom_headers_ids = self._archive_collection(collection, ids)

    def _archive_project_custom_headers_datas(self):
        query = get_belongs_to_project_query(self.project.id)
        collection = self.db_context.project_custom_headers_datas_collection
        ids = _get_ids(collection, query)
        self.project_custom_headers_datas_ids = self._archive_collection(collection, ids)

    def _archive_project(self):
        collection_name = self.db_context.project_collection.name
        file_name = get_docs_file_name(self.storage_directory, collection_name, '0')
        self._call_archive_cf(collection_name, [str(self.project.id)], file_name)
        self.progress_event_receiver.progress(get_progress_name('archive', collection_name), 1)

    def _get_collection_info(self,
                             collection,
                             query,
                             name_field='name',
                             updated_field='updatedAt',
                             limit=PROJECT_METADATA_LIMIT):
        documents = collection.find(query, {name_field: 1, updated_field: 1}).limit(limit)
        item_model = self.db_context.archived_project_item_model
        return [item_model(name=doc[name_field], updated=doc[updated_field]) for doc in documents]

    def _get_scenarios_info(self):
        return self._get_collection_info(self.db_context.scenarios_collection, get_ids_query(self.scenarios_ids))

    def _get_assumptions_info(self):
        query = {**get_belongs_to_project_query(self.project.id), 'unique': False}
        return self._get_collection_info(self.db_context.assumptions_collection, query)

    def _get_forecasts_info(self):
        return self._get_collection_info(self.db_context.forecasts_collection, get_ids_query(self.forecasts_ids))

    def _get_type_curves_info(self):
        return self._get_collection_info(self.db_context.type_curves_collection, get_ids_query(self.type_curves_ids))

    def _get_schedules_info(self):
        return self._get_collection_info(self.db_context.schedule_collection, get_ids_query(self.schedules_ids))

    def _create_archived_project(self):
        now = datetime.utcnow()
        doc = self.db_context.archived_project_model(projectId=self.project.id,
                                                     versionName=self.version_name,
                                                     projectName=self.project.name,
                                                     storageDirectory=self.storage_directory,
                                                     wellsCount=len(self.wells_ids),
                                                     createdBy=ObjectId(self.created_by_id),
                                                     scenarios=self._get_scenarios_info(),
                                                     forecasts=self._get_forecasts_info(),
                                                     typecurves=self._get_type_curves_info(),
                                                     assumptions=self._get_assumptions_info(),
                                                     schedules=self._get_schedules_info(),
                                                     createdAt=now,
                                                     version=self.version)
        doc.save()
        self.archived_project = doc
