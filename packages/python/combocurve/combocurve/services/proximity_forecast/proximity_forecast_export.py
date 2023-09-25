import io
import collections
import pandas as pd
import numpy as np
from typing import TYPE_CHECKING, List
from bson import ObjectId
from pyexcelerate import Workbook
from combocurve.shared.date import get_current_time
from combocurve.shared.constants import DAYS_IN_MONTH, PHASES
from combocurve.services.files.file_helpers import make_file_os_safe
from combocurve.services.forecast.update_eur_service import UpdateEurService
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.services.proximity_forecast.proximity_forecast_service import ProximityForecastService
from combocurve.science.type_curve.TC_helper import (
    DEFAULT_DAILY_RANGE,
    DISPLAYED_PHASES,
    generate_background_average_data,
    generate_well_volumes_table,
)
from combocurve.services.proximity_forecast.proximity_helpers import proximity_normalization_multipliers_converter

if TYPE_CHECKING:
    from apps.flex_cc.api.context import Context

EUR_INFO = {
    'oil': 'Oil EUR (MBBL)',
    'oil/pll': 'Oil EUR/PLL (BBL/FT)',
    'gas': 'Gas EUR (MMCF)',
    'gas/pll': 'Gas EUR/PLL (MCF/FT)',
    'water': 'Water EUR (MBBL)',
    'water/pll': 'Water EUR/PLL (BBL/FT)'
}

multi_seg = MultipleSegments()
EUR_UNIT_DIVIDER = 1000


class ProximityForecastExportService:
    def __init__(self, context: 'Context', well_id: str, forecast_id: str, phases: List[str] = ['oil', 'gas', 'water']):
        self.context = context
        self.well_id = well_id
        self.forecast_id = forecast_id
        self.phases = phases
        self.well_proximity_docuemnts = self.get_proximity_document(ObjectId(self.well_id), ObjectId(self.forecast_id),
                                                                    self.phases)

    def get_proximity_document(self, well: ObjectId, forecast: ObjectId, phases: list):
        match = {'well': well, 'forecast': forecast, 'phase': {'$in': phases}}
        sort = {'_id': 1}
        pipeline = [{'$match': match}, {'$sort': sort}]
        data = list(self.context.proximity_forecast_datas_collection.aggregate(pipeline))

        proximity_data = {}

        for d in data:
            proximity_data[d['phase']] = d

        return proximity_data

    def proximity_wells_info_sheet(self, wb: Workbook):

        well_headers = {
            'county': 'County/Parish',
            'landing_zone': 'Landing Zone',
            'perf_lateral_length': 'Perf Lateral Length (FT)',
            'first_prop_weight': 'Total Prop (1st Job) (LB)',
            'first_fluid_volume': 'Total Fluid (1st Job) (BBL)'
        }
        all_wells = {self.well_id}
        all_forecasts = {self.forecast_id}
        phase_forecast_wells_map = collections.defaultdict(lambda: collections.defaultdict(set))

        for phase in self.well_proximity_docuemnts:
            phase_backgroud_wells_pair = self.well_proximity_docuemnts[phase].get('wells', {})
            for pair in phase_backgroud_wells_pair:
                all_wells.add(str(pair['well']))
                all_forecasts.add(str(pair['forecast']))
                phase_forecast_wells_map[phase][str(pair['forecast'])].add(str(pair['well']))

        wells_document = list(
            self.context.wells_collection.aggregate([{
                '$match': {
                    '_id': {
                        '$in': list(map(ObjectId, list(all_wells)))
                    }
                }
            }, {
                '$project': {
                    '_id': 1,
                    'well_name': 1,
                    'well_number': 1,
                    'county': 1,
                    'landing_zone': 1,
                    'perf_lateral_length': 1,
                    'first_prop_weight': 1,
                    'first_fluid_volume': 1,
                }
            }]))

        wells_header_dict = {}
        for well in wells_document:
            wells_header_dict[str(well['_id'])] = well

        forecasts_document = list(
            self.context.forecasts_collection.aggregate([{
                '$match': {
                    '_id': {
                        '$in': list(map(ObjectId, list(all_forecasts)))
                    }
                }
            }, {
                '$project': {
                    '_id': 1,
                    'name': 1,
                }
            }]))

        forecast_info_dict = {}

        for forecast in forecasts_document:
            forecast_info_dict[str(forecast['_id'])] = forecast['name']

        update_eur = UpdateEurService(self.context)
        forecast_datas, cums_and_last_prods = update_eur.get_forecast_datas(list(all_forecasts), list(all_wells),
                                                                            PHASES, True)

        all_info = []

        for phase, forecast_wells_map in phase_forecast_wells_map.items():
            for forecast_id, wells in forecast_wells_map.items():
                for well_id in wells:
                    this_well = {
                        'Phase':
                        phase.capitalize(),
                        'Forecast Name':
                        forecast_info_dict[forecast_id],
                        'Well Name':
                        wells_header_dict[well_id]['well_name'] + ' '
                        + wells_header_dict[well_id].get('well_number', '')
                    }
                    for header in well_headers:
                        this_well[well_headers[header]] = wells_header_dict[well_id].get(header, '')

                    well_forecasts = forecast_datas.get(forecast_id, {}).get(well_id, {})

                    #forecast info
                    for phase_in_well in PHASES:
                        phase_forecast = well_forecasts.get(phase_in_well)
                        phase_str = phase_in_well.capitalize()
                        if not phase_forecast:
                            this_well[f'{phase_str} Forecast Generated On'] = ''
                            this_well[f'{phase_str} Forecast Type'] = ''
                        else:
                            this_well[f'{phase_str} Forecast Generated On'] = phase_forecast.get('data_freq', '')
                            this_well[f'{phase_str} Forecast Type'] = self._get_forecast_type(phase_forecast)

                    #eur info
                    for phase_in_well in PHASES:
                        phase_str = phase_in_well.capitalize()
                        eur = self._get_eur(well_id, phase_in_well, cums_and_last_prods, well_forecasts)
                        this_well[EUR_INFO[phase_in_well]] = eur / EUR_UNIT_DIVIDER
                        pll = wells_header_dict[well_id].get('perf_lateral_length')
                        if pll and pll != 0:
                            this_well[EUR_INFO[f'{phase_in_well}/pll']] = eur / pll
                        else:
                            this_well[EUR_INFO[f'{phase_in_well}/pll']] = ''

                    all_info.append(this_well)

        df_all_wells = pd.DataFrame(all_info)

        wb.new_sheet('Proximity Wells', [df_all_wells.columns.tolist()] + df_all_wells.values.tolist())

        return wells_header_dict

    def _get_eur(self, well_id, phase, cums_and_last_prods, well_forecasts):
        eur = 0

        phase_forecast = well_forecasts.get(phase)
        data_freq = phase_forecast['data_freq']
        forecast_type = phase_forecast['forecast_type']

        cum = cums_and_last_prods[data_freq][well_id][phase]
        last_prod_idx = cums_and_last_prods[data_freq][well_id]['last_prod']

        if forecast_type == 'rate':
            segments = phase_forecast.get('P_dict', {}).get('best', {}).get('segments', [])
        else:
            segments = phase_forecast.get('ratio_P_dict', {}).get('segments', [])
            base_phase = phase_forecast.get('ratio_P_dict', {}).get('basePhase')

        if len(segments) > 0:
            left_idx = segments[0]['start_idx']
            right_idx = segments[-1]['end_idx']
        else:
            left_idx = right_idx = 0

        if forecast_type == 'rate':
            eur = multi_seg.eur(cum, last_prod_idx, left_idx, right_idx, segments, data_freq)
        elif forecast_type == 'ratio':
            base_phase_forecast = well_forecasts.get(base_phase)
            if base_phase_forecast and base_phase_forecast['forecast_type'] == 'rate':
                base_phase_segments = base_phase_forecast.get('P_dict', {}).get('best', {}).get('segments', [])
                eur = multi_seg.ratio_eur(cum, last_prod_idx, left_idx, right_idx, segments, base_phase_segments,
                                          data_freq)
            else:
                eur = cum

        return eur

    def _get_existing_columns(self, df_fits, columns):
        existing_columns = []
        for column in columns:
            if column in df_fits.columns:
                existing_columns.append(column)

        return existing_columns

    def target_well_fits_sheet(self, wb: Workbook):
        settings = {
            'forecastMonthly': {
                'include': True,
                'mergeWithProduction': False
            },
            'forecastDaily': {
                'include': True,
                'mergeWithProduction': False
            }
        }
        monthly_data, daily_data = self.context.forecast_volumes_export_service.export_volumes_proximity(
            forecast_id=self.forecast_id,
            forecasts_wells_map={self.forecast_id: [self.well_id]},
            forecast_type='deterministic',
            settings=settings,
            volumes_only=True)

        monthly_fit_rows = []
        for _, (_, rows) in monthly_data.items():
            for row in rows:
                monthly_fit_rows.append(row)

        daily_fit_rows = []
        for _, (_, rows) in daily_data.items():
            for row in rows:
                daily_fit_rows.append(row)

        monthly_fits_columns = ['Date', 'Oil (BBL/M)', 'Gas (MCF/M)', 'Water (BBL/M)']
        daily_fits_columns = ['Date', 'Oil (BBL/D)', 'Gas (MCF/D)', 'Water (BBL/D)']

        df_monthly_fits = pd.DataFrame(monthly_fit_rows)
        df_daily_fits = pd.DataFrame(daily_fit_rows)
        df_monthly_fits.Date = pd.to_datetime(df_monthly_fits.Date, errors='coerce').dt.strftime('%m/%d/%Y')
        df_daily_fits.Date = pd.to_datetime(df_daily_fits.Date, errors='coerce').dt.strftime('%m/%d/%Y')

        existing_monthly_columns = self._get_existing_columns(df_monthly_fits, monthly_fits_columns)
        existing_daily_columns = self._get_existing_columns(df_daily_fits, daily_fits_columns)
        df_monthly_fits = df_monthly_fits[existing_monthly_columns]
        df_daily_fits = df_daily_fits[existing_daily_columns]
        wb.new_sheet('Monthly Fits', [existing_monthly_columns] + df_monthly_fits.values.tolist())
        wb.new_sheet('Daily Fits', [existing_daily_columns] + df_daily_fits.values.tolist())

    def all_well_fits_sheet(self, wb, wells_info_dict):
        proximity_forecast_service = ProximityForecastService(self.context)

        for phase in PHASES:
            phase_proximity_document = self.well_proximity_docuemnts.get(phase)
            if not phase_proximity_document:
                continue

            phase_type = phase_proximity_document.get('phase_type', 'rate')
            raw_bg_data, wells = proximity_forecast_service.generate_proximity_bg_data(
                ObjectId(self.forecast_id), ObjectId(self.well_id), phase)
            calculated_bg_data = self.context.type_curve_service.calculate_background_data(
                raw_bg_data,
                DEFAULT_DAILY_RANGE,
                phase_type,
                phase,
                phase_proximity_document.get('resolution', 'monthly'),
                '',
                [],
            )

            well_names = []
            well_numbers = []

            for well in wells:
                well_info = wells_info_dict.get(well, {})
                well_names.append(well_info.get('well_name', ''))
                well_numbers.append(well_info.get('well_number', ''))

            if calculated_bg_data is None:
                return None
            if phase_type == 'rate':
                vol_data = calculated_bg_data['noalign']
            elif phase_type == 'ratio':
                vol_data = calculated_bg_data['target_phase']['noalign']
            else:
                raise ValueError('Phase type must be "rate" or "ratio".')

            index = vol_data['idx']
            prod_indices = vol_data['data_part_idx']
            volumes: np.ndarray = np.array(vol_data['data'], dtype=float) * DAYS_IN_MONTH
            multipliers = proximity_normalization_multipliers_converter(
                phase_proximity_document.get('normalization_multipliers'))

            #TODO need to change this part after proximity forecast supports 2-factor norm
            if len(multipliers) and volumes.size:
                volumes = self.context.tc_normalization_service.apply_normalization_multipliers(volumes, multipliers)

            averages = generate_background_average_data(np.array(volumes, dtype=float), prod_indices)
            df_well_phase_sheet = generate_well_volumes_table(phase, np.arange(1,
                                                                               len(index) + 1), averages, volumes,
                                                              well_names, well_numbers)

            df_well_phase_sheet.drop(columns=['Wells Average No Forecast', 'Wells P50', 'Wells P50 No Forecast'],
                                     inplace=True)

            wb.new_sheet(f'Well Fits ({DISPLAYED_PHASES[phase]})',
                         [df_well_phase_sheet.columns.tolist()] + df_well_phase_sheet.values.tolist())

    def proximity_export_pipeline(self):
        wb = Workbook()
        wells_info_dict = self.proximity_wells_info_sheet(wb)
        self.target_well_fits_sheet(wb)
        self.all_well_fits_sheet(wb, wells_info_dict)

        return self._upload_workbook(wells_info_dict[self.well_id].get('well_name', ''), wb)

    def _upload_workbook(self, well_name: str, wb: Workbook, time_zone: str = None):
        current_time = get_current_time(time_zone) if time_zone else get_current_time()
        file_name = make_file_os_safe(
            f'{well_name}-proximity-download-{current_time.strftime("%Y-%m-%d-%H-%M-%S-%f")}') + '.xlsx'
        file_buffer = io.BytesIO()
        content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        wb.save(file_buffer)
        file_info = {'gcpName': file_name, 'type': content_type, 'name': file_name, 'user': None}

        uploaded_file = self.context.file_service.upload_file_from_string(string_data=file_buffer.getvalue(),
                                                                          file_data=file_info,
                                                                          user_id=None)
        return str(uploaded_file.get('_id'))

    def _get_forecast_type(self, forecast_document):
        if forecast_document is None or forecast_document.get('forecast_type') is None:
            return 'not_forecasted'

        forecastType = str(forecast_document['forecast_type'])
        if forecastType == 'not_forecasted':
            return 'not_forecasted'

        ret = forecastType + ';' + str(forecast_document.get('forecastSubType'))
        if forecastType == 'ratio_P_dict':
            ret += ';' + str(forecast_document.get('ratio', {}).get('basePhase'))

        return ret
