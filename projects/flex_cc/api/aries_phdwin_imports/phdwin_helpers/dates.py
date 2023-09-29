import calendar
import datetime
import pandas as pd
from api.aries_phdwin_imports.phdwin_helpers.general import convert_well_headers_date
from api.aries_phdwin_imports.phdwin_helpers.stream_prop import process_phdwin_risk_document
from api.aries_phdwin_imports.helpers import calculate_phdwin_date, get_min_life_dict
from combocurve.shared.aries_import_enums import CCSchemaEnum, EconEnum, PhaseEnum
from combocurve.utils.constants import DAYS_IN_MONTH

PHD_DATE = 'PHD_DATES_SETTINGS'
SET_KILL_DATE = 'SET_KILL_DATE'
SET_MIN_LIFE = 'SET_MIN_LIFE'


def process_phdwin_dates_document(  # noqa (C901)
        document,
        change_dates_hierarchy,
        project_id,
        default_dates_dic,
        get_default_format,
        date_only=False,
        lse_id_to_case_multiplier=None):
    default_document = get_default_format('dates')
    default_document['econ_function']['cut_off']['capex_offset_to_ecl'] = 'yes'
    risk_default_document = None
    default_document['project'] = project_id  # only have one project when uploading new file
    default_document['name'] = PHD_DATE

    try:
        default_document['econ_function']['dates_setting']['max_well_life'] = default_dates_dic['maxecoyears']
    except KeyError:
        pass
    try:
        default_document['econ_function']['dates_setting']['discount_date'] = {
            'date': default_dates_dic['discount_date'].strftime("%Y-%m-%d")
        }
    except KeyError:
        pass
    try:
        default_document['econ_function']['dates_setting']['as_of_date'] = {
            'date': default_dates_dic['as_of_date'].strftime("%Y-%m-%d")
        }
    except KeyError:
        pass

    cut_off = document.get('cut_off')
    phase = document.get('phase')
    value = document.get('value')
    kill_date = document.get('kill_date')
    min_date = document.get('min_life')
    asof = document.get('asof')
    end_hist = document.get('endhist')
    ecl = document.get('ecl')
    offset = document.get('offset')
    max_years = document.get('max_years')
    ignore_min_life = False

    date_model_name = PHD_DATE
    if cut_off is not None:
        default_document['wells'] = set()
        default_document['wells'].add(document['well'])
        default_document['project'] = ''  # only have one project when uploading new file
        default_document['name'] = ''
        if cut_off:
            default_document['econ_function']['cut_off'] = {f'{phase}_rate': value}
            unit = PHASE_RATE_UNIT_DICT.get(str(phase).strip().lower())
            if unit is not None:
                date_model_name = f'{PHD_DATE} WITH {value} {unit} {str(phase).upper()}-RATE CUTOFF'

        if kill_date is not None and pd.notnull(pd.to_datetime(str(kill_date), errors='coerce')):
            default_document['econ_function']['cut_off'] = {'date': kill_date}
            date_model_name = get_dates_model_name(kill_date, kill_date=True)
            ignore_min_life = True

        if not ignore_min_life and min_date is not None and pd.notnull(pd.to_datetime(str(min_date), errors='coerce')):
            if asof:
                try:
                    min_life = round(float(offset) / DAYS_IN_MONTH, 0)
                except ValueError:
                    min_life = None
                if min_life is not None:
                    default_document[EconEnum.econ_function.value][EconEnum.cut_off.value][
                        EconEnum.min_cut_off.value] = get_date_asof_dict(min_life)
            elif end_hist and offset == 0:
                default_document[EconEnum.econ_function.value][EconEnum.cut_off.value][EconEnum.min_cut_off.value] = {
                    "end_hist": ""
                }
            elif ecl:
                default_document[EconEnum.econ_function.value][EconEnum.cut_off.value] = {"no_cut_off": ""}
            else:
                default_document[EconEnum.econ_function.value][EconEnum.cut_off.value][
                    EconEnum.min_cut_off.value] = get_min_life_dict(min_date)

            date_model_name = get_dates_model_name(min_date, min_life=True, asof=asof, end_hist=end_hist, offset=offset)

        if max_years is not None:
            default_document[EconEnum.econ_function.value]['dates_setting']['max_well_life'] = max_years

    if 'well' in document and document['well'] in change_dates_hierarchy:
        if 'wells' in default_document:
            default_document['wells'] = set()
            default_document['wells'].add(document['well'])
            default_document['econ_function']['dates_setting']['fpd_source_hierarchy'] = {
                'first_fpd_source': {
                    'forecast': ''
                },
                'second_fpd_source': {
                    'well_header': ''
                },
                'third_fpd_source': {
                    'production_data': ''
                },
                'fourth_fpd_source': {
                    'not_used': ''
                },
                'use_forecast_schedule_when_no_prod': 'yes'
            }

    if not date_only:
        risk_default_document = process_phdwin_risk_document(document, get_default_format, lse_id_to_case_multiplier)

    default_document['createdAt'] = datetime.datetime.now()
    default_document['updatedAt'] = datetime.datetime.now()

    if date_only:
        return default_document
    else:
        return default_document, risk_default_document, date_model_name


def get_date_asof_dict(min_life):
    return {'as_of': min_life}


def get_dates_model_name(date, kill_date=False, min_life=False, asof=False, end_hist=False, offset=0):
    if min_life:
        key = 'MIN_LIFE'
    if kill_date:
        key = 'KILL_DATE'
    date = pd.to_datetime(date)
    month = date.month
    year = date.year
    if asof and min_life:
        dates_model_name = f'{PHD_DATE}_{key}({offset} MOS PAST ASOF)'
    elif end_hist and offset == 0:
        dates_model_name = f'{PHD_DATE}_{key}(END HIST PROD)'
    else:
        dates_model_name = f'{PHD_DATE}_{key}({calendar.month_abbr[month]} {year})'

    return dates_model_name


def format_ecf_for_cut_off(df, act_df, msc_df, for_df, tit_df, lse_id_to_sop, lse_id_to_eop):
    lse_id_to_curarcseq_dic = pd.Series(act_df['Curarcseq'].values, index=act_df['Lse Id'].astype(str).values).to_dict()
    lse_id_to_major_product = pd.Series(act_df['Major Phase'].values,
                                        index=act_df['Lse Id'].astype(str).values).to_dict()

    for_df['use_arcseq'] = for_df['Lse Id'].astype(str).map(lse_id_to_curarcseq_dic)
    for_df = for_df[for_df['use_arcseq'] == for_df['Arcseq']]

    for_df['major_product'] = for_df['Lse Id'].astype(str).map(lse_id_to_major_product)
    for_df = for_df[for_df['major_product'].astype(str) == for_df['Productcode'].astype(str)]

    seg_dicts = {}
    seg_list = [f'Seg{i}' for i in range(1, 11)]
    for idx, seg in enumerate(seg_list):
        seg_dicts[seg] = pd.Series(for_df[f'Segmentdate[{idx}]'].values,
                                   index=for_df['Lse Id'].astype(str).values).to_dict()

    lse_id_to_end_proj_dict = {}
    for idx, row in for_df.iterrows():
        for i in range(10):
            if row[f'Segmentend[{i}]'] != 0:
                lse_id_to_end_proj_dict[str(int((float(row['Lse Id']))))] = row[f'Segmentend[{i}]']
            else:
                break
    (lse_id_to_min_date_dict, lse_id_to_kill_date_dict, lse_id_endhist_dict, lse_id_asof_dict, lse_id_offset_dict,
     lse_id_to_no_exp_before_dict) = get_min_life_kill_date(msc_df, tit_df, seg_dicts, lse_id_to_end_proj_dict,
                                                            lse_id_to_eop, lse_id_to_sop)

    cutoff_df = get_cut_off_df(df)

    cutoff_df['kill_date'] = cutoff_df['lse_id'].astype(str).map(lse_id_to_kill_date_dict)
    cutoff_df['min_life'] = cutoff_df['lse_id'].astype(str).map(lse_id_to_min_date_dict)
    cutoff_df['asof'] = cutoff_df['lse_id'].astype(str).map(lse_id_asof_dict)
    cutoff_df['endhist'] = cutoff_df['lse_id'].astype(str).map(lse_id_endhist_dict)
    cutoff_df['offset'] = cutoff_df['lse_id'].astype(str).map(lse_id_offset_dict)

    return cutoff_df, lse_id_to_no_exp_before_dict


def get_min_life_kill_date(msc_df, tit_df, seg_dicts, lse_id_to_end_proj_dict, lse_id_to_eop, lse_id_to_sop):
    # get the type 59 (Kill date) and type 23 (min life)
    msc_df_min_kill_date = msc_df[(msc_df['Type'].astype(str) == '59') | (msc_df['Type'].astype(str) == '23') |
                                  (msc_df['Type'].astype(str) == '24')]

    msc_df_min_kill_date['Date'] = msc_df_min_kill_date['Longvalue']
    msc_df_min_kill_date['asof'] = None
    msc_df_min_kill_date['endhist'] = None
    msc_df_min_kill_date['ecl'] = None

    msc_df_min_kill_date['Stringvalue'] = msc_df_min_kill_date['Stringvalue'].astype(str).str.strip()
    for seg, seg_dict in seg_dicts.items():
        msc_df_min_kill_date.loc[(msc_df_min_kill_date['Stringvalue'] == seg),
                                 ['Date']] = msc_df_min_kill_date['Lse Id'].astype(str).map(seg_dict)

    msc_df_min_kill_date.loc[(msc_df_min_kill_date['Stringvalue'] == 'EndPrj'),
                             ['Date']] = msc_df_min_kill_date['Lse Id'].astype(str).map(lse_id_to_end_proj_dict)

    msc_df_min_kill_date.loc[(msc_df_min_kill_date['Stringvalue'] == 'AsOf'), ['Date']] = tit_df.at[0, 'Asof Date']
    msc_df_min_kill_date.loc[(msc_df_min_kill_date['Stringvalue'] == 'AsOf'), ['asof']] = True

    msc_df_min_kill_date.loc[(msc_df_min_kill_date['Stringvalue'] == 'EndHist'),
                             ['Date']] = msc_df_min_kill_date['Lse Id'].map(lse_id_to_eop)
    msc_df_min_kill_date.loc[(msc_df_min_kill_date['Stringvalue'] == 'EndHist'), ['endhist']] = True

    msc_df_min_kill_date.loc[(msc_df_min_kill_date['Stringvalue'] == 'Ecl'), ['ecl']] = True

    msc_df_min_kill_date.loc[(msc_df_min_kill_date['Stringvalue'] == 'FirstProd'),
                             ['Date']] = msc_df_min_kill_date['Lse Id'].map(lse_id_to_sop)

    msc_df_min_kill_date['Date'] = msc_df_min_kill_date[['Date', 'Realvalue']].sum(axis=1)
    msc_df_min_kill_date['Date'] = msc_df_min_kill_date.apply(lambda x: calculate_phdwin_date(x['Date']), axis=1)
    msc_df_min_kill_date['Date'] = msc_df_min_kill_date.apply(lambda x: convert_well_headers_date(x['Date']), axis=1)

    min_life_df = msc_df_min_kill_date[(msc_df_min_kill_date['Type'].astype(str) == '23')]
    no_exp_before_df = msc_df_min_kill_date[(msc_df_min_kill_date['Type'].astype(str) == '24')]
    kill_date_df = msc_df_min_kill_date[(msc_df_min_kill_date['Type'].astype(str) == '59')]

    lse_id_offset_dict = pd.Series(msc_df_min_kill_date['Realvalue'].values,
                                   index=msc_df_min_kill_date['Lse Id'].astype(str).values).to_dict()
    lse_id_asof_dict = pd.Series(msc_df_min_kill_date['asof'].values,
                                 index=msc_df_min_kill_date['Lse Id'].astype(str).values).to_dict()
    lse_id_endhist_dict = pd.Series(msc_df_min_kill_date['endhist'].values,
                                    index=msc_df_min_kill_date['Lse Id'].astype(str).values).to_dict()
    lse_id_to_min_date_dict = pd.Series(min_life_df['Date'].values,
                                        index=min_life_df['Lse Id'].astype(str).values).to_dict()
    lse_id_to_kill_date_dict = pd.Series(kill_date_df['Date'].values,
                                         index=kill_date_df['Lse Id'].astype(str).values).to_dict()
    lse_id_to_no_exp_before_dict = pd.Series(no_exp_before_df['Date'].values,
                                             index=no_exp_before_df['Lse Id'].astype(str).values).to_dict()

    return (lse_id_to_min_date_dict, lse_id_to_kill_date_dict, lse_id_endhist_dict, lse_id_asof_dict,
            lse_id_offset_dict, lse_id_to_no_exp_before_dict)


def get_cut_off_df(df):
    cutoff_df = []
    for index, row in df.iterrows():
        cut_off_row = []
        cut_off_row.append(row['Lse Id'])
        cut_off_row.append(False)
        cut_off_row.append(None)
        cut_off_row.append(None)
        cut_off_row.append(None)
        cut_off_row.append(None)
        cut_off_row.append(None)
        for i in [0, 1, 4]:
            if int(float(row[f'Cutoffenable[{i}]'])) == 1:
                cut_off_row[1] = True
                cut_off_row[2] = i
                cut_off_row[3] = round(float(row[f'Cutoffs[{i}]']) / DAYS_IN_MONTH, CCSchemaEnum.date_round_off.value)
                break
        if float(row['Codes2[6]']) != 0:
            cut_off_row[4] = float(row['Codes2[6]'])
        if float(row['Codes[2]']) != 0:
            cut_off_row[5] = float(row['Codes[2]'])
        if float(row['Maxyrs']) != 0:
            cut_off_row[6] = float(row['Maxyrs'])

        cutoff_df.append(cut_off_row)

    cutoff_df = pd.DataFrame(cutoff_df,
                             columns=['lse_id', 'cut_off', 'phase', 'value', 'multiplier', 'case_mult', 'max_years'])
    cutoff_df['phase'] = cutoff_df['phase'].map(CUT_OFF_PHASE_DICT)
    return cutoff_df


PHASE_RATE_UNIT_DICT = {'oil': 'BBL/D', 'gas': 'MCF/D', 'water': 'BBL/D'}

CUT_OFF_PHASE_DICT = {0: PhaseEnum.gas.value, 1: PhaseEnum.water.value, 4: PhaseEnum.oil.value}
