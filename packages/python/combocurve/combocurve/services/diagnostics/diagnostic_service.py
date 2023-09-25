from bson.objectid import ObjectId
from combocurve.science.diagnostics.diagnostics import diagnostic
from combocurve.shared.mongo_utils import add_item_to_list
from combocurve.shared.constants import PROBABILISTIC_STR, DETERMINISTIC_STR, P50_STR, BEST_STR
from combocurve.services.production.production_service import reformat_forecast_group_data
from combocurve.science.diagnostics.diag_plugin import get_cst_time

FORECAST_PROJECT = {'comparisonIds': 1, 'type': 1}


class DiagnosticService(object):
    def __init__(self, context):
        self.context = context
        self.forecasts_collection = self.context.forecasts_collection
        self.deterministic_forecast_datas_collection = self.context.deterministic_forecast_datas_collection
        self.forecast_datas_collection = self.context.forecast_datas_collection

    def diagnose(self, params):
        forecast_id_str = params['forecast_id']
        forecast_id = ObjectId(forecast_id_str)

        well_id_strs = params['wells']
        well_ids = list(map(ObjectId, well_id_strs))

        phase_settings = params['phase_settings']
        diag_phases = ['oil', 'gas', 'water']

        (base_forecast_datas, base_forecast_document, valid_diag_comparison_ids,
         diag_comparison_resolutions) = self.get_diag_data(forecast_id, well_ids)
        base_forecast_type = base_forecast_document.get('type', PROBABILISTIC_STR)
        series = {PROBABILISTIC_STR: [P50_STR, BEST_STR], DETERMINISTIC_STR: [BEST_STR]}.get(base_forecast_type)
        ret = []
        diag_obj = diagnostic()
        for diag_data in base_forecast_datas:
            diag_result = diag_obj.body({
                'diag_data': diag_data,
                'phase_settings': phase_settings,
                'base_forecast_resolution': params['base_forecast_resolution'],
                'remove_zeros': params['remove_zeros'],
                'treat_nan_as_zero': params['treat_nan_as_zero'],
                'series': series,
                'diag_phases': diag_phases,
                'valid_diag_comparison_ids': valid_diag_comparison_ids,
                'diag_comparison_resolutions': diag_comparison_resolutions
            })
            ret += [diag_result]
        self._write_diag_result(ret, forecast_id, base_forecast_document.get('type', PROBABILISTIC_STR), diag_phases,
                                series)

    def _write_diag_result(self, ret, forecast_id, fType, diag_phases, series):
        is_diagnostics = True
        batch_updates = []
        for well_diag in ret:
            update_params = {
                'well_id': ObjectId(well_diag['main_id']),
                'forecast_id': ObjectId(forecast_id),
                'is_diagnostics': is_diagnostics
            }
            for phase in diag_phases:
                update_params['phase'] = phase
                update_params['diagDate'] = get_cst_time()
                if fType == 'probabilistic':
                    db_writer = self.context.forecast_service
                    P_dict = {sery: {'diagnostics': well_diag[phase][sery]} for sery in series}
                    update_params['P_dict'] = P_dict
                else:
                    db_writer = self.context.deterministic_forecast_service
                    update_params['diagnostics'] = well_diag[phase][series[0]]
                phase_update = db_writer.get_update_body(**update_params)
                batch_updates += [phase_update]
        # return batch_updates
        if batch_updates:
            db_writer.write_forecast_data_to_db(batch_updates)

    def get_diag_data(self, forecast_id, well_ids):
        well_id_strs = list(map(str, well_ids))
        #### base_forecast_datas
        headers = [
            'first_fluid_volume', 'first_prop_weight', 'perf_lateral_length', 'total_fluid_volume', 'total_prop_weight'
        ]
        (_, base_forecast_datas) = self.context.production_service.get_forecast_with_all_info(
            well_id_strs, str(forecast_id), headers)
        for well in base_forecast_datas:
            well_header = well['header']
            well_header['LL'] = well_header.get('perf_lateral_length')
            well_header.setdefault(
                'Prop', well_header.setdefault('total_prop_weight', well_header.setdefault('first_prop_weight', None)))
            well_header.setdefault(
                'Fluid', well_header.setdefault('total_fluid_volume',
                                                well_header.setdefault('first_fluid_volume', None)))
            well_header.setdefault('LL', None)

            for item in ['LL', 'Prop', 'Fluid']:
                if type(well_header[item]) not in [type(None), int, float]:
                    well_header[item] = None

        #### comparison forecast datas
        base_forecast_document = self.forecasts_collection.find_one({'_id': forecast_id}, FORECAST_PROJECT)
        diag_comparison_ids = []
        diag_comparison_resolutions = None
        diag_key = 'diagnostics'
        if base_forecast_document.get('comparisonIds') and base_forecast_document.get('comparisonIds').get(diag_key):
            diag_comparison_ids = base_forecast_document.get('comparisonIds').get(diag_key).get('ids')
            if type(diag_comparison_ids) is not list:
                diag_comparison_ids = []
            diag_comparison_resolutions = base_forecast_document.get('comparisonIds').get(diag_key).get('resolutions')
            if type(diag_comparison_resolutions) is not dict:
                diag_comparison_resolutions = None

        #### comparison datas
        comparison_forecast_documents = list(
            self.forecasts_collection.find({'_id': {
                '$in': diag_comparison_ids
            }}, FORECAST_PROJECT))
        valid_diag_comparison_ids = [v['_id'] for v in comparison_forecast_documents]

        if len(valid_diag_comparison_ids) > 0:
            for compare_forecast_document in comparison_forecast_documents:
                compare_foercast_type = compare_forecast_document['type']
                compare_forecast_id = compare_forecast_document['_id']
                group_fields = ['P_dict', 'forecastType', 'forecastSubType', 'ratio', 'data_freq', 'phase']
                group = {'data': {'$push': {field: '$' + field for field in group_fields}}}
                group['_id'] = '$well'

                use_forecast_datas_collection = {
                    PROBABILISTIC_STR: self.forecast_datas_collection,
                    DETERMINISTIC_STR: self.deterministic_forecast_datas_collection
                }.get(compare_foercast_type)

                compare_grouped_forecast_datas = list(
                    use_forecast_datas_collection.aggregate([{
                        '$match': {
                            'forecast': compare_forecast_id,
                            'well': {
                                '$in': well_ids
                            }
                        }
                    }, {
                        '$group': group
                    }]))

                compare_forecast_datas = list(map(reformat_forecast_group_data, compare_grouped_forecast_datas))
                add_item_to_list(base_forecast_datas, {str(compare_forecast_id): compare_forecast_datas},
                                 {str(compare_forecast_id): '_id'}, well_ids)

        return base_forecast_datas, base_forecast_document, valid_diag_comparison_ids, diag_comparison_resolutions
