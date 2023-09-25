from flask import Blueprint, request

from combocurve.utils.routes import complete_routing
from combocurve.science.cc_to_aries.forecast_cc_to_aries import forecast_conv, get_forecast_data
from api.decorators import with_api_context

forecast_conv_api = Blueprint('forecast_conv', __name__)


@forecast_conv_api.route('/forecast_conv', methods=['POST'])
@complete_routing
@with_api_context
def handler(**kwargs):
    context = kwargs['context']
    db = context.db
    params = request.json

    forecast_id = params['forecast_id']
    well_id = params['well_id']
    if 'pct_key' in params.keys():
        pct_key = params['pct_key']
    else:
        pct_key = 'P50'
    #
    forecast_data = get_forecast_data(forecast_id, well_id, db)
    #
    aries_forecast = forecast_conv(forecast_data, pct_key)
    return {'output': aries_forecast}
