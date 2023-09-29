from typing import TYPE_CHECKING
import datetime
import json
import queue
import logging
from concurrent.futures.thread import ThreadPoolExecutor
from itertools import chain
from pymongo.errors import DocumentTooLarge

import requests
from bson import ObjectId
from google.api_core.retry import Retry

from combocurve.shared.helpers import clean_dict, clean_id, first_or_default, split_in_chunks
from combocurve.shared.collections import group_by
from combocurve.shared.urls import get_main_url
from combocurve.shared.config import ENVIRONMENT
from combocurve.utils import storage, exceptions
from combocurve.utils.constants import DEFAULT_USER_NOTIFICATION_ERROR, TASK_STATUS_FAILED, TASK_STATUS_RUNNING
from .spreadsheet_readers import ExcelFileReader, CsvFileReader
from .preprocessing_progress import FileImportPreprocessingProgress
from .mapping_validation import check_mappings, InvalidMappingError

if TYPE_CHECKING:
    from api.context import Context

DEFAULT_BATCH = {'processed': 0, 'start': None, 'end': None}
MAX_WORKERS = 10
MAX_QUEUE_SIZE = 5 * MAX_WORKERS
MAX_CLOUD_BATCH_SIZE = 2  # (mb) This controls how much each cloud function will process and cause load on the db
MAX_GCS_BATCH_REQUESTS_SIZE = 100  # https://cloud.google.com/storage/docs/json_api/v1/how-tos/batch

FILE_SIZE_LIMITS = {'ip': 2048, 'ch4': 2048, 'archenergy': 2048, 'hilcorp': 2048}  # in MB
DEFAULT_FILE_SIZE_LIMIT = 1024  # MB
ARIES_DEFAULT_FILE_SIZE_LIMIT = 500  # MB

CHOSEN_ID_LABELS = {'api14': 'API14', 'aries_id': 'Aries ID'}

_DEFAULT_CALL_STATE = {'processed': 0, 'start': None, 'end': None}

BASIC_FILE_FIELDS = ['headerFile', 'productionMonthlyFile', 'productionDailyFile', 'directionalSurveyFile']


class FileImportService:
    def __init__(self, context: 'Context'):
        self.context = context

    def get_file_headers(self, props):
        _id = props['_id']
        user_id = props['userId']
        return [_id, user_id]

    def get_file_import(self, import_id):
        return self.context.file_import_model.objects.get(id=import_id)

    def get_import(self, import_id):
        return self._to_dict_with_files(self.get_file_import(import_id))

    def _populate_file(self, file_entry):
        if file_entry.get('file'):
            file_entry['file'] = self.context.file_service.get_file(file_entry['file']).to_mongo().to_dict()

    def _to_dict_with_files(self, file_import):
        file_import_dict = file_import.to_mongo().to_dict()

        basic_files = [file_import_dict[field] for field in BASIC_FILE_FIELDS if field in file_import_dict]
        all_files = [*basic_files, *file_import_dict.get('files', [])]

        for file in all_files:
            self._populate_file(file)

        return file_import_dict

    def get_file_size_limit(self, import_type='generic'):
        default_limit = ARIES_DEFAULT_FILE_SIZE_LIMIT if import_type in ['aries', 'phdwin'] else DEFAULT_FILE_SIZE_LIMIT
        return FILE_SIZE_LIMITS.get(self.context.subdomain.lower(), default_limit)

    def _get_file_data(self, file, import_type):
        db_file = self.context.file_service.get_file(file['file'])
        file_name = db_file['name']
        gcp_name = db_file['gcpName']
        mb_size = self.context.file_service.get_actual_file_size(gcp_name) / 1048576  # 1KB = 1024B; 1MB = 1024KB
        size_limit = self.get_file_size_limit(import_type)
        if mb_size > size_limit:
            raise InvalidFileSizeError(f"Size of \"{file_name}\" exceeds limit of {size_limit} MB.")
        return (file_name, self.context.file_service.download_to_memory(gcp_name))

    def _get_reader(self, file_name, file):
        if file_name.lower().endswith('.xlsx'):
            return ExcelFileReader(file)
        elif file_name.lower().endswith('.csv'):
            return CsvFileReader(file)
        else:
            raise IOError('Invalid file extension')

    def _get_batch_headers(self, file, reader):
        mapping = file['mapping']

        original_headers = reader.get_headers()
        mapped_headers = [mapping.get(h, None) for h in original_headers]
        filtered_headers = [(mapped_headers[i], i) for i in range(len(mapped_headers)) if mapped_headers[i] is not None]

        try:
            chosen_id = mapping['chosenID']
            chosen_id_index = original_headers.index(chosen_id)
        except KeyError:
            raise InvalidMappingError("No header is mapped as ChosenID.")
        except ValueError:
            raise InvalidMappingError(f'"{chosen_id}" was not found in the file headers.')

        filtered_headers.append(('chosenID', chosen_id_index))

        filtered_headers.append(('chosenKeyID', chosen_id))

        return zip(*filtered_headers)

    def _get_index(self, row, index):
        try:
            return row[index]
        except TypeError:
            return index

    def _get_batch_rows(self, reader, header_indexes):
        original_rows = reader.get_rows()
        return ([self._get_index(row, index) for index in header_indexes] for row in original_rows)

    def _get_object_property(self, field_object, object_param):
        try:
            return object_param[field_object]
        except Exception:
            return None

    def _get_file_type(self, fi):
        return {
            'headers': self._get_object_property('headerFile', fi),
            'monthly': self._get_object_property('productionMonthlyFile', fi),
            'daily': self._get_object_property('productionDailyFile', fi),
            'survey': self._get_object_property('directionalSurveyFile', fi),
        }

    def update_file_mapping(self, import_id, body):
        file = self.get_file_import(import_id)
        file_type = self._get_file_type(file)[body['category']]
        file_type.mapping = body['mapping']

        file.save()

    def finish_file_mapping(self, import_id, description=None):
        file_import = self.get_file_import(import_id)
        check_mappings(file_import)
        if description is not None:
            file_import.description = description
        file_import.change_status('mapped')

        return self._to_dict_with_files(file_import.save())

    def set_project(self, import_id, body):
        project = body.get('project')
        file_import = self.get_file_import(import_id)
        file_import.project = project
        file_import.replace_production = True
        return self._to_dict_with_files(file_import.save())

    def config_import(self, import_id, project, replace_production):
        file_import = self.get_file_import(import_id)
        file_import.project = project
        file_import.replace_production = replace_production
        return self._to_dict_with_files(file_import.save())

    def _get_file_headers(self, file):
        db_file = self.context.file_service.get_file(file.file)
        file_name = db_file.name
        file_download = self.context.file_service.download_to_memory(db_file.gcpName)

        reader = self._get_reader(file_name, file_download)
        reader.open()
        res = [file.mapping.get(h, h) for h in reader.get_headers()]
        reader.close()

        return res

    def _set_file_headers(self, file_import, file_type):
        file = self._get_object_property(file_type, file_import)
        if file is not None:
            file.headers = self._get_file_headers(file)

    def get_headers(self, import_id):
        file_import = self.get_file_import(import_id)

        self._set_file_headers(file_import, 'headerFile')
        self._set_file_headers(file_import, 'productionDailyFile')
        self._set_file_headers(file_import, 'productionMonthlyFile')
        self._set_file_headers(file_import, 'directionalSurveyFile')

        return self._to_dict_with_files(file_import.save())

    def get_user_file_imports(self, user_id):
        files = list(self.context.file_import_model.objects(user=user_id).order_by('-events.0.date'))
        return [self._to_dict_with_files(f) for f in files]

    def add_files_to_file_import(self, import_id, files):
        file_import = self.get_file_import(import_id)

        def get_file(category, prod_type=None):
            f = first_or_default(files,
                                 lambda f: f['category'] == category and (not prod_type or f['prodType'] == prod_type))
            if f is None:
                return None
            size_limit = self.get_file_size_limit(file_import.importType)
            if f['mbSize'] > size_limit:
                raise InvalidFileSizeError(f"Size of \"{f['name']}\" exceeds limit of {size_limit} MB.")
            return self.context.file_import_file_model(file=f['_id'])

        file_import.headerFile = get_file('headerFiles')
        file_import.productionDailyFile = get_file('prodFiles', 'daily')
        file_import.productionMonthlyFile = get_file('prodFiles', 'monthly')
        file_import.directionalSurveyFile = get_file('directionalSurvey')
        file_import.change_status('mapping')

        self._set_file_headers(file_import, 'headerFile')
        self._set_file_headers(file_import, 'productionDailyFile')
        self._set_file_headers(file_import, 'productionMonthlyFile')
        self._set_file_headers(file_import, 'directionalSurveyFile')

        return file_import.save().to_mongo().to_dict()

    # Deprecated. This was for the old file import UI.
    def create_file_import(self, user_id, project_id, data_source, description, files):
        def get_file(category, prod_type=None):
            if not files:
                return None
            f = first_or_default(files,
                                 lambda f: f['category'] == category and (not prod_type or f['prodType'] == prod_type))
            return self.context.file_import_file_model(file=f['_id']) if f is not None else None

        def get_default_description():
            return f'{data_source} Import - {datetime.datetime.now().strftime("%m/%d/%Y %I:%M:%S %p")}'

        header_file = get_file('headerFiles')
        production_daily_file = get_file('prodFiles', 'daily')
        production_monthly_file = get_file('prodFiles', 'monthly')

        fields = {
            'user': user_id,
            'project': project_id,
            'description': description if description else get_default_description(),
            'dataSource': data_source,
            'status': 'mapping',
            'events': [{
                'type': 'mapping',
                'date': datetime.datetime.utcnow()
            }],
            'headerFile': header_file,
            'productionDailyFile': production_daily_file,
            'productionMonthlyFile': production_monthly_file
        }

        return self.context.file_import_model(**clean_dict(fields)).save().to_mongo().to_dict()

    def create_import(self, user_id, project_id, data_source, description):
        def get_default_description():
            return f'{data_source} Import - {datetime.datetime.now().strftime("%m/%d/%Y %I:%M:%S %p")}'

        fields = {
            'user': user_id,
            'project': project_id,
            'description': description if description else get_default_description(),
            'dataSource': data_source,
            'replace_production': False,
            'status': 'created',
            'createdAt': datetime.datetime.utcnow(),
            'events': [{
                'type': 'created',
                'date': datetime.datetime.utcnow()
            }],
        }

        return self.context.file_import_model(**clean_dict(fields)).save().to_mongo().to_dict()

    @staticmethod
    def _get_info_mapping(mapping):
        wanted_headers = {'well_name', 'well_number'}
        res = {v: k for k, v in mapping.items() if v in wanted_headers}
        res['chosenID'] = mapping['chosenID']
        return res

    @staticmethod
    def _get_well_info(row_dict, info_mapping):
        well_info = {key: row_dict.get(info_mapping.get(key)) for key in ['chosenID', 'well_name', 'well_number']}
        chosen_id = clean_id(well_info['chosenID'])
        well_info['chosenID'] = chosen_id
        return well_info if chosen_id else None

    @staticmethod
    def _get_files_to_use(header, daily, monthly, survey):
        if header:
            return [header]
        res = []
        if daily:
            res.append(daily)
        if monthly:
            res.append(monthly)
        if survey:
            res.append(survey)
        return res

    def _get_file_well_infos(self, file, import_type):
        (file_name, buffer) = self._get_file_data(file, import_type)
        with self._get_reader(file_name, buffer) as reader:
            info_mapping = self._get_info_mapping(file.mapping)
            well_infos = (self._get_well_info(row_dict, info_mapping) for row_dict in reader.get_dicts())
            return {w['chosenID']: w for w in well_infos if w}

    def get_wells_info(self, file_import_id):
        file_import = self.get_file_import(file_import_id)

        files_to_use = self._get_files_to_use(file_import.headerFile, file_import.productionDailyFile,
                                              file_import.productionMonthlyFile, file_import.directionalSurveyFile)

        file_well_infos = (self._get_file_well_infos(file, file_import.importType) for file in files_to_use)
        well_infos = {k: v for d in file_well_infos for k, v in d.items()}

        chosen_ids = list(well_infos.keys())
        db_wells = self.context.well_service.get_wells_from_chosen_ids(file_import.dataSource, file_import.project,
                                                                       chosen_ids, ['_id', 'chosenID'])
        wells_dict = group_by(db_wells, lambda w: w['chosenID'], lambda w: w['_id'])

        create_well_infos = (w for chosen_id, w in well_infos.items() if chosen_id not in wells_dict)
        update_well_infos = ({
            **w, 'wells': wells_dict[chosen_id]
        } for chosen_id, w in well_infos.items() if chosen_id in wells_dict)

        try:
            file_import.wellsToCreate = [self.context.file_import_well_info_model(**w) for w in create_well_infos]
            file_import.wellsToUpdate = [
                self.context.file_import_update_well_info_model(**w) for w in update_well_infos
            ]
            file_import.save()
        except DocumentTooLarge:
            raise TooManyWellsError()

    @Retry(deadline=30)
    def _batch_delete_files(self, file_blobs):
        with self.context.google_services.storage_client.batch():  # On exit will process all the batched calls
            for blob in file_blobs:
                blob.delete()

    @Retry(deadline=30)
    def _get_batch_blobs(self, import_id):
        storage_client = self.context.google_services.storage_client
        batches_bucket = self.context.google_services.storage_batches_bucket
        return list(storage_client.list_blobs(batches_bucket, prefix=import_id))

    def delete_file_import(self, import_id):
        try:
            file_import = self.get_file_import(import_id)
        except self.context.file_import_model.DoesNotExist:
            raise InvalidFileImportError("The specified file import could not be found.")

        file_import_files = (file_import.headerFile, file_import.productionMonthlyFile, file_import.productionDailyFile)
        file_docs = self.context.file_service.get_files([f.file for f in file_import_files if f and f.file])
        for f in file_docs:
            try:
                self.context.file_service.delete_file(f.gcpName)
            except Exception:
                pass

        try:
            batches = self._get_batch_blobs(import_id)
            for chunk in split_in_chunks(batches, MAX_GCS_BATCH_REQUESTS_SIZE):
                try:
                    self._batch_delete_files(chunk)
                except Exception:
                    pass
        except Exception:
            pass

        self.context.file_import_model.objects(id=import_id).delete()

    def _create_task(self, task_id, import_id, user_id, emitter, total_tasks, initial_progress=0, end_progress=100):
        channel = {'type': 'user', 'tenant': self.context.subdomain, 'user_id': str(user_id)}
        progress = self.context.task_progress_model(emitter=emitter,
                                                    total=total_tasks,
                                                    channel=channel,
                                                    initial=initial_progress,
                                                    end=end_progress)

        # NOTE: must keep in sync with: main/api/tasks/creation.js
        # TODO: move this to combocurve-utils-py
        task = self.context.task_model(
            aborted=0,
            batches=[DEFAULT_BATCH for _ in range(total_tasks)],
            cleanUp=_DEFAULT_CALL_STATE,
            cleanUpAt=None,
            createdAt=datetime.datetime.utcnow(),
            id=task_id,
            kind='file-import',
            kindId=import_id,
            mostRecentEnd=None,
            mostRecentStart=None,
            progress=progress,
            title=f'File import {import_id}',
            user=user_id,
        )
        task.save()
        return task

    @staticmethod
    def _get_wanted_chosen_ids(file_import):
        if file_import.wellsToCreate is None or file_import.wellsToUpdate is None:
            return None

        to_create_ids = (clean_id(well.chosenID) for well in file_import.wellsToCreate)
        to_update_ids = (clean_id(well.chosenID) for well in file_import.wellsToUpdate)

        choices = {
            'create': to_create_ids,
            'update': to_update_ids,
            'both': chain(to_create_ids, to_update_ids),
        }

        try:
            wanted_ids = choices[file_import.importMode]
        except KeyError:
            raise InvalidImportModeError(file_import.importMode)

        return set(wanted_ids)

    def _get_bare_headers(self, file_import):
        wanted_ids = self._get_wanted_chosen_ids(file_import)
        if wanted_ids is None:
            return ([], {})
        headers_headers = ['chosenID']
        headers_dict = {
            chosen_id: {
                "row": [chosen_id],
                "monthly_counter": 0,
                "daily_counter": 0,
                'survey_counter': 0
            }
            for chosen_id in wanted_ids
        }

        return headers_headers, headers_dict

    def _get_headers_dict(self, header_rows, header_chosen_id_index, file_import):
        wanted_ids = self._get_wanted_chosen_ids(file_import)

        new_dict = dict()
        for row in header_rows:
            chosen_id = clean_id(row[header_chosen_id_index])
            if wanted_ids is not None and chosen_id not in wanted_ids:
                continue
            if chosen_id not in new_dict:
                # counter will record how many times we saw this id in the data
                new_dict[chosen_id] = {"row": row, "monthly_counter": 0, "daily_counter": 0, 'survey_counter': 0}
            else:
                # TODO decide what happens when chosen id appears twice in header data. Just log for now.
                logging.warning(f'Chosen id {chosen_id} appeared more than once in data import {file_import.id} in '
                                + f'tenant {self.context.subdomain}')

        return new_dict

    def _update_notification_and_notify_client(self, file_import, status, notification_id, body):
        if status is not None:
            file_import.change_status(status)
            file_import.save()

        self.context.notification_service.update_notification_with_notifying_target(notification_id, body)

    def _get_file_errors(self, reader, file_name):
        if reader is None:
            return []
        return ({**error, 'file': file_name} for error in reader.errors)

    def _read_header_file(self, file_import):
        header_file = file_import.headerFile

        if header_file:
            (header_file_name, header_buffer) = self._get_file_data(header_file, file_import.importType)
            header_reader = self._get_reader(header_file_name, header_buffer)
            header_reader.open()
            (header_headers, header_header_indexes) = self._get_batch_headers(header_file, header_reader)
            header_rows = self._get_batch_rows(header_reader, header_header_indexes)
            headers_dict = self._get_headers_dict(header_rows, header_headers.index('chosenID'), file_import)
        else:
            header_file_name = None
            header_reader = None
            (header_headers, headers_dict) = self._get_bare_headers(file_import)

        return (header_file_name, header_reader, header_headers, headers_dict)

    def _read_non_header_file(self, file_import_file, import_type):
        if file_import_file is not None:
            (file_name, buffer) = self._get_file_data(file_import_file, import_type)
            reader = self._get_reader(file_name, buffer)
            reader.open()

            (headers, headers_indexes) = self._get_batch_headers(file_import_file, reader)
            rows = self._get_batch_rows(reader, headers_indexes)
        else:
            file_name = None
            reader = None
            headers = []
            rows = []

        return (file_name, reader, headers, rows)

    def start_file_import(self, import_id, user_id, notification_id):
        header_reader = None
        monthly_reader = None
        daily_reader = None
        survey_reader = None

        try:
            progress = FileImportPreprocessingProgress(self.context.pusher, notification_id, self.context.subdomain,
                                                       user_id)

            file_import = self.get_file_import(import_id)
            status = 'preprocessing'
            self._update_notification_and_notify_client(file_import, status, notification_id, {
                'status': TASK_STATUS_RUNNING,
                'description': 'Preprocessing Import Files...',
                'extra.body.status': status
            })

            header_file = file_import.headerFile
            daily_file = file_import.productionDailyFile
            monthly_file = file_import.productionMonthlyFile
            survey_file = file_import.directionalSurveyFile

            progress.notify(1)

            (header_file_name, header_reader, header_headers, headers_dict) = self._read_header_file(file_import)

            if not len(headers_dict):
                raise NoWellsToImportError()

            progress.notify(3)

            (daily_file_name, daily_reader, daily_headers,
             daily_rows) = self._read_non_header_file(daily_file, file_import.importType)
            (monthly_file_name, monthly_reader, monthly_headers,
             monthly_rows) = self._read_non_header_file(monthly_file, file_import.importType)
            (survey_file_name, survey_reader, survey_headers,
             survey_rows) = self._read_non_header_file(survey_file, file_import.importType)

            task_id = ObjectId()
            base_filename = str(import_id) + '-' + str(task_id)

            progress.notify(7)

            batches_notifier = progress.get_batches_notifier(7, 30, header_reader, monthly_reader, daily_reader,
                                                             survey_reader)

            self._create_chosen_id_batches(base_filename, headers_dict, daily_headers, daily_rows, monthly_headers,
                                           monthly_rows, survey_headers, survey_rows, batches_notifier)

            progress.notify(40)

            batches = self._merge_chosen_id_batches(base_filename)

            progress.notify(43)

            batch_count = len(batches)
            total_wells = len(headers_dict)
            file_import.stats = self.context.file_import_stats_model()
            file_import.stats.totalWells = total_wells
            file_import.stats.totalBatches = batch_count
            file_import.batchFiles = batches
            if header_file:
                header_file.mappedHeaders = header_headers
            else:
                file_import.headerFile = self.context.file_import_file_model(file=None, mappedHeaders=header_headers)
            if monthly_file:
                monthly_file.mappedHeaders = monthly_headers
            if daily_file:
                daily_file.mappedHeaders = daily_headers
            if survey_file:
                survey_file.mappedHeaders = survey_headers
            file_import.errors = [
                *self._get_file_errors(header_reader, header_file_name),
                *self._get_file_errors(daily_reader, daily_file_name),
                *self._get_file_errors(monthly_reader, monthly_file_name),
                *self._get_file_errors(survey_reader, survey_file_name),
            ]
            status = 'queued'
            self._update_notification_and_notify_client(file_import, status, notification_id, {
                'description': 'Import in queue',
                'extra.body.status': status
            })

            end_progress = 70 if file_import['importType'] in ['aries', 'phdwin'] else 100

            self._create_task(task_id, file_import.id, user_id, notification_id, batch_count, 45, end_progress)

            task_info = {
                "task_id": str(task_id),
                "kind": "file-import",
                "batch_count": batch_count,
                "import_id": str(file_import.id)
            }
            logging.info('Enqueueing Task', extra={'metadata': task_info})
            main_url = get_main_url(self.context.subdomain)
            if ENVIRONMENT == 'development' and __debug__:
                requests.get(f"{main_url}/api/task/check-pending-tasks/file-import", headers={'Host': 'localhost:3000'})
            else:
                requests.get(f"{main_url}/api/task/check-pending-tasks/file-import")

            progress.notify(45)
        except Exception as ex:
            error_info = exceptions.get_exception_info(ex)
            user_error = error_info['message'] if error_info['expected'] else DEFAULT_USER_NOTIFICATION_ERROR

            try:
                file_import.errors.append(error_info)
            except:  # noqa: E722
                pass

            try:
                status = 'failed'
                self._update_notification_and_notify_client(
                    file_import, status, notification_id, {
                        'description': user_error,
                        'extra.error': user_error,
                        'extra.body.status': status,
                        'status': TASK_STATUS_FAILED
                    })
            except:  # noqa: E722
                pass

            raise ex
        finally:
            if header_reader is not None:
                header_reader.close()
            if monthly_reader is not None:
                monthly_reader.close()
            if daily_reader is not None:
                daily_reader.close()
            if survey_reader is not None:
                survey_reader.close()

    def _do_threaded_combine(self, threads_queue, storage_client, bucket, prefix, suffix, content_type):
        try:
            storage.combine_storage_files(storage_client, bucket, prefix, suffix, content_type)
        except storage.FileTooBigError:
            raise WellDataLimitExceededError()
        finally:
            threads_queue.get()

    def _check_threads_finished(self, thread_results):
        for res in thread_results:
            res.result()  # Calling this will reraise any exception in the threads

    def _create_chosen_id_batches(self, base_filename, headers_dict, daily_headers, daily_rows, monthly_headers,
                                  monthly_rows, survey_headers, survey_rows, batches_notifier):
        # A queue is used to ensure a maximum limit to calls to thread. Otherwise memory usage will go too high.
        # Threads speed things up since most of the time is spent waiting for network from write to GCS, but too many
        # threads will cause memory usage to spike.
        threads_queue = queue.Queue(MAX_QUEUE_SIZE)
        thread_results = list()
        # Process each type of data file and write the well data into batches.
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            if monthly_headers:
                monthly_chosen_id_index = monthly_headers.index('chosenID')
                self._process_data_file(threads_queue, thread_results, executor, base_filename, headers_dict,
                                        monthly_rows, monthly_chosen_id_index, 'monthly', batches_notifier)
            if daily_headers:
                daily_chosen_id_index = daily_headers.index('chosenID')
                self._process_data_file(threads_queue, thread_results, executor, base_filename, headers_dict,
                                        daily_rows, daily_chosen_id_index, 'daily', batches_notifier)
            if survey_headers:
                survey_chosen_id_index = survey_headers.index('chosenID')
                self._process_data_file(threads_queue, thread_results, executor, base_filename, headers_dict,
                                        survey_rows, survey_chosen_id_index, 'survey', batches_notifier)

            self._write_closing_batch_files(threads_queue, thread_results, executor, base_filename, headers_dict,
                                            batches_notifier)

        self._check_threads_finished(thread_results)

        thread_results = list()
        # Combine well data batches so we end up with 1 batch file per chosen_id
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            for chosen_id in headers_dict:
                num_of_files = self._get_chosen_id_counter(headers_dict[chosen_id])
                if num_of_files > 1:
                    threads_queue.put(1, block=True)
                    thread_results.append(
                        executor.submit(self._do_threaded_combine, threads_queue,
                                        self.context.google_services.storage_client,
                                        self.context.google_services.storage_batches_bucket,
                                        self._get_chosen_id_filename_prefix(base_filename,
                                                                            chosen_id), '', 'application/json'))
        self._check_threads_finished(thread_results)

    def _write_closing_batch_files(self, threads_queue, thread_results, executor, base_filename, headers_dict,
                                   batches_notifier):
        for i, chosen_id in enumerate(headers_dict):
            counter = self._get_chosen_id_counter(headers_dict[chosen_id])
            if counter == 0:
                self._write_well_data_to_storage(threads_queue, thread_results, executor, base_filename, headers_dict,
                                                 chosen_id, None, None)
                batches_notifier(i / len(headers_dict))

    def _process_data_file(self, threads_queue, thread_results, executor, base_filename, headers_dict, rows,
                           chosen_id_index, title, batches_notifier):
        # Write each clump of data per chosen_id to storage
        # Same chosen_id can appear multiple times throughout the file
        previous_chosen_id = None
        id_rows = list()
        counter = 0
        for row in rows:
            current_chosen_id = clean_id(row[chosen_id_index])
            if previous_chosen_id != current_chosen_id:
                if previous_chosen_id is not None:
                    counter = counter + 1
                    self._write_well_data_to_storage(threads_queue, thread_results, executor, base_filename,
                                                     headers_dict, previous_chosen_id, id_rows, title)
                    batches_notifier()
                id_rows = list()
                previous_chosen_id = current_chosen_id
            id_rows.append(row)

        self._write_well_data_to_storage(threads_queue, thread_results, executor, base_filename, headers_dict,
                                         previous_chosen_id, id_rows, title)

    def _get_chosen_id_counter(self, header_data):
        return header_data['monthly_counter'] + header_data['daily_counter'] + header_data['survey_counter']

    def _get_chosen_id_filename_prefix(self, base_filename, chosen_id):
        return f'{base_filename}-{chosen_id}-'

    def _write_well_data_to_storage(self, threads_queue, thread_results, executor, base_filename, headers_dict,
                                    chosen_id, prod_data, title):
        header_data = headers_dict.get(chosen_id)
        if not header_data:
            # TODO deal with case where there is no header for this chosen_id.
            # Ignore for now, add some sort of feedback to user in the future
            return
        filename = self._get_chosen_id_filename_prefix(base_filename, chosen_id)
        if title:
            header_data[f'{title}_counter'] = header_data[f'{title}_counter'] + 1
            total_counter = self._get_chosen_id_counter(header_data)
            filename += '{:08d}'.format(total_counter)
        else:
            # We reach here if a well has no production data.
            total_counter = 0
        line = []
        if total_counter == 0:
            # We are adding only the header in a well that has no production data
            line.append('{"headers":')
            line.append(json.dumps(header_data['row']))
            line.append(f',"chosen_id": "{chosen_id}"')
            line.append('},')
        elif total_counter == 1:
            # Add headers
            line.append('{"headers":')
            line.append(json.dumps(header_data['row']))
            line.append(f',"chosen_id": "{chosen_id}",')
            # Add the data part
            line.append(f'"{title}":{json.dumps(prod_data)}')
            line.append('},')
        else:
            # Add only the data part, headers will come from the first batch
            line.append('{')
            line.append(f'"chosen_id": "{chosen_id}",')
            # Add the data part
            line.append(f'"{title}":{json.dumps(prod_data)}')
            line.append('},')

        payload = ''.join(line)
        threads_queue.put(1, block=True)
        thread_results.append(executor.submit(self._write_string_to_storage, threads_queue, filename, payload))

    def _write_string_to_storage(self, threads_queue, filename, payload):
        try:
            blob = self.context.google_services.storage_batches_bucket.blob(filename)
            blob.upload_from_string(payload, content_type="application/json")
        finally:
            threads_queue.get()

    def _merge_chosen_id_batches(self, base_filename):
        try:
            return storage.combine_storage_files(self.context.google_services.storage_client,
                                                 self.context.google_services.storage_batches_bucket,
                                                 base_filename,
                                                 '',
                                                 'application/json',
                                                 combine_size_lim=MAX_CLOUD_BATCH_SIZE)
        except storage.FileTooBigError:
            raise WellDataLimitExceededError()


class InvalidFileSizeError(Exception):
    expected = True


class InvalidFileImportError(Exception):
    expected = True


class MissingHeadersFileError(Exception):
    expected = True


class WellDataLimitExceededError(Exception):
    def __init__(self,
                 message='One or more wells has too much data. Check your chosen ID. '
                 + 'If everything looks correct contact support.'):
        super().__init__(message)

    expected = True


class InvalidImportModeError(Exception):
    expected = True

    def __init__(self, import_mode):
        super().__init__(f'Invalid import mode `{import_mode}`.')


class NoWellsToImportError(Exception):
    expected = True

    def __init__(self):
        super().__init__('No wells were chosen to be imported.')


class TooManyWellsError(Exception):
    expected = True

    def __init__(self):
        super().__init__('Too many wells for a single import. Try splitting your well headers file.')
