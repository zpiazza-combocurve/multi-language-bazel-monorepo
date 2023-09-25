from typing import Optional
from datetime import datetime, timedelta
import json
from google.cloud import scheduler_v1


class SchedulerClient(object):
    def __init__(self, project, location, local=False):
        if local:
            from .local_scheduler import LocalSchedulerClient
            self.client = LocalSchedulerClient()
        else:
            self.client = scheduler_v1.CloudSchedulerClient()
        self.project = project
        self.location = location
        self.parent = f'projects/{self.project}/locations/{self.location}'

    def get_job_name(self, job_id):
        return f'{self.parent}/jobs/{job_id}'

    def create_job(self, job):
        '''
            Usage:
            client.create_job({
                'name': client.get_job_name(job_id),
                'http_target': http_target,
                'schedule': schedule,
                'retry_config': retry_config
            })
        '''
        return self.client.create_job(request={'parent': self.parent, 'job': job})

    def update_job(self, job, paths):
        return self.client.update_job(request={'job': job, 'update_mask': {'paths': paths}})

    def delete_job(self, name):
        return self.client.delete_job(request={'name': name})

    def run_job(self, name):
        return self.client.run_job(request={'name': name})

    def build_http_job(self,
                       job_id,
                       schedule,
                       url,
                       http_method='POST',
                       body: Optional[dict] = None,
                       headers: Optional[dict] = None,
                       retry_config=None,
                       time_zone='UTC'):
        body = body or {}
        headers = headers or {}

        retry_config = retry_config or {'retry_count': 3}

        return {
            'name': self.get_job_name(job_id),
            'http_target': {
                'uri': url,
                'http_method': http_method,
                'body': bytes(json.dumps(body), 'utf-8'),
                'headers': {
                    **headers,
                    'Content-Type': 'application/json',
                },
            },
            'retry_config': retry_config,
            'schedule': schedule,
            'time_zone': time_zone,
            'attempt_deadline': '480s'
        }

    def trigger_http_job_now(self,
                             job_id,
                             url,
                             http_method='POST',
                             body: Optional[dict] = None,
                             headers: Optional[dict] = None,
                             retry_config=None):
        yesterday = datetime.utcnow() - timedelta(days=1)
        schedule = f'0 0 {yesterday.day} {yesterday.month} *'
        job = self.build_http_job(job_id, schedule, url, http_method, body, headers, retry_config, 'UTC')
        self.create_job(job)
        self.run_job(self.get_job_name(job_id))
