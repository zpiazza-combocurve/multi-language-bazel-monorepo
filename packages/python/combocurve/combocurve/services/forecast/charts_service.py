from typing import Iterable
from io import BytesIO

from bson import ObjectId
from combocurve.shared.batch_file_name_generator import BatchFileNameGenerator
from combocurve.shared.collections import get_values
from .export_helpers import get_export_settings
from .export_settings import ChartsExportSettings
from combocurve.services.charts.generator import generate_chart, CHART_REQUIRED_HEADERS, ARIES_REQUIRED_HEADERS
from combocurve.services.charts.document_generator import generate_document, merge_documents
from combocurve.science.segment_models.use_forecast_data.chart_data import create_chart_data
from combocurve.services.charts.custom_streams import get_custom_streams, All_STREAMS


class ForecastChartsService:
    def __init__(self, context):
        self.context = context

    def export_forecast_charts(self, forecast_id: str, forecast_type: str, wells: Iterable[str], settings: dict,
                               file_name_generator: BatchFileNameGenerator):
        chart_settings = get_export_settings(settings, 'charts', ChartsExportSettings)

        data = self._get_data(forecast_id, wells, chart_settings)

        chart_files = self._generate_chart_memory_files(data, chart_settings)
        file_name = file_name_generator.get_indexed_file_name('forecast-charts-partial',
                                                              extension=f'.{chart_settings.document_format}')
        self._generate_and_save_document(chart_files, file_name, chart_settings)

        return 'ok'

    def _get_custom_fields(self, settings):
        daily_data_settings = settings.data_settings.daily
        monthly_data_settings = settings.data_settings.monthly

        daily_fields = [field for field in daily_data_settings if field in All_STREAMS]
        monthly_fields = [field for field in monthly_data_settings if field in All_STREAMS]

        return daily_fields, monthly_fields

    def _get_data(self, forecast_id: str, wells: Iterable[str], settings: ChartsExportSettings):
        daily_fields, monthly_fields = self._get_custom_fields(settings)
        (forecast, wells_data) = self.context.production_service.get_forecast_with_all_info(
            wells,
            forecast_id, ['_id', *CHART_REQUIRED_HEADERS, *ARIES_REQUIRED_HEADERS, *settings.headers],
            include_comments=settings.include_comments,
            daily_custom_fields=daily_fields,
            monthly_custom_fields=monthly_fields)

        if settings.aries.include:
            for well_data in wells_data:
                well_data['aries_data'] = self.context.cc_to_aries_service.chart_aries_format(well_data, settings.aries)

        if len(settings.project_headers):
            well_ids = (ObjectId(id) for id in wells)
            project_headers_data = self.context.project_custom_headers_service.get_custom_headers_data(
                forecast['project'], well_ids, settings.project_headers)
            for well_data in wells_data:
                well_data['project_custom_header'] = project_headers_data[well_data['header']['_id']]

        return ((well, create_chart_data(well, daily_custom_fields=daily_fields, monthly_custom_fields=monthly_fields))
                for well in wells_data)

    def _generate_chart_memory_files(self, data, settings: ChartsExportSettings):
        for (well_data, chart_data) in data:
            with BytesIO() as memory_file:
                self._generate_chart_to_file(well_data, chart_data, memory_file, settings)
                memory_file.seek(0)
                yield memory_file

    def _generate_chart_to_file(self, well_data, chart_data, file, settings: ChartsExportSettings):
        [monthly_data, daily_data, forecast_data] = get_values(chart_data, ['monthly', 'daily', 'forecast'])
        c_streams = get_custom_streams(self.context)
        generate_chart(well_data, monthly_data, daily_data, forecast_data, file, settings, custom_streams=c_streams)

    def _generate_and_save_document(self,
                                    image_files: Iterable[BytesIO],
                                    file_name: str,
                                    settings: ChartsExportSettings,
                                    partial=True):
        bucket = self.context.batch_bucket if partial else self.context.files_bucket

        with BytesIO() as document_file:
            generate_document(image_files, document_file, settings)
            return self.context.storage_service.write_from_file(bucket, file_name, document_file)

    def _merge_documents(self, partial_files: Iterable[BytesIO], final_doc_name: str, settings: ChartsExportSettings):
        with BytesIO() as final_file:
            merge_documents(partial_files, final_file, settings)
            return self.context.storage_service.write_from_file(self.context.files_bucket, final_doc_name, final_file)

    def finish_export(self, forecast_export_id: str, success: bool, file_name_generator: BatchFileNameGenerator):
        file_name_prefix = file_name_generator.get_common_prefix('forecast-charts-partial')

        if not success:
            self.context.storage_service.bulk_delete(self.context.batch_bucket, file_name_prefix)
            self.context.forecasts_export_collection.update_one(
                {'_id': ObjectId(forecast_export_id)},
                {'$set': {
                    'status': 'failed'
                }},
            )
            return 'Forecast charts export failed'

        forecast_export = self.context.forecasts_export_collection.find_one({'_id': ObjectId(forecast_export_id)})
        settings = ChartsExportSettings.from_dict(forecast_export.get('charts', {}).get('settings', {}))
        final_doc_name = file_name_generator.get_general_file_name('forecast-charts',
                                                                   extension=f'.{settings.document_format}')
        partial_files = self.context.storage_service.read_all_to_open_files(self.context.batch_bucket,
                                                                            file_name_prefix,
                                                                            as_text=False)

        blob = self._merge_documents(partial_files, final_doc_name, settings)

        for f in partial_files:
            f.close()

        self.context.storage_service.bulk_delete(self.context.batch_bucket, file_name_prefix)
        file_id = self.context.file_service.create_file(blob)

        self.context.forecasts_export_collection.update_one(
            {'_id': ObjectId(forecast_export_id)},
            {'$set': {
                'status': 'complete',
                'charts.file': file_id
            }},
        )
        return 'Forecast charts export completed successfully'
