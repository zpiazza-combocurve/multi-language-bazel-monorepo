from api.cc_to_cc.assumption_import import AssumptionImport
from api.cc_to_cc.assumption_export import AssumptionExport
from api.cc_to_cc.schedule_import import ScheduleImport


class CCToCCService(AssumptionImport, AssumptionExport, ScheduleImport):
    def __init__(self, context):
        self.context = context

    def cc_to_cc_import_upsert(self, query, body):
        return self.context.cc_to_cc_imports_model.objects(**query).update_one(
            upsert=True,
            full_result=True,
            **{
                **body,
                **query
            },
        )

    def delete_cc_to_cc_import(self, _id):
        return self.context.cc_to_cc_imports_model.objects(id=_id).delete()
