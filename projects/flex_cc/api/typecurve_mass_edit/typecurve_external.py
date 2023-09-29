import numpy as np
import pandas as pd
from combocurve.services.type_curve.tc_volume_export_service import TypeCurveVolumeExportService
from combocurve.shared.constants import PHASES
from api.typecurve_mass_edit.typecurve_workflow_export import TypeCurveWorkflowExport


class TypeCurveExternalExport:
    def __init__(self, context):
        self.context = context

    def tc_volumes(self, p_req):
        is_monthly = p_req.get('is_monthly', True)
        skip = p_req.get('skip')
        limit = p_req.get('limit')
        volumes_req = {
            'tc_id': p_req['tc_id'][0],
            'start_time': (np.datetime64('today').astype('datetime64[Y]') - np.datetime64('1900-01-01')).astype(int),
            'phases': PHASES,
            'base_phase_series': 'best'
        }
        tc_vol_export = TypeCurveVolumeExportService(self.context, **volumes_req)
        daily_data_sheet, monthly_data_sheet, _ = tc_vol_export.generate_dataframes(wells_data=False)

        if is_monthly:
            volumes_list = monthly_data_sheet.to_dict(orient="records")
        else:
            volumes_list = daily_data_sheet.to_dict(orient="records")

        return self.skip_and_limit(volumes_list, skip, limit)

    def tc_rep_wells(self, p_req):
        skip = p_req.get('skip')
        limit = p_req.get('limit')
        tc_workflow_export = TypeCurveWorkflowExport(self.context)
        tc_rep_normalization_data, _ = tc_workflow_export.get_type_curve_data(p_req)
        tc_rep_dict, _ = tc_workflow_export.tc_rep_sheet(tc_rep_normalization_data)
        df_tc_rep = pd.DataFrame(tc_rep_dict)
        wells_list = df_tc_rep.to_dict(orient="records")

        return self.skip_and_limit(wells_list, skip, limit)

    def skip_and_limit(self, ret_list, skip, limit):
        if (skip := self.number_check(skip)) is not None:
            if skip >= len(ret_list):
                return []
            else:
                ret_list = ret_list[skip:]

        if (limit := self.number_check(limit)) is not None:
            if limit >= len(ret_list):
                return ret_list
            else:
                ret_list = ret_list[:limit]

        return ret_list

    def number_check(self, number):
        if type(number) == int or type(number) == float:
            return int(number)
        else:
            return None
