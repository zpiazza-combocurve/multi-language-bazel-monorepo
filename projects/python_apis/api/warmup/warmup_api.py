from flask import Blueprint

from combocurve.utils.routes import complete_routing

warmup_api = Blueprint('warmup_api', __name__)


@warmup_api.route('/_ah/warmup', methods=['GET'])
@complete_routing
def run(**kwargs):
    # Any warmup logic can go in here
    return 'Warmup successful'
