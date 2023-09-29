import csv
import datetime
import io
import openpyxl
import numpy as np

from api.forecast_mass_edit.forecast_export import ForecastExport
from bson import ObjectId
from zipfile import ZipFile, ZIP_DEFLATED
from combocurve.science.segment_models.shared.helper import exp_D_2_D_eff
from combocurve.shared.import_helpers import check_near_equality
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.segment_models.shared.helper import arps_D_eff_2_D, exp_D_eff_2_D

MOSAIC_DIGIT_FORMAT = 7
MOSAIC_FOUR_DIGIT_FORMAT = 4
MAX_MOSAIC_SEC_DEFF = -1e15
MAX_MOSAIC_SEC_DEFF_EXCEEDED = 'Maximum acceptableable value for Secant Deff exceeded. Set to +/-(1e15)'


class MosaicForecastExport(ForecastExport):
    def __init__(self, context):
        super(MosaicForecastExport, self).__init__(context)
        self.error_message_list = io.StringIO()
        self.csv_writer = csv.writer(self.error_message_list, quoting=csv.QUOTE_NONNUMERIC)
        self.csv_writer.writerow(['Entity Name', 'UUID', 'Phase', 'Message', 'Severity'])
        self.has_error = False

    def mosaic_forecast_data_params(self, p_req):
        phase = p_req.get('phase')
        series = p_req.get('series')
        forecasts_wells_map = p_req.get('forecasts_wells_map')
        user_id = p_req.get('user_id')
        self.entity_key = p_req.get('entity_name')
        for forecast, wells in forecasts_wells_map.items():
            forecast_collection = self.context.forecasts_collection.find_one({'_id': ObjectId(forecast)})
            type_ = forecast_collection['type']
            forecast_name = forecast_collection['name']
            project_id = forecast_collection['project']

            is_probabilistic = type_ == 'probabilistic'

            data_pipeline = self.get_data_pipeline(is_probabilistic, forecast, phase, wells)

            if is_probabilistic:
                data = self.context.forecast_datas_collection.aggregate(data_pipeline, allowDiskUse=True)
            else:
                data = self.context.deterministic_forecast_datas_collection.aggregate(data_pipeline, allowDiskUse=True)

            rate_forecast_data = []
            ratio_forecast_data = []
            for well in data:
                for p in phase:
                    if is_probabilistic:
                        self.process_probabilistic_mosaic_segments(rate_forecast_data, well, p, series)
                    else:
                        self.process_deterministic_mosaic_segments(rate_forecast_data, ratio_forecast_data, well, p)
        gcp_name, file_id = self.write_mosaic_to_zip_file_and_upload(rate_forecast_data, ratio_forecast_data,
                                                                     forecast_collection['_id'], project_id, user_id,
                                                                     forecast_name)

        return str(file_id)

    def process_probabilistic_mosaic_segments(self, this_forecast_data, well, p, series):
        for s in series:
            segments = None
            if well and well.get('data', {}).get(p, {}).get(s, {}).get('segments'):
                segments = well.get('data', {}).get(p, {}).get(s, {}).get('segments')

            if not segments:
                continue
            base_phase = None
            this_forecast_data += self.get_mosaic_segments_output(segments, well, p, 'rate', s, base_phase)

    def process_deterministic_mosaic_segments(self, rate_forecast_data, ratio_forecast_data, well, p):
        def process_ratio_segment_dates(ratio_segments, rate_segments):
            multi_seg = MultipleSegments()
            if len(rate_segments) == 0:
                return
            rate_start_idx = float(rate_segments[0]['start_idx'])
            try:
                rate_end_idx = int(float(rate_segments[-1]['end_idx']))
            except (ValueError, TypeError):
                rate_end_idx = None

            rate_start_date = datetime.date(1900, 1, 1) + datetime.timedelta(days=int(float(rate_start_idx)))
            rate_end_date = datetime.date(1900, 1, 1) + datetime.timedelta(days=int(float(rate_end_idx))) if (
                rate_end_idx is not None) else None
            ratio_segments = multi_seg.apply_forecast_start_date(ratio_segments, rate_start_date)

            if rate_end_date is not None:
                ratio_segments = multi_seg.apply_forecast_end_date(ratio_segments, rate_end_date)

            return ratio_segments

        def get_base_phase(well, forecast_type):
            base_phase = None
            if well.get('ratio', {}).get(p) and forecast_type == 'ratio':
                base_phase = well.get('ratio', {}).get(p).get('basePhase')

            return base_phase

        forecast_type = well['type'][p]
        segments = []
        base_phase = get_base_phase(well, forecast_type)
        if forecast_type == 'ratio':
            if well and well.get('ratio', {}).get(p, {}).get('segments'):
                segments = well.get('ratio', {}).get(p, {}).get('segments')
                rate_segments = well.get('data', {}).get(base_phase, {}).get('best', {}).get('segments')
                segments = process_ratio_segment_dates(segments, rate_segments)
        elif forecast_type == 'rate':
            if well and well.get('data', {}).get(p, {}).get('best', {}).get('segments'):
                segments = well.get('data', {}).get(p, {}).get('best', {}).get('segments')

        if not segments:
            return

        if forecast_type == 'rate':
            rate_forecast_data += self.get_mosaic_segments_output(segments, well, p, forecast_type, 'best')
        elif forecast_type == 'ratio':
            ratio_forecast_data += self.get_mosaic_segments_output(segments,
                                                                   well,
                                                                   p,
                                                                   forecast_type,
                                                                   'best',
                                                                   base_phase=base_phase)

    def log_error_message(self, well, message, phase=None, severity=None):
        self.has_error = True
        entity_name = well.get('wellHeaders', {}).get(self.entity_key)
        uuid = well.get('wellHeaders', {}).get('chosenID')
        self.csv_writer.writerow([entity_name, uuid, phase, message, severity])

    def get_mosaic_segments_output(  # noqa(C901)
            self, segments, well, phase_in, forecast_type, series_in, base_phase=None):
        def get_q_start(q_end, di, delta_t, b=None):
            if b:
                return np.power(((di * b) / delta_t) + 1, 1 / b) * q_end
            else:
                return q_end * np.exp(di * delta_t)

        def process_date(idx):
            if idx is None:
                return idx
            return datetime.date(1900, 1, 1) + datetime.timedelta(days=int(float(idx)))

        def validate_sec_deff(segment, sec_deff):
            new_q = None
            if sec_deff is not None:
                if to_scientific_notation(sec_deff) > 15 and get_sign(sec_deff) != 1:
                    sec_deff = MAX_MOSAIC_SEC_DEFF
                    q_end = segment.get('q_end')
                    try:
                        delta_t = segment.get('end_idx') - segment.get('start_idx')
                    except (ValueError, TypeError):
                        delta_t = None
                    b = segment.get('b')

                    if delta_t is not None:
                        di = arps_D_eff_2_D(MAX_MOSAIC_SEC_DEFF / 100, b) if b else exp_D_eff_2_D(MAX_MOSAIC_SEC_DEFF
                                                                                                  / 100)
                        new_q = get_q_start(q_end, di, delta_t, b=b)
                    self.log_error_message(well,
                                           MAX_MOSAIC_SEC_DEFF_EXCEEDED,
                                           phase=str(phase_in).upper(),
                                           severity='warning')
            return sec_deff, new_q

        def get_valid_sec_and_min_deff(segment):
            """
                Returns the values of 'sec_deff' and 'min_deff' after applying certain calculations and checks.

                Args:
                    segment (dict): A dictionary containing various keys and their corresponding values.

                Returns:
                    tuple: A tuple containing the values of 'sec_deff' and 'min_deff'.

            """
            new_q = None
            min_deff = None if segment.get('realized_D_eff_sw') is None else round(
                float(segment.get('realized_D_eff_sw')) * 100, MOSAIC_DIGIT_FORMAT)
            sec_deff = None if segment.get('D_eff') is None else round(
                float(segment.get('D_eff')) * 100, MOSAIC_DIGIT_FORMAT)
            sec_deff, new_q = validate_sec_deff(segment, sec_deff)

            # check that min_deff and sec_deff is a value and not None
            if not (min_deff is None or sec_deff is None):
                # if the secant deff is lower than the minimum deff
                # check the start idx and switch idx to see if they are very close (withing 0.01% of each other)
                # if they are not close, then the minimum deff is the secant deff
                # if so calculate the declines from the nominal values
                # if the secant deff is still lower, then set the minumum to the secant
                if sec_deff < min_deff:
                    try:
                        sw_idx = float(segment.get('sw_idx'))
                        start_idx = float(segment.get('start_idx'))
                    except (ValueError, TypeError):
                        sw_idx = None
                        start_idx = None
                    indices_valid = sw_idx is not None and start_idx is not None

                    if indices_valid and check_near_equality(sw_idx, start_idx, tolerance=0.01):
                        min_deff_nominal = None if segment.get('D_exp') is None else round(
                            exp_D_2_D_eff(float(segment.get('D_exp'))) * 100, MOSAIC_FOUR_DIGIT_FORMAT)
                        sec_deff_nominal = None if segment.get('D') is None else round(
                            exp_D_2_D_eff(float(segment.get('D'))) * 100, MOSAIC_FOUR_DIGIT_FORMAT)

                        if not (min_deff_nominal is None or sec_deff_nominal is None):
                            min_deff = min_deff_nominal
                            sec_deff = sec_deff_nominal
                            if sec_deff < min_deff:
                                min_deff = sec_deff
                        else:
                            min_deff = sec_deff
                    else:
                        min_deff = sec_deff

            return sec_deff, min_deff, new_q

        def to_scientific_notation(num):
            # Convert the number to a string in scientific notation
            value = format(num, 'e').split('e')[-1]
            return float(str(value))

        def get_sign(value):
            return -1 if value < 0 else 1

        def get_mosaic_row(idx, well_name, chosen_id, reserves_category, product_type, ratio=False):
            if ratio:
                return {
                    'Well Name': well_name,
                    'UUID': chosen_id,
                    'Reserves Category': reserves_category,
                    'Ratio Type': product_type,
                    'Use Type': 'Produced',
                    'segment #': idx + 1,
                    'Transition Type': 'Time Fixed',
                    'Initial Rate ri (rate/d)': None,
                    'Final Rate rf (rate/d)': None,
                    'Final Date Tf (y-m-d)': None,
                    'Exponent N, b': None,
                    'Nominal Decline Di (%)': None,
                    'Start Date T0 (y-m-d)': None,
                }
            else:
                return {
                    'Well Name': well_name,
                    'UUID': chosen_id,
                    'Reserves Category': reserves_category,
                    'Product Type': product_type,
                    'Use Type': 'Produced',
                    'segment #': idx + 1,
                    'Start Date T0 (y-m-d)': None,
                    'Initial Rate qi(rate/d)': None,
                    'Final Rate qf(rate/d)': None,
                    'Cum': None,
                    'Final Cum': None,
                    'Length T (years)': None,
                    'Final Date Tf (y-m-d)': None,
                    'Exponent N, b': None,
                    'Nominal Decline Di (%)': None,
                    'Tangential Effective Decline Dei(%)': None,
                    'Secant Effective Decline Desi (%)': None,
                    'Service Factor (fraction)': None,
                    'Minimum Effective Decline Dmin (%)': None,
                }

        this_well_headers = well.get('wellHeaders')
        chosen_id = this_well_headers.get('chosenID')
        well_name = this_well_headers.get(self.entity_key, chosen_id)
        reserves_category = 'PDP' if series_in == 'best' else str(series_in).upper()
        product_type = str(phase_in)[0].upper() + str(base_phase)[0].upper() + 'R' if base_phase else str(
            phase_in).capitalize()

        ret = []
        if forecast_type == 'ratio':
            for idx, segment in enumerate(segments):
                output = get_mosaic_row(idx, well_name, chosen_id, reserves_category, product_type, ratio=True)
                ratio_multiplier = 1 if product_type == 'WOR' else 1000
                qi = None if segment.get('q_start') is None else segment.get('q_start') * ratio_multiplier
                qf = None if segment.get('q_end') is None else segment.get('q_end') * ratio_multiplier
                d = None if segment.get('D') is None else segment.get('D') * 100
                output['Initial Rate ri (rate/d)'] = qi
                output['Final Rate rf (rate/d)'] = qf
                output['Start Date T0 (y-m-d)'] = process_date(segment.get('start_idx'))
                output['Final Date Tf (y-m-d)'] = process_date(segment.get('end_idx'))
                output['Exponent N, b'] = segment.get('b') if segment.get('name') != 'linear' else -1
                output['Nominal Decline Di (%)'] = d
                ret.append(output)
            return ret
        else:
            for idx, segment in enumerate(segments):
                sec_deff, min_deff, new_q = get_valid_sec_and_min_deff(segment)
                output = get_mosaic_row(idx, well_name, chosen_id, reserves_category, product_type)
                output['Initial Rate qi(rate/d)'] = new_q if new_q is not None else segment.get('q_start')
                output['Final Rate qf(rate/d)'] = segment.get('q_end')
                output['Start Date T0 (y-m-d)'] = process_date(segment.get('start_idx'))
                output['Final Date Tf (y-m-d)'] = process_date(segment.get('end_idx'))
                output['Exponent N, b'] = segment.get('b')
                output['Minimum Effective Decline Dmin (%)'] = min_deff
                output['Secant Effective Decline Desi (%)'] = sec_deff
                ret.append(output)
            return ret

    def write_mosaic_to_zip_file_and_upload(self, rate_data, ratio_data, forecast_id, project_id, user_id,
                                            forecast_name):
        zip_buffer = io.BytesIO()
        with ZipFile(zip_buffer, mode="w", compression=ZIP_DEFLATED) as zf:
            for idx, data in enumerate([rate_data, ratio_data]):
                forecast_type = 'rate' if idx == 0 else 'ratio'
                if len(data) != 0:
                    file_buffer = io.BytesIO()
                    file_name = f'{forecast_name}-{forecast_type}-parameters.xlsx'
                    wb = openpyxl.load_workbook(
                        f'./api/forecast_mass_edit/file_templates/mosaic/{forecast_type}_template.xlsx')
                    sheet = wb.active
                    rows = [list(row.values()) for row in data]
                    for i in range(len(rows)):
                        for j in range(len(rows[i])):
                            sheet.cell(row=i + 2, column=j + 1, value=rows[i][j])
                    wb.save(file_buffer)
                    zf.writestr(file_name, file_buffer.getvalue())
            if self.has_error:
                zf.writestr('error.csv', self.error_message_list.getvalue())

        run_date = datetime.datetime.utcnow()
        gcp_name = f'{str(forecast_name)}_Mosaic_Export--{run_date.isoformat()}.zip'
        file_name = f'{str(forecast_name)} Mosaic Export.zip'
        content_type = 'application/zip'

        file_info = {'gcpName': gcp_name, 'type': content_type, 'name': file_name, 'user': user_id}
        file_doc = self.context.file_service.upload_file_from_string(
            string_data=zip_buffer.getvalue(),
            file_data=file_info,
            project_id=project_id,
        )
        return gcp_name, file_doc['_id']
