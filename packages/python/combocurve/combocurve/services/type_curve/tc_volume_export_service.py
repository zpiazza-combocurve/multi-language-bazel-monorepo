from collections import defaultdict
import io
import datetime
import logging
from typing import TYPE_CHECKING, Any, Dict, List
from combocurve.services.files.file_helpers import make_file_os_safe
import numpy as np
import pandas as pd
from combocurve.science.segment_models.shared.helper import sum_forecast_by_month
from combocurve.utils.exceptions import get_exception_info
from pyexcelerate import Workbook

from combocurve.science.type_curve.TC_helper import (DISPLAYED_PHASES, generate_background_average_data,
                                                     generate_tc_volumes_table, generate_well_volumes_table,
                                                     get_phase_fits, get_rep_wells_from_rep_init)
from combocurve.shared.constants import PHASES
from combocurve.shared.date import date_from_index

if TYPE_CHECKING:
    from apps.flex_cc.api.context import Context

WELL_SERIES_HEADERS = {
    'average': 'Wells Average',
    'colAverage': 'Wells Average No Forecast',
    'colMedian': 'Wells P50 No Forecast',
    'median': 'Wells P50',
    'wellCount': 'Well Count',
}

CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


class TypeCurveVolumeExportService:
    def __init__(self,
                 context,
                 start_time: int = None,
                 tc_id: str = None,
                 project_id: str = None,
                 phases: List[str] = [],
                 base_phase_series: str = None):

        self.context: Context = context
        self.tc_id = tc_id
        self.project_id = project_id
        self.phases = phases
        self.base_phase_series = base_phase_series

        tc_data: Dict[str, Any] = self.context.production_service.get_tc_fits(self.tc_id)[self.tc_id]
        if tc_data['tc_type'] == 'ratio':
            self.base_phase: str = tc_data['base_phase']
        else:
            self.base_phase = None
        self.fits: Dict[str, Dict[str, Any]] = tc_data.get('fits', {})
        self.tc_name: str = tc_data['tc_name']
        self.phase_types: Dict[str, str] = tc_data['phase_type']

        self.normalize = {'oil': False, 'gas': False, 'water': False}
        if self.fits:
            end_time = start_time
            for phase, fit in self.fits.items():
                self.normalize[phase] = fit.get('normalize', False)
                P_dict = fit['P_dict'] if fit['fitType'] == 'rate' else fit['ratio_P_dict']

                for series in P_dict.values():
                    segments = series['segments']
                    if len(segments) > 0:
                        segment_delta = segments[-1]['end_idx'] - segments[0]['start_idx']
                        end_time = max(end_time, start_time + segment_delta)
            # end_time is the index of the last day of production, so we need to include it in the range.
            self.time = np.arange(start_time, end_time + 1)

            self.phase_fits = get_phase_fits(self.fits, self.time, self.base_phase, self.base_phase_series)
        else:
            self.time = np.array([])
            self.phase_fits = {}

        rep_items = ['header', 'forecast_info', 'data_info', 'eur']
        header_items = ['well_name', 'well_number']
        self.rep_data: List[Dict[str, Any]] = self.context.type_curve_service.tc_rep_init({
            'tc_id': tc_id,
            'items': rep_items,
            'header_items': header_items
        })

        get_rep_wells_from_rep_init(self.context, self.tc_id, self.rep_data)

    def export_data(self):
        daily_data_sheet, monthly_data_sheet, well_data_sheets = self.generate_dataframes()
        wb = Workbook()
        wb.new_sheet('Daily Fits', [daily_data_sheet.columns.tolist()] + daily_data_sheet.values.tolist())
        wb.new_sheet('Monthly Fits', [monthly_data_sheet.columns.tolist()] + monthly_data_sheet.values.tolist())
        for phase in self.phases:
            well_data_sheet = well_data_sheets[phase]
            if well_data_sheet is not None:
                wb.new_sheet(f'Well Fits ({DISPLAYED_PHASES[phase]})',
                             [well_data_sheet.columns.tolist()] + well_data_sheet.values.tolist())
        return self._upload_workbook(wb)

    def generate_dataframes(self, wells_data=True):
        try:
            daily_dates = [date_from_index(int(x)).strftime('%m/%d/%Y') for x in self.time]
            daily_data_sheet: pd.DataFrame = generate_tc_volumes_table(daily_dates, self.phase_fits, 'daily')
        except Exception as e:
            daily_data_sheet = self._generate_failure_log('Daily Fits', e)
        try:
            monthly_data_sheet: pd.DataFrame = self._generate_monthly_data()
        except Exception as e:
            monthly_data_sheet = self._generate_failure_log('Monthly Fits', e)
        well_data_sheets = {}
        if wells_data:
            for phase in self.phases:
                try:
                    data_sheet = self._generate_wells_data(phase)
                except Exception as e:
                    data_sheet = self._generate_failure_log(f'Well Fits ({DISPLAYED_PHASES[phase]})', e)
                well_data_sheets[phase] = data_sheet
        else:
            well_data_sheets = None
        return daily_data_sheet, monthly_data_sheet, well_data_sheets

    def _generate_monthly_data(self):
        monthly_phase_vols = dict.fromkeys(self.phase_fits.keys())
        months = None
        for key, daily_vols in self.phase_fits.items():
            monthly_vol, months = sum_forecast_by_month(daily_vols, np.array(self.time, dtype=int))
            monthly_phase_vols[key] = monthly_vol
        # Just need to convert date idx to dates, so save time by doing it outside loop.
        if months is not None:
            month_end = ((months + np.timedelta64(1, 'M')).astype('datetime64[D]') + np.timedelta64(-1, 'D')).astype(
                datetime.date)
            month_end = [x.strftime('%m/%d/%Y') for x in month_end]
        else:
            month_end = []

        return generate_tc_volumes_table(month_end, monthly_phase_vols, 'monthly')

    def _generate_wells_data(self, phase: str):
        phase_wells = []
        well_names = []
        well_numbers = []
        wells_info_for_background_data = {
            'wellsResolvedResolution': {},
            'wellsDataInfo': {},
            'wellsForecastInfo': {},
            'wellsEurInfo': {},
            'wellsValidInfo': defaultdict(lambda: {p: False
                                                   for p in PHASES})
        }
        for well in self.rep_data:
            if well['rep'][phase]:
                well_id = well['well_id']
                well_names.append(well['header']['well_name'])
                well_numbers.append(well['header']['well_number'])
                phase_wells.append(well_id)
                wells_info_for_background_data['wellsResolvedResolution'][well_id] = well['resolved_resolution']
                wells_info_for_background_data['wellsDataInfo'][well_id] = well['data_info']
                wells_info_for_background_data['wellsForecastInfo'][well_id] = well['forecast_info']
                wells_info_for_background_data['wellsEurInfo'][well_id] = well['eur']
                wells_info_for_background_data['wellsValidInfo'][well_id][phase] = well['rep'][phase]
        init_para_dict = {
            'TC_life': 60,
            'forecast_series': self.base_phase_series,
            'TC_target_data_freq': self.fits.get(phase, {}).get('resolution', 'monthly')
        }
        # Following code in TypeCurveFitDownloadDialog, we'll only use the noalignmonthly data.
        calculated_background_data = self.context.type_curve_service.tc_fit_init({
            'tc_id': self.tc_id,
            'wells': phase_wells,
            'wells_valid_info': wells_info_for_background_data,
            'init_para_dict': init_para_dict,
            'phase': phase
        })
        if calculated_background_data is None:
            return None
        if self.phase_types[phase] == 'rate':
            vol_data = calculated_background_data['noalign']
        elif self.phase_types[phase] == 'ratio':
            vol_data = calculated_background_data['target_phase']['noalign']
        else:
            raise ValueError('Phase type must be "rate" or "ratio".')
        index = vol_data['idx']
        prod_indices = vol_data['data_part_idx']
        volumes: np.ndarray = np.array(vol_data['data'], dtype=float)
        days_in_month_arr = vol_data.get('days_in_month_arr')
        resolution = calculated_background_data.get('resolution', 'daily')
        if self.normalize[phase] and volumes.size:
            if self.phase_types[phase] == 'ratio':
                normal_phase = self.base_phase
            else:
                normal_phase = phase
            multipliers: np.ndarray = self.context.tc_normalization_service.get_norm_multipliers(self.tc_id,
                                                                                                 phase_wells,
                                                                                                 normal_phase,
                                                                                                 is_nominal=True)
            volumes = self.context.tc_normalization_service.apply_normalization_multipliers(
                volumes, multipliers[normal_phase])
        if resolution == 'monthly':
            volumes = volumes * days_in_month_arr
            indexes = np.arange(1, len(index) + 1)
        else:
            indexes = np.array(index) + 1
        averages = generate_background_average_data(np.array(volumes, dtype=float), prod_indices, False)

        return generate_well_volumes_table(phase,
                                           indexes,
                                           averages,
                                           volumes,
                                           well_names,
                                           well_numbers,
                                           resolution=resolution)

    def _upload_workbook(self, wb: Workbook):
        run_date = datetime.datetime.utcnow()
        file_name = make_file_os_safe(
            f'{self.tc_name}-type-curve-volumes-{run_date.strftime("%Y-%m-%d-%H-%M-%S-%f")}') + '.xlsx'
        file_buffer = io.BytesIO()
        wb.save(file_buffer)
        project_id = self.project_id
        file_info = {'gcpName': file_name, 'type': CONTENT_TYPE, 'name': file_name, 'user': None}

        uploaded_file = self.context.file_service.upload_file_from_string(string_data=file_buffer.getvalue(),
                                                                          file_data=file_info,
                                                                          user_id=None,
                                                                          project_id=project_id)
        return str(uploaded_file.get('_id'))

    def _generate_failure_log(self, sheet_title: str, error: Exception) -> pd.DataFrame:

        # Log error
        error_info = get_exception_info(error)
        extra = {'metadata': {'error': error_info, 'data_sheet': sheet_title, 'tc_id': self.tc_id}}
        logging.error(error_info['message'], extra=extra)

        # Generate user-facing warning.
        text = f"Failed to generate {sheet_title} data sheet. "
        text += "We've received a log of this error, and we'll work on it soon."
        return pd.DataFrame({text: []})
