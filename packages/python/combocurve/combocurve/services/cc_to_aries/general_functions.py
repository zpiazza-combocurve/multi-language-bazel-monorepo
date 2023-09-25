import datetime


def in_formats(date_str, formats):
    for f in formats:
        try:
            parsed = datetime.datetime.strptime(date_str, f).date()
            return parsed
        except Exception:
            pass


ISO_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"


## parse date string with ISO format and 'YYYY-mm-dd'
def parse_date_str(date_str):
    return in_formats(date_str, [ISO_FORMAT, '%Y-%m-%d', '%m/%d/%Y'])


# get date as format of datetime.date
def get_py_date(date_input):
    if type(date_input) == datetime.date:
        return date_input
    if type(date_input) == datetime.datetime:
        return date_input.date()
    if type(date_input) == str:
        return parse_date_str(date_input)
    raise Exception('Can not handle this date format')


'''
    production data helpers for economics
'''


def has_phase_production(production_data, phase):
    return production_data[phase] is not None


def has_production(production_data):
    return (has_phase_production(production_data, 'oil') or has_phase_production(production_data, 'gas')
            or has_phase_production(production_data, 'water'))


def create_empty_production():
    return {'oil': None, 'gas': None, 'water': None}


'''
    forecast data helpers for economics
'''


def has_phase_forecast(forecast_data, phase):
    return forecast_data[phase] is not None


def has_forecast(forecast_data):
    return (has_phase_forecast(forecast_data, 'oil') or has_phase_forecast(forecast_data, 'gas')
            or has_phase_forecast(forecast_data, 'water'))


def create_empty_forecast():
    return {'oil': None, 'gas': None, 'water': None}


def index_to_py_date(index_of_date):
    return datetime.date(1900, 1, 1) + datetime.timedelta(int(index_of_date))


def truncate_inpt_id(inpt_id):
    if type(inpt_id) == str:
        return inpt_id.replace('INPT.', '').replace('INPT', '')
    else:
        return inpt_id
