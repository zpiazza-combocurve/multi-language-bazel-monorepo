from mongoengine import (Document, EmbeddedDocument, StringField, DateTimeField, ListField, ObjectIdField, IntField,
                         EmbeddedDocumentField)

ARCHIVE_PROJECT_VERSIONS = {
    'V_1': None,  # initial version, everything comes from the Mongodb
    'V_2': 'V2: Production data DAL'  # app retrieves production data from the DAL
}


def get_archived_project_model(db_name):

    class ProjectItem(EmbeddedDocument):
        name = StringField(required=True)
        updated = DateTimeField()

        meta = {'strict': False, 'db_alias': db_name}

    class ArchivedProject(Document):
        projectId = ObjectIdField(required=True)
        versionName = StringField(required=True)
        projectName = StringField(required=True)
        storageDirectory = StringField(required=True)
        wellsCount = IntField()
        createdBy = ObjectIdField()
        scenarios = ListField(EmbeddedDocumentField(ProjectItem))
        forecasts = ListField(EmbeddedDocumentField(ProjectItem))
        typecurves = ListField(EmbeddedDocumentField(ProjectItem))
        assumptions = ListField(EmbeddedDocumentField(ProjectItem))
        schedules = ListField(EmbeddedDocumentField(ProjectItem))
        createdAt = DateTimeField()
        version = StringField(required=False, default=None)

        meta = {'collection': 'archived-projects', 'strict': False, 'db_alias': db_name}

    return ArchivedProject, ProjectItem
