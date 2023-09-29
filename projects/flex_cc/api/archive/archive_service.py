from api.archive.archive_progress_event_receiver import ArchiveProgressEventReceiver
from api.archive.project_archiver import ProjectArchiver
from api.archive.project_restorer import ProjectRestorer
from api.archive.restore_progress_event_receiver import RestoreProgressEventReceiver
from combocurve.shared.db_context import DbContext
from combocurve.shared.gcp_buckets import GCPBuckets
from typing import Optional


class ArchiveService:
    def __init__(self, context):
        self.context = context

    def _get_buckets_from_headers(self) -> GCPBuckets:
        return {
            'file_storage_bucket': self.context.headers['inpt-file-storage-bucket'],
            'batch_storage_bucket': self.context.headers['inpt-batch-storage-bucket'],
            'econ_storage_bucket': self.context.headers['inpt-econ-storage-bucket'],
            'archive_storage_bucket': self.context.headers['inpt-archive-storage-bucket']
        }

    def archive_project(self,
                        project_id: str,
                        user_id: str,
                        notification_id: str,
                        version: Optional[str],
                        time_zone='UTC'):
        archive_progress_event_receiver = ArchiveProgressEventReceiver(self.context, user_id, notification_id)
        db_context = DbContext(self.context.db_info)
        archiver = ProjectArchiver(db_context, self._get_buckets_from_headers(), self.context, project_id, user_id,
                                   archive_progress_event_receiver, version, time_zone)
        return archiver.archive()

    def restore_project(self, archived_project_id: str, user_id: str, notification_id: str, restore_to_version: str):
        restore_progress_event_receiver = RestoreProgressEventReceiver(self.context, user_id, notification_id)
        db_context = DbContext(self.context.db_info)
        restorer = ProjectRestorer(db_context, self._get_buckets_from_headers(), self.context, archived_project_id,
                                   user_id, restore_progress_event_receiver, restore_to_version)
        return restorer.restore()
