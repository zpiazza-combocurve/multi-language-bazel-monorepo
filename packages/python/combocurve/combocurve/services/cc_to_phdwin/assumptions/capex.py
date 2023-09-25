from combocurve.services.cc_to_phdwin.helpers import (fill_in_with_default_assumptions, get_key_well_properties,
                                                      update_export_progress)
from combocurve.science.econ.pre_process import header_idx_to_dates, schedule_idx_to_dates
from datetime import datetime, timedelta
import pandas as pd

# possible function to pull rate date?
# from combocurve.science.econ.econ_model_rows_process import rate_rows_process

RECOGNIZED_CC_PHDWIN_CAPEX_DATE_CRITERIA = [
    'offset_to_as_of_date', 'offset_to_econ_limit', 'offset_to_fpd', 'offset_to_first_segment'
]

CC_TO_PHD_DATE_FORMAT_CONVERSION = {
    'offset_to_as_of_date': 'AsOf',
    'offset_to_econ_limit': 'Ecl',
    'offset_to_fpd': 'FirstProd{MAJ}',
    'offset_to_first_segment': 'Seg1{MAJ}'
}

# Non-supported formats will export as a date instead of linked value
NON_SUPPORTED_CC_PHDWIN_DATE_CRITERIA = [
    'date', 'oil_rate', 'gas_rate', 'water_rate', 'total_fluid_rate', 'fromSchedule', 'fromHeaders',
    'offset_to_discount_date'
]

PHDWIN_CAPEX_PHD_COLUMNS = [
    'Case Name', 'State', 'County', 'Field', 'Unique Id', 'PHDWIN Id(Key)', 'Original Partnership(Key)', 'No(Auto key)',
    'Description', 'Category', 'Initial Date', 'Cost', 'Include Amounts', 'Tangible', 'Intangible', 'Risk Tree',
    'Inv Multiplier', 'After Tax Treatment', 'In Service'
]

CC_TO_PHD_CAPEX_CATEGORIES = {
    'drilling': 'Drilling',
    'completion': 'Completion',
    'abandonment': 'Abandonment',
    'salvage': 'Salvage',
    'development': 'Development',
    'exploration': 'Exploration',
    'workover': 'Workover'
}


def pull_external_date(row: dict, criteria: str, well_header: dict, schedule: dict):
    """Append header date to given row

    Args:
        row (dict): dictionary of current well's data
        criteria (str): type of date being pulled
        well_header (dict): dictionary of the current well's headers
        schedule (dict): dictionary of the current well's schedule

    Returns:
        external_date(str): date value of specified criteria
        valid(boolean): True/False if the current row is valid
    """
    valid = False
    if criteria == 'fromHeaders':
        if well_header:
            lookup_phrase = row.get(criteria)
            external_date = header_idx_to_dates(well_header).get(lookup_phrase, '')
            valid = True
        else:
            return '', False
    elif criteria == 'fromSchedule':
        if schedule:
            lookup_phrase = row.get(criteria)
            external_date = schedule_idx_to_dates(schedule).get(lookup_phrase, '')
            valid = True
        else:
            return '', False
    else:
        external_date = ''

    if external_date == '' or external_date is None:
        valid = False

    return str(external_date), valid


def add_offset(start_date: float, offset: str):
    """Shift date by offset.

    Args:
        start_date (float): date value to shift
        offset (str): number of days to shift by

    Returns:
        str: Formatted date m/d/y
    """
    try:
        offset = int(float(offset))
    except (ValueError, TypeError):
        offset = 0

    try:
        date_formatted = datetime.strptime(start_date, '%m/%d/%Y')
    except ValueError:
        # catch format mismatch
        return start_date

    date_formatted = date_formatted + timedelta(days=float(offset))

    return datetime.strftime(date_formatted, '%m/%d/%Y')


def validate_and_standardize_row(row: dict, date_dict: dict, schedule: dict, well_header: dict,
                                 use_asof_reference: bool):
    """Check current row for valid model and standardize date format

    Args:
        row (dict): dictionary of current well's data
        date_dict (dict): dict of key dates for the well
        well_header (dict): dictionary of the current well's headers
        schedule (dict): dictionary of the current well's schedule
        use_asof_reference (bool): True/False if AsOf can be linked to or requires direct date

    Returns:
        boolean: True/False if current row can be exported
        string: Date key phrase for PHD Win. May contain the linking phrase for PHD or a direct date
        boolean: True/False if current row uses a linked phrase to PHD
        string: Description key representing the CC category
        string: Description key representing the PHD Win category
        offset: Number of days to shift from start date
    """
    # set initial values
    valid = False
    can_be_referenced = False
    criteria = None
    description = row.get('category', '')

    if description in CC_TO_PHD_CAPEX_CATEGORIES:
        category = CC_TO_PHD_CAPEX_CATEGORIES[description]
    else:
        category = 'None'
    offset = ''
    phd_criteria = ''

    # process linked dates supported by PHD to link keyword
    if any(key in RECOGNIZED_CC_PHDWIN_CAPEX_DATE_CRITERIA for key in row):
        criteria = next(key for key in row if key in RECOGNIZED_CC_PHDWIN_CAPEX_DATE_CRITERIA)
        phd_criteria = CC_TO_PHD_DATE_FORMAT_CONVERSION[criteria]
        offset = row.get(criteria, '')
        can_be_referenced = True
        valid = True

        if criteria == 'offset_to_as_of_date':
            if not use_asof_reference:
                can_be_referenced = False
                phd_criteria = date_dict.get(criteria)
                try:
                    phd_criteria = datetime.strftime(datetime.strptime(phd_criteria, '%Y-%m-%d'), '%m/%d/%Y')
                except ValueError:
                    # add warning for invalid date format in DB
                    pass
                if offset != '':
                    phd_criteria = add_offset(phd_criteria, offset)

    # process linked dates not supported by PHD to date value
    elif any(key in NON_SUPPORTED_CC_PHDWIN_DATE_CRITERIA for key in row):
        criteria = next(key for key in row if key in NON_SUPPORTED_CC_PHDWIN_DATE_CRITERIA)
        phd_criteria = ''
        can_be_referenced = False
        valid = True

        if criteria == 'date':
            phd_criteria = row.get(criteria)
            try:
                phd_criteria = datetime.strftime(datetime.strptime(phd_criteria, '%Y-%m-%d'), '%m/%d/%Y')
            except ValueError:
                # add warning for invalid date format in DB
                pass

        elif criteria in ['fromSchedule', 'fromHeaders']:
            phd_criteria, valid = pull_external_date(row, criteria, well_header, schedule)
            try:
                phd_criteria = datetime.strftime(datetime.strptime(phd_criteria, '%Y-%m-%d'), '%m/%d/%Y')
            except ValueError:
                # add warning for invalid date format in DB
                pass
            offset = row.get(row.get(criteria, {''}), '')
            if valid and offset != '':
                phd_criteria = add_offset(phd_criteria, offset)

        elif criteria == 'offset_to_discount_date':
            phd_criteria = date_dict.get(criteria)
            try:
                phd_criteria = datetime.strftime(datetime.strptime(phd_criteria, '%Y-%m-%d'), '%m/%d/%Y')
            except ValueError:
                # add warning for invalid date format in DB
                pass
            offset = row.get(criteria, '')
            phd_criteria = add_offset(phd_criteria, offset)

        elif 'rate' in criteria:
            # getting date from rate criteria requires running economics.
            # need to implement later, log a warning for now and skip row
            valid = False
        else:
            # add warning for uncaught criteria
            valid = False
    else:
        # add warning for uncaught criteria
        valid = False

    return valid, phd_criteria, can_be_referenced, description, category, offset


def append_capex(headers: tuple, row: dict, phd_capex_table: list[list], be_referenced: bool, offset: str,
                 description: str, category: str, phd_criteria: str):
    """Combine data into PHD row and append to capex table

    Args:
        headers (tuple): dictionary of well headers
        row (dict): current capex row being processed
        phd_capex_table (list[list]): table holding processed capex rows
        be_referenced (boolean): true/false indicating if PHD can use as a linked date
        offset (str): offset value to be added to the phd_criteria
        description (str): CC category name
        category (str): PHD category name
        phd_criteria (str): date/linked date value for PHD
    """
    user_chosen_identifier, well_name, state, county, field = headers
    if be_referenced and offset != '':
        try:
            offset = int(float(offset))
            phd_criteria = phd_criteria + f' ({offset})'
        except (ValueError, TypeError):
            pass

    calculation = row.get('calculation', 'gross')
    if calculation == 'gross':
        calculation = 'G'
    elif calculation == 'net':
        calculation = 'N'
    else:
        # throw warning for uncaught calculation type
        pass
    tangible = row.get('tangible', '0')
    intangible = row.get('intangible', '0')
    multiplier = row.get('deal_terms', '0')
    phd_capex_table.append([
        well_name, state, county, field, None, user_chosen_identifier, '1', '',
        ' '.join([item.title() for item in description.split('_')]), category, phd_criteria, calculation, 'Y', tangible,
        intangible, 'Inherited', multiplier, 'Treat As Expense', '0'
    ])


def process_phdwin_capex(headers: tuple, capex_rows: list[dict], phd_table: list[list], well_date_dict: dict,
                         schedule: dict, well_header: dict, use_asof_reference: bool):
    """Loop through CC capex rows to process for current well

    Args:
        headers (tuple): tuple of headers for current well
        capex_rows (list[dict]): list of capex rows
        phd_table (list[list]): list of rows that have been processed
        well_date_dict (dict): dictionary of key dates shared between multiple assumptions
        assumption_name (str): name of CC model being processed
        well_header (dict): dictionary of the current well's headers
        schedule (dict): dictionary of the current well's schedule
        use_asof_reference (bool): True/False if AsOf can be linked to or requires direct date
    """
    # loop through capex rows and append to phd_table if row is valid for conversion
    for idx, capex_row in enumerate(capex_rows):

        # standardize date values of current row
        valid, phd_criteria, be_referenced, description, category, offset = validate_and_standardize_row(
            capex_row, well_date_dict, schedule, well_header, use_asof_reference)

        # append new row if valid row values pulled
        if valid:
            append_capex(headers, capex_row, phd_table, be_referenced, offset, description, category, phd_criteria)


def create_phdwin_capex_table(context,
                              notification_id: str,
                              user_id: str,
                              date_dict: dict,
                              well_order_list: list,
                              well_data_list: list[dict],
                              progress_range: list,
                              user_key=None,
                              error_log=None,
                              use_asof_reference: bool = False):
    """Loop through wells to extract capex

    Args:
        context (context): context to current process
        notification_id (str): ID representing notification in Mongo
        user_id (str): ID representing user in Mongo
        date_dict (dict): dictionary containing shared key dates between assumptions
        well_order_list (list): list indicating order of wells
        well_data_list (list[dict]): list containing dictionaries of data for each well
        progress_range (list): list containing min/max range of progress updating for Capex section
        use_asof_reference (bool): True/False if AsOf can be linked to or requires direct date

    Returns:
        list[list]: list of Capex rows formatted for PHD excel editor
    """
    phd_capex_table = []
    no_wells = len(well_order_list)
    for index, well_order in enumerate(well_order_list):
        try:
            # update progress (make a shared function)
            update_export_progress(context, progress_range, no_wells, index, user_id, notification_id)

            # get well and assumption property
            well_data = well_data_list[well_order]

            assumptions = well_data['assumptions']

            well_header = well_data['well']
            schedule = well_data.get('schedule')

            # not being used here
            # schedule = well_data.get('schedule')

            # fill in default assumption if assumption is missing
            fill_in_with_default_assumptions(assumptions)

            key_well_header_props = get_key_well_properties(well_header, date_dict, user_key)
            (chosen_id, user_chosen_identifier, county, well_name, state, field, well_date_dict) = key_well_header_props

            capex_assumptions = assumptions.get('capex')
            assumption_name = capex_assumptions.get('name')

            if assumption_name is None:
                continue

            # get rows containing each line of capex data to extract, default to empty list if not found
            capex_assumption_rows = capex_assumptions.get('other_capex', {'rows': []}).get('rows', [])

            # process capex lines
            process_phdwin_capex((user_chosen_identifier, well_name, state, county, field), capex_assumption_rows,
                                 phd_capex_table, well_date_dict, schedule, well_header, use_asof_reference)
        except Exception:
            error_log.log_error(well_name=well_name, chosen_id=chosen_id, assumption='CAPEX')

        # convert capex table to a pandas dataframe with PHD column headers

    phd_capex_table = pd.DataFrame(phd_capex_table, columns=PHDWIN_CAPEX_PHD_COLUMNS)

    return (phd_capex_table, )
