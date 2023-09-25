import logging
from bson.objectid import ObjectId
import numpy as np
from pymongo import UpdateOne, InsertOne
import datetime
from copy import deepcopy
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.utils.exceptions import get_exception_info
from combocurve.science.forecast.forecast_body import forecast_body
from combocurve.services.forecast.get_lib_forecast_pextra import get_lib_forecast_info
from combocurve.services.forecast.shared import (check_None_and_update, get_para_dicts,
                                                 adjust_para_dict_for_header_range, get_para_dict_date_headers)
from combocurve.shared.constants import PHASES

EMPTY_COMPARISON_IDS = {'diagonstics': [], 'manual': [], 'view': []}
Q_FINAL_PHASES = PHASES + ['oil/gas', 'oil/water', 'gas/oil', 'gas/water', 'water/oil', 'water/gas']
Q_FINAL_DICT_DEFAULT = {phase: None for phase in Q_FINAL_PHASES}
WARNING_DEFAULT = {'status': False, 'message': ''}
RATIO_DEFAULT = {'enabled': False, 'phase': 'oil', 'value': 1}


class ForecastService(object):
    def __init__(self, context):
        self.context = context

    def forecast(self, params):
        # TODO: the db instance should not be accessed directly from services
        # instead, we should use the collection/model instances in `context`
        # this is temporary until all the code using db instances directly is refactorized
        forecast_id = params['forecast_id']
        settings = params['settings']
        para_dicts = get_para_dicts(settings)
        reforecast = params['reforecast']
        forecast_phase_bools = settings['phases']
        forecast_phases = [p for p in PHASES if forecast_phase_bools[p]]
        resolution = settings['shared']['resolution']
        wells = params['wells']

        forecastor = forecast_body()
        data = self._get_forecast_batch(wells, forecast_phases, resolution, para_dicts)
        reforecast_results = []
        updates = []
        succeeded = []
        failed = []

        manual_forecast_wells = {}
        if not reforecast and para_dicts and para_dicts[list(para_dicts.keys())[0]].get('overwrite_manual') is not True:
            manual_forecast_wells = self._get_manual_forecasts_batch(forecast_id, wells, forecast_phases)

        for well_phase in data:
            cur_phase = well_phase['phase']
            well_id = ObjectId(well_phase['well'])
            forecast_id = ObjectId(forecast_id)
            if not reforecast and well_phase['well'] in manual_forecast_wells and well_phase[
                    'phase'] in manual_forecast_wells[well_phase['well']]:
                warning_msg = 'Current forecast was saved from manual editing. Navigate to Run Auto Forecast '
                warning_msg += 'form and update config with "Overwrite Manual" turned on.'
                warning = {'message': warning_msg, 'status': True}
                phase_update = self.get_update_body(well_id, ObjectId(forecast_id), cur_phase, warning=warning)
                updates.append(phase_update)
                succeeded += [well_phase['well']]
            else:
                this_para_dicts = adjust_para_dict_for_header_range(para_dicts, cur_phase, well_phase)
                # this_para_dicts = adjust_para_dict_for_header_range(para_dicts, cur_phase, date_headers, well_phase)
                try:
                    out, well_prod = forecastor.body(well_phase, this_para_dicts)

                    out['data_freq'] = well_phase['data_freq']
                    out['model_name'] = para_dicts[cur_phase]['model_name']
                    if self.context.tenant_info['subdomain'] == 'zlibrary':
                        p_extra_zlib = get_lib_forecast_info(well_prod, out['P_dict']['best']['segments'])
                        out['p_extra']['lib_info'] = p_extra_zlib

                    if (reforecast):
                        reforecast_results = out
                    else:
                        cum = np.nansum(np.array(well_phase['production']['value'], dtype=float))
                        index = well_phase['production']['index']
                        last_prod_idx = index[-1] if len(index) > 0 else None
                        phase_update = self.get_update_body(well_id,
                                                            forecast_id,
                                                            cur_phase,
                                                            user=params.get('user'),
                                                            P_dict=out.get('P_dict'),
                                                            forecasted=out.get('forecasted'),
                                                            forecastType=out.get('forecastType'),
                                                            warning=out.get('warning'),
                                                            data_freq=out.get('data_freq'),
                                                            p_extra=out.get('p_extra'),
                                                            calc_eur=True,
                                                            cum=cum,
                                                            last_prod_idx=last_prod_idx)
                        updates.append(phase_update)
                        succeeded += [well_phase['well']]
                except Exception as e:
                    error_info = get_exception_info(e)
                    logging.error(error_info['message'], extra={'metadata': {'error': error_info, 'prob': params}})
                    if (reforecast):
                        reforecast_results = []
                    else:
                        phase_update = self.get_update_body(well_id,
                                                            forecast_id,
                                                            cur_phase,
                                                            user=params.get('user'),
                                                            warning={
                                                                'status': True,
                                                                'message': 'Automatic forecast failed. '
                                                            })
                        updates.append(phase_update)
                        failed += [well_phase['well']]

        if (reforecast):
            return reforecast_results
        else:
            write_results = self.write_forecast_data_to_db(updates)
            ret = {'write_results': write_results, 'succeeded': succeeded, 'failed': failed}

            return ret

    def _get_forecast_batch(self, wells, phases, resolution, para_dicts):
        all_date_headers = get_para_dict_date_headers(phases, para_dicts)
        header_fields = [
            'first_prop_weight', 'surfaceLatitude', 'perf_lateral_length', 'surfaceLongitude', 'measured_depth',
            'total_prop_weight', 'true_vertical_depth'
        ] + all_date_headers
        name_mapping = {
            'lat': 'surfaceLatitude',
            'LL': 'perf_lateral_length',
            'long': 'surfaceLongitude',
            'MD': 'measured_depth',
            'TVD': 'true_vertical_depth'
        }
        header_and_prods = self.context.production_service.get_production_with_headers(
            wells, header_fields, resolution, phases)
        output = []
        for well in header_and_prods:
            this_production = well['production']
            this_headers = well['headers']

            ### adjust headers, names
            ## rename items
            for item in ['lat', 'long', 'MD', 'LL', 'TVD']:
                this_headers[item] = this_headers[name_mapping[item]]

            this_headers.setdefault(
                'Prop', this_headers.setdefault('total_prop_weight', this_headers.setdefault('first_prop_weight',
                                                                                             None)))
            for item in ['lat', 'long', 'MD', 'LL', 'Prop', 'TVD']:
                if type(this_headers[item]) not in [type(None), int, float]:
                    this_headers[item] = None

            for phase in phases:
                this_phase = deepcopy(well)
                this_phase['phase'] = phase
                this_phase['production'] = {'index': this_production['index'], 'value': this_production[phase]}
                output += [this_phase]

        return output

    def _get_manual_forecasts_batch(self, forecast_id, wells, phases):
        db = self.context.db
        project_dict = {
            '_id': 0,
            'well': 1,
            'phase': 1,
            'forecastType': 1,
        }

        match = {
            'forecast': ObjectId(forecast_id),
            'well': {
                '$in': list(map(lambda well: ObjectId(well), wells))
            },
            'phase': {
                '$in': phases
            },
            'forecastType': 'manual'
        }
        forecast_datas = list(db['forecast-datas'].find(match, project_dict))
        manual_forecast_wells = {}

        for data in forecast_datas:
            if str(data['well']) not in manual_forecast_wells:
                manual_forecast_wells[str(data['well'])] = [data['phase']]
            else:
                manual_forecast_wells[str(data['well'])].append(data['phase'])

        return manual_forecast_wells

    def get_update_body(
            self,
            well_id: ObjectId,
            forecast_id: ObjectId,
            phase: str,
            user: str = None,  ## TODO, make it not default to None and user will be required
            model_name: str = None,
            P_dict: dict = {},
            forecasted: bool = None,
            forecastType: str = None,
            ratio: dict = None,
            warning: dict = None,
            data_freq: str = None,
            p_extra: dict = None,
            typeCurve: ObjectId = None,
            typeCurveApplySetting: dict = None,
            diagDate: datetime.datetime = None,
            lastAutomaticRun: dict = None,
            is_diagnostics: bool = False,
            calc_eur: bool = False,
            cum: float = 0.0,
            last_prod_idx: int = None,
            base_segs=None,  # Unused, only included to keep signature the same as deterministic.
            forecastSubType=None,  # Unused, only included to keep signature the same as deterministic.
    ) -> UpdateOne:
        # Updates into forecast_data collection
        # forecasted --> true
        # data_freq --> monthly/daily
        # forecastType --> type_here

        # runDate --> new Date() of autorun
        # forecastedAt --> new Date() of manual/ autorun
        # status --> in_progress

        cur_time = datetime.datetime.utcnow()
        update_set = {'updatedAt': cur_time}
        if forecasted:
            update_set['forecastedAt'] = cur_time

        check_None_and_update(update_set, 'model_name', model_name)
        check_None_and_update(update_set, 'forecasted', forecasted)
        check_None_and_update(update_set, 'forecastType', forecastType)
        check_None_and_update(update_set, 'warning', warning)
        check_None_and_update(update_set, 'data_freq', data_freq)
        check_None_and_update(update_set, 'p_extra', p_extra)
        check_None_and_update(update_set, 'typeCurve', typeCurve)
        check_None_and_update(update_set, 'typeCurveApplySetting', typeCurveApplySetting)
        check_None_and_update(update_set, 'diagDate', diagDate)

        if P_dict:
            if calc_eur:
                eur, rur, updates = self.calc_eur(P_dict, last_prod_idx, cum, data_freq)
                update_set.update(updates)
            else:
                for k, segs_and_diags in P_dict.items():
                    if k in ['P10', 'P50', 'P90', 'best']:
                        for kk, v in segs_and_diags.items():
                            update_set['P_dict.{}.{}'.format(k, kk)] = v

        if P_dict is not None:
            if len(P_dict) > 0 and not is_diagnostics:
                update_set['status'] = 'in_progress'
                update_set['reviewedAt'] = None
                update_set['reviewedBy'] = None

        if user is not None:
            update_set['forecastedBy'] = ObjectId(user)

        return UpdateOne({'forecast': forecast_id, 'well': well_id, 'phase': phase}, {'$set': update_set})

    def generate_eur(self, forecast, well, phase, is_deterministic, segments):
        match = {
            'forecast': ObjectId(forecast),
            'well':  ObjectId(well),
            'phase': phase,
        }
        pipeline = [{
            '$match': match
        }, {
            '$project': {
                '_id': 0,
                'forecast_id': '$forecast',
                'well': 1,
                'phase': 1,
                'data_freq': 1,
                'forecast_type': '$forecastType',
                'ratio_P_dict': '$ratio',
                'P_dict': 1,
                'forecastSubType': 1
            }
        }]
        if is_deterministic:
            datas_collection = self.context.deterministic_forecast_datas_collection
        else:
            datas_collection = self.context.forecast_datas_collection

        data = list(datas_collection.aggregate(pipeline))
        if data is None or len(data) == 0:
           return {}
        else:
           eur, rur, updates = self.calc_eur(data[0]['P_dict'], None, 0.0, data[0]['data_freq'], segments)
           return {
             'eur': eur,
             'rur': rur
           }  

    def calc_eur(self, P_dict = {}, last_prod_idx = None, cum = 0.0, data_freq = None, segments = None):
        update_set = {}
        eur = None
        rur = None
        main_dict = segments if segments is not None else P_dict
        for k, segs_and_diags in main_dict.items():
           if k in ['P10', 'P50', 'P90', 'best']:
             segs = segs_and_diags.get('segments', [])
             if len(segs) == 0:
               eur = cum
               rur = 0.0
             else:
               if last_prod_idx is None:
                 last_prod_idx = int(segs[0]['start_idx'] - 1)

               eur = MultipleSegments().eur_precise(cum, last_prod_idx, last_prod_idx + 1,
                                                                     int(segs[-1]['end_idx']), segs, data_freq)
               rur = eur - cum
               segs_and_diags['rur'] = rur
               segs_and_diags['eur'] = eur

               for kk, v in segs_and_diags.items():
                 if v:
                   update_set['P_dict.{}.{}'.format(k, kk)] = v
        return eur, rur, update_set



    def get_insert_body(self,
                        well: ObjectId,
                        forecast: ObjectId,
                        phase: str,
                        project: ObjectId,
                        data_freq: str = 'monthly',
                        diagDate: datetime.datetime = None,
                        forecasted: bool = False,
                        P_dict: dict = {},
                        forecastType: str = 'not_forecasted',
                        ratio: dict = RATIO_DEFAULT,
                        warning: dict = WARNING_DEFAULT,
                        p_extra: dict = {},
                        typeCurve: ObjectId = None,
                        typeCurveApplySetting: dict = None,
                        status: str = 'in_progress',
                        reviewedAt: datetime.datetime = None,
                        reviewedBy: ObjectId = None,
                        forecastedAt: ObjectId = None,
                        forecastedBy: ObjectId = None,
                        **kwargs) -> InsertOne:
        # Inserts into forecast_data collection.

        cur_time = datetime.datetime.utcnow()
        mandatory_set = {
            'well': well,
            'forecast': forecast,
            'phase': phase,
            'project': project,
            'data_freq': data_freq,
            'diagDate': diagDate,
            'forecasted': forecasted,
            'P_dict': P_dict,
            'forecastType': forecastType,
            'ratio': ratio,
            'warning': warning,
            'p_extra': p_extra,
            'typeCurve': typeCurve,
            'status': status,
            'reviewedAt': reviewedAt,
            'reviewedBy': reviewedBy,
            'forecastedAt': forecastedAt,
            'forecastedBy': forecastedBy,
            'createdAt': cur_time,
            'updatedAt': cur_time
        }

        optional_set = {}
        # Provides access to update optional fields w/out default values
        optional_set.update({k: v for k, v in kwargs.items()})
        check_None_and_update(optional_set, 'typeCurveApplySetting', typeCurveApplySetting)
        mandatory_set.update(optional_set)
        return InsertOne(mandatory_set)

    def get_forecast_insert_body(self,
                                 name: str,
                                 project: ObjectId,
                                 user: ObjectId,
                                 wells: list,
                                 comparisonIds: dict = EMPTY_COMPARISON_IDS,
                                 copiedFrom: ObjectId = None,
                                 diagDate: datetime.datetime = None,
                                 forecasted: bool = False,
                                 imported: bool = False,
                                 qFinalDict: dict = Q_FINAL_DICT_DEFAULT,
                                 libUserInput: dict = None,
                                 settings: dict = None,
                                 prodPref: str = 'monthly_preference',
                                 type_: str = 'probabilistic',
                                 isForecastedLibrary: bool = False,
                                 tags: list = [],
                                 runDate: datetime.datetime = None,
                                 __v: int = 0,
                                 **kwargs) -> dict:

        # Inserts new forecast document.
        cur_time = datetime.datetime.utcnow()
        mandatory_set = {
            'name': name,
            'project': project,
            'wells': wells,
            'user': user,
            'createdAt': cur_time,
            'updatedAt': cur_time,
            'comparisonIds': comparisonIds,
            'copiedFrom': copiedFrom,
            'diagDate': diagDate,
            'forecasted': forecasted,
            'imported': imported,
            'qFinalDict': qFinalDict,
            'running': False,
            'prodPref': prodPref,
            'type': type_,
            'isForecastedLibrary': isForecastedLibrary,
            '__v': __v
        }

        optional_set = {}
        # Provides access to insert optional fields w/out default values.
        optional_set.update({k: v for k, v in kwargs.items()})
        check_None_and_update(optional_set, 'libUserInput', libUserInput)
        check_None_and_update(optional_set, 'settings', settings)
        check_None_and_update(optional_set, 'isForecastedLibrary', isForecastedLibrary)
        check_None_and_update(optional_set, 'tags', tags)
        if runDate is not None:
            optional_set['runDate'] = runDate
        else:
            optional_set['runDate'] = cur_time

        mandatory_set.update(optional_set)
        return mandatory_set

    def get_forecast_update_body(self,
                                 forecast_id: ObjectId,
                                 name: str = None,
                                 project: ObjectId = None,
                                 user: ObjectId = None,
                                 wells: list = None,
                                 comparisonIds: dict = None,
                                 copiedFrom: ObjectId = None,
                                 diagDate: datetime.datetime = None,
                                 forecasted: bool = None,
                                 imported: bool = None,
                                 qFinalDict: dict = None,
                                 libUserInput: dict = None,
                                 settings: dict = None,
                                 prodPref: str = None,
                                 type_: str = None,
                                 isForecastedLibrary: bool = None,
                                 tags: list = None,
                                 runDate: datetime.datetime = None,
                                 __v: int = None,
                                 **kwargs) -> UpdateOne:

        # Updates forecast document.
        cur_time = datetime.datetime.utcnow()
        match = {'_id': forecast_id}
        mandatory_set = {'updatedAt': cur_time}

        optional_set = {}
        # Provides access to update optional fields w/out default values
        optional_set.update({k: v for k, v in kwargs.items()})
        check_None_and_update(optional_set, '__v', __v)
        check_None_and_update(optional_set, 'runDate', runDate)
        check_None_and_update(optional_set, 'type', type_)
        check_None_and_update(optional_set, 'prodPref', prodPref)
        check_None_and_update(optional_set, 'qFinalDict', qFinalDict)
        check_None_and_update(optional_set, 'imported', imported)
        check_None_and_update(optional_set, 'forecasted', forecasted)
        check_None_and_update(optional_set, 'diagDate', diagDate)
        check_None_and_update(optional_set, 'copiedFrom', copiedFrom)
        check_None_and_update(optional_set, 'comparisonIds', comparisonIds)
        check_None_and_update(optional_set, 'wells', wells)
        check_None_and_update(optional_set, 'user', user)
        check_None_and_update(optional_set, 'project', project)
        check_None_and_update(optional_set, 'name', name)
        check_None_and_update(optional_set, 'libUserInput', libUserInput)
        check_None_and_update(optional_set, 'settings', settings)
        check_None_and_update(optional_set, 'isForecastedLibrary', isForecastedLibrary)
        check_None_and_update(optional_set, 'tags', tags)

        mandatory_set.update(optional_set)
        return UpdateOne(match, {'$set': mandatory_set})

    def write_forecast_data_to_db(self, bulk_list):
        num_updates = int(np.ceil(len(bulk_list) / 500))
        results = []
        for i in range(num_updates):
            this_bulk = bulk_list[(i * 500):(i + 1) * 500]
            result = self.context.db['forecast-datas'].bulk_write(this_bulk)
            results += [result.bulk_api_result]

        return results

    def write_forecast_to_db(self, forecast):
        results = []
        if isinstance(forecast, dict):
            results = self.context.forecasts_collection.insert_one(forecast)
        elif isinstance(forecast, list):
            num_updates = int(np.ceil(len(forecast) / 500))
            for i in range(num_updates):
                this_bulk = forecast[(i * 500):(i + 1) * 500]
                result = self.context.db['forecast-datas'].bulk_write(this_bulk)
                results += [result.bulk_api_result]
        return results
