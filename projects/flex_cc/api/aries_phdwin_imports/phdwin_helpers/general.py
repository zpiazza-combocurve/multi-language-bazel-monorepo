import copy
import datetime
import pandas as pd

from bson.objectid import ObjectId
from combocurve.shared.aries_import_enums import CCSchemaEnum, EconEnum

ALL_CASES = 'All Cases'


def merge_two_dicts(x, y):
    """Given two dicts, merge them into a new dict as a shallow copy."""
    """key in y will overwrite key in x"""
    z = x.copy()
    z.update(y)
    return z


def get_phdwin_fpd_from_model_document(document, lease_id_to_sop_dic, lease_to_well_id):
    fpd = None
    for well in document['wells']:
        lease_id = [k for k, v in lease_to_well_id.items() if str(v) == str(well)]
        if len(lease_id) == 1:
            lease_id = lease_id[-1]

            fpd = lease_id_to_sop_dic.get(lease_id)
    return pd.to_datetime(fpd, errors='coerce')


def set_phdwin_end_date_to_econ_limit(rows):
    for row in rows:
        if 'dates' in row and row['dates']['end_date'] == '2262-04-11':
            row['dates']['end_date'] = 'Econ Limit'

    return rows


def get_date_obj(document):
    '''
    Input:
    document (dictionary): Formatted PHDWin expense document with start_date key with either date format or FPD
    e.g. 2021-01-21, FPD_36, ASOF

    Output:
    date obj (dictionary): Date Object that corresponds with the start_date format
    '''
    if document[CCSchemaEnum.start_date.value] is not None:
        value = str(document[CCSchemaEnum.start_date.value]).split('_')[0]
        if value in STATIC_PHDWIN_DATES_DICT:
            return copy.deepcopy(STATIC_PHDWIN_DATES_DICT[value])
        else:
            return copy.deepcopy(date_obj)


DOLLAR_PER_VOL_CONV_DICT = {'gal': 42, 'mgal': 42 / 1000}

date_obj = {CCSchemaEnum.dates.value: {CCSchemaEnum.start_date.value: '', CCSchemaEnum.end_date.value: ''}}

STATIC_PHDWIN_DATES_DICT = {
    EconEnum.fpd.value: {
        EconEnum.fpd_offset.value: {
            CCSchemaEnum.start.value: '',
            CCSchemaEnum.end.value: '',
            EconEnum.period.value: ''
        }
    },
    EconEnum.asof.value: {
        EconEnum.asof_offset.value: {
            CCSchemaEnum.start.value: '',
            CCSchemaEnum.end.value: '',
            EconEnum.period.value: ''
        }
    }
}


def generate_default_econ_settings():
    default_econ_settings_columns = [
        'maxecoyears', 'defcurrency', 'fiscaleco', 'endmoneco', 'numcompound', 'disfact', 'defconvention', 'income_tax',
        'forwhom', 'startdate', 'discount_date', 'as_of_date', 'discount_date_year', 'discount_date_month',
        'discount_date_day', 'as_of_date_year', 'as_of_date_month', 'as_of_date_day'
    ]
    default_econ_settings_value = [[
        50, 'USD', 0, 1, 1, 10.0, 1, 0.0, 'USA FEDERAL', 81088, None, f'{datetime.datetime.now().year}-01-01', 0, 0, 0,
        2023, 1, 1
    ]]
    return pd.DataFrame(default_econ_settings_value, columns=default_econ_settings_columns)


def format_for_matching(string):
    return str(string).strip().lower()


def get_well_and_grp_id_for_swa(primary_id, grp_ids):
    if type(primary_id) is tuple:
        well_primary_id = primary_id[0]
        use_grp_ids = [primary_id[1]]
    else:
        well_primary_id = primary_id
        use_grp_ids = grp_ids

    return well_primary_id, use_grp_ids


def get_partnership_dict(grp_df, scenarios):
    formated_scenarios = [str(scenario).strip().lower() for scenario in scenarios]
    grp_df['Grp Desc formated'] = grp_df['Grp Desc'].astype(str).str.strip().str.lower()

    filtered_grp_df = grp_df[grp_df['Grp Desc formated'].isin(formated_scenarios)]

    grp_id_scenario_dict = pd.Series(filtered_grp_df['Grp Desc'].astype(str).str.strip().values,
                                     index=filtered_grp_df['Grp Id'].values).to_dict()

    if len(grp_id_scenario_dict) == 0:
        grp_id_scenario_dict = {1: 'All Cases'}
    return grp_id_scenario_dict


def get_model_name(model_name, document, phd_model_name=None):

    if phd_model_name is None or str(phd_model_name).strip() == '':
        qualifier = f'PHD_CC_{document[CCSchemaEnum.assumption_key.value].upper()}'
    else:
        qualifier = str(phd_model_name).strip().upper()

    model_sub_names = model_name.split('*&*')
    if qualifier not in model_sub_names:
        model_sub_names.append(str(qualifier).upper())
        if '' in model_sub_names:
            model_sub_names.remove('')
        model_sub_names.sort()
        model_name = '*&*'.join(model_sub_names)
    return model_name


def convert_well_headers_date(date):
    date = pd.to_datetime(date, errors='coerce')

    if pd.isnull(date):
        return None
    else:
        year = date.year
        month = date.month
        day = date.day

        if year == 1800:
            return None
        else:
            return datetime.date(year, month, day).strftime("%Y-%m-%d")


def get_dictionary(name):
    return copy.deepcopy(PHDWIN_CONV_DICTIONARY)[name]


def get_forecast_incremental_index(lse_id, model_document, parent_incremental_dict, lse_to_db_id):
    """Get the incremental index (number)

    Args:
        lse_id (str|int): Lease id of current well
        model_document (dictionary): forecast data dictionary containing forecast info
        parent_incremental_dict (dictionary): Dictionary containing the parent lease number as key and its associated
                                              incremental lease numbers (list) as values
        lse_to_db_id (dictionary): Dictionary with key as lease id and value as the well_id (mongo)

    Returns:
       None if forecast is not incremental else (int) incremental number assigned to the incremental
    """
    # initiate incremental index
    incremental_index = None

    # loop through parent_incremental_dict
    for parent_lse_id, incr_lse_ids in parent_incremental_dict.items():
        # if the current well is an incremental, check what position it is in the list
        # the position is used to identify which incremental to use
        if str(lse_id) in incr_lse_ids:
            incremental_index = incr_lse_ids.index(str(lse_id))
            # change forecast assignment from incremental well to parent well
            model_document['well'] = ObjectId(lse_to_db_id.get(parent_lse_id))

    return incremental_index


def replace_incremental_well_forecast_to_parent(forecasts_ls, parent_incremental_dict, lse_to_db_id):
    """Replace incremental wells in forecast with Parent well

    Args:
        forecasts_ls (list): List of Forecast documents
        parent_incremental_dict (dictionary): Dictionary containing the parent lease number as key and its associated
                                              incremental lease numbers (list) as values
        lse_to_db_id  (dictionary): Dictionary with key as lease id and value as the well_id (mongo)

    Returns:
        list: List of updated Forecast documents (replaced increment wells with parent wells)
    """
    for parent_lse_id, incr_lse_ids in parent_incremental_dict.items():
        for incr_lse_id in incr_lse_ids:
            for forecast_doc in forecasts_ls:
                well_id = lse_to_db_id.get(incr_lse_id)
                if well_id is not None:
                    if ObjectId(well_id) in forecast_doc['wells']:
                        forecast_doc['wells'].remove(ObjectId(well_id))
                        parent_well_id = lse_to_db_id.get(parent_lse_id)
                        if parent_well_id is not None:
                            set_forecast_wells = set(forecast_doc['wells'])
                            set_forecast_wells.add(ObjectId(parent_well_id))
                            forecast_doc['wells'] = list(set_forecast_wells)
                            break
    return forecasts_ls


def create_incrementals_in_scenario_well_assignment(scenario_well_assignments_dic, parent_incremental_dict,
                                                    lse_to_db_id):
    """Set incremental scenario well assignment to Parent and set index to 1

    Args:
        scenario_well_assignments_dic (dictionary): scenario_well_docs as value and the scenario id as key
        parent_incremental_dict (dictionary): Dictionary containing the parent lease number as key and its associated
                                          incremental lease numbers (list) as values
        lse_to_db_id (dictionary): Dictionary with key as lease id and value as the well_id (mongo)

    Returns:
        dictionary: scenario_well_docs as value and the scenario id as key
    """

    # loop through parent_incremental_dict
    for parent_lse_id, incr_lse_ids in parent_incremental_dict.items():
        # loop through all the incremental lease numbers (stop at number 1)
        for incr_lse_id in incr_lse_ids:
            # check for incremental well id and replace with parent id and change index to 1
            for scenario_well_assignment in scenario_well_assignments_dic.values():
                if str(lse_to_db_id.get(incr_lse_id)) == str(scenario_well_assignment['well']):
                    scenario_well_assignment['well'] = ObjectId(lse_to_db_id.get(parent_lse_id))
                    scenario_well_assignment['index'] = 1
                    break
            break

    return scenario_well_assignments_dic


def update_scenario_doc_if_incremental(scenarios_filled_default_document, parent_incremental_dict, lse_to_db_id):
    """Remove incremental well(s) from scenario document

    Args:
        scenarios_filled_default_document (dictionary): document containing the scenario info
        parent_incremental_dict (dictionary): Dictionary containing the parent lease number as key and its associated
                                          incremental lease numbers (list) as values
        lse_to_db_id (dictionary): Dictionary with key as lease id and value as the well_id (mongo)

    Returns:
        dictionary: updated scenario document (if necessary)
    """
    # get incremental well_ids
    well_ids_to_del = [
        ObjectId(lse_to_db_id.get(incr_lse_id)) for incr_lse_ids in parent_incremental_dict.values()
        for incr_lse_id in incr_lse_ids if lse_to_db_id.get(incr_lse_id) is not None
    ]

    # remove identified wells from scenario document
    for well_id in well_ids_to_del:
        if well_id in scenarios_filled_default_document['wells']:
            scenarios_filled_default_document['wells'].remove(well_id)

    return scenarios_filled_default_document


def incremental_progress_on_import(prog_range, no_of_wells, curr_idx, progress):
    current_increment = int(((prog_range[1] - prog_range[0]) / no_of_wells) * (curr_idx + 1))
    current_progress = prog_range[0] + current_increment
    progress.notify(current_progress)


PHDWIN_CONV_DICTIONARY = {
    # creat Type: Type Name dictionary, the type number is still not complete
    # missing type: 2, 9, 10, 11
    'Type': {
        1: 'Price',
        3: 'Scheduled Well Expense (Well Cost)',
        4: 'Scheduled Monthly Expense (Fixed Cost)',
        5: 'Operating Cost Model (Variable Expense)',
        6: 'Trans Cost Model (Variable Expense)',
        8: 'Other Cost Model (Variable Expense)',
        9: 'Well Cost',
        10: 'Fixed Cost',
        15: 'State Tax Model (Severance Tax)',
        16: 'Local Tax Model (Ad Val Tax)',
        17: 'Shrink Models (Shrinkage)',
        18: 'Escalations (Escalation Model)'
    },
    # creat 'startdate', number : (tax, price and expense) mapping, ex. 0 : asof
    # still don't understand: -2, -3, -4, -6
    'Tax': {
        0: 'asof',
        -1: 'asof',
        -2: 'majseg1',
        -3: 'minseg1',
        -4: 'prodseg1',
        -5: 'majdecl1',
        -6: 'starthist',
        -7: 'endhist',
        -8: 'firstprod'
    },
    # modpointer(LPV.csv) == mpv id(MPV.csv), still don't understand: 0, 65536

    # create month dictionary, for create montly_production format
    'Month': {
        1: 'January',
        2: 'February',
        3: 'March',
        4: 'April',
        5: 'May',
        6: 'June',
        7: 'July',
        8: 'August',
        9: 'September',
        10: 'October',
        11: 'November',
        12: 'December'
    },

    # create productcode dictionary map to unitstr, for create LSG prices_taxes_expense_lsg format
    'LSG_productcode_unitstr': {
        'WATER': 'bbl',
        'DAYS': 'case',
        'WELL COST': 'case',
        'NGL': 'bbl',
        'OIL': 'bbl',
        'GAS': 'Mcf'
    },

    # creat productcode dictionary map to currency, for create LSG prices_taxes_expense_lsg format
    'LSG_productcode_currency': {
        'WATER': 'USD',
        'DAYS': 'USD',
        'WELL COST': 'USD',
        'NGL': 'USD',
        'OIL': 'USD',
        'GAS': 'USD'
    },

    # create revtype dictionary map to description, for create OWN ownership format
    'OWN_revtype_descr': {
        1: 'Net m$',
        2: 'Time yr',
        5: 'Payout',
        6: 'Date',
        7: 'Add Wrk Int',
        8: 'Mult Wrk Int',
        9: 'Net m$ (w/inv)',
        10: 'Payout (w/inv)',
        11: 'Cum Gas',
        12: 'Cum Oil',
        13: 'Add Roy Int',
        14: 'Mult Roy Int'
    },

    # create Gcarecoveryterm dictionary map to depreciation, for create CAPEX format
    # 0: 'No', larger than 0: 'Yes'
    # note: this dictionary would not be used possibily
    'CAPEX_Gcarecoveryterm_depreciation': {
        0: 'No'
    },

    # in forecast function to offer extra self-defined dictionary as supply to Seq_Abbrev_dict in ARC.csv table
    'Seq_Abbrev_dict': {
        65534: 'default1',
        65535: 'default2'
    },

    # 01/09/2020 dictionary for fiscal year mapping
    'fiscal_dic': {
        '01': '0-11',
        '02': '1-0',
        '03': '2-1',
        '04': '3-2',
        '05': '4-3',
        '06': '5-4',
        '07': '6-5',
        '08': '7-6',
        '09': '8-7',
        '10': '9-8',
        '11': '10-9',
        '12': '11-10'
    }
}
