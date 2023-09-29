import copy
import math
import numpy as np
from scipy.stats import norm, uniform, lognorm, triang

from api.cc_to_cc.helper import (number_validation, date_validation, selection_validation, esca_depre_validation,
                                 db_date_to_str, standard_date_str)

from api.cc_to_cc.file_headers import (
    get_assumption_empty_row,
    fill_in_model_type_and_name,
    ColumnName,
    ProbCapexFields,
    CAPEX_KEY,
)

from combocurve.shared.econ_tools.econ_model_display_templates import ESCALATION_START_CRITERIA
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults

DATE = 'date'
LARGE_NUMBER = 1e-6

ESCALATION_START_NAME_TO_KEY = {key.replace('_', ' '): key for key in ESCALATION_START_CRITERIA.keys()}

KEY_TO_CAPEX_CRITERIA = {
    'offset_to_fpd': 'fpd',
    'offset_to_as_of_date': 'as of',
    'offset_to_discount_date': 'disc date',
    'offset_to_first_segment': 'maj seg',
    'offset_to_econ_limit': 'econ limit',
    DATE: DATE,
    'fromSchedule': 'from schedule',
    'fromHeaders': 'from headers',
    'oil_rate': 'oil rate',
    'water_rate': 'water rate',
    'gas_rate': 'gas rate',
    'total_fluid_rate': 'total fluid rate',
}

KEY_TO_CAPEX_SCHEDULE_CRITERIA = {
    'offset_to_pad_preparation_mob_start': 'Pad Preparation Mob Start',
    'offset_to_pad_preparation_mob_end': 'Pad Preparation Mob End',
    'offset_to_pad_preparation_start': 'Pad Preparation Start',
    'offset_to_pad_preparation_end': 'Pad Preparation End',
    'offset_to_pad_preparation_demob_start': 'Pad Preparation Demob Start',
    'offset_to_pad_preparation_demob_end': 'Pad Preparation Demob End',
    'offset_to_spud_mob_start': 'Spud Mob Start',
    'offset_to_spud_mob_end': 'Spud Mob End',
    'offset_to_spud_start': 'Spud Start',
    'offset_to_spud_end': 'Spud End',
    'offset_to_spud_demob_start': 'Spud Demob Start',
    'offset_to_spud_demob_end': 'Spud Demob End',
    'offset_to_drill_mob_start': 'Drill Mob Start',
    'offset_to_drill_mob_end': 'Drill Mob End',
    'offset_to_drill_start': 'Drill Start',
    'offset_to_drill_end': 'Drill End',
    'offset_to_drill_demob_start': 'Drill Demob Start',
    'offset_to_drill_demob_end': 'Drill Demob End',
    'offset_to_completion_mob_start': 'Completion Mob Start',
    'offset_to_completion_mob_end': 'Completion Mob End',
    'offset_to_completion_start': 'Completion Start',
    'offset_to_completion_end': 'Completion End',
    'offset_to_completion_demob_start': 'Completion Demob Start',
    'offset_to_completion_demob_end': 'Completion Demob End'
}

KEY_TO_CAPEX_HEADERS_CRITERIA = {
    'offset_to_refrac_date': 'Refrac Date',
    'offset_to_completion_end_date': 'Completion End Date',
    'offset_to_completion_start_date': 'Completion Start Date',
    'offset_to_date_rig_release': 'Date Rig Release',
    'offset_to_drill_end_date': 'Drill End Date',
    'offset_to_drill_start_date': 'Drill Start Date',
    'offset_to_first_prod_date': 'First Prod Date',
    'offset_to_permit_date': 'Permit Date',
    'offset_to_spud_date': 'Spud Date',
    'offset_to_til': 'TIL',
    'offset_to_custom_date_0': 'Custom Date Header 1',
    'offset_to_custom_date_1': 'Custom Date Header 2',
    'offset_to_custom_date_2': 'Custom Date Header 3',
    'offset_to_custom_date_3': 'Custom Date Header 4',
    'offset_to_custom_date_4': 'Custom Date Header 5',
    'offset_to_custom_date_5': 'Custom Date Header 6',
    'offset_to_custom_date_6': 'Custom Date Header 7',
    'offset_to_custom_date_7': 'Custom Date Header 8',
    'offset_to_custom_date_8': 'Custom Date Header 9',
    'offset_to_custom_date_9': 'Custom Date Header 10',
    'offset_to_first_prod_date_daily_calc': 'First Prod Date Daily',
    'offset_to_first_prod_date_monthly_calc': 'First Prod Date Monthly',
    'offset_to_last_prod_date_monthly': 'Last Prod Date Monthly',
    'offset_to_last_prod_date_daily': 'Last Prod Date Daily',
}

CAPEX_ROW_ECON = {
    'category': '',
    'description': '',
    'tangible': '',
    'intangible': '',
    'capex_expense': '',
    'after_econ_limit': '',
    'calculation': '',
    'escalation_model': 'none',
    'depreciation_model': 'none',
    'deal_terms': '',
}

CAPEX_CAT_OPTIONS = [
    'drilling',
    'completion',
    'legal',
    'pad',
    'facilities',
    'artificial_lift',
    'workover',
    'leasehold',
    'development',
    'pipelines',
    'exploration',
    'waterline',
    'appraisal',
    'other_investment',
    'abandonment',
    'salvage',
]


def capex_export(model, esca_id_to_name, depre_id_to_name, df_project_elt, custom_headers={}):

    # modify custom date headers
    custom_dates = {
        f'offset_to_{key}': custom_headers.get(key)
        for key in custom_headers.keys() if 'custom_date_' in key and custom_headers.get(key) is not None
    }
    KEY_TO_CAPEX_HEADERS_CRITERIA.update(custom_dates)

    row_list = []

    capex = model['econ_function']['other_capex']['rows']
    capex_options = model['options']['other_capex']['row_view']['rows']
    embedded_lookup_tables = model.get('embeddedLookupTables', [])

    last_update_str = model['updatedAt'].strftime(standard_date_str)
    for i, capex_row in enumerate(capex):
        this_csv_row = get_assumption_empty_row(CAPEX_KEY)

        this_csv_row['Last Update'] = last_update_str

        this_csv_row = fill_in_model_type_and_name(this_csv_row, model)

        this_csv_row['Category'] = capex_row['category'].replace('_', ' ')
        this_csv_row['Description'] = capex_row['description']
        this_csv_row['Tangible (M$)'] = capex_row['tangible']
        this_csv_row['Intangible (M$)'] = capex_row['intangible']
        this_csv_row['CAPEX or Expense'] = capex_row['capex_expense']
        this_csv_row['Appear After Econ Limit'] = capex_row.get('after_econ_limit', 'no')
        this_csv_row['Calculation'] = capex_row['calculation']
        this_csv_row['Paying WI / Earning WI'] = capex_row['deal_terms']

        capex_option_row = capex_options[i]
        escalation_id = capex_option_row['escalation_model']['value']
        this_csv_row['Escalation'] = esca_id_to_name.get(escalation_id, 'None')
        depreciation_id = capex_option_row['depreciation_model']['value']
        this_csv_row['Depreciation'] = depre_id_to_name.get(depreciation_id, 'None')

        criteria_key = list(set(KEY_TO_CAPEX_CRITERIA.keys()) & set(capex_row.keys()))[0]
        this_csv_row['Criteria'] = KEY_TO_CAPEX_CRITERIA[criteria_key]
        this_csv_row['From Schedule'] = None
        if criteria_key == 'fromSchedule':
            from_schedule_criteria_key = list(set(KEY_TO_CAPEX_SCHEDULE_CRITERIA.keys()) & set(capex_row.keys()))[0]
            this_csv_row['From Schedule'] = KEY_TO_CAPEX_SCHEDULE_CRITERIA[from_schedule_criteria_key]
            this_csv_row['Value'] = capex_row[from_schedule_criteria_key]
        elif criteria_key == 'fromHeaders':
            from_headers_criteria_key = list(set(KEY_TO_CAPEX_HEADERS_CRITERIA.keys()) & set(capex_row.keys()))[0]
            this_csv_row['From Headers'] = KEY_TO_CAPEX_HEADERS_CRITERIA[from_headers_criteria_key]
            this_csv_row['Value'] = capex_row[from_headers_criteria_key]
        elif criteria_key == DATE:
            this_csv_row['Value'] = db_date_to_str(capex_row[criteria_key])
        else:
            this_csv_row['Value'] = capex_row[criteria_key]

        # escalaion start
        escalation_start = capex_row.get(ColumnName.escalation_start.name, EconModelDefaults.escalation_start)
        escalation_start_criteria = list(escalation_start.keys())[0]
        this_csv_row[ColumnName.escalation_start_criteria.value] = escalation_start_criteria.replace('_', ' ')
        escalation_start_value = escalation_start[escalation_start_criteria]
        if criteria_key == DATE:
            escalation_start_value = db_date_to_str(escalation_start_value)
        this_csv_row[ColumnName.escalation_start_value.value] = escalation_start_value

        row_list.append(this_csv_row)

    # embedded_lookup_tables
    for elt_id in embedded_lookup_tables:
        if not df_project_elt.loc[df_project_elt['id'] == elt_id].empty:
            elt_name = df_project_elt.loc[df_project_elt['id'] == elt_id, 'name'].iloc[0]
        else:
            continue
        elt_row = get_assumption_empty_row(CAPEX_KEY)
        elt_row['Last Update'] = last_update_str
        elt_row = fill_in_model_type_and_name(elt_row, model)
        elt_row[ColumnName.embedded_lookup_table.value] = elt_name
        row_list.append(elt_row)

    return row_list


def capex_import(well_array, header, esca_name_dict, depre_name_dict, df_project_elt, custom_headers={}):
    error_list = []

    # handle embedded lookup tables
    embedded_lookup_table_ids = []
    elt_col_idx = header.index(ColumnName.embedded_lookup_table.value)
    elt_rows_idx, = np.where(well_array[:, elt_col_idx] != None)  # noqa E711
    elt_names = well_array[elt_rows_idx, elt_col_idx]
    for name, idx in zip(elt_names, elt_rows_idx):
        if len(np.where(elt_names == name)[0]) > 1:
            error_list.append({'error_message': f'Duplicated embedded lookup table row ({name})', 'row_index': idx})
            continue
        if not df_project_elt.loc[df_project_elt['name'] == name].empty:
            embedded_lookup_table_ids.append(df_project_elt.loc[df_project_elt['name'] == name, 'id'].iloc[0])
        else:
            error_list.append({'error_message': f'Embedded lookup table {name} not in project!', 'row_index': idx})
            continue
    well_array = np.delete(well_array, elt_rows_idx, axis=0)  # drop embedded lookup rows

    # modify custom date headers
    custom_dates = {
        f'offset_to_{key}': custom_headers.get(key)
        for key in custom_headers.keys() if 'custom_date_' in key and custom_headers.get(key) is not None
    }
    KEY_TO_CAPEX_HEADERS_CRITERIA.update(custom_dates)

    other_capex_rows = []
    for row_index, csv_row in enumerate(well_array):
        this_csv_dict = dict(zip(header, csv_row))
        this_capex = copy.deepcopy(CAPEX_ROW_ECON)

        this_capex['category'] = selection_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key='Category',
            options=CAPEX_CAT_OPTIONS,
            row_index=row_index,
        )

        this_capex['description'] = this_csv_dict['Description']

        this_capex['tangible'] = number_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key='Tangible (M$)',
            required=True,
            row_index=row_index,
        )
        this_capex['intangible'] = number_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key='Intangible (M$)',
            required=True,
            row_index=row_index,
        )

        this_capex['capex_expense'] = selection_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key='CAPEX or Expense',
            options=['capex'],  # only include capex because the expense is diabled on front end
            row_index=row_index,
        )

        this_capex['after_econ_limit'] = selection_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key='Appear After Econ Limit',
            options=['yes', 'no'],
            row_index=row_index,
        )

        this_capex['calculation'] = selection_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key='Calculation',
            options=['net', 'gross'],
            row_index=row_index,
        )

        this_capex['deal_terms'] = number_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key='Paying WI / Earning WI',
            required=True,
            row_index=row_index,
        )

        # criteria
        this_criteria = selection_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key='Criteria',
            options=KEY_TO_CAPEX_CRITERIA.values(),
            row_index=row_index,
        )
        capex_criteria_to_key = {KEY_TO_CAPEX_CRITERIA[k]: k for k in KEY_TO_CAPEX_CRITERIA}
        if this_criteria:
            this_criteria_key = capex_criteria_to_key[this_criteria]
        else:
            this_criteria_key = None

        if this_criteria == DATE:
            this_capex[this_criteria_key] = date_validation(
                error_list=error_list,
                input_dict=this_csv_dict,
                input_key='Value',
                row_index=row_index,
            )
        elif this_criteria.lower() == 'from schedule':
            from_schedule_type = this_csv_dict['From Schedule']
            from_schedule_key = list(KEY_TO_CAPEX_SCHEDULE_CRITERIA.keys())[list(
                KEY_TO_CAPEX_SCHEDULE_CRITERIA.values()).index(from_schedule_type)]
            this_capex[this_criteria_key] = from_schedule_key
            this_capex[from_schedule_key] = number_validation(
                error_list=error_list,
                input_dict=this_csv_dict,
                input_key='Value',
                required=True,
                row_index=row_index,
            )
        elif this_criteria.lower() == 'from headers':
            from_headers_type = this_csv_dict['From Headers']
            from_headers_key = list(KEY_TO_CAPEX_HEADERS_CRITERIA.keys())[list(
                KEY_TO_CAPEX_HEADERS_CRITERIA.values()).index(from_headers_type)]
            this_capex[this_criteria_key] = from_headers_key
            this_capex[from_headers_key] = number_validation(
                error_list=error_list,
                input_dict=this_csv_dict,
                input_key='Value',
                required=True,
                row_index=row_index,
            )
        else:
            this_capex[this_criteria_key] = number_validation(
                error_list=error_list,
                input_dict=this_csv_dict,
                input_key='Value',
                required=True,
                row_index=row_index,
            )

        # escalation
        this_capex['escalation_model'] = esca_depre_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key='Escalation',
            name_dict=esca_name_dict,
            row_index=row_index,
        )

        # escalation start
        escalation_start_criteria_input = selection_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key=ColumnName.escalation_start_criteria.value,
            options=ESCALATION_START_NAME_TO_KEY.keys(),
            row_index=row_index,
        )

        if escalation_start_criteria_input:
            escalation_start_criteria = ESCALATION_START_NAME_TO_KEY[escalation_start_criteria_input]
        else:
            escalation_start_criteria = None

        if escalation_start_criteria == DATE:
            escalation_start_value = date_validation(
                error_list=error_list,
                input_dict=this_csv_dict,
                input_key=ColumnName.escalation_start_value.value,
                row_index=row_index,
            )
        else:
            escalation_start_value = number_validation(
                error_list=error_list,
                input_dict=this_csv_dict,
                input_key=ColumnName.escalation_start_value.value,
                required=True,
                row_index=row_index,
            )

        this_capex[ColumnName.escalation_start.name] = {escalation_start_criteria: escalation_start_value}

        # depreciation
        this_capex['depreciation_model'] = esca_depre_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key='Depreciation',
            name_dict=depre_name_dict,
            row_index=row_index,
        )

        other_capex_rows.append(this_capex)

    return {
        'other_capex': {
            'rows': other_capex_rows
        },
        'embeddedLookupTables': embedded_lookup_table_ids,
    }, error_list


DIST_FIELDS_DEFAULT = {
    ProbCapexFields.distribution_type.name: 'na',
    'mean': 0,
    'standard_deviation': 0,
    'mode': 0,
    'lower_bound': 0,
    'upper_bound': 0,
    'seed': 1
}


def empty_prob_capex_row():
    return {
        ColumnName.model_type.value: None,
        ColumnName.model_name.value: None,
        ProbCapexFields.prob_capex.value: None,
        ColumnName.category.value: None,
        ProbCapexFields.trial_number.value: None,
        ProbCapexFields.value_m_dollar.value: None,
        ProbCapexFields.seed.value: None,
        ProbCapexFields.error_message.value: None
    }


def prob_capex_export(model, trials):
    is_prob_capex = model['econ_function']['other_capex'].get('probCapex', False)
    capex = model['econ_function']['other_capex']['rows']

    prob_capex_row = empty_prob_capex_row()
    prob_capex_row = fill_in_model_type_and_name(prob_capex_row, model)
    prob_capex_row[ProbCapexFields.prob_capex.value] = is_prob_capex

    if not is_prob_capex:
        return [prob_capex_row]

    row_list = []
    for capex_row in capex:
        # the old version of CAPEX model may missing some fields, the FE will show default, keep the same logic here
        dist_params = {k: capex_row.get(k, default) for k, default in DIST_FIELDS_DEFAULT.items()}

        error_message = None
        values = np.full(int(trials), None, dtype=float)
        try:
            values[:] = _get_distribution(num_trials=int(trials), **dist_params)
        except DistributionError as e:
            error_message = str(e)

        category = capex_row[ColumnName.category.name]
        seed = dist_params[ProbCapexFields.seed.name]

        for trial_num, value in enumerate(values):
            prob_capex_row = prob_capex_row.copy()
            prob_capex_row[ColumnName.category.value] = category
            prob_capex_row[ProbCapexFields.trial_number.value] = trial_num + 1
            prob_capex_row[ProbCapexFields.value_m_dollar.value] = value if not np.isnan(value) else 'N/A'
            prob_capex_row[ProbCapexFields.seed.value] = seed
            prob_capex_row[ProbCapexFields.error_message.value] = error_message

            row_list.append(prob_capex_row)

    return row_list


def _get_distribution(distribution_type: str,
                      mean: float = None,
                      standard_deviation: float = None,
                      mode: float = None,
                      lower_bound: float = None,
                      upper_bound: float = None,
                      seed: int = None,
                      num_trials: int = None,
                      **_):

    if distribution_type == 'na':
        return np.full(num_trials, None, dtype=float)

    _check_required_params(distribution_type, mean, standard_deviation, mode, lower_bound, upper_bound)

    if distribution_type == 'normal':
        gen = norm(loc=mean, scale=standard_deviation)

    elif distribution_type == 'lognormal':
        if standard_deviation < LARGE_NUMBER:
            gen = uniform(loc=math.exp(mean), scale=0)
        else:
            gen = lognorm(scale=math.exp(mean), s=standard_deviation)

    elif distribution_type == 'uniform':
        gen = uniform(loc=lower_bound, scale=upper_bound - lower_bound)

    elif distribution_type == 'triangular':
        if abs(upper_bound - lower_bound) < LARGE_NUMBER:
            gen = uniform(loc=lower_bound, scale=upper_bound - lower_bound)
        else:
            gen = triang(c=(mode - lower_bound) / (upper_bound - lower_bound),
                         loc=lower_bound,
                         scale=upper_bound - lower_bound)

    else:
        # This isn't a user-facing error. Only occurs when there's an error in the plumbing from the frontend.
        raise Exception("Available distributions are 'normal', 'uniform', 'lognormal', and 'triangular'.")

    random_sequence = gen.rvs(num_trials, random_state=seed)
    random_sequence[random_sequence < lower_bound] = lower_bound
    random_sequence[random_sequence > upper_bound] = upper_bound
    return random_sequence


def _check_required_params(distribution_type, mean, standard_deviation, mode, lower_bound, upper_bound):
    error_calc = distribution_type == 'normal' and (mean is None or standard_deviation is None)
    error_calc = error_calc or distribution_type == 'lognormal' and (mean is None or standard_deviation is None)
    error_calc = error_calc or distribution_type == 'uniform' and (lower_bound is None or upper_bound is None)
    error_calc = error_calc or distribution_type == 'triangular' and (lower_bound is None or upper_bound is None
                                                                      or mode is None)
    if lower_bound > upper_bound:
        raise LowerUpperError(lower_bound, upper_bound)
    if lower_bound < 0:
        raise NegativeLowerError(lower_bound)
    if error_calc:
        raise RequiredParameterError(distribution_type)
    if distribution_type in ('normal', 'lognormal') and (standard_deviation < 0 or mean < 0):
        mean_val = mean if mean < 0 else None
        st_dev_val = standard_deviation if standard_deviation < 0 else None
        raise MeanStDevError(mean=mean_val, st_dev=st_dev_val)
    if distribution_type == 'lognormal' and np.isinf(np.exp(mean)):
        raise LogNormMeanError(mean)
    if distribution_type == 'triangular' and (mode < lower_bound or mode > upper_bound):
        raise ModeError(mode, lower_bound, upper_bound)


class DistributionError(Exception):
    expected = True


class MeanStDevError(DistributionError):
    message_dispatch = {
        'mean': 'Mean must be positive.',
        'st_dev': 'Standard Deviation must be positive.',
        'both': 'Mean and Standard Devation must be positive.'
    }

    def __init__(self, mean=None, st_dev=None, message=None):
        self.mean = mean
        self.st_dev = st_dev
        if mean is None:
            self.error_type = 'st_dev'
        elif st_dev is None:
            self.error_type = 'mean'
        else:
            self.error_type = 'both'
        self.message = message if message is not None else self.message_dispatch[self.error_type]
        super().__init__(self.message)

    def __str__(self):
        if self.error_type == 'st_dev':
            return f'{self.message} User input Standard Deviation: {self.st_dev}.'
        if self.error_type == 'mean':
            return f'{self.message} User input Mean: {self.mean}.'
        if self.error_type == 'both':
            return f'{self.message} User input (Mean, Standard Deviation): ({self.mean}, {self.st_dev}).'


class NegativeLowerError(DistributionError):
    def __init__(self, lower_bound, message='Lower Bound must be positive.'):
        self.lower_bound = lower_bound
        self.message = message
        super().__init__(self.message)

    def __str__(self):
        return f'{self.message} User input Lower Bound: {self.lower_bound}.'


class ModeError(DistributionError):
    def __init__(self, mode, lower_bound, upper_bound, message='Mode must be between Lower Bound and Upper Bound.'):
        self.lower_bound = lower_bound
        self.upper_bound = upper_bound
        self.mode = mode
        self.message = message
        super().__init__(self.message)

    def __str__(self):
        ret = f'{self.message} '
        ret += f'User input (Lower Bound, Mode, Upper Bound): ({self.lower_bound}, {self.mode}, {self.upper_bound}).'
        return ret


class LowerUpperError(DistributionError):
    def __init__(self, lower_bound, upper_bound, message='Lower Bound must be no larger than Upper Bound.'):
        self.lower_bound = lower_bound
        self.upper_bound = upper_bound
        self.message = message
        super().__init__(self.message)

    def __str__(self):
        return f'{self.message} User input (Lower Bound, Upper Bound): ({self.lower_bound}, {self.upper_bound}).'


class LogNormMeanError(DistributionError):
    default_message = 'Mean is too large.'
    default_message += ' Expected mean to be that of the normally distributed logarithmic values.'

    def __init__(self, mean, message=None):
        self.message = message if message is not None else self.default_message
        self.mean = mean
        super().__init__(self.message)

    def __str__(self):
        return f'{self.message} User input Mean: {self.mean}.'


class RequiredParameterError(DistributionError):
    message_dispatch = {
        'normal': 'Normal distribution requires mean and standard deviation to be defined.',
        'lognormal': 'Log-normal distribution requires mean and standard deviation to be defined.',
        'uniform': 'Uniform distribution requires lower bound and upper bound to be defined.',
        'triangular': 'Triangular distribution requires lower bound, upper bound, and mode to be defined.',
        'n_a': "Available distributions are 'normal', 'uniform', 'lognormal', and 'triangular'."
    }

    def __init__(self, dist, message=None):
        self.message = message if message is not None else self.message_dispatch[dist]
        super().__init__(self.message)

    def __str__(self):
        return self.message
