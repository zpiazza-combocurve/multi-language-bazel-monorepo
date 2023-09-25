from mongoengine import (Document, DictField, BooleanField, ObjectIdField, StringField, DateTimeField, IntField,
                         ListField)


def get_econ_run_data_model(db_name):
    class EconRunData(Document):
        data = DictField()
        oneLinerData = DictField()
        sum = BooleanField()
        error = StringField()
        expireAt = DateTimeField()
        well = ObjectIdField()
        run = ObjectIdField()
        user = ObjectIdField()
        project = ObjectIdField()
        scenario = ObjectIdField()

        meta = {'collection': 'econ-runs-datas', 'strict': False, 'db_alias': db_name}

    return EconRunData


def get_econ_run_model(db_name):
    class EconRun(Document):
        errs = IntField(default=0)
        expireAt = DateTimeField()
        files = ListField(DictField())
        project = ObjectIdField()
        runDate = DateTimeField()
        scenario = ObjectIdField()
        status = StringField(choices=['queued', 'pending', 'complete', 'failed'])
        user = ObjectIdField()
        wells = ListField(ObjectIdField())
        outputGroups = ObjectIdField()
        outputParams = ObjectIdField()

        meta = {'collection': 'econ-runs', 'strict': False, 'db_alias': db_name}

    return EconRun
