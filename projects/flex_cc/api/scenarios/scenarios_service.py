from typing import List, Mapping

from .scenario_exporter import ScenarioTableExporter


class ScenariosService:
    def __init__(self, context):
        self.context = context

    def export_with_lookup(
        self,
        scenario_id: str,
        assignment_ids: List[str],
        assumption_keys_mapping: Mapping[str, str],
        well_headers_mapping: Mapping[str, str],
        user_id: str,
        project: str,
        notification_id: str,
    ):
        exporter = ScenarioTableExporter(self.context, scenario_id, assignment_ids, assumption_keys_mapping,
                                         well_headers_mapping, user_id, project, notification_id)
        return exporter.export_with_lookup()
