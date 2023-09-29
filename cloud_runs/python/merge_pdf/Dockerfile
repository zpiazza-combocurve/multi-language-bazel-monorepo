ARG PROJECT_ID=test-combocurve
ARG PYTHON_VERSION=3.9
FROM gcr.io/$PROJECT_ID/python-poetry:$PYTHON_VERSION

COPY ./cloud_runs/merge_pdf/pyproject.toml ./cloud_runs/merge_pdf/poetry.lock ./

RUN poetry config virtualenvs.create false
RUN poetry install --no-interaction --no-dev && \
    # The following is needed because lock files written locally can pull setuptools versions incompatible w/
    # our architecture.
    poetry run pip install setuptools --upgrade

COPY . ./

# Run the web service on container startup. Here we use the gunicorn
# webserver, with two worker process per cpu because using gevent.
# Timeout is set to 0 to disable the timeouts of the workers to allow Cloud Run to handle instance scaling.
CMD exec gunicorn --bind :$PORT --workers 1 --worker-class gevent --timeout 0 cloud_runs.merge_pdf.app:app
