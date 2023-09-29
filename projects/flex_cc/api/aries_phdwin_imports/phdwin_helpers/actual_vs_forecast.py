import datetime
from api.aries_phdwin_imports.phdwin_helpers.general import get_model_name
from api.aries_phdwin_imports.helpers import calculate_phdwin_index


def process_phdwin_actual_vs_forecast_properties_document(default_document, name, document, change_dates_hierarchy,
                                                          lse_id_to_sop, major_phase_dict, lse_id_curarcseq,
                                                          get_default_format):
    filled = default_document is not None
    phase = str(document.get('productname')).strip().lower()
    sequence = document.get('segment_sequence')
    projection_has_precendence = True if document.get('projhasprecedence') == 1 else False
    if phase in ['oil', 'gas', 'water'] and sequence == 1:
        name = get_model_name(name, default_document, phd_model_name=document.get('arcseqname'))
        if not filled:
            default_document = get_default_format('actual_or_forecast')
            if 'wells' not in default_document:
                default_document['wells'] = set()
            default_document['wells'].add(document['well'])
        default_document['econ_function']["production_vs_fit_model"]['ignore_hist_prod'] = "no"

        start_date = document.get('start_date')
        lse_id = document.get('lse_id')
        if start_date is None:
            return default_document, name
        update_phdwin_dates_hierarchy(document, start_date, lse_id, lse_id_to_sop, major_phase_dict, lse_id_curarcseq,
                                      change_dates_hierarchy, projection_has_precendence)

        if projection_has_precendence:
            default_document['econ_function']['production_vs_fit_model']['replace_actual'][phase] = {
                'date': start_date.strftime("%Y-%m-%d")
            }
    if not filled:
        default_document['createdAt'] = datetime.datetime.now()
        default_document['updatedAt'] = datetime.datetime.now()

    return default_document, name


def update_phdwin_dates_hierarchy(document, start_date, lse_id, lse_id_to_sop, major_phase_dict, lse_id_curarcseq,
                                  change_dates_hierarchy, projection_has_precendence):
    forecast_start_index = calculate_phdwin_index(start_date)
    if (str(document.get('productname')).strip().lower() == str(
            major_phase_dict.get(lse_id)).strip().lower()) and (document['arcseq'] == lse_id_curarcseq.get(lse_id)):
        if lse_id in lse_id_to_sop:
            if lse_id_to_sop[lse_id] > forecast_start_index:
                lse_id_to_sop[lse_id] = forecast_start_index
                if projection_has_precendence:
                    change_dates_hierarchy.add(document['well'])
        else:
            lse_id_to_sop[lse_id] = forecast_start_index
