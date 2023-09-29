ARG PROJECT_ID=test-combocurve
ARG PYTHON_VERSION=3.9
FROM gcr.io/$PROJECT_ID/python-poetry:$PYTHON_VERSION

RUN apt-get update && \
    apt-get install -y locales && \
    echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen && \
    locale-gen

COPY ./cloud_runs/econ_export/pyproject.toml ./cloud_runs/econ_export/poetry.lock ./

RUN poetry config virtualenvs.create false
RUN poetry install --no-interaction --no-dev --no-root && \
	# The following is needed because lock files written locally can pull setuptools versions incompatible w/
	# our architecture.
	poetry run pip install setuptools --upgrade

COPY . ./

CMD ["uvicorn", "cloud_runs.econ_export.api.econ_export_api:app", "--host", "0.0.0.0", "--port", "8080"]
