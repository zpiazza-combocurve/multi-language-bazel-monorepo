import datetime
from mongoengine import (Document, ObjectIdField, ListField, StringField, DictField, IntField, EmbeddedDocument,
                         EmbeddedDocumentField, DateTimeField, DynamicField, BooleanField)
from mongoengine.errors import ValidationError

well_headers = [
    'api14', 'country', 'county', 'hole_direction', 'first_prod_date', 'current_operator', 'state', 'basin', 'status'
]

operators = ['equal', 'not_equal', 'greater_than', 'greater_than_equal', 'less_than', 'less_than_equal', 'in', 'not_in']


def get_api_import_models(db_name):
    class ApiImportStats(EmbeddedDocument):
        totalWells = IntField(default=0)
        importedWells = IntField(default=0)
        foundWells = IntField(default=0)
        updatedWells = IntField(default=0)
        insertedWells = IntField(default=0)

        totalBatches = IntField(default=0)
        finishedBatches = IntField(default=0)

    class ApiImportFilters(EmbeddedDocument):
        key = StringField(choices=well_headers, required=True)
        operator = StringField(choices=operators, required=True)
        value = DynamicField(required=True)

    class ApiImport(Document):
        createdBy = ObjectIdField(required=True)
        name = StringField(required=True)
        dataSource = StringField(required=True, choices=['di'])
        importData = StringField(choices=['headers', 'production', 'headers_and_production'])
        importMethod = StringField(choices=['insert', 'update', 'upsert'])
        filters = ListField(EmbeddedDocumentField(ApiImportFilters))
        status = StringField(required=True,
                             choices=['created', 'queued', 'started', 'completed', 'failed'],
                             default='created')
        stats = EmbeddedDocumentField(ApiImportStats, default=ApiImportStats())
        events = ListField(DictField())
        problems = ListField(DictField())
        isAutomatic = BooleanField()
        createdAt = DateTimeField()

        meta = {'collection': 'api-imports', 'strict': False, 'db_alias': db_name}

        def change_status(self, new_status):
            self.status = new_status
            self.events.append({'kind': new_status, 'date': datetime.datetime.utcnow()})

        def clean(self):
            if self.importData == 'production' and self.importMethod != 'update':
                msg = f'Cannot {self.importMethod} when importing production'
                raise ValidationError(msg)

    return ApiImport, ApiImportFilters, ApiImportStats
