from io import StringIO
from typing import Mapping, Iterable
from itertools import chain

from bson import ObjectId

from combocurve.shared.batch_file_name_generator import BatchFileNameGenerator
from combocurve.shared.csv_export import export_headers, export_rows_with_headers
from combocurve.utils.collision_report import FIELDS, get_headers, get_header_display, get_pair_row, get_single_well_row


class CollisionReportService:
    def __init__(self, context):
        self.context = context

    def generate_report_batch(self, collisions: Mapping[str, Iterable[str]],
                              file_name_generator: BatchFileNameGenerator, single_wells: bool):
        headers_file_name = file_name_generator.get_general_file_name('headers')
        rows_file_name = file_name_generator.get_indexed_file_name('rows')

        rows = self._get_data(collisions, single_wells)

        self._export_to_file(headers_file_name, rows_file_name, rows, single_wells)

        return 'ok'

    def _get_data(self, collisions: Mapping[str, Iterable[str]], single_wells: bool):
        wells = self._get_all_wells(collisions)
        if single_wells:
            return (get_single_well_row(wells[w]) for w in collisions.keys())
        well_pairs = ((wells[source], wells[dest]) for source, dest_list in collisions.items() for dest in dest_list)
        return (get_pair_row(source, dest) for source, dest in well_pairs)

    def _get_all_wells(self, collisions: Mapping[str, Iterable[str]]):
        all_ids = chain(collisions.keys(), chain(*collisions.values()))
        wells = self.context.wells_collection.find({'_id': {'$in': [ObjectId(id) for id in all_ids]}}, FIELDS)
        return {str(w['_id']): w for w in wells}

    def _export_to_file(self, headers_file_name: str, rows_file_name: str, rows: Iterable[dict], single_wells: bool):
        storage = self.context.storage_service
        headers = get_headers(single_wells)

        if not storage.exists(self.context.batch_bucket, headers_file_name):
            with StringIO(newline='') as headers_file:
                export_headers([get_header_display(h) for h in headers], headers_file)
                headers_file.seek(0)
                storage.write_from_string(self.context.batch_bucket, headers_file_name, headers_file.read())

        with storage.read_to_file(self.context.batch_bucket, headers_file_name) as headers_file:
            with StringIO(newline='') as rows_file:
                export_rows_with_headers(rows, headers, rows_file)
                rows_file.seek(0)
                storage.write_from_string(self.context.batch_bucket, rows_file_name, rows_file.read())

    def _merge_files(self, file_name_generator: BatchFileNameGenerator):
        return self.context.storage_service.merge_files(self.context.batch_bucket, file_name_generator.prefix, '-rows',
                                                        file_name_generator.get_general_file_name('headers'))

    def finish_report(self, task, success: bool):
        file_name_generator = BatchFileNameGenerator(f'collision-report-{task["_id"]}',
                                                     len(task.get('batches', [])) - 1)

        if not success:
            self.context.storage_service.bulk_delete(self.context.batch_bucket, file_name_generator.prefix)
            return 'Collision report generation failed'

        [final_file_path] = self._merge_files(file_name_generator)
        blob = self.context.storage_service.move_file(self.context.batch_bucket, self.context.files_bucket,
                                                      final_file_path)
        self.context.file_service.create_file(blob)

        return {'file': {'gcpName': blob.name, 'name': 'collision-report.csv'}}
