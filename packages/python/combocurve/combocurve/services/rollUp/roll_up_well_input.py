from combocurve.science.econ.econ_input.well_input import (WellInput, btu_content_pre, schedule_adjust_forecast,
                                                           shut_in_adjust_forecast, get_product_objects,
                                                           get_byproduct_objects)
from combocurve.science.econ.general_functions import get_assumption, py_date_to_index
from combocurve.science.econ.econ_use_forecast.use_forecast import (get_pct_key_by_phase)
from combocurve.science.econ.pre_process import PreProcess
from combocurve.shared.date import parse_date_str
from combocurve.shared.econ_tools.econ_model_tools import ALL_PHASES, BYPRODUCTS, BYPRODUCT_PARENT_MAP


class RollUpWellInput(WellInput):
    def __init__(self, raw_well_input):
        # warnings
        self.warning_message = None

        # initialize the objects with raw inputs
        self._parse_input_models(raw_well_input)

    def roll_up_date_update(self, forecast_data, pct_key_by_phase):
        dates_dict, forecast_data = self._initial_date_dict(forecast_data, pct_key_by_phase)
        dates_dict['cf_start_date'] = parse_date_str(self.roll_up_dates['start'])
        dates_dict['cf_end_date'] = parse_date_str(self.roll_up_dates['end'])
        dates_dict['cut_off_date'] = dates_dict['cf_end_date']
        ignore_forecast_date = parse_date_str(self.roll_up_dates['ignoreForecast'])
        return dates_dict, ignore_forecast_date

    def _parse_input_models(self, raw_well_input):
        self.well_header_info = raw_well_input['well']
        self.schedule = raw_well_input.get('schedule', {})
        self.roll_up_dates = raw_well_input.get('dates', {})

        self.production_data = raw_well_input['production_data']
        pct_key_by_phase, forecast_data, _ = get_pct_key_by_phase(raw_well_input['p_series'],
                                                                  raw_well_input['forecast_data'])
        assumptions = raw_well_input['assumptions']

        dates = get_assumption(assumptions, 'dates')
        self.dates_setting = dates.get('dates_setting', {})
        # forecast roll up do not have cut_off
        self.cut_off_model = dates.get('cut_off', {})
        self.ownership_model = get_assumption(assumptions, 'ownership_reversion')
        self.general_option_model = get_assumption(assumptions, 'general_options')
        self.boe_conversion_dict = self.general_option_model['boe_conversion']

        # stream property
        stream_property_model = get_assumption(assumptions, 'stream_properties')
        self.yield_model = stream_property_model['yields']
        self.shrinkage_model = stream_property_model['shrinkage']
        self.loss_flare_model = stream_property_model['loss_flare']
        self.btu_content = btu_content_pre(stream_property_model['btu_content'])
        # Compositional Economics
        self.compositional_economics_stream_model = stream_property_model.get('compositional_economics', None)

        # risking
        risking_shut_in_model = get_assumption(assumptions, 'risking')
        self.shut_in_period = risking_shut_in_model.get('shutIn')
        self.risk_model = risking_shut_in_model['risking_model']
        for phase in ALL_PHASES:
            self.risk_model[phase]['risk_prod'] = self.risk_model.get('risk_prod', 'yes')

        self.actual_or_forecast_model = get_assumption(assumptions, 'production_vs_fit')
        expense_model = get_assumption(assumptions, 'expenses')

        # informative fields
        self.incremental_index = raw_well_input.get('incremental_index', 0)  # default to base case for tc econ run

        # column schema and option selections
        self.columns_selected = raw_well_input['columns_selected']

        # schedule adjust forecast
        if self.schedule:
            forecast_data = schedule_adjust_forecast(forecast_data, self.schedule)

        self.date_dict, self.ignore_forecast_date = self.roll_up_date_update(forecast_data, pct_key_by_phase)
        if self.ignore_forecast_date is not None:
            self.ignore_forecast_index = py_date_to_index(self.ignore_forecast_date)
        else:
            self.ignore_forecast_index = None

        # initialize objects for econ computation
        self.fixed_expense_model = expense_model['fixed_expenses']
        self.variable_expense_model = expense_model['variable_expenses']
        self.disposal_expense_model = expense_model['water_disposal']

        # process forecast data and shut in
        self.adjusted_forecast_data, self.shut_in_params = shut_in_adjust_forecast(forecast_data, self.shut_in_period,
                                                                                   self.date_dict)

        # create list of products
        actual_forecast_dict = PreProcess.actual_or_forecast_pre(
            self.actual_or_forecast_model['production_vs_fit_model'], self.date_dict['as_of_date'])
        tc_risking = dict(zip([f'{phase}_tc_risking' for phase in ALL_PHASES], [None] * len(ALL_PHASES)))
        self.products = get_product_objects(ALL_PHASES, self.production_data, '', self.schedule, pct_key_by_phase,
                                            tc_risking, actual_forecast_dict)
        self.byproducts = get_byproduct_objects(BYPRODUCTS, BYPRODUCT_PARENT_MAP)
