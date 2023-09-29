# https://github.com/googleapis/google-cloud-python/issues/9192#issuecomment-530036509 Required for compatibility
# between google libs and gevent. MUST HAPPEN BEFORE ANYTHING LOADS
import grpc._cython.cygrpc  # noqa: E402

grpc._cython.cygrpc.init_grpc_gevent()

import os  # noqa: E402

from cloud_runs.external_api_import.main import handle as handle_external_api_import  # noqa: E402
from flask import Flask, request  # noqa: E402

app = Flask(__name__)


@app.post('/')
def external_api_import():
    return handle_external_api_import(request)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
