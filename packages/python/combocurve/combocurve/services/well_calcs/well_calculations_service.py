from typing import TYPE_CHECKING
from bson.objectid import ObjectId
from pymongo import UpdateOne
from combocurve.shared.constants import PHASES

from combocurve.shared.db_import import bulkwrite_operation
from combocurve.shared.date import index_from_timestamp, parse_datetime
from combocurve.services.well_calcs.well_calc import well_calc, data_import_well_calc
from combocurve.shared.db_import import calcs_pipeline
from combocurve.dal.stubs import production_from_response

if TYPE_CHECKING:
    from cloud_functions.well_calcs.context import WellCalcsContext

_well_headers = ['perf_lateral_length']
_production_fields = ['index', 'oil', 'gas', 'water']
_econ_run_one_liner_headers = [
    "wi_oil",
    "nri_oil",
    "before_income_tax_cash_flow",
    "first_discount_cash_flow",
    "econ_first_production_date",
    "undiscounted_roi",
    "irr",
    "payout_duration",
    "oil_breakeven",
    "gas_breakeven",
    "oil_shrunk_eur",
    "gas_shrunk_eur",
    "ngl_shrunk_eur",
    "oil_shrunk_eur_over_pll",
    "gas_shrunk_eur_over_pll",
    "ngl_shrunk_eur_over_pll",
]

_econ_run_reserves_category_headers = {
    "prms_reserves_category": "econ_prms_reserves_category",
    "prms_reserves_sub_category": "econ_prms_reserves_sub_category",
}


class WellCalculationsService:
    def __init__(self, context: 'WellCalcsContext'):
        self.context = context

    def update_well_calcs(self, well_ids):
        result = []
        for well, production, daily_production in self._get_well_headers_production(well_ids):
            ## calcualte production related only using monthly data
            well_id, item = self._build_item(well_headers=well,
                                             production=production,
                                             headers_fields=_well_headers,
                                             production_fields=_production_fields)

            updates = well_calc(item)
            ## here calculates fpd/lpd/coordinates, uses daily data
            updates.update(data_import_well_calc(daily_production, production, well))
            result.append(UpdateOne({'_id': ObjectId(well_id)}, [{'$set': updates}] + calcs_pipeline))

        return bulkwrite_operation(self.context.wells_collection, result) if result else None

    def update_econ_well_calcs(self, econ_run_id, wells_ids, combo_name=None):
        result = []

        query = {
            'well': {
                '$in': [ObjectId(w_id) for w_id in wells_ids]
            },
            'run': ObjectId(econ_run_id),
            '$or': [{
                'incrementalIndex': 0
            }, {
                'incrementalIndex': {
                    '$exists': False
                }
            }],
        }
        if (combo_name):
            query['comboName'] = combo_name

        pipeline = [{
            '$match': query
        }, {
            '$lookup': {
                'from':
                'wells',
                'let': {
                    'well_id': "$well"
                },
                'pipeline': [{
                    '$match': {
                        '$expr': {
                            '$eq': ["$_id", "$$well_id"]
                        }
                    },
                }, {
                    '$project': {
                        'perf_lateral_length': 1,
                    }
                }],
                'as':
                'wells'
            }
        }, {
            '$unwind': '$wells'
        }]

        econ_run = self.context.econ_runs_collection.find_one({'_id': ObjectId(econ_run_id)}, projection={'runDate': 1})
        econ_run_date = econ_run.get('runDate', None)
        econ_run_data = self.context.econ_runs_datas_collection.aggregate(pipeline)

        for data in econ_run_data:
            well_id = data['well']
            headers = {**self._get_econ_run_headers(data), 'combo_name': combo_name, 'econ_run_date': econ_run_date}
            result.append(UpdateOne({'_id': ObjectId(well_id)}, {'$set': headers}))

        return bulkwrite_operation(self.context.wells_collection, result) if result else None

    def _get_well_headers_production(self, well_ids):
        headers = self.context.wells_collection.find({'_id': {
            '$in': [ObjectId(well_id) for well_id in well_ids]
        }}, {
            'well': {
                '$toString': '$_id'
            },
            **{field: 1
               for field in _well_headers}
        })

        daily_production = self._extract_by_well_dal_records(
            self.context.dal.daily_production.fetch_by_well(wells=well_ids, field_mask=PHASES))
        monthly_production = self._extract_by_well_dal_records(
            self.context.dal.monthly_production.fetch_by_well(wells=well_ids, field_mask=PHASES))

        for header in headers:
            yield header, monthly_production.get(header['well'], {}), daily_production.get(header['well'], {})

    @staticmethod
    def _get_econ_run_headers(econ_run_data):
        def get_value(header):
            if header:
                field_type = header.get("type", None)
                value = header.get('value', None)
                if (field_type and field_type == "date"):
                    value = parse_datetime(value)
                return value
            return None

        one_liner_data = econ_run_data.get('oneLinerData') or {}
        one_liner_headers = {h: get_value(one_liner_data.get(h, None)) for h in _econ_run_one_liner_headers}

        reserves_category = econ_run_data.get('reservesCategory') or {}
        reserves_category_headers = {
            h: reserves_category.get(run_h, None)
            for h, run_h in _econ_run_reserves_category_headers.items()
        }

        return {**one_liner_headers, **reserves_category_headers}

    @staticmethod
    def _build_item(well_headers, production, headers_fields, production_fields):
        headers = {header: well_headers.get(header, None) for header in headers_fields}

        production_data = {field: production.get(field, []) for field in production_fields}

        return well_headers['_id'], {'headers': headers, 'production_data': production_data}

    @staticmethod
    def _extract_by_well_dal_records(records):
        total = {}
        for well_response in records:
            well_id = ObjectId(getattr(well_response, 'well'))
            total[well_id] = production_from_response(well_response)

        return total

    @staticmethod
    def _extract_dal_records(records):
        total = {}
        for record in records:
            well = record.well
            oil = record.oil
            gas = record.gas
            water = record.water
            timestamp = record.date.seconds
            try:
                total[well]['oil'].append(oil)
                total[well]['gas'].append(gas)
                total[well]['water'].append(water)
                total[well]['index'].append(index_from_timestamp(timestamp))
            except KeyError:
                total[well] = {'oil': [oil], 'gas': [gas], 'water': [water], 'index': [index_from_timestamp(timestamp)]}

        return total
