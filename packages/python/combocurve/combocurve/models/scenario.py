from datetime import datetime
from mongoengine import (
    Document,
    ObjectIdField,
    StringField,
    DateTimeField,
    DictField,
    ListField,
)


def get_scenario_model(db_alias):
    class Scenario(Document):
        columns = DictField()
        name = StringField(required=True)
        expireAt = DateTimeField()
        wells = ListField(ObjectIdField())
        createdBy = ObjectIdField()
        copiedFrom = ObjectIdField()
        project = ObjectIdField()
        status = DictField()
        history = DictField()
        createdAt = DateTimeField(default=datetime.utcnow().isoformat())
        updatedAt = DateTimeField(default=datetime.utcnow().isoformat())

        meta = {'collection': 'scenarios', 'strict': False, 'db_alias': db_alias}

    return Scenario
