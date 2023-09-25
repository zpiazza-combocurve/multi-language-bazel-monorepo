import numpy as np
import datetime
from combocurve.science.econ.econ_use_forecast.use_forecast import process_phase_forecast
from combocurve.science.econ.general_functions import py_date_to_index
from combocurve.science.econ.pre_process import PreProcess
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults
from combocurve.science.econ.daily_volume import get_phase_forecast_range, get_phase_daily


def _fill_nan_in_production_data(production_data):
    production_data['value'] = np.nan_to_num(production_data['value'], nan=0)


class Stream:
    def __init__(
        self,
        phase,
        production_data,
        forecast_name,
        schedule,
        phase_pct_key,
        phase_actual_forecast,
        tc_risking,
    ):
        self.product_name = phase
        if production_data:
            _fill_nan_in_production_data(production_data)
        self.production_data = production_data
        self.forecast_name = forecast_name
        self.schedule = schedule
        self.phase_pct_key = phase_pct_key
        self.phase_actual_forecast = phase_actual_forecast
        self.tc_risking = tc_risking

    def get_gross_well_head_volume(self, forecast_data, phase_risk_model, dates, ignore_forecast_index,
                                   ignore_hist_prod):
        '''
            Combine the forecast data with production data and return the well head volume
            for this product. This is only for products that has a forecast. In order to
            achieve the use of overwrite that we had earlier for rollUp, please pass a modified
            dates dict and ignore_forecast_index parameter instead.
            Inputs:
                dates: dictionary containing as of date, fpd, ehd, fsd and lpd.
            Outputs:
                gross_wh_volume_dict: a dict containg gross well head and pre-risk volumes
        '''
        this_production_data = None if ignore_hist_prod == 'yes' else self.production_data
        cf_end_date = dates['cf_end_date']
        fpd = dates['first_production_date']
        volume_start_date = dates['volume_start_date']  # for overriding volume start in rollUp
        end_econ_index = py_date_to_index(cf_end_date)

        gross_wh_volume_dict = {
            'monthly': {
                'date': np.array([np.datetime64(fpd, 'M').astype(datetime.date)]),
                'time': np.array([0]),
                'well_head': np.array([0]),
                'pre_risk': np.array([0])
            },
            # this daily volume is only used for calculating reversion
            # and cut off and is not the actual daily well head volume
            'daily': {
                'index': np.array([py_date_to_index(fpd)]),
                'value': np.array([])
            }
        }

        total_num_months = (cf_end_date.year
                            - volume_start_date.year) * 12 + cf_end_date.month - volume_start_date.month + 1

        unadjusted_gross_wh_volume = np.array([])

        if total_num_months > 0:
            volume_start_offset_to_fpd = (volume_start_date.year - fpd.year) * 12 + volume_start_date.month - fpd.month
            time_list = (np.arange(total_num_months) + volume_start_offset_to_fpd).tolist()
            date_list = (np.array(time_list) + np.datetime64(fpd, 'M')).tolist()

            gross_wh_volume_dict['monthly'].update({'date': date_list, 'time': time_list})

            pre_risk_phase_ret_monthly, phase_ret_daily, phase_ret_monthly = process_phase_forecast(
                this_production_data, forecast_data, self.phase_actual_forecast, phase_risk_model, self.phase_pct_key,
                date_list, self.product_name, end_econ_index, ignore_forecast_index, total_num_months, dates)
            gross_wh_volume_dict['daily']['value'] = phase_ret_daily['value']
            gross_wh_volume_dict['daily']['index'] = phase_ret_daily['index']
            gross_wh_volume_dict['monthly']['date'] = date_list
            gross_wh_volume_dict['monthly']['time'] = time_list
            gross_wh_volume_dict['monthly']['well_head'] = phase_ret_monthly
            gross_wh_volume_dict['monthly']['pre_risk'] = pre_risk_phase_ret_monthly

            unadjusted_gross_wh_volume = phase_ret_monthly

        PreProcess.adjust_volume_date_range(gross_wh_volume_dict, dates)

        return gross_wh_volume_dict['monthly'], gross_wh_volume_dict['daily'], unadjusted_gross_wh_volume

    def get_gross_well_head_volume_daily(self, forecast_data, phase_risk_model, dates, ignore_forecast_index,
                                         ignore_hist_prod):
        this_production_data = None if ignore_hist_prod == 'yes' else self.production_data
        start_date = max(dates["first_production_date"], dates["volume_start_date"])
        start_idx = py_date_to_index(start_date)
        end_idx = py_date_to_index(dates["cf_end_date"])
        if end_idx - start_idx + 1 <= 0:
            gross_wh_volume_dict = {
                'daily': {
                    "date": np.array([dates["first_production_date"]]),
                    "time": np.array([0]),
                    "well_head": np.array([0]),
                    "pre_risk": np.array([0])
                }
            }
        else:
            gross_wh_volume_dict = {'daily': {}}

            start_consider_forecast_date = dates.get("start_using_forecast", {}).get(self.product_name, None)
            if ignore_forecast_index is not None:
                start_consider_forecast_idx = ignore_forecast_index
            elif start_consider_forecast_date is None:
                start_consider_forecast_idx = None
            else:
                start_consider_forecast_idx = py_date_to_index(start_consider_forecast_date)

            forecast_end_idx = end_idx if dates["side_phase_end_date"] is None else py_date_to_index(
                dates["side_phase_end_date"])
            forecast_range = get_phase_forecast_range(
                phase=self.product_name,
                production_data={self.product_name: this_production_data},
                forecast_data=forecast_data,
                actual_forecast_dict={self.product_name: self.phase_actual_forecast},
                pct_key_by_phase={self.product_name: self.phase_pct_key},
                start_idx=start_idx,
                end_idx=end_idx,
                start_consider_forecast_idx=start_consider_forecast_idx,
                forecast_end_idx=forecast_end_idx)

            risk_prod = "yes" if phase_risk_model.get("risk_prod", None) == "yes" else None

            risk_date_dict = dates.copy()
            risk_date_dict["offset_to_end_history"] = risk_date_dict.pop("end_history_date")

            for key, tmp_risk_model in zip(["well_head", "pre_risk"],
                                           [phase_risk_model, EconModelDefaults.phase_risking]):
                ret_idx, gross_wh_volume_dict['daily'][key] = get_phase_daily(phase=self.product_name,
                                                                              start_idx=start_idx,
                                                                              end_idx=end_idx,
                                                                              forecast_range=forecast_range,
                                                                              forecast_data=forecast_data,
                                                                              phase_pct_key=self.phase_pct_key,
                                                                              phase_prod=this_production_data,
                                                                              phase_risk=tmp_risk_model,
                                                                              risk_prod=risk_prod,
                                                                              risk_date_dict=risk_date_dict)
            offset_start_date = (dates['volume_start_date'] - dates['first_production_date']).days
            gross_wh_volume_dict['daily']["time"] = ((ret_idx - min(ret_idx)) + offset_start_date)
            gross_wh_volume_dict['daily']["date"] = (gross_wh_volume_dict['daily']["time"] + np.datetime64(start_date))
        PreProcess.adjust_volume_date_range_daily(gross_wh_volume_dict, dates)

        return {key: gross_wh_volume_dict['daily'][key] for key in gross_wh_volume_dict['daily'].keys()}

    def get_gross_sales_volume(self, phase_gross_wh_volume, stream_property_dict):
        '''
            Calculate and return a dict containing gross sales volume and unshrunk volume.
            Oil: Gross Well Head -> (loss) -> Unshrunk -> (shrinkage) -> Gross Sales
            Gas: Gross Well Head -> (loss) -> Pre Flare -> (flare) -> Unshrunk -> (shrinkage) -> Gross Sales
        '''
        gross_wh_volume = phase_gross_wh_volume['well_head']
        gross_sales_volume_dict = {}
        # oil
        if self.product_name == 'oil':
            unshrunk_oil_volume = np.multiply(gross_wh_volume, stream_property_dict['loss_flare']['oil']['loss'])
            gross_oil_sales_volume = np.multiply(unshrunk_oil_volume, stream_property_dict['shrinkage']['oil'])
            gross_sales_volume_dict = {
                'unshrunk': unshrunk_oil_volume,
                'sales': gross_oil_sales_volume,
            }

        # gas
        # TODO: compute the unshrunk and gross sales volumes using unrisked gas as well
        elif self.product_name == 'gas':
            pre_risk_gross_wh_volume = phase_gross_wh_volume['pre_risk']

            pre_flare_gas_volume = np.multiply(gross_wh_volume, stream_property_dict['loss_flare']['gas']['loss'])
            unshrunk_gas_volume = np.multiply(pre_flare_gas_volume, stream_property_dict['loss_flare']['gas']['flare'])
            gross_gas_sales_volume = np.multiply(unshrunk_gas_volume, stream_property_dict['shrinkage']['gas'])

            pre_risk_pre_flare_gas_volume = np.multiply(pre_risk_gross_wh_volume,
                                                        stream_property_dict['loss_flare']['gas']['loss'])
            pre_risk_unshrunk_gas_volume = np.multiply(pre_risk_pre_flare_gas_volume,
                                                       stream_property_dict['loss_flare']['gas']['flare'])
            pre_risk_gross_gas_sales_volume = np.multiply(pre_risk_unshrunk_gas_volume,
                                                          stream_property_dict['shrinkage']['gas'])

            gross_sales_volume_dict = {
                'pre_flare': pre_flare_gas_volume,
                'unshrunk': unshrunk_gas_volume,
                'sales': gross_gas_sales_volume,
                'pre_risk_pre_flare': pre_risk_pre_flare_gas_volume,
                'pre_risk_unshrunk': pre_risk_unshrunk_gas_volume,
                'pre_risk_sales': pre_risk_gross_gas_sales_volume,
            }

        # water
        elif self.product_name == 'water':
            gross_sales_volume_dict = {
                'unshrunk': gross_wh_volume,
                'sales': gross_wh_volume,
            }
        return gross_sales_volume_dict

    def get_ownership_volume(self, phase_gross_wh_volume, gross_sales_volume_dict, phase_ownership):
        '''
            Calculate and return a dict containing monthly ownership volume.
            Gross Well Head -> (ownership) -> Net Well Head
        '''
        ownership_volume_names = list(phase_ownership.keys())
        ownership_volume_dict = {}
        for volume_dict_key in phase_gross_wh_volume.keys():
            if volume_dict_key in ['date', 'time']:
                continue
            ownership_volume_dict[volume_dict_key] = {}
            for ownership_multiplier_name in ownership_volume_names:
                ownership_volume_dict[volume_dict_key][ownership_multiplier_name] = np.multiply(
                    phase_gross_wh_volume[volume_dict_key], phase_ownership[ownership_multiplier_name])

        for volume_dict_key in gross_sales_volume_dict.keys():
            if volume_dict_key in ['date', 'time']:
                continue
            ownership_volume_dict[volume_dict_key] = {}
            for ownership_multiplier_name in ownership_volume_names:
                ownership_volume_dict[volume_dict_key][ownership_multiplier_name] = np.multiply(
                    gross_sales_volume_dict[volume_dict_key], phase_ownership[ownership_multiplier_name])
        return ownership_volume_dict
