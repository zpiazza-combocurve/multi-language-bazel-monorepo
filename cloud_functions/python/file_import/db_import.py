from typing import TYPE_CHECKING, Union
import json
from datetime import datetime
from io import BytesIO
from collections.abc import Mapping, Iterable

from pymongo import ReturnDocument
from pymongo.errors import BulkWriteError
from bson.objectid import ObjectId

from cloud_functions.file_import.common import HEADERS_KEY, MONTHLY_KEY, DAILY_KEY, SURVEY_KEY
from cloud_functions.file_import.file_import_data import FileImportData
from combocurve.services.data_import.import_data import DataSettings
from combocurve.shared.db_import import log_bulk_write_error

if TYPE_CHECKING:
    from .context import FileImportCFContext


def _get_rows(in_rows):
    # Makes sure in_rows doesn't have duplicate chosen_id rows and consolidates them if it does
    out_rows = dict()
    for row in in_rows:
        chosen_id = row['chosen_id']
        value = out_rows.get(chosen_id, dict())

        headers = row.get(HEADERS_KEY)
        if headers is not None:
            value[HEADERS_KEY] = headers

        monthly_in = row.get(MONTHLY_KEY)
        if monthly_in is not None:
            value[MONTHLY_KEY] = value.get(MONTHLY_KEY, list()) + monthly_in

        daily_in = row.get(DAILY_KEY)
        if daily_in is not None:
            value[DAILY_KEY] = value.get(DAILY_KEY, list()) + daily_in

        survey_in = row.get(SURVEY_KEY)
        if survey_in is not None:
            value[SURVEY_KEY] = value.get(SURVEY_KEY, list()) + survey_in

        out_rows[chosen_id] = value

    return list(out_rows.values())


class FileImportDbService:
    def __init__(self, context: 'FileImportCFContext'):
        self.context = context

    def get_data_from_batch_name(self, batch_name):
        buffer = BytesIO()
        self.context.google_services.storage_batches_bucket.blob(batch_name).download_to_file(buffer)
        # using errors='replace' will cause us to lose characters that cannot be decoded with UTF-8
        # however, MongoDB only accepts UTF-8, so they would be lost anyway, sooner or later
        decoded = buffer.getvalue().decode(errors='replace')
        return json.loads(f'[{decoded[:-1]}]')

    def import_to_db(self, body, in_rows):
        start_time = datetime.utcnow()

        import_id = body['data_import_id']
        task_id = body['task_id']
        headers = body['headers']
        rows = _get_rows(in_rows)

        try:
            task = self.context.task_model.objects.get(id=task_id)
            file_import = self.context.file_import_model.objects.get(id=import_id)
            replace_production = file_import.replace_production

            extra_data = {
                'dataPool': 'internal' if file_import.dataSource == 'internal' else 'external',
                'mostRecentImport': file_import.id,
                'mostRecentImportDesc': file_import.description,
                'mostRecentImportType': 'spreadsheet',
                'mostRecentImportDate': file_import.createdAt
            }

            data_settings = DataSettings(file_import.dataSource,
                                         file_import.project,
                                         coordinate_reference_system=file_import.dataSettings.coordinateReferenceSystem)
            data = FileImportData(headers, rows, data_settings, extra_data)

            headers_result, well_docs = self.context.import_service.upsert_wells(data, replace_production)

            self.context.import_service.update_calcs(well_docs, data_settings)

            well_ids_dict = self.context.import_service.get_wells_ids(well_docs, data_settings)
            wells_surface_locations = self.context.import_service.get_wells_surface_locations(well_docs, data_settings)

            monthly_result = self.context.import_service.update_monthly(data, well_ids_dict, replace=replace_production)
            daily_result = self.context.import_service.update_daily(data, well_ids_dict, replace=replace_production)

            survey_result = self.context.import_service.replace_survey(data, well_ids_dict, wells_surface_locations)

            # update import
            errors = headers_result['writeErrors'] + survey_result['errors']

            stats = {
                'foundWells': headers_result['nMatched'],
                'insertedWells': headers_result['nInserted'] + headers_result['nUpserted'],
                'updatedWells': headers_result['nModified'],
                'importedWells':
                headers_result['nInserted'] + headers_result['nUpserted'] + headers_result['nModified'],
                #
                'totalMonthly': monthly_result['total'],
                'insertedMonthly': monthly_result['imported'],
                'failedMonthly': monthly_result['total'] - monthly_result['imported'],
                #
                'totalDaily': daily_result['total'],
                'insertedDaily': daily_result['imported'],
                'failedDaily': daily_result['total'] - daily_result['imported'],
                #
                'totalSurveyWells': survey_result['total_wells'],
                'totalSurveyRows': survey_result['total_rows'],
                'insertedSurveyWells': survey_result['valid_wells'],
                'insertedSurveyRows': survey_result['valid_rows'],
                'failedSurveyWells': survey_result['total_wells'] - survey_result['valid_wells'],
                'failedSurveyRows': survey_result['total_rows'] - survey_result['valid_rows'],
                #
                'finishedBatches': 1
            }
            file_import_update_pipeline = get_file_import_update_pipeline(stats, start_time, errors)
            updated_file_import = self.context.file_import_collection.find_one_and_update(
                {'_id': ObjectId(import_id)},
                file_import_update_pipeline,
                return_document=ReturnDocument.AFTER,
                projection=['stats', 'status'])

            new_status = updated_file_import['status']

            if new_status != file_import.status:
                being_imported_text = _get_status_description_text(stats['importedWells'],
                                                                   stats['totalMonthly'] + stats['totalDaily'],
                                                                   stats['totalSurveyRows'])
                body = {'extra.body.status': new_status, 'description': f'Importing {being_imported_text}'}
                self.context.notification_service.update_notification_with_notifying_target(task.progress.emitter, body)

        except BulkWriteError as bwe:
            details = bwe.details
            errors = details.get('writeErrors')
            log_bulk_write_error(bwe, f'Errors during bulk write: {str(errors)}')
            self.context.file_import_collection.update_one(
                {'_id': ObjectId(import_id)}, {'$push': {
                    'errors': {
                        '$each': [{
                            'message': str(e)
                        } for e in errors]
                    }
                }})
            raise bwe
        except Exception as e:
            raise e

    def validate_import_data(self, data):
        if data is None:
            return False
        if 'headers' not in data or 'rows' not in data or 'data_import_id' not in data:
            return False
        return True


def _get_dict(headers, row):
    return {headers[i]: row[i] for i in range(min(len(headers), len(row)))}


def _update_stats_pipeline_stage(stats: Mapping[str, int]):
    return {'$set': {f'stats.{k}': {'$add': [f'$stats.{k}', v]} for k, v in stats.items()}}


def _update_errors_pipeline_stage(errors: Iterable[Union[Mapping, str]]):
    return {'$set': {'errors': {'$concatArrays': ['$errors', {'$literal': errors}]}}}


def _get_status_description_text(importing_wells, importing_production, imorting_survey):
    being_imported = []
    if importing_wells:
        being_imported.append('well headers')
    if importing_production:
        being_imported.append('production data')
    if imorting_survey:
        being_imported.append('directional surveys')

    if len(being_imported) == 1:
        return being_imported[0]
    return f'{", ".join(being_imported[:-1])} and {being_imported[-1]}'


def _update_status_and_events_pipeline_stage(start_time: datetime):
    return {
        '$set': {
            'status': {
                '$switch': {
                    'branches': [
                        {
                            'case': {
                                '$gte': ["$stats.finishedBatches", "$stats.totalBatches"]
                            },
                            'then': "complete"
                        },
                    ],
                    'default': "started"
                }
            },
            'events': {
                '$concatArrays': [
                    '$events', {
                        '$switch': {
                            'branches': [
                                {
                                    'case': {
                                        '$eq': ["$status", "mapped"]
                                    },
                                    'then': [{
                                        'type': 'started',
                                        'date': start_time
                                    }]
                                },
                                {
                                    'case': {
                                        '$eq': ["$status", "queued"]
                                    },
                                    'then': [{
                                        'type': 'started',
                                        'date': start_time
                                    }]
                                },
                            ],
                            'default': []
                        }
                    }, {
                        '$switch': {
                            'branches': [
                                {
                                    'case': {
                                        '$gte': ["$stats.finishedBatches", "$stats.totalBatches"]
                                    },
                                    'then': [{
                                        'type': 'complete',
                                        'date': '$$NOW'
                                    }]
                                },
                            ],
                            'default': []
                        }
                    }
                ]
            }
        }
    }


def get_file_import_update_pipeline(stats: Mapping[str, int], start_time: datetime, errors: Iterable[Union[Mapping,
                                                                                                           str]]):
    return [
        _update_stats_pipeline_stage(stats),
        _update_status_and_events_pipeline_stage(start_time),
        _update_errors_pipeline_stage(errors)
    ]
