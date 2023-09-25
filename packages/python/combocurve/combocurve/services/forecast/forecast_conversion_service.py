from bson.objectid import ObjectId
from pymongo import InsertOne
import datetime


class ForecastConversionService(object):
    def __init__(self, context):
        self.context = context

    def convert(self, params):
        # {
        #     'original_forecast_type',
        #     'original_forecast_id',
        #     'target_forecast_id',
        #     'well_ids',
        #     'target_forecast_name'
        # }
        original_forecast_type = params['original_forecast_type']
        original_forecast_id = ObjectId(params['original_forecast_id_str'])
        target_forecast_id = ObjectId(params['target_forecast_id_str'])
        well_ids = list(map(ObjectId, params['well_ids_str']))

        target_forecast_type = {
            'probabilistic': 'deterministic',
            'deterministic': 'probabilistic'
        }.get(original_forecast_type)

        original_forecast_collection = {
            'probabilistic': self.context.forecast_datas_collection,
            'deterministic': self.context.deterministic_forecast_datas_collection
        }.get(original_forecast_type)

        forecast_phase_data = list(
            original_forecast_collection.aggregate([{
                '$match': {
                    'forecast': original_forecast_id,
                    'well': {
                        '$in': well_ids
                    }
                }
            }]))

        # TODO: Refactor code to utilize insert methods from forecast services
        inserts = []
        for phase_data in forecast_phase_data:
            if target_forecast_type == 'deterministic':
                this_insert = self._convert_prob_to_det(phase_data, target_forecast_id)
            else:
                this_insert = self._convert_det_to_prob(phase_data, target_forecast_id)
            inserts += [InsertOne(this_insert)]

        if target_forecast_type == 'deterministic':
            insert_service = self.context.deterministic_forecast_service
        else:
            insert_service = self.context.forecast_service
        # return inserts
        write_results = insert_service.write_forecast_data_to_db(inserts)

        return write_results

    def _convert_prob_to_det(self, phase_data, target_forecast_id):
        # to_be_filled = [
        #     'data_freq', 'diagnostics', 'diagDate', 'expireAt', 'forecast', 'forecasted', 'forecastType',
        #     'forecastSubType', 'lastAutomaticRun', 'P_dict', 'p_extra', 'phase', 'project', 'runDate', 'well',
        #     'status', 'warning', 'ratio', 'updatedAt'
        # ]
        required = [
            'data_freq', 'forecast', 'forecasted', 'forecastType', 'forecastSubType', 'P_dict', 'ratio', 'phase',
            'project', 'well', 'ratio'
        ]

        directly_copy_list = [
            'data_freq', 'diagDate', 'expireAt', 'forecasted', 'lastAutomaticRun', 'p_extra', 'phase', 'project',
            'runDate', 'well', 'status', 'warning'
        ]
        ret = {item: phase_data[item] for item in directly_copy_list if item in phase_data}

        ret['forecast'] = target_forecast_id
        ret['P_dict'] = {'best': {'segments': [], 'diagnostics': {}}}
        if ('P_dict' in phase_data) and ('best' in phase_data['P_dict']):
            if 'segments' in phase_data['P_dict']['best']:
                ret['P_dict']['best']['segments'] = phase_data['P_dict']['best']['segments']

            if 'diagnostics' in phase_data['P_dict']['best']:
                ret['diagnostics'] = phase_data['P_dict']['best']['diagnostics']

        if phase_data['forecastType'] == 'not_forecasted':
            ret['forecastType'] = 'not_forecasted'
            ret['forecastSubType'] = None
        elif phase_data['forecastType'] == 'prob':
            ret['forecastType'] = 'rate'
            ret['forecastSubType'] = 'automatic'
        else:
            ret['forecastType'] = 'rate'
            ret['forecastSubType'] = phase_data['forecastType']

        ret['ratio'] = {'segments': [], 'diagnostics': {}, 'basePhase': None, 'x': None}
        ret['updatedAt'] = datetime.datetime.utcnow()

        for k in required:
            if k not in ret.keys():
                raise Exception('Keys are missing for the target file')
        return ret

    def _convert_det_to_prob(self, phase_data, target_forecast_id):
        # to_be_filled = [
        #     'data_freq', 'diagDate', 'expireAt', 'forecast', 'forecasted', 'forecastType',
        #     'lastAutomaticRun', 'P_dict', 'p_extra', 'phase', 'project', 'runDate', 'well', 'status',
        #     'warning', 'ratio', 'updatedAt'
        # ]

        required = [
            'data_freq', 'forecast', 'forecasted', 'forecastType', 'P_dict', 'ratio', 'phase', 'project', 'well',
            'ratio'
        ]

        directly_copy_list = ['expireAt', 'phase', 'project', 'runDate', 'well']
        ##
        ret = {item: phase_data[item] for item in directly_copy_list if item in phase_data}
        ret['forecast'] = target_forecast_id

        if phase_data['forecastType'] in ['ratio', 'stream_based']:
            ret['data_freq'] = 'monthly'
            ret['diagDate'] = None
            ret['forecasted'] = False
            ret['lastAutomaticRun'] = {'date': None, 'source': None, 'success': True}

            ret['P_dict'] = {}
            ret['p_extra'] = {}
            ret['forecastType'] = 'not_forecasted'
            ret['status'] = 'in_progress'
            ret['warning'] = {
                'status': True,
                'message': 'Tried to convert from ' + phase_data['forecastType'] + ' of deterministic forecast.'
            }

        else:
            ret['data_freq'] = phase_data['data_freq']
            ret['diagDate'] = phase_data.get('diagDate')
            ret['forecasted'] = phase_data.get('forecasted')
            ret['lastAutomaticRun'] = phase_data.get('lastAutomaticRun')
            ret['p_extra'] = phase_data.get('p_extra')
            ret['status'] = phase_data.get('status')
            ret['warning'] = phase_data.get('warning')

            if phase_data.get('forecastType') == 'not_forecasted':
                ret['P_dict'] = {}
                ret['forecastType'] = 'not_forecasted'
                ret['status'] = phase_data['status']
                ret['warning'] = phase_data['warning']
            elif phase_data.get('forecastType') == 'rate':
                ret['P_dict'] = {
                    k: {
                        'segments': phase_data['P_dict']['best']['segments'],
                        'diagnostics': phase_data.get('diagnostics')
                    }
                    for k in ['P50', 'best']
                }
                ret['P_dict'].update({
                    k: {
                        'segments': phase_data['P_dict']['best']['segments'],
                        'diagnostics': None
                    }
                    for k in ['P10', 'P90']
                })
                if phase_data.get('forecastSubType') == 'automatic' or phase_data.get('forecastSubType') == 'proximity':
                    ret['forecastType'] = 'prob'
                else:
                    ret['forecastType'] = phase_data.get('forecastSubType')

        ret['ratio'] = {'enabled': False, 'phase': 'oil', 'value': 1}
        ret['updatedAt'] = datetime.datetime.utcnow()
        for k in required:
            if k not in ret.keys():
                raise Exception('Keys are missing for the target file')
        return ret
