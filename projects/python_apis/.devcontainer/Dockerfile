ARG PROJECT_ID=test-combocurve
ARG PYTHON_VERSION=3.9
FROM gcr.io/$PROJECT_ID/python-poetry:$PYTHON_VERSION

RUN apt-get update && \
    apt-get install -y \
    openssh-client

# ARGs need to be redeclared after FROM to make them available in the build stage
ARG PYTHON_VERSION

COPY pyproject.toml poetry.lock ./
RUN --mount=type=cache,target=/root/.cache/poetry mkdir /root/poetry-venv && \
    poetry config cache-dir /root/.cache/poetry && \
    poetry config virtualenvs.path /root/poetry-venv && \
    poetry config virtualenvs.in-project false && \
    poetry config virtualenvs.create false && \
    poetry env use $(which python$PYTHON_VERSION) && \
    poetry install --no-interaction && \
    poetry run pip install debugpy

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE 1

