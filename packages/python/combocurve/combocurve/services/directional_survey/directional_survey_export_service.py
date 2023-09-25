from io import StringIO
from collections.abc import Iterable

from bson import ObjectId

from combocurve.shared.batch_file_name_generator import BatchFileNameGenerator
from combocurve.shared.csv_export import export_headers, export_rows
from .utils import HEADERS_DISPLAY, unwind_directional_survey_document


class DirectionalSurveyExportService:
    def __init__(self, context):
        self.context = context

    def export_directional_surveys(self, wells: Iterable[str], headers: Iterable[str],
                                   file_name_generator: BatchFileNameGenerator):
        headers_file_name = file_name_generator.get_general_file_name('headers')
        rows_file_name = file_name_generator.get_indexed_file_name('rows')

        (display_headers, rows) = self._get_directional_surveys(wells, headers)

        self._export_to_file(display_headers, headers_file_name, rows, rows_file_name)

        return 'ok'

    def _get_directional_surveys(self, wells: Iterable[str], headers: Iterable[str]):
        well_ids = [ObjectId(w) for w in wells]
        base_projection = list(headers)

        db_wells = self.context.wells_collection.find({'_id': {'$in': well_ids}}, base_projection)
        db_directional_surveys = self.context.well_directional_surveys_collection.find({'well': {
            '$in': well_ids
        }}, [*base_projection, 'well'])

        wells_dict = {w['_id']: w for w in db_wells}

        directional_survey_rows = (r for survey in db_directional_surveys
                                   for r in unwind_directional_survey_document(survey))
        combined_rows = (wells_dict[r['well']] | r for r in directional_survey_rows)
        final_rows = ({HEADERS_DISPLAY[k]: v for k, v in r.items() if k in HEADERS_DISPLAY} for r in combined_rows)

        mapped_headers = [HEADERS_DISPLAY[h] for h in headers if h in HEADERS_DISPLAY]

        return mapped_headers, final_rows

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

    def _merge_files(self, file_name_generator: BatchFileNameGenerator):
        return self.context.storage_service.merge_files(self.context.batch_bucket, file_name_generator.prefix, '-rows',
                                                        file_name_generator.get_general_file_name('headers'))

    def finish_export(self, file_name_generator: BatchFileNameGenerator, success: bool):
        if not success:
            self.context.storage_service.bulk_delete(self.context.batch_bucket, file_name_generator.prefix)
            return 'Directional survey export failed'

        [final_file_path] = self._merge_files(file_name_generator)
        blob = self.context.storage_service.move_file(self.context.batch_bucket, self.context.files_bucket,
                                                      final_file_path)
        self.context.file_service.create_file(blob)

        return {'file': {'gcpName': blob.name, 'name': 'directional-surveys.csv'}}
