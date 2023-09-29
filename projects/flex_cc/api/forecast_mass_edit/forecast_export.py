import io
import csv
import datetime

import numpy as np
from copy import deepcopy
from bson import ObjectId
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from api.typecurve_mass_edit.well_headers_abbreviated import orginal_custom_header_dict
from api.forecast_mass_edit.shared import adjust_segments, clean_filename
from api.forecast_mass_edit.display_templates import (status_dt, prob_type_dt, det_type_dt, daily_units_dt,
                                                      monthly_units_dt, display_units_dt, well_headers_json,
                                                      well_header_units_json)
from combocurve.utils.units import get_multiplier

from combocurve.utils.constants import DAYS_IN_YEAR

multi_seg = MultipleSegments()

required_well_headers = [
    'inptID',
    'api10',
    'api12',
    'api14',
    'well_number',
    'state',
    'county',
    'current_operator',
    'current_operator_alias',
    'perf_lateral_length',
    'total_prop_weight',
    'total_fluid_volume',
    'landing_zone',
    'target_formation',
    'basin',
    'first_prod_date',
    'first_prod_date_daily_calc',
    'first_prod_date_monthly_calc',
    'last_prod_date_daily',
    'last_prod_date_monthly',
    'month_produced',
    'chosenID',
]

date_well_headers = set([
    'first_prod_date',
    'first_prod_date_daily_calc',
    'first_prod_date_monthly_calc',
    'last_prod_date_daily',
    'last_prod_date_monthly',
])

q_units = {
    'oil': 'oil',
    'gas': 'gas',
    'water': 'water',
    'oil/gas': 'oil/gas',
    'oil/water': 'oil/water',
    'gas/oil': 'gas/oil',
    'gas/water': 'gas/water',
    'water/oil': 'water/oil',
    'water/gas': 'water/gas',
}

#params to keep: ['start_idx', 'end_idx', 'q_start', 'q_end', 'name', 'D_eff', 'D', 'b', 'realized_D_eff_sw', 'sw_idx',
#  'q_sw', 'D_exp_eff', 'D_exp']

forecast_params = {
    'name': 'Segment Type',
    'start_idx': 'Start Date',
    'start_idx.days': 'Start Day',
    'end_idx': 'End Date',
    'end_idx.days': 'End Day',
    'q_start': 'q Start (BBL/D, MCF/D, BBL/MCF, BBL/BBL, MCF/BBL)',
    'q_end': 'q End (BBL/D, MCF/D, BBL/MCF, BBL/BBL, MCF/BBL)',
    'D_eff': 'Di Eff-Sec (%)',
    'D': 'Di Nominal',
    'b': 'b',
    'realized_D_eff_sw': 'Realized D Sw-Eff-Sec (%)',
    'sw_idx': 'Sw-Date',
    'sw_idx_arps': 'sw_idx',
    'D_exp': 'D_exp',
    'q_sw': 'q_sw'
}

fpd_sources = {
    'first_prod_date': 'First Prod Date',
    'first_prod_date_daily_calc': 'First Prod Date Daily',
    'first_prod_date_monthly_calc': 'First Prod Date Monthly',
    'schedule': 'Scheduling',
    'fixed': 'Fixed Date',
}

data_frequencies = {'monthly': 'Monthly Prod Data', 'daily': 'Daily Prod Data'}

first_prod_dates_per_freq = {
    'monthly': 'first_prod_date_monthly_calc',
    'daily': 'first_prod_date_daily_calc',
}

forecast_export_header = [
    'Forecast Name', 'Well Name', 'INPT ID', 'Chosen ID', 'API 10', 'API 12', 'API 14', 'Well Number', 'State',
    'County/Parish', 'Current Operator', 'Current Operator Alias', 'Perf Lateral Length', 'Total Prop (All Jobs)',
    'Total Fluid (All Jobs)', 'Landing Zone', 'Target Formation', 'Basin', 'First Prod Date', 'First Prod Date Daily',
    'First Prod Date Monthly', 'Last Prod Date Daily', 'Last Prod Date Monthly', 'Months Produced', 'Forecasted By',
    'Forecasted On', 'Reviewed By', 'Reviewed On', 'Phase', 'Sub Type', 'Applied Type Curve', 'Applied Type Curve ID',
    'Applied Normalization', 'FPD Source', 'Risk Factor', 'Forecast Generated', 'Monthly Cum MBBL,MMCF',
    'Daily Cum MBBL,MMCF', 'Well Life (Year)', 'Remaining Well Life From Today (Years)', 'EUR MBBL,MMCF',
    'EUR/FT BBL/FT,MCF/FT', 'Segment', 'Series', 'Status', 'Type', 'Base Phase', 'q Final MCF/D,BBL/D', 'Segment Type',
    'Start Date', 'End Date', 'Start Day', 'End Day', 'q Start (BBL/D, MCF/D, BBL/MCF, BBL/BBL, MCF/BBL)',
    'q End (BBL/D, MCF/D, BBL/MCF, BBL/BBL, MCF/BBL)', 'Di Eff-Sec (%)', 'Di Nominal', 'b', 'Realized D Sw-Eff-Sec (%)',
    'Sw-Date', 'Warning'
]

forecast_export_formatted_header = [
    'Forecast Name', 'Well Name', 'INPT ID', 'Chosen ID', 'API 10', 'API 12', 'API 14', 'Well Number', 'State',
    'County/Parish', 'Current Operator', 'Current Operator Alias', 'Perf Lateral Length (FT)',
    'Total Prop (All Jobs) (LB)', 'Total Fluid (All Jobs) (BBL)', 'Landing Zone', 'Target Formation', 'Basin',
    'First Prod Date', 'First Prod Date Daily', 'First Prod Date Monthly', 'Last Prod Date Daily',
    'Last Prod Date Monthly', 'Months Produced', 'Forecasted By', 'Forecasted On', 'Reviewed By', 'Reviewed On',
    'Phase', 'Sub Type', 'Applied Type Curve', 'Applied Type Curve ID', 'Applied Normalization', 'FPD Source',
    'Risk Factor', 'Forecast Generated', 'Monthly Cum (MBBL, MMCF)', 'Daily Cum (MBBL, MMCF)', 'Well Life (Year)',
    'Remaining Well Life From Today (Years)', 'EUR (MBBL, MMCF)', 'EUR/FT (BBL/FT, MCF/FT)', 'Segment', 'Series',
    'Status', 'Type', 'Base Phase', 'q Final (BBL/D, MCF/D)', 'Segment Type', 'Start Date', 'End Date', 'Start Day',
    'End Day', 'q Start (BBL/D, MCF/D, BBL/MCF, BBL/BBL, MCF/BBL)', 'q End (BBL/D, MCF/D, BBL/MCF, BBL/BBL, MCF/BBL)',
    'Di Eff-Sec (%)', 'Di Nominal', 'b', 'Realized D Sw-Eff-Sec (%)', 'Sw-Date', 'Warning'
]

BASE_DATE_NP = np.datetime64('1900-01-01')
FORECAST_BASE_PHASES = ['oil', 'gas', 'water']


def convert_idx2date(idx):
    return BASE_DATE_NP + int(idx)


def convert_utc_date2idx(date):
    if date:
        return (np.datetime64(date, 'D') - BASE_DATE_NP).astype('int')
    else:
        return date


def make_local(date):
    if not date:
        return ''
    return np.datetime_as_string(np.datetime64(date), unit='D', timezone='UTC')


def get_convert_func(orig_unit, target_unit):
    def original(v):
        return v

    if not orig_unit or not target_unit:
        return original

    multiplier = get_multiplier(orig_unit.lower(), target_unit.lower())

    def convert_fn(orig_num):
        if (type(orig_num) == int or type(orig_num) == float) and not np.isfinite(orig_num):
            return None

        return orig_num * multiplier

    return convert_fn


def get_units_convert_funcs(this_dict, origin_dt, target_dt=display_units_dt):
    acc = {}
    for k, v in this_dict.items():
        acc[k] = get_convert_func(origin_dt['fields'][v], target_dt['fields'][v])
    return acc


def get_ratio_q_final(ratio_segments, base_segments):
    if not base_segments:
        return 'N/A'

    last_ratio_segment = ratio_segments[-1]
    if last_ratio_segment:
        last_ratio_index = last_ratio_segment['end_idx']
    else:
        last_ratio_index = -1

    last_base_segment = base_segments[-1]
    if last_base_segment:
        last_base_index = last_base_segment['end_idx']
    else:
        last_base_index = -1

    final_idx = min(last_ratio_index, last_base_index)

    if (final_idx == -1):
        return None

    return multi_seg.predict_time_ratio([final_idx], ratio_segments, base_segments)[0]


def resolve_prod_date_idx(phase_data_freq, daily_idx, monthly_idx, header_idx, forecast_idx):
    # use daily idx if forecasted on daily; otherwise default to valid monthly idx
    if phase_data_freq == 'daily' and daily_idx and np.isfinite(daily_idx):
        return daily_idx
    elif monthly_idx and np.isfinite(monthly_idx):
        return monthly_idx

    if header_idx and np.isfinite(header_idx):
        return header_idx

    return forecast_idx


class ForecastExport:
    def __init__(self, context):
        self.context = context

    def get_well_headers(self):
        heads = well_headers_json
        units = well_header_units_json
        custom_headers = self.get_custom_header()

        head_fields = {}
        head_fields.update(heads['fields'])
        head_fields.update(custom_headers)

        unit_fields = units['fields']

        for k, v in unit_fields.items():
            head_fields[k] = f' {unit_fields[k]}'

        return head_fields

    def get_custom_header(self):
        customerized_headers = {}
        custom_headers = self.context.custom_header_configurations_collection.find_one({})
        if not custom_headers:
            return {}

        if custom_headers:
            for key in orginal_custom_header_dict:
                if custom_headers.get(key) and orginal_custom_header_dict[key] != custom_headers[key]['label']:
                    customerized_headers[key] = custom_headers[key]['label']

        return customerized_headers

    def get_segment_key(self, key):
        if key == 'start_idx.days' or key == 'end_idx.days':
            key = key.replace('.days', '')
        return key

    def get_boolean_display(self, value):
        if value is True:
            return 'Yes'
        elif value is False:
            return 'No'
        else:
            return ''

    def get_forecast_param_value(self, segment, key, first_forecast_idx):
        segment_key = self.get_segment_key(key)
        value = segment.get(segment_key)

        if key == 'sw_idx_arps':
            return segment.get('sw_idx')

        if (not value and value != 0):
            return ''

        if (key == 'start_idx' or key == 'end_idx' or key == 'sw_idx'):
            return convert_idx2date(value)

        if (key == 'D_eff' or key == 'realized_D_eff_sw'):
            return value * 100

        if (key == 'name' and value == 'empty'):
            return 'shut_in'

        if (key == 'start_idx.days' or key == 'end_idx.days'):
            return value - first_forecast_idx if first_forecast_idx else ''

        if key in ['D_exp', 'q_sw']:
            return value

        # if (forecastParamsConvert[key]):
        #     return forecastParamsConvert[key]

        return value

    def get_remaining_well_life(self, segments):
        if segments:
            forecast_end_idx = segments[-1]['end_idx']
            today_idx = (np.datetime64('today', 'D') - np.datetime64('1900-01-01')).astype('int')

            return round(max(forecast_end_idx - today_idx, 0) / DAYS_IN_YEAR, 2)

        return 0

    def get_well_life(self, resolved_fpd_idx, resolved_lpd_idx, segments):
        forecast_start_idx = 0
        forecast_end_idx = 0
        if segments:
            forecast_end_idx = segments[-1]['end_idx']
            forecast_start_idx = segments[0]['start_idx']

        if not resolved_fpd_idx:
            return round((forecast_end_idx - forecast_start_idx) / DAYS_IN_YEAR, 2)

        if resolved_lpd_idx:
            max_idx = max(resolved_lpd_idx, forecast_end_idx)
        else:
            max_idx = forecast_end_idx

        if max_idx > resolved_fpd_idx:
            return round((max_idx - resolved_fpd_idx) / DAYS_IN_YEAR, 2)

        return 0

    def get_forecast_query_dict(self):
        project1 = {
            '$project': {
                '_id': 1,
                'forecastType': 1,
                'P_dict': 1,
                'phase': 1,
                'status': 1,
                'warning': 1,
                'well': 1,
                'data_freq': 1,
                'forecastedBy': 1,
                'forecastedAt': 1,
                'reviewedBy': 1,
                'reviewedAt': 1,
                'typeCurve': 1,
                'typeCurveId': 1,
                'typeCurveApplySetting': 1,
            },
        }

        lookup_forecasted_by = {
            '$lookup': {
                'from': 'users',
                'localField': 'forecastedBy',
                'foreignField': '_id',
                'as': 'forecastedBy',
            },
        }

        lookup_reviewed_by = {
            '$lookup': {
                'from': 'users',
                'localField': 'reviewedBy',
                'foreignField': '_id',
                'as': 'reviewedBy',
            },
        }

        project_user_names = {
            '$project': {
                '_id': 1,
                'forecastType': 1,
                'P_dict': 1,
                'phase': 1,
                'status': 1,
                'warning': 1,
                'well': 1,
                'data_freq': 1,
                'forecastedBy': {
                    '$concat': ['$forecastedBy.firstName', ' ', '$forecastedBy.lastName']
                },
                'forecastedAt': 1,
                'reviewedBy': {
                    '$concat': ['$reviewedBy.firstName', ' ', '$reviewedBy.lastName']
                },
                'reviewedAt': 1,
                'typeCurve': 1,
                'typeCurveId': 1,
                'typeCurveApplySetting': 1,
            },
        }

        lookup_type_curve = {
            '$lookup': {
                'from': 'type-curves',
                'localField': 'typeCurve',
                'foreignField': '_id',
                'as': 'typeCurve',
            },
        }

        project_type_curve_names = {
            '$project': {
                '_id': 1,
                'forecastType': 1,
                'P_dict': 1,
                'phase': 1,
                'status': 1,
                'warning': 1,
                'well': 1,
                'data_freq': 1,
                'forecastedBy': 1,
                'forecastedAt': 1,
                'reviewedBy': 1,
                'reviewedAt': 1,
                'typeCurve': '$typeCurve.name',
                'typeCurveId': '$typeCurve._id',
                'typeCurveApplySetting': 1,
            },
        }

        project2 = {
            '$project': {
                '_id': 1,
                'data': ['$phase', '$P_dict'],
                'status': ['$phase', '$status'],
                'type': ['$phase', '$forecastType'],
                'data_freq': ['$phase', '$data_freq'],
                'forecastedBy': ['$phase', '$forecastedBy'],
                'forecastedAt': ['$phase', '$forecastedAt'],
                'reviewedBy': ['$phase', '$reviewedBy'],
                'reviewedAt': ['$phase', '$reviewedAt'],
                'typeCurve': ['$phase', '$typeCurve'],
                'typeCurveId': ['$phase', '$typeCurveId'],
                'typeCurveApplySetting': ['$phase', '$typeCurveApplySetting'],
                'warning': ['$phase', '$warning'],
                'well_id': '$well._id',
                'well': 1,
            },
        }

        group = {
            '$group': {
                '_id': '$well_id',
                'data': {
                    '$push': '$data'
                },
                'status': {
                    '$push': '$status'
                },
                'type': {
                    '$push': '$type'
                },
                'data_freq': {
                    '$push': '$data_freq'
                },
                'forecastedBy': {
                    '$push': '$forecastedBy'
                },
                'forecastedAt': {
                    '$push': '$forecastedAt'
                },
                'reviewedBy': {
                    '$push': '$reviewedBy'
                },
                'reviewedAt': {
                    '$push': '$reviewedAt'
                },
                'typeCurve': {
                    '$push': '$typeCurve'
                },
                'typeCurveId': {
                    '$push': '$typeCurveId'
                },
                'typeCurveApplySetting': {
                    '$push': '$typeCurveApplySetting'
                },
                'wellHeaders': {
                    '$first': '$well'
                },
                'warning': {
                    '$push': '$warning'
                },
            }
        }

        project3 = {
            '$project': {
                '_id': 1,
                'data': {
                    '$arrayToObject': '$data'
                },
                'status': {
                    '$arrayToObject': '$status'
                },
                'type': {
                    '$arrayToObject': '$type'
                },
                'data_freq': {
                    '$arrayToObject': '$data_freq'
                },
                'forecastedBy': {
                    '$arrayToObject': '$forecastedBy'
                },
                'forecastedAt': {
                    '$arrayToObject': '$forecastedAt'
                },
                'reviewedBy': {
                    '$arrayToObject': '$reviewedBy'
                },
                'reviewedAt': {
                    '$arrayToObject': '$reviewedAt'
                },
                'typeCurve': {
                    '$arrayToObject': '$typeCurve'
                },
                'typeCurveId': {
                    '$arrayToObject': '$typeCurveId'
                },
                'typeCurveApplySetting': {
                    '$arrayToObject': '$typeCurveApplySetting'
                },
                'wellHeaders': 1,
                'warning': {
                    '$arrayToObject': '$warning'
                },
            }
        }

        project_cumulative = {
            '$project': {
                '_id': 1,
                'data': 1,
                'status': 1,
                'type': 1,
                'wellHeaders': 1,
                'data_freq': 1,
                'forecastedBy': 1,
                'forecastedAt': 1,
                'reviewedBy': 1,
                'reviewedAt': 1,
                'typeCurve': 1,
                'typeCurveId': 1,
                'typeCurveApplySetting': 1,
                'warning': 1,
            }
        }

        sort = {'$sort': {'wellHeaders.well_name': 1, '_id': 1}}

        return (project1, project2, project3, group, lookup_forecasted_by, lookup_reviewed_by, project_cumulative,
                project_user_names, lookup_type_curve, project_type_curve_names, sort)

    def get_data_pipeline(self, is_probabilistic, forecast, phase, wells):
        (project1, project2, project3, group, lookup_forecasted_by, lookup_reviewed_by, project_cumulative,
         project_user_names, lookup_type_curve, project_type_curve_names, sort) = self.get_forecast_query_dict()
        if not is_probabilistic:
            project1['$project']['ratio'] = 1
            project_user_names['$project']['ratio'] = 1
            project_type_curve_names['$project']['ratio'] = 1
            project2['$project']['ratio'] = ['$phase', '$ratio']
            group['$group']['ratio'] = {'$push': '$ratio'}
            project3['$project']['ratio'] = {'$arrayToObject': '$ratio'}
            project_cumulative['$project']['ratio'] = 1

            project1['$project']['forecastSubType'] = 1
            project_user_names['$project']['forecastSubType'] = 1
            project_type_curve_names['$project']['forecastSubType'] = 1
            project2['$project']['forecastSubType'] = ['$phase', '$forecastSubType']
            group['$group']['forecastSubType'] = {'$push': '$forecastSubType'}
            project3['$project']['forecastSubType'] = {'$arrayToObject': '$forecastSubType'}
            project_cumulative['$project']['forecastSubType'] = 1

        data_pipeline = [{
            '$match': {
                'forecast': ObjectId(forecast),
                'phase': {
                    '$in': phase
                },
                'well': {
                    '$in': list(map(ObjectId, wells))
                },
            },
        }, project1, lookup_forecasted_by, {
            '$unwind': {
                'path': '$forecastedBy',
                'preserveNullAndEmptyArrays': True
            }
        }, lookup_reviewed_by, {
            '$unwind': {
                'path': '$reviewedBy',
                'preserveNullAndEmptyArrays': True
            }
        }, project_user_names, {
            '$lookup': {
                'from': 'wells',
                'localField': 'well',
                'foreignField': '_id',
                'as': 'well',
            },
        }, {
            '$unwind': '$well'
        }, lookup_type_curve, {
            '$unwind': {
                'path': '$typeCurve',
                'preserveNullAndEmptyArrays': True
            }
        }] + [project_type_curve_names, project2, group, project3, project_cumulative, sort]

        return data_pipeline

    def _get_production_related_data(self, wells):
        ret = {well: {} for well in wells}
        daily_production = self.context.production_service.get_production(wells, True)
        monthly_production = self.context.production_service.get_production(wells)

        for daily in daily_production:
            well_str = str(daily['_id'])
            ret[well_str]['dailyMinIndex'] = np.nanmin(daily['index'])
            ret[well_str]['dailyMaxIndex'] = np.nanmax(daily['index'])
            ret[well_str]['dailyCum'] = {}
            for phase in FORECAST_BASE_PHASES:
                ret[well_str]['dailyCum'][phase] = np.nansum(np.array(daily[phase], dtype='float'))

        for monthly in monthly_production:
            well_str = str(monthly['_id'])
            ret[well_str]['monthlyMinIndex'] = np.nanmin(monthly['index'])
            ret[well_str]['monthlyMaxIndex'] = np.nanmax(monthly['index'])
            ret[well_str]['monthlyCum'] = {}
            for phase in FORECAST_BASE_PHASES:
                ret[well_str]['monthlyCum'][phase] = np.nansum(np.array(monthly[phase], dtype='float'))

        return ret

    def export_forecast_data_params(self, p_req, single_well=False, default_cum={'oil': 0.0, 'gas': 0.0, 'water': 0.0}):
        forecasts_wells_map = p_req.get('forecasts_wells_map')

        phase = p_req.get('phase')
        series = p_req.get('series')
        adjust = p_req.get('adjust_segment')
        start_date = p_req.get('start_date')

        statuses = status_dt['fields']
        well_headers = self.get_well_headers()

        def get_relevant_units(units):
            ret = []
            for k, v in units.items():
                if k in phase or k.startswith('oil/') or k.startswith('gas/') or k.startswith('water/'):
                    ret.append(v)
            return ret

        def header_with_units(header_name, units, dt=display_units_dt):
            units_set = set()
            for u in units:
                units_set.add(dt['fields'][u])

            units_str = ','.join(units_set)
            return f'{header_name} {units_str}'

        cum_units = {'oil': 'cumsum_oil', 'gas': 'cumsum_gas', 'water': 'cumsum_water'}

        cum_monthly_convert = get_units_convert_funcs(cum_units, monthly_units_dt)
        cum_daily_convert = get_units_convert_funcs(cum_units, daily_units_dt)

        eur_units = {'oil': 'oil_eur', 'gas': 'gas_eur', 'water': 'water_eur'}

        eur_convert = get_units_convert_funcs(eur_units, daily_units_dt)

        eur_per_ft_units = {'oil': 'oil_eur/pll', 'gas': 'gas_eur/pll', 'water': 'water_eur/pll'}

        eur_per_ft_convert = get_units_convert_funcs(eur_per_ft_units, daily_units_dt)

        q_final_units = {'oil': 'oil', 'gas': 'gas', 'water': 'water'}

        q_final_convert = get_units_convert_funcs(q_final_units, daily_units_dt)

        # monthly_cum_header = header_with_units('Monthly Cum', get_relevant_units(cum_units))
        # daily_cum_header = header_with_units('Daily Cum', get_relevant_units(cum_units))
        # eur_header = header_with_units('EUR', get_relevant_units(eur_units))
        # eur_per_ft_header = header_with_units('EUR/FT', get_relevant_units(eur_per_ft_units))
        # q_final_header = header_with_units('q Final', get_relevant_units(q_final_units))

        monthly_cum_header = 'Monthly Cum MBBL,MMCF'
        daily_cum_header = 'Daily Cum MBBL,MMCF'
        eur_header = 'EUR MBBL,MMCF'
        eur_per_ft_header = 'EUR/FT BBL/FT,MCF/FT'
        q_final_header = 'q Final MCF/D,BBL/D'
        series.sort()

        headers = {
            'well_headers': well_headers,
            'q_final_header': q_final_header,
            'monthly_cum_header': monthly_cum_header,
            'daily_cum_header': daily_cum_header,
            'eur_header': eur_header,
            'eur_per_ft_header': eur_per_ft_header
        }
        converters = {
            'q_final_convert': q_final_convert,
            'cum_monthly_convert': cum_monthly_convert,
            'cum_daily_convert': cum_daily_convert,
            'eur_convert': eur_convert,
            'eur_per_ft_convert': eur_per_ft_convert
        }

        sheet = {
            'data': [],
            'header': [
                'Forecast Name',
                'Well Name',
                *[well_headers[h] for h in required_well_headers],
                'Forecasted By',
                'Forecasted On',
                'Reviewed By',
                'Reviewed On',
                'Status',
                'Phase',
                'Well Life (Year)',
                'Remaining Well Life From Today (Years)',
                'Applied Type Curve',
                'Applied Type Curve ID'
                'Applied Normalization',
                'FPD Source',
                'Risk Factor',
                'Forecast Generated',
                monthly_cum_header,
                daily_cum_header,
                eur_header,
                eur_per_ft_header,
                'Type',
                'Base Phase',
                'Series',
                q_final_header,
                'Segment',
                list(forecast_params.values()),
                'Warning',
            ]
        }

        for forecast, wells in forecasts_wells_map.items():
            forecast_collection = self.context.forecasts_collection.find_one({'_id': ObjectId(forecast)})
            type = forecast_collection['type']
            forecast_name = forecast_collection['name']

            is_probabilistic = type == 'probabilistic'

            data_pipeline = self.get_data_pipeline(is_probabilistic, forecast, phase, wells)

            if is_probabilistic:
                data = self.context.forecast_datas_collection.aggregate(data_pipeline, allowDiskUse=True)
            else:
                data = self.context.deterministic_forecast_datas_collection.aggregate(data_pipeline, allowDiskUse=True)

            production_related_data = self._get_production_related_data(wells)
            types = prob_type_dt['fields'] if is_probabilistic else det_type_dt['fields']
            display_templates = {'statuses': statuses, 'types': types}
            this_forecast_data = []
            for well in data:
                well_id = str(well['_id'])
                well.update(production_related_data[well_id])
                monthly_cum = well.get('monthlyCum') or default_cum
                daily_cum = well.get('dailyCum') or default_cum
                well.update({'dailyCum': daily_cum})
                well.update({'monthlyCum': monthly_cum})
                self._adjust_well_data_segments(well, is_probabilistic, series, phase, adjust)
                for p in phase:
                    if is_probabilistic:
                        self.process_probabilistic_segments(this_forecast_data, well, p, series, start_date, headers,
                                                            converters, display_templates, forecast_name)
                    else:
                        self.process_deterministic_segments(this_forecast_data, well, p, start_date, headers,
                                                            converters, display_templates, forecast_name)
            sheet['data'] += this_forecast_data
        if not single_well:
            return self.upload_to_cloud_storage(sheet, forecast_name)
        else:
            return sheet

    def _adjust_well_data_segments(self, well, is_probabilistic, series, phase, adjust):
        if adjust:
            if is_probabilistic:
                for p in phase:
                    for s in series:
                        segments = well['data'].get(p, {}).get(s, {}).get('segments')
                        if segments:
                            well['data'][p][s]['segments'] = adjust_segments(segments)
            else:
                s = 'best'
                for p in phase:
                    ## P_dict
                    rate_segments = well['data'].get(p, {}).get(s, {}).get('segments')
                    if rate_segments:
                        well['data'][p][s]['segments'] = adjust_segments(rate_segments)

                    ## ratio
                    ratio_segments = well['ratio'].get(p, {}).get('segments')
                    if ratio_segments:
                        well['ratio'][p]['segments'] = adjust_segments(ratio_segments)

    def forecast_start_date_adjustment(self, start_date, phase, segments):
        if segments and start_date[phase]:
            segments = multi_seg.apply_forecast_start_date(segments, start_date[phase])
        return segments

    def process_probabilistic_segments(self, this_forecast_data, well, p, series, start_date, headers, converters,
                                       display_templates, forecast_name):
        is_type_curve_applied = well['type'][p] == 'typecurve'
        for s in series:
            if well and well.get('data', {}).get(p, {}).get(s, {}).get('segments'):
                segments = well.get('data', {}).get(p, {}).get(s, {}).get('segments')
            else:
                segments = None

            segments = self.forecast_start_date_adjustment(start_date, p, segments)
            if not segments:
                continue

            additional_fields = {
                headers['q_final_header']: converters['q_final_convert'][p](segments[-1]['q_end']),
            }
            this_forecast_data.append(
                self.get_segments_output(segments, well, p, p, s, True, is_type_curve_applied, headers, converters,
                                         display_templates, forecast_name, additional_fields))

    def process_deterministic_segments(self, this_forecast_data, well, p, start_date, headers, converters,
                                       display_templates, forecast_name):
        forecast_type = well['type'][p]
        segments = []
        if forecast_type == 'ratio':
            if well and well.get('ratio', {}).get(p, {}).get('segments'):
                segments = well.get('ratio', {}).get(p, {}).get('segments')
        elif forecast_type == 'rate':
            if well and well.get('data', {}).get(p, {}).get('best', {}).get('segments'):
                segments = well.get('data', {}).get(p, {}).get('best', {}).get('segments')

        segments = self.forecast_start_date_adjustment(start_date, p, segments)
        if not segments:
            return

        base_phase = None
        x = None
        if well.get('ratio', {}).get(p):
            base_phase = well.get('ratio', {}).get(p).get('basePhase')
            x = well.get('ratio', {}).get(p).get('x')

        if forecast_type == 'ratio':
            base_segments = well.get('data', {}).get(base_phase, {}).get('best', {}).get('segments')
            additional_fields = {
                'Base Phase': base_phase,
                'X-Axis Type': x,
                headers['q_final_header']: converters['q_final_convert'][p](get_ratio_q_final(segments, base_segments))
            }
            phase_key = f"{p}/{base_phase}"

        else:
            if segments:
                additional_fields = {
                    'Base Phase': 'N/A',
                    'X-Axis Type': 'N/A',
                    headers['q_final_header']: converters['q_final_convert'][p](segments[-1].get('q_end'))
                }
            else:
                additional_fields = {'Base Phase': 'N/A', 'X-Axis Type': 'N/A', headers['q_final_header']: None}

            phase_key = p

        is_type_curve_applied = well['forecastSubType'][p] == 'typecurve'

        this_forecast_data.append(
            self.get_segments_output(segments, well, p, phase_key, 'best', False, is_type_curve_applied, headers,
                                     converters, display_templates, forecast_name, additional_fields))

    def get_segments_output(self,
                            segments,
                            well,
                            phase_in,
                            phase_key,
                            series_in,
                            is_probabilistic,
                            is_type_curve_applied,
                            headers,
                            converters,
                            display_templates,
                            forecast_name,
                            additional_fields={}):

        this_well_headers = well.get('wellHeaders')
        monthly_cum = well.get('monthlyCum')
        daily_cum = well.get('dailyCum')

        monthly_end_idx = well.get('monthlyMaxIndex')
        daily_end_idx = well.get('dailyMaxIndex')
        monthly_start_idx = well.get('monthlyMinIndex')
        daily_start_idx = well.get('dailyMinIndex')
        # header_start_idx = convert_utc_date2idx(this_well_headers.get('first_prod_date'))

        status = well.get('status')
        forecasted_by = well.get('forecastedBy')
        forecasted_at = well.get('forecastedAt')
        reviewed_by = well.get('reviewedBy')
        reviewed_at = well.get('reviewedAt')
        forecast_type = well.get('type')
        forecast_sub_type = well.get('forecastSubType')
        warning = well.get('warning')
        data_freq = well.get('data_freq')
        type_curve = well.get('typeCurve')
        type_curve_id = well.get('typeCurveId')
        type_curve_apply_setting = well.get('typeCurveApplySetting')

        phase_data_freq = data_freq[phase_in]
        forecast_fpd_idx = segments[0].get('start_idx')
        forecast_lpd_idx = segments[0].get('end_idx')

        resolved_fpd_idx = resolve_prod_date_idx(phase_data_freq, daily_start_idx, monthly_start_idx, None,
                                                 forecast_fpd_idx)
        resolved_lpd_idx = resolve_prod_date_idx(phase_data_freq, daily_end_idx, monthly_end_idx, None,
                                                 forecast_lpd_idx)

        ret = []

        for idx, segment in enumerate(segments):
            output = {'Well Name': this_well_headers.get('well_name'), 'Forecast Name': forecast_name}

            for header in required_well_headers:
                if header in date_well_headers:
                    header_value = this_well_headers.get(header)
                    output[headers['well_headers'][header]] = make_local(header_value)
                else:
                    output[headers['well_headers'][header]] = this_well_headers.get(header)

            if forecasted_by:
                output['Forecasted By'] = forecasted_by[phase_in]

            if forecasted_at and forecasted_at[phase_in]:
                output['Forecasted On'] = make_local(forecasted_at[phase_in])
                # output['Forecasted On'] = forecasted_at[phase_in].toLocaleString('en-US', {
                #     'timeZone': 'US/Central',
                #     'timeZoneName': 'short',
                # })
            if reviewed_by:
                output['Reviewed By'] = reviewed_by[phase_in]

            if reviewed_at and reviewed_at[phase_in]:
                output['Reviewed On'] = make_local(reviewed_at[phase_in])
                # output['Reviewed On'] = reviewed_at[phase_in].toLocaleString('en-US', {
                #     'timeZone': 'US/Central',
                #     'timeZoneName': 'short',
                # })

            output['Phase'] = phase_in

            if is_type_curve_applied and type_curve:
                phase_type_curve = type_curve[phase_in]
                phase_type_curve_id = str(type_curve_id[phase_in])
            else:
                phase_type_curve = None
                phase_type_curve_id = None
            output['Applied Type Curve'] = phase_type_curve
            output['Applied Type Curve ID'] = phase_type_curve_id

            if phase_type_curve and type_curve_apply_setting and type_curve_apply_setting[phase_in]:
                output['Applied Normalization'] = self.get_boolean_display(
                    type_curve_apply_setting[phase_in]['applyNormalization'])

                output['FPD Source'] = fpd_sources[type_curve_apply_setting[phase_in]['fpdSource']]
                output['Risk Factor'] = type_curve_apply_setting[phase_in].get('riskFactor', 1)

            output['Forecast Generated'] = data_frequencies[data_freq[phase_in]]

            ###
            if well.get('monthlyCum'):
                output[headers['monthly_cum_header']] = converters['cum_monthly_convert'][phase_in](
                    well['monthlyCum'][phase_in])
            if well.get('dailyCum'):
                output[headers['daily_cum_header']] = converters['cum_daily_convert'][phase_in](
                    well['dailyCum'][phase_in])

            output['Well Life (Year)'] = self.get_well_life(resolved_fpd_idx, resolved_lpd_idx, segments)

            output['Remaining Well Life From Today (Years)'] = self.get_remaining_well_life(segments)

            self.get_eur_related_output(output, well, this_well_headers, segments, data_freq, phase_in, forecast_type,
                                        monthly_cum, monthly_end_idx, daily_cum, daily_end_idx, headers, converters)

            output['Segment'] = idx + 1
            output['Series'] = series_in
            output['Status'] = display_templates['statuses'][status[phase_in]]['label']
            output['Type'] = display_templates['types'][forecast_type[phase_in]]['label']

            if is_probabilistic:
                output['Type'] = 'Rate'
                output['Sub Type'] = display_templates['types'][forecast_type[phase_in]]['label']
            else:
                output['Sub Type'] = display_templates['types'].get(forecast_sub_type[phase_in], {}).get('label')
                output['Type'] = display_templates['types'][forecast_type[phase_in]]['label']

            output.update(additional_fields)

            for k, v in forecast_params.items():
                output[v] = self.get_forecast_param_value(segment, k, resolved_fpd_idx)

            if warning and warning.get(phase_in) and warning.get(phase_in, {}).get('status'):
                output['Warning'] = warning.get(phase_in, {}).get('message')

            ret.append(deepcopy(output))

        return ret

    def get_eur_related_output(self, output, well, well_headers, segments, data_freq, phase_in, forecast_type,
                               monthly_cum, monthly_end_idx, daily_cum, daily_end_idx, headers, converters):
        phase_data_freq = data_freq[phase_in]
        if phase_data_freq == 'monthly':
            cum_data = monthly_cum[phase_in]
            end_idx = monthly_end_idx
        else:
            cum_data = daily_cum[phase_in]
            end_idx = daily_end_idx

        left_idx = segments[0]['start_idx']
        right_idx = segments[-1]['end_idx']
        if end_idx:
            end_data_idx = end_idx
        else:
            end_data_idx = left_idx - 100

        if forecast_type[phase_in] == 'ratio':
            base_phase = well.get('ratio', {}).get(phase_in, {}).get('basePhase')
            base_phase_segments = well.get('data', {}).get(base_phase, {}).get('best', {}).get('segments')
            if not base_phase_segments:
                base_phase_segments = []
            eur = multi_seg.ratio_eur_interval(cum_data, end_data_idx, left_idx, right_idx, segments,
                                               base_phase_segments, phase_data_freq)

        else:
            eur = multi_seg.eur(cum_data, end_data_idx, left_idx, right_idx, segments, phase_data_freq)

        pll = well_headers.get('perf_lateral_length')

        output[headers['eur_header']] = converters['eur_convert'][phase_in](eur)
        if pll:
            output[headers['eur_per_ft_header']] = converters['eur_per_ft_convert'][phase_in](eur / pll)
        else:
            output[headers['eur_per_ft_header']] = converters['eur_per_ft_convert'][phase_in]('')

    def upload_to_cloud_storage(self, sheet, name):

        csv_buffer = io.StringIO()
        csv_writer = csv.DictWriter(csv_buffer,
                                    quoting=csv.QUOTE_NONNUMERIC,
                                    fieldnames=forecast_export_header,
                                    extrasaction='ignore')

        writer = csv.writer(csv_buffer)
        writer.writerow(forecast_export_formatted_header)

        for row in sheet['data']:
            for segment in row:
                csv_writer.writerow(segment)

        run_date = datetime.datetime.utcnow()
        name = clean_filename(name)
        gcp_name = f'forecast-export--{str(name)}--{run_date.isoformat()}.csv'
        file_name = f'forecast-export--{str(name)}--{run_date.isoformat()}.csv'
        content_type = 'application/CSV'
        file_object = self.upload_file_buffer(csv_buffer, gcp_name, file_name, content_type)

        return str(file_object.get('_id'))

    def upload_file_buffer(self, buffer, gcp_name, file_name, content_type, user_id=None, project_id=None):
        csv_file_info = {'gcpName': gcp_name, 'type': content_type, 'name': file_name, 'user': user_id}

        return self.context.file_service.upload_file_from_string(
            string_data=buffer.getvalue(),
            file_data=csv_file_info,
            user_id=user_id,
            project_id=project_id,
        )
