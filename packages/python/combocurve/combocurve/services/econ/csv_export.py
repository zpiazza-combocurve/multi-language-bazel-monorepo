from typing import Dict, List, Optional

from combocurve.services.econ.econ_columns import (BASIC_HEADER, SUGGESTED_HEADER, OTHER_HEADER, OTHER_HEADER_AGG,
                                                   WELL_COUNT_HEADER, CSV_FAKE_ECON_COLUMNS, CUMULATIVE_ECON_COLUMNS,
                                                   OTHER_HEADER_WO_DATE_WO_WARNING)
from combocurve.services.econ.well_header import WELL_HEADER_MAP

ONE_LINER_KEY = 'oneLiner'
BY_WELL_CF_KEY = 'cashflow-csv'
AGG_CF_KEY = 'cashflow-agg-csv'
CF_REPORT_TYPE_MONTHLY = 'monthly'
CF_REPORT_TYPE_YEARLY = 'yearly'

# default setting name (shown on FE)
ONE_LINER_BASIC_HEADERS = 'Core Headers'
ONE_LINER_ALL_HEADERS = 'All Headers'
BY_WELL_MONTHLY = 'By Well'
BY_WELL_YEARLY = 'By Well Yearly'
AGG_MONTHLY = 'Aggregate Monthly'
AGG_YEARLY = 'Aggregate Yearly'
SCENARIO_TABLE_HEADERS = 'Scenario Table Headers'

COLUMNS = 'columns'
CF_REPORT_TYPE = 'cf_report_type'
DEFAULT_SORTING_MAP = {
    ONE_LINER_KEY: {
        'combo_name': {
            'priority': 0,
            'direction': 'ASC'
        },
        'well_name': {
            'priority': 1,
            'direction': 'ASC'
        },
        'well_number': {
            'priority': 2,
            'direction': 'ASC'
        },
        'incremental_index': {
            'priority': 3,
            'direction': 'ASC'
        }
    },
    BY_WELL_CF_KEY: {
        'combo_name': {
            'priority': 0,
            'direction': 'ASC'
        },
        'econ_group': {
            'priority': 1,
            'direction': 'ASC'
        },
        'well_name': {
            'priority': 2,
            'direction': 'ASC'
        },
        'well_number': {
            'priority': 3,
            'direction': 'ASC'
        },
        'incremental_index': {
            'priority': 4,
            'direction': 'ASC'
        },
        'date': {
            'priority': 5,
            'direction': 'ASC'
        }
    },
    AGG_CF_KEY: {
        'combo_name': {
            'priority': 0,
            'direction': 'ASC'
        },
        'aggregation_group': {
            'priority': 1,
            'direction': 'ASC'
        },
        'date': {
            'priority': 2,
            'direction': 'ASC'
        }
    }
}

TEMPLATE_HEADER_MAP_DICT = {
    ONE_LINER_KEY: {
        ONE_LINER_BASIC_HEADERS: {
            COLUMNS: {
                **BASIC_HEADER,
                **OTHER_HEADER_WO_DATE_WO_WARNING
            },
            CF_REPORT_TYPE: None
        },
        ONE_LINER_ALL_HEADERS: {
            COLUMNS: {
                **BASIC_HEADER,
                **{k: v
                   for k, v in WELL_HEADER_MAP.items() if k not in BASIC_HEADER},
                **OTHER_HEADER_WO_DATE_WO_WARNING
            },
            CF_REPORT_TYPE: None
        },
    },
    BY_WELL_CF_KEY: {
        BY_WELL_MONTHLY: {
            COLUMNS: {
                **BASIC_HEADER,
                **OTHER_HEADER
            },
            CF_REPORT_TYPE: CF_REPORT_TYPE_MONTHLY
        }
    },
    AGG_CF_KEY: {
        AGG_MONTHLY: {
            COLUMNS: {
                **BASIC_HEADER,
                **SUGGESTED_HEADER,
                **OTHER_HEADER_AGG,
                **WELL_COUNT_HEADER
            },
            CF_REPORT_TYPE: CF_REPORT_TYPE_MONTHLY
        },
        AGG_YEARLY: {
            COLUMNS: {
                **OTHER_HEADER_AGG
            },
            CF_REPORT_TYPE: CF_REPORT_TYPE_YEARLY
        }
    }
}


def get_one_column_template(key: str,
                            label: str,
                            key_type: str,
                            sorting_options: Optional[Dict] = None,
                            selected: Optional[bool] = True):
    return {
        'key': key,
        'label': label,
        'selected': selected,
        'keyType': key_type,
        'sortingOptions': sorting_options,
    }


def generate_econ_columns(run: Dict):
    if run is not None:
        columns = run.get('outputParams', {'columns': []})['columns']
        column_fields = run.get('outputParams', {'columnFields': {}})['columnFields']
    else:
        columns = []
        column_fields = {}

    monthly_econ_cols = []
    one_liner_econ_cols = []

    key_type = 'column'

    for column in columns:
        key = column['key']
        label = column_fields[key]['label']
        selected_options = column['selected_options']

        if selected_options['monthly'] is True:
            monthly_econ_cols.append(get_one_column_template(key, label, key_type))

        if selected_options['aggregate']:
            cum_col = f'cum_{key}'
            monthly_econ_cols.append(get_one_column_template(cum_col, CUMULATIVE_ECON_COLUMNS[cum_col], key_type))

        if selected_options['one_liner'] is True:
            one_liner_econ_cols.append(get_one_column_template(key, label, key_type))

    return monthly_econ_cols, one_liner_econ_cols


def fill_in_setting_template(template_name: str,
                             columns: List[Dict],
                             report_type: str,
                             cf_report_type: Optional[str] = None,
                             cf_report_time_periods: Optional[str] = None,
                             cf_report_hybrid_year_type: Optional[str] = None,
                             cf_report_months: Optional[int] = None):
    template = {
        'name': template_name,
        'columns': columns,
        'type': report_type,
        'cashflowOptions': None,
    }

    if 'cashflow' in report_type:
        template['cashflowOptions'] = {
            'type': cf_report_type,
            'timePeriods': cf_report_time_periods,
            'hybridOptions': {
                'yearType': cf_report_hybrid_year_type,
                'months': cf_report_months,
            }
        }

    return template


def append_columns_to_headers(columns: List[Dict], custom_headers: List[Dict], report_type: str, template: str):
    return header_map_to_column_format(TEMPLATE_HEADER_MAP_DICT[report_type][template][COLUMNS],
                                       DEFAULT_SORTING_MAP[report_type]) + custom_headers + columns


def header_map_to_column_format(header_map: Dict, sorting_map: Dict[str, Dict]):
    return [
        get_one_column_template(key, label, 'column' if key in CSV_FAKE_ECON_COLUMNS else 'header',
                                sorting_map.get(key)) for key, label in header_map.items()
    ]


def create_setting_template(
    template_name: str,
    columns: List[Dict],
    report_type: str,
    custom_headers: List[Dict],
    cf_report_type: Optional[str] = None,
    cf_report_time_periods: Optional[str] = None,
    cf_report_hybrid_year_type: Optional[str] = None,
    cf_report_months: Optional[int] = None,
):
    columns = append_columns_to_headers(columns, custom_headers, report_type, template_name)

    template = fill_in_setting_template(template_name, columns, report_type, cf_report_type, cf_report_time_periods,
                                        cf_report_hybrid_year_type, cf_report_months)

    return template


def date_sorting_priority(well_headers):
    return max([header.get('priority', 0) for header in well_headers]) + 1


def create_scenario_table_header_column_map(well_headers: Dict, custom_headers: List[Dict]):
    temporary_custom_header_hash = {custom_header['key']: custom_header for custom_header in custom_headers}

    return [
        get_one_column_template(header['key'], WELL_HEADER_MAP[header['key']], 'header', {
            'priority': header['priority'],
            'direction': header['direction']
        } if 'direction' in header else None) if 'custom' not in header['key'] else temporary_custom_header_hash.get(
            header['key'],
            get_one_column_template(header['key'], header['key'].replace('_', ' ').title(), 'header', {
                'priority': header['priority'],
                'direction': header['direction']
            } if 'direction' in header else None)) for header in well_headers
        if (WELL_HEADER_MAP.get(header['key']) or 'custom' in header['key'])
    ]


def create_scenario_table_header_date_map(well_headers):
    return [
        get_one_column_template('date', 'Date', 'column', {
            'priority': date_sorting_priority(well_headers),
            'direction': 'ASC'
        })
    ]


def create_scenario_table_header_combo_name_map():
    return [get_one_column_template('combo_name', 'Combo Name', 'column', {'priority': 0, 'direction': 'ASC'})]


def combine_scenario_table_header_maps(combo_name_map, column_map, date_map, econ_cols, report_type):
    if 'cashflow' in report_type:
        return combo_name_map + column_map + date_map + econ_cols
    else:
        return combo_name_map + column_map + econ_cols


def create_scenario_table_header_template(well_headers: List[Dict], report_type: str, econ_cols: List[Dict],
                                          custom_headers: List[Dict]):
    column_map = create_scenario_table_header_column_map(well_headers, custom_headers)
    date_map = create_scenario_table_header_date_map(well_headers)
    combo_name_map = create_scenario_table_header_combo_name_map()

    column_mapping = combine_scenario_table_header_maps(combo_name_map, column_map, date_map, econ_cols, report_type)

    return fill_in_setting_template(
        SCENARIO_TABLE_HEADERS,
        column_mapping,
        report_type,
        cf_report_type=CF_REPORT_TYPE_MONTHLY,
    )


def get_custom_headers(context):
    configuration = context.custom_fields_service.get_custom_fields('wells')

    custom_headers = [get_one_column_template(key, configuration[key], 'header') for key in configuration.keys()]

    return sorted(custom_headers, key=lambda x: (x['key'].split('_')[1], float(x['key'].split('_')[2])))


def generate_default_csv_export_settings(context, run: Dict, scenario_table_headers: List[Dict]):
    monthly_econ_cols, one_liner_econ_cols = generate_econ_columns(run)
    custom_headers = get_custom_headers(context)

    default_settings = {}
    for report_type in TEMPLATE_HEADER_MAP_DICT:
        default_settings[report_type] = []
        econ_cols = monthly_econ_cols if 'cashflow' in report_type else one_liner_econ_cols
        for template_name in TEMPLATE_HEADER_MAP_DICT[report_type]:
            # CF_REPORT_TYPE key not exists for one liner settings
            cf_report_type = TEMPLATE_HEADER_MAP_DICT[report_type][template_name].get(CF_REPORT_TYPE)
            default_settings[report_type].append(
                create_setting_template(template_name, econ_cols, report_type,
                                        custom_headers if template_name == ONE_LINER_ALL_HEADERS else [],
                                        cf_report_type))
        if report_type != AGG_CF_KEY:
            default_settings[report_type].append(
                create_scenario_table_header_template(scenario_table_headers, report_type, econ_cols, custom_headers))

    return default_settings
