from typing import Optional

from api.archive.project_archiver import ProjectArchiver
from api.archive.project_restorer import ProjectRestorer
from api.shareable_codes.import_progress_event_receiver import ImportProgressEventReceiver
from combocurve.shared.db_context import DbContext
from combocurve.utils.db_info import DbInfo
from combocurve.shared.gcp_buckets import GCPBuckets


class ShareableCodesService:
    """
    Copies a project from origin_db_context to context

    Uses ProjectArchiver and ProjectRestorer
    """
    def __init__(self, context, context_class):
        self.context = context
        self.context_class = context_class

    def import_project(self, origin_db_info: DbInfo, origin_gcp_buckets: GCPBuckets, project_id: str, name: str,
                       user_id: str, notification_id: str, archive_version: Optional[str],
                       archived_project_id: Optional[str]):
        origin_db_context = DbContext(origin_db_info)

        import_progress_event_receiver = ImportProgressEventReceiver(self.context, user_id, notification_id)

        archiver = None
        restorer = None

        try:
            if not archived_project_id:
                archiver = ProjectArchiver(origin_db_context, origin_gcp_buckets, self.context, project_id, user_id,
                                           import_progress_event_receiver, archive_version)

                archiver.archive()

                archived_project_id = str(archiver.archived_project.id)

            restorer = ProjectRestorer(origin_db_context, origin_gcp_buckets, self.context, archived_project_id,
                                       user_id, import_progress_event_receiver, archive_version, name)
            restorer.restore()

            import_progress_event_receiver.finish(restorer.new_project_name)
        finally:
            if not archived_project_id:
                if archiver.archived_project:
                    archiver.archived_project.delete()

                if archiver:
                    archiver.cleanup()

            if restorer:
                restorer.cleanup()
