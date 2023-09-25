import datetime
from typing import Optional

from combocurve.science.econ.econ_calculations.calculation import EconCalculation
from combocurve.science.econ.pre_process import PreProcess
from combocurve.science.econ.schemas.compositional_economics import CompositionalEconomicsRows, Compositional
from combocurve.science.econ.schemas.stream_properties import YieldOutput, Yields
from combocurve.services.feature_flags.feature_flag_list import EnabledFeatureFlags
from combocurve.shared.econ_tools.econ_model_tools import ALL_PHASES
from combocurve.science.econ.econ_model_rows_process import WI_100_PCT, rate_rows_process, rows_process
import numpy as np


def _process_compositional_economics_yield(
    compositional_rows: CompositionalEconomicsRows,
    date_dict: dict[str, datetime.date],
) -> dict[Compositional, YieldOutput]:
    """Takes compositional economics inputs and returns parsed yield values for all dates
    Args:
        compositional_rows: a CompositionalEconomicsRows pydantic model containing compositional economics inputs
        date_dict: dict containing various needed date values
    Returns:
        A dict containing timeseries of parsed yield values for each phase
    """

    compositional_yields = {}
    for compositional_row in compositional_rows.rows:
        # Current support is for single-row only - no time-series
        rows = [{"entire_well_life": "Flat", "yield": float(compositional_row.value)}]
        monthly_para = rows_process(rows, date_dict, date_dict.get('first_production_date'),
                                    date_dict.get('cf_start_date'), date_dict.get('cf_end_date'), 'yield')
        compositional_yields[compositional_row.category.value] = YieldOutput(value=np.divide(monthly_para, 1000),
                                                                             shrinkage='shrunk')

    return compositional_yields


class StreamProperty(EconCalculation):
    def __init__(self):
        # interface
        pass

    def result(self):
        raise Exception

    def shrinkage_pre(self, shrinkage_input_dic, date_dict, well_head_volumes):
        '''Takes dates and shrinkage values and returns shrinkage values for all dates

        Args:
            shrinkage_input_dic: dict containing shrinkage inputs for each phase
            date_dict: dict containing various needed date values
            well_head_volumes: dict containing production values for each phase

        Returns:
            A dict containing timeseries of shrinkage values for each phase

            For example:

            {'oil': [.99, .99, .96, .96, .95],
             'gas': [.98, .97, .97, .95, .95]}

        '''
        fpd = date_dict['first_production_date']
        cf_start_date = date_dict['cf_start_date']
        cf_end_date = date_dict['cf_end_date']

        value_key = 'pct_remaining'

        shrinkage_dic = {}

        for key in ['oil', 'gas']:
            rows = shrinkage_input_dic[key]['rows']
            row_keys = rows[0].keys()

            if self._intersect_with_rate_row_keys(row_keys):
                criteria_key = list(self._intersect_with_rate_row_keys(row_keys))[0]
                rate_type = shrinkage_input_dic.get('rate_type', 'gross_well_head')
                rows_cal_method = shrinkage_input_dic.get('rows_calculation_method', 'non_monotonic')
                monthly_para = rate_rows_process(
                    rows,
                    value_key,
                    criteria_key,
                    rate_type,
                    rows_cal_method,
                    well_head_volumes,
                    date_dict,
                )
            else:
                monthly_para = rows_process(rows, date_dict, fpd, cf_start_date, cf_end_date, value_key, 100)

            shrinkage_dic[key] = np.divide(monthly_para, 100)

        return shrinkage_dic

    def _process_full_stream_yield(self, yield_input_dic: dict, key: str, well_head_volumes: dict,
                                   date_dict: dict[str, datetime.date]) -> YieldOutput:
        """
        Processes yield inputs for a single phase - NGL and Drip Condensate.

        Args:
            yield_input_dic (dict): The yield input dictionary.
            key (str): The key for the phase to process.
            well_head_volumes (dict): The well head volumes dictionary.
            date_dict (dict): The dates dictionary, indexed by the date type (as_of_date, cf_end_date)...

        Returns:
            YieldOutput: The processed yield output.

        """
        yield_dict = {}
        row_keys = yield_input_dic[key]['rows'][0].keys()
        if 'unshrunk_gas' in row_keys:
            yield_dict['shrinkage'] = 'unshrunk'
        elif 'shrunk_gas' in row_keys:
            yield_dict['shrinkage'] = 'shrunk'

        rows = yield_input_dic[key]['rows']
        row_keys = rows[0].keys()

        if self._intersect_with_rate_row_keys(row_keys):
            criteria_key = list(self._intersect_with_rate_row_keys(row_keys))[0]
            rate_type = yield_input_dic.get('rate_type', 'gross_well_head')
            rows_cal_method = yield_input_dic.get('rows_calculation_method', 'non_monotonic')
            monthly_para = rate_rows_process(
                rows,
                'yield',
                criteria_key,
                rate_type,
                rows_cal_method,
                well_head_volumes,
                date_dict,
            )
        else:
            monthly_para = rows_process(rows, date_dict, date_dict.get('first_production_date'),
                                        date_dict.get('cf_start_date'), date_dict.get('cf_end_date'), 'yield')

        yield_dict['value'] = np.divide(monthly_para, 1000)
        return YieldOutput(**yield_dict)

    def yields_pre(self,
                   yield_input_dic,
                   date_dict,
                   well_head_volumes,
                   compositional_economics_dict: Optional[dict] = None) -> Yields:
        """Turns yield input into a timeseries of yield values for different byproducts

        Args:
            yield_input_dic: dict containing yield arguments for ngl and drip condensate
            date_dict: dict containing necessary date inputs
            well_head_volumes: dict containing production values for oil, gas, and water
            compositional_economics_dict: dict containing compositional economics inputs
        Returns:
            Yields: A pydantic model containing a timeseries for ngl, drip condensate and Compositional Yields
                    in BBL/MCF

            For example:

            {'ngl':
                {'shrinkage': 'shrunk',
                 'value': [0.5, 0.5, 0.5, 0.6, 0.6, 0.7]
                 },
            'compositionals': {'C2': {'value': [0.5, 0.5, 0.5, 0.6, 0.6, 0.7]}
            }
        """

        yield_dic = {}

        yield_keys = ['ngl', 'drip_condensate']
        if compositional_economics_dict:
            yield_keys.append('compositionals')

        for key in yield_keys:
            yield_dic[key] = {}

            if key == 'compositionals' and compositional_economics_dict.get('rows'):
                compositional_rows = CompositionalEconomicsRows(rows=compositional_economics_dict['rows'])
                yield_dic[key] = _process_compositional_economics_yield(compositional_rows=compositional_rows,
                                                                        date_dict=date_dict)
            elif key != 'compositionals':
                yield_dic[key] = self._process_full_stream_yield(yield_input_dic=yield_input_dic,
                                                                 key=key,
                                                                 date_dict=date_dict,
                                                                 well_head_volumes=well_head_volumes)

        return Yields(**yield_dic)

    def loss_flare_pre(self, loss_flare_input, date_dict, well_head_volumes):
        '''Takes loss and flare inputs and turns them into timeseries of losses and flares

        Args:
            loss_flare_input: a dict of loss and flare arguments
            date_dict: a dict of necessary dates
            well_head_volumes: a dict of production values for oil, gas, and water

        Returns:
            A dict containing loss percentages (in decimal representation) for oil and gas
            and flare percentages (in decimal representation) for gas

            For example:

            {'oil':
                {'loss': [.98, .98, .98, .97, .97]},
             'gas':
                {'loss': [.97, .97, .97, .95, .95]},
                {'flare': [.05, .05, .05, .06, .06]}
            }

        '''

        fpd = date_dict['first_production_date']
        cf_start_date = date_dict['cf_start_date']
        cf_end_date = date_dict['cf_end_date']

        loss_flare_rows = {
            'oil': {
                'loss': loss_flare_input['oil_loss']['rows']
            },
            'gas': {
                'loss': loss_flare_input['gas_loss']['rows'],
                'flare': loss_flare_input['gas_flare']['rows']
            }
        }

        value_key = 'pct_remaining'

        gross_par_dic = {'oil': {'loss': None}, 'gas': {'loss': None, 'flare': None}}

        for phase in loss_flare_rows:
            for cat in gross_par_dic[phase]:
                rows = loss_flare_rows[phase][cat]
                row_keys = rows[0].keys()

                if self._intersect_with_rate_row_keys(row_keys):
                    criteria_key = list(self._intersect_with_rate_row_keys(row_keys))[0]
                    rate_type = loss_flare_input.get('rate_type', 'gross_well_head')
                    rows_cal_method = loss_flare_input.get('rows_calculation_method', 'non_monotonic')
                    monthly_para = rate_rows_process(
                        rows,
                        value_key,
                        criteria_key,
                        rate_type,
                        rows_cal_method,
                        well_head_volumes,
                        date_dict,
                    )
                else:
                    monthly_para = rows_process(rows, date_dict, fpd, cf_start_date, cf_end_date, value_key, 100)

                gross_par_dic[phase][cat] = np.divide(monthly_para, 100)

        return gross_par_dic


class StreamPropertyMonthly(StreamProperty):
    def __init__(self,
                 date_dict,
                 shrinkage_model,
                 yield_model,
                 loss_flare_model,
                 compositional_economics_stream_model,
                 feature_flags: Optional[dict[str, bool]] = None):
        self.date_dict = date_dict
        self.shrinkage_model = shrinkage_model
        self.yield_model = yield_model
        self.loss_flare_model = loss_flare_model
        self.compositional_economics_stream_model = compositional_economics_stream_model
        if not feature_flags:
            feature_flags = {}
        self.compositional_economics_enabled = feature_flags.get(EnabledFeatureFlags.roll_out_compositional_economics)

    def result(self, gross_wh_volume_dict):

        well_head_for_rate_rows = {
            'well_head':
            {key: {
                WI_100_PCT: value['well_head']
            }
             for key, value in gross_wh_volume_dict.items() if key in ALL_PHASES}  # noqa
        }
        well_head_for_rate_rows['well_head']['time'] = gross_wh_volume_dict[next(iter(gross_wh_volume_dict))]['time']

        # shrinkage preprocess
        shrinkage_dict = self.shrinkage_pre(self.shrinkage_model, self.date_dict, well_head_for_rate_rows)

        # yield preprocess
        yield_dict = self.yields_pre(self.yield_model, self.date_dict, well_head_for_rate_rows,
                                     self.compositional_economics_stream_model).dict()

        # loss/flare preprocess
        loss_flare_dict = self.loss_flare_pre(self.loss_flare_model, self.date_dict, well_head_for_rate_rows)

        stream_property_dict = {
            'shrinkage': shrinkage_dict,
            'yield': yield_dict,
            'loss_flare': loss_flare_dict,
        }
        return {'stream_property_dict': stream_property_dict}


class StreamPropertyDaily(StreamProperty):
    def __init__(self,
                 date_dict,
                 shrinkage_model,
                 yield_model,
                 loss_flare_model,
                 compositional_economics_stream_model,
                 feature_flags: Optional[dict[str, bool]] = None):
        self.date_dict = date_dict
        self.shrinkage_model = shrinkage_model
        self.yield_model = yield_model
        self.loss_flare_model = loss_flare_model
        self.compositional_economics_stream_model = compositional_economics_stream_model
        if not feature_flags:
            feature_flags = {}
        self.compositional_economics_enabled = feature_flags.get(EnabledFeatureFlags.roll_out_compositional_economics)

    def result(self, gross_wh_volume_dict):

        well_head_for_rate_rows = {
            'well_head':
            {key: {
                WI_100_PCT: value['well_head']
            }
             for key, value in gross_wh_volume_dict.items() if key in ALL_PHASES}  # noqa
        }
        well_head_for_rate_rows['well_head']['time'] = gross_wh_volume_dict[next(iter(gross_wh_volume_dict))]['time']

        # shrinkage preprocess
        shrinkage_dict = self._shrinkage_daily_pre(self.shrinkage_model, self.date_dict, well_head_for_rate_rows)

        # yield preprocess
        yield_dict = self._yields_daily_pre(self.yield_model, self.date_dict, well_head_for_rate_rows,
                                            self.compositional_economics_stream_model)

        # loss/flare preprocess
        loss_flare_dict = self._loss_flare_daily_pre(self.loss_flare_model, self.date_dict, well_head_for_rate_rows)

        stream_property_dict_daily = {
            'shrinkage': shrinkage_dict,
            'yield': yield_dict,
            'loss_flare': loss_flare_dict,
        }
        return {'stream_property_dict_daily': stream_property_dict_daily}

    def _shrinkage_daily_pre(self, shrinkage_input_dic, date_dict, well_head_volumes):
        '''

        Args:
        Returns:

        '''
        daily_shrinkage = {}
        monthly_shrinkage = self.shrinkage_pre(shrinkage_input_dic, date_dict, well_head_volumes)

        start_date = date_dict['cf_start_date']
        end_date = date_dict['cf_end_date']

        for phase, monthly_param in monthly_shrinkage.items():
            daily_shrinkage[phase] = PreProcess.monthly_list_to_daily(monthly_param, start_date, end_date)

        return daily_shrinkage

    def _yields_daily_pre(self, yield_input_dic, date_dict, well_head_volumes,
                          compositional_economics_stream_model: Optional[dict]):
        daily_yield = {}
        monthly_yield = self.yields_pre(yield_input_dic, date_dict, well_head_volumes,
                                        compositional_economics_stream_model).dict()

        start_date = date_dict['cf_start_date']
        end_date = date_dict['cf_end_date']

        for phase, item in monthly_yield.items():
            daily_yield[phase] = {}
            daily_yield[phase]['shrinkage'] = item['shrinkage']
            daily_yield[phase]['value'] = PreProcess.monthly_list_to_daily(item['value'], start_date, end_date)

        return daily_yield

    def _loss_flare_daily_pre(self, loss_flare_input, date_dict, well_head_volumes):
        daily_loss_flare = {}
        monthly_loss_flare = self.loss_flare_pre(loss_flare_input, date_dict, well_head_volumes)

        start_date = date_dict['cf_start_date']
        end_date = date_dict['cf_end_date']

        for phase, item in monthly_loss_flare.items():
            daily_loss_flare[phase] = {}
            for cat, monthly_param in item.items():
                daily_loss_flare[phase][cat] = PreProcess.monthly_list_to_daily(monthly_param, start_date, end_date)

        return daily_loss_flare
