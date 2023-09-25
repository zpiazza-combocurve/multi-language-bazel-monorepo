from datetime import timedelta, datetime
from combocurve.utils.constants import (TASK_STATUS_COMPLETED, TASK_STATUS_FAILED, TASK_STATUS_QUEUED,
                                        TASK_STATUS_RUNNING)
from mongoengine import Document, ObjectIdField, StringField, BooleanField, DateTimeField, DictField

NOTIFICATION_TYPE_CC_CC_IMPORT = 1


def get_notification_model(db_name):
    class Notification(Document):
        type = StringField()  # TODO add all needed choices
        status = StringField(
            choices=[TASK_STATUS_QUEUED, TASK_STATUS_RUNNING, TASK_STATUS_COMPLETED, TASK_STATUS_FAILED])
        title = StringField()
        description = StringField()
        createdBy = ObjectIdField()
        forUser = ObjectIdField()
        read = BooleanField(default=False)
        extra = DictField()
        expireAt = DateTimeField(default=(datetime.utcnow() + timedelta(days=14)).isoformat())  # needs to be 2 weeks
        createdAt = DateTimeField(default=datetime.utcnow())
        updatedAt = DateTimeField()

        meta = {'collection': 'notifications', 'strict': False, 'db_alias': db_name}

    return Notification
