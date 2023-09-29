import datetime
from combocurve.shared.str_helpers import pluralize


def clean_up(context, forecast_id, well_count, success):
    context.forecasts_collection.update_one({'_id': forecast_id}, {'$set': {
        'runDate': datetime.datetime.utcnow(),
    }})
    return f'Ran automatic forecast for {pluralize(well_count, "well", "wells")}'
    
