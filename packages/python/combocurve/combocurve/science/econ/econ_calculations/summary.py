import copy
import datetime
from typing import Optional

import numpy as np
from calendar import monthrange

from combocurve.science.econ.econ_calculations.discount import (get_num_period, get_cum_days, irr, discounted_roi,
                                                                afit_discounted_roi)
from combocurve.science.econ.econ_use_forecast.adjust_forecast import add_shut_in
from combocurve.science.econ.econ_use_forecast.use_forecast import combine_prod_forecast_simple, get_pct_key_by_phase
from combocurve.science.econ.general_functions import get_py_date
from combocurve.science.econ.general_functions import (
    FORECAST_PARAMS_ONE_LINER_KEYS,
    FORECAST_PARAMS_DETAIL_COLUMNS,
    RISKING_PHASES,
    date_str_format_change,
    index_to_py_date,
    py_date_to_index,
)
from combocurve.science.econ.schemas.compositional_economics import CompositionalEconomicsRows

from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.econ.pre_process import PreProcess

from combocurve.science.econ.econ_model_rows_process import WI_100_PCT
from combocurve.science.econ.helpers import BASE_DATE_NP
from combocurve.services.feature_flags.feature_flag_list import EnabledFeatureFlags
from combocurve.shared.econ_tools.econ_model_tools import ALL_PHASES
from combocurve.science.econ.econ_calculations.stream_property import StreamProperty

MIN_OIL_EUR = 0.01
multi_seg = MultipleSegments()


def col_key_to_label(col_key):
    # remove ` character for special big query column
    col_key = col_key.replace('`', '')
    col_list = col_key.split('_')
    col_label = ''

    for k in col_list:
        col_label += ' ' + k[0].upper() + k[1:]

    return col_label[1:]


def _get_fpd_index(production_data, forecast_data, pct_key_by_phase, real_lpd_next_month_start_index, real_lpd_index):
    fpd_index = None

    for phase in ALL_PHASES:
        phase_prod = production_data[phase]
        phase_forecast = forecast_data[phase]
        phase_pct_key = pct_key_by_phase[phase]

        if phase_prod:
            prod_index = np.array(phase_prod['index'])
            if prod_index[0] >= real_lpd_next_month_start_index:
                # production after lpd
                phase_fpd_index = None
            else:
                phase_fpd_index = prod_index[0]
        elif phase_forecast:
            forecast_type = phase_forecast['forecastType']
            if forecast_type == 'ratio':
                phase_forecast_seg = phase_forecast['ratio']['segments']
            else:
                phase_forecast_seg = phase_forecast['P_dict'][phase_pct_key]['segments']
            phase_fpd_index = phase_forecast_seg[0]['start_idx']
            if phase_fpd_index > real_lpd_index:
                phase_fpd_index = None
        else:
            phase_fpd_index = None

        if phase_fpd_index and ((fpd_index and (phase_fpd_index < fpd_index)) or (fpd_index is None)):
            fpd_index = phase_fpd_index

    return fpd_index


def _shrunk_eur(production_data,
                forecast_data,
                stream_properties,
                risking_model,
                shut_in_period,
                date_dict,
                pct_key_by_phase,
                feature_flags: Optional[dict[str, bool]] = None):
    if not feature_flags:
        feature_flags = {}
    compositional_economics_enabled = feature_flags.get(EnabledFeatureFlags.roll_out_compositional_economics, False)
    date_dict = copy.copy(date_dict)  # will be modified

    yields = stream_properties['yields']
    shrinkage = stream_properties['shrinkage']
    loss_flare = stream_properties['loss_flare']

    as_of_date = date_dict['as_of_date']
    real_lpd = date_dict['cut_off_date']
    side_phase_end_date = date_dict['side_phase_end_date']

    real_lpd_index = py_date_to_index(real_lpd)
    real_lpd_next_month_start = (np.datetime64(real_lpd).astype('datetime64[M]') + 1).astype(datetime.date)
    real_lpd_next_month_start_index = py_date_to_index(real_lpd_next_month_start)

    if shut_in_period:
        forecast_data, _ = add_shut_in(forecast_data, shut_in_period, as_of_date, real_lpd)

    fpd_index = _get_fpd_index(production_data, forecast_data, pct_key_by_phase, real_lpd_next_month_start_index,
                               real_lpd_index)
    eur_dict = {}

    if not fpd_index:
        for phase in ALL_PHASES:
            eur_dict[f'{phase}_well_head_eur'] = 0

            if phase in ['oil', 'gas']:
                eur_dict[f'{phase}_shrunk_eur'] = 0
                if phase == 'gas':
                    for key in ['ngl', 'drip_condensate']:
                        eur_dict[f'{key}_shrunk_eur'] = 0

        return eur_dict

    fpd = index_to_py_date(fpd_index)
    t_real_lpd = (real_lpd.year - fpd.year) * 12 + real_lpd.month - fpd.month
    t_all = np.arange(0, t_real_lpd + 1)
    well_head_volumes = {'well_head': {'time': t_all}}

    for phase in ALL_PHASES:
        phase_prod = copy.deepcopy(production_data[phase])  # combine_prod_forecast_simple may change production_data
        phase_pct_key = pct_key_by_phase[phase]

        # generate volume from fpd to econ limit
        phase_monthly = combine_prod_forecast_simple(phase_prod, forecast_data, risking_model, phase, phase_pct_key,
                                                     fpd_index, real_lpd_index, side_phase_end_date, date_dict)

        eur_dict[f'{phase}_well_head_eur'] = sum(phase_monthly)
        well_head_volumes['well_head'][phase] = {WI_100_PCT: phase_monthly}

    for phase in ['oil', 'gas']:
        phase_monthly = well_head_volumes['well_head'][phase][WI_100_PCT]

        # overwrite cf start and end date to make it consistent with volume (phase_monthly) generated above
        date_dict['cf_start_date'] = index_to_py_date(fpd_index)
        date_dict['cf_end_date'] = real_lpd

        stream_property_calculator = StreamProperty()
        shrinkage_dict = stream_property_calculator.shrinkage_pre(shrinkage, date_dict, well_head_volumes)
        loss_flare_dict = stream_property_calculator.loss_flare_pre(loss_flare, date_dict, well_head_volumes)

        risk_dict = {
            phase: PreProcess.phase_risk_pre(risking_model[phase], date_dict, date_dict['cf_start_date'],
                                             date_dict['cf_end_date'])
            for phase in RISKING_PHASES
        }

        phase_shrinkage = shrinkage_dict[phase]

        if phase == 'oil':
            oil_loss = loss_flare_dict['oil']['loss']
            sales_volume = phase_monthly * oil_loss * phase_shrinkage
        elif phase == 'gas':
            gas_loss = loss_flare_dict['gas']['loss']
            gas_flare = loss_flare_dict['gas']['flare']
            compositionals = stream_properties.get(
                'compositional_economics') if compositional_economics_enabled else None

            yields_dict = stream_property_calculator.yields_pre(yields, date_dict, well_head_volumes,
                                                                compositionals).dict()

            gross_volume = phase_monthly * gas_loss * gas_flare
            sales_volume = gross_volume * phase_shrinkage

            for key in ['ngl', 'drip_condensate']:
                if yields_dict[key]['shrinkage'] == 'unshrunk':
                    this_sales_volume = np.multiply(
                        np.multiply(gross_volume, yields_dict[key]['value']),
                        risk_dict[key],
                    )
                elif yields_dict[key]['shrinkage'] == 'shrunk':
                    this_sales_volume = np.multiply(
                        np.multiply(sales_volume, yields_dict[key]['value']),
                        risk_dict[key],
                    )
                eur_dict[f'{key}_shrunk_eur'] = sum(this_sales_volume)

            # Compositional Economics
            compositionals = stream_properties.get('compositionals', [])
            if compositional_economics_enabled and compositionals:
                for compositional in compositionals:
                    comp_value = yields_dict.get('compositionals', {}).get(compositional, {}).get('value', [])
                    if len(comp_value) == 0:
                        continue
                    comp_sales_volume = np.multiply(sales_volume, comp_value)
                    # Todo: add risk
                    eur_dict[f'{compositional}_shrunk_eur'] = sum(comp_sales_volume)

        eur_dict[f'{phase}_shrunk_eur'] = sum(sales_volume)

    return eur_dict


def _calculate_payout(cf, date_array):
    payout_index = np.cumsum(cf) > 0
    payout = []
    duration = 0
    if np.sum(payout_index) > 0:
        payout_month = str(date_array.item(np.argmax(payout_index)))
        duration = int(
            np.datetime64(payout_month).astype('datetime64[M]')
            - np.datetime64(date_array[0]).astype('datetime64[M]')) + 1
        payout = date_str_format_change(payout_month, 'M')
    else:
        payout = None
        duration = None
    return payout, duration


def get_payout(bfit_cf, first_disc_cf, second_disc_cf, date_array):
    payout_dict = {}
    undisc_payout, undisc_duration = _calculate_payout(bfit_cf, date_array)
    first_disc_payout, first_disc_duration = _calculate_payout(first_disc_cf, date_array)
    second_disc_payout, second_disc_duration = _calculate_payout(second_disc_cf, date_array)
    payout_dict['undiscounted_payout'] = undisc_payout
    payout_dict['payout_duration'] = undisc_duration
    payout_dict['first_discount_payout'] = first_disc_payout
    payout_dict['first_discount_payout_duration'] = first_disc_duration
    payout_dict['second_discount_payout'] = second_disc_payout
    payout_dict['second_discount_payout_duration'] = second_disc_duration

    return payout_dict


def afit_get_payout(afit_cf, first_disc_cf, second_disc_cf, date_array):
    payout_dict = {}
    undisc_payout, undisc_duration = _calculate_payout(afit_cf, date_array)
    first_disc_payout, first_disc_duration = _calculate_payout(first_disc_cf, date_array)
    second_disc_payout, second_disc_duration = _calculate_payout(second_disc_cf, date_array)
    payout_dict['afit_undiscounted_payout'] = undisc_payout
    payout_dict['afit_payout_duration'] = undisc_duration
    payout_dict['afit_first_discount_payout'] = first_disc_payout
    payout_dict['afit_first_discount_payout_duration'] = first_disc_duration
    payout_dict['afit_second_discount_payout'] = second_disc_payout
    payout_dict['afit_second_discount_payout_duration'] = second_disc_duration

    return payout_dict


def get_forecast_params(forecast_data, p_series):
    forecast_params = {}
    for col_key in FORECAST_PARAMS_ONE_LINER_KEYS:
        for key in ALL_PHASES:
            if key in col_key:
                phase = key
                break
        for key in ['p10', 'p50', 'p90', 'best', 'assigned_p_series']:
            if key in col_key:
                if key == 'best':
                    pct_key = 'best'
                elif key == 'assigned_p_series':
                    pct_key = p_series
                else:
                    pct_key = key.upper()
                break
        for key in ['first', 'last']:
            if key in col_key:
                seg_idx = 0 if key == 'first' else -1
                break

        try:
            forecast_segment = forecast_data[phase]['P_dict'][pct_key]['segments'][seg_idx]
        except (Exception):
            forecast_segment = {}

        col_list = []

        for detail_key, detail_dict in FORECAST_PARAMS_DETAIL_COLUMNS.items():
            this_name = col_key_to_label(col_key) + ' ' + detail_dict['label']
            this_value = forecast_segment.get(detail_dict['db_key'])

            this_type = None

            if detail_key in ['start_date', 'end_date', 'sw_date'] and this_value is not None:
                this_date_np = BASE_DATE_NP + int(this_value)
                if this_date_np > np.datetime64('3000-01-01'):
                    this_value = None
                else:
                    this_value = date_str_format_change(this_date_np.astype(str).item())
                this_type = 'date'
            elif detail_key == 'segment_type':
                this_type = 'string'
            else:
                if this_value and abs(this_value) > 1E12:
                    this_value = None
                this_type = 'number'

            one_liner_dict = {
                'key': f'{col_key}_{detail_key}',
                'name': this_name,
                'unit': None,
                'type': this_type,
                'value': this_value,
            }

            col_list.append(one_liner_dict)

        forecast_params[col_key] = col_list

    return forecast_params


def get_eur(forecast_data,
            pct_key,
            production_data,
            stream_property_model,
            risk_model,
            shut_in_period,
            perf_lateral_length,
            date_dict,
            feature_flags: Optional[dict[str, bool]] = None):

    pct_key_by_phase, forecast_data, _ = get_pct_key_by_phase(pct_key, forecast_data)

    eur_dict = _shrunk_eur(production_data, forecast_data, stream_property_model, risk_model, shut_in_period, date_dict,
                           pct_key_by_phase, feature_flags)

    eur_pll_dict = {}

    for eur in eur_dict.keys():
        if perf_lateral_length != 0 and perf_lateral_length is not None:
            eur_pll_dict[eur + '_over_pll'] = eur_dict[eur] / perf_lateral_length
        else:
            eur_pll_dict[eur + '_over_pll'] = None

    return eur_dict, eur_pll_dict


def get_ratios(all_columns_dict):
    ratio_dict = {}
    oil_shrunk_eur = all_columns_dict['oil_shrunk_eur']
    gas_shrunk_eur = all_columns_dict['gas_shrunk_eur']
    water_well_head_eur = all_columns_dict['water_well_head_eur']

    ratio_dict['gor'] = 1000 * gas_shrunk_eur / oil_shrunk_eur if oil_shrunk_eur > MIN_OIL_EUR else None
    wor = water_well_head_eur / oil_shrunk_eur if oil_shrunk_eur > MIN_OIL_EUR else None
    ratio_dict['wor'] = wor
    ratio_dict['water_cut'] = wor / (1 + wor) if wor not in [None, -1] else None

    return ratio_dict


def get_production_analytics(is_fiscal_month, flat_econ_log):
    volumes = [
        'gross_oil_well_head_volume', 'gross_oil_sales_volume', 'wi_oil_sales_volume', 'net_oil_sales_volume',
        'gross_gas_well_head_volume', 'gross_gas_sales_volume', 'wi_gas_sales_volume', 'net_gas_sales_volume',
        'gross_boe_well_head_volume', 'gross_boe_sales_volume', 'wi_boe_sales_volume', 'net_boe_sales_volume',
        'gross_water_well_head_volume', 'gross_ngl_sales_volume', 'wi_ngl_sales_volume', 'net_ngl_sales_volume',
        'gross_drip_condensate_sales_volume', 'wi_drip_condensate_sales_volume', 'net_drip_condensate_sales_volume'
    ]
    mapper = {
        "one_month": 1,
        "three_month": 3,
        "six_month": 6,
        "one_year": 12,
        "two_year": 24,
        "three_year": 36,
        "five_year": 60,
        "ten_year": 120
    }
    suffix = ""
    if is_fiscal_month:
        mapper = {key: value * 30 for key, value in mapper.items()}
        suffix = "_daily"

    result = {}
    for volume in volumes:
        for key, value in mapper.items():
            result[f"{key}_{volume}"] = sum(flat_econ_log.get(f"{volume}{suffix}")[:value])

    # production analytics for last 1 & 3 month
    for phase in ['oil', 'gas', 'boe', 'mcfe', 'water']:
        for key in ["one_month", "three_month"]:
            result[f"last_{key}_{phase}_average"] = \
                np.average(flat_econ_log.get(f"gross_{phase}_well_head_volume{suffix}")[-mapper.get(key):])
    return result


def get_riskings(risk_model, date_dict, flat_econ_log):
    '''
        returns a dict containing monthly risking and pre_risk volumes. the risk values are first
        calculated by the gross volumes and pre_risk volumes, and are filled with the input risk
        values if the calculated risk is nan (created by zero division).
    '''
    riskings = {}

    # generate monthly risking to fill the nan values in risk calculation
    risk_dict = {
        phase: PreProcess.phase_risk_pre(risk_model[phase], date_dict, date_dict['cf_start_date'],
                                         date_dict['cf_end_date'])
        for phase in RISKING_PHASES
    }

    # get gross volumes and pre risk volumes for risk calculation
    gross_vols = {
        'water': flat_econ_log['gross_water_well_head_volume'],
        'oil': flat_econ_log['gross_oil_well_head_volume'],
        'gas': flat_econ_log['gross_gas_well_head_volume'],
        # drip_cond and ngl only have gross sales volume
        'drip_condensate': flat_econ_log['gross_drip_condensate_sales_volume'],
        'ngl': flat_econ_log['gross_ngl_sales_volume']
    }
    pre_risk_vols = dict(zip(gross_vols.keys(), [flat_econ_log[f'pre_risk_{phase}_volume'] for phase in gross_vols]))

    # calculate risking for each phase
    with np.errstate(divide='ignore', invalid='ignore'):
        calculated_risks = dict(
            zip(list(gross_vols.keys()), [gross_vols[phase] / pre_risk_vols[phase] for phase in gross_vols]))

    # save the monthly risk and pre_risk volumes in a dict to return
    for phase in RISKING_PHASES:
        riskings[f'{phase}_risk'] = np.array([
            input_risk if
            (np.isnan(calculated_risk) or calculated_risk in [float('inf'), float('-inf')]) else calculated_risk
            for calculated_risk, input_risk in zip(calculated_risks[phase], risk_dict[phase])
        ])

        riskings[f'pre_risk_{phase}_volume'] = pre_risk_vols[phase]

    return riskings


def get_stream_properties(flat_econ_log, stream_property_model, feature_flags: Optional[dict[str, bool]] = None):
    '''
        Calculates the stream properties by the following order:
        Oil: Gross Well Head -> (loss) -> Unshrunk -> (shrinkage) -> Gross Sales
        Gas: Gross Well Head -> (loss) -> Pre Flare -> (flare) -> Unshrunk -> (shrinkage) -> Gross Sales
        Drip Cond (Shrunk): Gross Gas Sales -> (yield) -> Pre Risk -> (risking) -> Gross Drip Cond Sales
        Drip Cond (Unshrunk): Unshrunk Gas -> (yield) -> Pre Risk -> (risking) -> Gross Drip Cond Sales
        NGL (Shrunk): Gross Gas Sales -> (yield) -> Pre Risk -> (risking) -> Gross NGL Sales
        NGL (Unshrunk): Unshrunk Gas -> (yield) -> Pre Risk -> (risking) -> Gross NGL Sales
    '''

    stream_properties = {}

    # for calculating pre_flare_gas_volume
    input_gas_loss = flat_econ_log['gas_loss']

    # related volumes
    gross_gas_well_head_volume = flat_econ_log['gross_gas_well_head_volume']
    gross_oil_well_head_volume = flat_econ_log['gross_oil_well_head_volume']
    pre_flare_gas_volume = np.multiply(gross_gas_well_head_volume, input_gas_loss)
    unshrunk_oil_volume = flat_econ_log['oil_pre_shrunk_volume']
    unshrunk_gas_volume = flat_econ_log['gas_pre_shrunk_volume']
    gross_gas_sales_volume = flat_econ_log['gross_gas_sales_volume']
    gross_oil_sales_volume = flat_econ_log['gross_oil_sales_volume']
    pre_risk_drip_condensate_volume = flat_econ_log['pre_risk_drip_condensate_volume']
    pre_risk_ngl_volume = flat_econ_log['pre_risk_ngl_volume']

    with np.errstate(divide='ignore', invalid='ignore'):

        # loss (oil and gas)
        stream_properties['oil_loss'] = np.nan_to_num(np.divide(unshrunk_oil_volume, gross_oil_well_head_volume))
        stream_properties['gas_loss'] = np.nan_to_num(np.divide(pre_flare_gas_volume, gross_gas_well_head_volume))

        # gas flare
        stream_properties['gas_flare'] = np.nan_to_num(np.divide(unshrunk_gas_volume, pre_flare_gas_volume))

        # shrinkage (oil and gas)
        stream_properties['oil_shrinkage'] = np.nan_to_num(np.divide(gross_oil_sales_volume, unshrunk_oil_volume))
        stream_properties['gas_shrinkage'] = np.nan_to_num(np.divide(gross_gas_sales_volume, unshrunk_gas_volume))

        # yield (ngl & drip condensate)
        yields = stream_property_model['yields']
        ngl_yields = yields['ngl']['rows'][0]
        drip_cond_yields = yields['drip_condensate']['rows'][0]
        if 'unshrunk_gas' in ngl_yields:
            stream_properties["pre_yield_gas_volume_ngl"] = unshrunk_gas_volume
            stream_properties['ngl_yield'] = np.nan_to_num(np.divide(pre_risk_ngl_volume, unshrunk_gas_volume),
                                                           posinf=0,
                                                           neginf=0)
        elif 'shrunk_gas' in ngl_yields:
            stream_properties["pre_yield_gas_volume_ngl"] = gross_gas_sales_volume
            stream_properties['ngl_yield'] = np.nan_to_num(np.divide(pre_risk_ngl_volume, gross_gas_sales_volume),
                                                           posinf=0,
                                                           neginf=0)
        if 'unshrunk_gas' in drip_cond_yields:
            stream_properties["pre_yield_gas_volume_drip_condensate"] = unshrunk_gas_volume
            stream_properties['drip_condensate_yield'] = np.nan_to_num(np.divide(pre_risk_drip_condensate_volume,
                                                                                 unshrunk_gas_volume),
                                                                       posinf=0,
                                                                       neginf=0)
        elif 'shrunk_gas' in drip_cond_yields:
            stream_properties["pre_yield_gas_volume_drip_condensate"] = gross_gas_sales_volume
            stream_properties['drip_condensate_yield'] = np.nan_to_num(np.divide(pre_risk_drip_condensate_volume,
                                                                                 gross_gas_sales_volume),
                                                                       posinf=0,
                                                                       neginf=0)

        # Compositional Economics
        if not feature_flags:
            feature_flags = {}

        if feature_flags.get(EnabledFeatureFlags.roll_out_compositional_economics, False):
            compositionals = stream_property_model.get('compositional_economics')
            parsed_compositionals = CompositionalEconomicsRows(
                rows=compositionals.get('rows', [])) if compositionals else None
            if parsed_compositionals:
                stream_properties['compositionals_yields'] = {}
                for compositional_row in parsed_compositionals.rows:
                    stream_properties['compositionals_yields'][compositional_row.category.value] = np.nan_to_num(
                        np.repeat(float(compositional_row.value), gross_gas_well_head_volume.shape))

    # store extra volumes for later use
    stream_properties['pre_flare_gas_volume'] = pre_flare_gas_volume
    stream_properties['unshrunk_oil_volume'] = unshrunk_oil_volume
    stream_properties['unshrunk_gas_volume'] = unshrunk_gas_volume

    return stream_properties


def get_irr_droi(flat_econ_log, bfit_cf, general_option_model, date_dict, date_array):
    irr_roi_dict = {}

    # irr
    disc_date = get_py_date(date_dict['discount_date'])
    disc_method = general_option_model['discount_table']['discount_method']
    cash_accrual_time = general_option_model['discount_table']['cash_accrual_time']
    py_date_array = copy.deepcopy(date_array).astype('datetime64').astype(datetime.date)

    num_period = get_num_period(disc_method)
    discount_index, discount_cum_days = get_cum_days(py_date_array, disc_date, cash_accrual_time)

    irr_roi_dict['irr'] = irr(bfit_cf, num_period, discount_index, discount_cum_days)

    # roi
    first_discount_rate = general_option_model['discount_table']['first_discount'] / 100
    second_discount_rate = general_option_model['discount_table']['second_discount'] / 100
    cfs = {k: flat_econ_log[k] for k in ['total_revenue', 'total_expense', 'total_production_tax', 'total_capex']}
    irr_roi_dict['undiscounted_roi'] = discounted_roi(cfs, flat_econ_log['net_profit'])
    irr_roi_dict['first_discount_roi'] = discounted_roi(cfs, flat_econ_log['net_profit'], first_discount_rate,
                                                        num_period, discount_index, discount_cum_days,
                                                        flat_econ_log['first_discounted_capex'])
    irr_roi_dict['second_discount_roi'] = discounted_roi(cfs, flat_econ_log['net_profit'], second_discount_rate,
                                                         num_period, discount_index, discount_cum_days,
                                                         flat_econ_log['second_discounted_capex'])
    irr_roi_dict['first_discount_roi_undiscounted_capex'] = discounted_roi(cfs, flat_econ_log['net_profit'],
                                                                           first_discount_rate, num_period,
                                                                           discount_index, discount_cum_days)
    irr_roi_dict['second_discount_roi_undiscounted_capex'] = discounted_roi(cfs, flat_econ_log['net_profit'],
                                                                            second_discount_rate, num_period,
                                                                            discount_index, discount_cum_days)

    return irr_roi_dict


def get_bfit_first_reversion_amount(bfit_cf, date_array, date_dict):
    if date_dict.get('rev_dates'):
        first_rev = date_dict.get('rev_dates')[0]
    else:
        return {'bfit_first_reversion_amount': bfit_cf.sum()}  # if no reversion

    if first_rev < date_dict.get('cf_start_date'):
        return {'bfit_first_reversion_amount': 0.0}
    elif first_rev > date_dict.get('cf_end_date'):
        return {'bfit_first_reversion_amount': bfit_cf.sum()}
    else:
        # index of first rev date in date_array
        first_rev_index = np.where(date_array == str(first_rev.replace(day=1)))[0][0]

        # bfit cash flow for the dates (months) before first reversion
        bfit_first = bfit_cf[:first_rev_index].sum()

        # bfit cash flow at the month of first reversion
        bfit_first += bfit_cf[first_rev_index] * first_rev.day / monthrange(first_rev.year, first_rev.month)[1]
        return {'bfit_first_reversion_amount': bfit_first}


def afit_get_irr_droi(flat_econ_log, afit_cf, general_option_model, date_dict, date_array):
    irr_roi_dict = {}

    # irr
    disc_date = get_py_date(date_dict['discount_date'])
    disc_method = general_option_model['discount_table']['discount_method']
    cash_accrual_time = general_option_model['discount_table']['cash_accrual_time']
    py_date_array = copy.deepcopy(date_array).astype('datetime64').astype(datetime.date)

    num_period = get_num_period(disc_method)
    discount_index, discount_cum_days = get_cum_days(py_date_array, disc_date, cash_accrual_time)

    irr_roi_dict['afit_irr'] = irr(afit_cf, num_period, discount_index, discount_cum_days)

    # roi
    first_discount_rate = general_option_model['discount_table']['first_discount'] / 100
    second_discount_rate = general_option_model['discount_table']['second_discount'] / 100
    cfs = {k: flat_econ_log[k] for k in ['after_income_tax_cash_flow', 'total_capex']}
    irr_roi_dict['afit_undiscounted_roi'] = afit_discounted_roi(cfs)
    irr_roi_dict['afit_first_discount_roi'] = afit_discounted_roi(cfs, first_discount_rate, num_period, discount_index,
                                                                  discount_cum_days,
                                                                  flat_econ_log['first_discounted_capex'])
    irr_roi_dict['afit_second_discount_roi'] = afit_discounted_roi(cfs, second_discount_rate, num_period,
                                                                   discount_index, discount_cum_days,
                                                                   flat_econ_log['second_discounted_capex'])
    irr_roi_dict['afit_first_discount_roi_undiscounted_capex'] = afit_discounted_roi(
        cfs, first_discount_rate, num_period, discount_index, discount_cum_days)
    irr_roi_dict['afit_second_discount_roi_undiscounted_capex'] = afit_discounted_roi(
        cfs, second_discount_rate, num_period, discount_index, discount_cum_days)

    return irr_roi_dict


def get_phase_start_forecast(date_dict):
    phase_start_forecast = {}
    real_lpd = date_dict['cut_off_date']
    as_of_date = date_dict['as_of_date']
    for phase, value in date_dict['start_using_forecast'].items():
        if value is not None:
            if value < as_of_date:
                value = date_str_format_change(str(as_of_date))
            elif value > real_lpd:
                value = None
            else:
                value = date_str_format_change(str(value))
        phase_start_forecast[f'{phase}_start_using_forecast_date'] = value
    return phase_start_forecast


def get_original_wi_nri(ownership_model):
    original_wi_nri = {}

    original_wi = ownership_model['ownership']['initial_ownership']['working_interest'] / 100
    ownership = ownership_model['ownership']['initial_ownership']
    for key in ['oil', 'gas', 'ngl', 'drip_condensate']:
        # original wi
        original_wi_nri[f'original_wi_{key}'] = original_wi

        # original nri
        if ownership[key + '_ownership']['net_revenue_interest'] != '':
            original_wi_nri['original_nri_' + key] = ownership[key + '_ownership']['net_revenue_interest'] / 100
        else:
            original_wi_nri['original_nri_' + key] = ownership['original_ownership']['net_revenue_interest'] / 100

    # original lease nri
    original_wi_nri['original_lease_nri'] = ownership['original_ownership']['lease_net_revenue_interest'] / 100

    return original_wi_nri


def get_first_reversion_wi_nri(ownership_model):
    res = {}
    first_rev_ownership = ownership_model.get('ownership', {}).get('first_reversion', {})

    for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        # working interest (WI)
        phase_wi = first_rev_ownership.get('working_interest', '')
        phase_wi = None if phase_wi == '' else phase_wi / 100
        res[f'first_reversion_wi_{phase}'] = phase_wi

        # net revenue interest for each phase
        phase_nri = first_rev_ownership.get(f'{phase}_ownership', {}).get('net_revenue_interest', '')
        phase_nri = None if phase_nri == '' else phase_nri / 100
        res[f'first_reversion_nri_{phase}'] = phase_nri

    return res


def get_dates(date_dict, date_array, unecon_bool):
    dates = {}
    well_life = 0 if unecon_bool else np.round(
        int(1 + np.datetime64(date_array[-1], 'M') - np.datetime64(date_array[0], 'M')) / 12, 2)
    dates['econ_first_production_date'] = date_str_format_change(str(date_dict['first_production_date']))
    dates['as_of_date'] = date_str_format_change(str(date_dict['as_of_date']))
    dates['discount_date'] = date_str_format_change(str(date_dict['discount_date']))
    dates['well_life'] = well_life
    # the abandonment_date now is the cf_end_date which is the later of the last capex date and cut off date
    dates['abandonment_date'] = date_str_format_change(str(date_dict['cf_end_date']))
    return dates


def get_production_to_as_of(production_data, date_dict):
    productions = {}
    for phase in ALL_PHASES:
        phase_data = production_data[phase]
        # handle wells with no production
        if phase_data is None:
            productions[phase + '_production_as_of_date'] = 0
            continue
        else:
            freq = phase_data['data_freq']
        if freq == 'monthly':
            as_of_date = np.datetime64(date_dict['as_of_date']).astype('datetime64[M]').astype('datetime64[D]') + 14
            as_of_offset = (as_of_date - np.datetime64('1900-01-01')).astype('int32')
        else:
            as_of_offset = (np.datetime64(date_dict['as_of_date']) - np.datetime64('1900-01-01')).astype('int32')
        prod_data = production_data[phase]['value']
        offset_data = production_data[phase]['index']
        mask = offset_data < as_of_offset
        productions[phase + '_production_as_of_date'] = np.sum(np.array(prod_data)[mask])

    return productions


def get_boe_conversions(general_option_model):
    boe_conversions = {}
    input_boe_conversions = general_option_model['boe_conversion']
    for key in input_boe_conversions.keys():
        boe_conversions[key + '_boe_conversion'] = input_boe_conversions[key]

    return boe_conversions


def get_tc_settings(tc_risking, apply_normalization):
    tc_settings = {}
    tc_settings['oil_tc_risk'] = tc_risking['oil_tc_risking']
    tc_settings['gas_tc_risk'] = tc_risking['gas_tc_risking']
    tc_settings['water_tc_risk'] = tc_risking['water_tc_risking']
    if apply_normalization is None:
        tc_settings['apply_normalization'] = None
    else:
        tc_settings['apply_normalization'] = 'Yes' if apply_normalization else 'No'

    return tc_settings


def get_discount_rates(well_input):
    discount_table = well_input['general_option_model'].get('discount_table')
    return {
        'first_discount_rate': discount_table.get('first_discount') / 100,
        'second_discount_rate': discount_table.get('second_discount') / 100,
        'discount_table_rate_1': discount_table.get('rows')[0].get('discount_table') / 100,
        'discount_table_rate_2': discount_table.get('rows')[1].get('discount_table') / 100
    }


# TODO: make it consistent with _parse_input model name handling
def get_assumption_model_names(well_input):
    return {
        'ownership_reversion_model_name': well_input['ownership_model'].get('name', None),
        'differentials_model_name': well_input['differentials_model_name'],
        'production_taxes_model_name': well_input['production_taxes_model_name'],
        'capex_model_name': well_input['capex_model'].get('name', None),
        'expenses_model_name': well_input['expenses_model_name'],
        'stream_properties_model_name': well_input['stream_property_model'].get('name', None),
        'dates_model_name': well_input['dates_model_name'],
        'pricing_model_name': well_input['pricing_model_name'],
        'risking_model_name': well_input['risking_model_name'],
        'forecast_name': well_input['forecast_name']
    }


def get_capex_expense_descriptions(well_input):
    # capex description
    capex_desc = []
    for row in well_input['capex_model']['other_capex']['rows']:
        if row.get('description') == '':
            continue
        capex_desc.append(f'{row.get("category")}: {row.get("description")}')
    capex_desc = ', '.join(capex_desc) if capex_desc else None

    # expenses description
    expenses_desc = []
    # fixed expenses
    mapper = {
        'monthly_well_cost': 'Fixed 1',
        'other_monthly_cost_1': 'Fixed 2',
        'other_monthly_cost_2': 'Fixed 3',
        'other_monthly_cost_3': 'Fixed 4',
        'other_monthly_cost_4': 'Fixed 5',
        'other_monthly_cost_5': 'Fixed 6',
        'other_monthly_cost_6': 'Fixed 7',
        'other_monthly_cost_7': 'Fixed 8',
        'other_monthly_cost_8': 'Fixed 9',
    }
    for model in well_input['fixed_expense_model']:
        if model.get('type_model', 'original') == 'original':
            for key, item in model.items():
                if key != 'type_model':
                    if item.get('description') == '':
                        continue
                    expenses_desc.append(f'{mapper.get(key)}: {item.get("description")}')
    # variable expenses
    mapper = {'gathering': 'G & P', 'processing': 'OPC', 'transportation': 'TRN', 'marketing': 'MKT', 'other': 'Other'}
    mapper_phase = {'oil': 'Oil', 'gas': 'Gas', 'ngl': 'NGL', 'drip_condensate': 'Drip Cond'}
    for model in well_input['variable_expense_model']:
        if model.get('type_model', 'original') == 'original':
            for phase, item in model.items():
                if phase != 'type_model':
                    for key in item.keys():
                        if item.get(key).get('description') == '':
                            continue
                        expenses_desc.append(
                            f'{mapper_phase.get(phase)} ({mapper.get(key)}): {item.get(key).get("description")}')
    expenses_desc = ', '.join(expenses_desc) if expenses_desc else None

    return {'capex_description': capex_desc, 'expenses_description': expenses_desc}


def get_capital_efficiency_attribute(flat_econ_log):
    one_yr_capex = sum(flat_econ_log['total_capex'][:12])
    one_yr_cap_eff_att = sum(flat_econ_log['net_income'][:12]) / one_yr_capex if one_yr_capex != 0 else 0

    three_yr_capex = sum(flat_econ_log['total_capex'][:36])
    three_yr_cap_eff_att = sum(flat_econ_log['net_income'][:36]) / three_yr_capex if three_yr_capex != 0 else 0

    total_capex = sum(flat_econ_log['total_capex'])
    well_life_cap_eff_att = sum(flat_econ_log['net_income']) / total_capex if total_capex != 0 else 0

    return {
        'one_year_capital_efficiency_attribute': one_yr_cap_eff_att,
        'three_years_capital_efficiency_attribute': three_yr_cap_eff_att,
        'well_life_capital_efficiency_attribute': well_life_cap_eff_att
    }


def get_phase_unit_cost_input(well_input):
    '''we only consider costs in $/bbl, $/mcf and $/mmbtu. We ignore % of rev units'''

    gas_unit_cost, oil_unit_cost, water_unit_cost, ngl_unit_cost, drip_cond_unit_cost = 0, 0, 0, 0, 0

    # gas unit cost $/mcf
    for model in well_input['variable_expense_model']:
        for _, expense_model in model.get('gas', {}).items():
            shrinkage_condition = expense_model.get('shrinkage_condition', 'unshrunk')
            first_expense = expense_model.get('rows', [{}])[0]
            # $/mcf
            gas_unit_cost += first_expense.get('dollar_per_mcf', 0)
            # $/mmbtu -> $/mcf
            conversion_factor = well_input['stream_property_model'].get('btu_content').get(f'{shrinkage_condition}_gas')
            gas_unit_cost += first_expense.get('dollar_per_mmbtu', 0) * conversion_factor / 1000

    # oil unit cost $/bbl
    for model in well_input['variable_expense_model']:
        for _, expense_model in model.get('oil', {}).items():
            oil_unit_cost += expense_model.get('rows', [{}])[0].get('dollar_per_bbl', 0)

    # water unit cost $/bbl
    for model in well_input['disposal_expense_model']:
        water_unit_cost += model.get('rows', [{}])[0].get('dollar_per_bbl', 0)

    # ngl unit cost $/bbl
    for model in well_input['variable_expense_model']:
        for _, expense_model in model.get('ngl', {}).items():
            ngl_unit_cost += expense_model.get('rows', [{}])[0].get('dollar_per_bbl', 0)

    # drip condensate unit cost $/bbl
    for model in well_input['variable_expense_model']:
        for _, expense_model in model.get('drip_condensate', {}).items():
            drip_cond_unit_cost += expense_model.get('rows', [{}])[0].get('dollar_per_bbl', 0)

    return {
        'total_gas_variable_expense_input': gas_unit_cost,
        'total_water_variable_expense_input': water_unit_cost,
        'total_oil_variable_expense_input': oil_unit_cost,
        'total_ngl_variable_expense_input': ngl_unit_cost,
        'total_drip_condensate_variable_expense_input': drip_cond_unit_cost
    }


def get_phase_differential_input(well_input):
    '''we only consider differentials in $/bbl, $/mcf and $/mmbtu. We ignore % of rev units'''
    res = {}

    # oil, ngl, and drip condensate differential inputs ($/bbl)
    for phase in ['oil', 'ngl', 'drip_condensate']:
        res[f'{phase}_differentials_input'] = 0
        for _, item in well_input['differential_model'].items():
            res[f'{phase}_differentials_input'] += item.get(phase, {}).get('rows', [{}])[0].get('dollar_per_bbl', 0)

    # gas differentials input ($/mmbtu)
    cf = well_input['stream_property_model'].get('btu_content').get('shrunk_gas')  # conversion factor $/mbtu -> $/mcf
    res['gas_differentials_input'] = 0
    for _, item in well_input['differential_model'].items():
        # $/mmbtu
        res['gas_differentials_input'] += item.get('gas', {}).get('rows', [{}])[0].get('dollar_per_mmbtu', 0)
        # $/mcf -> $/mmbtu
        res['gas_differentials_input'] += item.get('gas', {}).get('rows', [{}])[0].get('dollar_per_mcf',
                                                                                       0) / cf * 1000 if cf != 0 else 0

    return res


def get_all_summaries(date_dict: dict,
                      well_input,
                      flat_econ_log: dict,
                      is_fiscal_month: bool,
                      unecon_bool: bool,
                      is_group_case: bool = False,
                      feature_flags: Optional[dict[str, bool]] = None):
    all_columns_dict = {}
    date_array = flat_econ_log['date']

    # add dates (fpd, as of date, well_life, etc.)
    all_columns_dict.update(get_dates(date_dict, date_array, unecon_bool))

    # add original wi and nri
    ownership_model = well_input['ownership_model']
    all_columns_dict.update(get_original_wi_nri(ownership_model))

    # add first reversion wi and nri
    all_columns_dict.update(get_first_reversion_wi_nri(ownership_model))

    # add phase start forecast date
    all_columns_dict.update(get_phase_start_forecast(date_dict))

    # add droi
    bfit_cf = flat_econ_log['before_income_tax_cash_flow']
    general_option_model = well_input['general_option_model']
    all_columns_dict.update(get_irr_droi(flat_econ_log, bfit_cf, general_option_model, date_dict, date_array))

    # add bfit first reversion amount
    all_columns_dict.update(get_bfit_first_reversion_amount(bfit_cf, date_array, date_dict))

    # add ATAX droi
    if well_input['general_option_model']['main_options']['income_tax'] == 'yes':
        afit_cf = flat_econ_log['after_income_tax_cash_flow']
        general_option_model = well_input['general_option_model']
        all_columns_dict.update(afit_get_irr_droi(flat_econ_log, afit_cf, general_option_model, date_dict, date_array))

    # add stream properties
    stream_property_model = well_input['stream_property_model']
    all_columns_dict.update(get_stream_properties(flat_econ_log, stream_property_model, feature_flags))

    # add payout and payout duration
    first_disc_cf = flat_econ_log['first_discount_cash_flow']
    second_disc_cf = flat_econ_log['second_discount_cash_flow']
    all_columns_dict.update(get_payout(bfit_cf, first_disc_cf, second_disc_cf, date_array))

    # AFIT add payout and payout duration
    if well_input['general_option_model']['main_options']['income_tax'] == 'yes':
        first_disc_cf = flat_econ_log['afit_first_discount_cash_flow']
        second_disc_cf = flat_econ_log['afit_second_discount_cash_flow']
        all_columns_dict.update(afit_get_payout(afit_cf, first_disc_cf, second_disc_cf, date_array))

    # add production analytics
    all_columns_dict.update(get_production_analytics(is_fiscal_month, flat_econ_log))

    # add risking parameters
    if not is_group_case:
        risk_model = well_input['risk_model']
        all_columns_dict.update(get_riskings(risk_model, date_dict, flat_econ_log))

    # add EUR and EUR/PLL
    if not is_group_case:
        forecast_data = well_input['adjusted_forecast_data']
        p_series = well_input['p_series']
        production_data = well_input['production_data']
        perf_lateral_length = well_input['well_header_info']['perf_lateral_length']
        shut_in_period = well_input['shut_in_period']
        eur_dict, eur_pll_dict = get_eur(forecast_data, p_series, production_data, stream_property_model, risk_model,
                                         shut_in_period, perf_lateral_length, date_dict, feature_flags)
        all_columns_dict.update(eur_dict)
        all_columns_dict.update(eur_pll_dict)

        # add ratios
        all_columns_dict.update(get_ratios(all_columns_dict))

        # add forecast parameters
        all_columns_dict.update(get_forecast_params(forecast_data, p_series))

        # add production to as of date
        all_columns_dict.update(get_production_to_as_of(production_data, date_dict))

    # add BOE conversions
    all_columns_dict.update(get_boe_conversions(general_option_model))

    # add TC settings
    if not is_group_case:
        tc_risking = well_input['tc_risking']
        apply_normalization = well_input['apply_normalization']
        all_columns_dict.update(get_tc_settings(tc_risking, apply_normalization))

    # add discount rates
    all_columns_dict.update(get_discount_rates(well_input))

    # add assumption model names
    all_columns_dict.update(get_assumption_model_names(well_input))

    # add capex/expense descriptions
    all_columns_dict.update(get_capex_expense_descriptions(well_input))

    # calculate capital efficiency attribute
    all_columns_dict.update(get_capital_efficiency_attribute(flat_econ_log))

    # get phase unit cost inputs
    all_columns_dict.update(get_phase_unit_cost_input(well_input))

    # get phase differential inputs
    if not is_group_case:
        all_columns_dict.update(get_phase_differential_input(well_input))

    return all_columns_dict
