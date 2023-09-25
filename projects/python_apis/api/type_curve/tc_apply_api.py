## apply typecurve
from flask import Blueprint, request
from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context
from combocurve.utils.logging import add_to_logging_metadata

tc_apply_api = Blueprint('tc_apply_api', __name__)


class MissingParamsError(Exception):
    expected = True


@tc_apply_api.route('/tc-apply', methods=['POST'])
@complete_routing
@with_api_context
def tc_apply(**kwargs):
    context = kwargs['context']
    params = request.json
    # {forecast_id,
    # phase,
    # well_ids,
    # tc_id,
    # apply_normalization,
    # fpd_source,
    # scheduling_id,
    # fixed_date,
    # series,
    # riskFactor
    # lookup_table_id_str}
    add_to_logging_metadata({'type_curve': params})

    return context.type_curve_apply_service.apply_tc(params)


@tc_apply_api.route('/tc-reapply', methods=['POST'])
@complete_routing
@with_api_context
def tc_reapply(**kwargs):
    context = kwargs['context']
    params = request.json
    add_to_logging_metadata({'reapply_tc': params})

    return context.type_curve_apply_service.reapply_tc(params)


@tc_apply_api.route('/get-tc-apply-info', methods=['POST'])
@complete_routing
@with_api_context
def get_tc_apply_info(**kwargs):
    context = kwargs['context']
    params = request.json
    add_to_logging_metadata({'get_tc_apply_info': params})
    return context.type_curve_apply_service.generte_tc_application_info(params)
