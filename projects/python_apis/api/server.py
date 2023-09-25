from combocurve.shared.config import ENVIRONMENT

if ENVIRONMENT == 'development' or __debug__:
    # monkey patch for local server in order to use bq storage API
    from gevent import monkey
    monkey.patch_all()

# https://github.com/googleapis/google-cloud-python/issues/9192#issuecomment-530036509 Required for compatibility
# between google libs and gevent. MUST HAPPEN BEFORE ANYTHING LOADS
import grpc._cython.cygrpc  # noqa: E402

grpc._cython.cygrpc.init_grpc_gevent()

from combocurve.utils.logging import setup_cloud_logging  # noqa: E402
from api.app import create_app  # noqa: E402

if not __debug__:
    setup_cloud_logging(logger_name='python-combocurve-service')

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0')
