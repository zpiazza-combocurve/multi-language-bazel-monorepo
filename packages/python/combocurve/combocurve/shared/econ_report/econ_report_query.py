from bson import ObjectId
from combocurve.services.econ.econ_output_service import MONTHLY_TABLE_NAME, AGGREGATION_TABLE_NAME
from combocurve.science.econ.big_query import get_joined_one_liner_table_bq, JOINED_TABLE_NAME

AGGREGATION_GROUP = 'aggregation_group'
UNDISC_CF_KEY = 'before_income_tax_cash_flow'
DISC_CF_KEY = 'first_discount_cash_flow'
TOTAL_CAPEX_KEY = 'total_capex'
GROSS_WELL_COUNT_KEY = 'gross_well_count'
AFIT_CF = 'after_income_tax_cash_flow'
AFIT_DISC_CF = 'afit_first_discount_cash_flow'
DATE_KEY = 'date'

ROUND_DIGIT = 4

SPECIAL_COL_DICT = {
    "oil_price": {
        "numerator": "oil_revenue",
        "denominator": "net_oil_sales_volume"
    },
    "gas_price": {
        "numerator": "gas_revenue",
        "denominator": "net_gas_sales_volume"
    },
    "ngl_price": {
        "numerator": "ngl_revenue",
        "denominator": "net_ngl_sales_volume"
    }
}

DISCOUNT_TABLE_COLS = [f'discount_table_cash_flow_{i}' for i in range(1, 17)]
AFIT_DISCOUNT_TABLE_COLS = [f'afit_discount_table_cash_flow_{i}' for i in range(1, 17)]
BY_WELL_ONE_LINER_COLS = [
    'well_id', 'error', 'well_name', 'combo_name', 'inpt_id', 'api14', 'incremental_index', 'as_of_date',
    'discount_date', 'well_life', 'payout_duration', 'irr', 'original_wi_oil', 'afit_payout_duration', 'afit_irr',
    *DISCOUNT_TABLE_COLS, *AFIT_DISCOUNT_TABLE_COLS
]
WH_AGG_ONE_LINER_COLS = ['combo_name', *DISCOUNT_TABLE_COLS, *AFIT_DISCOUNT_TABLE_COLS]

MONTHLY_COLS = [
    DATE_KEY, GROSS_WELL_COUNT_KEY, 'gross_oil_well_head_volume', 'gross_gas_well_head_volume',
    'gross_boe_well_head_volume', 'net_oil_sales_volume', 'net_gas_sales_volume', 'net_ngl_sales_volume', 'oil_price',
    'gas_price', 'ngl_price', 'oil_revenue', 'gas_revenue', 'ngl_revenue', 'total_revenue', 'total_expense',
    'total_severance_tax', 'ad_valorem_tax', 'total_capex', 'net_profit', 'before_income_tax_cash_flow',
    'first_discount_cash_flow', 'total_deductions', 'state_income_tax', 'federal_income_tax',
    'after_income_tax_cash_flow', 'afit_first_discount_cash_flow'
]

AGG_WH_COL = ['combo_name', AGGREGATION_GROUP]
BY_WELL_WH_COL = ['combo_name', 'well_id', 'incremental_index']


def get_well_ids_filter(well_ids):
    well_ids_str = ','.join((f'"{well_id}"' for well_id in well_ids))
    return f' AND well_id IN ({well_ids_str})'


def get_one_liner_query_by_well(context, run_id_str, run_date, well_ids=None):
    '''
    when grouped by res cat model, the aggregation happens on local currently
    '''
    select_string = ', '.join(BY_WELL_ONE_LINER_COLS + ['econ_group'])

    where_str = f'run_id="{run_id_str}" AND run_date="{run_date}"'
    if well_ids:
        where_str += get_well_ids_filter(well_ids)

    query_str = f'SELECT {select_string} FROM `{JOINED_TABLE_NAME}` WHERE {where_str}'

    table_join_query = get_joined_one_liner_table_bq(context, run_id_str, run_date)
    query_str = table_join_query + ' ' + query_str

    return query_str


def get_one_liner_query_agg_well_head(context, run_id_str, run_date, group_by_cols, well_ids=None):
    '''
    when grouped by well headers: aggregate one liner based on group_by_cols
    '''
    select_str = ''
    for col in WH_AGG_ONE_LINER_COLS + group_by_cols:
        if col in group_by_cols + ['combo_name']:
            select_str += f'{col}, '
        elif (col in DISCOUNT_TABLE_COLS) or (col in AFIT_DISCOUNT_TABLE_COLS):
            select_str += f'SUM({col}) AS {col}, '

    if len(group_by_cols) == 0:
        select_str += '"all wells" as aggregation_group'
    else:
        select_str += ' || ", " || '.join([f'LOWER(COALESCE({g}, \'NULL\'))'
                                           for g in group_by_cols]) + ' AS aggregation_group'

    where_str = f'run_id="{run_id_str}" AND run_date="{run_date}"'
    if well_ids:
        where_str += get_well_ids_filter(well_ids)

    query_str = f'SELECT {select_str} FROM `{JOINED_TABLE_NAME}` WHERE {where_str}'

    query_str += ' GROUP BY combo_name'
    if len(group_by_cols) > 0:
        query_str += ', ' + ', '.join(group_by_cols)

    table_join_query = get_joined_one_liner_table_bq(context, run_id_str, run_date)
    query_str = table_join_query + ' ' + query_str

    return query_str


def get_monthly_query_str(project_id, dataset_id, run_id_str, run_date, report_type, well_ids=None):
    # query monthly col for TOTAL_CAPEX_KEY, UNDISC_CF_KEY, DISC_CF_KEY
    where_str = f'run_id="{run_id_str}" AND run_date="{run_date}"'

    select_string = 'date, combo_name'
    if report_type == 'by_well':  # TODO option not activated now, need to update for incremental
        table_path = f'{project_id}.{dataset_id}.{MONTHLY_TABLE_NAME}'
        select_string += ', well_id, incremental_index'
        if well_ids:
            where_str += get_well_ids_filter(well_ids)
    else:
        table_path = f'{project_id}.{dataset_id}.{AGGREGATION_TABLE_NAME}'
        select_string += f', {AGGREGATION_GROUP}'

    select_string += f', {TOTAL_CAPEX_KEY}, {UNDISC_CF_KEY}, {DISC_CF_KEY}, {AFIT_CF}, {AFIT_DISC_CF}'

    query_str = f'SELECT {select_string}  FROM `{table_path}` WHERE {where_str} ORDER BY combo_name, date ASC'

    return query_str


def unit_to_multiplier(unit):
    if unit in ['BBL', 'MCF', '$', '$/BBL', '$/MCF'] or unit is None or unit == '':
        multiplier = 1
    elif unit == '%':
        multiplier = 100
    elif unit in ['MBBL', 'MMCF', 'M$']:
        multiplier = 1 / 1000
    elif unit in ['MMBBL', 'BCF', 'MM$']:
        multiplier = 1 / 1000000
    elif unit == 'GAL':
        multiplier = 42
    elif unit == 'MGAL':
        multiplier = 42 / 1000
    elif unit == 'MMGAL':
        multiplier = 42 / 1000000
    else:
        raise Exception('Unexpected unit!')

    return multiplier


def get_yearly_query_str(
    project_id,
    dataset_id,
    run_id_str,
    run_date,
    report_type,
    reporting_units,
    fiscal=None,
    well_ids=None,
):
    cash_unit = reporting_units['cash']

    where_str = f'run_id="{run_id_str}" AND run_date="{run_date}"'

    special_keys = list(SPECIAL_COL_DICT.keys())
    if report_type == 'by_well':  # TODO option not activated now, need to update for incremental
        well_header_list = BY_WELL_WH_COL
        table_path = f'{project_id}.{dataset_id}.{MONTHLY_TABLE_NAME}'
        group_by_col = ' well_id, incremental_index'
        if well_ids:
            where_str += get_well_ids_filter(well_ids)
    else:
        well_header_list = AGG_WH_COL
        table_path = f'{project_id}.{dataset_id}.{AGGREGATION_TABLE_NAME}'
        group_by_col = AGGREGATION_GROUP

    if fiscal:
        fiscal_start = int(fiscal[0]) + 1
        construct_fiscal_str = f'IF (EXTRACT(MONTH FROM date) >= {fiscal_start}, EXTRACT(YEAR FROM date)+1, EXTRACT(YEAR FROM date)) AS year, '  # noqa E501

    select_string = ''

    for col_key in well_header_list:
        if col_key in ['combo_name', AGGREGATION_GROUP, 'well_id', 'incremental_index']:
            add_str = f'{col_key}, '
        else:
            add_str = f'ANY_VALUE({col_key}) AS {col_key}, '
        select_string = select_string + add_str

    for col_key in MONTHLY_COLS:
        if col_key == DATE_KEY:
            if fiscal:
                add_str = construct_fiscal_str
            else:
                add_str = 'EXTRACT(YEAR FROM date) AS year, '
        elif col_key == 'gross_well_count':
            # no rounding due to this col should always be integer
            add_str = f'ROUND(MAX({col_key})) AS {col_key}, '
        elif col_key in special_keys:
            num_key = SPECIAL_COL_DICT[col_key]['numerator']
            den_key = SPECIAL_COL_DICT[col_key]['denominator']

            phase = col_key.replace('_price', '')
            phase_vol_unit = reporting_units[phase]
            multiplier = unit_to_multiplier(phase_vol_unit) / unit_to_multiplier(cash_unit)
            multiply_str = f' * {multiplier}'

            add_str = f'ROUND(IF(SUM({den_key}) = 0, AVG({num_key}), (SUM({num_key})/SUM({den_key})){multiply_str}), {ROUND_DIGIT}) AS {col_key}, '  # noqa E501
        else:
            add_str = f'ROUND(SUM({col_key}), {ROUND_DIGIT}) AS {col_key}, '

        select_string = select_string + add_str

    group_by_str = f'combo_name, {group_by_col}, year'
    query_str = f'SELECT {select_string}  FROM `{table_path}` WHERE {where_str} GROUP BY {group_by_str} ORDER BY {group_by_str} ASC'  # noqa #E501

    return query_str


def get_run_data(context, econ_run_id, well_ids=None):
    well_match = {'run': ObjectId(econ_run_id), 'well': {'$exists': 1}}
    group_match = {'run': ObjectId(econ_run_id), 'well': {'$exists': 1}}

    if well_ids is not None:
        well_match['well'] = {'$in': [ObjectId(id) for id in well_ids]}

    well_run_datas_pipeline = [{
        '$match': well_match
    }, {
        '$lookup': {
            'from': 'wells',
            'localField': 'well',
            'foreignField': '_id',
            'as': 'well',
        }
    }, {
        '$unwind': '$well',
    }]

    group_datas_pipeline = [{
        '$match': group_match,
    }, {
        '$lookup': {
            'from': 'econ-groups',
            'localField': 'group',
            'foreignField': '_id',
            'as': 'well',
        }
    }, {
        '$unwind': '$well',
    }]

    well_run_datas_list = list(context.economic_data_collection.aggregate(well_run_datas_pipeline))
    group_run_datas_list = list(context.economic_data_collection.aggregate(group_datas_pipeline))

    run_datas_list = well_run_datas_list + group_run_datas_list

    return run_datas_list
