from bson.objectid import ObjectId
from pymongo import UpdateOne

from api.file_imports.spreadsheet_readers import ExcelFileReader, CsvFileReader


class ScheduleImport:
    def __init__(self, context):
        self.context = context

    def _get_file_reader(self, file_id):
        db_file = self.context.file_service.get_file(file_id)
        buffer = self.context.file_service.download_to_memory(db_file.gcpName)
        file_name = db_file.name.lower()
        if file_name.endswith('.xlsx'):
            return ExcelFileReader(buffer)
        elif file_name.endswith('.csv'):
            return CsvFileReader(buffer)
        else:
            raise InvalidFileError('Invalid file extension')

    def _get_assignments_with_inpt_id_pipeline(self, schedule_id):
        return [{
            '$match': {
                '_id': ObjectId(schedule_id)
            }
        }, {
            '$unwind': '$inputData'
        }, {
            '$lookup': {
                'from': 'wells',
                'localField': 'inputData.well',
                'foreignField': '_id',
                'as': 'well'
            }
        }, {
            '$project': {
                'well': '$inputData.well',
                'status': '$inputData.status',
                'priority': '$inputData.priority',
                'inptID': {
                    '$arrayElemAt': ['$well.inptID', 0]
                },
            }
        }]

    def import_schedule_order(self, schedule_id, file_id):
        with self._get_file_reader(file_id) as reader:
            input_data = self.context.schedule_collection.aggregate(
                self._get_assignments_with_inpt_id_pipeline(schedule_id))
            file_rows = reader.get_dicts()
            wells_order_dict = {
                file_row.get('INPT ID'): _try_parse_int(file_row.get('Priority'))
                for file_row in file_rows
            }
            wells_dict = {ObjectId(schedule_id): list(input_data)}

            for a in wells_dict[ObjectId(schedule_id)]:
                a['priority'] = wells_order_dict[str(a['inptID'])]
                a.pop('inptID', None)

            if len(wells_dict[ObjectId(schedule_id)]) > 0:
                update_operations = [
                    UpdateOne({'_id': ObjectId(schedule_id)},
                              {'$set': {
                                  'inputData': wells_dict[ObjectId(schedule_id)]
                              }})
                ]
                res = self.context.schedule_collection.bulk_write(update_operations).bulk_api_result
            else:
                res = "No well assignment was updated."

            return res


def _try_parse_int(value):
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


class InvalidFileError(Exception):
    expected = True
