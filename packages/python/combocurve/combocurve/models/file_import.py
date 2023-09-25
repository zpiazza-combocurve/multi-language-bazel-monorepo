import datetime
from mongoengine import (Document, ObjectIdField, ListField, StringField, DictField, IntField, EmbeddedDocument,
                         EmbeddedDocumentField, BooleanField, DateTimeField)


def get_file_import_models(db_name):
    class FileImportStats(EmbeddedDocument):
        totalWells = IntField(default=0)
        importedWells = IntField(default=0)
        foundWells = IntField(default=0)
        updatedWells = IntField(default=0)
        insertedWells = IntField(default=0)

        totalMonthly = IntField(default=0)
        insertedMonthly = IntField(default=0)
        updatedMonthly = IntField(default=0)
        failedMonthly = IntField(default=0)

        totalDaily = IntField(default=0)
        insertedDaily = IntField(default=0)
        updatedDaily = IntField(default=0)
        failedDaily = IntField(default=0)

        totalSurveyRows = IntField(default=0)
        insertedSurveyRows = IntField(default=0)
        updatedSurveyRows = IntField(default=0)
        failedSurveyRows = IntField(default=0)
        totalSurveyWells = IntField(default=0)
        insertedSurveyWells = IntField(default=0)
        updatedSurveyWells = IntField(default=0)
        failedSurveyWells = IntField(default=0)

        totalBatches = IntField(default=0)
        finishedBatches = IntField(default=0)

    class FileImportFile(EmbeddedDocument):
        mapping = DictField()
        headers = ListField(StringField())
        file = ObjectIdField()
        mappedHeaders = ListField(StringField())
        category = StringField()

    class WellInfo(EmbeddedDocument):
        chosenID = StringField()
        well_name = StringField()
        well_number = StringField()

    class UpdateWellInfo(EmbeddedDocument):
        chosenID = StringField()
        well_name = StringField()
        well_number = StringField()
        wells = ListField(ObjectIdField())

    class DataSettings(EmbeddedDocument):
        coordinateReferenceSystem = StringField(choices=['WGS84', 'NAD27', 'NAD83'], default='WGS84')

    class FileImport(Document):
        user = ObjectIdField(required=True)
        project = ObjectIdField()
        description = StringField()
        dataSource = StringField(required=True,
                                 choices=['di', 'ihs', 'phdwin', 'aries', 'internal', 'other'],
                                 default='other')
        replace_production = BooleanField(default=True)
        status = StringField(required=True,
                             choices=[
                                 'created', 'mapping', 'mapped', 'preprocessing', 'queued', 'started', 'complete',
                                 'aries_started', 'aries_complete', 'phdwin_started', 'phdwin_complete', 'failed',
                                 'aborted'
                             ],
                             default='created')

        stats = EmbeddedDocumentField(FileImportStats, default=FileImportStats())
        events = ListField(DictField())
        errors = ListField(DictField())
        headerFile = EmbeddedDocumentField(FileImportFile)
        productionDailyFile = EmbeddedDocumentField(FileImportFile)
        productionMonthlyFile = EmbeddedDocumentField(FileImportFile)
        directionalSurveyFile = EmbeddedDocumentField(FileImportFile)
        batchFiles = ListField(StringField())
        createdAt = DateTimeField()

        importType = StringField(choices=['generic', 'aries', 'phdwin'])
        files = ListField(EmbeddedDocumentField(FileImportFile))

        ariesSetting = DictField()

        wellsToCreate = ListField(EmbeddedDocumentField(WellInfo), default=None)
        wellsToUpdate = ListField(EmbeddedDocumentField(UpdateWellInfo), default=None)

        importMode = StringField(choices=['create', 'update', 'both'], default='both')

        dataSettings = EmbeddedDocumentField(DataSettings, default=DataSettings())

        meta = {'collection': 'file-imports', 'strict': False, 'db_alias': db_name}

        def change_status(self, new_status):
            self.status = new_status
            self.events.append({'type': new_status, 'date': datetime.datetime.utcnow()})

    return (FileImport, FileImportFile, FileImportStats, WellInfo, UpdateWellInfo)
