from io import StringIO
from typing import Iterable, Optional
from bson import ObjectId

from combocurve.shared.batch_file_name_generator import BatchFileNameGenerator
from combocurve.shared.csv_export import export_headers, export_rows
from combocurve.shared.well_headers import WELL_HEADERS_DICT

BATCH_FILE_NAME_MAIN_PREFIX = 'wells-export-data'
BATCH_FILE_NAME_HEADERS_SUFFIX = 'headers'
BATCH_FILE_NAME_ROWS_SUFFIX = 'rows'


class WellsExportService:

    def __init__(self, context):
        self.context = context

    def export_wells(self, well_ids: Iterable[str], project_id: Optional[str],
                     file_name_generator: BatchFileNameGenerator):
        project_oid = ObjectId(project_id) if project_id else None
        well_oids = [ObjectId(well_id) for well_id in well_ids]
        headers_file_name = file_name_generator.get_general_file_name(BATCH_FILE_NAME_HEADERS_SUFFIX)
        headers_dict, pc_headers_dict = self._get_well_headers_dict(project_oid)
        headers_labels = list(headers_dict.values())

        wells_file_name = file_name_generator.get_indexed_file_name(BATCH_FILE_NAME_ROWS_SUFFIX)
        rows = self._get_rows(well_oids, project_oid, headers_dict, pc_headers_dict)

        self._export_to_file(headers_file_name, headers_labels, wells_file_name, rows)

        return 'ok'

    def _get_well_headers_dict(self, project_oid: Optional[ObjectId]) -> dict:
        all_headers = {}

        all_headers.update(WELL_HEADERS_DICT)
        if project_oid:
            all_headers['project'] = 'Scope'
        all_headers.update(self.context.custom_fields_service.get_custom_fields('wells'))
        pc_headers = self.context.project_custom_headers_service.get_project_custom_headers_dict(
            project_oid) if project_oid else {}
        all_headers.update(pc_headers)

        return all_headers, pc_headers

    def _get_rows(self, well_oids: Iterable[ObjectId], project_oid: Optional[ObjectId], headers: dict,
                  pc_headers_dict: dict):
        wells = self.context.well_service.get_wells(well_oids)
        pchs_data = {}

        if project_oid:
            pchs_data = self.context.project_custom_headers_service.get_custom_headers_data(
                project_oid, well_oids, pc_headers_dict.keys())

        modified_wells = []

        for well in wells:
            modified_well = {}

            for header_key in headers:
                if project_oid and header_key == 'project':
                    modified_well[headers[header_key]] = 'Project' if well.get('project', None) else 'Company'
                else:
                    modified_well[headers[header_key]] = well.get(header_key,
                                                                  pchs_data.get(well['_id'], {}).get(header_key, None))

            modified_wells.append(modified_well)

        return modified_wells

    def _export_to_file(self, headers_file_name: str, headers: Iterable[str], wells_file_name: str,
                        rows: Iterable[dict]):
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
                storage.write_from_string(self.context.batch_bucket, wells_file_name, rows_file.read())

    def _merge_files(self):
        return self.context.storage_service.merge_files(
            self.context.batch_bucket, BATCH_FILE_NAME_MAIN_PREFIX, f'-{BATCH_FILE_NAME_ROWS_SUFFIX}',
            f'{BATCH_FILE_NAME_MAIN_PREFIX}-{BATCH_FILE_NAME_HEADERS_SUFFIX}')

    def finish_export(self, task, success: bool):
        if not success:
            self.context.storage_service.bulk_delete(self.context.batch_bucket, BATCH_FILE_NAME_MAIN_PREFIX)
            return 'Wells export failed'

        [final_file_path] = self._merge_files()
        blob = self.context.storage_service.move_file(self.context.batch_bucket, self.context.files_bucket,
                                                      final_file_path, f'{str(task["_id"])}-{final_file_path}')
        self.context.file_service.create_file(blob)

        return {'file': {'gcpName': blob.name, 'name': 'wells.csv'}}
