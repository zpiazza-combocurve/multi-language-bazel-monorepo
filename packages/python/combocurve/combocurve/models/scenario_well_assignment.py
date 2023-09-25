from datetime import datetime
from mongoengine import (
    Document,
    ObjectIdField,
    DateTimeField,
    DictField,
    IntField,
)


def get_scenario_well_assigment_model(db_alias):
    class ScenarioWellAssignment(Document):
        expireAt = DateTimeField()

        reserves_category = DictField()
        dates = DictField()
        ownership_reversion = DictField()
        forecast = DictField()
        forecast_p_series = DictField()
        schedule = DictField()
        capex = DictField()
        pricing = DictField()
        differentials = DictField()
        stream_properties = DictField()
        expenses = DictField()
        production_taxes = DictField()
        production_vs_fit = DictField()
        risking = DictField()

        project = ObjectIdField()
        scenario = ObjectIdField()
        well = ObjectIdField()

        index = IntField()

        createdAt = DateTimeField(default=datetime.utcnow().isoformat())
        updatedAt = DateTimeField(default=datetime.utcnow().isoformat())

        meta = {'collection': 'scenario-well-assignments', 'strict': False, 'db_alias': db_alias}

    return ScenarioWellAssignment
