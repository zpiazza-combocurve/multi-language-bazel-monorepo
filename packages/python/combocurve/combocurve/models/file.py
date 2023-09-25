from mongoengine import Document, ObjectIdField, StringField, DateTimeField, IntField, FloatField
from datetime import datetime


def get_file_model(db_name):
    class File(Document):
        bSize = IntField()
        mbSize = FloatField()
        expireAt = DateTimeField()
        type = StringField()
        name = StringField(required=True)
        createdBy = ObjectIdField()  #ref: 'users'
        project = ObjectIdField()  #ref: 'projects'
        gcpName = StringField(required=True, unique=True)
        empty = StringField()
        createdAt = DateTimeField(default=datetime.utcnow().isoformat())

        meta = {'collection': 'files', 'strict': False, 'db_alias': db_name, 'indexes': ['name', 'gcpName']}

    return File
