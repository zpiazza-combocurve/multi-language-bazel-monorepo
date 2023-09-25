from datetime import datetime
from mongoengine import (
    Document,
    ObjectIdField,
    StringField,
    IntField,
    BooleanField,
    DateTimeField,
)
from combocurve.utils.assumption_fields import ASSUMPTION_FIELDS


def get_cc_to_cc_import_model(db_alias):
    class CcToCcImport(Document):
        scenarioId = ObjectIdField(required=True)
        forecastId = ObjectIdField(required=True)
        projectId = ObjectIdField()
        importType = StringField()
        assumptionKey = StringField(choices=ASSUMPTION_FIELDS, required=True)
        qualifierKey = StringField(choices=ASSUMPTION_FIELDS, required=True)
        userId = ObjectIdField(required=True)
        fileId = ObjectIdField(required=True)
        newQualifer = BooleanField(default=True)
        lock = IntField(default=0)
        createdAt = DateTimeField(default=datetime.utcnow().isoformat())
        updatedAt = DateTimeField(default=datetime.utcnow().isoformat())

        meta = {'collection': 'cc-to-cc-imports', 'strict': False, 'db_alias': db_alias}

    return CcToCcImport
