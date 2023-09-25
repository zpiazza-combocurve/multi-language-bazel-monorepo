from typing import Any, Dict, Iterable, Union, TYPE_CHECKING

from bson import ObjectId
import numpy as np
from pymongo.collection import Collection

from combocurve.dal.client import DAL
from combocurve.dal.stubs import production_from_response
from combocurve.shared.constants import DAYS_IN_MONTH
from combocurve.shared.mongo_utils import put_items_together

DAILY_BUCKET_SIZE = 31
MONTHLY_BUCKET_SIZE = 12

if TYPE_CHECKING:
    from apps.python_apis.api.context import APIContext


class ProductionService(object):
    def __init__(self, context):
        self.context: APIContext = context
        self.dal: DAL = self.context.dal
        self.db = self.context.db
        self.forecasts_collection: Collection = self.db['forecasts']
        self.forecast_datas_collection: Collection = self.db['forecast-datas']
        self.deterministic_forecast_datas_collection: Collection = self.db['deterministic-forecast-datas']
        self.wells_collection: Collection = self.db['wells']

    def get_production(self,
                       wells: list[ObjectId],
                       daily: bool = False,
                       fields: list[str] = ['oil', 'gas', 'water'],
                       filter={},
                       daily_custom_fields=[],
                       monthly_custom_fields=[]):
        wells_strs: list[str] = [str(w) for w in wells]

        if not wells_strs:
            return []

        if daily:
            production = self.dal.daily_production.fetch_by_well(wells=wells_strs)
            field_list = fields + daily_custom_fields
        else:
            production = self.dal.monthly_production.fetch_by_well(wells=wells_strs)
            field_list = fields + monthly_custom_fields

        for well_response in production:
            yield production_from_response(well_response, field_list)

    def get_well_peak_rates(self, wells, daily=False, fields=['oil', 'gas', 'water']):
        '''
        For the set of wells, get the peak production rate for the specified phases.

        Params:
            wells (List[ObjectId]): List of wells to fetch peaks for
            daily (boolean): Fetching daily data?
            fields (List[AnyStr]): List of phases to fetch.
        Returns:
            Dictionary mapping wells to phase/peak rate dictionary.
        '''
        prod = self.get_production(wells, daily, fields)
        well_peaks = {}
        for well in prod:
            peaks = {}
            for f in fields:
                phase_data = well.get(f)
                phase_data_array = np.array(phase_data if phase_data is not None else [], dtype=float)
                peak = np.nanmax(phase_data_array) / (1 if daily else DAYS_IN_MONTH)
                peaks[f] = peak
            well_peaks[well['_id']] = peaks

        return well_peaks

    def get_single_well_peak_ratio(self, well: ObjectId, phase: str, base_phase: str, daily: bool = False):
        '''
        For the single well, get the peak ratio between phase and base_phase.

        Params:
            well (ObjectId): The id of the specific well
            phase (str): The ratio phase we are looking at
            base_phase (str): The base phase of the target phase.
            daily (bool): Should we use daily data?

        Returns:
            A single-key dict with the key being the phase, value being the peak ratio.
        '''
        if phase is None or base_phase is None:
            return {}

        prod = list(self.get_production([well], daily, fields=[phase, base_phase]))[0]

        phase_data = prod.get(phase)
        base_phase_data = prod.get(base_phase)

        phase_data_array = np.array(phase_data if phase_data is not None else [], dtype=float)
        base_phase_data_array = np.array(base_phase_data if base_phase_data is not None else [], dtype=float)

        ratio_data_array = phase_data_array / base_phase_data_array
        ratio_data_array = ratio_data_array[np.isfinite(ratio_data_array)]

        if len(ratio_data_array):
            peak = np.nanmax(ratio_data_array) / (1 if daily else DAYS_IN_MONTH)
        else:
            peak = np.nan
        peaks = {phase: peak}

        return peaks

    def get_production_headers_forecast(self,
                                        forecast,
                                        wells,
                                        header_fields,
                                        resolution,
                                        phases=['oil', 'gas', 'water'],
                                        filters={}):
        prod_headers = self.get_production_with_headers(wells,
                                                        header_fields=header_fields,
                                                        resolution=resolution,
                                                        phases=['oil', 'gas', 'water'],
                                                        filters={})
        forecasts = self.get_well_forecast(wells, forecast, phases)

        if len(forecasts) == 0:
            for prod_header in prod_headers:
                prod_header['forecast'] = {'oil': [], 'gas': [], 'water': []}
        else:
            forecast_idx = 0
            for header_idx, prod_header in enumerate(prod_headers):
                if prod_header['well'] == str(forecasts[forecast_idx]['well']):
                    this_forecast = forecasts[forecast_idx]['forecasts']
                    prod_header['forecast'] = {k: v['best']['segments'] for k, v in this_forecast.items()}
                    forecast_idx += 1
                else:
                    prod_header['forecast'] = {'oil': [], 'gas': [], 'water': []}
        return prod_headers

    def get_production_with_headers(self, wells, header_fields, resolution, phases=['oil', 'gas', 'water'], filters={}):
        extra_header_fields = ['_id', 'has_daily', 'has_monthly']
        added_extra_fields = [k for k in extra_header_fields if k not in header_fields]
        headers = self.get_well_headers(wells, header_fields + added_extra_fields)
        daily_batch, month_batch = _get_resolution_batches_and_add_data_freq_to_headers(headers, resolution)

        daily_production = list(self.get_production(daily_batch, True, phases, filters))
        monthly_production = list(self.get_production(month_batch, False, phases, filters))

        dprod_len = len(daily_production)
        mprod_len = len(monthly_production)

        dprod_idx = 0
        mprod_idx = 0
        header_idx = 0

        output = []
        while (header_idx < len(headers)):
            well_id = str(headers[header_idx]['_id'])

            inc_d = False
            inc_m = False

            cur_freq = headers[header_idx]['data_freq']
            new_data = {'data_freq': cur_freq, 'well': well_id}

            cur_prod = {phase: [] for phase in phases}
            cur_prod['index'] = []  ## {'index': [], 'oil': [], 'gas': [], 'water': []}

            if (mprod_len > 0 and mprod_idx < mprod_len and cur_freq == 'monthly'
                    and str(monthly_production[mprod_idx]['_id']) == well_id):
                inc_m = True
                cur_prod = monthly_production[mprod_idx]
            elif (dprod_len > 0 and dprod_idx < dprod_len and cur_freq == 'daily'
                  and str(daily_production[dprod_idx]['_id']) == well_id):
                inc_d = True
                cur_prod = daily_production[dprod_idx]

            new_data['production'] = cur_prod
            headers[header_idx].pop('data_freq')
            for k in added_extra_fields:
                headers[header_idx].pop(k)
            new_data['headers'] = headers[header_idx]

            output.append(new_data)

            if (inc_d):
                dprod_idx += 1
            if (inc_m):
                mprod_idx += 1
            header_idx += 1

        return output

    def get_well_headers(self, wells, header_list):
        # TODO: the db instance should not be accessed directly from services
        # instead, we should use the collection/model instances in `context`
        # this is temporary until all the code using db instances directly is refactorized
        db = self.context.db
        project_dict = {k: 1 for k in header_list}
        if '_id' not in header_list:
            project_dict['_id'] = 0
        pipeline = [{
            '$match': {
                '_id': {
                    '$in': list(map(lambda well: ObjectId(well), wells))
                }
            }
        }, {
            '$sort': {
                '_id': 1
            }
        }, {
            '$project': project_dict
        }]

        data = list(db['wells'].aggregate(pipeline))

        for well in data:
            well = list(map(lambda x: well.get(x), header_list))

        return data

    def get_well_forecast(self, wells, forecast, phases=['oil', 'gas', 'water'], filters={}):
        db = self.context.db
        wells_id = list(map(ObjectId, wells))
        match = {'well': {'$in': wells_id}, 'forecast': ObjectId(forecast), 'phase': {'$in': phases}}
        sort = {'_id': 1}
        group = {
            '_id': '$well',
            'forecasts': {
                '$push': {
                    'phase': '$phase',
                    'P_dict': '$P_dict',
                    'data_freq': '$data_freq'
                }
            }
        }
        forecast_pipeline = [{'$match': match}, {'$group': group}, {'$sort': sort}]
        forecasts = db['forecast-datas'].aggregate(forecast_pipeline)

        ret = [
            {
                'well': x['_id'],
                'forecasts':
                {elem['phase']: {
                    **elem['P_dict'],
                    'data_freq': elem['data_freq'],
                }
                 for elem in x['forecasts']},  # noqa: E121
            } for x in forecasts
        ]
        return ret

    def get_well_forecast_deterministic(self, wells, forecast, phases=['oil', 'gas', 'water'], filters={}):
        db = self.context.db
        wells_id = list(map(ObjectId, wells))
        match = {'well': {'$in': wells_id}, 'forecast': ObjectId(forecast), 'phase': {'$in': phases}}
        sort = {'_id': 1}
        group = {
            '_id': '$well',
            'forecasts': {
                '$push': {
                    'phase': '$phase',
                    'P_dict': '$P_dict',
                    'forecastType': '$forecastType',
                    'ratio': '$ratio',
                    'data_freq': '$data_freq'
                }
            }
        }
        forecast_pipeline = [{'$match': match}, {'$group': group}, {'$sort': sort}]
        forecasts = list(db['deterministic-forecast-datas'].aggregate(forecast_pipeline))

        ret = list(
            map(
                lambda x: {
                    'well': x['_id'],
                    'forecasts': {
                        elem['phase']: {
                            **elem['P_dict'], 'data_freq': elem['data_freq']
                        } if elem['forecastType'] in ['rate', 'not_forecasted'] else {
                            'ratio': elem['ratio'],
                            'data_freq': elem['data_freq']
                        }
                        for elem in x['forecasts']
                    }
                }, forecasts))
        return ret

    def get_forecast_with_headers(self,
                                  wells,
                                  header_fields,
                                  forecast,
                                  phases=['oil', 'gas', 'water'],
                                  is_deterministic=False):

        extra_header_fields = ['_id']
        added_extra_fields = [k for k in extra_header_fields if k not in header_fields]
        headers = self.get_well_headers(wells, header_fields + added_extra_fields)
        if is_deterministic:
            forecasts = self.get_well_forecast_deterministic(wells, forecast, phases)
        else:
            forecasts = self.get_well_forecast(wells, forecast, phases)
        ## I do not assume the n is too large here, take O(n^2) solution for the simplicity of logic
        headers_id = np.array(list(map(lambda x: x['_id'], headers)))
        forecasts_id = np.array(list(map(lambda x: x['_id'], headers)))
        target_ids = list(map(lambda x: ObjectId(x), wells))
        ret = []
        for target_id in target_ids:
            header_mask = headers_id == target_id
            forecast_mask = forecasts_id == target_id
            this_item = {'well': target_id}
            if header_mask.sum() >= 1:
                this_item['headers'] = headers[np.argwhere(header_mask)[0, 0]]
            else:
                this_item['headers'] = None

            if forecast_mask.sum() >= 1:
                this_item['forecasts'] = forecasts[np.argwhere(forecast_mask)[0, 0]]['forecasts']
            else:
                this_item['forecasts'] = None

            ret += [this_item]

        return ret

    def get_forecast_with_all_info(self,
                                   wells_str,
                                   forecast_id_str,
                                   headers,
                                   include_comments=False,
                                   daily_custom_fields=[],
                                   monthly_custom_fields=[]):
        forecast_id = ObjectId(forecast_id_str)
        forecast_document = self.forecasts_collection.find_one({'_id': forecast_id})
        forecast_parent_type = forecast_document['type']
        well_ids = list(map(ObjectId, wells_str))

        daily_fields = [
            'oil', 'gas', 'water', 'bottom_hole_pressure', 'gas_lift_injection_pressure', 'tubing_head_pressure',
            'flowline_pressure', 'casing_head_pressure', 'vessel_separator_pressure'
        ]

        daily_production = self.get_production(wells_str,
                                               daily=True,
                                               fields=daily_fields,
                                               daily_custom_fields=daily_custom_fields)
        monthly_production = self.get_production(wells_str, monthly_custom_fields=monthly_custom_fields)

        lookupComments = {
            'from':
            'well-comments',
            'let': {
                'well': '$_id',
            },
            'pipeline': [{
                '$match': {
                    '$expr': {
                        '$and': [
                            {
                                '$eq': ['$well', '$$well'],
                            },
                            {
                                '$eq': ['$forecast', forecast_id],
                            },
                        ],
                    },
                },
            }, {
                '$project': {
                    'comments': 1
                }
            }, {
                '$unwind': '$comments'
            }, {
                '$replaceRoot': {
                    'newRoot': '$comments'
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'createdBy',
                    'foreignField': '_id',
                    'as': 'createdBy',
                },
            }, {
                '$unwind': '$createdBy'
            }, {
                '$sort': {
                    'createdAt': -1
                }
            }],
            'as':
            'comments',
        }

        wells_pipeline = [{
            '$match': {
                '_id': {
                    '$in': well_ids
                }
            }
        }, {
            '$project': {h: 1
                         for h in headers}
        }, {
            '$sort': {
                '_id': 1
            }
        }]
        if include_comments:
            wells_pipeline.append({'$lookup': lookupComments})
        headers = self.wells_collection.aggregate(wells_pipeline)

        lookupForecastedBy = {
            'from': 'users',
            'localField': 'forecastedBy',
            'foreignField': '_id',
            'as': 'forecastedBy',
        }
        lookupReviewedBy = {
            'from': 'users',
            'localField': 'reviewedBy',
            'foreignField': '_id',
            'as': 'reviewedBy',
        }

        fields = [
            'P_dict', 'forecastType', 'forecastSubType', 'ratio', 'data_freq', 'forecastedBy', 'forecastedAt',
            'reviewedBy', 'reviewedAt', 'status'
        ]
        group_fields = fields + ['phase']
        group = {'data': {'$push': {field: '$' + field for field in group_fields}}}
        group['_id'] = '$well'

        use_forecast_datas_collection = {
            'probabilistic': self.forecast_datas_collection,
            'deterministic': self.deterministic_forecast_datas_collection
        }.get(forecast_parent_type)

        grouped_forecast_datas = list(
            use_forecast_datas_collection.aggregate([{
                '$match': {
                    'forecast': forecast_id,
                    'well': {
                        '$in': well_ids
                    }
                }
            }, {
                '$lookup': lookupForecastedBy
            }, {
                '$unwind': {
                    'path': '$forecastedBy',
                    'preserveNullAndEmptyArrays': True
                }
            }, {
                '$lookup': lookupReviewedBy
            }, {
                '$unwind': {
                    'path': '$reviewedBy',
                    'preserveNullAndEmptyArrays': True
                }
            }, {
                '$group': group
            }]))

        forecast_datas = list(map(reformat_forecast_group_data, grouped_forecast_datas))

        all_data = put_items_together(
            {
                'monthly_production': monthly_production,
                'daily_production': daily_production,
                'forecast_data': forecast_datas,
                'header': headers
            }, {
                'monthly_production': '_id',
                'daily_production': '_id',
                'forecast_data': '_id',
                'header': '_id'
            }, well_ids)

        return (forecast_document, [{
            **well_data,
            'forecast_created_at': forecast_document['createdAt'],
            'forecast_updated_at': forecast_document['updatedAt'],
        } for well_data in all_data])

    def get_tc_fits(self, tc_ids: Union[str, list[str]]) -> Dict[str, Dict[str, Any]]:
        '''Gets the fit documents for each phase in phases.
        Input:
        ------
        `tc_id: str`, The id of the type curve.
        `phases: List[str]`, A list of phases to retrieve.
        Output:
        -------
        `Dict[str, Dict[str, Any]]`,
        {
        tc_id: {
            'normalization': norm_id,
            'tc_type': 'rate' | 'ratio'
            'base_phase': 'oil' | 'gas' | 'water'
            'fits': Dict[str, Dict[str, any]] # Keyed on phase, with the values being the individual fit documents.
            },
        another_tc_id: {
            ...
            },
            ...
        }
        '''
        if isinstance(tc_ids, str):
            tcs = [tc_ids]
        else:
            tcs = tc_ids
        pipeline = [{
            '$match': {
                '_id': {
                    '$in': list(map(ObjectId, tcs))
                },
            }
        }, {
            '$lookup': {
                'from': 'type-curve-fits',
                'localField': '_id',
                'foreignField': 'typeCurve',
                'as': 'fits'
            }
        }, {
            '$project': {
                'normalization': {
                    '$arrayElemAt': ['$normalizations', 0]
                },
                'tc_type': '$tcType',
                'tc_name': '$name',
                'base_phase': '$basePhase',
                'phase_type': '$phaseType',
                'fits': 1
            }
        }]

        out = {}
        # Helpfully organize fit into a Dict here. Easier to do python side than in Mongo.
        for data in self.context.type_curves_collection.aggregate(pipeline):
            data['fits'] = {fit.pop('phase'): fit for fit in data.get('fits', [])}
            out[str(data.pop('_id'))] = data

        return out

    def get_cums_and_last_prods(
        self,
        daily_wells: Iterable[str],
        monthly_wells: Iterable[str],
        cum_phases: Iterable[str],
    ) -> Dict[str, Dict[str, Dict[str, float]]]:
        """Grab the cum data and last prod dates required to compute EURs.

        Args:
            daily_wells: The ids of the wells whose daily cums are to be computed.
            monthly_wells: The ids of the wells whose monthly cums are to be computed.
            cum_phases: The phases whose cums will be computed. Every well will have the cum computed from cum_phases.

        Returns:
            A dict keyed on 'daily' and 'monthly'. The fields are themselves dicts keyed on well_id with fields
            containing the well's last_prod and cums for each cum_phases as dicts. E.g. return is
            {
                'daily': {
                    '61fdbcaeff23fb0015a3588f': {
                        'last_prod': 40207,
                        'oil': 207.3,
                        'gas': 12340.123,
                        'water': 0
                    },
                    ...
                },
                'monthly': {
                    '618152b3ce168800138bc692': {
                        'last_prod': 40303,
                        'oil': 100.3,
                        'gas': 999.123,
                        'water': 41239
                    },
                    ...
                }
            }
        """
        daily_data = []
        monthly_data = []

        if len(daily_wells):
            daily_data = self.dal.daily_production.fetch_by_well(wells=daily_wells)

        if len(monthly_wells):
            monthly_data = self.dal.monthly_production.fetch_by_well(wells=monthly_wells)

        ret = {'daily': {}, 'monthly': {}}

        for daily_response in daily_data:
            daily_well = production_from_response(daily_response)
            well_id = str(daily_well['_id'])
            cum_dict = {phase: sum(daily_well[phase]) for phase in cum_phases}
            ret['daily'][well_id] = {'last_prod': max(daily_well['index']), **cum_dict}

        for monthly_response in monthly_data:
            monthly_well = production_from_response(monthly_response)
            well_id = str(monthly_well['_id'])
            cum_dict = {phase: sum(monthly_well[phase]) for phase in cum_phases}
            ret['monthly'][well_id] = {'last_prod': max(monthly_well['index']), **cum_dict}

        return ret


def reformat_forecast_group_data(well_forecast):
    ret = {'_id': well_forecast['_id']}
    for phase_document in well_forecast['data']:
        ret[phase_document['phase']] = phase_document

    return ret


def _get_resolution_batches_and_add_data_freq_to_headers(wells, resolution):
    daily_batch = []
    month_batch = []

    for well in wells:
        has_daily = well['has_daily']
        has_monthly = well['has_monthly']
        data_freq = 'monthly'
        if (resolution == 'monthly_only'):
            data_freq = 'monthly'
        elif (resolution == 'daily_only'):
            data_freq = 'daily'
        elif (resolution == 'monthly_preference'):
            if (has_monthly):
                data_freq = 'monthly'
            elif (has_daily):
                data_freq = 'daily'
        elif (resolution == 'daily_preference'):
            if (has_daily):
                data_freq = 'daily'
            elif (has_monthly):
                data_freq = 'monthly'

        well['data_freq'] = data_freq
        if (data_freq == 'daily'):
            daily_batch.append(str(well['_id']))
        if (data_freq == 'monthly'):
            month_batch.append(str(well['_id']))

    return daily_batch, month_batch
