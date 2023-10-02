from collections import defaultdict
from copy import copy
import json
from math import isclose
import pytest
import mongomock
import os
from bson import ObjectId
import importlib.resources
from combocurve.services.forecast.deterministic_forecast_service import DeterministicForecastService
from combocurve.services.forecast.forecast_service import ForecastService
from combocurve.services.forecast.update_eur_service import UpdateEurService

from combocurve.services.production.production_service import ProductionService
from combocurve.shared.constants import PHASES
from combocurve.dal.mock_client import MockDAL

DATA_FREQUENCIES = ('daily', 'monthly')
DAILY_FORECAST = '6317a37f10de0b00143c9e1b'
MONTHLY_FORECAST = '6317a37f10de0b00143c9e2a'
DETERMINISTIC_FORECASTS = (DAILY_FORECAST, MONTHLY_FORECAST)
PROBABILISTIC_FORECASTS = ('63500c2fbea41f312d13a065', )
DAILY_WELLS = ('5faad48707b5d658e828052d', )
MONTHLY_WELLS = ('5faad48707b5d658e828052d', '5faade0907b5d658e8361219')
ALL_CUMS_AND_LAST_PRODS = {
    'daily': {
        '5faad48707b5d658e828052d': {
            'last_prod': 44164,
            'oil': 169244,
            'water': 18463,
            'gas': 1365473
        },
    },
    'monthly': {
        '5faad48707b5d658e828052d': {
            'last_prod': 44178,
            'oil': 169244,
            'water': 18463,
            'gas': 1365473
        },
        '5faade0907b5d658e8361219': {
            'last_prod': 42229,
            'oil': 163488,
            'water': 480974,
            'gas': 149607
        }
    }
}


def _create_db():
    collections = {}
    file_dir = os.path.dirname(os.path.realpath('__file__'))
    for data_freq in ('daily', 'monthly'):
        production_collection = mongomock.MongoClient().db.collection
        # data_path = os.path.join(file_dir, f'combocurve/services/forecast/db_test_data/{data_freq}_production.json')
        # with open(data_path, 'r') as f:
        with importlib.resources.open_text('combocurve.services.forecast.db_test_data', f"{data_freq}_production.json") as f:
            prod_data = json.load(f)
        for doc in prod_data:
            doc['_id'] = ObjectId(doc['_id'])
            doc['well'] = ObjectId(doc['well'])
            production_collection.insert_one(doc)
        collections[f'{data_freq}_production_collection'] = production_collection
    deterministic_forecast_collection = mongomock.MongoClient().db.collection
    forecast_collection = mongomock.MongoClient().db.collection
    for forecast_kind in ('daily', 'monthly', 'probabilistic'):
        # data_path = os.path.join(file_dir, f'combocurve/services/forecast/db_test_data/{forecast_kind}_forecast.json')
        with importlib.resources.open_text('combocurve.services.forecast.db_test_data', f"{forecast_kind}_forecast.json") as f:
            forecast_data = json.load(f)
        for doc in forecast_data:
            doc['_id'] = ObjectId(doc['_id'])
            doc['project'] = ObjectId(doc['project'])
            doc['forecast'] = ObjectId(doc['forecast'])
            doc['well'] = ObjectId(doc['well'])
            if forecast_by := doc.get('forecastedBy'):
                doc['forecastedBy'] = ObjectId(forecast_by)
            if reviewed_by := doc.get('reviewedBy'):
                doc['reviewedBy'] = ObjectId(reviewed_by)
            if forecast_kind == 'probabilistic':
                forecast_collection.insert_one(doc)
            else:
                deterministic_forecast_collection.insert_one(doc)
    collections |= {
        'deterministic_forecast_collection': deterministic_forecast_collection,
        'forecast_collection': forecast_collection,
        'forecasts': mongomock.MongoClient().db.collection,
        'wells': mongomock.MongoClient().db.collection
    }
    return collections


class MockContext():
    def __init__(self):
        collections = _create_db()
        db = {}
        self.deterministic_forecast_datas_collection = db['deterministic-forecast-datas'] = collections[
            'deterministic_forecast_collection']
        self.forecast_datas_collection = db['forecast-datas'] = collections['forecast_collection']
        self.monthly_productions_collection = db['monthly-productions'] = collections['monthly_production_collection']
        self.daily_productions_collection = db['daily-productions'] = collections['daily_production_collection']
        self.forecasts_collection = db['forecasts'] = collections['forecasts']
        self.wells_collection = db['wells'] = collections['wells']
        self.db = db
        self.dal = MockDAL(db['monthly-productions'], db['daily-productions'])
        self.production_service = ProductionService(self)
        self.deterministic_forecast_service = DeterministicForecastService(self)
        self.forecast_service = ForecastService(self)


@pytest.mark.unittest
def test_update_eur():
    context = MockContext()
    update_eur_service = UpdateEurService(context)
    _remove_eurs(context)

    update_eur_service.update_eur(DETERMINISTIC_FORECASTS)
    daily_forecast = context.deterministic_forecast_datas_collection.find_one({
        'forecast':
        ObjectId('6317a37f10de0b00143c9e1b'),
        'well':
        ObjectId('5faad48707b5d658e828052d'),
        'phase':
        'oil'
    })
    assert isclose(daily_forecast['P_dict']['best']['eur'], 2102767.0847944096)
    assert isclose(daily_forecast['P_dict']['best']['rur'], 1933523.0847944096)

    monthly_forecast = context.deterministic_forecast_datas_collection.find_one({
        'forecast':
        ObjectId('6317a37f10de0b00143c9e2a'),
        'well':
        ObjectId('5faad48707b5d658e828052d'),
        'phase':
        'oil'
    })
    assert isclose(monthly_forecast['P_dict']['best']['eur'], 208224.80849893612)
    assert isclose(monthly_forecast['P_dict']['best']['rur'], 38980.80849893612)

    update_eur_service.update_eur(PROBABILISTIC_FORECASTS)
    prob_forecast = context.forecast_datas_collection.find_one({'_id': ObjectId('63500c45bea41f312d141eaa')})
    assert prob_forecast['P_dict']['P10']['eur'] is None

    update_eur_service.update_eur(PROBABILISTIC_FORECASTS, is_deterministic=False)
    prob_forecast = context.forecast_datas_collection.find_one({'_id': ObjectId('63500c45bea41f312d141eaa')})
    assert isclose(prob_forecast['P_dict']['P10']['eur'], 2719795.8741728454)
    assert isclose(prob_forecast['P_dict']['best']['rur'], 1087530.118306383)


@pytest.mark.unittest
def test_get_forecast_datas():
    context = MockContext()
    update_eur_service = UpdateEurService(context)

    forecast_datas, cums_and_last_prods = update_eur_service.get_forecast_datas(DETERMINISTIC_FORECASTS, None, PHASES,
                                                                                True)
    assert set(forecast_datas.keys()) == set(DETERMINISTIC_FORECASTS)
    for data_freq, well_set in zip(DATA_FREQUENCIES, (DAILY_WELLS, MONTHLY_WELLS)):
        _check_forecast_datas(forecast_datas, well_set, data_freq)
    assert cums_and_last_prods == ALL_CUMS_AND_LAST_PRODS

    forecast_datas, cums_and_last_prods = update_eur_service.get_forecast_datas(PROBABILISTIC_FORECASTS, None, PHASES,
                                                                                True)
    assert forecast_datas == {PROBABILISTIC_FORECASTS[0]: defaultdict(dict)}
    assert cums_and_last_prods == {'daily': {}, 'monthly': {}}

    forecast_datas, cums_and_last_prods = update_eur_service.get_forecast_datas(PROBABILISTIC_FORECASTS, None, PHASES,
                                                                                False)
    _check_forecast_datas(forecast_datas, MONTHLY_WELLS, 'probabilistic')
    assert cums_and_last_prods == {'daily': {}, 'monthly': ALL_CUMS_AND_LAST_PRODS['monthly']}

    forecast_datas, cums_and_last_prods = update_eur_service.get_forecast_datas((MONTHLY_FORECAST, ), DAILY_WELLS,
                                                                                ('water', ), True)
    _check_forecast_datas(forecast_datas, DAILY_WELLS, 'monthly', ('water', ))
    water_monthly_cum_prods = copy(ALL_CUMS_AND_LAST_PRODS['monthly'])
    water_monthly_cum_prods.pop(MONTHLY_WELLS[1])
    water_monthly_cum_prods[MONTHLY_WELLS[0]].pop('oil')
    water_monthly_cum_prods[MONTHLY_WELLS[0]].pop('gas')
    assert cums_and_last_prods == {'daily': {}, 'monthly': water_monthly_cum_prods}


def _check_forecast_datas(forecast_datas, well_set, data_type, phases=PHASES):
    if data_type == 'daily':
        frequency_data, data_freq = forecast_datas[DAILY_FORECAST], 'daily'
    elif data_type == 'monthly':
        frequency_data, data_freq = forecast_datas[MONTHLY_FORECAST], 'monthly'
    elif data_type == 'probabilistic':
        frequency_data, data_freq = forecast_datas[PROBABILISTIC_FORECASTS[0]], 'monthly'
    else:
        raise ValueError('data_type must be "daily", "monthly", or "probabilistic".')
    assert set(frequency_data.keys()) == set(well_set)
    for well in well_set:
        well_data = frequency_data[well]
        assert set(well_data.keys()) == set(phases)
        for well_phase_data in well_data.values():
            if well_phase_data['forecast_type'] != 'not_forecasted':
                assert well_phase_data['data_freq'] == data_freq
            well_phase_data.pop('forecastSubType', None)
            assert set(well_phase_data.keys()) == {'data_freq', 'forecast_type', 'P_dict', 'ratio_P_dict'}


def _remove_eurs(context: MockContext):
    context.deterministic_forecast_datas_collection.update_many(
        {}, {'$set': {
            'P_dict.best.eur': None,
            'P_dict.best.rur': None,
            'ratio.eur': None,
            'ratio.rur': None
        }})
    for series in ('best', 'P10', 'P50', 'P90'):
        context.forecast_datas_collection.update_many(
            {}, {'$set': {
                f'P_dict.{series}.eur': None,
                f'P_dict.{series}.rur': None
            }})
