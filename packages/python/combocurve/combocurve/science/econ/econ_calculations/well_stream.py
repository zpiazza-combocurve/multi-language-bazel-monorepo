import numpy as np

from combocurve.science.econ.econ_calculations.calculation import EconCalculation
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults
from combocurve.science.econ.econ_model_rows_process import rows_process


class WellStream(EconCalculation):
    def __init__(self, date_dict, risk_model, well_header_info):
        self.date_dict = date_dict
        self.well_stream = risk_model.get('well_stream', EconModelDefaults.well_stream())
        self.primary_product = well_header_info.get('primary_product')

    def result(self, ownership_dict_by_phase):
        well_count = self._well_stream_pre(ownership_dict_by_phase)
        return {'well_count': well_count}

    def _get_main_phase_wi_nri(self, ownership_dict_by_phase):
        main_phase = 'oil'
        if self.primary_product:
            primary_product = self.primary_product.lower()
            if 'o' in primary_product:
                main_phase = 'oil'
            elif 'g' in primary_product:
                main_phase = 'gas'

        main_phase_wi = ownership_dict_by_phase[main_phase]['wi']
        main_phase_nri = ownership_dict_by_phase[main_phase]['nri']

        return main_phase_wi, main_phase_nri

    def _well_stream_pre(self, ownership_dict_by_phase):
        fpd = self.date_dict['first_production_date']
        cf_start_date = self.date_dict['cf_start_date']
        cf_end_date = self.date_dict['cf_end_date']

        rows = self.well_stream['rows']

        row_keys = rows[0].keys()
        value_key = list(set(row_keys) & set(['count', 'percentage']))[0]

        if value_key == 'count':
            gross_well_count = rows_process(rows, self.date_dict, fpd, cf_start_date, cf_end_date, value_key)
        else:
            base_value = rows[0][value_key]
            pct_rows = [{**rows[0], value_key: 100}, *rows[1:]]
            pct_monthly_para = rows_process(pct_rows, self.date_dict, fpd, cf_start_date, cf_end_date, value_key, 0)
            gross_well_count = np.round(np.multiply(np.divide(pct_monthly_para, 100), base_value), 8)

        main_phase_wi, main_phase_nri = self._get_main_phase_wi_nri(ownership_dict_by_phase)
        wi_well_count = np.multiply(gross_well_count, main_phase_wi)
        nri_well_count = np.multiply(gross_well_count, main_phase_nri)

        return {
            'gross_well_count': gross_well_count,
            'wi_well_count': wi_well_count,
            'nri_well_count': nri_well_count,
        }


class GroupWellStream(EconCalculation):
    def __init__(
        self,
        group_df,
    ):
        self.group_df = group_df

    def result(self):
        return {
            'well_count': {
                'gross_well_count': self.group_df['gross_well_count'].to_numpy(),
                'wi_well_count': self.group_df['wi_well_count'].to_numpy(),
                'nri_well_count': self.group_df['nri_well_count'].to_numpy(),
            }
        }
