import json
from flask import Blueprint, request, Response
from combocurve.services.type_curve.type_curve_service import TypeCurveService
from combocurve.shared.constants import PHASES

from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context
from combocurve.utils.logging import add_to_logging_metadata

tc_init_api = Blueprint('tc_init_api', __name__)


@tc_init_api.route('/init-tc', methods=['POST'])
@complete_routing(formatter=lambda ret: Response(response=json.dumps(ret), status=200, mimetype="application/json"))
@with_api_context
def run(**kwargs):
    context = kwargs['context']
    req = request.json

    tc_data = {
        'tc_id': req.get('tc_id'),
        'para_dicts': {phase: req[phase].get('init_para_dict')
                       for phase in req.keys() if phase in PHASES},
    }
    add_to_logging_metadata({'type_curve': tc_data})

    type_curve_service: TypeCurveService = context.type_curve_service
    calculated_background_data = type_curve_service.tc_fit_init(req)

    return calculated_background_data
