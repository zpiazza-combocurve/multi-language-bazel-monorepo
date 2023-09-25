from flask import Blueprint, request
from api.decorators import with_api_context

from combocurve.utils.routes import complete_routing
from combocurve.science.type_curve.skeleton_TC_new1 import fit_tc
from combocurve.utils.logging import add_to_logging_metadata

fit_percentile_api = Blueprint('fit_percentile_api', __name__)


@fit_percentile_api.route('/fit-percentile', methods=['POST'])
@complete_routing
@with_api_context
def generate_data(**kwargs):
    context = kwargs['context']
    data = request.json
    try:
        obj = fit_tc(context)
        ret = obj.body(data)
        return ret
    except Exception as e:
        tc_data = {
            'tcId': data.get('tcId'),
            'phases': data.get('phases'),
            'para_dicts': {p: data.get(p, {}).get('TC_para_dict')
                           for p in ['oil', 'gas', 'water']},
            'fit_paras': {p: data.get(p, {}).get('fit_para')
                          for p in ['oil', 'gas', 'water']},
        }
        add_to_logging_metadata({'tc_fit_percentile': tc_data})
        raise e
