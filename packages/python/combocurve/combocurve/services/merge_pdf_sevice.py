from io import BytesIO

from PyPDF2 import PdfFileMerger

_PDF_CONTENT_TYPE = 'application/pdf'

_WRAP_UP_PERCENT = 15


class MergePdfService:

    def __init__(self, context):
        self.context = context

    def merge(self, batches_prefix, readable_name, gcp_name, user_id, project_id, delete_batches=True, progress_notifier=None):
        try:
            return self._merge(batches_prefix, gcp_name, readable_name, user_id, project_id, progress_notifier)
        finally:
            self.delete_batches(batches_prefix)

    def _merge(self, batches_prefix, gcp_name, file_name, user_id, project_id, progress_notifier=None):
        batch_files, files_count = self.context.storage_service.read_all_to_open_files_with_count(
            self.context.batch_bucket, batches_prefix, as_text=False)

        with BytesIO() as final_file:
            merger = PdfFileMerger()
            for i, f in enumerate(batch_files):
                merger.append(f)
                if progress_notifier:
                    progress_notifier.notify((100 - _WRAP_UP_PERCENT) * i / files_count)

            merger.write(final_file)
            if progress_notifier:
                progress_notifier.notify(98)

            self.context.storage_service.write_from_file(self.context.files_bucket, gcp_name, final_file,
                                                         _PDF_CONTENT_TYPE)

        for f in batch_files:
            f.close()

        file_info = {'gcpName': gcp_name, 'name': file_name, 'type': _PDF_CONTENT_TYPE}
        self.context.file_service.create_file({**file_info, 'user': user_id, 'project': project_id})

        if progress_notifier:
            progress_notifier.notify(100)

        return file_info

    def delete_batches(self, batches_prefix):
        self.context.storage_service.bulk_delete(self.context.batch_bucket, batches_prefix)
