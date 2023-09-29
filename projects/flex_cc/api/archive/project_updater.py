from functools import partial
import json
import re
from datetime import datetime
from typing import List, Mapping, Optional
from concurrent.futures import ThreadPoolExecutor

from bson import ObjectId
from bson.json_util import dumps
from combocurve.shared.redis_client import RedisClient
from pymongo.collection import Collection

from api.archive.abstract_progress_event_receiver import get_progress_name, AbstractProgressEventReceiver
from api.archive.collection_id_mappings import CollectionIdMappings
from api.archive.utils import make_archive_cf_request
from combocurve.shared.db_context import DbContext
from combocurve.shared.doc_mapper import NEW_INPT_ID
from combocurve.shared.gcp_buckets import GCPBuckets
from combocurve.shared.helpers import split_in_chunks, get_auto_incremented_name
from combocurve.shared.debugging.timings import timeit_context


class ProjectUpdater:
    # Updates the objectIds in db_info based on the specified id mappings
    @staticmethod
    def _get_timestamp_fields():
        now = datetime.utcnow()
        return {"createdAt": now, "updatedAt": now}

    @staticmethod
    def _get_new_ids(mapping: Mapping[ObjectId, ObjectId]) -> List[ObjectId]:
        return [] if mapping is None else list(mapping.values())

    @staticmethod
    def _get_original_ids(mapping: Mapping[ObjectId, ObjectId]) -> List[ObjectId]:
        return [] if mapping is None else list(mapping.keys())

    def __init__(self,
                 db_context: DbContext,
                 gcp_buckets: GCPBuckets,
                 context,
                 archived_project,
                 collection_id_mappings: CollectionIdMappings,
                 temporary_db_name: str,
                 progress_event_receiver: AbstractProgressEventReceiver,
                 user_id: str,
                 new_project_name: Optional[str] = None):
        self.db_context = db_context
        self.to_db_context = DbContext(context.db_info)
        self.gcp_buckets = gcp_buckets
        self.context = context
        self.archived_project = archived_project
        self.id_mappings = collection_id_mappings
        self.temporary_db_name = temporary_db_name
        self.progress_event_receiver = progress_event_receiver
        self.user_id = user_id
        self.new_project_name = new_project_name
        self.redis_client = RedisClient(host=self.context.tenant_info['redis_host'],
                                        port=self.context.tenant_info['redis_port']).client

    def update(self):
        self._store_id_mappings()

        self._update_wells()
        self._update_monthly_prod_data()
        self._update_daily_prod_data()
        self._update_well_directional_surveys_data()

        self._update_scenarios()
        self._update_scenario_well_assignments()
        self._update_assumptions()

        self._update_forecasts()
        self._update_forecast_buckets()
        self._update_deterministic_forecast_datas()
        self._update_forecast_datas()
        self._update_forecast_well_assignments()
        self._update_proximity_forecast_datas()

        self._update_type_curves()
        self._update_type_curve_normalizations()
        self._update_type_curve_fits()
        self._update_type_curve_umbrellas()
        self._update_type_curve_normalization_wells()
        self._update_type_curve_well_assignments()

        self._update_schedules()
        self._update_schedule_settings()
        self._update_schedule_constructions()
        self._update_schedule_input_qualifiers()
        self._update_schedule_well_outputs()

        self._update_shapefiles()

        self._update_scen_roll_up_runs()
        self._update_econ_runs()
        self._update_econ_runs_datas()
        self._update_econ_groups()

        # ghg
        self._update_ghg_runs()
        self._update_networks()
        self._update_facilities()

        # lookup tables
        self._update_lookup_tables()
        self._update_forecast_lookup_tables()
        self._update_embedded_lookup_tables()

        # econ report export configurations
        self._update_econ_report_export_configurations()
        self._update_econ_report_export_default_user_configurations()

        self._update_filters()

        self._update_project_custom_headers()
        self._update_project_custom_headers_datas()

        new_project_name = self._update_project()

        return new_project_name

    def _store_id_mappings(self):
        self.collection_mapping = {
            'assumptions':
            self.id_mappings.assumptions,
            'daily_productions':
            self.id_mappings.daily_productions,
            'deterministic_forecast_datas':
            self.id_mappings.deterministic_forecast_datas,
            'econ_runs':
            self.id_mappings.econ_runs,
            'econ_runs_datas':
            self.id_mappings.econ_runs_datas,
            'filters':
            self.id_mappings.filters,
            'forecast_buckets':
            self.id_mappings.forecast_buckets,
            'forecast_datas':
            self.id_mappings.forecast_datas,
            'forecast_well_assignments':
            self.id_mappings.forecast_well_assignments,
            'forecasts':
            self.id_mappings.forecasts,
            'migrations':
            self.id_mappings.migrations,
            'monthly_productions':
            self.id_mappings.monthly_productions,
            'project_custom_headers':
            self.id_mappings.project_custom_headers,
            'project_custom_headers_datas':
            self.id_mappings.project_custom_headers_datas,
            'projects':
            self.id_mappings.projects,
            'proximity_forecast_datas':
            self.id_mappings.proximity_forecast_datas,
            'scen_roll_up_runs':
            self.id_mappings.scen_roll_up_runs,
            'scenario_well_assignments':
            self.id_mappings.scenario_well_assignments,
            'scenarios':
            self.id_mappings.scenarios,
            'schedule_constructions':
            self.id_mappings.schedule_constructions,
            'schedule_settings':
            self.id_mappings.schedule_settings,
            'schedule_input_qualifiers':
            self.id_mappings.schedule_input_qualifiers,
            'schedule_well_outputs':
            self.id_mappings.schedule_well_outputs,
            'schedules':
            self.id_mappings.schedules,
            'shapefiles':
            self.id_mappings.shapefiles,
            'type_curve_fits':
            self.id_mappings.type_curve_fits,
            'type_curve_normalization_wells':
            self.id_mappings.type_curve_normalization_wells,
            'type_curve_normalizations':
            self.id_mappings.type_curve_normalizations,
            'type_curve_umbrellas':
            self.id_mappings.type_curve_umbrellas,
            'type_curve_well_assignments':
            self.id_mappings.type_curve_well_assignments,
            'type_curves':
            self.id_mappings.type_curves,
            'wells':
            self.id_mappings.wells,
            'well_directional_surveys':
            self.id_mappings.well_directional_surveys,
            'econ_groups':
            self.id_mappings.econ_groups,

            # lookups
            'lookup_tables':
            self.id_mappings.lookup_tables,
            'forecast_lookup_tables':
            self.id_mappings.forecast_lookup_tables,
            'embedded_lookup_tables':
            self.id_mappings.embedded_lookup_tables,

            # ghg
            'ghg_runs':
            self.id_mappings.ghg_runs,
            'networks':
            self.id_mappings.networks,
            'facilities':
            self.id_mappings.facilities,

            # econ report export configurations
            'econ_report_export_configurations':
            self.id_mappings.econ_report_export_configurations,
            'econ_report_export_default_user_configurations':
            self.id_mappings.econ_report_export_default_user_configurations,  # noqa E501
        }

        with timeit_context('Saving ids to redis'):
            for collection in self.collection_mapping.keys():
                redis_key = f'archive:updater:{self.temporary_db_name}:{collection}'
                plain_id_mapping = {str(k): str(v) for k, v in self.collection_mapping.get(collection).items()}
                self.redis_client.set(redis_key, json.dumps(plain_id_mapping), ex=60 * 60 * 3)  # 3 hours

    def _get_created_by_fields(self):
        return {'createdBy': ObjectId(self.user_id)}

    def _call_update_cf(self, collection_name: str, set_fields, dependencies: List[str], ids: List[str]):
        if set_fields is None:
            set_fields = {}

        for collection in dependencies:
            if collection not in self.collection_mapping:
                raise Exception(f'Invalid dependency {collection}')

        body = {
            'operation': 'update',
            'gcp_buckets': self.gcp_buckets,
            'db_info': self.db_context.db_info,
            'original_project_id': str(self.archived_project.projectId),
            'temporary_db_name': self.temporary_db_name,
            'collection': collection_name,
            'ids': ids,
            'set_fields': set_fields,
            'dependencies': dependencies
        }

        make_archive_cf_request(body=body, headers=self.context.headers)

    def _update_collection(self,
                           collection: Collection,
                           ids: List[ObjectId],
                           set_fields=None,
                           dependencies: List[str] = None,
                           batch_size=2000):
        """
        Updates the documents in the collection with id in ids in batches
        """
        if set_fields is None:
            set_fields = {}

        collection_name = collection.name

        with timeit_context(f'Update collection {collection_name}'):
            if ids:
                plain_set_fields = {k: dumps(v) for k, v in set_fields.items()}
                plain_ids = (str(_id) for _id in ids)

                update_fn = partial(self._call_update_cf, collection_name, plain_set_fields, dependencies)

                with ThreadPoolExecutor(max_workers=20) as executor:
                    list(executor.map(update_fn, split_in_chunks(plain_ids, batch_size)))

            self.progress_event_receiver.progress(get_progress_name('update', collection_name), 1)

    def _update_wells(self):
        ids = self._get_original_ids(self.id_mappings.wells)

        # 'projects' is also a dependency but it doesn't need to be updated since we are setting it below
        dependencies = ['wells']

        # Set all wells to project scope. In the future there will be a setting for this
        set_fields = {
            'project': self.id_mappings.projects[self.archived_project.projectId],
            'inptID': NEW_INPT_ID,
            **self._get_timestamp_fields()
        }

        self._update_collection(self.db_context.wells_collection, ids, set_fields=set_fields, dependencies=dependencies)

    def _update_monthly_prod_data(self):
        ids = self._get_original_ids(self.id_mappings.monthly_productions)

        dependencies = ['wells', 'projects', 'monthly_productions']

        set_fields = self._get_timestamp_fields()

        self._update_collection(self.db_context.monthly_production_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_daily_prod_data(self):
        ids = self._get_original_ids(self.id_mappings.daily_productions)

        dependencies = ['wells', 'projects', 'daily_productions']

        set_fields = self._get_timestamp_fields()

        self._update_collection(self.db_context.daily_production_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_well_directional_surveys_data(self):
        ids = self._get_original_ids(self.id_mappings.well_directional_surveys)

        dependencies = ['wells', 'projects', 'well_directional_surveys']

        set_fields = self._get_timestamp_fields()

        self._update_collection(self.db_context.well_directional_surveys_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_scenarios(self):
        ids = self._get_original_ids(self.id_mappings.scenarios)

        dependencies = ['wells', 'scenarios', 'assumptions', 'projects']

        set_fields = {'tags': [], **self._get_timestamp_fields(), **self._get_created_by_fields()}

        self._update_collection(self.db_context.scenarios_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_scenario_well_assignments(self):
        ids = self._get_original_ids(self.id_mappings.scenario_well_assignments)

        dependencies = [
            'wells', 'scenarios', 'scenario_well_assignments', 'projects', 'assumptions', 'forecasts', 'schedules',
            'lookup_tables', 'forecast_lookup_tables', 'networks'
        ]

        set_fields = self._get_timestamp_fields()

        self._update_collection(self.db_context.scenario_well_assignments_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_assumptions(self):
        ids = self._get_original_ids(self.id_mappings.assumptions)

        dependencies = ['wells', 'scenarios', 'assumptions', 'projects', 'embedded_lookup_tables']

        set_fields = {'tags': [], **self._get_timestamp_fields(), **self._get_created_by_fields()}

        self._update_collection(self.db_context.assumptions_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_forecasts(self):
        ids = self._get_original_ids(self.id_mappings.forecasts)

        dependencies = ['forecasts', 'wells', 'projects']

        set_fields = {'tags': [], **self._get_timestamp_fields(), 'user': ObjectId(self.user_id)}

        self._update_collection(self.db_context.forecasts_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_forecast_buckets(self):
        ids = self._get_original_ids(self.id_mappings.forecast_buckets)

        dependencies = ['forecast_buckets', 'forecasts', 'wells']

        set_fields = {**self._get_timestamp_fields(), 'user': ObjectId(self.user_id)}

        self._update_collection(self.db_context.forecast_buckets_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_deterministic_forecast_datas(self):
        ids = self._get_original_ids(self.id_mappings.deterministic_forecast_datas)

        dependencies = ['deterministic_forecast_datas', 'forecasts', 'wells', 'projects']

        set_fields = self._get_timestamp_fields()

        self._update_collection(self.db_context.deterministic_forecast_datas_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_forecast_datas(self):
        ids = self._get_original_ids(self.id_mappings.forecast_datas)

        dependencies = ['forecast_datas', 'forecasts', 'wells', 'projects']

        set_fields = self._get_timestamp_fields()

        self._update_collection(self.db_context.forecast_datas_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_forecast_well_assignments(self):
        ids = self._get_original_ids(self.id_mappings.forecast_well_assignments)

        dependencies = ['forecast_well_assignments', 'forecasts', 'wells', 'forecast_datas']

        set_fields = self._get_timestamp_fields()

        self._update_collection(self.db_context.forecast_well_assignments_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_proximity_forecast_datas(self):
        ids = self._get_original_ids(self.id_mappings.proximity_forecast_datas)

        dependencies = ['proximity_forecast_datas', 'forecasts', 'wells', 'projects']

        set_fields = self._get_timestamp_fields()

        self._update_collection(self.db_context.proximity_forecast_datas_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_type_curves(self):
        ids = self._get_original_ids(self.id_mappings.type_curves)

        dependencies = [
            'type_curves', 'forecasts', 'type_curve_normalizations', 'wells', 'projects', 'type_curve_fits',
            'assumptions'
        ]

        set_fields = {'tags': [], **self._get_timestamp_fields(), **self._get_created_by_fields()}

        self._update_collection(self.db_context.type_curves_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_type_curve_normalizations(self):
        ids = self._get_original_ids(self.id_mappings.type_curve_normalizations)

        dependencies = ['type_curve_normalizations', 'type_curves']

        set_fields = self._get_timestamp_fields()

        self._update_collection(self.db_context.type_curve_normalizations_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_type_curve_fits(self):
        ids = self._get_original_ids(self.id_mappings.type_curve_fits)

        dependencies = ['type_curve_fits', 'type_curves']

        self._update_collection(self.db_context.type_curve_fits_collection, ids, dependencies=dependencies)

    def _update_type_curve_umbrellas(self):
        ids = self._get_original_ids(self.id_mappings.type_curve_umbrellas)

        dependencies = ['type_curve_umbrellas', 'type_curves']

        self._update_collection(self.db_context.type_curve_umbrellas_collection, ids, dependencies=dependencies)

    def _update_type_curve_normalization_wells(self):
        ids = self._get_original_ids(self.id_mappings.type_curve_normalization_wells)

        dependencies = ['type_curve_normalization_wells', 'type_curves', 'type_curve_normalizations', 'wells']

        self._update_collection(self.db_context.type_curve_normalization_wells_collection,
                                ids,
                                dependencies=dependencies)

    def _update_type_curve_well_assignments(self):
        ids = self._get_original_ids(self.id_mappings.type_curve_well_assignments)

        dependencies = ['type_curve_well_assignments', 'type_curves', 'wells']

        self._update_collection(self.db_context.type_curve_well_assignments_collection, ids, dependencies=dependencies)

    def _update_schedules(self):
        ids = self._get_original_ids(self.id_mappings.schedules)

        dependencies = [
            'wells',
            'schedules',
            'projects',
            'scenarios',
            'schedule_settings',
            'schedule_input_qualifiers',
        ]

        set_fields = {'tags': [], **self._get_timestamp_fields(), **self._get_created_by_fields()}

        self._update_collection(self.db_context.schedule_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_schedule_settings(self):
        ids = self._get_original_ids(self.id_mappings.schedule_settings)

        dependencies = ['schedule_settings', 'projects']

        set_fields = {**self._get_timestamp_fields(), **self._get_created_by_fields()}

        self._update_collection(self.db_context.schedule_settings_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_schedule_constructions(self):
        ids = self._get_original_ids(self.id_mappings.schedule_constructions)

        dependencies = ['schedule_constructions', 'projects', 'schedules']

        self._update_collection(self.db_context.schedule_constructions_collection, ids, dependencies=dependencies)

    def _update_schedule_input_qualifiers(self):
        ids = self._get_original_ids(self.id_mappings.schedule_input_qualifiers)

        dependencies = ['schedule_input_qualifiers', 'projects', 'schedules', 'wells']

        self._update_collection(self.db_context.schedule_input_qualifiers_collection, ids, dependencies=dependencies)

    def _update_schedule_well_outputs(self):
        ids = self._get_original_ids(self.id_mappings.schedule_well_outputs)

        dependencies = ['schedule_well_outputs', 'projects', 'schedule_constructions', 'schedules', 'wells']

        self._update_collection(self.db_context.schedule_well_outputs_collection, ids, dependencies=dependencies)

    def _update_shapefiles(self):
        ids = self._get_original_ids(self.id_mappings.shapefiles)

        dependencies = ['shapefiles', 'projects']

        self._update_collection(self.db_context.shapefiles_collection, ids, dependencies=dependencies)

    def _update_scen_roll_up_runs(self):
        ids = self._get_original_ids(self.id_mappings.scen_roll_up_runs)

        dependencies = ['scen_roll_up_runs', 'scenarios', 'projects', 'wells']

        set_fields = {**self._get_timestamp_fields(), **self._get_created_by_fields()}

        self._update_collection(self.db_context.scen_roll_up_runs_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_econ_runs(self):
        set_fields = {"files": [], **self._get_timestamp_fields(), 'user': ObjectId(self.user_id)}

        dependencies = ['econ_runs', 'scenarios', 'projects', 'wells']

        ids = self._get_original_ids(self.id_mappings.econ_runs)

        self._update_collection(self.db_context.econ_runs_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_econ_groups(self):
        set_fields = {**self._get_timestamp_fields(), **self._get_created_by_fields()}

        dependencies = [
            'econ_groups', 'assumptions', 'networks', 'scenarios', 'projects', 'wells', 'scenario_well_assignments'
        ]

        ids = self._get_original_ids(self.id_mappings.econ_groups)

        self._update_collection(self.db_context.econ_groups_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_econ_report_export_configurations(self):
        set_fields = {**self._get_timestamp_fields(), **self._get_created_by_fields()}

        dependencies = [
            'projects',
            'econ_report_export_configurations',
        ]

        ids = self._get_original_ids(self.id_mappings.econ_report_export_configurations)

        self._update_collection(self.db_context.econ_report_export_configurations,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_econ_report_export_default_user_configurations(self):
        dependencies = [
            'projects', 'econ_report_export_configurations', 'econ_report_export_default_user_configurations'
        ]

        ids = self._get_original_ids(self.id_mappings.econ_report_export_default_user_configurations)

        set_fields = {'user': ObjectId(self.user_id)}

        self._update_collection(self.db_context.econ_report_export_default_user_configurations,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_econ_runs_datas(self):
        ids = self._get_original_ids(self.id_mappings.econ_runs_datas)

        dependencies = ['econ_runs_datas', 'econ_runs', 'scenarios', 'projects', 'wells']

        set_fields = {**self._get_timestamp_fields(), 'user': ObjectId(self.user_id)}

        self._update_collection(self.db_context.econ_runs_datas_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_ghg_runs(self):
        set_fields = {"files": [], **self._get_timestamp_fields(), 'user': ObjectId(self.user_id)}

        dependencies = ['ghg_runs', 'scenarios', 'projects', 'wells']

        ids = self._get_original_ids(self.id_mappings.ghg_runs)

        self._update_collection(self.db_context.ghg_runs_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_networks(self):
        set_fields = {"files": [], **self._get_timestamp_fields(), 'createdBy': ObjectId(self.user_id)}

        dependencies = [
            'networks',
            'projects',
            'wells',
            'assumptions',  ## for fluid_models
            'facilities',  ## using facility in network
        ]

        ids = self._get_original_ids(self.id_mappings.networks)

        self._update_collection(self.db_context.networks_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_facilities(self):
        set_fields = {"files": [], **self._get_timestamp_fields(), 'createdBy': ObjectId(self.user_id)}

        dependencies = [
            'facilities',
            'projects',
            'assumptions',  ## for fluid_models
        ]

        ids = self._get_original_ids(self.id_mappings.facilities)
        self._update_collection(self.db_context.facilities_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_lookup_tables(self):
        ids = self._get_original_ids(self.id_mappings.lookup_tables)

        dependencies = ['lookup_tables', 'forecasts', 'schedules', 'assumptions', 'projects', 'networks']

        set_fields = {'tags': [], **self._get_timestamp_fields(), **self._get_created_by_fields()}

        self._update_collection(self.db_context.lookup_tables_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_forecast_lookup_tables(self):
        ids = self._get_original_ids(self.id_mappings.forecast_lookup_tables)

        dependencies = ['forecast_lookup_tables', 'type_curves', 'projects']

        set_fields = {'tags': [], **self._get_timestamp_fields(), **self._get_created_by_fields()}

        self._update_collection(self.db_context.forecast_lookup_tables_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_embedded_lookup_tables(self):
        ids = self._get_original_ids(self.id_mappings.embedded_lookup_tables)

        dependencies = ['embedded_lookup_tables', 'projects', 'assumptions']

        set_fields = {'tags': [], **self._get_timestamp_fields(), **self._get_created_by_fields()}

        self._update_collection(self.db_context.embedded_lookup_tables_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_filters(self):
        ids = self._get_original_ids(self.id_mappings.filters)

        set_fields = {
            **self._get_timestamp_fields(),
            'projectId': str(self.id_mappings.projects[self.archived_project.projectId]),
        }

        dependencies = ['filters', 'wells']

        self._update_collection(self.db_context.filters_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_project_custom_headers(self):
        ids = self._get_original_ids(self.id_mappings.project_custom_headers)

        dependencies = ['project_custom_headers', 'projects']

        set_fields = {**self._get_timestamp_fields(), **self._get_created_by_fields()}

        self._update_collection(self.db_context.project_custom_headers_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _update_project_custom_headers_datas(self):
        ids = self._get_original_ids(self.id_mappings.project_custom_headers_datas)

        dependencies = ['project_custom_headers_datas', 'wells', 'projects']

        set_fields = {**self._get_timestamp_fields(), **self._get_created_by_fields()}

        self._update_collection(self.db_context.project_custom_headers_datas_collection,
                                ids,
                                set_fields=set_fields,
                                dependencies=dependencies)

    def _generate_new_project_name(self):
        collection = self.to_db_context.project_collection
        base_project_name = f'{self.archived_project.projectName} {self.archived_project.versionName}'

        reg_exp = re.compile(f"^{re.escape(base_project_name)}")
        projects = collection.find(filter={'name': reg_exp}, projection={'_id': False, 'name': True})
        existing_project_names = (p['name'] for p in projects)

        return get_auto_incremented_name(base_project_name, existing_project_names)

    def _update_project(self) -> str:
        collection = self.db_context.project_collection

        ids = self._get_original_ids(self.id_mappings.projects)

        new_project_name = self.new_project_name or self._generate_new_project_name()

        # tags could be already deleted and also break when using the shareable codes
        set_fields = {
            'name': new_project_name,
            'tags': [],
            **self._get_timestamp_fields(),
            **self._get_created_by_fields(),
        }

        self._update_collection(collection, ids, set_fields=set_fields, dependencies=['projects', 'wells', 'scenarios'])

        return new_project_name
