from bson import ObjectId
import numpy as np
import pandas as pd
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.services.lookup_table_service import evaluate_rule, Operators
from combocurve.shared.constants import PROBABILISTIC_STR, DETERMINISTIC_STR
from combocurve.services.forecast.shared import check_None_and_update
from typing import Any

multi_seg = MultipleSegments()

PHASES = ['oil', 'gas', 'water']
PHASES_RISK_FACOTR_KEYS = {'oil': 'riskFactorOil', 'gas': 'riskFactorGas', 'water': 'riskFactorWater'}


def get_eur(tc_P_dict):
    eur_dict = {}
    for k, v in tc_P_dict.items():
        this_seg = v['segments']
        if len(this_seg):
            this_eur = multi_seg.eur(0, this_seg[0]['start_idx'] - 100, this_seg[0]['start_idx'],
                                     this_seg[-1]['end_idx'], this_seg, 'daily')
        else:
            this_eur = 0
        eur_dict[k] = this_eur

    eur_ratio = {}
    for k, v in eur_dict.items():
        if eur_dict['P50'] == 0:
            eur_ratio[k] = 1
        else:
            eur_ratio[k] = eur_dict[k] / eur_dict['P50']

    eur_ratio.pop('best')
    return eur_ratio, eur_dict


def find_segments_peak(segments: list[dict[str, Any]]):
    if not segments:
        return (np.float64(0), None)

    q_peak = segments[0]['q_start']
    peak_idx = segments[0]['start_idx']

    for segment in segments:
        if segment['q_start'] > q_peak:
            q_peak = segment['q_start']
            peak_idx = segment['start_idx']

        if segment['q_end'] > q_peak:
            q_peak = segment['q_end']
            peak_idx = segment['end_idx']

    return q_peak, peak_idx


def lookup_table_get_tc_phase_combinations(lookup_table, well_headers, phase, params):
    case_insensitive_matching = lookup_table.get('configuration', {}).get('caseInsensitiveMatching', False)
    tc_phase_combinations = []
    for rule in lookup_table['rules']:
        if rule.get('typeCurve') is None:
            continue

        valid_wells = []
        for well in well_headers:
            if well['assigned']:
                continue

            add_this_well = True
            for cond in rule['filter']['conditions']:
                cond_key = cond['key']
                cond_value = cond['value']
                cond_operator = cond['operator']
                well_value = well.get(cond_key)
                if case_insensitive_matching:
                    well_value = well_value.lower() if isinstance(well_value, str) else well_value
                    cond_value = cond_value.lower() if isinstance(cond_value, str) else cond_value

                if not evaluate_rule(well_value, cond_value, Operators(cond_operator)):
                    add_this_well = False
                    break

            if add_this_well:
                valid_wells += [str(well['_id'])]
                well['assigned'] = True

        if len(valid_wells) > 0:
            tc_id_str = str(rule['typeCurve'])
            this_tc = {**params, 'well_ids': valid_wells, 'tc_id': tc_id_str}
            check_None_and_update(this_tc, 'fpd_source', rule.get('fpdSource'))
            check_None_and_update(this_tc, 'fixed_date', rule.get('fixedDateIdx'))
            check_None_and_update(this_tc, 'apply_normalization', rule.get('applyNormalization'))
            if phase == 'all':
                this_phase_tc = {}
                for p in PHASES:
                    this_phase_tc[p] = {
                        **this_tc, 'phase': p,
                        'risk_factor': params.get('phase_risk_factors', {}).get(p, 1)
                    }
                    check_None_and_update(this_phase_tc[p], 'risk_factor', rule.get(PHASES_RISK_FACOTR_KEYS[p]))
                tc_phase_combinations += [this_phase_tc]
            else:
                this_phase_tc = {
                    phase: {
                        **this_tc, 'phase': phase,
                        'risk_factor': params.get('phase_risk_factors', {}).get(phase, 1)
                    }
                }
                check_None_and_update(this_phase_tc[phase], 'risk_factor', rule.get(PHASES_RISK_FACOTR_KEYS[phase]))
                tc_phase_combinations += [this_phase_tc]
    return tc_phase_combinations


def get_TC_reapply_dict(tc_phase_param):
    if tc_phase_param.get('tc_id') is not None:
        save_tc_id = ObjectId(tc_phase_param.get('tc_id'))
    else:
        save_tc_id = None

    if tc_phase_param.get('scheduling_id') is not None:
        save_schedule_id = ObjectId(tc_phase_param.get('scheduling_id'))
    else:
        save_schedule_id = None

    return {
        'typeCurve': save_tc_id,
        'typeCurveApplySetting': {
            'fpdSource': tc_phase_param['fpd_source'],
            'applyNormalization': tc_phase_param['apply_normalization'],
            'schedule': save_schedule_id,
            'fixedDateIdx': tc_phase_param['fixed_date'],
            'series': tc_phase_param['series'],
            'riskFactor': tc_phase_param['risk_factor']
        }
    }


def get_reapply_pipeline(forecast_id_str, forecast_collection, tc_id_str, well_ids_str, update_typecurve_only):
    match = {}
    if forecast_id_str is not None:
        match['forecast'] = ObjectId(forecast_id_str)

    if tc_id_str is not None:
        match['typeCurve'] = ObjectId(tc_id_str)
    else:
        match['typeCurve'] = {'$ne': None}

    if well_ids_str is not None:
        match['well'] = {'$in': list(map(ObjectId, well_ids_str))}

    if update_typecurve_only:
        forecast_subtype_key = {
            PROBABILISTIC_STR: 'forecastType',
            DETERMINISTIC_STR: 'forecastSubType'
        }.get(forecast_collection)
        match[forecast_subtype_key] = 'typecurve'

    project = {'forecast': 1, 'well': 1, 'phase': 1, 'typeCurve': 1, 'typeCurveApplySetting': 1}
    return [{'$match': match}, {'$project': project}]


def tc_reapply_edge_case_checking_and_update(tc_apply_setting, well, forecast, phase, tc_id):
    if type(tc_apply_setting) is not dict:
        return False
    fpd_source = tc_apply_setting.get('fpdSource')
    scheduling_id = tc_apply_setting.get('schedule')
    fixed_date = tc_apply_setting.get('fixedDateIdx')
    series = tc_apply_setting.get('series', 'best')
    apply_normalization = tc_apply_setting.get('applyNormalization', False)
    risk_factor = tc_apply_setting.get('riskFactor', 1)
    if fpd_source not in [
            'first_prod_date', 'first_prod_date_daily_calc', 'first_prod_date_monthly_calc', 'schedule', 'fixed'
    ]:
        return False

    if fpd_source == 'fixed' and type(fixed_date) is not int:
        return False

    if fpd_source == 'schedule' and type(scheduling_id) is not ObjectId:
        return False

    if type(risk_factor) not in [int, float]:
        return False

    return {
        'well': well,
        'forecast': forecast,
        'phase': phase,
        'tc_id': tc_id,
        'fpd_source': fpd_source,
        'scheduling_id': scheduling_id,
        'fixed_date': fixed_date,
        'series': series,
        'apply_normalization': apply_normalization,
        'risk_factor': risk_factor
    }


def sort_by_phase(df: pd.DataFrame, phase_order: list[str]):
    masks = [df['phase'] == phase for phase in phase_order]
    return pd.concat([df[mask] for mask in masks])
