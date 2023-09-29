
# Make sure to keep the line before this line blank.
# The next line will be injected dynamically before building this image.
# ARG PROJECT_ID=<project_id>

ARG PYTHON_VERSION=3.9
FROM gcr.io/$PROJECT_ID/python-poetry-flex-cc:$PYTHON_VERSION

COPY pyproject.toml poetry.lock ./

RUN poetry install --no-interaction --no-dev && \
    # The following is needed because lock files written locally can pull setuptools versions incompatible w/
    # our architecture.
    poetry run pip install setuptools --upgrade

COPY . ./

CMD poetry run poe start
