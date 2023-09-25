from combocurve.services.cc_to_phdwin.helpers import (fill_in_with_default_assumptions, get_key_well_properties,
                                                      update_export_progress, round_to_limit)
from datetime import datetime
from dateutil.relativedelta import relativedelta
import pandas as pd

CC_TO_PHD_REVERSION_FORMAT_CONVERSION = {
    'payout_with_investment': 'Net w/inv',
    'payout_without_investment': 'Payout',
    'well_head_gas_cum': 'Cum Gas',
    'well_head_oil_cum': 'Cum Oil',
}

# Non-supported formats will export as a date instead of linked value
NON_SUPPORTED_CC_PHDWIN_DATE_CRITERIA = ['date', 'irr', 'roi_undisc', 'offset_to_as_of_date', 'well_head_boe_cum']

PHDWIN_REVERSION_PHD_COLUMNS = [
    'Case Name', 'State', 'County', 'Field', 'Unique Id', 'PHDWin Id(Key)', 'Number(Auto key)', 'Reversion Type',
    'Reversion Value', 'Wrk Int.', 'Rev Int.', 'Lease NRI', 'Net Profits', 'Group Reversion', 'Adj[CONDENSATE]',
    'Adj[GAS]', 'Adj[NGL]', 'Adj[OIL]'
]


def percent_to_decimal(value: str):
    """Convert string percentage to string decimal

    Args:
        value (str): percentage value
    Returns:
        str: value divided by 100
    """
    try:
        value = str(float(value) / 100)
    except (ValueError, TypeError):
        # keep value as is if it can not be converted
        pass
    return value


def add_month_offset(start_date: float, month_offset: str):
    """Add given months to start date

    Args:
        start_date (float): date value to shift
        offset (str): number of months to shift by
    Returns:
        str: Formatted m/d/y
    """
    try:
        offset = int(float(month_offset))
    except (ValueError, TypeError):
        offset = 0

    try:
        date_formatted = datetime.strptime(start_date, '%m/%d/%Y')
    except ValueError:
        # catch format mismatch
        return start_date

    date_formatted = date_formatted + relativedelta(months=float(offset))

    return datetime.strftime(date_formatted, '%m/%d/%Y')


def process_linked_criteria(reversion: dict, nri: str, balance: str):
    """Process linked criteria

    Args:
        reversion (dict): dictionary of reversion values
        nri (str): Net Revenue Interest in percentage
        balance (str): Gross/net for reversion value

    Returns:
        bool: True/False if current row is valid
        str: value/date of when reversion triggers
        str: criteria for current reversion
    """
    criteria = next(key for key in reversion if key in CC_TO_PHD_REVERSION_FORMAT_CONVERSION)
    valid = True
    phd_criteria = CC_TO_PHD_REVERSION_FORMAT_CONVERSION.get(criteria)
    reversion_value = reversion.get(criteria, '')

    # TO BE HANDLED IN THE FUTURE: KEEPING THE CODE STRUCTURE!
    # PHD only reads Payouts as net and Cum Volumes as gross
    if criteria in ['payout_with_investment', 'payout_without_investment']:
        valid = False
    elif criteria in ['well_head_gas_cum', 'well_head_oil_cum']:
        valid = False
    else:
        # throw warning for uncaught criteria
        valid = False
    return valid, reversion_value, phd_criteria


def process_unlinked_criteria(reversion: dict, well_date_dict: dict):
    """Process unlinked criteria type for PHD into date values.

    Args:
        reversion (dict): dictionary of reversion properties
        well_date_dict (dict): dictionary of key dates

    Returns:
        bool: True/False if current row is valid
        str: value/date of when reversion triggers
        str: criteria for current reversion
    """
    criteria = next(key for key in reversion if key in NON_SUPPORTED_CC_PHDWIN_DATE_CRITERIA)
    valid = True
    phd_criteria = 'Date'
    date_offset = '0'
    reversion_value = ''

    if criteria == 'date':
        try:
            reversion_value = reversion.get(criteria)
            reversion_value = datetime.strftime(datetime.strptime(reversion_value, '%Y-%m-%d'), '%m/%d/%Y')
        except ValueError:
            # add warning for invalid date format in DB
            pass
    elif criteria == 'offset_to_as_of_date':
        try:
            reversion_value = well_date_dict.get(criteria)
            reversion_value = datetime.strftime(datetime.strptime(reversion_value, '%Y-%m-%d'), '%m/%d/%Y')
        except ValueError:
            # add warning for invalid date format in DB
            pass
        date_offset = reversion.get(criteria, '0')
        reversion_value = add_month_offset(reversion_value, date_offset)
    elif criteria in ['irr', 'roi_undisc', 'well_head_boe_cum']:
        # throw warning, IRR, ROI, and BOE cumulative are not supported
        valid = False
    else:
        # throw warning for uncaught criteria
        valid = False
    return valid, reversion_value, phd_criteria


def validate_and_standardize_row(reversion_level: str, reversion: dict, well_date_dict: dict, use_as_of_reference: bool,
                                 npi_type: str):
    """Process current row to check if valid

    Args:
        reversion_level (str): indicates which reversion is currently being processed
        reversion (dict): dictionary of reversion properties
        well_date_dict (dict): dictionary of key dates
        use_as_of_reference (bool): boolean if AsOf can be linked
        npi_type (str): type of npi for current well

    Returns:
        boolean: True/False if current well is valid
        str: PHD criteria type
        str: value/date of when reversion triggers
        tuple: Reversion interests (wi, nri, lease_nri, npi)
        tuple: adjustments by phase (oil, gas, ngl, cond)
        npi_type: type of npi for the current well
    """
    # pull interests common to all reversion levels
    valid = False
    wi = percent_to_decimal(reversion.get('working_interest', ''))
    original_ownership = reversion.get('original_ownership', '')
    nri = percent_to_decimal(original_ownership.get('net_revenue_interest', ''))
    lease_nri = percent_to_decimal(original_ownership.get('lease_net_revenue_interest', ''))
    balance = reversion.get('balance', '')
    npi = percent_to_decimal(reversion.get('net_profit_interest', '0'))
    if npi_type == '':
        npi_type = reversion.get('net_profit_interest_type')
    # phd stores expense NPI as negative and revenue NPI as positive
    if npi_type == 'expense':
        npi = str(round_to_limit(npi) * -1)

    # phase NRI adjustments
    oil_adjustment = percent_to_decimal(reversion.get('oil_ownership', {}).get('net_revenue_interest', ''))
    gas_adjustment = percent_to_decimal(reversion.get('gas_ownership', {}).get('net_revenue_interest', ''))
    ngl_adjustment = percent_to_decimal(reversion.get('ngl_ownership', {}).get('net_revenue_interest', ''))
    cond_adjustment = percent_to_decimal(reversion.get('drip_condensate_ownership', {}).get('net_revenue_interest', ''))
    phd_criteria = ''
    reversion_value = ''

    if reversion_level == 'initial_ownership':
        reversion_value = '0.00'
        valid = True
        phd_criteria = 'Initial'
        return (valid, phd_criteria, reversion_value, (wi, nri, lease_nri, npi),
                (oil_adjustment, gas_adjustment, ngl_adjustment, cond_adjustment), npi_type)

    # initial reversion doesn't include option to exclude NPI, so only check after processing initial case
    include_npi = reversion.get('include_net_profit_interest', 'no')
    if include_npi == 'no':
        npi = '0'

    # Criteria matches to PHD linked criteria
    if any(key in CC_TO_PHD_REVERSION_FORMAT_CONVERSION for key in reversion):
        valid, reversion_value, phd_criteria = process_linked_criteria(reversion, nri, balance)
    # Nonsupported criteria need to be converted to dates
    elif any(key in NON_SUPPORTED_CC_PHDWIN_DATE_CRITERIA for key in reversion):
        valid, reversion_value, phd_criteria = process_unlinked_criteria(reversion, well_date_dict)
    else:
        # throw warning for uncaught criteria
        phd_criteria = ''
        valid = False

    return (valid, phd_criteria, reversion_value, (wi, nri, lease_nri, npi),
            (oil_adjustment, gas_adjustment, ngl_adjustment, cond_adjustment), npi_type)


def append_reversion(wellheaders: tuple, criteria: str, reversion_value: str, interests: tuple, adjustments: tuple,
                     rev_table: list[list]):
    """Append reversion data into rev_table

    Args:
        wellheaders (tuple): tuple of well headers
        criteria (str): criteria of reversion
        reversion_value (str): value or date to trigger reversion on
        interests (tuple): tuple of ownership interests
        adjustments (tuple): tuple of adjustments for each product type
        rev_table (list[list]): list holding all output rows
    """
    (user_chosen_identifier, well_name, state, county, field) = wellheaders
    wi, nri, lease_nri, npi = interests
    adj_oil, adj_gas, adj_ngl, adj_cond = adjustments
    number_auto_key = ''
    if criteria == 'Initial':
        number_auto_key = '1'
    # assume condensate and NGL are always available
    out_row = [
        well_name, state, county, field, None, user_chosen_identifier, number_auto_key, criteria, reversion_value, wi,
        nri, lease_nri, npi, '', adj_cond, adj_gas, adj_ngl, adj_oil
    ]
    rev_table.append(out_row)


def process_phdwin_ownership(wellheaders: tuple, ownership_rows: dict, rev_table: list[list], well_date_dict: dict,
                             use_as_of_reference: bool):
    """loop through each reversion for a well to process and append to rev_table

    Args:
        wellheaders (tuple): tuple of well headers
        ownership_rows (dict): dictionary of rows to be processed
        rev_table (list[list]): table of processed rows
        well_date_dict (dict): dictionary of key dates
        use_as_of_reference (bool): boolean if AsOf can be linked
    """
    npi_type = ''

    for reversion_level in ownership_rows:
        reversion = ownership_rows.get(reversion_level)
        # check if row is valid and pull out reversion terms
        valid, criteria, reversion_value, interests, adjustments, npi_type = validate_and_standardize_row(
            reversion_level, reversion, well_date_dict, use_as_of_reference, npi_type)

        # if valid row, append values to reversion table
        if valid:
            append_reversion(wellheaders, criteria, reversion_value, interests, adjustments, rev_table)


def create_phdwin_ownership_table(context,
                                  notification_id: str,
                                  user_id: str,
                                  date_dict: dict,
                                  well_order_list: list,
                                  well_data_list: list[dict],
                                  progress_range: list,
                                  use_asof_reference: bool = False,
                                  user_key=None,
                                  error_log=None):
    """Loop through wells to extract ownership

    Args:
        context (context): context to current process
        notification_id (str): ID representing notification in Mongo
        user_id (str): ID representing user in Mongo
        date_dict (dict): dictionary containing shared key dates between assumptions
        well_order_list (list): list indicating order of wells
        well_data_list (list[dict]): list containing dictionaries of data for each well
        progress_range (list): list containing min/max range of progress updating for ownership section
        use_asof_reference (bool): True/False if AsOf can be linked to or requires direct date

    Returns:
        list[list]: list of ownership rows formatted for PHD excel editor
    """
    phd_ownership_table = []
    no_wells = len(well_order_list)
    for index, well_order in enumerate(well_order_list):
        try:
            # update progress (make a shared function)
            update_export_progress(context, progress_range, no_wells, index, user_id, notification_id)

            # get well and assumption property
            well_data = well_data_list[well_order]

            assumptions = well_data['assumptions']

            well_header = well_data['well']

            # not being used here
            # schedule = well_data.get('schedule')

            # fill in default assumption if assumption is missing
            fill_in_with_default_assumptions(assumptions)

            key_well_header_props = get_key_well_properties(well_header, date_dict, user_key)
            (chosen_id, user_chosen_identifier, county, well_name, state, field, well_date_dict) = key_well_header_props

            ownership_assumptions = assumptions.get('ownership_reversion')
            assumption_name = ownership_assumptions.get('name')

            if assumption_name is None:
                continue

            # get rows containing each line of ownership data to extract, default to empty list if not found
            ownership_assumption_rows = ownership_assumptions.get('ownership', {})

            # process ownership lines
            process_phdwin_ownership((user_chosen_identifier, well_name, state, county, field),
                                     ownership_assumption_rows, phd_ownership_table, well_date_dict, use_asof_reference)
        except Exception:
            error_log.log_error(well_name=well_name, chosen_id=chosen_id, assumption='Ownership')

        # convert ownership table to a pandas dataframe with PHD column headers

    phd_ownership_table = pd.DataFrame(phd_ownership_table, columns=PHDWIN_REVERSION_PHD_COLUMNS)

    return (phd_ownership_table, )
