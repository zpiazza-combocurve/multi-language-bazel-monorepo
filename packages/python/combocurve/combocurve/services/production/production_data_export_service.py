from io import StringIO
from typing import Iterable

from combocurve.services.forecast.export_helpers import (
    RESOLUTION_MAP,
    get_header_display,
    get_phases_to_include,
    get_prod_dicts,
    get_production_data_filter,
    get_export_settings,
)
from combocurve.services.forecast.export_settings import ProductionExportSettings
from combocurve.shared.batch_file_name_generator import BatchFileNameGenerator
from combocurve.shared.csv_export import export_headers, export_rows

PRODUCTION_COLLECTIONS = {
    'monthly': 'monthly-productions',
    'daily': 'daily-productions',
}


class ProductionDataExportService:
    def __init__(self, context):
        self.context = context

    def export_production_data(self, wells: Iterable[str], headers: Iterable[str],
                               file_name_generator: BatchFileNameGenerator, settings_dict: dict):
        settings = get_export_settings(settings_dict, 'production', ProductionExportSettings)

        (production_headers, production_rows) = self._get_production_data(wells, headers, settings)

        headers_file_name = file_name_generator.get_general_file_name(f'production-{settings.resolution}-headers')

        rows_file_name = file_name_generator.get_indexed_file_name(f'production-{settings.resolution}-rows')

        self._export_to_file(production_headers, headers_file_name, production_rows, rows_file_name)

        return 'ok'

    def _get_production_data(self, wells: Iterable[str], headers: Iterable[str], settings: ProductionExportSettings):
        prod_filter = get_production_data_filter(settings.resolution)

        phases = get_phases_to_include(headers)

        wells_data = self.context.production_service.get_production_with_headers(
            wells,
            ['_id', *headers],
            RESOLUTION_MAP[settings.resolution],
            phases,
            prod_filter,
        )

        custom_fields = self.context.custom_fields_service.get_custom_fields(
            PRODUCTION_COLLECTIONS[settings.resolution])

        rows = (d for well in wells_data
                for d in get_prod_dicts(well, settings, phases=phases, extra_header_map=custom_fields))

        mapped_headers = (get_header_display(h, settings, extra_header_map=custom_fields) for h in headers)

        return mapped_headers, rows

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

    def finish_export(self, task, success: bool):
        file_name_prefix = 'production-export-data'

        if not success:
            self.context.storage_service.bulk_delete(self.context.batch_bucket, file_name_prefix)
            return 'Production data export failed'

        resolution = task['body']['settings']['production']['resolution']
        file_name_sub = f"production-{resolution}"

        [final_file_path] = self._merge_files(file_name_prefix, file_name_sub)
        blob = self.context.storage_service.move_file(self.context.batch_bucket, self.context.files_bucket,
                                                      final_file_path, f'{str(task["_id"])}-{final_file_path}')
        self.context.file_service.create_file(blob)

        return {'file': {'gcpName': blob.name, 'name': f'{resolution}-production-data.csv'}}
