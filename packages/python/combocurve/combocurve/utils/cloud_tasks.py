from google.api_core.exceptions import GoogleAPICallError, RetryError
from google.cloud import tasks_v2


class TasksClient(object):
    # https://googleapis.dev/python/cloudtasks/latest/gapic/v2/api.html
    def __init__(self, project, region):
        self.project = project
        self.region = region
        self.client = tasks_v2.CloudTasksClient()

    def _get_queue_path(self, queue_id):
        return f'projects/{self.project}/locations/{self.region}/queues/{queue_id}'

    def add_task(self, queue, url, method='GET', payload=None, headers=None, retry=20, json=True):
        queue_path = self._get_queue_path(queue)

        request = {'http_method': method, 'url': url}
        task = {'http_request': request}

        if payload is not None:
            request['body'] = payload.encode()

        if (headers is not None):
            request['headers'] = dict(headers)
        if json:
            try:
                request['headers']['Content-Type'] = 'application/json'
            except KeyError:
                request['headers'] = {'Content-Type': 'application/json'}

        task_exception = None
        while (retry > 0):
            try:
                response = self.client.create_task(request={'parent': queue_path, 'task': task})
            except (GoogleAPICallError, RetryError) as e:
                retry -= 1
                task_exception = e
            else:
                return response

        raise task_exception

    def purge_queue(self, queue):
        queue_path = self._get_queue_path(queue)
        return self.client.purge_queue(request={'name': queue_path})

    def count_tasks(self, queue):
        queue_path = self._get_queue_path(queue)
        response = self.client.list_tasks(request={'parent': queue_path})
        count = 0
        for page in response.pages:
            count += len(page.tasks)
        return count
