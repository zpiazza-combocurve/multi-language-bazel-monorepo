from typing import Iterable
from io import StringIO

import csv
import datetime
from bson import ObjectId

from combocurve.shared.csv_export import export_headers, export_rows
from combocurve.shared.batch_file_name_generator import BatchFileNameGenerator
from .export_helpers import (WELL_HEADERS, PHASES, PRESSURE_PHASES, RESOLUTION_MAP, get_forecast_file_headers,
                             get_export_settings, get_header_display, get_prod_dicts, get_forecast_dicts,
                             get_production_data_filter, forecast_export_includes, get_rows_json_data,
                             merge_production_and_forecast, clean_filename)
from .export_settings import ProductionExportSettings, ForecastExportSettings


class ForecastExportService:
    def __init__(self, context):
        self.context = context

    def export_forecast_to_json(self, forecast_id: str, forecast_type: str, wells: Iterable[str], settings: dict):
        monthly_res = {'resolution': 'monthly'}
        daily_res = {'resolution': 'daily'}
        prod_monthly_stgs = get_export_settings(settings, 'productionMonthly', ProductionExportSettings, monthly_res)
        prod_daily_stgs = get_export_settings(settings, 'productionDaily', ProductionExportSettings, daily_res)
        forecast_monthly_stgs = get_export_settings(settings, 'forecastMonthly', ForecastExportSettings, monthly_res)
        forecast_daily_stgs = get_export_settings(settings, 'forecastDaily', ForecastExportSettings, daily_res)

        monthly_data = self._get_data(forecast_id, forecast_type, wells, prod_monthly_stgs, forecast_monthly_stgs)
        daily_data = self._get_data(forecast_id, forecast_type, wells, prod_daily_stgs, forecast_daily_stgs)

        res = {
            'monthly': self._get_json_data(monthly_data),
            'daily': self._get_json_data(daily_data),
        }
        return res

    def export_volumes_proximity(self,
                                 forecast_id: str,
                                 forecasts_wells_map: dict,
                                 forecast_type: str,
                                 settings: dict,
                                 volumes_only: bool = False):
        forecast_name = self.context.forecasts_collection.find_one({'_id': ObjectId(forecast_id)}).get('name')

        monthly_res = {'resolution': 'monthly'}
        prod_monthly_stgs = get_export_settings(settings, 'productionMonthly', ProductionExportSettings, monthly_res)
        forecast_monthly_stgs = get_export_settings(settings, 'forecastMonthly', ForecastExportSettings, monthly_res)

        if volumes_only:
            daily_res = {'resolution': 'daily'}
            prod_daily_stgs = get_export_settings(settings, 'productionDaily', ProductionExportSettings, daily_res)
            forecast_daily_stgs = get_export_settings(settings, 'forecastDaily', ForecastExportSettings, daily_res)

            for forecast_id, wells in forecasts_wells_map.items():
                monthly_data = self._get_data(forecast_id, forecast_type, wells, prod_monthly_stgs,
                                              forecast_monthly_stgs)
                daily_data = self._get_data(forecast_id, forecast_type, wells, prod_daily_stgs, forecast_daily_stgs)

            return monthly_data, daily_data
        else:
            all_monthly_rows = []
            for forecast_id, wells in forecasts_wells_map.items():
                monthly_data = self._get_data(forecast_id, forecast_type, wells, prod_monthly_stgs,
                                              forecast_monthly_stgs)
                self._add_forecast_name(all_monthly_rows, monthly_data, forecast_id)

            for _, (headers, _) in monthly_data.items():
                headers = ['Forecast Name'] + list(headers)

            return self.upload_to_cloud_storage(all_monthly_rows, headers, forecast_name)

    def _add_forecast_name(self, all_rows, data, forecast_id):

        forecast_name = self.context.forecasts_collection.find_one({'_id': ObjectId(forecast_id)}).get('name')
        for _, (_, rows) in data.items():
            for row in rows:
                row['Forecast Name'] = forecast_name
                all_rows.append(row)

    def upload_to_cloud_storage(self, data, headers, name):

        csv_buffer = StringIO()
        csv_writer = csv.DictWriter(csv_buffer, quoting=csv.QUOTE_NONNUMERIC, fieldnames=headers, extrasaction='ignore')

        writer = csv.writer(csv_buffer)
        writer.writerow(headers)

        for row in data:
            csv_writer.writerow(row)

        run_date = datetime.datetime.utcnow()
        name = clean_filename(name)
        gcp_name = f'forecast-volumes--{str(name)}--{run_date.isoformat()}.csv'
        file_name = f'forecast-volumes--{str(name)}--{run_date.isoformat()}.csv'
        content_type = 'application/CSV'
        csv_file_info = {'gcpName': gcp_name, 'type': content_type, 'name': file_name}
        file_id = self.context.file_service.upload_file_from_string(csv_buffer.getvalue(), csv_file_info)

        return str(file_id)

    def export_forecast(self, forecast_id: str, forecast_type: str, wells: Iterable[str], settings: dict,
                        file_name_generator: BatchFileNameGenerator):
        monthly_res = {'resolution': 'monthly'}
        daily_res = {'resolution': 'daily'}
        prod_monthly_stgs = get_export_settings(settings, 'productionMonthly', ProductionExportSettings, monthly_res)
        prod_daily_stgs = get_export_settings(settings, 'productionDaily', ProductionExportSettings, daily_res)
        forecast_monthly_stgs = get_export_settings(settings, 'forecastMonthly', ForecastExportSettings, monthly_res)
        forecast_daily_stgs = get_export_settings(settings, 'forecastDaily', ForecastExportSettings, daily_res)

        self._export_data(forecast_id, forecast_type, wells, 'monthly', prod_monthly_stgs, forecast_monthly_stgs,
                          file_name_generator)
        self._export_data(forecast_id, forecast_type, wells, 'daily', prod_daily_stgs, forecast_daily_stgs,
                          file_name_generator)

        return 'ok'

    def _export_data(
            self,
            forecast_id: str,
            forecast_type: str,
            wells: Iterable[str],
            resolution: str,
            production_settings: ProductionExportSettings,
            forecast_settings: ForecastExportSettings,
            file_name_generator: BatchFileNameGenerator,
    ):
        data = self._get_data(forecast_id, forecast_type, wells, production_settings, forecast_settings)
        for kind, (headers, rows) in data.items():
            self._export_data_to_file(headers, rows, kind, resolution, file_name_generator)

    def _get_data(
            self,
            forecast_id: str,
            forecast_type: str,
            wells: Iterable[str],
            production_settings: ProductionExportSettings,
            forecast_settings: ForecastExportSettings,
    ):
        res = {}

        if production_settings.include:
            (production_headers, production_rows) = self._get_production_data(
                wells, production_settings, forecast_settings.include and forecast_settings.merge_with_production)

            if not forecast_settings.merge_with_production:
                res['production'] = (production_headers, production_rows)

        if forecast_settings.include:
            (forecast_headers, forecast_rows) = self._get_forecast_data(forecast_id, forecast_type, wells,
                                                                        forecast_settings)

            if forecast_settings.merge_with_production and production_rows:
                rows = merge_production_and_forecast(wells, production_rows, forecast_rows)
                res['forecast'] = (forecast_headers, rows)
            else:
                res['forecast'] = (forecast_headers, forecast_rows)

        return res

    @staticmethod
    def _get_json_data(data):
        return {k: get_rows_json_data(rows) for k, (_, rows) in data.items()}

    def _export_data_to_file(self, headers, rows, file_kind, resolution, file_name_generator):
        headers_file_name = file_name_generator.get_general_file_name(f'{file_kind}-{resolution}-headers')
        rows_file_name = file_name_generator.get_indexed_file_name(f'{file_kind}-{resolution}-rows')
        self._export_to_file(headers, headers_file_name, rows, rows_file_name)

    def _get_production_data(self, wells: Iterable[str], settings: ProductionExportSettings, include_kind=False):
        if settings.export_pressure and settings.resolution == 'daily':
            phases_to_export = (*PHASES, *PRESSURE_PHASES)
        else:
            phases_to_export = PHASES

        prod_filter = get_production_data_filter(settings.resolution, settings.start, settings.end)

        wells_data = self.context.production_service.get_production_with_headers(
            wells,
            ['_id', *WELL_HEADERS],
            RESOLUTION_MAP[settings.resolution],
            phases_to_export,
            prod_filter,
        )

        rows = (d for well in wells_data for d in get_prod_dicts(well, settings, include_kind))

        headers = (*WELL_HEADERS, 'date', *phases_to_export)
        mapped_headers = (get_header_display(h, settings, include_kind) for h in headers)

        return (mapped_headers, rows)

    def _get_forecast_data(
            self,
            forecast_id: str,
            forecast_type: str,
            wells: Iterable[str],
            settings: ForecastExportSettings,
    ):
        wells_forecast_data = self.context.production_service.get_forecast_with_headers(
            wells,
            ['_id', *WELL_HEADERS],
            forecast_id,
            PHASES,
            is_deterministic=forecast_type == 'deterministic',
        )

        rows = (d for well in wells_forecast_data for d in get_forecast_dicts(well, settings))

        headers = [*WELL_HEADERS, 'date', *get_forecast_file_headers(settings)]
        mapped_headers = [get_header_display(h, settings, settings.merge_with_production) for h in headers]

        return (mapped_headers, rows)

    def _export_to_file(self, headers: Iterable[str], headers_file_name: str, rows: Iterable[dict],
                        rows_file_name: str):
        storage = self.context.storage_service

        if not storage.exists(self.context.batch_bucket, headers_file_name):
            with StringIO(newline='') as headers_file:
                export_headers(headers, headers_file)
                headers_file.seek(0)
                storage.write_from_string(self.context.batch_bucket, headers_file_name, headers_file.read())

        with storage.read_to_file(self.context.batch_bucket, headers_file_name) as headers_file:
            with StringIO(newline='') as rows_file:
                export_rows(rows, headers_file, rows_file)
                rows_file.seek(0)
                storage.write_from_string(self.context.batch_bucket, rows_file_name, rows_file.read())

    def _merge_files(self, prefix: str, file_kind: str):
        return self.context.storage_service.merge_files(self.context.batch_bucket, f'{prefix}-{file_kind}', '-rows',
                                                        f'{prefix}-{file_kind}-headers')

    def finish_export(self, forecast_export_id: str, success: bool):
        file_name_prefix = forecast_export_id

        if not success:
            self.context.storage_service.bulk_delete(self.context.batch_bucket, file_name_prefix)
            self.context.forecasts_export_collection.update_one(
                {'_id': ObjectId(forecast_export_id)},
                {'$set': {
                    'status': 'failed'
                }},
            )
            return 'Forecast export failed'

        forecast_export = self.context.forecasts_export_collection.find_one({'_id': ObjectId(forecast_export_id)})

        file_kinds = [
            ('productionMonthly', 'production-monthly'),
            ('productionDaily', 'production-daily'),
            ('forecastMonthly', 'forecast-monthly'),
            ('forecastDaily', 'forecast-daily'),
        ]

        files_update = {}
        for (export_key, file_name_sub) in file_kinds:
            if not forecast_export_includes(forecast_export, export_key):
                continue
            [final_file_path] = self._merge_files(file_name_prefix, file_name_sub)
            blob = self.context.storage_service.move_file(self.context.batch_bucket, self.context.files_bucket,
                                                          final_file_path)
            file_id = self.context.file_service.create_file(blob)
            files_update[f'{export_key}.file'] = file_id

        self.context.forecasts_export_collection.update_one(
            {'_id': ObjectId(forecast_export_id)},
            {'$set': {
                'status': 'complete',
                **files_update
            }},
        )
        return 'Forecast export completed successfully'
