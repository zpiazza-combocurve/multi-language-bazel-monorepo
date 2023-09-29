import pandas as pd
import datetime
import io
from bson import ObjectId
from pyexcelerate import Workbook
from api.forecast_mass_edit.display_templates import well_headers_json
from api.forecast_mass_edit.forecast_export import ForecastExport, make_local
from api.forecast_mass_edit.shared import clean_filename

WELL_HEADER_DATES = {
    'mostRecentImportDate', 'refrac_date', 'completion_end_date', 'completion_start_date', 'date_rig_release',
    'drill_end_date', 'drill_start_date', 'first_prod_date', 'gas_analysis_date', 'permit_date', 'spud_date', 'til',
    'custom_date_0', 'custom_date_1', 'custom_date_2', 'custom_date_3', 'custom_date_4', 'custom_date_5',
    'custom_date_6', 'custom_date_7', 'custom_date_8', 'custom_date_9', 'first_prod_date_daily_calc',
    'first_prod_date_monthly_calc', 'last_prod_date_monthly', 'last_prod_date_daily', 'econ_run_date',
    'econ_first_production_date', 'createdAt', 'updatedAt'
}


class ForecastSingleWellExport:
    def __init__(self, context):
        self.context = context

    def format_none(self, value):
        if value is None:
            return ''
        return value

    def well_headers_sheet(self, well_id):
        well_headers_fields = well_headers_json['fields']
        wells_collection = self.context.wells_collection.find_one({'_id': ObjectId(well_id)})

        well_dict = {'Well Header': [], 'Header Value': []}

        for key, value in wells_collection.items():
            if key in well_headers_fields:
                well_dict['Well Header'].append(self.format_none(well_headers_fields[key]))
                if key in WELL_HEADER_DATES:
                    well_dict['Header Value'].append(self.format_datetime(self.format_none(make_local(value))))
                else:
                    well_dict['Header Value'].append(self.format_none(value))

        well_name = wells_collection.get('well_name')
        return well_dict, well_name

    def volumes_sheets(self, volumes_data):
        production_daily = volumes_data['daily'].get('production')
        production_monthly = volumes_data['monthly'].get('production')
        forecast_daily = volumes_data['daily'].get('forecast')
        forecast_monthly = volumes_data['monthly'].get('forecast')

        daily_dict = {
            'Well Name': [],
            'INPT ID': [],
            'API 14': [],
            'Date': [],
            'Oil (BBL/D)': [],
            'Gas (MCF/D)': [],
            'Water (BBL/D)': []
        }
        monthly_dict = {
            'Well Name': [],
            'INPT ID': [],
            'API 14': [],
            'Date': [],
            'Oil (BBL/M)': [],
            'Gas (MCF/M)': [],
            'Water (BBL/M)': []
        }
        forecast_monthly_dict = {
            'Well Name': [],
            'INPT ID': [],
            'API 14': [],
            'Date': [],
            'Oil (BBL/M)': [],
            'Gas (MCF/M)': [],
            'Water (BBL/M)': []
        }

        forecast_daily_dict = {
            'Well Name': [],
            'INPT ID': [],
            'API 14': [],
            'Date': [],
            'Oil (BBL/D)': [],
            'Gas (MCF/D)': [],
            'Water (BBL/D)': []
        }
        self.get_volumes_data(production_daily, daily_dict)
        self.get_volumes_data(production_monthly, monthly_dict)
        self.get_volumes_data(forecast_monthly, forecast_monthly_dict)
        self.get_volumes_data(forecast_daily, forecast_daily_dict)

        return monthly_dict, daily_dict, forecast_monthly_dict, forecast_daily_dict

    def get_volumes_data(self, volumes, ret_dict):

        for volume in volumes:
            for key in ret_dict:
                ret_dict[key].append(self.format_none(volume.get(key)))

    def forecast_parameters_sheet(self, forecast_id, well_id):
        forecast_export = ForecastExport(self.context)
        p_req = {
            'forecasts_wells_map': {
                forecast_id: [well_id]
            },
            'phase': ['oil', 'gas', 'water'],
            'series': ['best'],
            'adjust_segment': False,
            'start_date': {
                'oil': None,
                'gas': None,
                'water': None
            }
        }

        parameters_dict = {
            'Phase': [],
            'Applied Type Curve': [],
            'Segment': [],
            'Type': [],
            'Base Phase': [],
            'q Final MCF/D,BBL/D': [],
            'Segment Type': [],
            'Start Date': [],
            'End Date': [],
            'Start Day': [],
            'End Day': [],
            'q Start (BBL/D, MCF/D, BBL/MCF, BBL/BBL, MCF/BBL)': [],
            'q End (BBL/D, MCF/D, BBL/MCF, BBL/BBL, MCF/BBL)': [],
            'Di Eff-Sec (%)': [],
            'Di Nominal': [],
            'b': [],
            'Realized D Sw-Eff-Sec (%)': [],
            'Sw-Date': [],
            'Warning': []
        }

        forecast_parameters = forecast_export.export_forecast_data_params(p_req, single_well=True)

        for segments in forecast_parameters['data']:
            for segment in segments:
                for key in parameters_dict:
                    if key in ['Start Date', 'End Date', 'Sw-Date']:
                        parameters_dict[key].append(self.format_datetime(segment.get(key)))
                    else:
                        parameters_dict[key].append(self.format_none(segment.get(key)))

        return parameters_dict

    def format_datetime(self, datetime):
        if not datetime:
            return ''

        year, month, day = str(datetime).split('-')
        return month + '/' + day + '/' + year

    def single_well_export(self, p_req):
        well_id = p_req['wells']
        forecast_id = p_req['forecast_id']
        volumes_data = p_req['volumes_data']

        well_headers, well_name = self.well_headers_sheet(well_id)
        monthly_volume, daily_volume, forecast_volume_monthly, forecast_volume_daily = self.volumes_sheets(volumes_data)
        forecast_parameters = self.forecast_parameters_sheet(forecast_id, well_id)

        df_well_headers = pd.DataFrame(well_headers)
        df_monthly_volume = pd.DataFrame(monthly_volume)
        df_daily_volume = pd.DataFrame(daily_volume)
        df_forecast_volume_monthly = pd.DataFrame(forecast_volume_monthly)
        df_forecast_volume_daily = pd.DataFrame(forecast_volume_daily)
        df_forecast_parameters = pd.DataFrame(forecast_parameters)

        file_buffer = io.BytesIO()

        run_date = datetime.datetime.utcnow()
        file_name = clean_filename(f'{str(well_name)}--forecast--data--{run_date.isoformat()}')
        file_name = file_name + '.xlsx'

        content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        wb = Workbook()

        wb.new_sheet('Well Headers', data=[['Well Header', 'Header Value']] + df_well_headers.values.tolist())
        wb.new_sheet('Monthly Production',
                     data=[['Well Name', 'INPT ID', 'API 14', 'Date', 'Oil (BBL/M)', 'Gas (MCF/M)', 'Water (BBL/M)']]
                     + df_monthly_volume.values.tolist())
        wb.new_sheet('Daily Production',
                     data=[['Well Name', 'INPT ID', 'API 14', 'Date', 'Oil (BBL/D)', 'Gas (MCF/D)', 'Water (BBL/D)']]
                     + df_daily_volume.values.tolist())
        wb.new_sheet('Monthly Forecast',
                     data=[['Well Name', 'INPT ID', 'API 14', 'Date', 'Oil (BBL/M)', 'Gas (MCF/M)', 'Water (BBL/M)']]
                     + df_forecast_volume_monthly.values.tolist())
        wb.new_sheet('Daily Forecast',
                     data=[['Well Name', 'INPT ID', 'API 14', 'Date', 'Oil (BBL/D)', 'Gas (MCF/D)', 'Water (BBL/D)']]
                     + df_forecast_volume_daily.values.tolist())
        wb.new_sheet(
            'Parameters',
            data=[[
                'Phase', 'Applied Type Curve', 'Segment', 'Type', 'Base Phase', 'q Final (BBL/D, MCF/D)',
                'Segment Type', 'Start Date', 'End Date', 'Start Day', 'End Day',
                'q Start (BBL/D, MCF/D, BBL/MCF, BBL/BBL, MCF/BBL)', 'q End (BBL/D, MCF/D, BBL/MCF, BBL/BBL, MCF/BBL)',
                'Di Eff-Sec (%)', 'Di Nominal', 'b', 'Realized D Sw-Eff-Sec (%)', 'Sw-Date', 'Warning'
            ]] + df_forecast_parameters.values.tolist())

        wb.save(file_buffer)
        file_object = self.upload_file_buffer(file_buffer, file_name, file_name, content_type)

        return str(file_object.get('_id'))

    def upload_file_buffer(self, buffer, gcp_name, file_name, content_type, user_id=None, project_id=None):
        file_info = {'gcpName': gcp_name, 'type': content_type, 'name': file_name, 'user': user_id}

        return self.context.file_service.upload_file_from_string(
            string_data=buffer.getvalue(),
            file_data=file_info,
            user_id=user_id,
            project_id=project_id,
        )
