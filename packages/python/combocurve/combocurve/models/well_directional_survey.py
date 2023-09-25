from mongoengine import Document, ObjectIdField, ListField, IntField, DateTimeField

from combocurve.models.custom_fields import CustomFloatField

WELL_DIRECTIONAL_SURVEY_SCHEMA_VERSION = 1


def get_well_directional_survey_model(db_name):
    class WellDirectionalSurvey(Document):
        schemaVersion = IntField(default=WELL_DIRECTIONAL_SURVEY_SCHEMA_VERSION)
        well = ObjectIdField(required=True)
        project = ObjectIdField(default=None, null=True)
        measuredDepth = ListField(CustomFloatField())
        trueVerticalDepth = ListField(CustomFloatField())
        azimuth = ListField(CustomFloatField())
        inclination = ListField(CustomFloatField())
        deviationNS = ListField(CustomFloatField())
        deviationEW = ListField(CustomFloatField())
        latitude = ListField(CustomFloatField())
        longitude = ListField(CustomFloatField())

        createdAt = DateTimeField()
        updatedAt = DateTimeField()

        meta = {'collection': 'well-directional-surveys', 'strict': False, 'db_alias': db_name}

    return WellDirectionalSurvey
