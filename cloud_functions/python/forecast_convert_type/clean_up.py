import datetime
from bson import ObjectId


def clean_up(context, task, success):
    task_body = task['body']

    new_forecast_id = ObjectId(task_body['newForecastIdStr'])
    new_forecast_name = task_body['newForecastName']
    current_forecast_id = ObjectId(task_body['currentForecastIdStr'])
    current_forecast_type = task_body['currentForecastType']
    new_forecast_type = {'deterministic': 'probabilistic', 'probabilistic': 'deterministic'}.get(current_forecast_type)

    current_forecast_document = context.forecasts_collection.find_one({'_id': current_forecast_id})
    cur_time = datetime.datetime.utcnow()

    new_forecast_document = {
        **current_forecast_document,
        '_id': new_forecast_id,
        'name': new_forecast_name,
        'user': task['user'],
        'type': new_forecast_type,
        'running': False,
        'createdAt': cur_time,
        'updatedAt': cur_time,
        'runDate': cur_time,
    }
    context.forecasts_collection.insert_one(new_forecast_document)
    context.forecasts_collection.update_one({'_id': current_forecast_id}, {'$set': {
        'runDate': cur_time,
    }})
    return 'Forecast type conversion has been completed'
