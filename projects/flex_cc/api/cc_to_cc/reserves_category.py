from api.cc_to_cc.helper import selection_validation, standard_date_str
from api.cc_to_cc.file_headers import get_assumption_empty_row, fill_in_model_type_and_name


class ReservesCategoryImportError(Exception):
    expected = True


def reserves_category_export(model):
    row_list = []

    csv_row = get_assumption_empty_row('reserves_category')

    res_cat = model['econ_function']['reserves_category']

    csv_row['Last Update'] = model['updatedAt'].strftime(standard_date_str)

    csv_row = fill_in_model_type_and_name(csv_row, model)

    csv_row['PRMS Class'] = res_cat['prms_resources_class']
    csv_row['PRMS Category'] = res_cat['prms_reserves_category']
    csv_row['PRMS Sub Category'] = res_cat['prms_reserves_sub_category']

    row_list.append(csv_row)

    return row_list


def reserves_category_import(well_array, header):
    res_cat_list = well_array[0]
    res_cat_dict = dict(zip(header, res_cat_list))
    #
    res_cat = {}
    error_list = []
    res_cat['prms_resources_class'] = selection_validation(
        error_list=error_list,
        input_dict=res_cat_dict,
        input_key='PRMS Class',
        options=['reserves', 'contingent', 'prospective'],
        # default_option='reserves',
    )
    res_cat['prms_reserves_category'] = selection_validation(
        error_list=error_list,
        input_dict=res_cat_dict,
        input_key='PRMS Category',
        options=['proved', 'probable', 'possible', 'c1', 'c2', 'c3'],
        # default_option='proved',
    )
    res_cat['prms_reserves_sub_category'] = selection_validation(
        error_list=error_list,
        input_dict=res_cat_dict,
        input_key='PRMS Sub Category',
        options=['producing', 'non_producing', 'undeveloped', 'behind_pipe', 'shut_in', 'injection', 'p&a'],
        # default_option='producing',
    )

    return {'reserves_category': res_cat}, error_list
