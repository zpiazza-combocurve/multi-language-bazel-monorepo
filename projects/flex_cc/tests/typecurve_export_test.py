import mongomock
import pytest
import numpy as np
from bson import ObjectId
import json
import os
from datetime import datetime
from math import isclose
from combocurve.services.forecast.mass_modify_well_life_v2 import MassModifyWellLifeService
from combocurve.services.type_curve.type_curve_service import TypeCurveService
from combocurve.services.production.production_service import ProductionService
from combocurve.services.type_curve.tc_normalization_service import TypeCurveNormalizationService
from combocurve.services.type_curve.tc_volume_export_service import TypeCurveVolumeExportService
from combocurve.shared.constants import PHASES
from combocurve.dal.mock_client import MockDAL


def _create_db():
    collections = {}
    file_dir = os.path.dirname(os.path.realpath('__file__'))
    wells_collection = mongomock.MongoClient().db.collection
    data_path = os.path.join(file_dir, 'combocurve/services/forecast/db_test_data/wells.json')

    with open(data_path, 'r') as f:
        prod_data = json.load(f)
    for doc in prod_data:
        doc['_id'] = ObjectId(doc['_id'])
        for key in ['first_prod_date_monthly_calc', 'first_prod_date_daily_calc', 'first_prod_date']:
            if not doc[key]:
                continue
            try:
                doc[key] = datetime.strptime(doc[key], '%Y-%m-%d %H:%M:%S')
            except Exception:
                doc[key] = datetime.strptime(doc[key], '%Y-%m-%d %H:%M:%S.%f')
        wells_collection.insert_one(doc)
    collections['wells'] = wells_collection

    forecasts_collection = mongomock.MongoClient().db.collection
    data_path = os.path.join(file_dir, 'combocurve/services/forecast/db_test_data/forecasts.json')
    with open(data_path, 'r') as f:
        forecasts_data = json.load(f)
    for doc in forecasts_data:
        for key in ['_id', 'project']:
            doc[key] = ObjectId(doc[key])
        doc['wells'] = [ObjectId(well) for well in doc['wells']]
        forecasts_collection.insert_one(doc)
    collections['forecasts'] = forecasts_collection

    deterministic_forecast_datas_collection = mongomock.MongoClient().db.collection
    data_path = os.path.join(
        file_dir, 'combocurve/services/forecast/db_test_data/deterministic_forecast_datas_collection_proximity.json')
    with open(data_path, 'r') as f:
        deterministic_forecast_datas = json.load(f)
    for doc in deterministic_forecast_datas:
        for key in ['_id', 'forecast', 'project', 'well']:
            doc[key] = ObjectId(doc[key])
        deterministic_forecast_datas_collection.insert_one(doc)
    collections['deterministic_forecast_datas_collection'] = deterministic_forecast_datas_collection

    monthly_productions_collection = mongomock.MongoClient().db.collection
    data_path = os.path.join(file_dir, 'combocurve/services/forecast/db_test_data/monthly_production.json')
    with open(data_path, 'r') as f:
        monthly_productions_data = json.load(f)
    for doc in monthly_productions_data:
        doc['_id'] = ObjectId(doc['_id'])
        monthly_productions_collection.insert_one(doc)
    collections['monthly_productions'] = monthly_productions_collection

    daily_productions_collection = mongomock.MongoClient().db.collection
    data_path = os.path.join(file_dir, 'combocurve/services/forecast/db_test_data/daily_production.json')
    with open(data_path, 'r') as f:
        daily_productions_data = json.load(f)
    for doc in daily_productions_data:
        doc['_id'] = ObjectId(doc['_id'])
        daily_productions_collection.insert_one(doc)
    collections['daily_productions'] = daily_productions_collection

    type_curves_collection = mongomock.MongoClient().db.collection
    data_path = os.path.join(file_dir, 'combocurve/services/type_curve/db_test_data/type_curves.json')
    with open(data_path, 'r') as f:
        type_curves_data = json.load(f)
    for doc in type_curves_data:
        doc['_id'] = ObjectId(doc['_id'])
        doc['forecast'] = ObjectId(doc['forecast'])
        doc['wells'] = [ObjectId(well) for well in doc['wells']]
        doc['normalizations'] = [ObjectId(well) for well in doc['normalizations']]
        doc['fits'] = {phase: ObjectId(doc['fits'][phase]) for phase in doc['fits']}

        type_curves_collection.insert_one(doc)
    collections['type_curves'] = type_curves_collection

    type_curve_fits_collection = mongomock.MongoClient().db.collection
    data_path = os.path.join(file_dir, 'combocurve/services/type_curve/db_test_data/type_curve_fits.json')
    with open(data_path, 'r') as f:
        type_curve_fits_data = json.load(f)
    for doc in type_curve_fits_data:
        doc['_id'] = ObjectId(doc['_id'])
        doc['typeCurve'] = ObjectId(doc['typeCurve'])
        type_curve_fits_collection.insert_one(doc)
    collections['type_curve_fits'] = type_curve_fits_collection

    type_curve_normalizations_collection = mongomock.MongoClient().db.collection
    data_path = os.path.join(file_dir, 'combocurve/services/type_curve/db_test_data/type_curve_normalizations.json')
    with open(data_path, 'r') as f:
        type_curve_normalizations_data = json.load(f)
    for doc in type_curve_normalizations_data:
        doc['_id'] = ObjectId(doc['_id'])
        doc['typeCurve'] = ObjectId(doc['typeCurve'])
        type_curve_normalizations_collection.insert_one(doc)
    collections['type_curve_normalizations'] = type_curve_normalizations_collection

    type_curve_normalization_wells_collection = mongomock.MongoClient().db.collection
    data_path = os.path.join(file_dir,
                             'combocurve/services/type_curve/db_test_data/type_curve_normalization_wells.json')
    with open(data_path, 'r') as f:
        type_curve_normalization_wells_data = json.load(f)
    for doc in type_curve_normalization_wells_data:
        doc['_id'] = ObjectId(doc['_id'])
        doc['typeCurve'] = ObjectId(doc['typeCurve'])
        doc['well'] = ObjectId(doc['well'])
        type_curve_normalization_wells_collection.insert_one(doc)
    collections['type_curve_normalization_wells'] = type_curve_normalization_wells_collection

    type_curve_well_assignments_collection = mongomock.MongoClient().db.collection
    data_path = os.path.join(file_dir, 'combocurve/services/type_curve/db_test_data/type_curve_well_assignments.json')
    with open(data_path, 'r') as f:
        type_curve_well_assignments_data = json.load(f)
    for doc in type_curve_well_assignments_data:
        doc['_id'] = ObjectId(doc['_id'])
        doc['typeCurve'] = ObjectId(doc['typeCurve'])
        doc['well'] = ObjectId(doc['well'])
        type_curve_well_assignments_collection.insert_one(doc)
    collections['type_curve_well_assignments'] = type_curve_well_assignments_collection

    collections |= {
        'forecast_datas_collecton': mongomock.MongoClient().db.collection,
    }

    return collections


class MockContext():
    def __init__(self):
        collections = _create_db()
        db = {}
        self.deterministic_forecast_datas_collection = db['deterministic-forecast-datas'] = collections[
            'deterministic_forecast_datas_collection']
        self.forecasts_collection = db['forecasts'] = collections['forecasts']
        self.wells_collection = db['wells'] = collections['wells']

        self.forecast_datas_collection = db['forecast-datas'] = collections['forecast_datas_collecton']
        self.monthly_productions_collection = db['monthly-productions'] = collections['monthly_productions']
        self.daily_productions_collection = db['daily-productions'] = collections['daily_productions']

        self.type_curves_collection = db['type-curves'] = collections['type_curves']
        self.type_curve_fits_collection = db['type-curve-fits'] = collections['type_curve_fits']
        self.type_curve_normalizations_collection = db['type-curve-normalizations'] = collections[
            'type_curve_normalizations']
        self.type_curve_normalization_wells_collection = db['type-curve-normalization-wells'] = collections[
            'type_curve_normalization_wells']
        self.type_curve_well_assignments_collection = db['type-curve-well-assignments'] = collections[
            'type_curve_well_assignments']

        self.db = db
        self.dal = MockDAL(db['monthly-productions'], db['daily-productions'])
        self.tc_normalization_service = TypeCurveNormalizationService(self)
        self.production_service = ProductionService(self)
        self.mass_modify_well_life_service = MassModifyWellLifeService(self)
        self.type_curve_service = TypeCurveService(self)


context = MockContext()
test_tc_volumes_sheets = [({
    'tc_id':
    '642ca950bb0681001299c4ee',
    'start_time': (np.datetime64('today').astype('datetime64[Y]') - np.datetime64('1900-01-01')).astype(int),
    'phases':
    PHASES,
    'base_phase_series':
    'best'
}, [
    0, 0, {
        'oil': [
            966.841729708343, 1688.0012100075783, 1663.1238279644479, 1557.8674121284218, 1542.6063272466263,
            1492.582494198713, 1398.7951277103732, 1391.8360710976528, 1309.652517140132, 1302.4884405639796
        ],
        'water': [
            8620.912276093068, 15306.810158735188, 13378.986542936886, 14334.316582184669, 13409.054410670215,
            13393.772717811653, 12529.22147404634, 12514.942486993321, 12090.666274410713, 11310.228918504841
        ],
        'gas': [
            2286.0167055298484, 3995.2686888742624, 3965.02606151317, 3806.3117769401965, 3781.7166731660795,
            3720.207341855512, 3550.9274953210697, 3475.0766958016557, 3388.084230670655, 3377.232230087688
        ],
        'oil_last': [
            2.0331217977890383, 2.018784433552277, 1.9401065109477094, 1.9908667448497912, 1.913276856071187,
            1.9633351287410574, 1.9494898928628128, 1.7490105313735562, 1.9234084511263863, 1.848447608978218
        ],
        'water_last': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        'gas_last': [
            28.860555977674142, 27.735775861581867, 28.461444510310773, 27.352218933186563, 28.067852339370663,
            27.869920753190836, 25.00386643928469, 27.4970602849297, 26.425419576295912, 13.144998173985764
        ]
    }
])]


@pytest.mark.unittest
@pytest.mark.parametrize("test_input,expected", test_tc_volumes_sheets)
def test_tc_volumes_sheets(test_input, expected):

    tc_volume_export = TypeCurveVolumeExportService(context, **test_input)

    daily_data_sheet, monthly_data_sheet, well_data_sheets = tc_volume_export.generate_dataframes()

    assert len(daily_data_sheet) == expected[0]
    assert len(monthly_data_sheet) == expected[1]

    for phase in PHASES:
        this_wells_average = well_data_sheets[phase]['Wells Average'][0:10]
        this_wells_average_last = list(well_data_sheets[phase]['Wells Average'][-10:])
        for i in range(len(this_wells_average)):
            assert isclose(this_wells_average[i], expected[2][phase][i])
            assert isclose(this_wells_average_last[i], expected[2][f'{phase}_last'][i])
