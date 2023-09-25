import pandas as pd

from combocurve.services.cc_to_phdwin.helpers import fill_in_with_default_assumptions, get_key_well_properties

BTU_PHD_COLUMNS = ['Case Name', 'State', 'County', 'Field', 'Unique Id', 'PHDWIN Id(Key)', 'Btu factor']

DEFAULT_BTU_VALUE = 1000


def create_phdwin_btu_table(context,
                            notification_id,
                            user_id,
                            date_dict,
                            well_order_list,
                            well_data_list,
                            progress_range,
                            user_key=None,
                            use_asof_reference=False,
                            error_log=None):
    phd_table = []
    # no_wells = len(well_order_list)
    for index, well_order in enumerate(well_order_list):
        try:
            # update progress (make a shared function)
            # update_export_progress(context, progress_range, no_wells, index, user_id, notification_id)

            # get well and assumption property
            well_data = well_data_list[well_order]

            assumptions = well_data['assumptions']

            well_header = well_data['well']

            # fill in default assumption if assumption is missing
            fill_in_with_default_assumptions(assumptions)

            key_well_header_props = get_key_well_properties(well_header, date_dict, user_key)
            chosen_id, user_chosen_identifier, county, well_name, state, field, well_date_dict = key_well_header_props

            props = [well_name, state, county, field, None, user_chosen_identifier]

            stream_prop = assumptions.get('stream_properties')
            assumption_name = stream_prop.get('name')

            if assumption_name is None:
                continue

            shrunk_gas_btu = stream_prop['btu_content']['shrunk_gas']
            unshrunk_gas_btu = stream_prop['btu_content']['unshrunk_gas']

            # skip row if both shrunk and unshrunk gas btu are default
            if shrunk_gas_btu == DEFAULT_BTU_VALUE and unshrunk_gas_btu == DEFAULT_BTU_VALUE:
                continue

            btu = shrunk_gas_btu if shrunk_gas_btu != DEFAULT_BTU_VALUE else unshrunk_gas_btu

            phd_row = [*props, btu]

            phd_table.append(phd_row)
        except Exception:
            error_log.log_error(well_name=well_name, chosen_id=chosen_id, assumption='BTU')

    phd_table = pd.DataFrame(phd_table, columns=BTU_PHD_COLUMNS)

    return (phd_table, )
