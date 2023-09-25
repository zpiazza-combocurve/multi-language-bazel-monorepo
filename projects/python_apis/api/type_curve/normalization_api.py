from typing import TYPE_CHECKING, Any
from flask import Blueprint, request
from api.decorators import with_api_context
from combocurve.utils.routes import complete_routing
from combocurve.science.type_curve.skeleton_normalize import linear, one_to_one, power_law
from combocurve.science.type_curve.skeleton_normalize_two_factor import twoFactor
from combocurve.utils.logging import add_to_logging_metadata
from collections import defaultdict

if TYPE_CHECKING:
    from api.context import APIContext

normalization_api = Blueprint('normalizationApi', __name__)


class MissingParamsError(Exception):
    expected = True


@normalization_api.route('/tc_fit', methods=['POST'])
@complete_routing
def tc_fit():
    params = request.json

    if params is None:
        raise MissingParamsError
    try:
        input_dict = {
            'mask_fit': params['mask_fit'],
            'normalize_header': params['normalize_header'],
            'x_chain': params['x_chain'],
            'y_chain': params['y_chain']
        }
    except Exception:
        raise MissingParamsError

    try:
        normalization_type = params['normalization_type']
        if normalization_type == 'linear':
            norm = linear()
        else:
            norm = power_law()
        output = norm.body(input_dict, 'fit')
        return output
    except Exception as e:
        add_to_logging_metadata({
            'tc_normalize_fit': {
                'tc_id': params['tc_id'],
                'phase': params['phase'],
                'mask_fit': params['mask_fit'],
                'x_chain': params['x_chain'],
                'y_chain': params['y_chain'],
                'normalization_type': params.get('normalization_type')
            }
        })
        raise e


@normalization_api.route('/tc_normalize', methods=['POST'])
@complete_routing
def tc_normalize():
    params = request.json
    if params is None:
        raise MissingParamsError
    try:
        input_dict = defaultdict(dict)

        for phase in params:
            normalization_type = params[phase]['normalization_type']  ## '1_to_1', 'linear'
            if normalization_type == "1_to_1":
                input_dict[phase] = {  ## float if 'linear', None if '1_to_1'
                    'x_chain': params[phase]['x_chain'],
                    'y_chain': params[phase]['y_chain'],
                    'normalize_header': params[phase]['normalize_header'],
                    'target': params[phase]['target'],
                    'mask': params[phase]['mask_normalize'],
                }
            elif normalization_type == "linear":
                input_dict[phase] = {
                    'slope': params[phase]['slope'],
                    'x_chain': params[phase]['x_chain'],
                    'y_chain': params[phase]['y_chain'],
                    'normalize_header': params[phase]['normalize_header'],
                    'target': params[phase]['target'],
                    'mask': params[phase]['mask_normalize']
                }
            else:
                input_dict[phase] = {
                    'a': params[phase].get('modified_beta')[0],
                    'b': params[phase].get('modified_beta')[1],
                    'x_chain': params[phase]['x_chain'],
                    'y_chain': params[phase]['y_chain'],
                    'normalize_header': params[phase]['normalize_header'],
                    'target': params[phase]['target'],
                    'mask': params[phase]['mask_normalize']
                }
    except Exception:
        raise MissingParamsError

    norm_funcs = {'1_to_1': one_to_one(), 'linear': linear(), 'power_law_fit': power_law()}

    try:
        output = {}
        for phase in input_dict:
            normalization_type = params[phase]['normalization_type']
            output[phase] = norm_funcs[normalization_type].body(input_dict[phase], 'apply')

        return output
    except Exception as e:
        add_to_logging_metadata({'tc_normalize': params})
        raise e


@normalization_api.route('/tc_normalize_two_factor', methods=['POST'])
@complete_routing
@with_api_context
def tc_normalize_two_factor(**kwargs):
    context: APIContext = kwargs['context']
    params: dict[str, Any] = request.json
    if params is None:
        raise MissingParamsError

    try:
        output = {}
        two_factor_normalization = twoFactor(context)
        type_curve_id = params.pop('type_curve_id')
        for phase in params:
            forecasts, productions = context.type_curve_service.get_tc_background_forecasts_and_productions(
                type_curve_id)
            output[phase] = two_factor_normalization.apply_2_factor_normalization(phase=phase,
                                                                                  forecasts=forecasts,
                                                                                  productions=productions,
                                                                                  **params[phase])

        return output
    except Exception as e:
        add_to_logging_metadata({'tc_normalize': params})
        raise e
