import copy
import numpy as np
from api.cc_to_cc.helper import (number_validation, date_validation, selection_validation, get_lower_case_array,
                                 error_check_decorator, db_date_to_str, standard_date_str)

from api.cc_to_cc.file_headers import get_assumption_empty_row, fill_in_model_type_and_name, ColumnName

from combocurve.shared.econ_tools.econ_model_tools import REVERSION_KEYS
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults
from combocurve.shared.helpers import clean_up_str


class OwnershipImportError(Exception):
    expected = True


DATE_REV_SET = {'offset_to_as_of_date', 'date'}
MONEY_REV_SET = {'irr', 'payout_with_investment', 'payout_without_investment', 'roi_undisc'}
VOLUME_REV_SET = {'well_head_oil_cum', 'well_head_gas_cum', 'well_head_boe_cum'}

KEY_TO_REV_TYPE = {
    'irr': 'irr',
    'payout_with_investment': 'po w/inv',
    'payout_without_investment': 'po',
    'roi_undisc': 'undisc roi',
    'offset_to_as_of_date': 'as of',
    'date': 'date',
    'well_head_oil_cum': 'wh cum oil',
    'well_head_gas_cum': 'wh cum gas',
    'well_head_boe_cum': 'wh cum boe'
}

INI_OWN_ECON = {
    'working_interest': '',
    'original_ownership': {
        'net_revenue_interest': '',
        'lease_net_revenue_interest': ''
    },
    'oil_ownership': {
        'net_revenue_interest': '',
        'lease_net_revenue_interest': ''
    },
    'gas_ownership': {
        'net_revenue_interest': '',
        'lease_net_revenue_interest': ''
    },
    'ngl_ownership': {
        'net_revenue_interest': '',
        'lease_net_revenue_interest': ''
    },
    'drip_condensate_ownership': {
        'net_revenue_interest': '',
        'lease_net_revenue_interest': ''
    },
    'net_profit_interest_type': 'expense',
    'net_profit_interest': ''
}

REV_ECON = {
    'no_reversion': '',
    'balance': 'gross',
    'include_net_profit_interest': 'yes',
    'working_interest': '',
    'original_ownership': {
        'net_revenue_interest': '',
        'lease_net_revenue_interest': ''
    },
    'oil_ownership': {
        'net_revenue_interest': '',
        'lease_net_revenue_interest': ''
    },
    'gas_ownership': {
        'net_revenue_interest': '',
        'lease_net_revenue_interest': ''
    },
    'ngl_ownership': {
        'net_revenue_interest': '',
        'lease_net_revenue_interest': ''
    },
    'drip_condensate_ownership': {
        'net_revenue_interest': '',
        'lease_net_revenue_interest': ''
    },
    'net_profit_interest': ''
}

OWN_REV_KEYS = ['initial_ownership'] + REVERSION_KEYS


def ownership_model_export(model):
    row_list = []

    ownership = model['econ_function']['ownership']
    updated_at_str = model['updatedAt'].strftime(standard_date_str)
    #
    for key in ownership:
        this_own = ownership[key]
        if 'no_reversion' in this_own.keys():
            continue

        this_csv_row = get_assumption_empty_row('ownership_reversion')

        this_csv_row['Key'] = key.split('_')[0]
        this_csv_row['Last Update'] = updated_at_str

        this_csv_row = fill_in_model_type_and_name(this_csv_row, model)

        ## common columns
        this_csv_row['WI %'] = this_own['working_interest']
        #
        this_csv_row['NRI %'] = this_own['original_ownership']['net_revenue_interest']
        this_csv_row['Lease NRI %'] = this_own['original_ownership']['lease_net_revenue_interest']
        # phase nri
        this_csv_row['Oil NRI %'] = this_own['oil_ownership']['net_revenue_interest']
        this_csv_row['Gas NRI %'] = this_own['gas_ownership']['net_revenue_interest']
        this_csv_row['NGL NRI %'] = this_own['ngl_ownership']['net_revenue_interest']
        this_csv_row['Drip Cond. NRI %'] = this_own['drip_condensate_ownership']['net_revenue_interest']
        #
        this_csv_row['NPI %'] = this_own['net_profit_interest']
        ## unique columns
        if key == 'initial_ownership':
            this_csv_row['NPI Type'] = this_own['net_profit_interest_type']
        else:
            this_rev_criteria = list(set(KEY_TO_REV_TYPE.keys()) & set(this_own.keys()))[0]
            this_csv_row['Reversion Type'] = KEY_TO_REV_TYPE[this_rev_criteria]

            if this_rev_criteria == 'date':
                this_csv_row['Reversion Value'] = db_date_to_str(this_own[this_rev_criteria])
            else:
                this_csv_row['Reversion Value'] = this_own[this_rev_criteria]

            if this_rev_criteria in VOLUME_REV_SET:
                this_csv_row['Balance'] = this_own['balance']
            if this_rev_criteria in MONEY_REV_SET:
                this_csv_row['Balance'] = this_own['balance']
                this_csv_row['Include NPI'] = this_own['include_net_profit_interest']

                # reversion_tied_to
                rev_tied_to = this_own.get(ColumnName.reversion_tied_to.name, EconModelDefaults.reversion_tied_to)
                rev_tied_to_key = list(rev_tied_to.keys())[0]
                if rev_tied_to_key == 'date':
                    this_csv_row[ColumnName.reversion_tied_to.value] = rev_tied_to[rev_tied_to_key]
                else:
                    this_csv_row[ColumnName.reversion_tied_to.value] = rev_tied_to_key.replace('_', ' ')

        row_list.append(this_csv_row)

    return row_list


@error_check_decorator
def own_key_validation(error_list, own_key_array):
    prev_own_map = {
        'first': 'initial',
        'second': 'first',
        'third': 'second',
        'fourth': 'third',
        'fifth': 'fourth',
        'sixth': 'fifth',
        'seventh': 'sixth',
        'eighth': 'seventh',
        'ninth': 'eighth',
        'tenth': 'ninth',
    }
    # initial must in own_key_list
    if 'initial' not in own_key_array:
        raise OwnershipImportError('Initial Ownership Missing!')
    for i in range(len(own_key_array)):
        key = own_key_array[i]
        error_details = {'row_index': i}
        if key == 'initial':
            continue
        if key not in prev_own_map.keys():
            raise OwnershipImportError('Invalid Value in Key Field!', error_details)
        # previous reversion
        if prev_own_map[key] not in own_key_array:
            raise OwnershipImportError('Previous Reversion is Missing!', error_details)


def ownership_model_import(well_array, header):
    key_col_idx = header.index('Key')

    own_key_array = get_lower_case_array(copy.deepcopy(well_array[:, key_col_idx]))
    error_list = []
    # model validation
    own_key_validation(error_list=error_list, own_key_array=own_key_array)
    #
    ownership = {}
    for key in OWN_REV_KEYS:
        flat_key = key.split('_')[0].lower()
        #
        if flat_key not in own_key_array:
            # fill in no reversion if there's less than 5 reversion
            this_own = copy.deepcopy(REV_ECON)
        else:
            this_row_lists = well_array[own_key_array == flat_key, :]
            row_index_list = np.where(own_key_array == flat_key)[0]
            row_index = int(row_index_list[0])

            # error for duplicated row
            if len(this_row_lists) > 1:
                key_display = ' '.join(list(map(lambda x: x[0].upper() + x[1:], key.split('_'))))
                error_message = f'Duplicated Row of {key_display}'
                for i in range(1, len(this_row_lists)):
                    error_list.append({'error_message': error_message, 'row_index': int(row_index_list[i])})

            this_row_list = this_row_lists[0]
            this_row_dict = dict(zip(header, this_row_list))
            ## unique columns
            if key == 'initial_ownership':
                # ownership
                this_own = copy.deepcopy(INI_OWN_ECON)
                this_own['net_profit_interest_type'] = selection_validation(
                    error_list=error_list,
                    input_dict=this_row_dict,
                    input_key='NPI Type',
                    options=['expense', 'revenue'],
                    default_option='expense',
                    row_index=row_index,
                )
            else:
                # reversion
                this_own = copy.deepcopy(REV_ECON)
                this_rev_type = selection_validation(
                    error_list=error_list,
                    input_dict=this_row_dict,
                    input_key='Reversion Type',
                    options=KEY_TO_REV_TYPE.values(),
                    row_index=row_index,
                )
                rev_type_to_key = {KEY_TO_REV_TYPE[k]: k for k in KEY_TO_REV_TYPE}
                if this_rev_type:
                    this_rev_type_key = rev_type_to_key[this_rev_type]
                else:
                    this_rev_type_key = None
                # no reversion
                if this_rev_type_key == 'no_reversion':
                    ownership[key] = this_own
                    continue
                # other reversions
                this_own.pop('no_reversion')
                if this_rev_type_key == 'date':
                    this_own = {
                        this_rev_type_key:
                        date_validation(
                            error_list=error_list,
                            input_dict=this_row_dict,
                            input_key='Reversion Value',
                            row_index=row_index,
                        ),
                        **this_own,
                    }
                elif this_rev_type_key == 'offset_to_as_of_date':
                    this_own = {
                        this_rev_type_key:
                        number_validation(
                            error_list=error_list,
                            input_dict=this_row_dict,
                            input_key='Reversion Value',
                            required=True,
                            row_index=row_index,
                        ),
                        **this_own
                    }
                elif this_rev_type_key in MONEY_REV_SET or this_rev_type_key in VOLUME_REV_SET:
                    this_own = {
                        this_rev_type_key:
                        number_validation(
                            error_list=error_list,
                            input_dict=this_row_dict,
                            input_key='Reversion Value',
                            required=True,
                            row_index=row_index,
                        ),
                        **this_own
                    }
                    # shared
                    this_own['balance'] = selection_validation(
                        error_list=error_list,
                        input_dict=this_row_dict,
                        input_key='Balance',
                        options=['net', 'gross'],
                        default_option='gross',
                        row_index=row_index,
                    )
                    # only in money reversion
                    if this_rev_type_key in MONEY_REV_SET:
                        this_own['include_net_profit_interest'] = selection_validation(
                            error_list=error_list,
                            input_dict=this_row_dict,
                            input_key='Include NPI',
                            options=['yes', 'no'],
                            default_option='yes',
                            row_index=row_index,
                        )

                        # reversion tied to
                        rev_tied_to = this_row_dict.get(ColumnName.reversion_tied_to.value) or 'as of'
                        rev_tied_to_value_cleaned = clean_up_str(rev_tied_to)
                        if rev_tied_to_value_cleaned in ['as of', 'fpd']:
                            this_own[ColumnName.reversion_tied_to.name] = {
                                rev_tied_to_value_cleaned.replace(' ', '_'): ''
                            }
                        else:
                            this_own[ColumnName.reversion_tied_to.name] = {
                                'date':
                                date_validation(
                                    error_list=error_list,
                                    input_dict=this_row_dict,
                                    input_key=ColumnName.reversion_tied_to.value,
                                )
                            }

            ## common columns
            this_own['working_interest'] = number_validation(
                error_list=error_list,
                input_dict=this_row_dict,
                input_key='WI %',
                required=True,
                row_index=row_index,
            )
            #
            this_own['original_ownership']['net_revenue_interest'] = number_validation(
                error_list=error_list,
                input_dict=this_row_dict,
                input_key='NRI %',
                required=True,
                row_index=row_index,
            )
            this_own['original_ownership']['lease_net_revenue_interest'] = number_validation(
                error_list=error_list,
                input_dict=this_row_dict,
                input_key='Lease NRI %',
                required=True,
                row_index=row_index,
            )
            #
            this_own['oil_ownership']['net_revenue_interest'] = number_validation(
                error_list=error_list,
                input_dict=this_row_dict,
                input_key='Oil NRI %',
                required=False,
                row_index=row_index,
            )
            this_own['gas_ownership']['net_revenue_interest'] = number_validation(
                error_list=error_list,
                input_dict=this_row_dict,
                input_key='Gas NRI %',
                required=False,
                row_index=row_index,
            )
            this_own['ngl_ownership']['net_revenue_interest'] = number_validation(
                error_list=error_list,
                input_dict=this_row_dict,
                input_key='NGL NRI %',
                required=False,
                row_index=row_index,
            )
            this_own['drip_condensate_ownership']['net_revenue_interest'] = number_validation(
                error_list=error_list,
                input_dict=this_row_dict,
                input_key='Drip Cond. NRI %',
                required=False,
                row_index=row_index,
            )
            #
            this_own['net_profit_interest'] = number_validation(
                error_list=error_list,
                input_dict=this_row_dict,
                input_key='NPI %',
                required=True,
                row_index=row_index,
            )
        ownership[key] = this_own

    return {'ownership': ownership}, error_list
