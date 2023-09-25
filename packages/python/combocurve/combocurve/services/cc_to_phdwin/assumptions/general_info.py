import pandas as pd
from combocurve.services.cc_to_phdwin.helpers import update_export_progress

GENERAL_INFO_COLUMNS = [
    'Unique Id', 'PHDWIN Id(Auto key)', 'Case Name', 'Operator', 'Field', 'Reservoir', 'County', 'State', 'Country',
    'Latitude', 'Longitude', 'Location', 'Major Phase', 'Well Type', 'Class', 'Category', 'Well', 'Spacing',
    'Total Depth', 'Gas Gatherer', 'Oil Gatherer', 'IDCode[API Number]', 'IDCode[Field Code]', 'IDCode[Operator Code]',
    'IDCode[RRC Dist Code]', 'IDCode[Retrieval Code]'
]


def generate_well_header_props(well_data):
    def process_well_header_file(key):
        return str(well_header.get(key)).upper() if well_header.get(key) is not None else None

    well_header = well_data.get('well', {})
    reserves_doc = well_data.get('assumptions', {}).get('reserves_category', {})
    reserve_cat = reserves_doc.get('reserves_category', {}).get('prms_reserves_category')
    reserve_subcat = reserves_doc.get('reserves_category', {}).get('prms_reserves_sub_category')

    well_name = process_well_header_file('well_name')
    operator = process_well_header_file('current_operator')
    field = process_well_header_file('field')
    reservoir = process_well_header_file('landing_zone')
    county = process_well_header_file('county')
    state = process_well_header_file('state')
    country = process_well_header_file('country')
    latitude = process_well_header_file('surfaceLatitude')
    longitude = process_well_header_file('surfaceLongitude')
    location = None
    major = process_well_header_file('primary_product')
    well_type = process_well_header_file('well_type')
    spacing = process_well_header_file('stage_spacing')
    total_depth = process_well_header_file('measured_depth')
    chosen_id = well_header.get('chosenID')

    return [
        None, None, well_name, operator, field, reservoir, county, state, country, latitude, longitude, location, major,
        well_type, reserve_cat, reserve_subcat, None, spacing, total_depth, None, None, None, None, None, None,
        chosen_id
    ], well_name, chosen_id


def create_phdwin_general_info_table(context,
                                     notification_id,
                                     user_id,
                                     date_dict,
                                     well_order_list,
                                     well_data_list,
                                     progress_range,
                                     use_asof_reference=False,
                                     user_key=None,
                                     error_log=None):
    general_info_table = []
    no_wells = len(well_order_list)
    try:
        for index, well_order in enumerate(well_order_list):
            # update progress (make a shared function)
            update_export_progress(context, progress_range, no_wells, index, user_id, notification_id)
            well_data = well_data_list[well_order]
            row, well_name, chosen_id = generate_well_header_props(well_data)
            general_info_table.append(row)
        general_info_table = pd.DataFrame(general_info_table, columns=GENERAL_INFO_COLUMNS)
    except Exception:
        error_log.log_error(well_name=well_name, chosen_id=chosen_id, assumption='General Info')
    return (general_info_table, )
