from datetime import datetime
from mongoengine import (
    Document,
    ObjectIdField,
    StringField,
    BooleanField,
    DateTimeField,
    DictField,
)


def get_assumption_model(db_alias):
    class Assumption(Document):
        options = DictField()
        econ_function = DictField()
        fromHeader = BooleanField()
        name = StringField(required=True)
        unique = BooleanField(default=False)
        assumptionName = StringField(required=True)
        createdBy = ObjectIdField()
        assumptionKey = StringField(required=True)
        scenario = ObjectIdField()
        lastUpdatedBy = ObjectIdField()
        copiedFrom = ObjectIdField(default=None)
        well = ObjectIdField()
        typeCurve = ObjectIdField(default=None)
        project = ObjectIdField()
        expireAt = DateTimeField()
        createdAt = DateTimeField(default=datetime.utcnow().isoformat())
        updatedAt = DateTimeField(default=datetime.utcnow().isoformat())

        meta = {'collection': 'assumptions', 'db_alias': db_alias}

    return Assumption
