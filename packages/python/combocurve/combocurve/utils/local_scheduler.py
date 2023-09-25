from requests import request


class LocalSchedulerClient(object):
    '''
        A replica of the Cloud Scheduler client that uses our scheduler server
        This module should only be used in development
        API docs: https://googleapis.dev/python/cloudscheduler/latest/gapic/v1/api.html
    '''
    def __init__(self, options={}):
        host = options.get('host', 'localhost')
        port = options.get('port', 5006)
        protocol = options.get('protocol', 'http')
        debug = options.get('debug', False)

        self.server_url = f'{protocol}://{host}:{port}/api/v1'
        self.debug = debug

    def _log_request(self, method, url):
        if self.debug:
            print('${} ${}'.format(method.upper(), url))  # noqa: T001

    def _request(self, method, path, **kwargs):
        url = f'{self.server_url}/{path}'
        self._log_request(method, url)
        response = request(method=method, url=url, **kwargs)
        return response.json()

    def location_path(self, project, location):
        return f'projects/{project}/locations/{location}'

    def job_path(self, project, location, job_id):
        location_path = self.location_path(project, location)
        return f'{location_path}/jobs/{job_id}'

    def create_job(self, parent, job):
        parent = request['parent']
        return self._request('post', f'{parent}/jobs', json=job)

    def update_job(self, job, options):
        name = job['name']
        paths = options['paths']
        update = {p: job[p] for p in paths}
        return self._request('patch', name, json=update)

    def delete_job(self, name):
        return self._request('delete', name)

    def get_job(self):
        raise Exception('Not Implemented')

    def pause_job(self):
        raise Exception('Not Implemented')

    def resume_job(self):
        raise Exception('Not Implemented')
