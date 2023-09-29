from typing import Mapping

from bson import ObjectId
from pymongo.collection import Collection

from api.archive.utils import get_ids_file_name
from combocurve.shared.db_context import DbContext
from combocurve.models.archived_project import ARCHIVE_PROJECT_VERSIONS


class CollectionIdMappings:
    # collection mapping
    def __init__(self, db_context: DbContext, archived_project, archive_store_service):
        self._storage_directory = archived_project.storageDirectory
        self._archive_store_service = archive_store_service

        self.projects = {archived_project.projectId: ObjectId()}
        self.assumptions = self._create(db_context.assumptions_collection)
        self.deterministic_forecast_datas = self._create(db_context.deterministic_forecast_datas_collection)
        self.econ_runs = self._create(db_context.econ_runs_collection)
        self.econ_runs_datas = self._create(db_context.econ_runs_datas_collection)
        self.forecast_buckets = self._create(db_context.forecast_buckets_collection)
        self.forecast_datas = self._create(db_context.forecast_datas_collection)
        self.forecast_well_assignments = self._create(db_context.forecast_well_assignments_collection)
        self.forecasts = self._create(db_context.forecasts_collection)
        self.proximity_forecast_datas = self._create(db_context.proximity_forecast_datas_collection)

        self.migrations = self._create(db_context.migrations_collection)
        self.scen_roll_up_runs = self._create(db_context.scen_roll_up_runs_collection)
        self.scenario_well_assignments = self._create(db_context.scenario_well_assignments_collection)
        self.scenarios = self._create(db_context.scenarios_collection)
        self.schedule_constructions = self._create(db_context.schedule_constructions_collection)
        self.schedule_settings = self._create(db_context.schedule_settings_collection)
        self.schedule_input_qualifiers = self._create(db_context.schedule_input_qualifiers_collection)
        self.schedule_well_outputs = self._create(db_context.schedule_well_outputs_collection)
        self.schedules = self._create(db_context.schedule_collection)
        self.shapefiles = self._create(db_context.shapefiles_collection)
        self.type_curve_fits = self._create(db_context.type_curve_fits_collection)
        self.type_curve_normalization_wells = self._create(db_context.type_curve_normalization_wells_collection)
        self.type_curve_normalizations = self._create(db_context.type_curve_normalizations_collection)
        self.type_curve_umbrellas = self._create(db_context.type_curve_umbrellas_collection)
        self.type_curve_well_assignments = self._create(db_context.type_curve_well_assignments_collection)
        self.type_curves = self._create(db_context.type_curves_collection)
        self.wells = self._create(db_context.wells_collection)
        self.filters = self._create(db_context.filters_collection)
        self.project_custom_headers = self._create(db_context.project_custom_headers_collection)
        self.project_custom_headers_datas = self._create(db_context.project_custom_headers_datas_collection)
        self.well_directional_surveys = self._create(db_context.well_directional_surveys_collection)
        self.econ_groups = self._create(db_context.econ_groups_collection)
        # lookup tables
        self.lookup_tables = self._create(db_context.lookup_tables_collection)
        self.forecast_lookup_tables = self._create(db_context.forecast_lookup_tables_collection)
        self.embedded_lookup_tables = self._create(db_context.embedded_lookup_tables_collection)
        # ghg
        self.ghg_runs = self._create(db_context.ghg_runs_collection)
        self.networks = self._create(db_context.networks_collection)
        self.facilities = self._create(db_context.facilities_collection)
        # econ report export csv configurations
        self.econ_report_export_configurations = self._create(db_context.econ_report_export_configurations)
        self.econ_report_export_default_user_configurations = self._create(
            db_context.econ_report_export_default_user_configurations)  # noqa E501

        self.daily_productions = {}
        self.monthly_productions = {}

        if archived_project.version == ARCHIVE_PROJECT_VERSIONS['V_1']:
            self.daily_productions = self._create(db_context.daily_production_collection)
            self.monthly_productions = self._create(db_context.monthly_production_collection)

    def _create(self, collection: Collection) -> Mapping[ObjectId, ObjectId]:
        id_file_name = get_ids_file_name(self._storage_directory, collection.name)
        ids = self._archive_store_service.load_ids_from_gcs(id_file_name)
        return {ObjectId(document_id): ObjectId() for document_id in ids}
