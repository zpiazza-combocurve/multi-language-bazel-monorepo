ARG PROJECT_ID=test-combocurve
ARG PYTHON_VERSION=3.9
FROM gcr.io/$PROJECT_ID/python-poetry-flex-cc:$PYTHON_VERSION

### START base image definition

# The following packages are required to build some Python packages like numpy, scipy, etc.
# Google's App Engine default image for Python installs a lot more.
#
# Reference:
#   https://github.com/GoogleCloudPlatform/python-runtime/blob/master/runtime-image/resources/apt-packages.txt
#   https://stackoverflow.com/a/63979755/5003820
#
RUN apt-get update && \
    apt-get install -y \
    openssh-client

# Install poetry following their recommended installation instructions
# Reference: https://python-poetry.org/docs/master/#installing-with-the-official-installer
# RUN curl -sSL https://install.python-poetry.org | python3 -  --version 1.1.15

# # Poetry binary is in this folder, it needs to be added to the PATH
# ENV PATH="/root/.local/bin:${PATH}"

# Setup locale. This prevents Python 3 IO encoding issues.
# Reference: https://github.com/GoogleCloudPlatform/python-runtime/blob/master/runtime-image/Dockerfile.in
ENV LANG C.UTF-8
# Make stdout/stderr unbuffered. This prevents delay between output and cloud logging collection.
ENV PYTHONUNBUFFERED 1

# Setup the app working directory
ENV APP_HOME /app
WORKDIR $APP_HOME

### END base image definition
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

