from google.cloud import storage, bigquery

from combocurve.shared.env import GCP_REGIONAL_PROJECT_ID, REGION
from combocurve.utils.cloud_tasks import TasksClient


class GoogleServices:
    def __init__(self, file_bucket_name, batch_bucket_name):
        self.storage_client = storage.Client()
        self.storage_bucket = self.storage_client.get_bucket(file_bucket_name)
        self.storage_batches_bucket = self.storage_client.get_bucket(batch_bucket_name)

        self.bigquery_client = bigquery.Client()

        self.tasks_client = TasksClient(GCP_REGIONAL_PROJECT_ID, REGION)
