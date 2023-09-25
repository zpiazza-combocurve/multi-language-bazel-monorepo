import warnings
import numpy as np
from bson.objectid import ObjectId


def list_to_expression(input_list):
    expresseion = ''
    for i in range(len(input_list)):
        if i == len(input_list) - 1:
            expresseion = expresseion + str(input_list[i])
        else:
            expresseion = expresseion + str(input_list[i]) + ' '
    return expresseion


def cc_date_to_aries_date(cc_date):
    # input is string with format: 'yyyy-mm-dd'
    if not isinstance(cc_date, str):
        aries_date = str(cc_date)
    else:
        aries_date = cc_date
    aries_date_list = aries_date.split('-')
    return aries_date_list[1] + '/' + aries_date_list[0]


def cc_index_to_aries_date(cc_index, cut_off=False):
    cc_base_date = np.datetime64('1900-01-01')
    if cut_off is False:
        cc_date = cc_base_date + int(cc_index)
    else:
        ## add one moth because aries exclude the cut off month
        cc_date = (cc_base_date + int(cc_index)).astype('datetime64[M]') + 1
    return cc_date_to_aries_date(cc_date)


def get_forecast_data(forecast_id, well_id, db):
    forecast_datas_collection = db['forecast-datas']
    forecast_data_list = list(
        forecast_datas_collection.find({
            'forecast': ObjectId(forecast_id),
            'well': ObjectId(well_id)
        }))
    #
    forecast_data = {}
    for fore in forecast_data_list:
        forecast_data[fore['phase']] = {
            'P_dict': fore['P_dict'],
            'forecastType': fore['forecastType'],
            'forecasted': fore['forecasted'],
            'model_name': fore['model_name'],
            'p2seg_dict': fore['p2seg_dict']
        }
    return forecast_data


def forecast_conv(forecast_data, pct_key='P50'):
    #
    forecast_ret = []
    keyword_dict = {'oil': 'OIL', 'gas': 'GAS', 'water': 'WTR'}
    unit_dict = {'oil': 'B/D', 'gas': 'M/D', 'water': 'B/D'}
    #
    for phase in ['oil', 'gas', 'water']:
        phase_keyword = keyword_dict[phase]
        phase_unit = unit_dict[phase]
        #
        forecast_segments = forecast_data[phase]['P_dict'][pct_key]['segments']
        forecast_start_index = int(forecast_segments[0]['start_idx'])
        start_ad = cc_index_to_aries_date(forecast_start_index, cut_off=False)
        forecast_ret.append(['START', start_ad])
        #
        for i in range(len(forecast_segments)):
            segment = forecast_segments[i]
            segment_name = segment['name']
            #
            if i > 0:
                phase_keyword = '"'
            ## arps modified
            if segment_name == 'arps_modified':
                #
                D_sw = segment['realized_D_eff_sw'] if 'realized_D_eff_sw' in segment.keys() else segment['D_eff_sw']
                # arps
                initial_rate_arps = np.round(segment['q_start'], 2)
                final_rate_arps = 'X'
                cuttoff_arps = np.round(D_sw * 100, 2)
                cutoff_unit_arps = 'EXP'
                decline_method_arps = 'B/' + str(np.round(segment['b'], 2))
                decline_rate_arps = np.round(segment['D_eff'] * 100, 2)
                this_seg_arps = [
                    phase_keyword,
                    list_to_expression([
                        initial_rate_arps, final_rate_arps, phase_unit, cuttoff_arps, cutoff_unit_arps,
                        decline_method_arps, decline_rate_arps
                    ])
                ]
                forecast_ret.append(this_seg_arps)
                # exponential
                initial_rate_exp = 'X'
                final_rate_exp = 'X'
                cuttoff_exp = cc_index_to_aries_date(int(segment['end_idx']), cut_off=True)
                cutoff_unit_exp = 'AD'
                decline_method_exp = 'EXP'
                decline_rate_exp = np.round(D_sw * 100, 2)
                this_seg_exp = [
                    '"',
                    list_to_expression([
                        initial_rate_exp, final_rate_exp, phase_unit, cuttoff_exp, cutoff_unit_exp, decline_method_exp,
                        decline_rate_exp
                    ])
                ]
                forecast_ret.append(this_seg_exp)
            else:
                ## others
                initial_rate = np.round(segment['q_start'], 2)
                final_rate = 'X'
                cuttoff = cc_index_to_aries_date(segment['end_idx'], cut_off=True)
                cutoff_unit = 'AD'
                if segment_name == 'exp_inc' or segment_name == 'exp_dec':
                    decline_method = 'EXP'
                    decline_rate = np.round(segment['D_eff'] * 100, 2)
                elif segment_name == 'arps':
                    decline_method = 'B/' + str(np.round(segment['b'], 2))
                    decline_rate = np.round(segment['D_eff'] * 100, 2)
                elif segment_name == 'flat':
                    final_rate = initial_rate
                    decline_method = 'FLAT'
                    decline_rate = 0
                elif segment_name == 'empty':
                    final_rate = 0
                    initial_rate = 0
                    decline_method = 'FLAT'
                    decline_rate = 0
                    warnings.warn('There is no empty forecast in Aries, we use FLAT line with all 0 instead.')
                    # raise Exception('There is no empty forecast in Aries.')
                this_seg = [
                    phase_keyword,
                    list_to_expression(
                        [initial_rate, final_rate, phase_unit, cuttoff, cutoff_unit, decline_method, decline_rate])
                ]
                forecast_ret.append(this_seg)

    return forecast_ret


'''
from bson.objectid import ObjectId
# forecast_id = ObjectId("5d702ee6501bfa000812d3fb")
forecast_id = ObjectId("5d5f066c9d39980008609d13")
well_id = ObjectId("5d48d5f9a43d737ed81bc2fe")
f = forecast_conv(forecast_id, well_id, 'best')
'''
