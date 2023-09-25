import importlib

RATE_CUM_MODEL_MAPPING = {
    'segment_arps_4_wp': 'segment_arps_4_free_peak',
    'segment_arps_4_wp_free_b1': 'segment_arps_4_free_peak_free_b1',
    'segment_arps_inc_arps_4_wp_free_b1': 'segment_arps_inc_arps_4_free_peak_free_b1',
    'exp_arps_modified_wp': 'exp_arps_modified_free_peak',
    'exp_inc_exp_dec': 'exp_inc_exp_dec_free_peak',
    'flat_arps_modified': 'flat_arps_modified',
}


class model_manager:
    def __init__(self):
        self.model_name_s = [
            'arps_modified_wp', 'arps_wp', 'exp_arps_modified_wp', 'exp_arps_wp', 'exp_free_peak', 'exp_wp',
            'segment_arps_4_wp', 'segment_arps_4_wp_free_b1', 'segment_arps_4_wp_free_slope', 'flat',
            'arps_modified_free_peak', 'exp_dec_arps_modified_free_peak_same', 'arps_exp_dec',
            'exp_dec_arps_modified_free_peak_different', 'arps_inc', 'arps_fulford', 'arps_modified_fulford',
            'arps_linear_flow_fulford', 'arps_modified_fp_fulford', 'flat_arps_modified',
            'segment_arps_inc_arps_4_wp_free_b1', 'exp_inc_exp_dec'
        ]
        models = {}
        for model_name in self.model_name_s:
            module_name = 'combocurve.science.forecast_models.models.' + model_name
            this_module = importlib.import_module(module_name)
            this_model_instance = getattr(this_module, 'model_' + model_name)()
            models[model_name] = this_model_instance

        self.cum_model_name_s = list(RATE_CUM_MODEL_MAPPING.values())
        for model_name in self.cum_model_name_s:
            module_name = 'combocurve.science.forecast_models.models.' + model_name
            this_module = importlib.import_module(module_name)
            this_model_instance = getattr(this_module, 'model_' + model_name)()
            models[model_name] = this_model_instance

        # self.cum_model_name_s = ['exp']
        # for model_name in self.cum_model_name_s:
        #     module_name = 'combocurve.science.forecast_models.cum_models.cum_' + model_name
        #     this_module = importlib.import_module(module_name)
        #     this_model_instance = getattr(this_module, 'model_cum_' + model_name)()
        #     models['cum_' + model_name] = this_model_instance

        self.ratio_t_model_name_s = [
            'exp', 'exp_incline', 'flat', 'linear', 'exp_decline', 'exp_incline_flat', 'linear_flat', 'arps_inc'
        ]
        for model_name in self.ratio_t_model_name_s:
            module_name = 'combocurve.science.forecast_models.ratio_t_models.ratio_t_' + model_name
            this_module = importlib.import_module(module_name)
            this_model_instance = getattr(this_module, 'model_ratio_t_' + model_name)()
            models['ratio_t_' + model_name] = this_model_instance

        self.models = models


mm = model_manager()
