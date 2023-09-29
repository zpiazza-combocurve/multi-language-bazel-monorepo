import pandas as pd
import numpy as np
import io
import collections
from bson import ObjectId
from pyexcelerate import Workbook, Style, Font
from api.typecurve_mass_edit.typecurve_download import TypecurveDownload
from combocurve.services.type_curve.type_curve_service import TypeCurveService
from combocurve.services.type_curve.tc_volume_export_service import TypeCurveVolumeExportService
from combocurve.science.type_curve.TC_helper import DISPLAYED_PHASES, get_rep_wells_from_rep_init
from api.forecast_mass_edit.display_templates import segment_models
import logging
from combocurve.utils.exceptions import get_exception_info
from combocurve.shared.date import get_current_time
from combocurve.shared.constants import PHASES, MONTHLY_UNIT_TEMPLATE
from combocurve.services.files.file_helpers import make_file_os_safe
from combocurve.services.type_curve.tc_normalization_data_models import NORMALIZATION_FACTORS

TYPE_CURVES_WELL_INFO = {
    'oil_data_freq': {
        'label': 'Oil Forecast Generated On',
        'type': 'string'
    },
    'oil_forecast_type': {
        'label': 'Oil Forecast Type',
        'type': 'string'
    },
    'oil_has_forecast': {
        'label': 'Has Oil Forecast',
        'type': 'boolean'
    },
    'oil_has_data': {
        'label': 'Has Oil Data',
        'type': 'boolean'
    },
    'oil_valid': {
        'label': 'Oil Valid',
        'type': 'boolean'
    },
    'gas_data_freq': {
        'label': 'Gas Forecast Generated On',
        'type': 'string'
    },
    'gas_forecast_type': {
        'label': 'Gas Forecast Type',
        'type': 'string'
    },
    'gas_has_forecast': {
        'label': 'Has Gas Forecast',
        'type': 'boolean'
    },
    'gas_has_data': {
        'label': 'Has Gas Data',
        'type': 'boolean'
    },
    'gas_valid': {
        'label': 'Gas Valid',
        'type': 'boolean'
    },
    'water_data_freq': {
        'label': 'Water Forecast Generated On',
        'type': 'string'
    },
    'water_forecast_type': {
        'label': 'Water Forecast Type',
        'type': 'string'
    },
    'water_has_forecast': {
        'label': 'Has Water Forecast',
        'type': 'boolean'
    },
    'water_has_data': {
        'label': 'Has Water Data',
        'type': 'boolean'
    },
    'water_valid': {
        'label': 'Water Valid',
        'type': 'boolean'
    },
    'oil_eur': {
        'label': 'Oil EUR',
        'type': 'number'
    },
    'oil_eur/pll': {
        'label': 'Oil EUR/PLL',
        'type': 'number'
    },
    'gas_eur': {
        'label': 'Gas EUR',
        'type': 'number'
    },
    'gas_eur/pll': {
        'label': 'Gas EUR/PLL',
        'type': 'number'
    },
    'water_eur': {
        'label': 'Water EUR',
        'type': 'number'
    },
    'water_eur/pll': {
        'label': 'Water EUR/PLL',
        'type': 'number'
    }
}

NORMALIZATION_TYPE = {
    'power_law_fit': 'Power Law Fit',
    '1_to_1': '1-to-1 Fit',
    'linear': 'Linear Fit',
    'no_normalization': 'No Normalization'
}


class TypeCurveWorkflowExport:
    def __init__(self, context):
        self.context = context

    def format_none(self, value):
        if value is None:
            return ''
        return value

    def format_boolean(self, value):
        if value:
            return 'Yes'
        return 'No'

    def tc_summary_sheet(self, workbook, p_req, tc_rep_normalization_data, normalization_summary):
        tc_id = p_req['tc_id'][0]
        user_id = p_req['user_id']

        tc_document = self.context.type_curves_collection.find_one({'_id': ObjectId(tc_id)})
        tc_name = tc_document['name']
        tc_fits = tc_document['fits']
        try:
            tc_fits_ids = []

            for phase in tc_fits:
                if tc_fits[phase]:
                    tc_fits_ids.append(ObjectId(tc_fits[phase]))

            tc_fits_documents = list(self.context.type_curve_fits_collection.find({'_id': {'$in': tc_fits_ids}}))

            tc_fit_type_dict = {'oil': '', 'gas': '', 'water': ''}

            for this_fit in tc_fits_documents:
                if this_fit.get('P_dict'):
                    p_dict = this_fit.get('P_dict')
                    this_fit_phase = this_fit.get('phase')
                    segment_names = []
                    if 'best' in p_dict:
                        segments = p_dict['best'].get('segments')
                    elif 'P50' in p_dict:
                        segments = p_dict['P50'].get('segments')
                    elif 'P90' in p_dict:
                        segments = p_dict['P90'].get('segments')
                    else:
                        segments = p_dict['P10'].get('segments')

                    if segments:
                        for segment in segments:
                            segment_names.append(segment_models[segment['name']])

                    tc_fit_type_dict[this_fit_phase] = ' + '.join(segment_names)

            user_document = self.context.users_collection.find_one({'_id': ObjectId(user_id)})
            user_name = user_document.get('firstName', '') + ' ' + user_document.get('lastName', '')
            current_time = get_current_time(p_req.get('time_zone'))
            ws = workbook.new_sheet("TC Summary")

            ws.set_cell_value(2, 4, 'Type Curve Overview')
            ws.set_cell_style(2, 4, Style(font=Font(bold=True)))

            ws.set_cell_value(4, 2, 'Creation Date')
            ws.set_cell_value(5, 2, 'Engineer')
            ws.set_cell_value(6, 2, 'Type Curve Name')

            ws.set_cell_value(4, 6, current_time.date())
            ws.set_cell_value(5, 6, user_name)
            ws.set_cell_value(6, 6, tc_name)

            rep_n_summary = self.get_rep_normalization_summary(tc_rep_normalization_data)

            ws.set_cell_value(8, 2, 'Representative Wells')
            ws.set_cell_style(8, 2, Style(font=Font(bold=True)))

            ws.set_cell_value(9, 2, 'Total Wells')
            ws.set_cell_value(9, 3, rep_n_summary['total_wells'])

            row = 10
            for phase in PHASES:
                displayed_phase = phase.capitalize()
                ws.set_cell_value(row, 2, f'Included ({displayed_phase})')
                ws.set_cell_value(row, 3, rep_n_summary[f'{phase}_rep'])
                units = MONTHLY_UNIT_TEMPLATE[f'{phase}_eur']
                ws.set_cell_value(row, 9, f'EUR Average ({displayed_phase}) ({units})')
                ws.set_cell_value(row, 10, rep_n_summary[f'{phase}_eur_avg'])
                row += 1
                ws.set_cell_value(row, 2, f'Excluded ({displayed_phase})')
                ws.set_cell_value(row, 3, rep_n_summary[f'{phase}_not_rep'])
                row += 1
            row += 1
            ws.set_cell_value(row, 2, 'Normalization/Fit Information')
            ws.set_cell_style(row, 2, Style(font=Font(bold=True)))
            row += 1
            ws.set_cell_value(row, 2, 'Normalization Used')
            ws.set_cell_value(row, 3, normalization_summary['has_normalization'])
            row += 1
            for phase in PHASES:
                ws.set_cell_value(row, 2, f'Normalization Type ({phase.capitalize()})')
                ws.set_cell_value(row, 3, normalization_summary[phase])
                row += 1
            for phase in PHASES:
                ws.set_cell_value(row, 2, f'Fit Type ({phase.capitalize()})')
                ws.set_cell_value(row, 3, tc_fit_type_dict[phase])
                row += 1

        except Exception as e:
            tc_summary_error_sheet, tc_summary_error_sheet_headers = self._generate_failure_log('TC Summary', e, tc_id)
            workbook.new_sheet('TC Summary Error',
                               [tc_summary_error_sheet_headers] + tc_summary_error_sheet.values.tolist())

        file_name = make_file_os_safe(f'{tc_name}-workflow-download-{current_time.strftime("%Y-%m-%d-%H-%M-%S-%f")}')

        return file_name

    def get_rep_normalization_summary(self, tc_rep_normalization_data):
        ret = {
            'total_wells': 0,
            'oil_rep': 0,
            'gas_rep': 0,
            'water_rep': 0,
            'oil_not_rep': 0,
            'gas_not_rep': 0,
            'water_not_rep': 0,
            'oil_eur': 0,
            'gas_eur': 0,
            'water_eur': 0,
            'oil_eur_avg': '',
            'gas_eur_avg': '',
            'water_eur_avg': ''
        }

        if not tc_rep_normalization_data:
            return ret

        ret['total_wells'] = len(tc_rep_normalization_data)

        for tc_id in tc_rep_normalization_data:
            tc_r = tc_rep_normalization_data[tc_id]
            for phase in PHASES:
                if tc_r[f'{phase}_rep'] == 'Yes':
                    ret[f'{phase}_rep'] += 1
                    if tc_r[f'{phase}_eur']:
                        ret[f'{phase}_eur'] += tc_r[f'{phase}_eur']

        for phase in PHASES:
            ret[f'{phase}_not_rep'] = ret['total_wells'] - ret[f'{phase}_rep']
            if ret[f'{phase}_rep']:
                ret[f'{phase}_eur_avg'] = round(ret[f'{phase}_eur'] / ret[f'{phase}_rep'])
            else:
                ret[f'{phase}_eur_avg'] = ''

        return ret

    def type_curve_parameters_sheet(self, p_req):
        tc_params_export = TypecurveDownload(self.context)

        tc_req = {
            'tc_id': p_req.get('tc_id'),
            'user_id': p_req.get('user_id'),
            'project_id': p_req.get('project_id'),
            'adjust_segment': p_req.get('adjust_segment', False)
        }

        tc_params = tc_params_export.download(tc_req, get_data=True)
        parameters_dict = {
            'project_name': [],
            'TC Name': [],
            'tc_id': [],
            'inptID': [],
            'chosenID': [],
            'api10': [],
            'api12': [],
            'api14': [],
            'aries_id': [],
            'phdwin_id': [],
            'phase': [],
            'tc_life': [],
            'align': [],
            'normalize': [],
            'resolution': [],
            'eur': [],
            'fitType': [],
            'Base Phase': [],
            'series': [],
            'segment': [],
            'name': [],
            'start_idx': [],
            'end_idx': [],
            'q_start': [],
            'q_end': [],
            'c': [],
            'D_eff': [],
            'D': [],
            'b': [],
            'target_D_eff_sw': [],
            'realized_D_eff_sw': [],
            'sw_idx': [],
            'q_sw': [],
            'k': []
        }

        parameters_headers = [
            "Project Name", "TC Name", "TC ID", "Rep Well INPT ID", "Rep Well List Chosen ID", "Rep Well API10",
            "Rep Well API12", "Rep Well API14", "Rep Well List Aries ID", "Rep Well List PHDwin ID", "Phase",
            "TC Life (Year)", "Align Peak", "Normalization", "Resolution", "EUR (MBBL,MMCF)", "Fit Type", "Base Phase",
            "Series", "Segment", "Segment Type", "Start of Period (Day)", "End of Period (Day)",
            "q Start (BBL/D, MCF/D, BBL/MCF, MCF/BBL, BBL/BBL)", "q End (BBL/D, MCF/D, BBL/MCF, MCF/BBL, BBL/BBL)",
            "Flat Value (BBL/D, MCF/D, BBL/MCF, MCF/BBL, BBL/BBL)", "Di Eff-Sec %", "Di Nominal", "b", "D Sw-Eff-Sec %",
            "Realized D Sw-Eff-Sec %", "Sw-Day (Day)", "q Sw (BBL/D, MCF/D, BBL/MCF, MCF/BBL, BBL/BBL)",
            "Slope (BBL/MCF/D, MCF/BBL/D, BBL/BBL/D)"
        ]

        for this_fit in tc_params:
            for key in parameters_dict:
                parameters_dict[key].append(this_fit.get(key, ''))

        return parameters_dict, parameters_headers

    def get_type_curve_data(self, p_req):
        type_curve_service = TypeCurveService(self.context)
        tc_id = p_req['tc_id'][0]
        items = ['header', 'forecast_info', 'data_info', 'production', 'eur', 'assignment', 'valid']
        header_items = [
            'first_fluid_volume', 'first_prop_weight', 'perf_lateral_length', 'refrac_fluid_volume',
            'refrac_prop_weight', 'total_fluid_volume', 'total_prop_weight', 'first_fluid_per_perforated_interval',
            'refrac_fluid_per_perforated_interval', 'total_fluid_per_perforated_interval', 'first_proppant_per_fluid',
            'first_proppant_per_perforated_interval', 'refrac_proppant_per_fluid',
            'refrac_proppant_per_perforated_interval', 'total_proppant_per_fluid',
            'total_proppant_per_perforated_interval', 'acre_spacing', 'stage_spacing', 'hz_well_spacing_any_zone',
            'hz_well_spacing_same_zone', 'vt_well_spacing_any_zone', 'vt_well_spacing_same_zone', 'true_vertical_depth',
            'state', 'county', 'landing_zone', 'api14', 'well_name', 'well_number'
        ]
        tc_rep_init_data = type_curve_service.tc_rep_init({
            'tc_id': tc_id,
            'items': items,
            'header_items': header_items
        })
        get_rep_wells_from_rep_init(self.context, tc_id, tc_rep_init_data)

        well_ids = []

        for tc_well_data in tc_rep_init_data:
            well_ids.append(ObjectId(tc_well_data['well_id']))

        match = {'typeCurve': ObjectId(tc_id), 'well': {'$in': well_ids}}

        tc_normalization_pipeline = [{
            '$match': match
        }, {
            '$lookup': {
                'from':
                'type-curve-normalizations',
                'let': {
                    'well_phase': '$phase',
                    'well_typeCurve': '$typeCurve'
                },
                'pipeline': [{
                    '$match': {
                        '$expr': {
                            '$and': [{
                                '$eq': ['$$well_phase', '$phase']
                            }, {
                                '$eq': ["$$well_typeCurve", "$typeCurve"]
                            }]
                        }
                    }
                }],
                'as':
                "normalization_details"
            }
        }]
        tc_normalization_data = list(
            self.context.type_curve_normalization_wells_collection.aggregate(tc_normalization_pipeline))

        tc_normalization_info_by_well = collections.defaultdict(dict)
        normalization_summary = {'has_normalization': 'No', 'normalization_type': ' '} | {p: '' for p in PHASES}

        for tc_n in tc_normalization_data:
            phase = tc_n['phase']

            if mults := tc_n.get('multipliers'):
                tc_normalization_info_by_well[str(tc_n['well'])][f'{phase}_eur_multiplier'] = mults['eur']
                tc_normalization_info_by_well[str(tc_n['well'])][f'{phase}_qPeak_multiplier'] = mults['qPeak']
                normalization_step = tc_n.get('normalization_details', [{}])[0]
                if normalization_step:
                    steps_detail = normalization_step.get('steps', {})
                    for i, norm_factor in enumerate(NORMALIZATION_FACTORS):
                        n_type, n_equation = self.get_normalization_equation(steps_detail.get(norm_factor))

                        tc_normalization_info_by_well[str(tc_n['well'])][f'{phase}_{norm_factor}_model'] = n_type
                        tc_normalization_info_by_well[str(tc_n['well'])][f'{phase}_{norm_factor}_equation'] = n_equation

                        if n_type and n_type != 'No normalization':
                            normalization_summary['has_normalization'] = 'Yes'
                            if i == 0:
                                normalization_summary[phase] = f'{norm_factor}: {n_type}'
                            else:
                                normalization_summary[phase] += f', {norm_factor}: {n_type}'

        tc_rep_normalization_data = collections.defaultdict(dict)

        well_headers = [
            'well_name', 'well_number', 'api14', 'total_proppant_per_perforated_interval',
            'total_fluid_per_perforated_interval', 'perf_lateral_length', 'true_vertical_depth', 'state', 'county',
            'landing_zone'
        ]

        for tc_r in tc_rep_init_data:
            well_id = tc_r['well_id']
            for header in well_headers:
                tc_rep_normalization_data[well_id][header] = self.format_none(tc_r['header'].get(header))

            for key in tc_r['eur']:
                tc_rep_normalization_data[well_id][f'{key}_eur'] = tc_r['eur'][key]
                pll = tc_r['header'].get('perf_lateral_length', 0)
                if pll and pll != 0:
                    tc_rep_normalization_data[well_id][f'{key}_eur/pll'] = tc_r['eur'][key] / pll
                else:
                    tc_rep_normalization_data[well_id][f'{key}_eur/pll'] = ''

            for key in tc_r['valid']:
                tc_rep_normalization_data[well_id][f'{key}_valid'] = self.format_boolean(tc_r['valid'][key])

            for key in tc_r['rep']:
                tc_rep_normalization_data[well_id][f'{key}_rep'] = self.format_boolean(tc_r['rep'][key])

            for phase in tc_r['data_info']:
                if phase in ['oil', 'gas', 'water']:
                    tc_rep_normalization_data[well_id][f'{phase}_has_data'] = self.format_boolean(
                        tc_r['data_info'][phase]['has_data'])

            for phase in tc_r['forecast_info']:
                tc_rep_normalization_data[well_id][f'{phase}_has_forecast'] = self.format_boolean(
                    tc_r['forecast_info'][phase]['has_forecast'])
                tc_rep_normalization_data[well_id][f'{phase}_data_freq'] = tc_r['forecast_info'][phase][
                    'forecast_data_freq']
                tc_rep_normalization_data[well_id][f'{phase}_forecast_type'] = tc_r['forecast_info'][phase][
                    'forecast_type']

            tc_rep_normalization_data[well_id].update(tc_normalization_info_by_well[well_id])

        return tc_rep_normalization_data, normalization_summary

    def get_normalization_equation(self, normalization_steps):
        ret_type = ''
        ret_equation = ''
        if normalization_steps:
            n_type = normalization_steps.get('type')
            ret_type = NORMALIZATION_TYPE.get(n_type, 'No Normalization')
            a, b = normalization_steps.get('aValue'), normalization_steps.get('bValue')
            if n_type == 'linear':
                ret_equation = f'y = {a} * x + {b}'

            elif n_type == 'power_law_fit':
                ret_equation = f'y = {a} * x ^ {b}'

        return ret_type, ret_equation

    def tc_rep_sheet(self, tc_rep_normalization_data):
        tc_rep_dict = {
            'well_name': [],
            'well_number': [],
            'api14': [],
            'oil_data_freq': [],
            'oil_forecast_type': [],
            'oil_has_forecast': [],
            'oil_has_data': [],
            'oil_valid': [],
            'oil_rep': [],
            'gas_data_freq': [],
            'gas_forecast_type': [],
            'gas_has_forecast': [],
            'gas_has_data': [],
            'gas_valid': [],
            'gas_rep': [],
            'water_data_freq': [],
            'water_forecast_type': [],
            'water_has_forecast': [],
            'water_has_data': [],
            'water_valid': [],
            'water_rep': [],
            'oil_eur': [],
            'oil_eur/pll': [],
            'gas_eur': [],
            'gas_eur/pll': [],
            'water_eur': [],
            'water_eur/pll': []
        }

        tc_rep_headers = [
            'Well Name', 'Well Number', 'API 14', 'Oil Forecast Generated On', 'Oil Forecast Type', 'Has Oil Forecast',
            'Has Oil Data', 'Oil Valid', 'Oil Rep', 'Gas Forecast Generated On', 'Gas Forecast Type',
            'Has Gas Forecast', 'Has Gas Data', 'Gas Valid', 'Gas Rep', 'Water Forecast Generated On',
            'Water Forecast Type', 'Has Water Forecast', 'Has Water Data', 'Water Valid', 'Water Rep', 'Oil EUR (MBBL)',
            'Oil EUR/PLL (BBL/FT)', 'Gas EUR (MMCF)', 'Gas EUR/PLL (MCF/FT)', 'Water EUR (MBBL)',
            'Water EUR/PLL (BBL/FT)'
        ]

        for tc_well_data in tc_rep_normalization_data:
            for key in tc_rep_dict:
                tc_rep_dict[key].append(tc_rep_normalization_data[tc_well_data].get(key, ''))

        for key in ['oil_eur', 'gas_eur', 'water_eur']:
            tc_rep_dict[key] = list(np.array(tc_rep_dict[key]) / 1000)

        return tc_rep_dict, tc_rep_headers

    def tc_normalization_sheet(self, tc_rep_normalization_data):
        tc_normalization_dict = {
            'well_name': [],
            'well_number': [],
            'api14': [],
            'oil_eur_multiplier': [],
            'oil_qPeak_multiplier': [],
            'oil_eur_model': [],
            'oil_qPeak_model': [],
            'oil_eur_equation': [],
            'oil_qPeak_equation': [],
            'oil_eur': [],
            'oil_eur/pll': [],
            'gas_eur_multiplier': [],
            'gas_qPeak_multiplier': [],
            'gas_eur_model': [],
            'gas_qPeak_model': [],
            'gas_eur_equation': [],
            'gas_qPeak_equation': [],
            'gas_eur': [],
            'gas_eur/pll': [],
            'water_eur_multiplier': [],
            'water_qPeak_multiplier': [],
            'water_eur_model': [],
            'water_qPeak_model': [],
            'water_eur_equation': [],
            'water_qPeak_equation': [],
            'water_eur': [],
            'water_eur/pll': [],
            'total_proppant_per_perforated_interval': [],
            'total_fluid_per_perforated_interval': [],
            'perf_lateral_length': [],
            'true_vertical_depth': [],
            'state': [],
            'county': [],
            'landing_zone': []
        }

        tc_normalization_headers = [
            'Well Name', 'Well Number', 'API 14', 'Oil EUR Multiplier', 'Oil Peak Rate Multiplier',
            'Oil EUR Normalization Type', 'Oil Peak Rate Normalization Type', 'Oil EUR Fit Function',
            'Oil Peak Rate Fit Function', 'Oil EUR (BBL)', 'Oil EUR/PLL (BBL/FT)', 'Gas EUR Multiplier',
            'Gas Peak Rate Multiplier', 'Gas EUR Normalization Type', 'Gas Peak Rate Normalization Type',
            'Gas EUR Fit Function', 'Gas Peak Rate Fit Function', 'Gas EUR (MCF)', 'Gas EUR/PLL (MCF/FT)',
            'Water EUR Multiplier', 'Water Peak Rate Multiplier', 'Water EUR Normalization Type',
            'Water Peak Rate Normalization Type', 'Water EUR Fit Function', 'Water Peak Rate Fit Function',
            'Water EUR (BBL)', 'Water EUR/PLL (BBL/FT)', 'Prop/PLL (LB/FT)', 'Fluid/PLL (BBL/FT)', 'PLL (FT)',
            'True Vertical Depth (FT)', 'State', 'County/Parish', 'Landing Zone'
        ]

        for tc_well_data in tc_rep_normalization_data:
            for key in tc_normalization_dict:
                tc_normalization_dict[key].append(tc_rep_normalization_data[tc_well_data].get(key, ''))

        return tc_normalization_dict, tc_normalization_headers

    def tc_volumes_sheet(self, wb, p_req):

        volumes_req = {
            'tc_id': p_req['tc_id'][0],
            'start_time': (np.datetime64('today').astype('datetime64[Y]') - np.datetime64('1900-01-01')).astype(int),
            'phases': PHASES,
            'base_phase_series': 'best'
        }
        tc_vol_export = TypeCurveVolumeExportService(self.context, **volumes_req)
        daily_data_sheet, monthly_data_sheet, well_data_sheets = tc_vol_export.generate_dataframes()

        wb.new_sheet('TC Daily Fits ', [daily_data_sheet.columns.tolist()] + daily_data_sheet.values.tolist())
        wb.new_sheet('TC Monthly Fits', [monthly_data_sheet.columns.tolist()] + monthly_data_sheet.values.tolist())
        for phase in PHASES:
            if well_data_sheets[phase] is not None:
                wb.new_sheet(f'TC Well Fits ({DISPLAYED_PHASES[phase]})',
                             [well_data_sheets[phase].columns.tolist()] + well_data_sheets[phase].values.tolist())

    def tc_workflow_export(self, p_req):
        wb = Workbook()
        tc_id = p_req['tc_id'][0]

        try:
            tc_params, tc_params_headers = self.type_curve_parameters_sheet(p_req)
        except Exception as e:
            tc_params, tc_params_headers = self._generate_failure_log('TC Fit - Parameters', e, tc_id)

        try:
            tc_rep_normalization_data, normalization_summary = self.get_type_curve_data(p_req)
            tc_rep_dict, tc_rep_headers = self.tc_rep_sheet(tc_rep_normalization_data)
        except Exception as e:
            tc_rep_dict, tc_rep_headers = self._generate_failure_log('TC Rep Well Download', e, tc_id)
            tc_rep_normalization_data, normalization_summary = {}, {}

        try:
            tc_normalization_dict, tc_normalization_headers = self.tc_normalization_sheet(tc_rep_normalization_data)
        except Exception as e:
            tc_normalization_dict, tc_normalization_headers = self._generate_failure_log(
                'Normalization Table', e, tc_id)

        df_tc_params = pd.DataFrame(tc_params)
        df_tc_rep = pd.DataFrame(tc_rep_dict)
        df_tc_normalization = pd.DataFrame(tc_normalization_dict)

        file_name = self.tc_summary_sheet(wb, p_req, tc_rep_normalization_data, normalization_summary)

        project_id = p_req['project_id']
        file_buffer = io.BytesIO()
        file_name = file_name + '.xlsx'
        content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

        wb.new_sheet('TC Rep Well Download', data=[tc_rep_headers] + df_tc_rep.values.tolist())
        wb.new_sheet('Normalization Table', data=[tc_normalization_headers] + df_tc_normalization.values.tolist())
        self.tc_volumes_sheet(wb, p_req)
        wb.new_sheet('TC Fit - Parameters', data=[tc_params_headers] + df_tc_params.values.tolist())

        wb.save(file_buffer)
        file_object = self.upload_file_buffer(file_buffer, file_name, file_name, content_type, project_id=project_id)

        return str(file_object.get('_id'))

    def upload_file_buffer(self, buffer, gcp_name, file_name, content_type, user_id=None, project_id=None):
        file_info = {'gcpName': gcp_name, 'type': content_type, 'name': file_name, 'user': user_id}

        return self.context.file_service.upload_file_from_string(
            string_data=buffer.getvalue(),
            file_data=file_info,
            user_id=user_id,
            project_id=project_id,
        )

    def _generate_failure_log(self, sheet_title: str, error: Exception, tc_id: str) -> pd.DataFrame:

        # Log error
        error_info = get_exception_info(error)
        extra = {'metadata': {'error': error_info, 'data_sheet': sheet_title, 'tc_id': tc_id}}
        logging.error(error_info['message'], extra=extra)

        # Generate user-facing warning.
        text = f"Failed to generate {sheet_title} data sheet. "
        text += "We've received a log of this error, and we'll work on it soon."
        return pd.DataFrame({text: []}), pd.DataFrame({text: []}).columns.tolist()
