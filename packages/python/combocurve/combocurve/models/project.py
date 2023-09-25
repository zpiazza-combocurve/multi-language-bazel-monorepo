from mongoengine import (Document, StringField, DateTimeField, ListField, ObjectIdField, DictField)


def get_project_model(db_name):
    class Project(Document):
        name = StringField(required=True, unique=True)
        expireAt = DateTimeField()
        wells = ListField(ObjectIdField())
        createdBy = ObjectIdField()
        copiedFrom = ObjectIdField()
        scenarios = ListField(ObjectIdField())
        status = DictField()
        history = DictField()

        meta = {'collection': 'projects', 'strict': False, 'db_alias': db_name}

    return Project
