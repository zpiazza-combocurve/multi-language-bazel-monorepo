import numpy as np
import polars as pl
from datetime import date

from combocurve.science.econ.pre_process import PreProcess
from combocurve.science.econ.general_functions import py_date_to_index
from combocurve.science.econ.econ_calculations.calculation import EconCalculation


def calculate_wh_volume(
    products,
    date_dict,
    forecast_data,
    risk,
    ignore_forecast_index=None,
    ignore_hist_prod='no',
):
    '''calculate wellhead volume for all products

    Args:
        products (dict): products and respective stream objects
        forecast_data (dict): forecast parameters for each product
        risk (dict): risk parameters for each product
        date_dict (dict): dictionary of dates
        ignore_forecast_index (int, optional): index to start forecast. Defaults to None.
        ignore_hist_prod (str, optional): whether to ignore historical production. Defaults to 'no'.

    Returns:
        wh_volume_dict (dict): wellhead and pre-risk monthly volumes for all products
        wh_volume_dict_daily (dict): wellhead daily volumes for all products
        unadjusted_gross_wh_volume (dict): unadjusted (entire production) of all products
    '''
    streams_list = list(products.keys())
    wh_volume_dict = {}
    wh_volume_dict_daily = {}
    unadjusted_gross_wh_volume = {}

    for stream_name in streams_list:
        this_stream = products[stream_name]
        this_risk_model = risk[stream_name]
        (
            wh_volume_dict[stream_name],
            wh_volume_dict_daily[stream_name],
            unadjusted_gross_wh_volume[stream_name],
        ) = this_stream.get_gross_well_head_volume(
            forecast_data,
            this_risk_model,
            date_dict,
            ignore_forecast_index,
            ignore_hist_prod,
        )
    # TODO: use package python-varname: https://github.com/pwwang/python-varname
    return {
        'gross_wh_volume_dict': wh_volume_dict,
        'gross_wh_volume_dict_daily_temp': wh_volume_dict_daily,
        'unadjusted_wh_volume': unadjusted_gross_wh_volume,
        't_all': next(iter(wh_volume_dict.items()))[1]['time'],
        'date_list': next(iter(wh_volume_dict.items()))[1]['date']
    }


class Wellhead:
    pass


class WellheadMonthly(Wellhead, EconCalculation):
    def __init__(self,
                 date_dict,
                 products,
                 risk_model,
                 adjusted_forecast_data=None,
                 ignore_hist_prod='no',
                 ignore_forecast_index=None):
        self.products = products
        self.adjusted_forecast_data = adjusted_forecast_data
        self.date_dict = date_dict
        self.ignore_hist_prod = ignore_hist_prod
        self.risk_model = risk_model
        self.ignore_forecast_index = ignore_forecast_index

    def result(self, unecon_bool):
        if unecon_bool:
            return self._empty_wh_volume(self.products, self.date_dict)
        else:
            return calculate_wh_volume(
                self.products,
                self.date_dict,
                self.adjusted_forecast_data,
                self.risk_model,
                self.ignore_forecast_index,
                self.ignore_hist_prod,
            )

    def _empty_wh_volume(self, products, date_dict):
        '''return an empty wellhead volume array, called when well is unecon

        Args:
            products (dict): products (Stream objects) and production data
            date_dict (dict): dictionary of dates

        Returns:
            empty_wh_volume (dict): zero-volume wellhead and pre-risk values
            empty_wh_volume_daily (dict): zero-volume wellhead values
        '''
        fpd = date_dict['first_production_date']
        streams_list = list(products.keys())
        empty_phase_wh_volume = {
            'date': np.array([np.datetime64(fpd, 'M').astype(date)]),
            'time': np.array([0]),
            'well_head': np.array([0]),
            'pre_risk': np.array([0]),
        }
        empty_phase_wh_volume_daily = {
            'value': np.array([0]),
            'index': np.array([py_date_to_index(fpd)]),
        }
        empty_wh_volume_dict = {
            'monthly': empty_phase_wh_volume,
            'daily': empty_phase_wh_volume_daily,
        }
        PreProcess.adjust_volume_date_range(empty_wh_volume_dict, date_dict)
        empty_wh_volume = dict(zip(streams_list, [empty_wh_volume_dict['monthly']] * len(streams_list)))
        empty_wh_volume_daily = dict(zip(streams_list, [empty_wh_volume_dict['daily']] * len(streams_list)))

        return {
            'gross_wh_volume_dict': empty_wh_volume,
            'gross_wh_volume_dict_daily_temp': empty_wh_volume_daily,
            'unadjusted_wh_volume': 0,
            't_all': next(iter(empty_wh_volume.items()))[1]['time'],
            'date_list': next(iter(empty_wh_volume.items()))[1]['date']
        }


class WellheadDaily(EconCalculation, Wellhead):
    def __init__(self,
                 date_dict,
                 products,
                 risk_model,
                 adjusted_forecast_data=None,
                 ignore_hist_prod='no',
                 ignore_forecast_index=None):
        self.products = products
        self.adjusted_forecast_data = adjusted_forecast_data
        self.date_dict = date_dict
        self.ignore_hist_prod = ignore_hist_prod
        self.risk_model = risk_model
        self.ignore_forecast_index = ignore_forecast_index

    def result(self, unecon_bool):
        if unecon_bool:
            return self._empty_wh_volume_daily(self.products, self.date_dict['first_production_date'])
        else:
            return self._calculate_wh_volume_daily(
                self.products,
                self.date_dict,
                self.adjusted_forecast_data,
                self.risk_model,
                self.ignore_forecast_index,
                self.ignore_hist_prod,
            )

    def _calculate_wh_volume_daily(
        self,
        products,
        date_dict,
        forecast_data,
        risk,
        ignore_forecast_index=None,
        ignore_hist_prod='no',
    ):
        '''calculate daily wellhead volume for all products

        Args:
            products (dict): products and respective stream objects
            forecast_data (dict): forecast parameters for each product
            risk (dict): risk parameters for each product
            date_dict (dict): dictionary of dates
            ignore_forecast_index (int, optional): index to start forecast. Defaults to None.
            ignore_hist_prod (str, optional): whether to ignore historical production. Defaults to 'no'.

        Returns:
            dict: wellhead daily volumes for all products
        '''
        streams_list = list(products.keys())
        wh_volume_dict_daily = {}
        for stream_name in streams_list:
            this_stream = products[stream_name]
            this_risk_model = risk[stream_name]
            wh_volume_dict_daily[stream_name] = this_stream.get_gross_well_head_volume_daily(
                forecast_data,
                this_risk_model,
                date_dict,
                ignore_forecast_index,
                ignore_hist_prod,
            )
        return {'gross_wh_volume_dict_daily': wh_volume_dict_daily}

    def _empty_wh_volume_daily(self, products, fpd):
        '''return an empty wellhead volume array, called when well is unecon

        Args:
            products (dict): products (Stream objects) and production data
            fpd (date): first production date

        Returns:
            dict: zero-volume wellhead and pre-risk values
        '''
        streams_list = list(products.keys())
        empty_phase_wh_volume = {
            'date': np.array([np.datetime64(fpd).astype(date)]),
            'time': np.array([0]),
            'well_head': np.array([0]),
            'pre_risk': np.array([0]),
        }
        return {'gross_wh_volume_dict_daily': dict(zip(streams_list, [empty_phase_wh_volume] * len(streams_list)))}


def date_array_from_group_df(group_df, date_dict):
    date_array = np.array(group_df['date'].str.strptime(pl.Date, fmt='%Y-%m-%d'), dtype=date)
    start_t = int(np.datetime64(date_array[0], 'M') - np.datetime64(date_dict['first_production_date'], 'M'))
    t_all = np.arange(start_t, len(date_array) + start_t)

    return date_array, t_all


class GroupWellheadMonthly():
    def __init__(self, group_df, date_dict):
        self.group_df = group_df
        self.date_dict = date_dict

    def result(self):
        date_array, t_all = date_array_from_group_df(self.group_df, self.date_dict)
        return {
            'gross_wh_volume_dict': {},  # used in stream properties and capex link to rate
            'gross_wh_volume_dict_daily_temp': {},
            'unadjusted_wh_volume': {},
            't_all': t_all,
            'date_list': date_array
        }
