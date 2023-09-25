from mongoengine import (Document, EmbeddedDocument, StringField, ObjectIdField, IntField, DateTimeField, DictField,
                         EmbeddedDocumentField, ListField)

from combocurve.utils.constants import (TASK_STATUS_COMPLETED, TASK_STATUS_FAILED, TASK_STATUS_QUEUED,
                                        TASK_STATUS_RUNNING)


def get_task_models(db_name):
    class TaskProgress(EmbeddedDocument):
        emitter = StringField(required=True)  # emitter name to push progress
        complete = IntField(default=0)  # number of successful tasks
        denom = IntField(
            default=1
        )  # number of tasks that need to be completed (successful + failed) before pushing progress to the user
        failed = IntField(default=0)  # number of tasks that have failed
        total = IntField(required=True)  # total number of tasks
        channel = DictField()
        initial = IntField(default=0)  # initial % progress to use for the task
        end = IntField(default=100)  # end % progress to use for the task

    class Task(Document):
        createdAt = DateTimeField()
        body = DictField()
        finishedAt = DateTimeField()
        description = StringField(default='')
        error = StringField(default=None, null=True)
        kindId = ObjectIdField(required=True)
        lastSuccess = DateTimeField()
        aborted = IntField(required=True)
        batches = ListField(DictField(), required=True)
        status = StringField(
            choices=[TASK_STATUS_QUEUED, TASK_STATUS_RUNNING, TASK_STATUS_COMPLETED, TASK_STATUS_FAILED],
            required=True,
            default=TASK_STATUS_QUEUED)
        title = StringField(required=True)
        user = ObjectIdField()
        kind = StringField(choices=[
            'cc-cc-import', 'diagnostics', 'economics_file', 'economics', 'feedback', 'file_upload', 'forecast',
            'rollUp', 'file-import', 'di-import'
        ])  # should match cloud function name
        progress = EmbeddedDocumentField(TaskProgress)
        cleanUp = DictField()
        cleanUpAt = DateTimeField()
        mostRecentEnd = DateTimeField()
        mostRecentStart = DateTimeField()

        meta = {'collection': 'tasks', 'strict': False, 'db_alias': db_name}

        def get_progress(self):
            progress = self.progress
            return (progress.complete + progress.failed) / progress.total

    return Task, TaskProgress
