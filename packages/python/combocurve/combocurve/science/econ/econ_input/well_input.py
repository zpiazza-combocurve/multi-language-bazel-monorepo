import copy
from typing import Optional

from combocurve.services.feature_flags.feature_flag_list import EnabledFeatureFlags
from combocurve.shared.date import parse_date_str
from combocurve.shared.econ_tools.econ_model_tools import ALL_PHASES, BYPRODUCTS, BYPRODUCT_PARENT_MAP, \
    COMPOSITIONAL_BYPRODUCTS, COMPOSITIONAL_BYPRODUCT_PARENT_MAP
from combocurve.science.econ.general_functions import get_assumption
from combocurve.science.econ.econ_input.econ_input_error_warning import (check_missing_assumption,
                                                                         check_link_to_wells_ecl_error)
from combocurve.science.econ.econ_use_forecast.adjust_forecast import add_shut_in, shut_in_update, adjust_forecast_start
from combocurve.science.econ.pre_process import PreProcess
from combocurve.science.econ.econ_input.stream import Stream
from combocurve.science.econ.econ_input.byproduct import Byproduct
from combocurve.science.econ.default_econ_assumptions import get_default
from combocurve.science.econ.embedded_lookup_table.conversion_factory import ConversionFactory
from combocurve.science.econ.econ_input.econ_input_error_warning import check_missing_forecast
from combocurve.science.econ.econ_calculations.capex import get_capex_params_with_dates
from combocurve.science.econ.econ_use_forecast.use_forecast import (get_pct_key_by_phase, get_main_phase,
                                                                    get_fpd_from_source, get_main_phase_date,
                                                                    process_dates_setting, get_end_prod_date,
                                                                    WellHeaderError)
from dateutil.relativedelta import relativedelta
from copy import deepcopy
from combocurve.science.econ.econ_calculations.wellhead import calculate_wh_volume
from combocurve.shared.date import index_from_date_str

ECL_CAPEX_CATEGORY = ['abandonment', 'salvage']


def get_product_objects(phase_list, production_data, forecast_name, schedule, pct_key_by_phase, tc_risking,
                        actual_forecast_dict):
    product_map = {}

    for phase in phase_list:
        product_map[phase] = Stream(
            phase,
            production_data[phase],
            forecast_name,
            schedule,
            pct_key_by_phase[phase],
            actual_forecast_dict[phase],
            tc_risking[f'{phase}_tc_risking'],
        )
    return product_map


def get_byproduct_objects(byproduct_list, byproduct_parent_map):
    byproduct_map = {}
    for byproduct in byproduct_list:
        byproduct_map[byproduct] = Byproduct(byproduct, byproduct_parent_map[byproduct])
    return byproduct_map


def schedule_adjust_forecast(forecast_data, schedule):
    if schedule.get('FPD'):
        forecast_start_index = schedule['FPD']
        forecast_data = adjust_forecast_start(forecast_data, forecast_start_index)

    return forecast_data


def shut_in_adjust_forecast(forecast_data, shut_in_period, date_dict):
    if shut_in_period:
        forecast_data, shut_in_params = add_shut_in(
            forecast_data,
            shut_in_period,
            date_dict['as_of_date'],
            date_dict['cut_off_date'],
        )
    else:
        shut_in_params = None
    shut_in_params = shut_in_update(shut_in_params, date_dict['start_using_forecast'])
    return forecast_data, shut_in_params


def _check_well_header(key, well_header_info):
    if key in well_header_info.keys():
        ret_number = well_header_info[key]
        if (type(ret_number) not in [int, float]) or (ret_number < 0):
            ret_number = 0
    else:
        ret_number = 0
    return ret_number


def btu_content_pre(btu_content_input):
    btu_content = {}
    for key in btu_content_input:
        btu_content[key] = btu_content_input[key] / 1000
    return btu_content


def _get_other_capex(capex, well_header_info, schedule):
    # only need shallow copy here due to the we need to append to the list
    other_capex = copy.copy(capex['other_capex'])
    ## drilling and completion cost model process
    # vertical_depth
    vertical_depth = _check_well_header('true_vertical_depth', well_header_info)
    # lateral_length
    lateral_length = _check_well_header('perf_lateral_length', well_header_info)
    # total_prop_weight
    total_prop_weight = _check_well_header('total_prop_weight', well_header_info)
    if total_prop_weight == 0:
        total_prop_weight = _check_well_header('first_prop_weight', well_header_info)
    #
    if 'drilling_cost' in capex.keys() and len(capex['drilling_cost']) > 0:
        drilling_cost = capex['drilling_cost']
        drilling_cost_list = PreProcess.drilling_cost_pre(
            drilling_cost,
            vertical_depth,
            lateral_length,
            schedule,
        )
        other_capex['rows'].extend(drilling_cost_list)
    #
    if 'completion_cost' in capex.keys() and len(capex['completion_cost']) > 0:
        completion_cost = capex['completion_cost']
        completion_cost_list = PreProcess.completion_cost_pre(
            completion_cost,
            vertical_depth,
            lateral_length,
            total_prop_weight,
            schedule,
        )
        other_capex['rows'].extend(completion_cost_list)
    return other_capex


def get_unecon_capex(cut_off_model, capex_model):
    capex_offset_to_ecl = cut_off_model.get('capex_offset_to_ecl', 'no')
    if capex_offset_to_ecl == 'no':
        capex = get_default('capex')
        return capex['other_capex']
    else:
        original_capex_rows = capex_model['other_capex'].get('rows', [])
        # keep 1. category is abandonment or salvage, 2. offset_to_econ_limit
        return {
            'rows': [
                row for row in original_capex_rows
                if ('offset_to_econ_limit' in row) or (row['category'] in ECL_CAPEX_CATEGORY)
            ]
        }


class WellInputError(Exception):
    def __init__(self, message='Error in using well input'):
        self.message = message
        super().__init__(self.message)


class WellInput():
    def __init__(self, raw_well_input, feature_flags: Optional[dict[str, bool]] = None):
        # warnings
        self.warning_list = []

        if not feature_flags:
            feature_flags = {}

        # initialize the objects with raw inputs
        self._parse_input(raw_well_input,
                          compositional_economics_enabled=feature_flags.get(
                              EnabledFeatureFlags.roll_out_compositional_economics))

    def __getitem__(self, key):
        if key in self.__dict__:
            return self.__dict__[key]
        else:
            raise WellInputError(f'variable {key} not found in well input')

    def get(self, key, default=None):
        if key in self.__dict__:
            return self.__dict__[key]
        else:
            return default

    def update(self, update_dict):
        self.__dict__.update(update_dict)

    def has_key(self, k):
        return k in self.__dict__

    def _initial_date_dict(self, forecast_data, pct_key_by_phase):
        well_header_info = self.well_header_info
        dates_setting = self.dates_setting
        cut_off_model = self.cut_off_model
        production_data = self.production_data

        main_phase = get_main_phase(forecast_data, well_header_info, pct_key_by_phase)

        self.primary_product = main_phase
        # Roll up will use user input start date when no production start date
        try:
            fpd, is_fpd_linked_to_another_well = get_fpd_from_source(dates_setting, well_header_info, production_data,
                                                                     forecast_data, pct_key_by_phase)
            if is_fpd_linked_to_another_well:
                forecast_data = schedule_adjust_forecast(forecast_data, {'FPD': index_from_date_str(str(fpd))})

        except WellHeaderError as e:
            if self.__class__.__name__ == 'RollUpWellInput':
                fpd = parse_date_str(self.roll_up_dates['start'])
            else:
                raise e
        fsd = fpd
        forecast_start_by_phase = {}

        for phase in production_data:
            this_fsd, _ = get_main_phase_date(forecast_data, main_phase, pct_key_by_phase, 'start')
            forecast_start_by_phase[phase] = this_fsd
            if phase == main_phase:
                fsd = this_fsd

        side_phase_end = cut_off_model.get('side_phase_end', 'no')
        forecast_end_date = None
        if side_phase_end == 'yes':
            # side phase end date same as main phase end date
            forecast_end_date, _ = get_main_phase_date(forecast_data, main_phase, pct_key_by_phase, 'end')
        as_of_date, discount_date, max_econ_life = process_dates_setting(dates_setting, fpd, fsd)
        end_prod_date = get_end_prod_date(production_data, fpd)
        if max_econ_life:
            end_econ_date = as_of_date + relativedelta(months=int(max_econ_life * 12), days=-1)
        else:
            # forecast roll up can have max_econ_life as None, will be handled in _get_dates_roll_up
            end_econ_date = as_of_date

        date_dict = {
            'cf_start_date': as_of_date,  # srtart date in econ report
            'cf_end_date': end_econ_date,  # end date in econ report
            'cut_off_date': end_econ_date,  # end of producing
            'as_of_date': as_of_date,  # start of producing
            'volume_start_date': fpd,
            'first_production_date': fpd,
            'first_segment_date': fsd,
            'end_history_date': end_prod_date,
            'discount_date': discount_date,
            # add below to prevent capex link to discount from moving due to cf prior to as of date move discount date
            'original_discount_date': discount_date,
            'side_phase_end_date': forecast_end_date,
            'start_using_forecast': {phase: (forecast_start_by_phase[phase])
                                     for phase in forecast_start_by_phase}
        }
        return date_dict, forecast_data

    def _start_extended_date_dict(self, date_dict):
        # update date_dict for cf prior to as of date button
        date_dict_update, _, _, _ = get_capex_params_with_dates(
            self.dates_setting,
            date_dict,
            self.capex_model,
            self.shut_in_params,
            self.schedule,
            self.well_header_info,
        )
        max_econ_life_date = date_dict_update['cf_start_date'] + relativedelta(
            months=int(self.dates_setting['max_well_life'] * 12), days=-1)
        date_dict.update({
            'cf_start_date': date_dict_update['cf_start_date'],
            'discount_date': date_dict_update['discount_date'],
            'cf_end_date': max_econ_life_date,  # update cf end and cutoff here because start shifted
            'cut_off_date': max_econ_life_date,
        })

        # update date_dict if capex by rate exist AND `cashflow before aod` is triggered
        capex_keys = set().union(*(row.keys() for row in self.capex_model['other_capex']['rows']))
        is_capex_by_rate_exist = any(r in capex_keys
                                     for r in ['gas_rate', 'oil_rate', 'water_rate', 'total_fluid_rate'])
        is_cf_prior_to_aod = self.dates_setting['cash_flow_prior_to_as_of_date'] == 'yes'
        date_dict_copy = deepcopy(date_dict)
        is_fpd_before_cf_start_date = date_dict['first_production_date'] < date_dict['cf_start_date']
        if is_capex_by_rate_exist and is_cf_prior_to_aod and is_fpd_before_cf_start_date:
            date_dict_copy.update({'cf_start_date': date_dict['first_production_date']})
            gross_wh_volume_dict = calculate_wh_volume(self.products,
                                                       date_dict_copy,
                                                       self.adjusted_forecast_data,
                                                       self.risk_model,
                                                       ignore_hist_prod=self.ignore_hist_prod)['gross_wh_volume_dict']
            date_dict_update, _, _, _ = get_capex_params_with_dates(
                self.dates_setting,
                date_dict_copy,
                self.capex_model,
                self.shut_in_params,
                self.schedule,
                self.well_header_info,
                gross_wh_volume_dict=gross_wh_volume_dict,
            )
            if date_dict_update['cf_start_date'] < date_dict['cf_start_date']:
                date_dict.update({
                    'cf_start_date': (date_dict_update['cf_start_date'] - relativedelta(months=1)).replace(day=1),
                    'discount_date': (date_dict_update['discount_date'] - relativedelta(months=1)).replace(day=1)
                })
        return date_dict

    def ecl_capex_update_date_dict(self, cutoff_date, unecon_bool):

        self.date_dict['cut_off_date'] = cutoff_date

        if self.date_dict['cf_end_date'] < self.date_dict['cf_start_date'] or unecon_bool:
            # can happen when well life is 0
            self.date_dict['cf_end_date'] = self.date_dict['cf_start_date']
            self.set_unecon_input()

        date_dict_update, _, _, _ = get_capex_params_with_dates(self.dates_setting,
                                                                self.date_dict,
                                                                self.capex_model,
                                                                self.shut_in_params,
                                                                self.schedule,
                                                                self.well_header_info,
                                                                is_complete=True)

        self.date_dict['cf_end_date'] = date_dict_update['cf_end_date']  # only update cf end

    def _parse_assumptions(self, assumptions):
        # ownership
        self.ownership_model = assumptions['ownership_reversion']
        self.initial_ownership_model = self.ownership_model['ownership']['initial_ownership']

        # dates
        self.dates_setting = assumptions['dates']['dates_setting']
        self.cut_off_model = assumptions['dates']['cut_off']

        # stream property
        self.stream_property_model = get_assumption(assumptions, 'stream_properties')
        self.yield_model = self.stream_property_model['yields']
        self.shrinkage_model = self.stream_property_model['shrinkage']
        self.loss_flare_model = self.stream_property_model['loss_flare']
        self.btu_content_dict = btu_content_pre(self.stream_property_model['btu_content'])
        # Compositional Economics
        self.compositional_economics_stream_model = self.stream_property_model.get('compositional_economics', None)
        self.compositional_economics_enabled = self.stream_property_model.get('compositional_economics_enabled')
        self.compositional_economics_pricing = get_assumption(assumptions,
                                                              'pricing').get('compositional_economics', None)

        self.pricing_model = get_assumption(assumptions, 'pricing')['price_model']
        self.breakeven_model = get_assumption(assumptions, 'pricing')['breakeven']
        self.differential_model = get_assumption(assumptions, 'differentials')['differentials']
        self.capex_model = get_assumption(assumptions, 'capex')
        self.capex_model['other_capex'] = _get_other_capex(self.capex_model, self.well_header_info, self.schedule)

        # emission
        self.emission = assumptions.get('emission')

        # risking
        risking_shut_in_model = get_assumption(assumptions, 'risking')
        self.shut_in_period = risking_shut_in_model.get('shutIn')
        self.risk_model = risking_shut_in_model['risking_model']
        for phase in ALL_PHASES:
            self.risk_model[phase]['risk_prod'] = self.risk_model.get('risk_prod', 'yes')

        production_tax_model = get_assumption(assumptions, 'production_taxes')
        self.severance_tax_model = production_tax_model['severance_tax']
        self.ad_valorem_tax_model = production_tax_model['ad_valorem_tax']

        self.actual_or_forecast_model = get_assumption(assumptions, 'production_vs_fit')
        self.ignore_hist_prod = self.actual_or_forecast_model.get('production_vs_fit_model',
                                                                  {}).get('ignore_hist_prod', 'no')
        expense_model = get_assumption(assumptions, 'expenses')

        # convert ELT objects for econ computation
        conversion_factory = ConversionFactory()
        expense_converter = conversion_factory.converter('expense')()
        (self.fixed_expense_model, self.variable_expense_model, self.disposal_expense_model,
         self.ghg_expense_model) = expense_converter.incorporate_embedded(expense_model)

        capex_converter = conversion_factory.converter('CAPEX')()
        self.capex_model = capex_converter.incorporate_embedded(self.capex_model)

        self.general_option_model = get_assumption(assumptions, 'general_options')

    def _parse_input(self, raw_well_input, compositional_economics_enabled: bool = False):
        self.well_header_info = raw_well_input['well']
        self.schedule = raw_well_input.get('schedule', {})

        self.production_data = raw_well_input['production_data']
        self.p_series = raw_well_input['p_series']
        self.forecast_data = raw_well_input['forecast_data']

        self.tc_risking = dict(
            zip([f'{phase}_tc_risking' for phase in ALL_PHASES],
                [raw_well_input.get(f'{phase}_tc_risking') for phase in ALL_PHASES]))

        # check missing assumptions
        assumptions = raw_well_input['assumptions']
        missing_assump_warning = check_missing_assumption(assumptions)
        self.warning_list.append(missing_assump_warning)

        # check link_to_wells_ecl_error in dates assumption
        check_link_to_wells_ecl_error(assumptions['dates'])

        # add assumption names for one liner report
        self.forecast_name = raw_well_input.get('forecast_name')
        self.differentials_model_name = assumptions.get('differentials', {}).get('name', None)
        self.production_taxes_model_name = assumptions.get('production_taxes', {}).get('name', None)
        self.expenses_model_name = assumptions.get('expenses', {}).get('name', None)
        self.dates_model_name = assumptions.get('dates', {}).get('name', None)
        self.pricing_model_name = assumptions.get('pricing', {}).get('name', None)
        self.risking_model_name = assumptions.get('risking', {}).get('name', None)

        self._parse_assumptions(assumptions)

        # network model and carbon production
        self.network = raw_well_input['network']
        self.carbon_production = raw_well_input['ghg']

        # informative fields
        self.incremental_index = raw_well_input.get('incremental_index', 0)  # default to base case for tc econ run
        self.combo_name = raw_well_input.get('combo_name')
        self.apply_normalization = raw_well_input['apply_normalization']
        self.tax_option = self.general_option_model['main_options']['income_tax']
        self.reporting_period = self.general_option_model['main_options']['reporting_period']
        self.boe_conversion_dict = self.general_option_model['boe_conversion']

        # column schema and option selections
        self.columns = raw_well_input['columns']
        self.column_fields = raw_well_input['columns_fields']

        pct_key_by_phase, forecast_data, p_series_warning = get_pct_key_by_phase(self.p_series, self.forecast_data)
        missing_forecast_warning = check_missing_forecast(forecast_data)
        self.warning_list.append(p_series_warning)
        self.warning_list.append(missing_forecast_warning)

        if self.schedule:
            forecast_data = schedule_adjust_forecast(forecast_data, self.schedule)

        date_dict, forecast_data = self._initial_date_dict(forecast_data, pct_key_by_phase)

        # process forecast data and shut in
        self.adjusted_forecast_data, self.shut_in_params = shut_in_adjust_forecast(forecast_data, self.shut_in_period,
                                                                                   date_dict)

        # create list of products
        actual_forecast_dict = PreProcess.actual_or_forecast_pre(
            self.actual_or_forecast_model['production_vs_fit_model'], date_dict['as_of_date'])

        self.products = get_product_objects(ALL_PHASES, self.production_data, self.forecast_name, self.schedule,
                                            pct_key_by_phase, self.tc_risking, actual_forecast_dict)
        byproducts = BYPRODUCTS
        byproduct_parent_map = copy.deepcopy(BYPRODUCT_PARENT_MAP)

        # Compositional economics
        if compositional_economics_enabled:
            byproducts = byproducts + COMPOSITIONAL_BYPRODUCTS
            byproduct_parent_map.update(COMPOSITIONAL_BYPRODUCT_PARENT_MAP)

        self.byproducts = get_byproduct_objects(byproducts, byproduct_parent_map)

        self.well_id = self.well_header_info.get('_id')  # TC econ doesn't have well_id

        self.date_dict = self._start_extended_date_dict(date_dict)

    def set_unecon_input(self):
        default_stream_properties = get_default('stream_properties')
        self.btu_content_dict = btu_content_pre(default_stream_properties['btu_content'])
        self.yield_model = default_stream_properties['yields']
        self.shrinkage_model = default_stream_properties['shrinkage']
        self.loss_flare_model = default_stream_properties['loss_flare']

        self.pricing_model = get_default('pricing')['price_model']
        self.differential_model = get_default('differentials')['differentials']

        default_expenses = get_default('expenses')
        conversion_factory = ConversionFactory()
        expense_converter = conversion_factory.converter('expense')()
        (self.fixed_expense_model, self.variable_expense_model, self.disposal_expense_model,
         self.ghg_expense_model) = expense_converter.incorporate_embedded(default_expenses)

        self.capex_model['other_capex'] = get_unecon_capex(self.cut_off_model, self.capex_model)

        default_production_taxes = get_default('production_taxes')
        self.severance_tax_model = default_production_taxes['severance_tax']
        self.ad_valorem_tax_model = default_production_taxes['ad_valorem_tax']

        default_risking = get_default('risking')
        self.risk_model = default_risking['risking_model']
