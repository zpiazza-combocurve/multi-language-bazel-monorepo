from mongoengine import (Document, StringField, ObjectIdField, DateTimeField, ListField, BooleanField, EmbeddedDocument,
                         EmbeddedDocumentField, IntField)


def get_schedule_model(db_name):
    class InputData(EmbeddedDocument):
        well = ObjectIdField()
        priority = IntField()
        status = StringField()

    class Qualifiers(EmbeddedDocument):
        inputField = StringField()
        qualifier = ObjectIdField()
        qualifierName = StringField()

    class Schedule(Document):
        name = StringField(required=True)
        createdBy = ObjectIdField()
        inputData = ListField(EmbeddedDocumentField(InputData))
        project = ObjectIdField()

        # `scenario` is required to create a Schedule but it will become null if the scenario is deleted.
        # In that case the scenario will be in a "frozen" state.
        scenario = ObjectIdField()
        scenarioExpireAt = DateTimeField()
        method = StringField(choices=['auto', 'manual'], required=True)
        setting = ObjectIdField()
        modified = BooleanField(default=False)
        constructed = BooleanField(default=False)
        qualifiers = ListField(EmbeddedDocumentField(Qualifiers))

        meta = {'collection': 'schedules', 'strict': False, 'db_alias': db_name, 'indexes': ['project']}

    return Schedule
