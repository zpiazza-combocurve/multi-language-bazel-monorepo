import pandas as pd
import numpy as np

import copy
import math
import json
import datetime

from pymongo import UpdateOne
from api.aries_phdwin_imports.independent_phdwin_conv import PhdwinConvert
from api.aries_phdwin_imports.data_extraction import DataExtraction
from api.aries_phdwin_imports.error import (ERROR_DEFAULT_DATE, ErrorMsgSeverityEnum, PhdwinErrorReport,
                                            PhdwinErrorMessage, PRICE_TAX_EXPENSE_SHRINK_MODEL_NAME)

from api.aries_phdwin_imports.phdwin_helpers.actual_vs_forecast import (
    process_phdwin_actual_vs_forecast_properties_document)

from api.aries_phdwin_imports.phdwin_helpers.price_tax_expense_preprocess import (
    add_custom_dates_to_df, add_product_and_filter_by_current_arcseq, get_model_link_from_mpv, get_valid_lsg_df,
    map_model_into_lpv, process_lpv_df, process_msg_df)
from api.aries_phdwin_imports.phdwin_helpers.dates import process_phdwin_dates_document, format_ecf_for_cut_off
from api.aries_phdwin_imports.phdwin_helpers.tax import (convert_tax_dates_to_offset, process_phdwin_tax_document,
                                                         PHDWIN_TAX_TYPE, process_tax_document_and_combine)

from api.aries_phdwin_imports.phdwin_helpers.capex import process_phdwin_capex_document
from api.aries_phdwin_imports.phdwin_helpers.expense import (convert_expense_dates_to_offset, PHDWIN_EXPENSE_TYPE,
                                                             process_phdwin_expense_document,
                                                             process_expense_document_and_combine)
from api.aries_phdwin_imports.phdwin_helpers.datatype_mapping import get_dtype_mapping
from api.aries_phdwin_imports.phdwin_helpers.forecast import (
    ALL_FORECAST_COLUMNS, calculate_select_forecast_parameters, check_for_incremental_forecast, get_forecast_use_cols,
    get_segment_end_date_dict, process_all_well_phdwin_forecast_df, process_selected_forecast_df, verify_segment_merge)

from api.aries_phdwin_imports.phdwin_helpers.general import (
    ALL_CASES, create_incrementals_in_scenario_well_assignment, format_for_matching, get_dictionary,
    get_forecast_incremental_index, get_model_name, get_partnership_dict, get_well_and_grp_id_for_swa,
    generate_default_econ_settings, incremental_progress_on_import, merge_two_dicts,
    replace_incremental_well_forecast_to_parent, update_scenario_doc_if_incremental)

from api.aries_phdwin_imports.phdwin_helpers.ownership import get_ownership_obj

from api.aries_phdwin_imports.phdwin_helpers.price_diff import (convert_price_dates_to_offset,
                                                                process_phdwin_pricing_diff_document,
                                                                process_price_document_and_combine)
from api.aries_phdwin_imports.phdwin_helpers.prod_data import (process_phdwin_daily_data,
                                                               get_phdwin_well_monthly_data_import)
from api.aries_phdwin_imports.phdwin_helpers.stream_prop import (process_ngl_yield_units,
                                                                 process_phdwin_stream_properties_document,
                                                                 process_stream_properties_document_format)

from api.aries_phdwin_imports.phdwin_helpers.wells import (get_well_header_selected_df,
                                                           process_phdwin_well_header_tables,
                                                           pull_incremental_from_econ)

from api.aries_phdwin_imports.helpers import (
    clean_ratio_name, append_existing_segment_obj_phdwin, append_new_segment_obj_phdwin, add_base_phase_if_ratio,
    remove_none_from_wells_document, phdwin_ratio_product_code, forecast_validity_check, format_well_header_col,
    create_forecast_doc_and_append_segment_obj_phdwin, calculate_phdwin_date, process_phdwin_date_columns,
    process_phdwin_date_sequence_lsg, format_phdwin_date_1_2_to_start_end_values, clean_phdwin_prices_taxes_expense_df,
    link_model_lines_to_whole_df, convert_year_month_day_phdwin_column_to_date, add_btu_from_ecf,
    add_model_unitstr_from_mpv, fill_reserves_document, get_dates_values_from_econ_option_doc, add_forecast_well_count,
    get_new_fixed_assignment_dic, get_phdwin_ratio_product_phases, convert_wc_to_wr, calculate_start_date_index,
    OWNERSHIP_KEYS, get_end_of_projection)
from api.aries_phdwin_imports.phd_import_data import PhdwinImportData

from combocurve.services.data_import.import_data import DataSettings
from combocurve.shared.econ_tools.econ_to_options import add_options
from combocurve.shared.phdwin_import_constants import PhdHeaderCols, ProductCode, PHDWIN_PD_ENCODING
from combocurve.shared.phdwin_name_map import ALL_PHDWIN_TABLES
from combocurve.shared.aries_import_enums import ForecastEnum, PhdwinModelEnum

from bson.objectid import ObjectId

pd.set_option('display.max_rows', 1000)
pd.set_option('display.max_columns', 200)

INITIAL_PHDWIN_IMPORT_PROGRESS = 2

CREATE_WELL_DIC_PROGRESS = 5

GET_WELL_DICTIONARY_PROGRESS = 30

START_OF_FORECAST_IMPORT_PROGRESS = 40

END_OF_FORECAST_PROGRESS = 60

END_OF_CAPEX_OWN_IMPORT_PROGRESS = 70

END_OF_PRI_TAX_EXP_IMPORT_PROGRESS = 92

END_OF_ASSUMPTIONS_IMPORT_PROGRESS = 95


class PHDWinDataExtraction(DataExtraction):
    def __init__(self,
                 name,
                 user_id,
                 notification_id,
                 parallel_dic,
                 gcp_name_dic,
                 prod_dict,
                 context,
                 scenarios=['All Cases'],
                 debug=False,
                 progress=None,
                 local=False):
        '''
        read all needed csv to df
        '''
        super(PHDWinDataExtraction, self).__init__(user_id, context, parallel_dic['batch_number'])

        self.debug = debug
        self.log_report = PhdwinErrorReport(debug=self.debug)
        self.error_msg = PhdwinErrorMessage()
        self.daily_start_date_dict = prod_dict[0]
        self.daily_end_date_dict = prod_dict[1]
        self.monthly_start_date_dict = prod_dict[2]
        self.monthly_end_date_dict = prod_dict[3]
        self.folder_name = name
        self.gcp_name_dic = gcp_name_dic
        self.context = context
        self.user_id = user_id
        self.notification_id = notification_id
        self.db = self.context.db

        self.count_yield_dictionary = {}
        self.forecast_df_in_dictionary = {}

        self.forecasts_dic = {}
        self.forecast_datas_dic = {}
        self.forecast_name_to_dataid = {}
        self.well_forecasts_dic = {}
        self.forecast_other_phase = set()
        self.count_yield_wellid_to_latest_date_dic = {}  #nymex ex: {'5cb8aef1b986470c40761f18': 2017-10-31}
        self.progress = progress

        if local:
            # read all table once
            run_local_directory = '../run_local/'
            for table in ALL_PHDWIN_TABLES:
                dtype_mapping = get_dtype_mapping(table, ALL_FORECAST_COLUMNS)
                if table in ['MSG', 'MPV']:
                    try:
                        value = pd.read_csv(run_local_directory + self.folder_name + f"/test.{table}.csv",
                                            dtype=dtype_mapping,
                                            encoding=PHDWIN_PD_ENCODING)
                    except FileNotFoundError:
                        value = pd.read_csv(run_local_directory + self.folder_name + f"/test.O{table}.csv",
                                            dtype=dtype_mapping,
                                            encoding=PHDWIN_PD_ENCODING)
                else:
                    value = pd.read_csv(run_local_directory + self.folder_name + f"/test.{table}.csv",
                                        dtype=dtype_mapping,
                                        encoding=PHDWIN_PD_ENCODING)
                setattr(self, f'{table}_df', value)
        else:
            self.read_all_table()
        # forecast 5 types of segment list - save each segment difference betweeen phd_qend and cc_qend
        self.arps = []
        self.exp_inc = []
        self.exp_dec = []
        self.arps_modified = []
        self.flat = []

        # to hold project and scenario primary id (_id) once project created in mongodb
        self.projects_dic = {}  # ex: {ObjecId('5cdc42e6b986474690ba9806'): project_document}

        # to hold project and scenario primary id (_id) once project created in mongodb
        self.grp_id_scenario_id = {}

        # prepare dic for well senario assigment forecast
        self.seq_to_forecast_name_dic = None
        self.product_code_to_name_dict = None
        self.lse_id_to_curarcseq_dic = None
        self.forecast_id_to_name_dic = {}

        # create project to get _id in order to put into wells document
        self.create_project_collection(project_name=name)

        # create_monthly_id_map_to_fpd
        self.lse_id_to_monthly_fpd_dic = {}
        self.major_phase_dict = {}

        # lease_id_to_eop_dic
        self.lease_id_to_eop_dic = {}

        # lease_id_to_well Object Ids
        self.lse_to_db_id = {}
        self.well_count_df = pd.DataFrame([])
        self.wells_to_update = []

        # lease_id_to_sop_dic
        self.lease_id_to_sop_dic = {}

        # excluded_wells_dic
        self.lease_id_to_exclsum_dic = {}

        # list of wells with case multiplier
        self.lse_id_to_case_multiplier = {}

        self.lse_id_no_exp_before_dict = {}

        self.parent_incremental_dict = {}

        self.change_dates_hierarchy = set()

        self.user_selected_scenarios = scenarios

    def read_all_table(self, ls_table=None):
        gcp_name_dic = self.gcp_name_dic

        if ls_table is not None:
            gcp_name_dic = {table_name: gcp_name_dic[table_name] for table_name in ls_table}

        for file_name in gcp_name_dic:
            if file_name in ['DAT', 'TST']:
                continue
            binary = self.context.file_service.download_to_memory(gcp_name_dic[file_name])
            binary.seek(0)

            file_name = f'{str(file_name).upper()}_df' if file_name != 'well_count' else 'well_count_df'
            if file_name != 'well_count_df':
                usecols = get_forecast_use_cols() if file_name == 'FOR_df' else None
                dtype_mapping = get_dtype_mapping(file_name, usecols)
                try:
                    value = pd.read_csv(binary, usecols=usecols, dtype=dtype_mapping, encoding=PHDWIN_PD_ENCODING)
                except TypeError:
                    value = pd.read_csv(binary, usecols=usecols, dtype=None, encoding=PHDWIN_PD_ENCODING)
            else:
                value = pd.read_csv(binary)

            setattr(self, file_name, value)

    def update_wells(self, document, collection_name):
        '''
        update wells from reservoir_properties and fluid_properties
        '''

        wells_exist_document = self.wells_dic.get(self.lse_to_db_id.get(str(document['lse_id'])))

        if collection_name == 'reservoir_properties':
            wells_exist_document['sg'] = document['sg']
            wells_exist_document['so'] = document['so']
            wells_exist_document['sw'] = document['sw']
            wells_exist_document['bg'] = document['bg']
            wells_exist_document['bo'] = document['bo']
            wells_exist_document['rs'] = document['rsi']
            wells_exist_document['zi'] = document['zi']
            wells_exist_document['porosity'] = document['porosity']
            wells_exist_document['drainage_area'] = document['drainarea']
            wells_exist_document['thickness'] = document['thickness']
            wells_exist_document['initial_respress'] = document['initial_respress']
            wells_exist_document['initial_restemp'] = document['initial_restemp']

        if collection_name == 'fluid_properties':
            wells_exist_document['upper_perforation'] = document['upper_preforation']
            wells_exist_document['lower_perforation'] = document['lower_preforation']
            wells_exist_document['landing_zone'] = document['landing_zone']

        wells_exist_document = remove_none_from_wells_document(wells_exist_document)
        self.wells_dic[str(wells_exist_document['_id'])] = wells_exist_document
        self.wells_to_update.append(
            UpdateOne(
                {
                    'lease_number': document['lse_id'],
                    'project': self.project_id
                },
                {'$set': wells_exist_document},
            ))

    def dictionary_format_conversionn_get_default_format(self, document, collection_name):  # noqa: C901
        # get default format
        default_document = self.get_default_format(collection_name)
        # fill in the deault format from document
        if collection_name == 'ownership_old':
            default_document['wells'].add(document['well'])
            default_document['econ_function']['ownership']['working_interest'] = document['wrkint'] * 100
            default_document['econ_function']['ownership']['original_ownership'][
                'net_revenue_interest'] = document['revint'] * 100
            default_document['econ_function']['ownership']['original_ownership'][
                'lease_net_revenue_interest'] = document['lsenri'] * 100
            try:
                if document['revint'] != document['oil']:
                    default_document['econ_function']['ownership']['oil_ownership'][
                        'net_revenue_interest'] = document['oil'] * 100
                if document['revint'] != document['gas']:
                    default_document['econ_function']['ownership']['gas_ownership'][
                        'net_revenue_interest'] = document['gas'] * 100
                if document['revint'] != document['ngl']:
                    default_document['econ_function']['ownership']['ngl_ownership'][
                        'net_revenue_interest'] = document['ngl'] * 100
                if document['revint'] != document['condensate']:
                    default_document['econ_function']['ownership']['drip_condensate_ownership'][
                        'net_revenue_interest'] = document['condensate'] * 100
            except Exception:
                pass

            # npi is expense
            try:
                if document['npint'] < 0:
                    default_document['econ_function']['ownership']['net_profit_interest'][
                        'expense'] = document['npint'] * 100

                # npi is revenue
                if document['npint'] > 0:
                    default_document['econ_function']['ownership']['net_profit_interest'][
                        'revenue'] = document['npint'] * 100
                    del default_document['econ_function']['ownership']['net_profit_interest']['expense']
            except Exception:
                pass

            default_document['createdAt'] = datetime.datetime.now()
            default_document['updatedAt'] = datetime.datetime.now()

        if collection_name == 'ownership':
            try:
                default_document['wells'].add((document['well'], document['grp_id']))
                default_document['econ_function']['ownership']['initial_ownership'][
                    'working_interest'] = document['wrkint'] * 100
                default_document['econ_function']['ownership']['initial_ownership']['original_ownership'][
                    'net_revenue_interest'] = document['revint'] * 100
                default_document['econ_function']['ownership']['initial_ownership']['original_ownership'][
                    'lease_net_revenue_interest'] = document['lsenri'] * 100

                if document['revint'] != document['oil']:
                    default_document['econ_function']['ownership']['initial_ownership']['oil_ownership'][
                        'net_revenue_interest'] = document['oil'] * 100
                if document['revint'] != document['gas']:
                    default_document['econ_function']['ownership']['initial_ownership']['gas_ownership'][
                        'net_revenue_interest'] = document['gas'] * 100
                if document['revint'] != document['ngl']:
                    default_document['econ_function']['ownership']['initial_ownership']['ngl_ownership'][
                        'net_revenue_interest'] = document['ngl'] * 100
                if document['revint'] != document['condensate']:
                    default_document['econ_function']['ownership']['initial_ownership']['drip_condensate_ownership'][
                        'net_revenue_interest'] = document['condensate'] * 100

                # npi is expense
                if document['npint'] <= 0:
                    default_document['econ_function']['ownership']['initial_ownership'][
                        'net_profit_interest_type'] = 'expense'
                    default_document['econ_function']['ownership']['initial_ownership'][
                        'net_profit_interest'] = document['npint'] * -100

                # npi is revenue
                if document['npint'] > 0:
                    default_document['econ_function']['ownership']['initial_ownership'][
                        'net_profit_interest_type'] = 'revenue'
                    default_document['econ_function']['ownership']['initial_ownership'][
                        'net_profit_interest'] = document['npint'] * 100
            except Exception:
                pass

            default_document['createdAt'] = datetime.datetime.now()
            default_document['updatedAt'] = datetime.datetime.now()

        if collection_name == 'reserves_category':
            default_document['wells'].add(document['well'])
            fill_reserves_document(default_document, document)

        if collection_name == 'wells':
            try:
                document = self.convert_datetime_string_to_object(document, 'first_prod_date')
                document = self.convert_datetime_string_to_object(document, 'end_prod_date')
                # add document information to default_document
                default_document['phdwin_id'] = document['phdwin_id']
                default_document['api14'] = document['api14']
                default_document['lease_number'] = document['lse_id']
                default_document['country'] = document['country']
                default_document['field'] = document['field']
                default_document['lease_name'] = document['well_name']
                default_document['well_name'] = document['lse_name']
                default_document['prms_reserves_category'] = document['reserves_class_name']
                default_document['prms_reserves_sub_category'] = document['reserves_sub_category_name']
                # default_document['pad_name'] = document['location']
                default_document['primary_product'] = document['primary_product']
                default_document['current_operator'] = document['current_operator']
                default_document['county'] = document['county']
                default_document['state'] = document['state']
                default_document['first_prod_date'] = document['first_prod_date']
                # default_document['end_prod_date'] = document['end_prod_date']
                default_document['acre_spacing'] = document['acre_spacing']
                default_document['true_vertical_depth'] = document['tvd']
                default_document['tubing_id'] = document['tubing_id']
                default_document['upper_perforation'] = document['upper_perforation']
                default_document['lower_perforation'] = document['lower_perforation']
                default_document['landing_zone'] = document['landing_zone']
                default_document['formation_thickness_mean'] = document['formation_thickness_mean']
                default_document['inptID'] = document['inptID']
                default_document['project'] = self.project_id
                default_document['createdAt'] = datetime.datetime.now()
                default_document['updatedAt'] = datetime.datetime.now()
                default_document['dataSource'] = 'phdwin'

                default_document['surfaceLatitude'] = document['surface_latitude_wgs84']
                default_document['surfaceLongitude'] = document['surface_longitude_wgs84']

                default_document['has_daily'] = False
                default_document['has_monthly'] = False
            except Exception:
                pass

        if collection_name == 'general_options':
            default_document['project'] = self.project_id  # only have one project when uploading new file

            default_document['name'] = 'PHD_CC_ECON_SETTINGS'

            default_document['econ_function']['main_options']['currency'] = document['defcurrency']
            default_document['econ_function']['main_options']['aggregation_date'] = document['as_of_date'].strftime(
                "%Y-%m-%d")

            if document['fiscaleco'] == 0:
                default_document['econ_function']['main_options']['reporting_period'] = 'calendar'
            elif document['fiscaleco'] == 1:
                default_document['econ_function']['main_options']['reporting_period'] = 'fiscal'
                default_document['econ_function']['main_options']['fiscal'] = get_dictionary('fiscal_dic')[
                    document['as_of_date'].strftime("%m")]

            if document['income_tax'] == 0:
                default_document['econ_function']['main_options']['income_tax'] = 'no'
            else:
                default_document['econ_function']['main_options']['income_tax'] = 'yes'
                default_document['econ_function']['income_tax']['state_income_tax'] = {
                    "rows": [{
                        "multiplier": 0,
                        "entire_well_life": "Flat"
                    }]
                }
                default_document['econ_function']['income_tax']['federal_income_tax'] = {
                    "rows": [{
                        "multiplier": document['income_tax'],
                        "entire_well_life": "Flat"
                    }]
                }

            if document['defconvention'] == 3:
                default_document['econ_function']['main_options']['output_report_version'] = 'sec'
            elif document['defconvention'] == 1 or document['defconvention'] == 2:
                default_document['econ_function']['main_options']['output_report_version'] = 'custom'

            if document['numcompound'] == 1:
                default_document['econ_function']['discount_table']['discount_method'] = 'yearly'
            elif document['numcompound'] == 4:
                default_document['econ_function']['discount_table']['discount_method'] = 'quarterly'
            elif document['numcompound'] == 12:
                default_document['econ_function']['discount_table']['discount_method'] = 'monthly'
            elif document['numcompound'] == 365:
                default_document['econ_function']['discount_table']['discount_method'] = 'daily'

            if document['endmoneco'] == 0:
                default_document['econ_function']['discount_table']['cash_accrual_time'] = 'mid_month'
            elif document['endmoneco'] == 1:
                default_document['econ_function']['discount_table']['cash_accrual_time'] = 'end_month'

            default_document['econ_function']['discount_table']['first_discount'] = document['disfact']

        return default_document

    def dictionary_format_conversionn_add_to_format_doc(  # noqa (C901)
            self, document, collection_name, filled_default_document, differential_document=None):
        # fill in the existed format document
        if collection_name == 'ownership_old':
            obj = {"working_interest": 12, "net_revenue_interest": 12, "lease_net_revenue_interest": 12}
            obj['working_interest'] = document['wrkint'] * 100
            obj['net_revenue_interest'] = document['revint'] * 100

            obj['lease_net_revenue_interest'] = document['revint'] * 100

            obj['date'] = document['start_date'].strftime("%Y-%m-%d")

            filled_default_document['econ_function']['reversion']['rows'].append(obj)

        if collection_name == 'ownership':
            obj = {
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": 100,
                "original_ownership": {
                    "net_revenue_interest": 75,
                    "lease_net_revenue_interest": 75
                },
                "oil_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": 0
            }
            obj['working_interest'] = document['wrkint'] * 100
            obj['original_ownership']['net_revenue_interest'] = document['revint'] * 100
            obj['original_ownership']['lease_net_revenue_interest'] = document['lsenri'] * 100

            if document['revint'] != document['oil']:
                obj['oil_ownership']['net_revenue_interest'] = document['oil'] * 100
            if document['revint'] != document['gas']:
                obj['gas_ownership']['net_revenue_interest'] = document['gas'] * 100
            if document['revint'] != document['ngl']:
                obj['ngl_ownership']['net_revenue_interest'] = document['ngl'] * 100
            if document['revint'] != document['condensate']:
                obj['drip_condensate_ownership']['net_revenue_interest'] = document['condensate'] * 100

            # npi is expense
            obj['net_profit_interest'] = abs(document['npint'] * 100)

            # reversion extraction and filling
            if document['revtype_descr'] == 'Net m$':
                # payout without investment (net, include npi)
                obj['payout_without_investment'] = float(document['revvalue']) * 1000
                obj['balance'] = 'net'
                obj['include_net_profit_interest'] = 'yes'
            elif document['revtype_descr'] == 'Time yr':
                # date
                obj['date'] = document['start_date'].strftime("%Y-%m-%d")
            elif document['revtype_descr'] == 'Payout':
                # payout without investment (gross, not include npi)
                obj['payout_without_investment'] = float(document['revvalue']) * 1000
                obj['balance'] = 'gross'
                obj['include_net_profit_interest'] = 'no'
            elif document['revtype_descr'] == 'Date':
                # date
                obj['date'] = document['start_date'].strftime("%Y-%m-%d")
            elif document['revtype_descr'] == 'Net m$ (w/inv)':
                # payout with investment (net, include npi)
                obj['payout_with_investment'] = float(document['revvalue']) * 1000
                obj['balance'] = 'net'
                obj['include_net_profit_interest'] = 'yes'
            elif document['revtype_descr'] == 'Payout (w/inv)':
                # payout with investment (gross, not include npi)
                obj['payout_with_investment'] = float(document['revvalue']) * 1000
                obj['balance'] = 'gross'
                obj['include_net_profit_interest'] = 'no'
            elif document['revtype_descr'] == 'Cum Gas':
                # well head gas cum (gross)
                obj['well_head_gas_cum'] = float(document['revvalue']) * 1000
            elif document['revtype_descr'] == 'Cum Oil':
                # well head oil cum (gross)
                obj['well_head_oil_cum'] = float(document['revvalue']) * 1000
            else:
                # Add Wrk Int, Mult Wrk Int, Add Roy Int, Mult Roy Int currently can not be mapping to CC format
                return filled_default_document

            for key in OWNERSHIP_KEYS:
                if filled_default_document['econ_function']['ownership'][key] is None:
                    filled_default_document['econ_function']['ownership'][key] = obj
                    break

            # filled_default_document['econ_function']['reversion']['rows'].append(obj)

        if collection_name == 'wells':
            # change the date format from string to datetime object in MongoDB
            document = self.convert_datetime_string_to_object(document, 'first_prod_date')
            document = self.convert_datetime_string_to_object(document, 'end_prod_date')
            # update document information to filled_default_document
            filled_default_document['phdwin_id'] = document['phdwin_id']
            filled_default_document['lease_number'] = document['lse_id']
            filled_default_document['country'] = document['country']
            filled_default_document['field'] = document['field']
            filled_default_document['lease_name'] = document['well_name']
            filled_default_document['well_name'] = document['lse_name']
            filled_default_document['prms_reserves_category'] = document['reserves_class_name']
            filled_default_document['prms_reserves_sub_category'] = document['reserves_sub_category_name']
            # filled_default_document['pad_name'] = document['location']
            filled_default_document['primary_product'] = document['primary_product']
            filled_default_document['current_operator'] = document['current_operator']
            filled_default_document['county'] = document['county']
            filled_default_document['state'] = document['state']
            filled_default_document['first_prod_date'] = document['first_prod_date']
            # filled_default_document['end_prod_date'] = document['end_prod_date']
            filled_default_document['acre_spacing'] = document['acre_spacing']
            filled_default_document['true_vertical_depth'] = document['tvd']
            filled_default_document['tubing_id'] = document['tubing_id']
            filled_default_document['upper_perforation'] = document['upper_perforation']
            filled_default_document['lower_perforation'] = document['lower_perforation']
            filled_default_document['landing_zone'] = document['landing_zone']
            filled_default_document['formation_thickness_mean'] = document['formation_thickness_mean']
            filled_default_document['inptID'] = document['inptID']
            filled_default_document['project'] = self.project_id
            #filled_default_document['createdAt'] = datetime.datetime.now()
            filled_default_document['updatedAt'] = datetime.datetime.now()

            filled_default_document['surfaceLatitude'] = document['surface_latitude_wgs84']
            filled_default_document['surfaceLongitude'] = document['surface_longitude_wgs84']

        return filled_default_document

    def dictionary_format_conversionn_forecast_process(self, document):  # noqa: C901
        '''
        06/10 2019
        save the forecast document to new format
        '''
        data_obj = {
            "gas": {
                "P_dict": {
                    "best": {
                        "segments": [],
                        "diagnostics": {}
                    }
                },
                "p_extra": {
                    "plot_idx": ""
                }
            },
            "oil": {
                "P_dict": {
                    "best": {
                        "segments": [],
                        "diagnostics": {}
                    }
                },
                "p_extra": {
                    "plot_idx": ""
                }
            },
            "water": {
                "P_dict": {
                    "best": {
                        "segments": [],
                        "diagnostics": {}
                    }
                },
                "p_extra": {
                    "plot_idx": ""
                }
            }
        }

        base_phase = None

        document = check_for_incremental_forecast(document, self.parent_incremental_dict, self.lse_id_to_curarcseq_dic)

        if document['start_date'] is None or document['end_date'] is None:
            return
        phd_start_date = document['start_date'].strftime("%Y-%m-%d")
        phd_end_date = document['end_date'].strftime("%Y-%m-%d")

        phd_qi = document['qi']
        phd_qend = document['qend']
        phd_b = document['b']
        phd_deff = document['deff']
        phd_dm = document['dm']

        phd_phase = document['productname']
        phd_well = document['well']

        phd_forecastname = document['arcseqname']
        phd_segment_sequence = document['segment_sequence']  # noqa: F841
        phd_prod_code = document['productcode']
        phd_forecast_type_code = document['typecurve']

        if (phd_qi is None or phd_qend is None or phd_b is None or phd_deff is None or phd_dm is None
                or phd_start_date is None or phd_end_date is None):
            return

        phdwin_segment_template = PhdwinConvert()

        try:
            document = calculate_select_forecast_parameters(document)
        except Exception:
            pass

        # validate b parameter
        if phd_b == 1:
            phd_b = 0.999
            document['b'] = 0.999

        # TODO  Add Error message
        if phd_b != 0 and phd_deff < 0:
            document['b'] = 0
            phd_b = document['b']

        document = verify_segment_merge(document, phd_forecastname, phd_well, phd_phase, self.forecast_datas_dic)

        valid = True

        # choose forecast type from 5 types by various condition,
        # set convert_curve_segment = seg.get_template('arps', document)
        if phd_prod_code in phdwin_ratio_product_code or phd_forecast_type_code == 6:
            if int(phd_prod_code) == ProductCode.wc.value:
                document, valid = convert_wc_to_wr(document)
                if not valid:
                    return
            # ratio segment
            segment_obj = phdwin_segment_template.convert(ForecastEnum.ratio.value, document)
            # get forecast phase and base phase
            phd_phase, base_phase = get_phdwin_ratio_product_phases(int(phd_prod_code), phd_forecast_type_code,
                                                                    document, self.major_phase_dict)

        elif phd_qi == phd_qend:
            # flat segment
            segment_obj = phdwin_segment_template.convert('flat', document)
            self.flat.append(document)

        elif phd_b == 0 and phd_deff < 0:
            # exp_inc
            segment_obj = phdwin_segment_template.convert('exp_inc', document)
            self.exp_inc.append(document)

        elif phd_b == 0 and phd_deff > 0:
            # exp_dec
            segment_obj = phdwin_segment_template.convert('exp_dec', document)
            self.exp_dec.append(document)

        elif phd_b > 0 and phd_dm == 0:
            # arps
            segment_obj = phdwin_segment_template.convert('arps', document)
            self.arps.append(document)

        elif phd_b > 0 and phd_dm > 0:
            # arps_modified
            segment_obj = phdwin_segment_template.convert('arps_modified', document)
            self.arps_modified.append(document)
        else:
            '''
            bug appeared here:
            phd_b < 0
            '''
            return

        if str(phd_phase).lower() not in ['oil', 'gas', 'water']:
            return
        if base_phase is None:
            if phd_qi != phd_qend:
                if segment_obj['start_idx'] >= segment_obj['end_idx'] and (
                        segment_obj['end_idx'] + 30 > segment_obj['start_idx']
                        or segment_obj['q_start'] > 0.92 * segment_obj['q_end']):
                    segment_obj['end_idx'] = segment_obj['start_idx'] + 1
                elif segment_obj['end_idx'] < segment_obj['start_idx'] or (segment_obj['q_start'] < 0.01
                                                                           and segment_obj['q_end'] < 0.01):
                    return

        # main logic for importing forecast
        # check if forecastname and well is already is forecast_datas_dic, if it is append segment

        if (phd_forecastname, phd_well) in self.forecast_datas_dic:
            saved_forecast_datas_document = self.forecast_datas_dic[(phd_forecastname, phd_well)]
            saved_forecast_datas_document = add_base_phase_if_ratio(saved_forecast_datas_document, phd_phase,
                                                                    base_phase)
            # forecast_datas collection
            append_existing_segment_obj_phdwin(saved_forecast_datas_document, segment_obj, data_obj, phd_phase,
                                               base_phase, self.forecast_other_phase)
        # if forecast name and well is not in forecast_datas_dic but forecast name in forecasts-dic
        # create forecast-datas document and append segment
        elif phd_forecastname in self.forecasts_dic:
            saved_forecasts_document = self.forecasts_dic[phd_forecastname]
            append_new_segment_obj_phdwin(saved_forecasts_document, segment_obj, data_obj, phd_well, phd_phase,
                                          base_phase, phd_forecastname, self.forecast_datas_dic,
                                          self.get_default_format, self.forecast_other_phase, self.project_id)

        # if neither case is satisfied create new forecast and forecast data documents and append segment
        else:
            create_forecast_doc_and_append_segment_obj_phdwin(segment_obj, data_obj, phd_well, phd_phase, base_phase,
                                                              phd_forecastname, self.forecasts_dic,
                                                              self.forecast_datas_dic, self.get_default_format,
                                                              self.forecast_other_phase, self.forecast_id_to_name_dic,
                                                              self.project_id)

        self.well_count_df = add_forecast_well_count(self.well_count_df, document, self.lse_id_to_curarcseq_dic)

    def remove_id_from_dictionary(self, document):
        '''
        remove phdwin_id and inptID for document in order to update the json already in database.
        '''
        document.pop('phdwin_id', None)
        document.pop('inptID', None)
        return document

    def convert_datetime_string_to_object(self, document, key_name):
        '''
        document is in dictionary type
        add datetime object to key_name in document
        '''
        # if key_name in document
        try:
            datetime_format = datetime.datetime.strptime(document[key_name], "%Y-%m-%d")
            # for phdwin missing value where year == 1800
            if datetime_format.year == 1800:
                document[key_name] = None
            else:
                document[key_name] = datetime_format
            return document
        # if key_name not in document
        except Exception:
            return document

    def change_wells_from_set_to_list(self, ls):
        '''
        change ['wells'] of document in global_ls from set to list
        '''
        for document in ls:
            document['wells'] = list(document['wells'])
        return ls

    def add_wells_map_to_models_in_scenarios(self, data_list, scenario_well_assignments_dic, model_name):  # noqa: C901
        """
        add each well in one model to scenarios['assumptions'][model_name]['wells']
        ex: {"5c3663027840303f2892bf5c" : ObjectId("5c48da3fb7199b0013bf0416")}

        special note: if model_name is forecast_data, will also create well-forecasts collection
        to record 1 well have how many forecast version
        """
        default_qualifier_key = 'default'
        model_key = 'model'

        for model_document in data_list:
            # logic for handling unique model
            if len(model_document['wells']) == 1:
                # the only well use this econ model
                if model_name != 'forecast_data':
                    well_primary_id, grp_ids = get_well_and_grp_id_for_swa(model_document['wells'][0],
                                                                           list(self.grp_id_scenario_dict.keys()))
                    for grp_id in grp_ids:
                        model_document['well'] = well_primary_id
                        model_document['scenario'] = self.grp_id_scenario_id.get(grp_id)
                        model_document['unique'] = True

            for primary_id in model_document['wells']:
                well_primary_id, grp_ids = get_well_and_grp_id_for_swa(primary_id,
                                                                       list(self.grp_id_scenario_dict.keys()))
                # if in this stream_properteis model,
                # the start_date != the latest date record in self.count_yield_wellid_to_latest_date_dic
                # skip assign this model to the well_primary_id
                for grp_id in grp_ids:
                    if model_name == 'stream_properties' and 'dates' in model_document['econ_function']['yields'][
                            'ngl']['rows'][-1]:  # need to compare the last (-1) segment of start_date

                        if model_document['econ_function']['yields']['ngl']['rows'][-1]['dates'][
                                'start_date'] != self.count_yield_wellid_to_latest_date_dic[str(well_primary_id)]:
                            continue
                        else:
                            # let the stream_properties document to be in the scenario-well-assigments
                            pass

                    # find the well_primary_id in scenario_well_assignments_dic
                    if (str(well_primary_id), grp_id) in scenario_well_assignments_dic:
                        # save into scenario_well_assignments_dic
                        if model_name == 'forecast_data':
                            # get well assigned forecast name
                            well_id = model_document['well']
                            lse_id = self.wells_dic[str(well_id)]['lease_number']

                            incremental_index = get_forecast_incremental_index(lse_id, model_document,
                                                                               self.parent_incremental_dict,
                                                                               self.lse_to_db_id)

                            if int(lse_id) in self.lse_id_to_curarcseq_dic:
                                if incremental_index is not None:
                                    well_assigned_forecast_name = ('INCREMENTALS' if incremental_index == 0 else
                                                                   f'INCREMENTALS_{incremental_index+1}')
                                else:
                                    assigned_seg = self.lse_id_to_curarcseq_dic[int(lse_id)]
                                    well_assigned_forecast_name = self.seq_to_forecast_name_dic[assigned_seg]

                                # get model_document forecast name
                                forecast_id = model_document['forecast']
                                document_forecast_name = self.forecast_id_to_name_dic[forecast_id]

                                # only use the assigned forecast
                                try:
                                    if document_forecast_name.strip() == str(well_assigned_forecast_name).strip():
                                        scenario_well_assignments_dic[(
                                            str(well_primary_id), grp_id
                                        )]['forecast'][default_qualifier_key][model_key] = model_document['forecast']
                                except Exception:
                                    pass

                        else:
                            scenario_well_assignments_dic[(
                                str(well_primary_id),
                                grp_id)][model_name][default_qualifier_key][model_key] = model_document['_id']
                    else:
                        # get scenario_well_assignments default format
                        # add ['scenario'] = scenario_id
                        # add ['general_options'] = general_option_id
                        # add ['well'] = well_primary_id
                        # add [model_name] = model_document['_id']
                        # save into scenario_well_assignments_dic
                        scenario_well_assignments_default_document = self.get_default_format(
                            'scenario_well_assignments')
                        scenario_well_assignments_default_document['scenario'] = self.grp_id_scenario_id.get(grp_id)
                        scenario_well_assignments_default_document['well'] = well_primary_id
                        scenario_well_assignments_default_document['createdAt'] = datetime.datetime.now()
                        scenario_well_assignments_default_document['updatedAt'] = datetime.datetime.now()
                        scenario_well_assignments_default_document['project'] = self.project_id
                        scenario_well_assignments_default_document['dates'][default_qualifier_key][
                            model_key] = self.dates_model_id
                        scenario_well_assignments_default_document['production_vs_fit'][default_qualifier_key][
                            model_key] = self.actual_or_forecast_id

                        if model_name == 'forecast_data':
                            # get well assigned forecast name
                            well_id = model_document['well']
                            lse_id = self.wells_dic[str(well_id)]['lease_number']
                            incremental_index = get_forecast_incremental_index(lse_id, model_document,
                                                                               self.parent_incremental_dict,
                                                                               self.lse_to_db_id)
                            if lse_id in self.lse_id_to_curarcseq_dic:
                                if incremental_index is not None:
                                    well_assigned_forecast_name = ('INCREMENTALS' if incremental_index == 0 else
                                                                   f'INCREMENTALS_{incremental_index+1}')
                                else:
                                    assigned_seg = self.lse_id_to_curarcseq_dic[lse_id]
                                    well_assigned_forecast_name = self.seq_to_forecast_name_dic[assigned_seg]

                                # get model_document forecast name
                                forecast_id = model_document['forecast']
                                document_forecast_name = self.forecast_id_to_name_dic[forecast_id]

                                # only use the assigned forecast
                                try:
                                    if str(document_forecast_name).strip() == str(well_assigned_forecast_name).strip():
                                        scenario_well_assignments_default_document['forecast'][default_qualifier_key][
                                            model_key] = model_document['forecast']
                                except Exception:
                                    pass
                        else:
                            scenario_well_assignments_default_document[model_name][default_qualifier_key][
                                model_key] = model_document['_id']

                        scenario_well_assignments_dic[(str(well_primary_id),
                                                       grp_id)] = scenario_well_assignments_default_document

            del model_document['wells']

        return data_list, scenario_well_assignments_dic

    def update_well_models(self):
        if self.wells_to_update:
            self.db['wells'].bulk_write(self.wells_to_update)

    def insert_many_once_for_all_well_in_one_db(self):  # noqa (C901)
        '''
        insert all assumptions into mongodb once only, from global data list
        '''
        for grp_id, scenario_name in self.grp_id_scenario_dict.items():
            scenarios_filled_default_document = self.get_default_format('scenarios')
            scenarios_filled_default_document['_id'] = ObjectId()
            self.grp_id_scenario_id[grp_id] = scenarios_filled_default_document['_id']

            scenario_well_assignments_dic = {}
            scenarios_filled_default_document['wells'] = self.db['wells'].find({
                'project': self.project_id
            }).distinct('_id')

            # remove incremental wells from scenario
            copy_scenarios_filled_default_document = copy.deepcopy(scenarios_filled_default_document)
            try:
                scenarios_filled_default_document = update_scenario_doc_if_incremental(
                    scenarios_filled_default_document, self.parent_incremental_dict, self.lse_to_db_id)
            except Exception as e:
                scenarios_filled_default_document = copy_scenarios_filled_default_document
                self.log_report.log_error(message=self.error_msg.incremental_failure,
                                          well=ALL_CASES,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)

            scenarios_filled_default_document['name'] = scenario_name
            scenarios_filled_default_document['general_options'] = self.general_options_model_id
            # temp setup user
            scenarios_filled_default_document[
                'project'] = self.project_id  # only have one project when uploading new file
            scenarios_filled_default_document['createdAt'] = datetime.datetime.now()
            scenarios_filled_default_document['updatedAt'] = datetime.datetime.now()

            self.db['scenarios'].insert_one(scenarios_filled_default_document)

        if self.dates_data_list:
            try:
                self.dates_data_list = self.change_wells_from_set_to_list(self.dates_data_list)
                self.dates_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                    self.dates_data_list, scenario_well_assignments_dic, 'dates')
                self.db['assumptions'].insert_many(self.dates_data_list)
            except Exception:
                self.log_insert_error(PhdwinModelEnum.dates.value)

        if self.actual_forecast_data_list:
            try:
                self.actual_forecast_data_list = self.change_wells_from_set_to_list(self.actual_forecast_data_list)
                (self.actual_forecast_data_list,
                 scenario_well_assignments_dic) = self.add_wells_map_to_models_in_scenarios(
                     self.actual_forecast_data_list, scenario_well_assignments_dic, 'production_vs_fit')
                self.db['assumptions'].insert_many(self.actual_forecast_data_list)
            except Exception:
                self.log_insert_error(PhdwinModelEnum.actual_v_forecast.value)

        if self.ownership_data_list:
            try:
                self.ownership_data_list = self.change_wells_from_set_to_list(self.ownership_data_list)
                self.ownership_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                    self.ownership_data_list, scenario_well_assignments_dic, 'ownership_reversion')
                self.db['assumptions'].insert_many(self.ownership_data_list)
            except Exception:
                self.log_insert_error(PhdwinModelEnum.ownership.value)

        if self.price_data_list:
            try:
                self.price_data_list = self.change_wells_from_set_to_list(self.price_data_list)
                self.price_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                    self.price_data_list, scenario_well_assignments_dic, 'pricing')
                self.db['assumptions'].insert_many(self.price_data_list)
            except Exception:
                self.log_insert_error(PhdwinModelEnum.pricing.value)

        if self.differential_data_list:
            try:
                self.differential_data_list = self.change_wells_from_set_to_list(self.differential_data_list)
                self.differential_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                    self.differential_data_list, scenario_well_assignments_dic, 'differentials')

                self.db['assumptions'].insert_many(self.differential_data_list)
            except Exception:
                self.log_insert_error(PhdwinModelEnum.differentials.value)

        if self.capex_data_list:
            try:
                self.capex_data_list = self.change_wells_from_set_to_list(self.capex_data_list)
                self.capex_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                    self.capex_data_list, scenario_well_assignments_dic, 'capex')
                self.db['assumptions'].insert_many(self.capex_data_list)
            except Exception:
                self.log_insert_error(PhdwinModelEnum.capex.value)

        if self.tax_data_list:
            try:
                self.tax_data_list = self.change_wells_from_set_to_list(self.tax_data_list)
                self.tax_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                    self.tax_data_list, scenario_well_assignments_dic, 'production_taxes')
                self.db['assumptions'].insert_many(self.tax_data_list)
            except Exception:
                self.log_insert_error(PhdwinModelEnum.prod_tax.value)

        if self.expense_data_list:
            try:
                self.expense_data_list = self.change_wells_from_set_to_list(self.expense_data_list)
                self.expense_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                    self.expense_data_list, scenario_well_assignments_dic, 'expenses')
                self.db['assumptions'].insert_many(self.expense_data_list)
            except Exception:
                self.log_insert_error(PhdwinModelEnum.expenses.value)

        if self.reserves_data_list:
            try:
                self.reserves_data_list = self.change_wells_from_set_to_list(self.reserves_data_list)
                self.reserves_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                    self.reserves_data_list, scenario_well_assignments_dic, 'reserves_category')
                self.db['assumptions'].insert_many(self.reserves_data_list)
            except Exception:
                self.log_insert_error(PhdwinModelEnum.reserves.value)

        if self.risking_data_list:
            try:
                self.risking_data_list = self.change_wells_from_set_to_list(self.risking_data_list)
                self.risking_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                    self.risking_data_list, scenario_well_assignments_dic, 'risking')
                self.db['assumptions'].insert_many(self.risking_data_list)
            except Exception:
                self.log_insert_error(PhdwinModelEnum.risk.value)

        if self.stream_properties_data_list:
            try:
                self.stream_properties_data_list = self.change_wells_from_set_to_list(self.stream_properties_data_list)
                (self.stream_properties_data_list,
                 scenario_well_assignments_dic) = self.add_wells_map_to_models_in_scenarios(
                     self.stream_properties_data_list, scenario_well_assignments_dic, 'stream_properties')

                self.db['assumptions'].insert_many(self.stream_properties_data_list)
            except Exception:
                self.log_insert_error(PhdwinModelEnum.stream_props.value)

        forecasts_ls = list(self.forecasts_dic.values())
        if forecasts_ls:
            # replace incremental well with parent well in forecast document
            copy_forecasts_ls = forecasts_ls[:]
            try:
                forecasts_ls = replace_incremental_well_forecast_to_parent(forecasts_ls, self.parent_incremental_dict,
                                                                           self.lse_to_db_id)
            except Exception as e:
                forecasts_ls = copy_forecasts_ls
                self.log_report.log_error(message=self.error_msg.incremental_failure,
                                          well=ALL_CASES,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)

            self.db['forecasts'].insert_many(forecasts_ls)

        forecast_datas_ls = list(self.forecast_datas_dic.values())
        if forecast_datas_ls:
            try:
                forecast_datas_ls = self.forecast_datas_format_v2_to_v3(forecast_datas_ls)
                forecast_datas_ls, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                    forecast_datas_ls, scenario_well_assignments_dic, 'forecast_data')
                forecast_datas_ls = clean_ratio_name(forecast_datas_ls)
                forecast_datas_ls = forecast_validity_check(forecast_datas_ls)
                self.db['deterministic-forecast-datas'].insert_many(forecast_datas_ls)
            except Exception:
                self.log_insert_error(PhdwinModelEnum.forecast.value)

        scenario_well_assignments_dic = self.check_wells_size_equal_to_scenario_well_assignments_and_well_forecasts(
            scenario_well_assignments_dic, 'scenario-well-assignments')

        copy_scenario_well_assignments_dic = copy.deepcopy(scenario_well_assignments_dic)
        try:
            scenario_well_assignments_dic = create_incrementals_in_scenario_well_assignment(
                scenario_well_assignments_dic, self.parent_incremental_dict, self.lse_to_db_id)
        except Exception as e:
            scenario_well_assignments_dic = copy_scenario_well_assignments_dic
            self.log_report.log_error(message=self.error_msg.incremental_failure,
                                      well=ALL_CASES,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      exception=e)
        self.db['scenario-well-assignments'].insert_many(list(scenario_well_assignments_dic.values()))

    def check_wells_size_equal_to_scenario_well_assignments_and_well_forecasts(self, dic, collection_name):
        '''
        check every _id of wells, if not in scenario_well_assignments_dic,
        add a no econ model assignments default document into scenario_well_assignments_dic
        '''
        # 9/5 2019 stop searching from self.db['wells']
        # if len(self.db['wells'].find({'project': self.project_id}).distinct('_id')) == len(dic):
        if len(self.wells_dic) == len(dic):
            return dic

        if collection_name == 'scenario-well-assignments':
            # 9/5 2019 stop searching from self.db['wells']
            # for well_primary_id in self.db['wells'].find({'project': self.project_id}).distinct('_id'):
            for grp_id in self.grp_id_scenario_dict:
                for well_primary_id in self.wells_dic:
                    if (grp_id, str(well_primary_id)) not in dic:
                        scenario_well_assignments_default_document = self.get_default_format(
                            'scenario_well_assignments')
                        scenario_well_assignments_default_document['scenario'] = self.grp_id_scenario_id.get(grp_id)
                        scenario_well_assignments_default_document['project'] = self.project_id
                        scenario_well_assignments_default_document['well'] = well_primary_id
                        #scenario_well_assignments_default_document['general_options'] = general_option_id
                        scenario_well_assignments_default_document['createdAt'] = datetime.datetime.now()
                        scenario_well_assignments_default_document['updatedAt'] = datetime.datetime.now()
                        dic[well_primary_id] = scenario_well_assignments_default_document

            return dic

    def add_yield_to_stream_properties_filled_default_doc(  # noqa: C901
            self, forecast_df, stream_properties_filled_default_document):
        '''
        add yield data from forecast_df to stream_properties_filled_default_document (for same property_id)
        '''
        def compare_string_date(new_date, current_date):
            '''
            if new_date is later than current_date:
                return True
            else:
                return False

            date format: 2017-7-15
            '''

            ls_new_date = new_date.split('-')
            ls_current_date = current_date.split('-')

            new_date_year = int(ls_new_date[0])
            new_date_month = int(ls_new_date[1])
            new_date_day = int(ls_new_date[2])

            current_date_year = int(ls_current_date[0])
            current_date_month = int(ls_current_date[1])
            current_date_day = int(ls_current_date[2])

            if new_date_year > current_date_year:
                return True
            elif new_date_year < current_date_year:
                return False

            if new_date_month > current_date_month:
                return True
            elif new_date_month < current_date_month:
                return False

            if new_date_day > current_date_day:
                return True
            elif new_date_day < current_date_day:
                return False

            return False

        # add yield (forecast version name) to stream_properties model
        # name is not unique, which will cause problem. need to be fixed later on when giving name to all model
        try:
            stream_properties_filled_default_document['name'] = forecast_df['arcseqname'].unique()[0]
        except Exception:
            pass

        for index, row_selected in forecast_df.iterrows():
            yield_obj = {'yield': 0, 'dates': {'start_date': '', 'end_date': ''}, 'unshrunk_gas': 'Unshrunk Gas'}
            # get the latest date for each wellid to save into self.count_yield_wellid_to_latest_date_dic
            well_primary_id = next(iter(stream_properties_filled_default_document['wells']))
            if str(well_primary_id) in self.count_yield_wellid_to_latest_date_dic:
                date_comparing_result = compare_string_date(
                    row_selected['start_date'], self.count_yield_wellid_to_latest_date_dic[str(well_primary_id)])

                if date_comparing_result:
                    self.count_yield_wellid_to_latest_date_dic[str(well_primary_id)] = row_selected['start_date']
            else:
                self.count_yield_wellid_to_latest_date_dic[str(well_primary_id)] = row_selected['start_date']

            yield_obj['dates']['start_date'] = row_selected['start_date']
            yield_obj['dates']['end_date'] = row_selected['end_date']

            if row_selected['productcode'] == 40:
                # add error message for when qi is not qend
                yield_obj = process_ngl_yield_units(row_selected, yield_obj)
            else:
                if row_selected['typecurve'] == 6:
                    stream_properties_filled_default_document, success = process_ngl_yield_units(
                        row_selected, yield_obj, formula=True, document=stream_properties_filled_default_document)
                    if success:
                        return stream_properties_filled_default_document
                    else:
                        continue

            stream_properties_filled_default_document['econ_function']['yields']['ngl']['rows'].append(yield_obj)

        return stream_properties_filled_default_document

    def yield_shrinkage_compare_and_save_into_self_data_list(self):
        copy_forecast_df_in_dictionary = self.forecast_df_in_dictionary.copy()

        # remove those property_id which has Both Shrinkage ans Yield, so the left_property_id only have Yield

        for property_id in self.count_yield_dictionary:
            del copy_forecast_df_in_dictionary[property_id]

        for left_property_id in copy_forecast_df_in_dictionary:
            try:
                forecast_df = copy_forecast_df_in_dictionary[left_property_id]

                forecast_df = forecast_df.loc[(
                    (forecast_df['productname'].astype(str).str.strip().str.lower() == 'ngl yield') |
                    (forecast_df['productname'].astype(str).str.strip().str.lower() == 'ngl'))]

                temp_lse_id_to_curarcseq_dic = {str(k): v for k, v in self.lse_id_to_curarcseq_dic.items()}
                cur_arc_seq = str(temp_lse_id_to_curarcseq_dic.get(str(left_property_id))).strip().lower()
                forecast_df = forecast_df[forecast_df['arcseq'].astype(str).str.strip().str.lower() == cur_arc_seq]

                # add those lse_id only have NGL Yield or Yield with BTU
                # (from left_property_id, which means these left_property_id does not have Shrinkage value
                # from prices_taxes_expense table)
                if not forecast_df.empty:
                    # if BTU value in NaN, give BTU the default value 1000 for this Yield with BTU stream_properties
                    btu_value = float(forecast_df['btu'].values[0])
                    if math.isnan(btu_value) or btu_value == 0:
                        btu_value = 1000

                    ls_arcseqname = forecast_df['arcseqname'].unique()
                    for arcseqname in ls_arcseqname:
                        arcseqname_selected_forecast_df = forecast_df.loc[forecast_df['arcseqname'] == arcseqname]
                        arcseqname_selected_forecast_df.sort_values('segment_sequence', inplace=True)

                        # need to query mongodb to get _id of well
                        lse_id = str(arcseqname_selected_forecast_df['lse_id'].values[0])
                        wells_exist_document = self.wells_dic.get(self.lse_to_db_id.get(lse_id))

                        # if wells document doesn't exist
                        if not wells_exist_document:
                            break

                        stream_properties_filled_default_document = self.get_default_format('stream_properties')
                        stream_properties_filled_default_document['wells'].add(wells_exist_document['_id'])
                        stream_properties_filled_default_document['createdAt'] = datetime.datetime.now()
                        stream_properties_filled_default_document['updatedAt'] = datetime.datetime.now()
                        stream_properties_filled_default_document['econ_function']['btu_content'][
                            'shrunk_gas'] = btu_value

                        (stream_properties_filled_default_document
                         ) = self.add_yield_to_stream_properties_filled_default_doc(
                             arcseqname_selected_forecast_df, stream_properties_filled_default_document)

                        if len(stream_properties_filled_default_document['econ_function']['yields']['ngl']['rows']) > 1:
                            stream_properties_filled_default_document['econ_function']['yields']['ngl']['rows'][-1][
                                'dates']['end_date'] = 'Econ Limit'
                            stream_properties_filled_default_document['econ_function']['yields']['ngl']['rows'].pop(0)

                        stream_properties_filled_default_document = process_stream_properties_document_format(
                            stream_properties_filled_default_document, yield_=True)
                        stream_prop_name = get_model_name('',
                                                          stream_properties_filled_default_document,
                                                          phd_model_name=arcseqname)
                        self.compare_and_save_into_self_data_list(stream_properties_filled_default_document,
                                                                  self.stream_properties_data_list,
                                                                  self.projects_dic,
                                                                  model_name=stream_prop_name)

                # add only BTU to stream_properties model since the left_property_id does not have Shrinkage or Yield
                else:
                    # if BTU value in NaN, stop importing this BTU only stream_properties model
                    try:
                        btu_value = float(copy_forecast_df_in_dictionary[left_property_id]['btu'].values[0])
                    except (ValueError, IndexError):
                        continue
                    if math.isnan(btu_value) or btu_value == 0:
                        continue

                    # need to query mongodb to get _id of well
                    lse_id = str(left_property_id)
                    wells_exist_document = self.wells_dic.get(self.lse_to_db_id.get(lse_id))

                    # if wells document doesn't exist
                    if not wells_exist_document:
                        break

                    stream_properties_filled_default_document = self.get_default_format('stream_properties')
                    stream_properties_filled_default_document['wells'].add(wells_exist_document['_id'])
                    stream_properties_filled_default_document['createdAt'] = datetime.datetime.now()
                    stream_properties_filled_default_document['updatedAt'] = datetime.datetime.now()
                    stream_properties_filled_default_document['econ_function']['btu_content']['shrunk_gas'] = btu_value

                    stream_prop_name = get_model_name('', stream_properties_filled_default_document)
                    self.compare_and_save_into_self_data_list(stream_properties_filled_default_document,
                                                              self.stream_properties_data_list,
                                                              self.projects_dic,
                                                              model_name=stream_prop_name)
            except Exception as e:
                self.log_report.log_error(message=self.error_msg.ngl_btu,
                                          model=PhdwinModelEnum.stream_props.value,
                                          well=left_property_id,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)

    def create_wells_dic(self):
        well_documents = self.context.wells_collection.find({'project': self.project_id})
        for well_doc in well_documents:
            self.wells_dic[str(well_doc['_id'])] = well_doc
            self.lse_to_db_id[str(well_doc.get('lease_number', ''))] = str(well_doc['_id'])

    def import_json_to_mongodb(self, selected_df, collection_name):  # noqa: C901
        '''
        currently use folder_name as database name
        each database name is a company, the collection under the database name have information,
        such as production, ownership, capex, ... etc.
        import the json to mongodb for each major function
        '''
        wells_exist_document = None

        collection = self.db[collection_name]
        json_str = selected_df.to_json(orient='records')
        data_list = json.loads(json_str)

        # special handle for no data, for example: in price_taxes_expenses, les_id exist in msg, but not in lsg
        # note 1/29: now should be fine, since msg and lsg are append to one df before call import_json_to_mongodb
        if len(data_list) == 0:
            return

        # special handle for 'econ_options'
        if collection_name == 'econ_options':
            for document in data_list:
                document = self.convert_datetime_string_to_object(document, 'discount_date')
                document = self.convert_datetime_string_to_object(document, 'as_of_date')

                general_options_filled_default_document = self.dictionary_format_conversionn_get_default_format(
                    document, 'general_options')

                self.default_dates_dic = get_dates_values_from_econ_option_doc(document)

                dates_filled_default_document = process_phdwin_dates_document(
                    document,
                    self.change_dates_hierarchy,
                    self.project_id,
                    self.default_dates_dic,
                    self.get_default_format,
                    date_only=True,
                    lse_id_to_case_multiplier=self.lse_id_to_case_multiplier)

                general_options_filled_default_document['_id'] = ObjectId()
                dates_filled_default_document['_id'] = ObjectId()

                general_options_filled_default_document['createdAt'] = datetime.datetime.now()
                general_options_filled_default_document['updatedAt'] = datetime.datetime.now()
                dates_filled_default_document['createdAt'] = datetime.datetime.now()
                dates_filled_default_document['updatedAt'] = datetime.datetime.now()

                general_options_filled_default_document = add_options(general_options_filled_default_document)
                dates_filled_default_document = add_options(dates_filled_default_document)

                self.db['assumptions'].insert_one(general_options_filled_default_document)
                self.db['assumptions'].insert_one(dates_filled_default_document)

                # the only general_option model _id, use for the only project document defaultAsssumptions
                self.general_options_model_id = general_options_filled_default_document['_id']
                self.dates_model_id = dates_filled_default_document['_id']

            return

        # special note:
        # when insert well_header into database, if well_header has longitude and latitutde
        # insert a corresponding document(include longitude and latitude) into points(collection)
        # 1. insert many document(include longitude and latitude)
        # 2. update one document(include longitude and latitude)

        # get the well_header collection to add _id(well) to each document
        # if 'wells' in self.db.list_collection_names():
        if collection_name != 'wells':
            lse_id = str(selected_df['lse_id'].values[0])
            wells_exist_document = self.wells_dic.get(self.lse_to_db_id.get(lse_id))

            if not wells_exist_document:
                return

        # well_header collection find phdwin_id already exist
        if wells_exist_document:
            temp_data_list = []

            # need to specifically declare default_document for each table(collection)
            actual_vs_forecast_filled_default_document = None
            ownership_filled_default_document = None
            price_filled_default_document = None
            capex_filled_default_document = None
            tax_filled_default_document = None
            expense_filled_default_document = None
            stream_properties_filled_default_document = None
            reserves_filled_default_document = None
            risk_filled_default_document = None
            dates_filled_default_document = None
            differential_filled_default_document = None
            fixed_expense_assignment = None

            own_model_name = ''
            risk_model_name = ''
            capex_model_name = ''
            price_diff_model_name = ''
            tax_model_name = ''
            expense_model_name = ''
            stream_prop_name = ''
            actual_v_forecast_name = ''

            for document in data_list:
                if collection_name == 'wells':
                    # update the exist well_header and points
                    # need to get inptid from exist document
                    document = self.get_inptid_wellid_from_well_header(wells_exist_document, document)
                    point_document = self.create_point_document_format(document)
                    wells_exist_document = self.dictionary_format_conversionn_add_to_format_doc(
                        document, collection_name, wells_exist_document)
                    document['_id'] = wells_exist_document['_id']
                    document = remove_none_from_wells_document(document)
                    self.wells_dic[str(document['_id'])] = document
                    # if longitude or latitude != None, then create the point (different to PhDWins,
                    # due to None means no mapping in Aries, 0 means no value in PhDWins)
                    # if longitude or latitude != 0, then create the point
                    if (point_document['location']['coordinates'][0] is not None
                            and point_document['location']['coordinates'][0] != 0
                            and point_document['location']['coordinates'][1] is not None
                            and point_document['location']['coordinates'][1] != 0):
                        # self.update_or_insert_longitude_latitude_to_points_collection(point_document)
                        pass
                else:
                    document = self.get_inptid_wellid_from_well_header(wells_exist_document, document)

                    # change the date format from string to datetime object in MongoDB
                    for key in ['date', 'offset_date', 'start_date', 'end_date']:
                        document = self.convert_datetime_string_to_object(document, key)

                    # stop importing the document if any 'date', 'offset', 'start_date', 'end_date' == None,
                    # since it lack of needed information for model
                    try:
                        if any(document[key] is None for key in ['date', 'offset_date', 'start_date', 'end_date']):
                            continue
                    except KeyError:
                        pass

                    # need specific handle for each collection_name
                    if collection_name == 'ownership':
                        if document['seq'] == 1:
                            # if lse_id is new, then get epmty default format
                            ownership_filled_default_document = self.dictionary_format_conversionn_get_default_format(
                                document, collection_name)
                        else:
                            # if lse_id is same, use previous filled forma
                            if ownership_filled_default_document is not None:
                                (ownership_filled_default_document
                                 ) = self.dictionary_format_conversionn_add_to_format_doc(
                                     document, collection_name, ownership_filled_default_document)
                    elif collection_name == 'dates':
                        (dates_filled_default_document, risk_filled_default_document,
                         dates_model_name) = process_phdwin_dates_document(
                             document,
                             self.change_dates_hierarchy,
                             self.project_id,
                             self.default_dates_dic,
                             self.get_default_format,
                             lse_id_to_case_multiplier=self.lse_id_to_case_multiplier)
                    elif collection_name == 'reservoir_properties':
                        self.update_wells(document, collection_name)
                    elif collection_name == 'fluid_properties':
                        self.update_wells(document, collection_name)
                    elif collection_name == 'reserves_category':
                        reserves_filled_default_document = self.dictionary_format_conversionn_get_default_format(
                            document, collection_name)
                    elif collection_name == 'prices_taxes_expense':
                        try:
                            if document['type_name'] == 'Price':
                                (price_filled_default_document, differential_filled_default_document,
                                 price_diff_model_name) = process_phdwin_pricing_diff_document(
                                     document,
                                     price_filled_default_document,
                                     price_diff_model_name,
                                     self.get_default_format,
                                     differential_document=differential_filled_default_document)

                            if document['type_name'] in PHDWIN_TAX_TYPE:
                                # use None to get default format or filled format
                                tax_filled_default_document, tax_model_name = process_phdwin_tax_document(
                                    tax_filled_default_document, tax_model_name, document, self.get_default_format)

                            if any(
                                    format_for_matching(phdwin_expense_type) in format_for_matching(
                                        document['type_name']) for phdwin_expense_type in PHDWIN_EXPENSE_TYPE):
                                fixed_expense_assignment = get_new_fixed_assignment_dic(
                                ) if expense_filled_default_document is None else fixed_expense_assignment
                                (expense_filled_default_document, expense_model_name,
                                 fixed_expense_assignment) = process_phdwin_expense_document(
                                     expense_filled_default_document, expense_model_name, document,
                                     fixed_expense_assignment, self.well_count_df, self.get_default_format,
                                     self.lse_id_to_case_multiplier, self.lse_id_no_exp_before_dict)

                            if document['type_name'] == 'Shrink Models (Shrinkage)':
                                (stream_properties_filled_default_document,
                                 stream_prop_name) = process_phdwin_stream_properties_document(
                                     stream_properties_filled_default_document, stream_prop_name, document,
                                     self.get_default_format)
                        except Exception:
                            self.log_case_error(document, collection_name)

                    elif collection_name == 'capex':
                        try:
                            capex_filled_default_document = process_phdwin_capex_document(
                                capex_filled_default_document, document, self.get_default_format,
                                self.lse_id_to_case_multiplier)
                        except Exception:
                            self.log_case_error(document, collection_name)

                    elif collection_name == 'forecast':
                        # get the daily or monthly production data point from global dictionary,
                        # but some lse_id in forecast table might not have daily or monthly production data
                        #need 'try' syntax to avoid error
                        # 2/28 new CC forecast format might not need to get monthly or daily data
                        self.dictionary_format_conversionn_forecast_process(document)
                        (actual_vs_forecast_filled_default_document,
                         actual_v_forecast_name) = process_phdwin_actual_vs_forecast_properties_document(
                             actual_vs_forecast_filled_default_document, actual_v_forecast_name, document,
                             self.change_dates_hierarchy, self.sop_act_dict, self.major_phase_dict,
                             self.lse_id_to_curarcseq_dic, self.get_default_format)
                    else:
                        temp_data_list.append(document)

            if ownership_filled_default_document:
                # give None segment a default empty obj
                obj = get_ownership_obj()

                for key in OWNERSHIP_KEYS:
                    if ownership_filled_default_document['econ_function']['ownership'][key] is None:
                        ownership_filled_default_document['econ_function']['ownership'][key] = obj

                try:
                    self.compare_and_save_into_self_data_list(ownership_filled_default_document,
                                                              self.ownership_data_list,
                                                              self.projects_dic,
                                                              model_name=get_model_name(
                                                                  own_model_name, ownership_filled_default_document))
                except Exception:
                    self.log_model_process_error(ownership_filled_default_document,
                                                 type=PhdwinModelEnum.ownership.value)

            if price_filled_default_document:
                try:
                    price_filled_default_document = self.add_zero_to_end_of_row(price_filled_default_document)
                    price_filled_default_document = process_price_document_and_combine(price_filled_default_document)
                    price_filled_default_document = convert_price_dates_to_offset(price_filled_default_document,
                                                                                  self.lease_id_to_sop_dic,
                                                                                  self.lse_to_db_id, self.TIT_df)

                    self.compare_and_save_into_self_data_list(price_filled_default_document,
                                                              self.price_data_list,
                                                              self.projects_dic,
                                                              model_name=price_diff_model_name)
                except Exception:
                    self.log_model_process_error(price_filled_default_document, type=PhdwinModelEnum.pricing.value)

            if differential_filled_default_document:
                try:
                    differential_filled_default_document = self.add_zero_to_end_of_row(
                        differential_filled_default_document)

                    self.compare_and_save_into_self_data_list(differential_filled_default_document,
                                                              self.differential_data_list,
                                                              self.projects_dic,
                                                              model_name=price_diff_model_name)
                except Exception:
                    self.log_model_process_error(differential_filled_default_document,
                                                 type=PhdwinModelEnum.differentials.value)

            if capex_filled_default_document:
                try:
                    if len(capex_filled_default_document['econ_function']['other_capex']['rows']) > 1:
                        capex_filled_default_document['econ_function']['other_capex']['rows'].pop(0)

                    self.compare_and_save_into_self_data_list(capex_filled_default_document,
                                                              self.capex_data_list,
                                                              self.projects_dic,
                                                              model_name=get_model_name(
                                                                  capex_model_name, capex_filled_default_document))
                except Exception:
                    self.log_model_process_error(capex_filled_default_document, type=PhdwinModelEnum.capex.value)

            if tax_filled_default_document:
                try:
                    tax_filled_default_document = self.add_zero_to_end_of_row(tax_filled_default_document)
                    tax_filled_default_document = process_tax_document_and_combine(tax_filled_default_document)
                    tax_filled_default_document = convert_tax_dates_to_offset(tax_filled_default_document,
                                                                              self.lease_id_to_sop_dic,
                                                                              self.lse_to_db_id, self.TIT_df)

                    self.compare_and_save_into_self_data_list(tax_filled_default_document,
                                                              self.tax_data_list,
                                                              self.projects_dic,
                                                              model_name=tax_model_name)
                except Exception:
                    self.log_model_process_error(tax_filled_default_document, type=PhdwinModelEnum.prod_tax.value)

            if expense_filled_default_document:
                try:
                    expense_filled_default_document = self.add_zero_to_end_of_row(expense_filled_default_document)
                    expense_filled_default_document = process_expense_document_and_combine(
                        expense_filled_default_document)
                    expense_filled_default_document = convert_expense_dates_to_offset(
                        expense_filled_default_document, self.lease_id_to_sop_dic, self.lse_to_db_id, self.TIT_df)

                    self.compare_and_save_into_self_data_list(expense_filled_default_document,
                                                              self.expense_data_list,
                                                              self.projects_dic,
                                                              model_name=expense_model_name)
                except Exception:
                    self.log_model_process_error(expense_filled_default_document, type=PhdwinModelEnum.expenses.value)

            if reserves_filled_default_document:
                try:
                    self.compare_and_save_into_self_data_list(reserves_filled_default_document, self.reserves_data_list,
                                                              self.projects_dic)
                except Exception:
                    self.log_model_process_error(reserves_filled_default_document, type=PhdwinModelEnum.reserves.value)

            if risk_filled_default_document:
                try:
                    self.compare_and_save_into_self_data_list(risk_filled_default_document,
                                                              self.risking_data_list,
                                                              self.projects_dic,
                                                              model_name=get_model_name(
                                                                  risk_model_name, risk_filled_default_document))
                except Exception:
                    self.log_model_process_error(risk_filled_default_document, type=PhdwinModelEnum.risk.value)

            if dates_filled_default_document:
                try:
                    self.compare_and_save_into_self_data_list(dates_filled_default_document,
                                                              self.dates_data_list,
                                                              self.projects_dic,
                                                              model_name=dates_model_name)
                except Exception:
                    self.log_model_process_error(dates_filled_default_document, type=PhdwinModelEnum.dates.value)

            if actual_vs_forecast_filled_default_document:
                try:
                    self.compare_and_save_into_self_data_list(actual_vs_forecast_filled_default_document,
                                                              self.actual_forecast_data_list,
                                                              self.projects_dic,
                                                              model_name=actual_v_forecast_name)
                except Exception:
                    self.log_model_process_error(dates_filled_default_document, type=PhdwinModelEnum.dates.value)

            if stream_properties_filled_default_document:
                # the following comparison will be inside another function
                # (yield_shrinkage_compare_and_save_into_self_data_list) locally
                # count the yield (from forecast) which also have shrinkage (from prices_taxes_expense)
                # need to compare the difference
                # between the count_yield_dictionary_global to forecast_df_in_dictionary_global
                # then create the assumptions
                # base one the difference, use the yield with default shrinkage to create new models (stream_properties)
                # then compare_and_save_into_self_data_list
                # (the new stream_properties, stream_properties_data_list_global)
                try:
                    temp_lse_id_to_curarcseq_dic = {str(k): v for k, v in self.lse_id_to_curarcseq_dic.items()}
                    cur_arc_seq = temp_lse_id_to_curarcseq_dic.get(str(lse_id))
                    forecast_df = self.forecast_df_in_dictionary.get(lse_id)
                    if forecast_df is not None:
                        self.count_yield_dictionary[lse_id] = forecast_df
                        # productcode 40 is NGL yield, perhaps need to handle more yield in the future
                        forecast_df = forecast_df.loc[(
                            (forecast_df['productname'].astype(str).str.strip().str.lower() == 'ngl yield') |
                            (forecast_df['productname'].astype(str).str.strip().str.lower() == 'ngl'))]
                    else:
                        forecast_df = pd.DataFrame()

                    # Shrinkage, Yield, with BTU model
                    if not forecast_df.empty:
                        if cur_arc_seq is not None:
                            forecast_df = forecast_df[forecast_df['arcseq'].astype(str).str.strip().str.lower() == str(
                                cur_arc_seq).strip().lower()]
                        ls_arcseqname = forecast_df['arcseqname'].unique()
                        for arcseqname in ls_arcseqname:
                            arcseqname_selected_forecast_df = forecast_df.loc[forecast_df['arcseqname'] == arcseqname]
                            arcseqname_selected_forecast_df.sort_values('segment_sequence', inplace=True)

                            process_function = self.add_yield_to_stream_properties_filled_default_doc(
                                arcseqname_selected_forecast_df, stream_properties_filled_default_document)

                            stream_properties_filled_default_document_with_yield = process_function

                            (stream_properties_filled_default_document_with_yield
                             ) = process_stream_properties_document_format(
                                 stream_properties_filled_default_document_with_yield, yield_=True)
                            stream_prop_name = get_model_name(stream_prop_name,
                                                              stream_properties_filled_default_document_with_yield,
                                                              phd_model_name=arcseqname)
                            self.compare_and_save_into_self_data_list(
                                stream_properties_filled_default_document_with_yield,
                                self.stream_properties_data_list,
                                self.projects_dic,
                                model_name=stream_prop_name)
                    # Shrinkage with BTU model
                    else:
                        stream_properties_filled_default_document = process_stream_properties_document_format(
                            stream_properties_filled_default_document)
                        self.compare_and_save_into_self_data_list(stream_properties_filled_default_document,
                                                                  self.stream_properties_data_list,
                                                                  self.projects_dic,
                                                                  model_name=stream_prop_name)
                except Exception:
                    self.log_model_process_error(stream_properties_filled_default_document,
                                                 type=PhdwinModelEnum.stream_props.value)

            elif len(temp_data_list) != 0:
                collection.insert_many(temp_data_list)

        else:
            # nothing in database found, whole new data to import to database
            # currently only for well_header importing to database
            for document in data_list:
                # this point_document lack of 'well'(_id) information,
                # but can get longitude and latitude information first
                point_document = self.create_point_document_format(document)
                document = self.dictionary_format_conversionn_get_default_format(document, collection_name)
                document = remove_none_from_wells_document(document)
                document['project'] = self.project_id
                document['well_name'] = str(document['well_name'])
                document['api14'] = str(document['api14'])
                document['lease_number'] = str(document['lease_number'])
                try:
                    document['chosenID'] = str(document['phdwin_id'])
                    document['phdwin_id'] = document['lease_number']
                except KeyError:
                    document['chosenID'] = ''
                imported = True

                data_settings = DataSettings('phdwin', str(self.project_id))
                import_data = PhdwinImportData([document], self, data_settings)

                try:
                    import_detail, well_docs = self.context.import_service.upsert_wells(import_data,
                                                                                        replace_production=False,
                                                                                        operation='upsert')
                except Exception:
                    imported = False
                try:
                    document['_id'] = import_detail['upserted'][0]['_id']
                    self.lse_to_db_id[document['lease_number']] = str(document['_id'])
                    self.wells_dic[str(document['_id'])] = document
                except (NameError, KeyError, IndexError):
                    # name_error --> import_detail is not defined
                    # key_error -->  'upserted' not valid key
                    # IndexError --> 'upserted list is empty
                    pass
                # if longitude or latitude != None, then create the point
                # (different to PhDWins, due to None means no mapping in Aries, 0 means no value in PhDWins)
                # if longitude or latitude != 0, then create the point
                if (point_document['location']['coordinates'][0] is not None
                        and point_document['location']['coordinates'][0] != 0
                        and point_document['location']['coordinates'][1] is not None
                        and point_document['location']['coordinates'][1] != 0):
                    # self.update_or_insert_longitude_latitude_to_points_collection(point_document)
                    pass
                if imported:
                    self.context.import_service.update_calcs(well_docs, data_settings)

                    wells_ids_dict = self.context.import_service.get_wells_ids(well_docs, data_settings)
                    import_data = PhdwinImportData([document], self, data_settings)
                    self.context.import_service.update_monthly(import_data, wells_ids_dict)
                    self.context.import_service.update_daily(import_data, wells_ids_dict)

    def log_model_process_error(self, document, type=None):
        well = document.get('well')
        message = f'Error Processing {type} model'
        self.log_report.log_error(message=message, model=type, well=well, severity=ErrorMsgSeverityEnum.critical.value)

    def log_insert_error(self, model_type):
        self.log_report.log_error(message=self.error_msg.model_fail(model_type),
                                  well=ALL_CASES,
                                  model=model_type,
                                  severity=ErrorMsgSeverityEnum.critical.value)

    def log_case_error(self, document, collection_name):
        model_name = document.get('name', '')
        well = document.get('well')
        document
        model_type = ''
        if collection_name == 'capex':
            model_type = PhdwinModelEnum.capex.value
        elif collection_name == 'prices_taxes_expense':
            if document['type_name'] == 'Price':
                model_type = PhdwinModelEnum.pricing.value
            if document['type_name'] in PHDWIN_TAX_TYPE:
                model_type = PhdwinModelEnum.prod_tax.value
            if document['type_name'] == 'Shrink Models (Shrinkage)':
                model_name = PhdwinModelEnum.stream_props.value
            if any(
                    format_for_matching(phdwin_expense_type) in format_for_matching(document['type_name'])
                    for phdwin_expense_type in PHDWIN_EXPENSE_TYPE):
                model_type = PhdwinModelEnum.expenses.value
        message = f'Error Processing {model_name} ({model_type})'
        self.log_report.log_error(message=message,
                                  model=model_type,
                                  well=well,
                                  severity=ErrorMsgSeverityEnum.error.value)

    def well_days(self):
        '''
        input: multiple raw .csv, currently .TST.csv, .ACT.csv
        output: formated well_ID.daily_production_pdh.json
        '''
        df, self.daily_start_date_dict, self.daily_end_date_dict = process_phdwin_daily_data(
            self.TST_df.copy(), self.ACT_df.copy(), self.IDC_df.copy())

        if df is None:
            return

        if not df.empty:
            # add index
            df['index'] = df.apply(lambda x: calculate_start_date_index(x['Year'], x['Month'], x['Day']), axis=1)
        self.well_daily_data = df.copy()

    def well_months(self):
        (self.well_monthly_data, self.well_count_df, self.monthly_start_date_dict,
         self.monthly_end_date_dict) = get_phdwin_well_monthly_data_import(self.DAT_df.copy(), self.ACT_df.copy(),
                                                                           self.IDC_df.copy())

    def create_new_monthly_format_via_ls(self, selected_df, property_id):
        '''
        11/21/2019 create new data schema, also need to create the following 3 things
        1. create index (use year, month, 15)
        2. remove date before sop and after eop (use property_id to get sop and eop)
        3. create self.lse_id_to_monthly_fpd_dic
        '''
        # get sop and eop
        sop_base_format = self.lease_id_to_sop_dic.get(property_id)
        eop_base_format = self.lease_id_to_eop_dic.get(property_id)
        sop = pd.to_datetime(sop_base_format, errors='coerce')
        eop = pd.to_datetime(eop_base_format, errors='coerce')

        if not pd.isnull(sop) and not pd.isnull(eop):
            self.lse_id_to_monthly_fpd_dic[property_id] = sop.strftime('%Y-%m-%d')

            sop_year = sop.year
            sop_month = sop.month

            eop_year = eop.year
            eop_month = eop.month

            monthly_format_ls = []

            for index, row in selected_df.iterrows():
                if int(row['Year']) < sop_year:
                    continue
                if int(row['Year']) > eop_year:
                    continue

                start_index = calculate_start_date_index(row['Year'], 1, 15)
                chosen_id = None
                first_production_index = 0

                temp_document_ls = [start_index, chosen_id, first_production_index, [], [], [], []]

                if int(row['Year']) == sop_year:
                    temp_document_ls[2] = sop_month - 1
                    temp_document_ls[3] += [None] * (sop_month - 1)
                    temp_document_ls[4] += [None] * (sop_month - 1)
                    temp_document_ls[5] += [None] * (sop_month - 1)
                    temp_document_ls[6] += [None] * (sop_month - 1)
                    for month in range(sop_month, 13):
                        temp_document_ls = self.append_row_to_new_format_ls(row, temp_document_ls, month)
                elif int(row['Year']) == eop_year:
                    for month in range(1, eop_month + 1):
                        temp_document_ls = self.append_row_to_new_format_ls(row, temp_document_ls, month)
                    temp_document_ls[3] += [None] * (12 - eop_month)
                    temp_document_ls[4] += [None] * (12 - eop_month)
                    temp_document_ls[5] += [None] * (12 - eop_month)
                    temp_document_ls[6] += [None] * (12 - eop_month)
                else:
                    for month in range(1, 13):
                        temp_document_ls = self.append_row_to_new_format_ls(row, temp_document_ls, month)
                monthly_format_ls.append(temp_document_ls)

            format_selected_df = pd.DataFrame.from_records(
                monthly_format_ls,
                columns=['startIndex', 'chosenID', 'first_production_index', 'index', 'water', 'oil', 'gas'])
            format_selected_df['phdwin_id'] = selected_df['phdwin_id'].values[0]
            format_selected_df['lse_id'] = selected_df['Lse Id'].values[0]
            format_selected_df['lse_name'] = selected_df['Lse Name'].values[0]
            return format_selected_df

    def append_row_to_new_format_ls(self, row, temp_document_ls, month):
        '''
        11/21/2019
        append row to new format list
        '''
        month_dic = get_dictionary('Month')
        water_prod = 'water' + month_dic[month]
        oil_prod = 'oil' + month_dic[month]
        gas_prod = 'gas' + month_dic[month]

        temp_document_ls[3].append(calculate_start_date_index(row['Year'], month, 15))
        temp_document_ls[4].append(row[water_prod])
        temp_document_ls[5].append(row[oil_prod])
        temp_document_ls[6].append(row[gas_prod])

        return temp_document_ls

    def remove_date_after_eop_before_sop(self, property_id, selected_df):
        '''
        remove date after eop for both daily and monthly production data
        '''
        selected_df['datetime'] = pd.to_datetime(selected_df['date'])
        if property_id in self.lease_id_to_eop_dic:
            eop = pd.to_datetime(self.lease_id_to_eop_dic[property_id])
            selected_df = selected_df[(selected_df['datetime'] <= eop)]
        if property_id in self.lease_id_to_sop_dic:
            sop = pd.to_datetime(self.lease_id_to_sop_dic[property_id])
            selected_df = selected_df[(selected_df['datetime'] >= sop)]
        del selected_df['datetime']
        return selected_df

    def get_lease_id_to_exclsum_dic(self):
        df = self.ACT_df.copy()
        # create self.excluded_wells_dic
        self.lease_id_to_exclsum_dic = pd.Series(df['Exclsum'].values, index=df[PhdHeaderCols.lse_id.value]).to_dict()

        return

    def reserve_cat(self):

        df = self.reserve_class.copy()

        df.columns = format_well_header_col(df.columns)

        lse_id = df['lse_id'].unique()
        for property_id in lse_id:
            try:
                selected_df = df[df.lse_id == property_id]
                self.import_json_to_mongodb(selected_df, 'reserves_category')
            except Exception as e:
                self.log_report.log_error(message=self.error_msg.reserve_cat,
                                          well=property_id,
                                          model=PhdwinModelEnum.reserves.value,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)

    def get_required_dict_for_import(self):
        (df, self.lse_id_to_curarcseq_dic, self.major_phase_dict, self.lease_id_to_eop_dic, self.lease_id_to_sop_dic,
         self.reserve_class, self.sop_act_dict,
         self.eop_act_dict) = process_phdwin_well_header_tables(self.ACT_df.copy(), self.IDC_df.copy(),
                                                                self.PNF_df.copy(), self.ZON_df.copy(),
                                                                self.VOL_df.copy(), self.CLA_df.copy(),
                                                                self.CAT_df.copy())

    def wells(self):
        '''
        input: multiple raw .csv, currently .ACT.csv, .ZON.csv, .VOL.csv, CLA.csv, CAT.csv
        output: formated well_ID.well_header_phd.json
        '''
        # read main PHDWIN well header info file
        (df, self.lse_id_to_curarcseq_dic, self.major_phase_dict, self.lease_id_to_eop_dic, self.lease_id_to_sop_dic,
         self.reserve_class, self.sop_act_dict,
         self.eop_act_dict) = process_phdwin_well_header_tables(self.ACT_df.copy(), self.IDC_df.copy(),
                                                                self.PNF_df.copy(), self.ZON_df.copy(),
                                                                self.VOL_df.copy(), self.CLA_df.copy(),
                                                                self.CAT_df.copy())
        self.grp_id_scenario_dict = get_partnership_dict(self.GRP_df.copy(), self.user_selected_scenarios)

        # sorting important to make sure all parent well ahead of incremental in loop
        df.sort_values(by='Lse Name', inplace=True)
        # get all lease IDs
        ls_lseid = df['Lse Id'].unique()

        # loop through each Lease ID
        for idx, property_id in enumerate(ls_lseid):
            # get the dataframe for the selected well
            selected_df = get_well_header_selected_df(df, property_id)

            self.import_json_to_mongodb(selected_df, 'wells')

    def get_attribute_dict_from_well_headers(self):
        (df, self.lse_id_to_curarcseq_dic, self.major_phase_dict, self.lease_id_to_eop_dic, self.lease_id_to_sop_dic,
         self.reserve_class, self.sop_act_dict,
         self.eop_act_dict) = process_phdwin_well_header_tables(self.ACT_df.copy(), self.IDC_df.copy(),
                                                                self.PNF_df.copy(), self.ZON_df.copy(),
                                                                self.VOL_df.copy(), self.CLA_df.copy(),
                                                                self.CAT_df.copy())
        self.grp_id_scenario_dict = get_partnership_dict(self.GRP_df.copy(), self.user_selected_scenarios)

    def create_project_collection(self, project_name='PHDWIN Project'):
        '''
        after insert or update all the wells into mongodb,
        create a corresponding project for saving all the wells into it
        in the near future, need to a update_project_collection function if wells or models condition changes!!!
        '''
        project_default_document = self.get_default_format('projects')
        project_default_document['name'] = project_name
        project_default_document['_id'] = ObjectId()
        project_default_document['createdAt'] = datetime.datetime.now()
        project_default_document['updatedAt'] = datetime.datetime.now()

        self.project_id = project_default_document['_id']
        self.projects_dic[self.project_id] = project_default_document

    def set_chosen_project_name_for_combocurve(self, project_ls, user_project_id):
        '''
        set user chosen project name as the only project in self.projects_dic for later importing process
        '''
        the_only_project_dic = {}
        # only pick one project
        user_select_project_name = project_ls[0]

        # should have only 1 element in the chosed_ls
        for _id in self.projects_dic:
            # ensure that only one project is going to be imported
            if (self.projects_dic[_id]['name'] == user_select_project_name) and len(the_only_project_dic) < 1:
                self.projects_dic[_id]['_id'] = ObjectId(user_project_id)
                self.project_id = ObjectId(user_project_id)
                the_only_project_dic[ObjectId(user_project_id)] = self.projects_dic[_id]

        self.projects_dic = copy.deepcopy(the_only_project_dic)

    def dates(self):
        try:
            df, self.lse_id_no_exp_before_dict = format_ecf_for_cut_off(self.ECF_df.copy(), self.ACT_df.copy(),
                                                                        self.MSC_df.copy(), self.FOR_df.copy(),
                                                                        self.TIT_df.copy(), self.sop_act_dict,
                                                                        self.eop_act_dict)
        except Exception as e:
            self.log_report.log_error(message=self.error_msg.cut_off_risk,
                                      well=ALL_CASES,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      exception=e)
            df = self.ECF_df.copy()

        lse_id = df['lse_id'].unique()

        for property_id in lse_id:
            try:
                selected_df = df[df['lse_id'] == property_id]
                self.import_json_to_mongodb(selected_df, 'dates')
            except Exception as e:
                self.log_report.log_error(message=self.error_msg.cut_off_risk,
                                          well=property_id,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)

    def incrementals(self):
        try:
            pull_incremental_from_econ(self.ECF_df.copy(), self.parent_incremental_dict)
        except Exception as e:
            self.log_report.log_error(message=self.error_msg.incrementals,
                                      well=ALL_CASES,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      exception=e)

    def econ_options(self):
        df = self.TIT_df.copy()
        gca_df = self.GCA_df.copy()
        gcl_df = self.GCL_df.copy()

        try:
            # Fiscaleco: 0->Calender, 1->Fiscaleco
            # Endmoneco: 0->Mid, 1->End
            df = df.filter(items=[
                'Maxecoyears', 'Defcurrency', 'Disc Date', 'Asof Date', 'Fiscaleco', 'Endmoneco', 'Numcompound',
                'Disfact', 'Defconvention'
            ])

            type2_gca_df = gca_df.loc[gca_df['Type'] == 2]
            type2_gcl_df = gcl_df.loc[gcl_df['Type'] == 2]

            type2_gca_df = type2_gca_df.reset_index(drop=True)
            type2_gcl_df = type2_gcl_df.reset_index(drop=True)

            if type2_gcl_df.empty:
                df['income_tax'] = 0
            else:
                df['income_tax'] = type2_gcl_df.at[0, 'Value']

            if not type2_gcl_df.empty:
                df['forwhom'] = type2_gca_df.at[0, 'Forwhom']
                df['startdate'] = type2_gca_df.at[0, 'Startdate']

            df['Discount Date'] = df.apply(lambda x: calculate_phdwin_date(x['Disc Date']), axis=1)

            df['As of Date'] = df.apply(lambda x: calculate_phdwin_date(x['Asof Date']), axis=1)

            # add year, month, date (3 columns) for both First Prod Date and End Prod Date
            df['Discount Date Year'] = df['Discount Date'].dt.year
            df['Discount Date Month'] = df['Discount Date'].dt.month
            df['Discount Date Day'] = df['Discount Date'].dt.day

            df['As of Date Year'] = df['As of Date'].dt.year
            df['As of Date Month'] = df['As of Date'].dt.month
            df['As of Date Day'] = df['As of Date'].dt.day

            del df['Disc Date']
            del df['Asof Date']

            df['Discount Date'] = df['Discount Date'].apply(lambda x: x.strftime('%Y-%m-%d'))
            df['As of Date'] = df['As of Date'].apply(lambda x: x.strftime('%Y-%m-%d'))

            # set row where year == 1800, then discount date and as of date = None (2 columns),
            # since from source Sop and Eop have no data
            df.loc[df['Discount Date Year'] == 1800, ['Discount Date']] = None
            df.loc[df['As of Date Year'] == 1800, ['As of Date']] = None

            # set row where year == 1800, then year, month, day = 0 (3 columns),
            # since from source Sop and Eop have no data
            df.loc[df['Discount Date Year'] == 1800,
                   ['Discount Date Year', 'Discount Date Month', 'Discount Date Day']] = 0
            df.loc[df['As of Date Year'] == 1800, ['As of Date Year', 'As of Date Month', 'As of Date Day']] = 0

            df.columns = format_well_header_col(df.columns)
        except Exception as e:
            self.log_report.log_error(
                message=self.error_msg.econ_function,
                model=f'{PhdwinModelEnum.general_options.value} and {PhdwinModelEnum.dates.value}',
                severity=ErrorMsgSeverityEnum.error.value,
                exception=e)
            df = generate_default_econ_settings()

        self.import_json_to_mongodb(df, 'econ_options')

    def reservoir_properties(self):
        '''
        input: multiple raw .csv, currently .VOL.csv
        output: formated well_ID.reservoir_properties_phd.json
        '''
        #os.mkdir('02_output_json/PHDWin/' + folder_name)

        df = self.VOL_df.copy()
        try:
            df['Exclsum'] = df['Lse Id'].map(self.lease_id_to_exclsum_dic)
            df = df.loc[(df['Exclsum'] == 0)]
            del df['Exclsum']

            idc_df = self.IDC_df.copy()
            idc_df = idc_df.loc[(idc_df['Lblnum'] == 7)]
            idc_df['Idval'] = idc_df['Idval'].apply(lambda x: x.strip())
            lseid_idval_dict = pd.Series(idc_df['Idval'].values, index=idc_df['Lse Id']).to_dict()
            df["phdwin_id"] = df["Lse Id"].map(lseid_idval_dict)

            df = df.filter(items=[
                'phdwin_id', 'Lse Id', 'Sg', 'So', 'Sw', 'Bg', 'Bo', 'Rsi', 'Zi', 'Porosity', 'Drainarea', 'Thickness',
                'Respress', 'Restemp'
            ])

            # rename the feature to clear name
            df.rename(columns={'Respress': 'Initial ResPress', 'Restemp': 'Initial Restemp'}, inplace=True)

            ls_lseid = df['Lse Id'].unique()
        except Exception as e:
            self.log_report.log_error(message=self.error_msg.reservoir_props,
                                      well=ALL_CASES,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      exception=e)
            return
        for property_id in ls_lseid:
            try:
                # selected the specific well by id
                selected_df = df.loc[df['Lse Id'] == property_id]
                selected_df.columns = format_well_header_col(selected_df.columns)

                self.import_json_to_mongodb(selected_df, 'reservoir_properties')
            except Exception as e:
                self.log_report.log_error(message=self.error_msg.reservoir_props,
                                          well=property_id,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)

    def fluid_properties(self):
        '''
        input: multiple raw .csv, currently .ECF.csv, .FLU.csv
        output: formated well_ID.fluid_properties_phd.json
        '''
        df = self.ECF_df.copy()
        try:
            df['Exclsum'] = df['Lse Id'].map(self.lease_id_to_exclsum_dic)
            df = df.loc[(df['Exclsum'] == 0)]
            del df['Exclsum']

            idc_df = self.IDC_df.copy()
            idc_df = idc_df.loc[(idc_df['Lblnum'] == 7)]
            idc_df['Idval'] = idc_df['Idval'].apply(lambda x: x.strip())
            lseid_idval_dict = pd.Series(idc_df['Idval'].values, index=idc_df['Lse Id']).to_dict()
            df["phdwin_id"] = df["Lse Id"].map(lseid_idval_dict)

            df = df.filter(items=['phdwin_id', 'Lse Id', 'Btu'])

            # create new feature, Les Name, based on a dictionary(map),
            flu_df = self.FLU_df.copy()

            lseid_gsgravity_dict = pd.Series(flu_df['Gsgravity'].values, index=flu_df['Lse Id']).to_dict()
            lseid_oilgravity_dict = pd.Series(flu_df['Oilgravity'].values, index=flu_df['Lse Id']).to_dict()
            lseid_gor_dict = pd.Series(flu_df['Gor'].values, index=flu_df['Lse Id']).to_dict()

            df["Upper Preforation"] = df["Lse Id"].map(lseid_gsgravity_dict)
            df["Lower Preforation"] = df["Lse Id"].map(lseid_oilgravity_dict)
            df["Landing Zone"] = df["Lse Id"].map(lseid_gor_dict)

            ls_lseid = df['Lse Id'].unique()
        except Exception as e:
            self.log_report.log_error(message=self.error_msg.fluid_props,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      exception=e)
            return

        for property_id in ls_lseid:
            # selected the specific well by id
            try:
                selected_df = df.loc[df['Lse Id'] == property_id]

                selected_df.columns = format_well_header_col(selected_df.columns)

                self.import_json_to_mongodb(selected_df, 'fluid_properties')
            except Exception as e:
                self.log_report.log_error(message=self.error_msg.fluid_props,
                                          well=ALL_CASES,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)

    def gas_composition(self):
        '''
        input: multiple raw .csv, currently .FLU.csv
        output: formated well_ID.gas_composition_phd.json
        '''
        df = self.FLU_df.copy()

        try:
            df['Exclsum'] = df['Lse Id'].map(self.lease_id_to_exclsum_dic)
            df = df.loc[(df['Exclsum'] == 0)]
            del df['Exclsum']

            idc_df = self.IDC_df.copy()
            idc_df = idc_df.loc[(idc_df['Lblnum'] == 7)]
            idc_df['Idval'] = idc_df['Idval'].apply(lambda x: x.strip())
            lseid_idval_dict = pd.Series(idc_df['Idval'].values, index=idc_df['Lse Id']).to_dict()
            df["phdwin_id"] = df["Lse Id"].map(lseid_idval_dict)

            df = df.filter(items=[
                'phdwin_id', 'Lse Id', 'Analydate', 'C1', 'C2', 'C3', 'Ic4', 'Nc4', 'Ic5', 'Nc5', 'Nc6', 'Nc7', 'Nc8',
                'Nc9', 'Nc10', 'N2', 'Co2', 'H2s', 'O2', 'H2', 'He', 'H2o'
            ])

            ls_lseid = df['Lse Id'].unique()
        except Exception as e:
            self.log_report.log_error(message=self.error_msg.gas_comp,
                                      well=ALL_CASES,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      exception=e)
            return

        for property_id in ls_lseid:
            try:
                # selected the specific well by id
                selected_df = df.loc[df['Lse Id'] == property_id]

                selected_df.columns = format_well_header_col(selected_df.columns)

                self.import_json_to_mongodb(selected_df, 'gas_composition')
            except Exception as e:
                self.log_report.log_error(message=self.error_msg.gas_comp,
                                          well=property_id,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)

    def forecast(self):
        '''
        input: multiple raw .csv, currently .FOR.csv
        output: formated well_ID.forecast_phd.json
        '''
        try:
            df, self.seq_to_forecast_name_dic, self.product_code_to_name_dict = process_all_well_phdwin_forecast_df(
                self.FOR_df.copy(), self.IDC_df.copy(), self.UNI_df.copy(), self.PNF_df.copy(), self.ARC_df.copy(),
                self.lease_id_to_exclsum_dic)
            if df is None:
                return

            ls_lseid = df['Lse Id'].unique()
        except Exception as e:
            self.log_report.log_error(message=self.error_msg.forecast,
                                      model=PhdwinModelEnum.forecast.value,
                                      well=ALL_CASES,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      exception=e)
            return

        for idx, property_id in enumerate(ls_lseid):
            try:
                incremental_progress_on_import([START_OF_FORECAST_IMPORT_PROGRESS, END_OF_FORECAST_PROGRESS],
                                               len(ls_lseid), idx, self.progress)
                # selected the specific well by id
                lse_segment_df = process_selected_forecast_df(df, property_id, self.ECF_df.copy(),
                                                              self.product_code_to_name_dict, self.log_report,
                                                              self.error_msg)
                self.forecast_df_in_dictionary[str(property_id)] = lse_segment_df
                self.import_json_to_mongodb(lse_segment_df, 'forecast')
            except Exception as e:
                self.log_report.log_error(message=self.error_msg.forecast,
                                          model=PhdwinModelEnum.forecast.value,
                                          well=property_id,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)

    def prices_taxes_expense_lsg_return(self):  # noqa: C901
        '''
        input: multiple raw .csv, currently .LSG.csv, .MPV.csv
        output: formated well_ID.prices_taxes_expense_lsg_phd.json

        set up rules:
        1. does not include differential percentage and dollar for type 1 case in LSG table
        2. remove oil and gas with type 1 to construct dictionary from MPV table
        3. dictionary from MPV will overwrite self-defined dictionary
        '''
        df = self.LSG_df.copy()

        if df.empty:
            return

        df['Exclsum'] = df['Lse Id'].map(self.lease_id_to_exclsum_dic)
        df = df.loc[(df['Exclsum'] == 0)]
        del df['Exclsum']

        idc_df = self.IDC_df.copy()
        idc_df = idc_df.loc[(idc_df['Lblnum'] == 7)]
        idc_df['Idval'] = idc_df['Idval'].apply(lambda x: x.strip())
        lseid_idval_dict = pd.Series(idc_df['Idval'].values, index=idc_df['Lse Id']).to_dict()
        df["phdwin_id"] = df["Lse Id"].map(lseid_idval_dict)
        mpv_df = self.MPV_df.copy()

        mpv_df["Productname"] = mpv_df["Productname"].apply(lambda x: x.strip())
        mpv_df["Unitstr"] = mpv_df["Unitstr"].apply(lambda x: x.strip())

        # current rule: remove oil and gas with type 1 and 17
        # for productname_unitstr and productname_curreny consistency
        mpv_df = mpv_df[(mpv_df['Type'] != 1) | (mpv_df['Productname'] != 'GAS')]
        mpv_df = mpv_df.loc[(mpv_df['Type'] != 1) | (mpv_df['Productname'] != 'OIL')]
        mpv_df = mpv_df.loc[(mpv_df['Type'] != 17) | (mpv_df['Productname'] != 'GAS')]
        mpv_df = mpv_df.loc[(mpv_df['Type'] != 17) | (mpv_df['Productname'] != 'OIL')]

        # if MPV_df has same key map to different value, it will use the last find key: value pair for dictionary
        productname_unitstr_dict = pd.Series(mpv_df['Unitstr'].values, index=mpv_df['Productname']).to_dict()
        productname_currency_dict = pd.Series(mpv_df['Currency'].values, index=mpv_df['Productname']).to_dict()

        # prepare asof date
        tit_df = self.TIT_df.copy()
        tit_df['Asof Date'] = tit_df.apply(lambda x: calculate_phdwin_date(x['Asof Date']), axis=1)

        df['Asof Date'] = tit_df.at[0, 'Asof Date']

        pnf_df = self.PNF_df.copy()
        productcode_descr_dict = pd.Series(pnf_df['Descr'].values, index=pnf_df['Productcode']).to_dict()

        # change productname to uppercase for mapping
        df = df.loc[df['Productcode'] != 0]  # don't know what is productcode 0, not define in pnd table
        df["Productname"] = df["Productcode"].map(productcode_descr_dict)
        df["Productname"] = df["Productname"].replace(np.nan, 'no productname', regex=True)
        df["Productname"] = df["Productname"].apply(lambda x: x.strip().upper())

        df['Type Name'] = df["Type"].map(get_dictionary('Type'))

        # date preparing for new date fetching logic based on 0 to -8
        # load LPV table to get startdate from 0 to -8, then use 0 to -8 to fetch different date
        lpv_df = self.LPV_df.copy()
        act_df = self.ACT_df.copy()
        for_df = self.FOR_df.copy()

        # prepare maping dictionary (Lse_Id, Curarcseq(Arcseq), Major Phase(Productcode))
        # for FOR table Segmentdate[0] or Segmentend[0], maping logic copy from capex_date
        lseid_curarcseq_dict = pd.Series(act_df['Curarcseq'].values, index=act_df['Lse Id']).to_dict()
        lseid_major_phase_dict = pd.Series(act_df['Major Phase'].values, index=act_df['Lse Id']).to_dict()

        df['Curarcseq'] = df['Lse Id'].map(lseid_curarcseq_dict)
        df['Major Phase'] = df['Lse Id'].map(lseid_major_phase_dict)
        df['Minor Phase'] = df['Major Phase']
        df.loc[df['Major Phase'] == 1, 'Minor Phase'] = 2
        df.loc[df['Major Phase'] == 2, 'Minor Phase'] = 1

        # chnage type to int32
        df['Curarcseq'].fillna(0, inplace=True)
        df['Major Phase'].fillna(0, inplace=True)
        df['Minor Phase'].fillna(0, inplace=True)
        df['Curarcseq'] = df['Curarcseq'].astype('int32')
        df['Major Phase'] = df['Major Phase'].astype('int32')
        df['Minor Phase'] = df['Minor Phase'].astype('int32')

        df['Lse Id str'] = df['Lse Id'].astype(str)
        df['Curarcseq str'] = df['Curarcseq'].astype(str)
        df['Major Phase str'] = df['Major Phase'].astype(str)
        df['Minor Phase str'] = df['Minor Phase'].astype(str)
        df['Id_Curarcseq'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values
        df['Id_Curarcseq_Major_Phase'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values + '_' + df[
            'Major Phase str'].values
        df['Id_Curarcseq_Minor_Phase'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values + '_' + df[
            'Minor Phase str'].values

        for_df['Lse Id str'] = for_df['Lse Id'].astype(str)
        for_df['Arcseq str'] = for_df['Arcseq'].astype(str)
        for_df['Productcode str'] = for_df['Productcode'].astype(str)
        for_df['Id_Arcseq'] = for_df['Lse Id str'].values + '_' + for_df['Arcseq str'].values
        for_df['Id_Arcseq_Productcode'] = for_df['Lse Id str'].values + '_' + for_df[
            'Arcseq str'].values + '_' + for_df['Productcode str'].values

        # seg1 == prodseg1
        id_arcseq_segmentdate0_dict = pd.Series(for_df['Segmentdate[0]'].values, index=for_df['Id_Arcseq']).to_dict()

        # majseg1 or minseg1 (if major phase(productcode == 1), then minor phase(productcode == 2), vice versa)
        id_arcseq_productcode_segmentdate0_dict = pd.Series(for_df['Segmentdate[0]'].values,
                                                            index=for_df['Id_Arcseq_Productcode']).to_dict()

        # majdecl1 (also for MSC EndPrj)
        id_arcseq_productcode_segmentend0_dict = pd.Series(for_df['Segmentend[0]'].values,
                                                           index=for_df['Id_Arcseq_Productcode']).to_dict()
        id_arcseq_productcode_segmentend1_dict = pd.Series(for_df['Segmentend[1]'].values,
                                                           index=for_df['Id_Arcseq_Productcode']).to_dict()
        id_arcseq_productcode_segmentend2_dict = pd.Series(for_df['Segmentend[2]'].values,
                                                           index=for_df['Id_Arcseq_Productcode']).to_dict()
        id_arcseq_productcode_segmentend3_dict = pd.Series(for_df['Segmentend[3]'].values,
                                                           index=for_df['Id_Arcseq_Productcode']).to_dict()
        id_arcseq_productcode_segmentend4_dict = pd.Series(for_df['Segmentend[4]'].values,
                                                           index=for_df['Id_Arcseq_Productcode']).to_dict()
        id_arcseq_productcode_segmentend5_dict = pd.Series(for_df['Segmentend[5]'].values,
                                                           index=for_df['Id_Arcseq_Productcode']).to_dict()
        id_arcseq_productcode_segmentend6_dict = pd.Series(for_df['Segmentend[6]'].values,
                                                           index=for_df['Id_Arcseq_Productcode']).to_dict()
        id_arcseq_productcode_segmentend7_dict = pd.Series(for_df['Segmentend[7]'].values,
                                                           index=for_df['Id_Arcseq_Productcode']).to_dict()
        id_arcseq_productcode_segmentend8_dict = pd.Series(for_df['Segmentend[8]'].values,
                                                           index=for_df['Id_Arcseq_Productcode']).to_dict()
        id_arcseq_productcode_segmentend9_dict = pd.Series(for_df['Segmentend[9]'].values,
                                                           index=for_df['Id_Arcseq_Productcode']).to_dict()

        # endprj_dic only for MSC table to overwrite start date for expense or tax model
        # 0 to 9 represent the segment number
        endprj_dic = {}
        endprj_dic[0] = id_arcseq_productcode_segmentend0_dict
        endprj_dic[1] = id_arcseq_productcode_segmentend1_dict
        endprj_dic[2] = id_arcseq_productcode_segmentend2_dict
        endprj_dic[3] = id_arcseq_productcode_segmentend3_dict
        endprj_dic[4] = id_arcseq_productcode_segmentend4_dict
        endprj_dic[5] = id_arcseq_productcode_segmentend5_dict
        endprj_dic[6] = id_arcseq_productcode_segmentend6_dict
        endprj_dic[7] = id_arcseq_productcode_segmentend7_dict
        endprj_dic[8] = id_arcseq_productcode_segmentend8_dict
        endprj_dic[9] = id_arcseq_productcode_segmentend9_dict

        # 8/26 create the dic for endprj mapping (each id_arcseq_productcode)
        # only map to one greatest end forecast date
        # picks the largest value for segments basically could be in either one of 0 - 9
        mapping_id_arcseq_productcode_endprj_dic = {}
        for seg_i in range(9, -1, -1):
            for id_arcseq_productcode in endprj_dic[seg_i]:
                if id_arcseq_productcode in mapping_id_arcseq_productcode_endprj_dic:
                    if endprj_dic[seg_i][id_arcseq_productcode] > mapping_id_arcseq_productcode_endprj_dic[
                            id_arcseq_productcode]:
                        mapping_id_arcseq_productcode_endprj_dic[id_arcseq_productcode] = endprj_dic[seg_i][
                            id_arcseq_productcode]
                else:
                    mapping_id_arcseq_productcode_endprj_dic[id_arcseq_productcode] = endprj_dic[seg_i][
                        id_arcseq_productcode]

        # for sorting Type, Productcode, Seq in order
        df['Type str'] = df['Type'].astype(str)
        df['Productcode str'] = df['Productcode'].astype(str)
        df['Type_Productcode'] = df['Type str'].values + '_' + df['Productcode str'].values

        # for MSC update date by phase or productcode use
        df['Id_Curarcseq_Gas'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values + '_1'
        df['Id_Curarcseq_Oil'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values + '_2'
        df['Id_Curarcseq_Productcode'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values + '_' + df[
            'Productcode str'].values

        ###################### important ######################
        # 08/22 improved LSG reading efficiency
        # 1. startdate, Boolparam and Realparam  (mapping LPV to LSG)
        # 2. process startdate from None, 0, -1, ..., to -8
        # 3. process MSC table logic to update date1
        # 4. date1 and date2 from number to date
        # 5. inside the property_id for loop still need special_process_to_sort_type_productcode_seq

        # 1. startdate, Boolparam, Realparam
        df['Id_Type_Productcode'] = df['Lse Id str'].values + '_' + df['Type str'].values + '_' + df[
            'Productcode str'].values

        ## prepare LPV dictionary
        lpv_df['Lse Id str'] = lpv_df['Lse Id'].astype(str)
        lpv_df['Type str'] = lpv_df['Type'].astype(str)
        lpv_df['Productcode str'] = lpv_df['Productcode'].astype(str)
        lpv_df['Id_Type_Productcode'] = lpv_df['Lse Id str'].values + '_' + lpv_df['Type str'].values + '_' + lpv_df[
            'Productcode str'].values

        id_type_productcode_startdate_dict = pd.Series(lpv_df['Startdate'].values,
                                                       index=lpv_df['Id_Type_Productcode']).to_dict()

        id_type_productcode_boolparam0_dict = pd.Series(lpv_df['Boolparam[0]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_boolparam1_dict = pd.Series(lpv_df['Boolparam[1]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_boolparam2_dict = pd.Series(lpv_df['Boolparam[2]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_boolparam3_dict = pd.Series(lpv_df['Boolparam[3]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_boolparam4_dict = pd.Series(lpv_df['Boolparam[4]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_boolparam5_dict = pd.Series(lpv_df['Boolparam[5]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_boolparam6_dict = pd.Series(lpv_df['Boolparam[6]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_boolparam7_dict = pd.Series(lpv_df['Boolparam[7]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_boolparam8_dict = pd.Series(lpv_df['Boolparam[8]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_boolparam9_dict = pd.Series(lpv_df['Boolparam[9]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()

        id_type_productcode_realparam0_dict = pd.Series(lpv_df['Realparam[0]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_realparam1_dict = pd.Series(lpv_df['Realparam[1]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_realparam2_dict = pd.Series(lpv_df['Realparam[2]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_realparam3_dict = pd.Series(lpv_df['Realparam[3]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()
        id_type_productcode_realparam4_dict = pd.Series(lpv_df['Realparam[4]'].values,
                                                        index=lpv_df['Id_Type_Productcode']).to_dict()

        df['Startdate'] = df['Id_Type_Productcode'].map(id_type_productcode_startdate_dict)
        df['Boolparam[0]'] = df['Id_Type_Productcode'].map(id_type_productcode_boolparam0_dict)
        df['Boolparam[1]'] = df['Id_Type_Productcode'].map(id_type_productcode_boolparam1_dict)
        df['Boolparam[2]'] = df['Id_Type_Productcode'].map(id_type_productcode_boolparam2_dict)
        df['Boolparam[3]'] = df['Id_Type_Productcode'].map(id_type_productcode_boolparam3_dict)
        df['Boolparam[4]'] = df['Id_Type_Productcode'].map(id_type_productcode_boolparam4_dict)
        df['Boolparam[5]'] = df['Id_Type_Productcode'].map(id_type_productcode_boolparam5_dict)
        df['Boolparam[6]'] = df['Id_Type_Productcode'].map(id_type_productcode_boolparam6_dict)
        df['Boolparam[7]'] = df['Id_Type_Productcode'].map(id_type_productcode_boolparam7_dict)
        df['Boolparam[8]'] = df['Id_Type_Productcode'].map(id_type_productcode_boolparam8_dict)
        df['Boolparam[9]'] = df['Id_Type_Productcode'].map(id_type_productcode_boolparam9_dict)
        df['Realparam[0]'] = df['Id_Type_Productcode'].map(id_type_productcode_realparam0_dict)
        df['Realparam[1]'] = df['Id_Type_Productcode'].map(id_type_productcode_realparam1_dict)
        df['Realparam[2]'] = df['Id_Type_Productcode'].map(id_type_productcode_realparam2_dict)
        df['Realparam[3]'] = df['Id_Type_Productcode'].map(id_type_productcode_realparam3_dict)
        df['Realparam[4]'] = df['Id_Type_Productcode'].map(id_type_productcode_realparam4_dict)

        # 2. process startdate from None, 0, -1, ..., to -8
        ls_startdate = [0, -1, -2, -3, -4, -5, -6, -7, -8, 'Startdate']

        # special handle when Startdate is NaN
        tit_df = self.TIT_df.copy()
        if not df.loc[df['Startdate'].isnull(), :].empty:
            df.loc[df['Startdate'].isnull(), 'date1'] = tit_df.at[0, 'Asof Date']
        # special handle when Startdate is NaN
        for startdate in ls_startdate:
            if startdate == 0 or startdate == -1:
                df.loc[df['Startdate'] == startdate, 'date1'] = tit_df.at[0, 'Asof Date']
            elif startdate == -2:
                df.loc[df['Startdate'] == startdate,
                       'date1'] = df['Id_Curarcseq_Major_Phase'].map(id_arcseq_productcode_segmentdate0_dict)
            elif startdate == -3:
                df.loc[df['Startdate'] == startdate,
                       'date1'] = df['Id_Curarcseq_Minor_Phase'].map(id_arcseq_productcode_segmentdate0_dict)
            elif startdate == -4:
                df.loc[df['Startdate'] == startdate, 'date1'] = df['Id_Curarcseq'].map(id_arcseq_segmentdate0_dict)
            elif startdate == -5:
                df.loc[df['Startdate'] == startdate,
                       'date1'] = df['Id_Curarcseq_Major_Phase'].map(id_arcseq_productcode_segmentdate0_dict)
            elif startdate == -6:
                df.loc[df['Startdate'] == startdate,
                       'date1'] = df['Lse Id'].astype(str).map(self.monthly_start_date_dict)
            elif startdate == -7:
                df.loc[df['Startdate'] == startdate, 'date1'] = df['Lse Id'].astype(str).map(self.monthly_end_date_dict)
            elif startdate == -8:
                df.loc[df['Startdate'] == startdate, 'date1'] = df['Lse Id'].map(self.sop_act_dict)

            elif startdate == 'Startdate':
                # put what ever date in Startdate to date1, if the date is not 0, -1, -2, -3, -4, -5, -6, -7, -8
                df.loc[~df['Startdate'].isin(ls_startdate), 'date1'] = df['Startdate']
        # 09/12/2019 should not have no date
        # first give date1 NaN Id_Curarcseq_Major_Phase
        df.loc[df['date1'].isnull(),
               'date1'] = df['Id_Curarcseq_Major_Phase'].map(id_arcseq_productcode_segmentdate0_dict)
        # then if it still NaN, give Asof Date
        df.loc[df['date1'].isnull(), 'date1'] = tit_df.at[0, 'Asof Date']
        df.loc[df['date1'] == 0, 'date1'] = tit_df.at[0, 'Asof Date']

        process_phdwin_date_columns(df, 'date1')

        df['date2'] = df['date1']

        lseid_prices_taxes_expense_df = process_phdwin_date_sequence_lsg(df)

        lseid_prices_taxes_expense_df = format_phdwin_date_1_2_to_start_end_values(lseid_prices_taxes_expense_df)

        # remove type == 2 and 11 (don't know the type)
        lseid_prices_taxes_expense_df = lseid_prices_taxes_expense_df.loc[lseid_prices_taxes_expense_df['Type'] != 2]
        lseid_prices_taxes_expense_df = lseid_prices_taxes_expense_df.loc[lseid_prices_taxes_expense_df['Type'] != 11]

        lseid_prices_taxes_expense_df['Unitstr'] = lseid_prices_taxes_expense_df['Productname'].map(
            merge_two_dicts(productname_unitstr_dict, get_dictionary('LSG_productcode_unitstr')))
        lseid_prices_taxes_expense_df['Currency'] = lseid_prices_taxes_expense_df['Productname'].map(
            merge_two_dicts(get_dictionary('LSG_productcode_currency'), productname_currency_dict))

        lseid_prices_taxes_expense_df['Modpointer'] = None
        lseid_prices_taxes_expense_df['Modelname'] = None
        lseid_prices_taxes_expense_df['Unitid'] = None

        lseid_prices_taxes_expense_df = clean_phdwin_prices_taxes_expense_df(lseid_prices_taxes_expense_df, lsg=True)
        lseid_prices_taxes_expense_df['lse_id'] = lseid_prices_taxes_expense_df['lse_id'].astype(str)
        lseid_prices_taxes_expense_df['productcode'] = lseid_prices_taxes_expense_df['productcode'].astype(str)
        lseid_prices_taxes_expense_df['type'] = lseid_prices_taxes_expense_df['type'].astype(str)

        return lseid_prices_taxes_expense_df

    def prices_taxes_expense(self):  # noqa: C901
        '''
        input: multiple raw .csv, currently .LPV.csv, .MPV.csv
        output: formated well_ID.prices_taxes_expense_msg_phd.json, well_ID.prices_taxes_expense_lsg_phd.json
        '''
        try:
            df = process_lpv_df(self.LPV_df.copy(), self.lease_id_to_exclsum_dic, self.IDC_df.copy())

            mpv_df, modelname_productname_askey_unitstr_dict = get_model_link_from_mpv(self.MPV_df.copy())

            df = map_model_into_lpv(df, mpv_df, get_dictionary, merge_two_dicts)

            msg_df = process_msg_df(self.MSG_df.copy())

            df = add_product_and_filter_by_current_arcseq(df, self.ACT_df.copy())
        except Exception as e:
            self.log_report.log_error(message=self.error_msg.price_expense_tax_shrink_preprocess,
                                      model=PRICE_TAX_EXPENSE_SHRINK_MODEL_NAME,
                                      well=ALL_CASES,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      exception=e)
            return

        try:
            (id_arcseq_segmentdate0_dict, id_arcseq_productcode_segmentdate0_dict,
             id_arcseq_productcode_segmentend0_dict) = get_segment_end_date_dict(self.FOR_df.copy())
        except Exception as e:
            (id_arcseq_segmentdate0_dict, id_arcseq_productcode_segmentdate0_dict,
             id_arcseq_productcode_segmentend0_dict) = {}, {}, {}
            self.log_report.log_error(message=self.error_msg.segment_extract,
                                      well=ALL_CASES,
                                      model=PRICE_TAX_EXPENSE_SHRINK_MODEL_NAME,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      exception=e)

        try:
            lsg_processed_df = self.prices_taxes_expense_lsg_return()
        except Exception as e:
            self.log_report.log_error(message=self.error_msg.lsg_process_issue,
                                      well=ALL_CASES,
                                      model=PRICE_TAX_EXPENSE_SHRINK_MODEL_NAME,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      exception=e)

        ls_lseid = df['Lse Id'].unique()
        for lse_idx, property_id in enumerate(ls_lseid):
            incremental_progress_on_import([END_OF_FORECAST_PROGRESS, END_OF_PRI_TAX_EXP_IMPORT_PROGRESS],
                                           len(ls_lseid), lse_idx, self.progress)

            # selected the specific well by id
            selected_df = df.loc[df['Lse Id'] == property_id]
            selected_df = selected_df.sort_values('Type')

            has_lsg = True
            try:
                selected_lsg_processed_df = lsg_processed_df.loc[lsg_processed_df['lse_id'] == property_id]
                selected_df, lsg_prices_taxes_expense_df = get_valid_lsg_df(selected_df, selected_lsg_processed_df)
            except Exception as e:
                has_lsg = False
                self.log_report.log_error(message=self.error_msg.lsg_process_issue,
                                          well=property_id,
                                          model=PRICE_TAX_EXPENSE_SHRINK_MODEL_NAME,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)

            if selected_df.empty and has_lsg:
                # add BTU from ECF
                try:
                    lsg_prices_taxes_expense_df = add_btu_from_ecf(lsg_prices_taxes_expense_df, self.ECF_df)
                except Exception as e:
                    self.log_report.log_error(message=self.error_msg.btu,
                                              well=ALL_CASES,
                                              model="",
                                              severity=ErrorMsgSeverityEnum.error.value,
                                              exception=e)

                self.import_json_to_mongodb(lsg_prices_taxes_expense_df, 'prices_taxes_expense')
                continue

            selected_df['date1'] = selected_df.apply(lambda x: calculate_phdwin_date(x['Startdate']), axis=1)
            selected_df['date1'] = selected_df.apply(lambda x: x['date1'].strftime('%Y-%m-%d'), axis=1)

            # prepare 1st or last production date for -6 or -7 case

            try:
                # prepare asof date
                tit_df = self.TIT_df.copy()
                tit_df['Asof Date'] = tit_df.apply(lambda x: calculate_phdwin_date(x['Asof Date']), axis=1)
                asof_date = tit_df['Asof Date'].values[-1]
            except Exception as e:
                asof_date = ERROR_DEFAULT_DATE
                self.log_report.log_error(message=self.error_msg.get_asof_date,
                                          well=ALL_CASES,
                                          model=PRICE_TAX_EXPENSE_SHRINK_MODEL_NAME,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)

            use_start_date = pd.to_datetime(
                self.monthly_start_date_dict.get(str(property_id),
                                                 self.daily_start_date_dict.get(str(property_id), asof_date)))
            use_end_date = pd.to_datetime(
                self.monthly_end_date_dict.get(str(property_id),
                                               self.daily_end_date_dict.get(str(property_id), asof_date)))

            # collect date1 date from 1. directly(MPV.csv) 2. asof(TIT.csv) 3. first production date(FOR.csv)

            try:
                selected_df = add_custom_dates_to_df(selected_df, property_id, asof_date,
                                                     id_arcseq_productcode_segmentdate0_dict,
                                                     id_arcseq_segmentdate0_dict,
                                                     id_arcseq_productcode_segmentend0_dict, use_start_date,
                                                     use_end_date, self.sop_act_dict)
            except Exception as e:
                self.log_report.log_error(message=self.error_msg.add_reference_date,
                                          well=ALL_CASES,
                                          model=PRICE_TAX_EXPENSE_SHRINK_MODEL_NAME,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)
            selected_df = selected_df[~selected_df['Startdate'].isin([0, -1, -2, -3, -4, -5, -6, -7, -8])]

            try:
                lseid_prices_taxes_expense_df = link_model_lines_to_whole_df(selected_df, mpv_df, msg_df)
            except Exception as e:
                self.log_report.log_error(message=self.error_msg.link_mod,
                                          well=ALL_CASES,
                                          model=PRICE_TAX_EXPENSE_SHRINK_MODEL_NAME,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)

            # add year, month, date (3 columns) for both date1 start and date2 end
            try:
                lseid_prices_taxes_expense_df = format_phdwin_date_1_2_to_start_end_values(
                    lseid_prices_taxes_expense_df)
                lseid_prices_taxes_expense_df = clean_phdwin_prices_taxes_expense_df(lseid_prices_taxes_expense_df)

                lseid_prices_taxes_expense_df.loc[lseid_prices_taxes_expense_df.Type.astype(str) != '1',
                                                  'Differential Percentage'] = np.nan
                lseid_prices_taxes_expense_df.loc[lseid_prices_taxes_expense_df.Type.astype(str) != '1',
                                                  'Differential Dollar'] = np.nan

                lseid_prices_taxes_expense_df.columns = format_well_header_col(lseid_prices_taxes_expense_df.columns)
                lseid_prices_taxes_expense_df = convert_year_month_day_phdwin_column_to_date(
                    lseid_prices_taxes_expense_df)

                if has_lsg:
                    del lsg_prices_taxes_expense_df['productcode']
                    lsg_prices_taxes_expense_df = convert_year_month_day_phdwin_column_to_date(
                        lsg_prices_taxes_expense_df)
                    # add msg and lsg df to 1, so only need to call import_json_to_mongodb once
                    lseid_prices_taxes_expense_df = lseid_prices_taxes_expense_df.append(lsg_prices_taxes_expense_df,
                                                                                         ignore_index=True)

                # add BTU from ECF
                lseid_prices_taxes_expense_df = add_btu_from_ecf(lseid_prices_taxes_expense_df, self.ECF_df)

                # add model_unitstr from MPV
                lseid_prices_taxes_expense_df = add_model_unitstr_from_mpv(lseid_prices_taxes_expense_df,
                                                                           modelname_productname_askey_unitstr_dict)
            except Exception as e:
                self.log_report.log_error(message=self.error_msg.unexpected,
                                          well=ALL_CASES,
                                          model=PRICE_TAX_EXPENSE_SHRINK_MODEL_NAME,
                                          severity=ErrorMsgSeverityEnum.error.value,
                                          exception=e)
                return
            self.import_json_to_mongodb(lseid_prices_taxes_expense_df, 'prices_taxes_expense')

    def capex(self):
        '''
        input: multiple raw .csv, currently .INV.csv
        output: formated well_ID.capex_table_phd.json
        '''
        df = self.INV_df.copy()

        try:
            df['Exclsum'] = df['Lse Id'].map(self.lease_id_to_exclsum_dic)
            df = df.loc[(df['Exclsum'] == 0)]
            del df['Exclsum']

            idc_df = self.IDC_df.copy()
            idc_df = idc_df.loc[(idc_df['Lblnum'] == 7)]
            idc_df['Idval'] = idc_df['Idval'].apply(lambda x: x.strip())
            lseid_idval_dict = pd.Series(idc_df['Idval'].values, index=idc_df['Lse Id']).to_dict()
            df["phdwin_id"] = df["Lse Id"].map(lseid_idval_dict)

            df = df.filter(items=[
                'phdwin_id', 'Lse Id', 'Grp Id', 'Catseq', 'Descr', 'Inv Initial', 'Islinked', 'Harddate', 'Strdate',
                'Linkid', 'Linkoffset', 'Inv Amnt', 'Intang Amnt', 'Riskfactor', 'Gcarecoveryterm', 'Inv Netcost'
            ])

            act_df = self.ACT_df.copy()
            tit_df = self.TIT_df.copy()
            df = df.loc[(df['Grp Id'].isin(self.grp_id_scenario_dict))]
            if df.empty:
                return

            df.rename(columns={'Inv Amnt': 'tang amnt'}, inplace=True)

            # strip all string in whole dataframe
            df = df.applymap(lambda x: x.strip() if type(x) is str else x)

            for_df = self.FOR_df.copy()
            act_df = self.ACT_df.copy()
            for_df = for_df.loc[for_df['Segmentdate[0]'] != 0]

            lseid_curarcseq_dict = pd.Series(act_df['Curarcseq'].values, index=act_df['Lse Id']).to_dict()
            lseid_major_phase_dict = pd.Series(act_df['Major Phase'].values, index=act_df['Lse Id']).to_dict()

            df['Curarcseq'] = df['Lse Id'].map(lseid_curarcseq_dict)
            df['Major Phase'] = df['Lse Id'].map(lseid_major_phase_dict)

            df.loc[df['Major Phase'] == 1, 'Minor Phase'] = 2
            df.loc[df['Major Phase'] == 2, 'Minor Phase'] = 1

            # get the Segmentdate[0] from FOR.csv by map the Id_Curarcseq to Id_Arcseq_Segmentdate0_dict
            df['Lse Id str'] = df['Lse Id'].astype(str)
            df['Curarcseq str'] = df['Curarcseq'].astype(str)
            df['Major Phase str'] = df['Major Phase'].astype(str)
            df['Minor Phase str'] = df['Minor Phase'].astype(str)
            df['Id_Curarcseq'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values
            df['Id_Curarcseq_Major_Phase'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values + '_' + df[
                'Major Phase str'].values
            df['Id_Curarcseq_Minor_Phase'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values + '_' + df[
                'Minor Phase str'].values

            for_df['Lse Id str'] = for_df['Lse Id'].astype(str)
            for_df['Arcseq str'] = for_df['Arcseq'].astype(str)
            for_df['Productcode str'] = for_df['Productcode'].astype(str)
            for_df['Id_Arcseq'] = for_df['Lse Id str'].values + '_' + for_df['Arcseq str'].values
            for_df['Id_Arcseq_Productcode'] = for_df['Lse Id str'].values + '_' + for_df[
                'Arcseq str'].values + '_' + for_df['Productcode str'].values

            for_df['ProjEnd'] = for_df.apply(lambda x: get_end_of_projection(x), axis=1)

            product_code_segment_date_dict_ls = []
            for i in range(10):
                product_code_segment_date_dict_ls.append(
                    pd.Series(for_df[f'Segmentdate[{i}]'].values, index=for_df['Id_Arcseq_Productcode']).to_dict())

            # fetching log for date
            # 'date' fetching logic for capex json format, need to look into each rows in INV.csv
            # in INV.csv, check Strdate column if
            # 1. blank, fetch Harddate in INV.csv
            # 2. Ecl, null for date
            # 3. Seg1, fetch Segmentdate[0] in FOR.csv
            # 4. Seg2, fetch Segmentdate[1] in FOR.csv
            # ....
            # 12. Seg10, fetch Segmentdate[9] in FOR.csv

            df['Date'] = df['Harddate']
            df.loc[df['Strdate'] == 'EndPrj', ['Strdate']] = 'Ecl'
            df.loc[df['Strdate'] == 'Ecl', ['Date']] = 0

            # need apply or applymap
            for i, mapping_dict in enumerate(product_code_segment_date_dict_ls):
                minor_phase_ls = [f'Seg{i+1}', f'DeclSeg{i+1}']
                major_phase_ls = [f'Seg{i+1}', f'DeclSeg{i+1}', f'MajSeg{i+1}']
                df.loc[(df['Strdate'].isin(minor_phase_ls)) & (df['Linkid'] == -1),
                       ['Date']] = df['Id_Curarcseq_Minor_Phase'].map(mapping_dict)
                df.loc[(df['Strdate'].isin(major_phase_ls)) & (df['Linkid'] == -2),
                       ['Date']] = df['Id_Curarcseq_Major_Phase'].map(mapping_dict)
                df.loc[df['Strdate'].isin(major_phase_ls), ['Date']] = df['Id_Curarcseq_Major_Phase'].map(mapping_dict)

            df.loc[(df['Strdate'] == 'AsOf') & (df['Linkid'] == 0), ['Date']] = tit_df.at[0, 'Asof Date']
            df.loc[(df['Strdate'] == 'FirstProd') & (df['Linkid'] == -2),
                   ['Date']] = df['Lse Id'].map(self.sop_act_dict)
            df.loc[(df['Strdate'] == 'StartHist') & (df['Linkid'] == 0),
                   ['Date']] = df['Lse Id str'].map(self.monthly_start_date_dict)
            df.loc[(df['Strdate'] == 'EndHist') & (df['Linkid'] == 0),
                   ['Date']] = df['Lse Id str'].map(self.monthly_end_date_dict)

            del df['Lse Id str']
            del df['Curarcseq str']
            del df['Id_Curarcseq']
            del df['Major Phase str']
            del df['Id_Curarcseq_Major_Phase']

            # ignore rows if 'Date' can not be mapping, where df['Date'] = NaN
            df = df.dropna()
            if df.empty:
                return

            df['Date'] = df.apply(lambda x: calculate_phdwin_date(x['Date']), axis=1)

            def calculate_offset_date(row):
                return row['Date'] + pd.DateOffset(days=row['Linkoffset'])

            df['Offset Date'] = df.apply(calculate_offset_date, axis=1)

            df['Offset Date Year'] = df['Offset Date'].dt.year
            df['Offset Date Month'] = df['Offset Date'].dt.month
            df['Offset Date Day'] = df['Offset Date'].dt.day

            df['Offset Date'] = df['Offset Date'].apply(lambda x: x.strftime('%Y-%m-%d'))
            # change Offset Date Year, Month, Day to 'Ecl'
            df.loc[(df['Date'].dt.year == 1800) & (df['Date'].dt.month == 12)
                   & (df['Date'].dt.day == 28), 'Offset Date'] = 'Ecl'
            df.loc[(df['Offset Date'] == 'Ecl'), 'Offset Date Year'] = None
            df.loc[(df['Offset Date'] == 'Ecl'), 'Offset Date Month'] = None
            df.loc[(df['Offset Date'] == 'Ecl'), 'Offset Date Day'] = None
            del df['Date']

            df.loc[df['Inv Netcost'] == 0, 'Net_Gross'] = 'Gross'
            df.loc[df['Inv Netcost'] != 0, 'Net_Gross'] = 'Net'

            df.loc[df['Gcarecoveryterm'] == 0, 'Depreciation'] = False
            df.loc[df['Gcarecoveryterm'] != 0, 'Depreciation'] = True

            del df['Inv Netcost']
            del df['Gcarecoveryterm']

            ls_lseid = df['Lse Id'].unique()
        except Exception as e:
            self.log_report.log_error(message=self.error_msg.capex,
                                      model=PhdwinModelEnum.capex.value,
                                      well=ALL_CASES,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      exception=e)
            return

        for grp_id in self.grp_id_scenario_dict:
            scenario_df = df[df['Grp Id'] == grp_id]
            for property_id in ls_lseid:
                try:
                    # selected the specific well by id
                    selected_df = scenario_df.loc[scenario_df['Lse Id'] == property_id]

                    selected_df.columns = format_well_header_col(selected_df.columns)
                    self.import_json_to_mongodb(selected_df, 'capex')
                except Exception as e:
                    self.log_report.log_error(message=self.error_msg.capex,
                                              model=PhdwinModelEnum.capex.value,
                                              well=property_id,
                                              severity=ErrorMsgSeverityEnum.error.value,
                                              exception=e)

    def ownership(self):
        '''
        input: multiple raw .csv, currently .OWN.csv
        output: formated well_ID.ownership_table_phd.json
        '''
        try:
            df = self.OWN_df.copy()

            df['Exclsum'] = df['Lse Id'].map(self.lease_id_to_exclsum_dic)
            df = df.loc[(df['Exclsum'] == 0)]
            del df['Exclsum']

            idc_df = self.IDC_df.copy()
            idc_df = idc_df.loc[(idc_df['Lblnum'] == 7)]
            idc_df['Idval'] = idc_df['Idval'].apply(lambda x: x.strip())
            lseid_idval_dict = pd.Series(idc_df['Idval'].values, index=idc_df['Lse Id']).to_dict()
            df["phdwin_id"] = df["Lse Id"].map(lseid_idval_dict)

            df = df.filter(items=[
                'phdwin_id', 'Lse Id', 'Grp Id', 'Seq', 'Revtype', 'Revvalue', 'Resolveddate', 'Lsenri', 'Wrkint',
                'Revint', 'Npint'
            ])

            df = df.loc[(df['Grp Id'].isin(self.grp_id_scenario_dict))]
            if df.empty:
                return

            adj_df = self.ADJ_df.copy()
            pnf_df = self.PNF_df.copy()

            # prepare asof date
            tit_df = self.TIT_df.copy()

            productcode_descr_dict = pd.Series(pnf_df['Descr'].values, index=pnf_df['Productcode']).to_dict()
            adj_df["Productname"] = adj_df["Pcode"].map(productcode_descr_dict)
            df["Revtype Descr"] = df["Revtype"].map(get_dictionary('OWN_revtype_descr'))
            adj_df = adj_df.applymap(lambda x: x.strip() if type(x) is str else x)

            gas_revint = productcode_descr_dict[1]
            oil_revint = productcode_descr_dict[2]
            ngl_revint = productcode_descr_dict[21]
            condensate_revint = productcode_descr_dict[22]

            df[gas_revint.strip()] = df['Revint']
            df[oil_revint.strip()] = df['Revint']
            df[ngl_revint.strip()] = df['Revint']
            df[condensate_revint.strip()] = df['Revint']

            df.loc[df['Resolveddate'] == 0, 'Resolveddate'] = tit_df.at[0, 'Asof Date']

            for index, row in adj_df.iterrows():
                df.loc[(df['Seq'] == row['Seq']) & (df['Lse Id'] == row['Lse Id']), row['Productname']] = row['Revint']

            ls_lseid = df['Lse Id'].unique()
        except Exception as e:
            self.log_report.log_error(message=self.error_msg.ownership,
                                      model=PhdwinModelEnum.ownership.value,
                                      well=ALL_CASES,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      exception=e)
            return

        for grp_id in self.grp_id_scenario_dict:
            scenario_df = df[df['Grp Id'] == grp_id]
            for property_id in ls_lseid:
                # selected the specific well by id
                try:
                    selected_df = scenario_df.loc[scenario_df['Lse Id'] == property_id]
                    selected_df = selected_df.sort_values('Seq')
                    selected_df = selected_df.reset_index(drop=True)

                    selected_df['date1'] = selected_df.apply(lambda x: calculate_phdwin_date(x['Resolveddate']), axis=1)

                    # update the date2 in maxecoyears position
                    selected_df['date2'] = selected_df['date1'] + pd.DateOffset(days=-1)
                    selected_df['date2'] = selected_df['date2'].shift(-1)

                    try:
                        selected_df.at[selected_df.last_valid_index(),
                                       'date2'] = selected_df.at[selected_df.last_valid_index(),
                                                                 'date1'] + pd.DateOffset(
                                                                     years=tit_df.at[0, 'Maxecoyears'])
                    except pd.errors.OutOfBoundsDatetime:
                        selected_df.at[selected_df.last_valid_index(), 'date2'] = pd.Timestamp.max

                    selected_df['start Year'] = selected_df['date1'].dt.year
                    selected_df['start Month'] = selected_df['date1'].dt.month
                    selected_df['start Day'] = selected_df['date1'].dt.day

                    selected_df['end Year'] = selected_df['date2'].dt.year
                    selected_df['end Month'] = selected_df['date2'].dt.month
                    selected_df['end Day'] = selected_df['date2'].dt.day

                    selected_df['start_date'] = selected_df['date1'].apply(lambda x: x.strftime('%Y-%m-%d'))
                    selected_df['end_date'] = selected_df['date2'].apply(lambda x: x.strftime('%Y-%m-%d'))

                    del selected_df['date1']
                    del selected_df['date2']

                    selected_df.columns = format_well_header_col(selected_df.columns)

                    self.import_json_to_mongodb(selected_df, 'ownership')
                except Exception as e:
                    self.log_report.log_error(message=self.error_msg.ownership,
                                              model=PhdwinModelEnum.ownership.value,
                                              well=property_id,
                                              severity=ErrorMsgSeverityEnum.error.value,
                                              exception=e)

    def create_and_insert_well_calcs_collection(self):
        '''
        in the final step, create well_calcs document then insert to well_calcs collection

        phdwin and aries need to read daily or monthly production data from different file name
        '''
        self.well_calcs_data_list = []

        for key in self.wells_dic:
            well_document = self.wells_dic[key]

            well_calcs_default_document = self.get_default_format('well-calcs')
            well_calcs_default_document['well'] = well_document['_id']

            if 'first_prod_date' in well_document:
                # get FPD from well_document
                well_calcs_default_document['first_prod_date'] = well_document['first_prod_date']
            else:
                # get FPD from production (daily prior to monthly)
                lease_id = well_document['lease_number']

                if lease_id in self.lse_id_to_monthly_fpd_dic:
                    # daily production does not have FPD, need to find FPD from monthly production
                    well_calcs_default_document['first_prod_date'] = pd.to_datetime(
                        self.lse_id_to_monthly_fpd_dic[lease_id])

            # need to calculate total_prop_weight
            well_calcs_default_document = self.create_total_prop_weight_and_total_fluid_volume(
                well_calcs_default_document, well_document)

            self.well_calcs_data_list.append(well_calcs_default_document)

        self.db['well-calcs'].insert_many(self.well_calcs_data_list)

    def execute(self):
        self.get_lease_id_to_exclsum_dic()
        self.progress.notify(INITIAL_PHDWIN_IMPORT_PROGRESS)
        self.create_wells_dic()
        self.progress.notify(CREATE_WELL_DIC_PROGRESS)
        self.get_attribute_dict_from_well_headers()
        self.progress.notify(GET_WELL_DICTIONARY_PROGRESS)
        self.reserve_cat()

        self.reservoir_properties()

        self.fluid_properties()

        self.gas_composition()

        self.econ_options()

        self.create_and_insert_actual_or_forecast_model()

        self.incrementals()

        self.forecast()

        self.dates()

        self.ownership()

        self.capex()

        self.progress.notify(END_OF_CAPEX_OWN_IMPORT_PROGRESS)
        # partially data for stream_properties (Shrinkage + Yield + BTU or Shrinkage + BTU model)
        self.prices_taxes_expense()

        # partially data for stream_properties (Yield + BTU or BTU model)
        self.yield_shrinkage_compare_and_save_into_self_data_list()

        self.update_well_models()
        self.progress.notify(END_OF_ASSUMPTIONS_IMPORT_PROGRESS)

        self.insert_many_once_for_all_well_in_one_db()

        # self.check_wells_size_equal_to_point()

        self.update_models_id_and_wells_id_to_project()

        self.create_and_insert_well_calcs_collection()

        self.wells_add_has_daily_monthly()
