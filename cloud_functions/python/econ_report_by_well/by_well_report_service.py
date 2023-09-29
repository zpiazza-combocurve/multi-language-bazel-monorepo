import re
from datetime import datetime

import requests
from combocurve.shared.config import MERGE_PDF_CLOUD_RUN_URL

from combocurve.shared.google_auth import get_auth_headers
from combocurve.shared.econ_report.econ_report import build_econ_report_by_well

INVALID_JOB_ID_CHARS_RE = re.compile(r'[^a-zA-Z\d_-]')


class ByWellReportService:
    def __init__(self, context):
        self.context = context

    def _get_batch_prefix(self, econ_run_id):
        return f'econ-report-by-well-{econ_run_id}-'

    def generate_batch_report(self, econ_run_id, wells, batch_index, bfit_report, afit_report, time_zone=None):
        file_data = build_econ_report_by_well(self.context, econ_run_id, wells, bfit_report, afit_report, time_zone)

        file_name = f'{self._get_batch_prefix(econ_run_id)}{batch_index}.pdf'
        self.context.storage_service.write_from_string(self.context.batch_bucket, file_name, file_data,
                                                       'application/pdf')

        return 'ok'

    def _trigger_merge_cloud_run(self, batches_prefix, file_name, gcp_name, user_id, notification_id, project_id):
        auth_headers = get_auth_headers(MERGE_PDF_CLOUD_RUN_URL)
        body = {
            'batchesPrefix': batches_prefix,
            'fileName': file_name,
            'gcpName': gcp_name,
            'userId': str(user_id),
            'deleteBatches': True,
            'notificationId': notification_id,
			'projectId': str(project_id),
        }
        headers = {**self.context.headers, **auth_headers}
        if __debug__:
            try:
                requests.post(MERGE_PDF_CLOUD_RUN_URL, json=body, headers=headers, timeout=0.1)
            except requests.exceptions.ReadTimeout:
                pass
        else:
            job_id = INVALID_JOB_ID_CHARS_RE.sub('_', f'merge-pdf-{gcp_name}')
            body['jobId'] = job_id
            self.context.scheduler_client.trigger_http_job_now(job_id,
                                                               MERGE_PDF_CLOUD_RUN_URL,
                                                               body=body,
                                                               headers=headers)

    def merge_batches(self, econ_run_id, file_name, user_id, notification_id, project_id):
        prefix = self._get_batch_prefix(econ_run_id)
        readable_name = f'{file_name}.pdf'
        gcp_name = f'{econ_run_id}-econ-report-by-well-{datetime.utcnow().isoformat()}.pdf'

        self._trigger_merge_cloud_run(prefix, readable_name, gcp_name, user_id, notification_id, project_id)

        return 'Queued for report file generation'
