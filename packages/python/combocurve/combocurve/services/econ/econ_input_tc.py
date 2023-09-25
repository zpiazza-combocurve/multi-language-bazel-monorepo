from bson.objectid import ObjectId
import numpy as np

from combocurve.utils.assumption_fields import ASSUMPTION_FIELDS
from combocurve.science.econ.econ_use_forecast.adjust_forecast import adjust_forecast_start


class MissingParamsError(Exception):
    expected = True


class InvalidInputError(Exception):
    expected = True


def one(iterable):
    try:
        return list(iterable)[0]
    except IndexError:
        return None


def has_value(object, key):
    return key in object and not object[key] is None


IGNORED_ASSUMPTIONS = {'reserves_category'}


def get_default_columns(column_fields):
    relevant_keys = list(filter(lambda key: 'category' in column_fields[key], column_fields.keys()))
    return list(map(lambda key: {'key': key, 'selected_options': column_fields[key]['default_options']}, relevant_keys))


def get_assumptions_input(context, AssumptionModel, assignment):
    assumption_ids = set()
    for key in [*ASSUMPTION_FIELDS, 'general_options']:
        if (key not in IGNORED_ASSUMPTIONS):
            if has_value(assignment, key):
                assumption_ids.add(assignment[key])
    projection = {'_id': False, 'assumptionKey': True, 'econ_function': True, 'options': True}
    assumptions = list(AssumptionModel.find({'_id': {'$in': list(assumption_ids)}}, projection=projection))
    context.scenario_page_query_service.fetch_escalation_depreciation(assumptions)

    assumptions_by_key = {}
    for ass in assumptions:
        assumptions_by_key[ass['assumptionKey']] = ass['econ_function']
    return assumptions_by_key


def get_forecast_data(type_curve, headers, forecast_p_series):
    fits = type_curve.get('fits')

    if len(fits) == 0:
        raise InvalidInputError('Type Curve needs to be fitted before running economics')
    try:
        fpd = headers['first_prod_date']
    except KeyError:
        raise InvalidInputError('Missing FPD')

    by_phase = {
        'oil': None,
        'gas': None,
        'water': None,
    }

    all_normalize = False

    for fit in fits:
        fit_type = fit['fitType']
        phase = fit['phase']
        normalize = fit.get('normalize', False)

        all_normalize = normalize or normalize

        if fit_type == 'rate':
            by_phase[phase] = {
                'P_dict': {
                    'best': fit['P_dict'][forecast_p_series]
                },
                'forecastType': fit_type,
                'forecasted': True,
            }
        elif fit_type == 'ratio':
            ratio_dict = fit['ratio_P_dict'][forecast_p_series]
            ratio_dict['basePhase'] = type_curve.get('basePhase', None)
            by_phase[phase] = {
                'ratio': fit['ratio_P_dict'][forecast_p_series],
                'forecastType': fit_type,
                'forecasted': True,
            }
        else:
            continue

    forecast_start_index = (np.datetime64(fpd, 'D') - np.datetime64('1900-01-01')).astype(int)
    by_phase = adjust_forecast_start(by_phase, forecast_start_index)

    return by_phase, all_normalize


def get_econ_input_tc(context, params):
    '''
        Generates the input for the econonic function to run on type curves.
        It differs from the single_econ input mainly in that here there's no scenario or well, a type_curve_id is
        accepted as input instead plus p_series and some required well headers.
    '''
    try:
        type_curve_id = params['type_curve_id']
        columns = params['columns']  # will return as is
        column_fields = params['columnFields']

        headers = params['headers']
        well_calcs = params['well_calcs']
        forecast_p_series = params['forecast_p_series']
    except Exception:
        raise MissingParamsError

    db = context.db
    TypeCurveModel = db['type-curves']
    AssumptionModel = db['assumptions']

    type_curve = one(
        TypeCurveModel.aggregate([{
            '$match': {
                '_id': ObjectId(type_curve_id),
            }
        }, {
            '$project': {
                'assumptions': True,
                'basePhase': True,
                'fits': {
                    '$objectToArray': '$fits'
                },
                'project': True,
            },
        }, {
            '$lookup': {
                'from': 'type-curve-fits',
                'localField': 'fits.v',
                'foreignField': '_id',
                'as': 'fits',
            },
        }]))

    assumptions = get_assumptions_input(context, AssumptionModel=AssumptionModel, assignment=type_curve['assumptions'])
    forecast_data, apply_normalization = get_forecast_data(type_curve, headers, forecast_p_series)

    return {
        'assumptions': assumptions,
        'columns_fields': column_fields,
        'columns': columns if columns and len(columns) else get_default_columns(column_fields),
        'p_series': forecast_p_series,
        'forecast_data': forecast_data,
        'production_data': {
            'oil': None,
            'gas': None,
            'water': None,
        },
        'well': headers,
        'well_calcs': well_calcs,
        'forecast_name': type_curve.get('name'),
        'oil_tc_risking': None,
        'gas_tc_risking': None,
        'water_tc_risking': None,
        'apply_normalization': apply_normalization,
        'network': None,
        'ghg': None,
    }
