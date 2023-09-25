'''
    Maps output_field (BigQuery) => well_field (MongoDB)
    Other keys will be added later in addition to `well_field`, e.g `title`, `type`
    `well_field` only has a value when is different than `output_field`
'''

PRMS_RESOURCES_CLASS = 'prms_resources_class'
PRMS_RESERVES_CATEGORY = 'prms_reserves_category'
PRMS_RESERVES_SUB_CATEGORY = 'prms_reserves_sub_category'

ECON_PRMS_RESOURCES_CLASS = 'econ_' + PRMS_RESOURCES_CLASS
ECON_PRMS_RESERVES_CATEGORY = 'econ_' + PRMS_RESERVES_CATEGORY
ECON_PRMS_RESERVES_SUB_CATEGORY = 'econ_' + PRMS_RESERVES_SUB_CATEGORY

# well header fields with different names in mongoDB and BigQuery
WELL_HEADER_NAME_MAP = {
    'chosen_id': 'chosenID',
    'data_source': 'dataSource',
    'heel_latitude': 'heelLatitude',
    'heel_longitude': 'heelLongitude',
    'inpt_id': 'inptID',
    'surface_latitude': 'surfaceLatitude',
    'surface_longitude': 'surfaceLongitude',
    'toe_latitude': 'toeLatitude',
    'toe_longitude': 'toeLongitude',
    'most_recent_import_desc': 'mostRecentImportDesc',
    'most_recent_import_type': 'mostRecentImportType',
    'chosen_key_id': 'chosenKeyID'
}

# only for clarification, not used in code
METADATA_FIELDS = [
    'run_id',
    'run_date',
    'project_id',
    'project_name',
    'scenario_id',
    'scenario_name',
    'user_id',
    'user_name',
    'general_options_name',
    'schema_version',
]

# only for clarification, not used in code
WELL_HEADER_BASE_FIELDS = [
    'well_id',
    # run_data columns
    'run_id',
    'run_date',  # run date used for partition
    #
    'created_at',
]

# only for clarification, not used in code
MONTHLY_ONE_LINER_BASE_FIELDS = [
    'run_id',
    'run_date',  # run date used for partition
    # 3 res cat columns created by econ model
    'econ_prms_resources_class',
    'econ_prms_reserves_category',
    'econ_prms_reserves_sub_category',
    # qualifier names
    'capex_qualifier',
    'dates_qualifier',
    'expenses_qualifier',
    'ownership_reversion_qualifier',
    'pricing_qualifier',
    'differentials_qualifier',
    'production_taxes_qualifier',
    'production_vs_fit_qualifier',
    'reserves_category_qualifier',
    'risking_qualifier',
    'stream_properties_qualifier',
    'forecast_qualifier',
    'forecast_p_series_qualifier',
    'schedule_qualifier',
    #
    'combo_name',
    'well_id',
    'combo_well_id',
    'combo_well_incremental_id',
    #
    'error',
    'warning',
    'incremental_name',  # created by well name and incremental_index
    'incremental_index',
    'well_index',
]


def get_db_fields(well_fields):
    return [well_fields[output_field]['well_field'] or output_field for output_field in well_fields]


def get_well_field_value(well, well_fields, output_field):
    return well.get(well_fields[output_field]['well_field'] or output_field)
