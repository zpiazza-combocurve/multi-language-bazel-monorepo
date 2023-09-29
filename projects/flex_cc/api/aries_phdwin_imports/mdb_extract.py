import copy
import datetime
import json
from difflib import SequenceMatcher
from operator import itemgetter
from typing import Optional

import numpy as np
import pandas as pd
import pygeohash as gh
from bson.objectid import ObjectId

from .aries_data_extraction.ownership import Ownership
from .aries_data_extraction.pricing import Pricing
from .aries_data_extraction.tax_expense import TaxExpense
from .aries_data_extraction.overlay import Overlay
from .aries_data_extraction.capex import Capex

from .aries_data_extraction.supplementary.add import add_supplementary_econ_df
from .aries_data_extraction.supplementary.elt.process import post_process
from .aries_data_extraction.supplementary.elt.create import create
from .aries_data_extraction.supplementary.elt.transform import dataframe_transform

from api.aries_phdwin_imports.combine_rows import (FLAT_ESCALATION_ECON_FUNC, combine_ngl_yield_rows,
                                                   combine_risking_rows, check_if_all_escalation_value_are_zeros)
from api.aries_phdwin_imports.data_extraction import DataExtraction
from api.aries_phdwin_imports.helpers import (
    CUSTOM_ESCALATION_UNIT_DICT, convert_arps_exp_to_modified_arps, build_prod_data_list, format_well_header_document,
    check_batch_limit, update_wells_dic_and_major_product, get_economic_section, format_econ_assumptions, clean_econ_df,
    forecast_validity_check, extract_yield_properties, extract_selected_setup_data, check_for_required_cols,
    ECON_REQUIRED_COLS, ECON_COLS, ENDDATE_RQD_COLS, SETUP_DATA_RQD_COLS, str_join, get_default_common_lines_from_setup,
    check_for_default_lines, update_param_document_based_on_life_cutoff, update_well_life_dict, add_reservoir_category,
    get_day_month_year_from_decimal_date, get_day_month_from_decimal_date, get_discount_rows, DEFAULT_BASE_DATE,
    check_for_null_values_in_expression, process_ecophase_for_price_tax_backup, MAX_CUM_CASH_FLOW_DICT_PMAX,
    apply_backup_to_select_document, check_if_use_fpd_asof, create_date_general_options_default_model,
    format_aries_segment_date, ESCALATION_UNIT_DICT, check_eloss_loss_keyword, get_custom_escalation,
    process_custom_escalation_doc_into_esclation_obj, CALC_MODEL_TO_ARIES_SYNTAX, DEFAULT_ESCALATION_DATES,
    aries_cc_round, check_for_inconsistent_date, SHRINKAGE_PHASE_DICT, get_valid_shrink_key,
    update_spd_escalation_value, update_life_from_major_phase, extract_selected_setup_data_corptax,
    merge_phase_ac_property_and_economic, ARIES_PHASE_KEYWORD_TO_CC_DICT, overlay_phase_dic, get_well_doc_overlay,
    process_risking_list_method_expression, process_well_stream_cut_off_expression, process_wells_wls_stream_lines)

from api.aries_phdwin_imports.aries_import_helpers import (
    convert_array_column_dtype_to_int, FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT, fetch_value, extract_df_row_value,
    get_header_index, order_df_based_on_section_and_sequence, set_overlay_keywords_to_overlay_section,
    handle_overlay_override, add_common_lines, ZERO_ESC, update_scenario_df_if_necessary,
    get_model_name_from_qualifiers, clean_propnum_in_property_df, add_list_method_special,
    convert_str_date_to_datetime_format, format_start_date, get_max_eco_year_from_frame_string,
    set_risk_start_date_to_base_date, clean_overlay_keyword, handle_forecast_overlay_ratio,
    check_if_more_than_one_element, get_major_phase, update_corptax, get_scenario_array_from_dbs_key,
    change_double_quote_to_previous_keyword, update_well_count_document_with_major_phase_well)

from api.aries_phdwin_imports.aries_forecast_helpers.forecast_import_helpers import (auto_fill_ratio_lines,
                                                                                     get_cums_value,
                                                                                     identify_keyword_repitition,
                                                                                     process_ratio_forecast_keyword,
                                                                                     process_rate_forecast_keyword)

from api.aries_phdwin_imports.error import format_error_msg, ErrorMsgEnum, ErrorMsgSeverityEnum
from api.aries_phdwin_imports.aries_import_data import AriesImportData

from combocurve.shared.progress_notifier import ProgressNotifier
from combocurve.shared.aries_import_enums import (EconEnum, FileDir, ARIES_FILES_LABEL, AriesFilesEnum, EconHeaderEnum,
                                                  PhaseEnum, UnitEnum, CCSchemaEnum)

from combocurve.shared.econ_tools.econ_to_options import add_options
from combocurve.shared.helpers import gen_inpt_id
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.services.data_import.import_data import DataSettings

# pd.set_option('display.height', 1000)
# pd.set_option('display.width', 1000)
pd.set_option('display.max_rows', 1000)
pd.set_option('display.max_columns', 200)
pd.options.mode.chained_assignment = None

PROGRESS_BATCH_SIZE = 50
INITIAL_ARIES_IMPORT_PROGRESS = 71  # 71% of 100%
PROGRESS_ALLOCATED_FOR_ECOMONIC_IMPORT = 25  # 25% of 100%


class AriesDataExtraction(DataExtraction):
    def __init__(
        self,
        user_id,
        gcp_name_dic,
        external_file_dict,
        context,
        parallel_dic,
        only_forecast=False,
        create_elts=False,
        notification_id=None,
    ):
        super(AriesDataExtraction, self).__init__(user_id, context, parallel_dic['batch_number'])

        self.gcp_name_dic = gcp_name_dic
        self.external_file_dict = external_file_dict
        self.context = context
        self.only_forecast = only_forecast
        self.create_elts = create_elts
        self.notification_id = notification_id

        if parallel_dic['user_scenarios_id'] is not None:
            self.scenario_id = parallel_dic['user_scenarios_id']
        else:
            self.scenario_id = None

        if parallel_dic['user_forecasts_id'] is not None:
            self.forecasts_id = parallel_dic['user_forecasts_id']
        else:
            self.forecasts_id = None

        if parallel_dic['partial_well_propnum'] is not None:
            self.ls_propnum = parallel_dic['partial_well_propnum']
        else:
            self.ls_propnum = None

        self.batch_number = parallel_dic['batch_number']

        # define wells, well_days, well_months header dictionary
        self.combocurve_header_dic = {
            'wells': [
                "surface_longitude_wgs84",  # need to be deleted
                "surface_latitude_wgs84",  # need to be deleted
                'api14',
                'location',
                'toeLocation',
                'basin',
                'county',
                'current_operator',
                'first_cluster_count',
                'first_fluid_per_perforated_interval',
                'first_prod_date',
                'first_prod_date_calc',
                'first_proppant_per_perforated_interval',
                'first_stage_count',
                'generic',
                'geohash',
                'has_daily',
                'has_monthly',
                'hole_direction',
                'landing_zone',
                'lateral_length',
                'lease_name',
                'pad_name',
                'perf_lateral_length',
                'play',
                'primary_product',
                'refrac_date',
                'state',
                'status',
                'township',
                'true_vertical_depth',
                'type_curve_area',
                'well_name',
                'chosenKeyID',
                'copied',
                'copiedFrom',
                'dataSourceCustomName',
                'mostRecentImport',
                'wellCalcs',
                'abstract',
                'acre_spacing',
                'allocation_type',
                'api10',
                'api12',
                'aries_id',
                'azimuth',
                'block',
                'casing_id',
                'choke_size',
                'completion_design',
                'completion_end_date',
                'completion_start_date',
                'country',
                'current_operator_alias',
                'current_operator_code',
                'current_operator_ticker',
                'date_rig_release',
                'distance_from_base_of_zone',
                'distance_from_top_of_zone',
                'district',
                'drill_end_date',
                'drill_start_date',
                'elevation',
                'elevation_type',
                'end_prod_date',  # add
                'field',
                'first_additive_volume',
                'first_fluid_volume',
                'first_frac_vendor',
                'first_max_injection_pressure',
                'first_max_injection_rate',
                'first_prop_weight',
                'first_proppant_per_fluid',
                'first_test_flow_tbg_press',
                'first_test_gas_vol',
                'first_test_gor',
                'first_test_oil_vol',
                'first_test_water_vol',
                'first_treatment_type',
                'flow_path',
                'fluid_type',
                'footage_in_landing_zone',
                'formation_thickness_mean',
                'gas_analysis_date',  # add
                'gas_gatherer',
                'gas_specific_gravity',
                'ground_elevation',
                'hz_well_spacing_any_zone',
                'hz_well_spacing_same_zone',
                'initial_respress',
                'initial_restemp',
                'landing_zone_base',
                'landing_zone_top',
                'lease_number',
                'lower_perforation',
                'matrix_permeability',
                'measured_depth',
                'num_treatment_records',
                'oil_api_gravity',
                'oil_gatherer',
                'oil_specific_gravity',
                'parent_child_any_zone',
                'parent_child_same_zone',
                'percent_in_zone',
                'permit_date',
                'phdwin_id',
                'porosity',
                'previous_operator',
                'previous_operator_alias',
                'previous_operator_code',
                'previous_operator_ticker',
                'production_method',
                'proppant_mesh_size',
                'proppant_type',
                'range',
                'recovery_method',
                'refrac_additive_volume',
                'refrac_cluster_count',
                'refrac_fluid_per_perforated_interval',
                'refrac_fluid_volume',
                'refrac_frac_vendor',
                'refrac_max_injection_pressure',
                'refrac_max_injection_rate',
                'refrac_prop_weight',
                'refrac_proppant_per_fluid',
                'refrac_proppant_per_perforated_interval',
                'refrac_stage_count',
                'refrac_treatment_type',
                'section',
                'sg',
                'so',
                'spud_date',
                'stage_spacing',
                'subplay',
                'surfaceLatitude',
                'surfaceLongitude',
                'survey',
                'sw',
                'target_formation',
                'thickness',
                'til',
                'toeLatitude',
                'toeLongitude',
                'toe_in_landing_zone',
                'toe_up',
                'tubing_depth',
                'tubing_id',
                'upper_perforation',
                'vt_well_spacing_any_zone',
                'vt_well_spacing_same_zone',
                'well_number',
                'well_type',
                # Calcs
                'total_additive_volume',
                'total_cluster_count',
                'total_fluid_volume',
                'total_prop_weight',
                'total_proppant_per_fluid',
                # Indexed calcs
                'total_fluid_per_perforated_interval',
                'total_proppant_per_perforated_interval',
                'total_stage_count'
            ],
            'well_days': [
                "date", "hours_on", "oil", "gas", "water", "choke", "flowing_tbg_pressure", "flowing_csg_pressure",
                "flowing_bh_pressure", "shut_in_tbg_pressure", "shut_in_bh_pressure", 'shut_in_csg_pressure', "aries_id"
            ],  # aries_id need to be deleted
            'well_months': ["date", "oil", "gas", "water", "choke", "days_on", "aries_id"]
        }  # aries_id need to be deleted

        self.ownership = Ownership(self)
        self.pricing = Pricing(self)
        self.tax_expense = TaxExpense(self)
        self.overlay = Overlay(self)
        self.capex = Capex(self)

    def pre_process(self):
        """
        move partial table reading and pre-process in __init__ here
        used in nonparallel and parallel
        """
        # TODO: This definition is not used, however there are ECOPHASE_df references.
        self.ecophase_df = None
        self.read_all_table()

        # define symbol mapping to file dictionary
        # TODO: AC_PROPERTY_DF is not defined in any class neither AriesDataExtraction nor DataExtraction.
        # Ans. These attributes are defined after read_all_table()
        clean_propnum_in_property_df(self.AC_PROPERTY_df)
        wells_df = self.AC_PROPERTY_df
        wells_df.columns = [str(header).upper() for header in wells_df.columns]
        self.at_symbol_mapping_dic = {FileDir.m.value: [wells_df, ARIES_FILES_LABEL[AriesFilesEnum.ac_property]]}

        self.user_define_wells_mapping_for_combocurve = {}
        self.user_define_well_days_mapping_for_combocurve = {}
        self.user_define_well_months_mapping_for_combocurve = {}

        # define projects_dic, scenarios_dic {ObjectId('_id'): document}
        self.projects_dic = {}  # ex: {ObjectId('5cb8aef1b986470c40761f18'): project_document}
        self.scenarios_dic = {}  # ex: {ObjectId('5cb8aef1b986470c40761f18'): scenario_document}

        # define enddate dic to store date
        self.enddate_dic = {}

        # list storing wells that need an ECL linkage once all wells are processed
        self.start_linkage_needed = []
        # dictionary of wells which have an ECL
        self.end_date_link = {}

        # ex: {'BP405390' : 06/2074},
        # 06/2074 is actually from 24893, (24893 // 12) is year
        # math.ceil((((24893 / 12) - (24893 // 12)) * 12) + 1) is month

        # define escalation_project_id_map_to_model_id
        self.escalation_project_id_map_to_model_id = {
        }  # ex: {str(original_id_project_id) : (project_id, model_id, name)}}
        self.escalation_segment_param = {}
        self.escalation_unit_dic = {}
        # define general_option list to store general_option model
        self.general_option_data_list = []

        # forecast data
        self.forecasts_dic = {}
        self.forecast_datas_dic = {}
        self.ratio_forecast_datas_dic = {}
        self.forecast_datas_params_dic = {}
        self.forecast_name_to_dataid = {}
        self.well_forecasts_dic = {}
        self.forecast_other_phase = set()
        self.forecast_df = np.array([])
        self.actual_vs_forecast_param = {}
        self.actual_forecast_data_list = []

        self.overlay_tax_param = {}
        self.overlay_expense_param = {}
        self.overlay_yield_param = {}
        self.overlay_price_param = {}
        self.overlay_differential_param = {}
        self.common_default_lines = {}
        self.elt_data_dict = {}

        # important note:
        # in phdwin, self.wells_dic use _id as key
        # in aries, self.wells_dic use aries_id as key

        # create project at very beginning then let user to choose 1 project to import
        self.create_project_collection_from_aries_table()

        # create_monthly_id_map_to_fpd
        self.aries_id_to_daily_fpd_dic = {}
        self.aries_id_to_monthly_fpd_dic = {}

        # create_scenario_ls
        self.scenario_ls = []

        self.setups = []

        # look for checks in well keywords, more checks would be added as more information is gotten
        # currently checks for OPINC (OH Expense)
        self.ignore_overhead = False

        # shrink value
        self.shrink = 1

        # stores major product of each well
        self.well_major = {}

        self.risking_params = {}

        self.well_count = 0
        self.well_import_list = []
        self.project_custom_header_well_data = {}
        self.project_customer_header_alias = {}
        self.project_custom_header_ls = []
        self.project_custom_header_data_ls = []
        self.use_end_date = True
        self.expense_name_assignment = copy.deepcopy(FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT)
        self.segment_conversion = MultipleSegments()

    def get_table_attr(self, table_name: str, deep: bool = True) -> Optional[pd.DataFrame]:
        """Returns a copy of the Dataframe created for the table name.
        Args:
            table_name: Target table Dataframe
            deep: returns a deep copy if True or a shallow copy otherwise
        Returns:
            Deep copy of the Dataframe associated to table_name
        """
        try:
            df = getattr(self, table_name)
            return df.copy(deep=deep)
        except AttributeError:
            return None

    # TODO: This function is not being used. Commented reference in aries_service.py
    def get_all_well_propnum(self):
        '''
        read all well propnum from AC_PROPERTY, AC_ECONOMIC, AC_DAILY, AC_PRODUCT
        used only in parallel
        '''
        # get all tables (AC_DAILY...etc.)
        self.read_all_table()
        # create empty set
        all_well_propnum = set()

        # get daily production propnum
        ac_daily_df = self.AC_DAILY_df.copy()
        ac_daily_df.columns = map(str.upper, ac_daily_df.columns)
        ac_daily_df.rename(columns=self.user_define_well_days_mapping_for_combocurve, inplace=True)
        ac_daily_df = ac_daily_df.filter(items=self.combocurve_header_dic['well_days'])
        set_column_to_none = set(self.combocurve_header_dic['well_days']) - set(list(ac_daily_df))
        for name in set_column_to_none:
            ac_daily_df[name] = None
        # get the unique_well id in well_info
        ac_daily_ls_propnum = ac_daily_df['aries_id'].unique()
        all_well_propnum = all_well_propnum.union(set(ac_daily_ls_propnum))

        # get monthly production propnum
        ac_product_df = self.AC_PRODUCT_df.copy()
        ac_product_df.columns = map(str.upper, ac_product_df.columns)
        ac_product_df.rename(columns=self.user_define_well_months_mapping_for_combocurve, inplace=True)
        ac_product_df = ac_product_df.filter(items=self.combocurve_header_dic['well_months'])
        set_column_to_none = set(self.combocurve_header_dic['well_months']) - set(list(ac_product_df))
        for name in set_column_to_none:
            ac_product_df[name] = None
        # get the unique_well id in monthly well values
        ac_product_ls_propnum = ac_product_df['aries_id'].unique()
        all_well_propnum = all_well_propnum.union(set(ac_product_ls_propnum))

        # get well header propnum
        ac_property_df = self.AC_PROPERTY_df.copy()
        ac_property_df.columns = map(str.upper, ac_property_df.columns)
        ac_property_df = ac_property_df.replace(' ', np.nan, regex=False)
        ac_property_df.rename(columns=self.user_define_wells_mapping_for_combocurve, inplace=True)
        ac_property_df = ac_property_df.filter(items=self.combocurve_header_dic['wells'])
        set_column_to_none = set(self.combocurve_header_dic['wells']) - set(list(ac_property_df))
        for name in set_column_to_none:
            ac_property_df[name] = None
        ac_property_ls_propnum = ac_property_df['aries_id'].unique()
        all_well_propnum = all_well_propnum.union(set(ac_property_ls_propnum))

        # get economic propnum
        ac_economic_df = self.AC_ECONOMIC_df.copy()
        ac_economic_df.columns = map(str.upper, ac_economic_df.columns)
        ac_economic_ls_propnum = ac_economic_df['PROPNUM'].unique()
        all_well_propnum = all_well_propnum.union(set(ac_economic_ls_propnum))

        return list(all_well_propnum)

    def create_custom_name_alias_dict(self, gcp_name_dic):
        table_name_alias_dict = {}
        # TODO: this can be change for gcp_name_dic.get('ARSYSTBL')
        for file_name in gcp_name_dic:
            if file_name == 'ARSYSTBL':
                binary = self.context.file_service.download_to_memory(gcp_name_dic[file_name])
                binary.seek(0)
                arsystbl_df = pd.read_csv(binary)
                arsystbl_df.columns = [str(table_name).upper() for table_name in arsystbl_df.columns]
                if all(table_name in arsystbl_df.columns for table_name in ['TABLENAME', 'TBL_ALIAS']):
                    for idx, row in arsystbl_df.iterrows():
                        table_name_alias_dict[str(row.TABLENAME)] = str(row.TBL_ALIAS)
        return table_name_alias_dict

    def read_all_table(self, ls_table=None):
        """
        read all the tables and save into self.variable_name = df
        reads the data in table as csv and saves it. e.g self.AC_DAILY_df (just as it is in local) if no argument is
        passed, if an argument is passed it returns the file (csv) for that argument. e.g ls_table = "PROJECT" returns
        sets the attribute self.PROJECT_df
        """
        # TODO: This can be avoided. Use self.gcp_name_dic instead.
        gcp_name_dic = self.gcp_name_dic

        if ls_table is not None:
            gcp_name_dic = {table_name: gcp_name_dic[table_name] for table_name in ls_table}
        custom_table_dict = {}

        table_name_alias_dict = self.create_custom_name_alias_dict(gcp_name_dic)
        for file_name in gcp_name_dic:
            if file_name in [ARIES_FILES_LABEL[AriesFilesEnum.ac_daily], ARIES_FILES_LABEL[AriesFilesEnum.ac_product]]:
                value = None
            elif file_name == 'ARSYSTBL':
                continue
            else:
                binary = self.context.file_service.download_to_memory(gcp_name_dic[file_name])
                binary.seek(0)
                if file_name in list(ARIES_FILES_LABEL.values()):
                    file_name += '_df'
                    value = pd.read_csv(binary)
                else:
                    value = pd.read_csv(binary)
                    if file_name in table_name_alias_dict:
                        clean_propnum_in_property_df(value)
                        custom_table_dict[table_name_alias_dict[file_name]] = value
            setattr(self, file_name, value)  # equivalent to: self.varname= 'something'
        setattr(self, 'CUSTOM_TABLE_dict', custom_table_dict)

    def simple_mapping(self, ls_aries_file_column_names, ls_combocurve_column_names) -> dict:
        '''
        when initializztion, set wells, well_days, well_months suggest maaping dictionary for user
        '''
        def similar(a, b):
            return SequenceMatcher(None, a, b).ratio()

        dic_score = {}
        dic_aries_to_combocurve = {}
        for cc_name in ls_combocurve_column_names:
            score = 0
            taget_file_name = ''
            for file_name in ls_aries_file_column_names:
                ratio = similar(cc_name.lower(), file_name.lower())
                # TODO: score is constant. use ratio > 0 (?)
                if ratio > score:
                    score = ratio
                    taget_file_name = file_name
            dic_score[cc_name] = (taget_file_name, score)
            dic_aries_to_combocurve[taget_file_name] = cc_name

        return dic_aries_to_combocurve

    # TODO: This function is not being used. Commented reference in aries_service.py
    def get_combocurve_suggest_wells_mapping_for_user(self):
        '''
        front end call this function to get combocurve_suggest_wells_mapping_for_user
        '''
        self.read_all_table(ls_table=['AC_PROPERTY'])
        # define suggest mapping for user and user defined mapping for combocurve
        self.combocurve_suggest_wells_mapping_for_user = self.simple_mapping(list(self.AC_PROPERTY_df),
                                                                             self.combocurve_header_dic['wells'])
        return self.combocurve_suggest_wells_mapping_for_user

    # TODO: This function is not being used. Commented reference in aries_service.py
    def get_combocurve_suggest_well_days_mapping_for_user(self):
        '''
        front end call this function to get combocurve_suggest_well_days_mapping_for_user
        '''
        self.read_all_table(ls_table=['AC_DAILY'])
        # define suggest mapping for user and user defined mapping for combocurve
        self.combocurve_suggest_well_days_mapping_for_user = self.simple_mapping(
            list(self.AC_DAILY_df), self.combocurve_header_dic['well_days'])
        return self.combocurve_suggest_well_days_mapping_for_user

    # TODO: This function is not being used. Commented reference in aries_service.py
    def get_combocurve_suggest_well_months_mapping_for_user(self):
        """
        front end call this function to get combocurve_suggest_well_months_mapping_for_user
        """
        self.read_all_table(ls_table=['AC_PRODUCT'])
        # define suggest mapping for user and user defined mapping for combocurve
        self.combocurve_suggest_well_months_mapping_for_user = self.simple_mapping(
            list(self.AC_PRODUCT_df), self.combocurve_header_dic['well_months'])
        return self.combocurve_suggest_well_months_mapping_for_user

    def get_scenario_name_for_user(self):
        """
        return scenario name as list, let user to choose only one scenario to import
        """
        # set attribute self.AC_SCENARIO_df
        self.read_all_table(ls_table=['AC_SCENARIO'])
        # get scenario name list
        ac_scenario_df = self.AC_SCENARIO_df.copy()
        # change the column names to upper case
        ac_scenario_df.columns = map(str.upper, ac_scenario_df.columns)
        # get all the unique SCEN_NAME and convert to list
        ls_scenario = ac_scenario_df['SCEN_NAME'].unique().tolist()
        # returns list of unique SCEN_NAME in ac_scenario_df
        return ls_scenario

    # TODO: This function is not being used. Commented reference in aries_service.py
    def get_project_name_for_user(self):
        """
        return project name as list, let user to choose only one project to import
        """
        # set self.project_dicmpty dictionary
        self.projects_dic = {}
        # create wider scope "PROJECT" (simpler: creates PROJECt_df)
        self.read_all_table(ls_table=['PROJECT'])
        # set properties for each project in table and stores in project dic under unique_id
        self.create_project_collection_from_aries_table()
        project_ls = []
        # get name for each project using its unique_id
        for _id in self.projects_dic:
            project_ls.append(self.projects_dic[_id]['name'])
        # returns list of project names
        return project_ls

    def set_chosen_scenario_name_for_combocurve(self, scenario_ls):
        """
        set user chosen scenario name as the only project in self.scenario_ls for later importing process
        """
        self.scenario_ls = copy.deepcopy(scenario_ls)

    def set_chosen_setup(self, setups):
        self.setups = copy.deepcopy(setups)

    def set_chosen_project_name_for_combocurve(self, project_ls, user_project_id):
        '''
        set user chosen project name as the only project in self.projects_dic for later importing process
        '''
        the_only_project_dic = {}
        # only pick one project
        user_select_project_name = project_ls[0]

        # should have only 1 element in the chosen_ls
        for _id in self.projects_dic:
            # ensure that only one project is going to be imported
            if (self.projects_dic[_id]['name'] == user_select_project_name) and len(the_only_project_dic) < 1:
                self.projects_dic[_id]['_id'] = ObjectId(user_project_id)
                self.project_id = ObjectId(user_project_id)
                the_only_project_dic[ObjectId(user_project_id)] = self.projects_dic[_id]

        self.projects_dic = copy.deepcopy(the_only_project_dic)

    # TODO: This function is not being used. Commented reference in aries_service.py
    def set_user_define_wells_mapping_for_combocurve(self, defined_dic):
        '''
        front end call this function to set user_define_wells_mapping_for_combocurve
        '''
        self.user_define_wells_mapping_for_combocurve = defined_dic
        self.user_define_wells_mapping_for_combocurve['PROPNUM'] = 'aries_id'

    # TODO: This function is not being used. Commented reference in aries_service.py
    def set_user_define_well_days_mapping_for_combocurve(self, defined_dic):
        '''
        front end call this function to set user_define_well_days_mapping_for_combocurve
        '''
        self.user_define_well_days_mapping_for_combocurve = defined_dic
        self.user_define_well_days_mapping_for_combocurve['PROPNUM'] = 'aries_id'

    # TODO: This function is not being used. Commented reference in aries_service.py
    def set_user_define_well_months_mapping_for_combocurve(self, defined_dic):
        '''
        front end call this function to set user_define_well_months_mapping_for_combocurve
        '''
        self.user_define_well_months_mapping_for_combocurve = defined_dic
        self.user_define_well_months_mapping_for_combocurve['PROPNUM'] = 'aries_id'

    # TODO: This function is not being used. Commented reference in aries_service.py
    def well_days(self):
        '''
        generate well_days collection and save into database
        '''
        df = self.AC_DAILY_df.copy()
        header_cols = df.columns
        df_array = np.array(df)

        if df_array.size == 0:
            return

        header_cols = [str(header).upper() for header in header_cols]

        # map headers using user defined maps
        header_cols = [
            self.user_define_well_days_mapping_for_combocurve[header]
            if header in list(self.user_define_well_days_mapping_for_combocurve.keys()) else header
            for header in header_cols
        ]

        # filter out columns not in combocurve_header_dic
        sel_index = [
            i for i in range(len(header_cols))
            if header_cols[i] in list(self.user_define_well_days_mapping_for_combocurve.values())
        ]
        header_cols = [header_cols[index] for index in sel_index]
        df_array = df_array[:, sel_index]

        # create columns not in combocurve_header_dic and set to None
        set_column_to_none = list(set(self.combocurve_header_dic['well_days']) - set(header_cols))
        temp_array = np.zeros((df_array.shape[0], len(set_column_to_none)))
        temp_array = np.where(temp_array == 0, np.nan, temp_array)
        df_array = np.concatenate((df_array, temp_array), axis=1)
        header_cols += set_column_to_none

        # add month, year, and day columns
        try:
            date_index = header_cols.index('date')
            header_cols.append('month')
            df_array = np.c_[df_array, pd.to_datetime(df_array[:, date_index]).month]
            header_cols.append('year')
            df_array = np.c_[df_array, pd.to_datetime(df_array[:, date_index]).year]
            header_cols.append('day')
            df_array = np.c_[df_array, pd.to_datetime(df_array[:, date_index]).day]
            df_array[:, date_index] = pd.to_datetime(df_array[:, date_index]).astype(str)
        except Exception:
            message = ("Could not format date from 'AC_Daily' file! Check 'AC_DAILY' file for error")
            self.log_report.log_error(message=message)

        if df_array.size != 0:
            header_cols.append('index')

        # create index from date
        index_col = [
            self.calculate_start_date_index(df_array[i, -2], df_array[i, -3], df_array[i, -1])
            for i in range(df_array.shape[0])
        ]
        index_col = np.array(index_col)
        df_array = np.c_[df_array, index_col]

        # sort array based on index
        df_array = df_array[np.argsort(index_col)[::-1], :]

        # create dictionary and assign to self.aries_id_to_daily_fpd_dic
        aries_id_index = header_cols.index('aries_id')
        try:
            self.aries_id_to_daily_fpd_dic = {
                df_array[i, aries_id_index]: df_array[i, date_index]
                for i in range(df_array.shape[0])
            }
        except Exception:
            message = ("Could not format date from 'AC_DAILY' file! Check 'AC_DAILY' file for error")
            self.log_report.log_error(message=message)

        header_cols = [str(header).lower() for header in header_cols]
        self.well_daily_data = pd.DataFrame(df_array, columns=header_cols)

    # TODO: This function is not being used. Commented reference in aries_service.py
    def well_months(self):
        '''
        generate well_months collection and save into database
        '''

        df = self.AC_PRODUCT_df.copy()
        header_cols = df.columns
        df_array = np.array(df)
        if df_array.size == 0:
            return

        # capitalize all headers
        header_cols = [str(header).upper() for header in header_cols]

        # map headers using user defined maps
        header_cols = [
            self.user_define_well_months_mapping_for_combocurve[header]
            if header in list(self.user_define_well_months_mapping_for_combocurve.keys()) else header
            for header in header_cols
        ]

        # filter out columns not in combocurve_header_dic
        sel_index = [
            i for i in range(len(header_cols))
            if header_cols[i] in list(self.user_define_well_months_mapping_for_combocurve.values())
        ]
        header_cols = [header_cols[index] for index in sel_index]
        df_array = df_array[:, sel_index]

        # create columns not in combocurve_header_dic and set to None
        set_column_to_none = list(set(self.combocurve_header_dic['well_months']) - set(header_cols))
        temp_array = np.zeros((df_array.shape[0], len(set_column_to_none)))
        temp_array = np.where(temp_array == 0, np.nan, temp_array)
        df_array = np.concatenate((df_array, temp_array), axis=1)
        header_cols += set_column_to_none

        # create month, year column from date column
        try:
            date_index = header_cols.index('date')
            header_cols.append('month')
            df_array = np.c_[df_array, pd.to_datetime(df_array[:, date_index]).month]
            header_cols.append('year')
            df_array = np.c_[df_array, pd.to_datetime(df_array[:, date_index]).year]
            df_array[:, date_index] = pd.to_datetime(df_array[:, date_index]).astype(str)
        except Exception:
            message = "Could not format date from 'AC_PRODUCT' file! Check 'AC_PRODUCT' file for error"
            self.log_report.log_error(message=message)

        if df_array.size != 0:
            header_cols.append('index')

        # create index column
        index_col = [
            self.calculate_start_date_index(df_array[i, -1], df_array[i, -2], 15) for i in range(df_array.shape[0])
        ]
        index_col = np.array(index_col)
        df_array = np.c_[df_array, index_col]
        # sort index
        df_array = df_array[np.argsort(index_col)[::-1], :]

        aries_id_index = header_cols.index('aries_id')

        # create dictionary and assign to aries_id_to_daily_fpd_dic
        try:
            self.aries_id_to_daily_fpd_dic = {
                df_array[i, date_index]: df_array[i, aries_id_index]
                for i in range(df_array.shape[0])
            }
        except Exception:
            message = ("Check 'AC_PRODUCT' file for error")
            self.log_report.log_error(message=message)

        if self.ls_propnum is not None:
            ls_propnum = self.ls_propnum
        else:
            # gen unique aries_id
            ls_propnum = np.unique(df_array[:, aries_id_index])
            if (ls_propnum[0] is None) and (len(ls_propnum) == 1):
                message = ("'aries_id' list is empty! Check well mapping for Monthly Well Production "
                           "for error (AC PRODUCT)")
                self.log_report.log_error(aries_row=df['aries_id'], message=message)

        header_cols = [str(header).lower() for header in header_cols]
        self.well_monthly_data = pd.DataFrame(df_array, columns=header_cols)

    def create_monthly_format_via_ls(self, selected_df, import_type):  # noqa: C901
        '''
        11/21/2019
        create new data format for mongodb
        input selected_df from aries only
        '''
        item_ls = ['water', 'oil', 'gas']

        # check if all value is None, then return True for all_none
        check_selected_df = selected_df[item_ls]
        if check_selected_df.isnull().all(axis=None):
            return selected_df, True

        monthly_format_ls = []
        temp_document_ls = []
        year = None
        last_index = selected_df.index[-1]

        for index_row, row in selected_df.iterrows():
            if row['year'] != year:
                # append temp_document_ls before create new month document
                if temp_document_ls:
                    if len(temp_document_ls[3]) < 12:
                        no_of_none = 12 - len(temp_document_ls[3])

                        temp_document_ls[3] += [None] * no_of_none
                        temp_document_ls[4] += [None] * no_of_none
                        temp_document_ls[5] += [None] * no_of_none
                        temp_document_ls[6] += [None] * no_of_none

                    for idx in range(len(temp_document_ls[3])):
                        if temp_document_ls[3][idx] is not None:
                            temp_document_ls[2] = idx
                            break

                    monthly_format_ls.append(temp_document_ls)

                # create new month document (daily production)
                # need to calcualte fist day of month
                no_of_none = int(row['month']) - 1
                default_ls = [None] * no_of_none
                start_index = self.calculate_start_date_index(row['year'], 1, 15)
                chosen_id = None
                first_production_index = no_of_none
                index = default_ls.copy() + [row['index']]
                water = default_ls.copy() + [row['water'] if (row['water'] is not None and row['water'] >= 0) else None]
                oil = default_ls.copy() + [row['oil'] if (row['oil'] is not None and row['oil'] >= 0) else None]
                gas = default_ls.copy() + [row['gas'] if (row['gas'] is not None and row['gas'] >= 0) else None]

                if all(row[item] is None for item in item_ls):
                    index = None

                temp_document_ls = [start_index, chosen_id, first_production_index, index, water, oil, gas]

                year = row['year']
                month = row['month']
            else:
                # keep filling the exist year document (monthly production)
                if row['month'] == month + 1:
                    if all(row[item] is None for item in item_ls):
                        temp_document_ls[3].append(None)
                    else:
                        temp_document_ls[3].append(row['index'])
                    temp_document_ls[4].append(row['water'] if (
                        row['water'] is not None and row['water'] >= 0) else None)
                    temp_document_ls[5].append(row['oil'] if (row['oil'] is not None and row['oil'] >= 0) else None)
                    temp_document_ls[6].append(row['gas'] if (row['gas'] is not None and row['gas'] >= 0) else None)
                elif row['month'] == month:
                    try:
                        if row['water']:
                            temp_document_ls[4][-1] = max(temp_document_ls[4][-1], row['water'])
                    except Exception:
                        if not temp_document_ls[4][-1]:
                            temp_document_ls[4][-1] = row['water']
                    try:
                        if row['oil']:
                            temp_document_ls[5][-1] = max(temp_document_ls[5][-1], row['oil'])
                    except Exception:
                        if not temp_document_ls[5][-1]:
                            temp_document_ls[5][-1] = row['oil']
                    try:
                        if row['gas']:
                            temp_document_ls[6][-1] = max(temp_document_ls[6][-1], row['gas'])
                    except Exception:
                        if not temp_document_ls[6][-1]:
                            temp_document_ls[6][-1] = row['gas']
                else:
                    for dummy_idx in range(int(row['month']) - (month + 1)):
                        temp_document_ls[3].append(None)
                        temp_document_ls[4].append(None)
                        temp_document_ls[5].append(None)
                        temp_document_ls[6].append(None)

                    if all(row[item] is None for item in item_ls):
                        temp_document_ls[3].append(None)
                    else:
                        temp_document_ls[3].append(row['index'])

                    temp_document_ls[4].append(row['water'] if (
                        row['water'] is not None and row['water'] >= 0) else None)
                    temp_document_ls[5].append(row['oil'] if (row['oil'] is not None and row['oil'] >= 0) else None)
                    temp_document_ls[6].append(row['gas'] if (row['gas'] is not None and row['gas'] >= 0) else None)
                month = row['month']

            if index_row == last_index:
                # append temp_document_ls before create new month document
                if temp_document_ls:
                    if len(temp_document_ls[3]) < 12:
                        no_of_none = 12 - len(temp_document_ls[3])

                        temp_document_ls[3] += [None] * no_of_none
                        temp_document_ls[4] += [None] * no_of_none
                        temp_document_ls[5] += [None] * no_of_none
                        temp_document_ls[6] += [None] * no_of_none

                    for idx in range(len(temp_document_ls[3])):
                        if temp_document_ls[3][idx] is not None:
                            temp_document_ls[2] = idx
                            break

                    monthly_format_ls.append(temp_document_ls)

        format_selected_df = pd.DataFrame.from_records(
            monthly_format_ls,
            columns=['startIndex', 'chosenID', 'first_production_index', 'index', 'water', 'oil', 'gas'])
        format_selected_df['aries_id'] = selected_df['aries_id'].values[0]
        return format_selected_df, False

    def wells(self):  # noqa(c901)
        '''
        generate wells (header) collection and save into databse
        '''
        df = self.AC_PROPERTY_df.copy()

        # capitalize headers
        header_cols = [str(header).upper() for header in df.columns]

        df_array = np.array(df)

        # replace single space to None
        df_array = np.where(df_array == ' ', np.nan, df_array)

        # get mapping from user selection
        header_cols = [
            self.user_define_wells_mapping_for_combocurve[header]
            if header in list(self.user_define_wells_mapping_for_combocurve.keys()) else header
            for header in header_cols
        ]

        # identify the index selected for mapping
        sel_index = [
            i for i in range(len(header_cols))
            if header_cols[i] in list(self.user_define_wells_mapping_for_combocurve.values())
        ]

        # select the header columns
        header_cols = [header_cols[index] for index in sel_index]
        # select the columns in the array
        df_array = df_array[:, sel_index]

        # set columns that were selected as None
        set_column_to_none = list(set(self.combocurve_header_dic['wells']) - set(header_cols))
        temp_array = np.zeros((df_array.shape[0], len(set_column_to_none)))
        temp_array = np.where(temp_array == 0, np.nan, temp_array)
        df_array = np.concatenate((df_array, temp_array), axis=1)

        # add header names of columns set to None
        header_cols += set_column_to_none

        # add latitude and longitude information
        if 'surface_latitude_wgs84' not in header_cols:
            header_cols.append('surface_latitude_wgs84')
            temp_array = np.zeros((df_array.shape[0], 1))
            df_array = np.concatenate((df_array, temp_array), axis=1)

        if 'surface_longitude_wgs84' not in header_cols:
            header_cols.append('surface_longitude_wgs84')
            temp_array = np.zeros((df_array.shape[0], 1))
            df_array = np.concatenate((df_array, temp_array), axis=1)

        # create new columns for geohash

        longitude_index = header_cols.index('surface_longitude_wgs84')
        latitude_index = header_cols.index('surface_latitude_wgs84')
        geo_column = []
        for i in range(df_array.shape[0]):
            geo_column.append(gh.encode(df_array[i, latitude_index], df_array[i, longitude_index], precision=12))
        if 'geohash' in header_cols:
            geo_index = header_cols.index('geohash')
            df_array[:, geo_index] = np.array(geo_column)
        else:
            header_cols.append('geohash')
            geo_column = np.array(geo_column).reshape(df_array.shape[0], 1)
            df_array = np.concatenate((df_array, geo_column), axis=1)

        # format first_prod_date column
        try:
            first_prod_date_index = header_cols.index('first_prod_date')
            first_prod_date_col = df_array[:, first_prod_date_index]
            # first_prod_date_col = first_prod_date_col.astype(float)
            first_prod_date_col = np.where(first_prod_date_col.astype(str) == 'nan', '1800-12-28', first_prod_date_col)
            df_array[:, first_prod_date_index] = first_prod_date_col
            for i in range(df_array.shape[0]):
                df_array[i,
                         first_prod_date_index] = pd.to_datetime(df_array[i,
                                                                          first_prod_date_index]).strftime('%Y-%m-%d')
        except Exception:
            message = ("'first_prod_date' invalid! Check 'AC_PROPERTY' file for error")
            self.log_report.log_error(message=message, severity='warning')

        # format end_prod_date column
        try:
            end_prod_date_index = header_cols.index('end_prod_date')
            end_prod_date_col = df_array[:, end_prod_date_index]
            # end_prod_date_col = end_prod_date_col.astype(float)
            end_prod_date_col = np.where(end_prod_date_col.astype(str) == 'nan', '1800-12-28', end_prod_date_col)
            df_array[:, end_prod_date_index] = end_prod_date_col
            for i in range(df_array.shape[0]):
                df_array[i, end_prod_date_index] = pd.to_datetime(df_array[i, end_prod_date_index]).strftime('%Y-%m-%d')
        except Exception:
            message = ("'end_prod_date' invalid! Check 'AC_PROPERTY' file for error")
            self.log_report.log_error(message=message, severity='warning')

        # format spud_prod_date column
        try:
            spud_date_index = header_cols.index('spud_date')
            spud_date_col = df_array[:, spud_date_index]
            spud_date_col = np.where(spud_date_col.astype(str) == 'nan', '1800-12-28', spud_date_col)
            df_array[:, spud_date_index] = spud_date_col
            for i in range(df_array.shape[0]):
                df_array[i, spud_date_index] = pd.to_datetime(df_array[i, spud_date_index]).strftime('%Y-%m-%d')
        except Exception:
            message = ("'spud_date' format invalid! Check 'AC_PROPERTY' file for error")
            self.log_report.log_error(message=message, severity='warning')

        # format comp_start_date column
        try:
            completion_start_date_index = header_cols.index('completion_start_date')
            completion_start_date_col = df_array[:, completion_start_date_index]
            completion_start_date_col = np.where(
                completion_start_date_col.astype(str) == 'nan', '1800-12-28', completion_start_date_col)
            df_array[:, completion_start_date_index] = completion_start_date_col
            for i in range(df_array.shape[0]):
                df_array[i, completion_start_date_index] = pd.to_datetime(
                    df_array[i, completion_start_date_index]).strftime('%Y-%m-%d')
        except Exception:
            message = ("'completion_start_date' invalid! Check 'AC_PROPERTY' file for error")
            self.log_report.log_error(message=message, severity='warning')

        # format comp_end_date column
        try:
            completion_end_date_index = header_cols.index('completion_end_date')
            completion_end_date_col = df_array[:, completion_end_date_index]
            completion_end_date_col = np.where(
                completion_end_date_col.astype(str) == 'nan', '1800-12-28', completion_end_date_col)
            df_array[:, completion_end_date_index] = completion_end_date_col
            for i in range(df_array.shape[0]):
                df_array[i, completion_end_date_index] = pd.to_datetime(
                    df_array[i, completion_end_date_index]).strftime('%Y-%m-%d')
        except Exception:
            message = ("'completion_end_date' invalid! Check 'AC_PROPERTY' file for error")
            self.log_report.log_error(message=message, severity='warning')

        # format gas_analysis_date column
        try:
            gas_analysis_date_index = header_cols.index('gas_analysis_date')
            gas_analysis_date_col = df_array[:, gas_analysis_date_index]
            gas_analysis_date_col = np.where(
                gas_analysis_date_col.astype(str) == 'nan', '1800-12-28', gas_analysis_date_col)
            df_array[:, gas_analysis_date_index] = gas_analysis_date_col
            for i in range(df_array.shape[0]):
                df_array[i, gas_analysis_date_index] = pd.to_datetime(
                    df_array[i, gas_analysis_date_index]).strftime('%Y-%m-%d')
        except Exception:
            message = ("'gas_analysis_date' invalid! Check 'AC_PROPERTY' file for error")
            self.log_report.log_error(message=message, severity='warning')

        if self.ls_propnum is not None:
            ls_propnum = self.ls_propnum
        else:
            aries_index = header_cols.index('aries_id')
            ls_propnum = np.unique(df_array[:, aries_index])
        self.well_count = len(ls_propnum)

        if (ls_propnum[0] is None) and (len(ls_propnum) == 1):
            message = "'aries_id' list is empty! Check Well mapping for Well headers for error"
        header_cols.append('inptID')

        for idx, property_id in enumerate(ls_propnum):
            selected_df = df_array[(df_array[:, aries_index] == property_id), :]
            if selected_df.size == 0:
                continue

            # creat inptID for each id
            inpt_id = gen_inpt_id()
            selected_df = np.c_[selected_df, np.array(inpt_id)]

            header_cols = [header.lower() if header != 'inptID' else header for header in header_cols]
            selected_df = pd.DataFrame(selected_df, columns=header_cols)
            try:
                self.batch_well_import_process(selected_df)
            except Exception:
                message = "Could not import 'AC_PROPERTY' file! Check 'AC_PROPERTY' file for error"
                self.log_report.log_error(message=message, severity='warning')

    def create_project_collection_from_aries_table(self, project_name='Aries Project'):
        """
            create multilple projects into projects collection
            1. get project number and name from PROJECT table
            2. get wells from PROJLIST table
        """
        '''
        xuyan 08/25/2020:
        I didn't see it use PROJLIST info here, and I think it only get the projects name from PROJECT,
        so I think we don't need this process, because the project is precreated by user with the name they defined
        '''
        project_default_document = self.get_default_format('projects')

        project_default_document['_id'] = ObjectId()
        project_default_document['name'] = project_name

        project_default_document['createdAt'] = datetime.datetime.now()
        project_default_document['updatedAt'] = datetime.datetime.now()

        self.projects_dic[project_default_document['_id']] = project_default_document
        '''
        project_df = self.PROJECT_df.copy()
        # if no project, give a default project
        if project_df.empty:
            project_default_document = self.get_default_format('projects')
            project_default_document['_id'] = ObjectId()
            project_default_document['name'] = 'Aries Project'

            project_default_document['createdAt'] = datetime.datetime.now()
            project_default_document['updatedAt'] = datetime.datetime.now()

            self.projects_dic[project_default_document['_id']] = project_default_document
        else:
            # get the unique project names
            try:
                ls_project_name = project_df['NAME'].unique()
            except KeyError:
                raise ProjectFileError()
            # create empty dataframe
            df = pd.DataFrame()
            # create dataframe sorted by projects, code joins all projects one by one
            for name in ls_project_name:
                selected_df = project_df.loc[project_df['NAME'] == name]
                df = df.append(selected_df, ignore_index=True)

            # set property for each row in dataframe and store in project_dic using unique id for each project
            for index, row in df.iterrows():
                project_default_document = self.get_default_format('projects')
                project_default_document['_id'] = ObjectId()
                project_default_document['name'] = row.NAME

                project_default_document['createdAt'] = datetime.datetime.now()
                project_default_document['updatedAt'] = datetime.datetime.now()

                self.projects_dic[project_default_document['_id']] = project_default_document
        '''

    def save_enddate_to_dic(self):
        '''
        save the ENDDATE reference to self.enddate_dic
        '''
        areenddate_df = self.ARENDDATE_df.copy()
        header_cols = [str(value).upper() for value in areenddate_df.columns]

        columns_correct, problem_column = (header_cols, ENDDATE_RQD_COLS)

        if not columns_correct:
            message = format_error_msg(ErrorMsgEnum.class1_msg.value,
                                       (ErrorMsgEnum.end_date.value, problem_column, ErrorMsgEnum.areenddate.value))
            self.log_report.log_error(message=message, severity=ErrorMsgSeverityEnum.warn.value)
            return

        try:
            areenddate_df['LIFE'] = areenddate_df['LIFE'].apply(float)
        except ValueError:
            message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.end_date.value,
                                       ErrorMsgEnum.project_life.value, ErrorMsgEnum.areenddate.value)
            self.log_report.log_error(message=message, severity=ErrorMsgSeverityEnum.warn.value)
            self.enddate_dic = {}
            return

        areenddate_df['YEAR'] = (areenddate_df['LIFE'] // 12.).astype(int)
        areenddate_df['MONTH'] = (((areenddate_df['LIFE'] / 12.) - (areenddate_df['LIFE'] // 12.)) * 12.) + 1
        areenddate_df['MONTH'] = np.floor(areenddate_df['MONTH'])
        areenddate_df['MONTH'] = areenddate_df['MONTH'].astype(int)

        # handle if MONTH > 12
        areenddate_df.loc[areenddate_df['MONTH'] > 12, 'YEAR'] = areenddate_df['YEAR'] + 1
        areenddate_df.loc[areenddate_df['MONTH'] > 12, 'MONTH'] = 1

        areenddate_df['YEAR str'] = areenddate_df['YEAR'].astype(str)
        areenddate_df['MONTH str'] = areenddate_df['MONTH'].astype(str)
        areenddate_df['DATE'] = areenddate_df['MONTH str'].values + '/' + areenddate_df['YEAR str'].values

        self.enddate_dic = pd.Series(areenddate_df['DATE'].values, index=areenddate_df['RECORD_CODE']).to_dict()

    def create_wells_dic(self):
        well_documents = self.context.wells_collection.find({'project': self.project_id})
        for well_doc in well_documents:
            self.wells_dic[well_doc['chosenID']] = well_doc

    # TODO: economic
    def economic(self):  # noqa C901
        """
        generate all econ assumptions (model) for 1 scenario (could be multiple scenarios) and save into database
        """
        # get header columns from dataframe
        header_cols = self.AC_ECONOMIC_df.columns

        # convert dataframe to array
        df_array = np.array(self.AC_ECONOMIC_df)

        # capitalize header columns
        header_cols = [str(header).upper() for header in header_cols]

        column_correct, problem_column = check_for_required_cols(header_cols, ECON_REQUIRED_COLS)

        if not column_correct:
            message = format_error_msg(ErrorMsgEnum.class2_msg.value, problem_column, ErrorMsgEnum.ac_economic.value)
            self.log_report.log_error(message=message, severity=ErrorMsgSeverityEnum.critical.value)
            return

        # filter out items in that order
        sel_index = [i for i in range(len(header_cols)) if header_cols[i] in ECON_COLS]
        header_cols = [header_cols[index] for index in sel_index]
        df_array = df_array[:, sel_index]

        propnum_index, section_index, qualifier_col_index, keyword_index, expression_index = get_header_index(
            ECON_REQUIRED_COLS, header_cols)

        # get id name
        if self.ls_propnum is not None:
            ls_propnum = self.ls_propnum
        else:
            df_array = clean_econ_df(df_array, propnum_index)
            ls_propnum = np.unique(df_array[:, propnum_index])

        # get scenario header columns
        scen_header_cols = [str(header).upper() for header in self.AC_SCENARIO_df.columns]
        # convert dataframe to array
        scenario_df_array = np.array(self.AC_SCENARIO_df)

        if scenario_df_array.size != 0:
            scenario_df_array = get_scenario_array_from_dbs_key(scenario_df_array, scen_header_cols, self.DBSLIST_df,
                                                                self.log_report)

        column_correct, problem_column = check_for_required_cols(scen_header_cols, ['SCEN_NAME', 'DATA_SECT'])
        scenario_df_array, scen_header_cols = update_scenario_df_if_necessary(scenario_df_array, scen_header_cols)

        if not column_correct:
            message = format_error_msg(ErrorMsgEnum.class2_msg.value, problem_column, ErrorMsgEnum.ac_scenario.value)
            self.log_report.log_error(message=message, severity=ErrorMsgSeverityEnum.critical.value)
            return

        scen_name_index, data_sect_index = get_header_index(['SCEN_NAME', 'DATA_SECT'], scen_header_cols)

        # get scenario
        if self.scenario_ls:
            ls_scenario = self.scenario_ls
        else:
            ls_scenario = np.unique(scenario_df_array[:, scen_name_index])

        start_prog = 2
        end_prog = 95
        scen_prog = (end_prog - start_prog) / len(ls_scenario) if len(ls_scenario) else None

        count = 0
        for scenario in ls_scenario:
            ls_scenarios_id = []

            for _id in self.projects_dic:
                scenarios_default_document = self.get_default_format('scenarios')
                scenarios_default_document['name'] = scenario
                scenarios_default_document['createdAt'] = datetime.datetime.now()
                scenarios_default_document['updatedAt'] = datetime.datetime.now()
                scenarios_default_document['general_options'] = self.general_options_model_id
                if self.scenario_id is None:
                    scenarios_default_document['_id'] = ObjectId()
                else:
                    scenarios_default_document['_id'] = self.scenario_id
                ls_scenarios_id.append(scenarios_default_document['_id'])

                scenarios_default_document['project'] = _id
                self.projects_dic[_id]['scenarios'].append(scenarios_default_document['_id'])
                self.scenarios_dic[scenarios_default_document['_id']] = scenarios_default_document
                self.scenarios_dic[scenarios_default_document['_id']]['aries_id'] = []

                selected_scenario_df = scenario_df_array[np.argwhere(
                    scenario_df_array[:, scen_name_index] == scenario).flatten(), :]
                selected_scenario_df = np.where(selected_scenario_df == ' ', np.nan, selected_scenario_df)
                for idx, property_id in enumerate(ls_propnum):
                    # check if wells exist for this property_id
                    if not self.check_if_well_exist(property_id):
                        continue

                    selected_df = df_array[np.argwhere(df_array[:, propnum_index] == property_id).flatten(), :]

                    if selected_df.size == 0:
                        continue

                    # replace ' ' with nan
                    selected_df = np.where(selected_df == ' ', np.nan, selected_df)

                    # get empty qualifier column
                    qualifier_selected_df = selected_df[np.argwhere(
                        selected_df[:, qualifier_col_index] == '').flatten(), :]
                    economic_df = np.copy(qualifier_selected_df)

                    for i in range(selected_scenario_df.shape[0]):
                        qualifier_index = 0
                        qualifier_column = 'QUAL' + str(qualifier_index)
                        try:
                            scen_qual_index = scen_header_cols.index(qualifier_column)
                        except ValueError:
                            message = format_error_msg(ErrorMsgEnum.class2_msg.value, qualifier_column, 'AC_SCENARIO')
                            self.log_report.log_error(message=message, severity=ErrorMsgSeverityEnum.warn.value)
                            continue
                        qual = selected_scenario_df[i, scen_qual_index]

                        # get other QUAL 1,2..9
                        while qual != '':
                            # break if finish loop from QUAL0 to QUAL9
                            if qualifier_index > 9:
                                break
                            try:
                                scen_qual_index = scen_header_cols.index(qualifier_column)
                            except ValueError:
                                break
                            qual = selected_scenario_df[i, scen_qual_index]
                            try:
                                data_sect_index_value = int(float(selected_scenario_df[i, data_sect_index]))
                            except ValueError:
                                data_sect_index_value = None
                            if data_sect_index_value == 4:
                                qualifier_selected_df = selected_df[np.argwhere(
                                    ((selected_df[:, section_index] == selected_scenario_df[i, data_sect_index])
                                     | (selected_df[:, section_index].astype(str) == '24'))
                                    & (selected_df[:, qualifier_col_index] == qual)).flatten(), :]
                            else:
                                qualifier_selected_df = selected_df[np.argwhere(
                                    (selected_df[:, section_index] == selected_scenario_df[i, data_sect_index])
                                    & (selected_df[:, qualifier_col_index] == qual)).flatten(), :]

                            if qualifier_selected_df.size == 0:
                                qualifier_index += 1
                                qualifier_column = 'QUAL' + str(qualifier_index)
                            else:
                                economic_df = np.concatenate((economic_df, qualifier_selected_df), axis=0)
                                break

                    expression_col = economic_df[:, expression_index]
                    expression_col = [str(expression).strip() for expression in expression_col]
                    economic_df[:, expression_index] = np.array(expression_col)
                    economic_df = convert_array_column_dtype_to_int(economic_df, section_index, initial=True)

                    # add lookup sequence
                    economic_df = np.c_[economic_df, economic_df.shape[0] * [None]]
                    if EconHeaderEnum.extracted_sequence.value not in header_cols:
                        header_cols.append(EconHeaderEnum.extracted_sequence.value)

                    # add sidefiles and lookups
                    temp_elt_data_dict = {}
                    economic_df = add_supplementary_econ_df(self, economic_df, header_cols, property_id, scenario,
                                                            ls_scenarios_id, keyword_index, temp_elt_data_dict)

                    try:
                        economic_df = add_common_lines(economic_df, header_cols, self.common_default_lines)
                    except Exception:
                        self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class3_msg.value,
                                                                           ErrorMsgEnum.common_lines.value),
                                                  scenario=scenario,
                                                  well=property_id,
                                                  severity=ErrorMsgSeverityEnum.warn.value)

                    # exception is used beause issue here will likely be a pandas error I may not know and if anything
                    # fails here, the whole well models will not be imported
                    try:
                        economic_df = order_df_based_on_section_and_sequence(economic_df, header_cols)
                    except Exception:
                        pass

                    try:
                        economic_df, header_cols = change_double_quote_to_previous_keyword(economic_df, header_cols)
                    except Exception:
                        message = format_error_msg(ErrorMsgEnum.class1_msg.value, ErrorMsgEnum.keywords.value,
                                                   ErrorMsgEnum.keyword.value, ErrorMsgEnum.ac_economic.value)
                        self.log_report.log_error(message=message,
                                                  scenario=scenario,
                                                  well=property_id,
                                                  severity=ErrorMsgSeverityEnum.error.value)

                    economic_df = convert_array_column_dtype_to_int(economic_df, section_index)

                    post_process.clean_elt_docs(self, temp_elt_data_dict, property_id, scenario)

                    if economic_df.size != 0:
                        for _id in ls_scenarios_id:
                            if self.scenarios_dic[_id]['name'] == scenario:
                                self.scenarios_dic[_id]['wells'].append(self.wells_dic[str(property_id)]['_id'])
                                self.scenarios_dic[_id]['aries_id'].append(str(property_id))
                        # clear previous well numbers before extraction
                        self.regenerate_well_count_by_phase_obj_dict()
                        self.ignore_overhead = False
                        self.shrink = 1
                        try:
                            self.keyword_select(economic_df, temp_elt_data_dict, header_cols, ls_scenarios_id, scenario,
                                                property_id)
                        except Exception:
                            message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.keywords.value)
                            self.log_report.log_error(message=message,
                                                      scenario=scenario,
                                                      well=property_id,
                                                      severity=ErrorMsgSeverityEnum.error.value)

                        try:
                            add_reservoir_category(property_id, scenario, ls_scenarios_id, self.wells_dic,
                                                   self.scenarios_dic, self.projects_dic, self.reserves_data_list,
                                                   self.get_default_format, self.compare_and_save_into_self_data_list)
                        except Exception:
                            message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.res_cat.value)
                            self.log_report.log_error(message=message,
                                                      scenario=scenario,
                                                      well=property_id,
                                                      severity=ErrorMsgSeverityEnum.error.value)

                    # update progress
                    self.update_progress_by_well([start_prog + scen_prog * count, start_prog + scen_prog * (count + 1)],
                                                 len(ls_propnum), PROGRESS_BATCH_SIZE, idx)

                # Run functions that require all wells to have been processed first
                self.add_ecl_link(ls_scenarios_id, _id)

                count += 1
            if count == 0:
                message = ErrorMsgEnum.scenario_error_msg.value
                self.log_report.log_error(message=message, severity=ErrorMsgSeverityEnum.critical.value)

        create.convert_cc_base_document_to_cc_elt_document(self)
        self.project_custom_header_ls = self.create_project_custom_header_ls()
        self.project_custom_header_data_ls = self.create_project_custom_header_data_ls()

    # TODO: economic

    def keyword_select(self, economic_df, elt_data_dict, header_cols, ls_scenarios_id, scenario,
                       property_id):  # noqa C901
        '''
        select specific keyword to process
        each selected df if does not have START, then do not import this model into mongodb
        '''
        economic_df = set_overlay_keywords_to_overlay_section(economic_df, header_cols)

        economic_df = order_df_based_on_section_and_sequence(economic_df, header_cols)

        section_index, expression_index, keyword_mark_index, original_keyword_index = get_header_index([
            EconHeaderEnum.section.value, EconHeaderEnum.expression.value, EconHeaderEnum.keyword.value,
            EconHeaderEnum.initial_keyword.value
        ], header_cols)

        economic_df = handle_overlay_override(economic_df, header_cols)

        economic_df = check_eloss_loss_keyword(economic_df, keyword_mark_index)

        # ownership
        section_2_7_economic_df, ownership_index_list = get_economic_section(
            economic_df,
            section_index,
            keyword_mark_index,
            section=[EconHeaderEnum.misc_section_key.value, EconHeaderEnum.own_section_key.value],
            keyword_mark=['START'])

        # capex
        section_8_economic_df = get_economic_section(
            economic_df,
            section_index,
            keyword_mark_index,
            section=[EconHeaderEnum.capex_section_key.value],
            keyword_mark=['START', 'ABAN', 'PLUG', 'ABANDON', 'SALVAGE', 'SALV', 'INVWT', 'WEIGHT'])

        # pricing and differentials
        section_5_economic_df = get_economic_section(economic_df,
                                                     section_index,
                                                     keyword_mark_index,
                                                     section=[EconHeaderEnum.price_section_key.value],
                                                     keyword_mark=['BTU', 'START'])

        # tax and expenses
        section_6_economic_df = get_economic_section(economic_df,
                                                     section_index,
                                                     keyword_mark_index,
                                                     section=[EconHeaderEnum.tax_expense_section_key.value],
                                                     keyword_mark=['BTU', 'START', 'XINVWT', 'WEIGHT'])

        # overlays
        section_9_economic_df = get_economic_section(economic_df,
                                                     section_index,
                                                     keyword_mark_index,
                                                     section=[EconHeaderEnum.overlay_section_key.value],
                                                     keyword_mark=['START'])

        post_process.add_overlay_to_elt_data(self, property_id, scenario, elt_data_dict, section_9_economic_df)

        # forecast / stream properties
        section_2_4_economic_df, forecast_index_list = get_economic_section(
            economic_df,
            section_index,
            keyword_mark_index,
            section=[
                EconHeaderEnum.misc_section_key.value, EconHeaderEnum.forecast_section_key.value,
                EconHeaderEnum.list_method_special_key.value
            ],
            keyword_mark=['START', 'XINVWT', 'WEIGHT', 'WELLS', 'WLS/OIL', 'WLS/GAS', 'WLS/INJ'])

        section_2_4_economic_df, forecast_index_list = add_list_method_special(section_2_4_economic_df, property_id,
                                                                               scenario, forecast_index_list,
                                                                               original_keyword_index,
                                                                               keyword_mark_index, section_index,
                                                                               expression_index, self.log_report)

        self.forecast_df = section_2_4_economic_df
        # to be updated with price and tax
        if self.backup_ownership_dict is not None:
            apply_backup_to_select_document(section_2_7_economic_df, section_index, self.backup_ownership_dict,
                                            ls_scenarios_id, scenario, self.scenarios_dic, property_id,
                                            self.ownership_data_list, self.compare_and_save_into_self_data_list,
                                            self.get_default_format, self.projects_dic)

        if not self.only_forecast:
            # ownership model extraction
            try:
                format_econ_assumptions(
                    section_2_7_economic_df,
                    header_cols,
                    ls_scenarios_id,
                    scenario,
                    property_id,
                    self.ownership.model_extraction,
                    section=[EconHeaderEnum.misc_section_key.value, EconHeaderEnum.own_section_key.value],
                    index=ownership_index_list)
            except Exception:
                message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.ownership.value)
                self.log_report.log_error(
                    message=message,
                    scenario=scenario,
                    well=property_id,
                    model=ErrorMsgEnum.ownership.value,
                    severity=ErrorMsgSeverityEnum.error.value,
                )

            # forecast model extraction
            try:
                format_econ_assumptions(
                    section_2_4_economic_df,
                    header_cols,
                    ls_scenarios_id,
                    scenario,
                    property_id,
                    self.forecast_stream_properties_model_extraction,
                    section=[EconHeaderEnum.misc_section_key.value, EconHeaderEnum.forecast_section_key.value],
                    index=forecast_index_list)
            except Exception:
                message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.forecast_stream.value)
                self.log_report.log_error(
                    message=message,
                    scenario=scenario,
                    well=property_id,
                    model=ErrorMsgEnum.forecast_stream.value,
                    severity=ErrorMsgSeverityEnum.error.value,
                )

            # price model extraction
            try:
                format_econ_assumptions(section_5_economic_df,
                                        header_cols,
                                        ls_scenarios_id,
                                        scenario,
                                        property_id,
                                        self.pricing.model_extraction,
                                        section=[EconHeaderEnum.price_section_key.value],
                                        ignore_check=True)
            except Exception:
                message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.price_diff.value)
                self.log_report.log_error(
                    message=message,
                    scenario=scenario,
                    well=property_id,
                    model=ErrorMsgEnum.price_diff.value,
                    severity=ErrorMsgSeverityEnum.error.value,
                )

            # tax & expense model extraction
            try:
                format_econ_assumptions(section_6_economic_df,
                                        header_cols,
                                        ls_scenarios_id,
                                        scenario,
                                        property_id,
                                        self.tax_expense.model_extraction,
                                        section=[EconHeaderEnum.tax_expense_section_key.value])
            except Exception:
                message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.tax_expense.value)
                self.log_report.log_error(
                    message=message,
                    scenario=scenario,
                    well=property_id,
                    model=ErrorMsgEnum.tax_expense.value,
                    severity=ErrorMsgSeverityEnum.error.value,
                )

            # capex model extraction
            try:
                format_econ_assumptions(section_8_economic_df,
                                        header_cols,
                                        ls_scenarios_id,
                                        scenario,
                                        property_id,
                                        self.capex.model_extraction,
                                        section=[EconHeaderEnum.capex_section_key.value],
                                        keyword_mark=['ABAN', 'PLUG', 'SALV'])
            except Exception:
                message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.capex.value)
                self.log_report.log_error(
                    message=message,
                    scenario=scenario,
                    well=property_id,
                    model=ErrorMsgEnum.capex.value,
                    severity=ErrorMsgSeverityEnum.error.value,
                )

            # overlay model extraction
            try:
                format_econ_assumptions(section_9_economic_df,
                                        header_cols,
                                        ls_scenarios_id,
                                        scenario,
                                        property_id,
                                        self.overlay.model_extraction,
                                        section=[9])
            except Exception:
                message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.overlay.value)
                self.log_report.log_error(
                    message=message,
                    scenario=scenario,
                    well=property_id,
                    model=ErrorMsgEnum.overlay.value,
                    severity=ErrorMsgSeverityEnum.error.value,
                )

            dataframe_transform.create_cc_document_from_elt_data(self, elt_data_dict, ls_scenarios_id, scenario,
                                                                 property_id)
        else:
            try:
                format_econ_assumptions(section_2_4_economic_df,
                                        header_cols,
                                        ls_scenarios_id,
                                        scenario,
                                        property_id,
                                        self.forecast_stream_properties_model_extraction,
                                        section=[EconHeaderEnum.forecast_section_key.value],
                                        index=forecast_index_list)
            except Exception:
                message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.forecast_stream.value)
                self.log_report.log_error(
                    message=message,
                    scenario=scenario,
                    well=property_id,
                    model=ErrorMsgEnum.forecast_stream.value,
                    severity=ErrorMsgSeverityEnum.error.value,
                )

    def regenerate_well_count_by_phase_obj_dict(self):
        self.well_count_by_phase_obj_dict = {'oil': [], 'gas': [], 'inj': []}
        self.default_well_count_for_major_phase = {'oil': False, 'gas': False}
        self.major_phase = None

    def read_start(self, ls_expression, propnum, scenario, error_model, section, is_list=False):  # noqa: C901
        '''
        input: expression (from START keyword, might include DELAY or backup date)
        expression ex: 10/2017,
                       8/2009 DELAY 3,
                       8/2009 DELAY -6,
                       9/1/2017 0:00,
                       9/1/2017 0:00 DELAY -6,
                       BP402332 10/2018,
                       BP402332 DELAY -2,
                       2017.30 DELAY -6
        output: 07/2017 or None

        note: perhaps need to fetch date defined from ENDDATE
        (the enddate will be save in self.enddate = {'BP402332' : '07/2017'})
        '''
        date = None

        # should always has zero index
        # if '/' exist, it's a date format
        try:
            if '/' in str(ls_expression[0]) or '-' in str(ls_expression[0]):
                date = pd.to_datetime(ls_expression[0], errors='coerce')
                if pd.isnull(date):
                    date = pd.to_datetime(datetime.datetime.strptime(str(ls_expression[0]), '%m/%y'))

            # need to reference from enddate
            else:
                # for 2017.30 decimal year
                if '.' in str(ls_expression[0]):
                    day, month, year = get_day_month_year_from_decimal_date(ls_expression[0])
                    date = pd.to_datetime(datetime.date(year, month, day))

                # for enddate reference
                if ls_expression[0] in self.enddate_dic:
                    if self.use_end_date:
                        date = pd.to_datetime(self.enddate_dic[ls_expression[0]], errors='coerce')
                    else:
                        self.log_report.log_error(aries_row=str_join(ls_expression),
                                                  message=ErrorMsgEnum.end_date_not_ini.value,
                                                  scenario=scenario,
                                                  well=propnum,
                                                  model=error_model,
                                                  severity=ErrorMsgSeverityEnum.error.value,
                                                  section=section)
                    if section == 4 and error_model == 'FORECAST/STREAM PROPERTIES MODEL':
                        self.start_linkage_needed += [(propnum, ls_expression[0])]
                else:
                    # search backup date
                    if '/' in str(ls_expression[1]) or '-' in str(ls_expression[1]):
                        date = pd.to_datetime(ls_expression[1])

                    if '.' in str(ls_expression[1]):
                        day, month, year = get_day_month_year_from_decimal_date(ls_expression[1])
                        date = pd.to_datetime(datetime.date(year, month, day))
        except Exception:
            self.log_report.log_error(aries_row=str_join(ls_expression),
                                      message=format_error_msg(ErrorMsgEnum.read_start_error_msg.value,
                                                               str_join(ls_expression)),
                                      scenario=scenario,
                                      well=propnum,
                                      model=error_model,
                                      severity=ErrorMsgSeverityEnum.error.value,
                                      section=section)

        # handle delay, the month is always positive, use abs(months)
        try:
            idx = ls_expression.index('DELAY')
            delay_month = abs(int(ls_expression[idx + 1]))
        except Exception:
            delay_month = None

        if delay_month and date is not None:
            date += pd.DateOffset(months=delay_month)

        if date is not None:
            try:
                base_date = convert_str_date_to_datetime_format(self.dates_1_base_date)
            except Exception:
                base_date = convert_str_date_to_datetime_format(DEFAULT_BASE_DATE)
            if pd.Timestamp(base_date) > pd.Timestamp(date) and not is_list:
                date = base_date
                date.strftime('%m/%Y')
            else:
                if not pd.isnull(date):
                    date = date.strftime('%m/%Y')
        date = format_start_date(date, self.dates_1_base_date)

        return date

    def update_custom_project_header_dict(self, lookup_criteria_data, property_id):
        """
            Update the dictionary of custom project headers aliases and well data with new information from the
            lookup_criteria_data parameter for the given property_id.

            Parameters:
                lookup_criteria_data (list): A list containing a list of dictionaries of lookup criteria data.
                property_id (str): The identifier of the property.

            Returns:
                None

            Raises:
                None
        """
        for table_data in lookup_criteria_data[0][:-1]:
            column_name, well_value = itemgetter('column_name', 'current')(table_data)
            if f'{column_name} (ARIES LU)' not in self.project_customer_header_alias:
                core = '_project_custom_header'
                n = len(self.project_customer_header_alias)
                if n == 0:
                    alias_name = core
                else:
                    alias_name = f'{core}_{n}'
                self.project_customer_header_alias[f'{column_name} (ARIES LU)'] = alias_name
            else:
                alias_name = self.project_customer_header_alias[f'{column_name} (ARIES LU)']

            well_id = self.wells_dic[property_id]['_id']
            if well_id in self.project_custom_header_well_data:
                self.project_custom_header_well_data[well_id][alias_name] = well_value
            else:
                self.project_custom_header_well_data[well_id] = {alias_name: well_value}

    def create_project_custom_header_ls(self):
        headers = []
        for label, name in self.project_customer_header_alias.items():
            headers.append({'_id': ObjectId(), 'name': name, 'headerType': {'type': 'multi-select'}, 'label': label})
        return [{
            '_id': ObjectId(),
            'project': self.project_id,
            'headers': headers,
            'createdAt': datetime.datetime.now(),
            'updatedAt': datetime.datetime.now(),
            '__v': 3
        }]

    def create_project_custom_header_data_ls(self):
        project_custom_header_data_ls = []
        for well_id, custom_header in self.project_custom_header_well_data.items():
            custom_header = {k: str(v).upper() for k, v in custom_header.items()}
            project_custom_header_data_ls.append({
                '_id': ObjectId(),
                'project': self.project_id,
                'well': well_id,
                'createdAt': datetime.datetime.now(),
                'updatedAt': datetime.datetime.now(),
                '__v': 0,
                'customHeaders': custom_header
            })
        return project_custom_header_data_ls

        # need to add this scenarios_default_document to all projects
        # the only different for each scenarios_default_document is _id
        # (create multilpe same scenarios for each project), project (to differernt proejct _id)

    def add_ecl_link(self, ls_scenarios_id, scenario_id):
        """Loop through list of wells needing start date linked to another well's ECL

        Args:
            scenario (_type_): Current scenario being processed
            ls_scenarios_id (_type_): List of scenarios being processed
            scenario_id: Mongo object of current scenario
        """
        for well_id, end_date_ref in self.start_linkage_needed:
            # get inputID matching to end_date_ref
            input_id, target_well_id = self.end_date_link.get(end_date_ref, ('', ''))
            if input_id == '':
                continue
            # get date doc for current well/scenario combo
            date_document = get_well_doc_overlay(self.dates_data_list, well_id, ls_scenarios_id)
            if date_document is None:
                continue
            # Replace well list with only the active well
            # deep copy not needed since get_well_doc_overlay returns deep copy already
            date_document['wells'] = {(scenario_id, well_id)}

            # store ecl link into date document and save model
            document_name = date_document[CCSchemaEnum.name.value].rsplit('_', 1)[0]
            date_document['econ_function']['dates_setting']['fpd_source_hierarchy']['first_fpd_source'] = {
                'link_to_wells_ecl': input_id,
                'link_to_wells_ecl_well_id': target_well_id
            }
            self.compare_and_save_into_self_data_list(date_document,
                                                      self.dates_data_list,
                                                      self.projects_dic,
                                                      model_name=document_name,
                                                      aries=True)
        # clear linkage needed list for next scenario
        self.start_linkage_needed = []

    @classmethod
    def convert_value_unit_to_percent(cls, value) -> Optional[int]:
        """Transforms the value input in a percentile equivalent

        Args:
            value: Value to be transformed

        Returns:
            The percentage equivalent of the input value
        """
        # == 0, means use backup value in Aries for this NRI calculation
        # here need to change to None since do not know the backup value hidden in Aries
        if value is None or value == 0:
            return None

        # <= 1, unit is FRAC, need to change to %
        if value <= 1:
            return value * 100

        return value

    # TODO: escalation
    def compare_escalation_and_save_into_self_data_list(self, document, ls):
        '''
        input: escalation document which need to determind if it is unique
        output: the unique escalation document whether it is from input or from self.escalation_data_list

        noted1: after compareing the escalation document if it is unique,
                before saving it into the self.escalation_data_list, give it a name, suchscalation_1
        noted2: need to times how many projects store in projects collection in the end
        '''
        repeat = False
        deepcopy_document = document.copy()
        deepcopy_document = self.delete_common_key_for_deep_compare(deepcopy_document)
        for exist_document in ls:
            deepcopy_exist_document = exist_document.copy()
            deepcopy_exist_document = self.delete_common_key_for_deep_compare(deepcopy_exist_document)
            if deepcopy_document == deepcopy_exist_document:
                exist_document['wells'].add(next(iter(document['wells'])))

                # return escalation document need to delete wells
                copy_exist_document = exist_document.copy()
                del copy_exist_document['wells']

                return copy_exist_document

        if not repeat:
            ls.append(document.copy())  # important to copy the document to avoid missing import some model!!!

            # return escalation document need to delete wells
            copy_document = document.copy()
            del copy_document['wells']

            return copy_document

    # TODO: escalation
    def escalation_data_list_times_number_of_project(self):
        '''
        produce multiple escalation model by number of project

        ex:
        if in escalation_data_list there are 35 document, in projects there are 3 projects
        then, need to produce 35 * 3 = 105 escalation documents

        note: also save the escalation original_id mapping to 1. project_id 2. model_id 3. model_name
        '''
        project_escalation_document_ls = []

        idx = 1

        for document in self.escalation_data_list:
            all_zero_escalation = False
            copy_document = document.copy()

            copy_document = add_options(copy_document)
            for _id in self.projects_dic:
                model_id = document['_id']
                document, all_zero_escalation = check_if_all_escalation_value_are_zeros(document,
                                                                                        None,
                                                                                        None,
                                                                                        escalation_naming=True)
                escalation_model_name = f'Escalation_{idx}' if not all_zero_escalation else ZERO_ESC
                self.escalation_project_id_map_to_model_id[f'{model_id}_{_id}'] = (_id, model_id, escalation_model_name)

                copy_document['_id'] = model_id
                copy_document['project'] = _id
                copy_document['name'] = escalation_model_name
                project_escalation_document_ls.append(copy_document.copy())
            if not all_zero_escalation:
                idx += 1

        self.escalation_data_list = project_escalation_document_ls

    # TODO: escalation
    def escalation_model_extraction(  # noqa
            self,
            ls_expression,
            start_date,
            keyword,
            scenario,
            ls_scenarios_id,
            property_id,
            cont,
            section,
            category=None):
        '''
        special process to handle escalation extraction for capex, price, taxes, expense
        output: unique_escalation_default_document
        '''
        def get_escalation_previous_segment_end_date(escalation_connection_key):

            prev_end_date = None
            try:
                segments = copy.deepcopy(self.escalation_segment_param[escalation_connection_key]['econ_function']
                                         ['escalation_model']['rows'])
            except KeyError:
                segments = []
            if len(segments) > 0:
                prev_end_date = segments[-1]['dates']['end_date']

            return prev_end_date

        def get_escalation_start_date_and_cutoff(start_date, ls_expression, property_id, scenario, keyword, cont,
                                                 category):
            '''
            if previous segment exist, use previous segment end_date + 1 as start_date
            if cutoff is volume unit, such as MU, MB, BBL, MCF...exist
            (need to get_forecast_sum_and_end_date_of_prev_segment_eur)
            if cutoff is date, need to calculate the end_date

            imu unit: oil is berrels, gas is mcf, water is berrels, other unit need to change to generic unit

            add start_date or imu or end_date to param_dic
            return: param_dic

            noted: current_mu - previous_mu = imu
            '''
            escalation_connection_key = (property_id, scenario, keyword, cont, category)
            initial = True
            prev_end_date = get_escalation_previous_segment_end_date(escalation_connection_key)
            # fill escalation gaps in row function available in helper

            # start_date handle
            escalation_param_dic = {'dates': {'start_date': None, "end_date": None}, 'segments': []}

            try:
                if prev_end_date:
                    initial = False
                    formated_prev_end_date = pd.to_datetime(prev_end_date, errors='coerce')
                    if not pd.isnull(formated_prev_end_date):
                        escalation_param_dic['dates']['start_date'] = (formated_prev_end_date
                                                                       + pd.DateOffset(days=1)).strftime('%Y-%m-%d')
                    else:
                        escalation_param_dic['dates']['start_date'] = pd.to_datetime(start_date).strftime('%Y-%m-%d')
                else:
                    escalation_param_dic['dates']['start_date'] = pd.to_datetime(start_date).strftime('%Y-%m-%d')

                ls_expression = check_for_inconsistent_date(ls_expression, keyword, self.log_report, scenario,
                                                            property_id, section)

                # date cutoff handle
                if ls_expression[4] == 'LIFE':
                    # end_date = prev_end_date + dates_1_life
                    segment_end_date = pd.to_datetime(start_date)
                    escalation_param_dic['dates']['end_date'] = 'Econ Limit'

                elif ls_expression[4] == 'MO' or ls_expression[4] == 'MOS':
                    # end_date = start_date + months
                    segment_end_date = pd.to_datetime(start_date)
                    day, month = get_day_month_from_decimal_date(ls_expression[3])
                    segment_end_date += pd.DateOffset(months=month, days=day)
                    segment_end_date += pd.DateOffset(days=-1)
                    escalation_param_dic['dates']['end_date'] = segment_end_date.strftime('%Y-%m-%d')

                elif ls_expression[4] == 'YR' or ls_expression[4] == 'YRS':
                    segment_end_date = pd.to_datetime(start_date)
                    day, month, year = get_day_month_year_from_decimal_date(ls_expression[3])
                    segment_end_date += pd.DateOffset(years=year, months=month, days=day)
                    segment_end_date += pd.DateOffset(days=-1)
                    escalation_param_dic['dates']['end_date'] = segment_end_date.strftime('%Y-%m-%d')

                elif ls_expression[4] in ['IMO', 'IMOS']:
                    segment_end_date = pd.to_datetime(escalation_param_dic['dates']['start_date'], errors='coerce')
                    if not pd.isnull(segment_end_date):
                        day, month = get_day_month_from_decimal_date(ls_expression[3])
                        segment_end_date += pd.DateOffset(months=month, days=day)
                        segment_end_date += pd.DateOffset(days=-1)
                        escalation_param_dic['dates']['end_date'] = segment_end_date.strftime('%Y-%m-%d')

                elif ls_expression[4] in ['IYR', 'IYRS']:
                    segment_end_date = pd.to_datetime(escalation_param_dic['dates']['start_date'], errors='coerce')
                    if not pd.isnull(segment_end_date):
                        segment_end_date = pd.to_datetime(escalation_param_dic['dates']['start_date'])
                        day, month, year = get_day_month_year_from_decimal_date(ls_expression[3])
                        segment_end_date += pd.DateOffset(years=year, months=month, days=day)
                        segment_end_date += pd.DateOffset(days=-1)
                        escalation_param_dic['dates']['end_date'] = segment_end_date.strftime('%Y-%m-%d')

                elif ls_expression[4] == 'AD':
                    # end_date = ad_date
                    segment_end_date = format_aries_segment_date(ls_expression[3], self.dates_1_base_date)
                    segment_end_date += pd.DateOffset(days=-1)
                    escalation_param_dic['dates']['end_date'] = segment_end_date.strftime('%Y-%m-%d')
                if cont == 'capex':
                    escalation_param_dic['dates']['end_date'] = 'Econ Limit'

            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.cut_off_date_error_msg.value,
                                                                   start_date),
                                          scenario=scenario,
                                          well=property_id,
                                          model=ErrorMsgEnum.escalation.value,
                                          section=section,
                                          severity=ErrorMsgSeverityEnum.error.value)
            return escalation_param_dic, initial

        row_key = None
        if start_date is None:
            return 'none'

        ###############################################
        # escalation model extraction
        ###############################################
        escalation_default_document = {
            "unique": False,
            "typeCurve": None,
            "wells": set(),
            "name": "",
            "project": "",
            "assumptionKey": "escalation",
            "assumptionName": "Escalation",
            "econ_function": {
                'escalation_model': {
                    'escalation_frequency': 'yearly',
                    'calculation_method': 'compound',
                    "rows": [{
                        "pct_per_year": 0,
                        "entire_well_life": "Entire Well Life"
                    }]
                }
            },
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
        }
        escalation_default_document['_id'] = ObjectId()

        ################################
        # escalation format filling
        ################################
        escalation_connection_key = (property_id, scenario, keyword, cont, category)
        # get escalation unit abd value from expression list
        try:
            escalation_unit = ls_expression[-2]
        except IndexError:
            escalation_unit = None
        try:
            escalation_value = aries_cc_round(float(ls_expression[-1]))
            escalation_value = update_spd_escalation_value(escalation_value, escalation_unit)
        except ValueError:
            escalation_value = None

        # normalize all units for chek if units are consistent (CC can only use on type of escalation setting per model)
        if escalation_unit == 'PC/M':
            append_escalation_unit = 'PC'
        elif escalation_unit in ['PE/M', 'SPD']:
            append_escalation_unit = 'PE'
        elif escalation_unit == '$E/M':
            append_escalation_unit = '$E'
        else:
            append_escalation_unit = escalation_unit

        # get calculation and frequency from unit
        calculation_model = ESCALATION_UNIT_DICT.get(escalation_unit)
        if calculation_model is not None:
            calculation, model = calculation_model
        else:
            calculation, model = None, None
        # check if escalation unit is consistent (for non capex and non custom escalation)
        if cont != 'capex' and ls_expression[-1] not in self.custom_escalation:
            # self.escalation_unit_dic stores the unit used for each escalation model defined in ARIES
            # if the unit is not consistent, the escalation model will be ignored
            if escalation_connection_key in self.escalation_unit_dic:
                if append_escalation_unit not in self.escalation_unit_dic[escalation_connection_key]:
                    if escalation_connection_key in self.escalation_segment_param:
                        escalation_doc_check = self.escalation_segment_param[escalation_connection_key]
                        if model is not None and calculation is not None:
                            escalation_doc_check, all_zeros = check_if_all_escalation_value_are_zeros(
                                escalation_doc_check, model, calculation)
                            if not all_zeros:
                                used_model = escalation_doc_check['econ_function']['escalation_model'][
                                    'escalation_frequency']
                                used_calculation = escalation_doc_check['econ_function']['escalation_model'][
                                    'calculation_method']
                                escalation_value, calculation, model = 0, used_calculation, used_model
                        else:
                            escalation_value, calculation, model = 0, 'compound', 'yearly'
                        rows = escalation_doc_check['econ_function']['escalation_model']['rows']
                        row_key = next(key for key in rows[-1] if 'per_year' in key)
                    else:
                        return 'none'
            else:
                if escalation_unit not in ESCALATION_UNIT_DICT:
                    if escalation_connection_key in self.escalation_segment_param:
                        escalation_doc_check = self.escalation_segment_param[escalation_connection_key]
                        if model is not None and calculation is not None:
                            escalation_doc_check, all_zeros = check_if_all_escalation_value_are_zeros(
                                escalation_doc_check, model, calculation)
                            if not all_zeros:
                                used_model = escalation_doc_check['econ_function']['escalation_model'][
                                    'escalation_frequency']
                                used_calculation = escalation_doc_check['econ_function']['escalation_model'][
                                    'calculation_method']
                                escalation_value, calculation, model = 0, used_calculation, used_model
                        else:
                            escalation_value, calculation, model = 0, 'compound', 'yearly'
                        rows = escalation_doc_check['econ_function']['escalation_model']['rows']
                        row_key = next(key for key in rows[-1] if 'per_year' in key)
                    else:
                        return 'none'
                self.escalation_unit_dic[escalation_connection_key] = [append_escalation_unit]

        # set escalation obj to None
        escalation_obj = None
        # if calculation, model and escalation_value has been extracted, process escalation_obj
        if calculation is not None and model is not None and escalation_value is not None:
            escalation_obj = {CCSchemaEnum.dates.value: copy.deepcopy(DEFAULT_ESCALATION_DATES), "pct_per_year": 0}
            segment_dic, initial = get_escalation_start_date_and_cutoff(start_date, ls_expression, property_id,
                                                                        scenario, keyword, cont, category)
            segment_start_date = segment_dic['dates']['start_date']
            segment_end_date = segment_dic['dates']['end_date']
            if cont == 'capex':
                segment_start_date = pd.to_datetime(start_date).strftime('%Y-%m-%d')
                segment_end_date = 'Econ Limit'
            if segment_start_date is None:
                segment_start_date = pd.to_datetime(start_date).strftime('%Y-%m-%d')
            if segment_end_date is None:
                segment_end_date = 'Econ Limit'
            escalation_obj['dates']['start_date'] = segment_start_date
            escalation_obj['dates']['end_date'] = segment_end_date
            if row_key is None:
                if calculation != 'constant':
                    escalation_obj['pct_per_year'] = escalation_value
                else:
                    del escalation_obj['pct_per_year']
                    escalation_obj['dollar_per_year'] = escalation_value
            else:
                del escalation_obj['pct_per_year']
                escalation_obj[row_key] = escalation_value
        elif escalation_unit == UnitEnum.escalation.value and ls_expression[-1] in self.custom_escalation:
            escalation_doc = self.custom_escalation.get(ls_expression[-1])
            segment_dic, initial = get_escalation_start_date_and_cutoff(start_date, ls_expression, property_id,
                                                                        scenario, keyword, cont, category)
            # get start and end date of segment
            segment_start_date = segment_dic['dates']['start_date']
            segment_end_date = segment_dic['dates']['end_date']
            # process the custom escalation into list of escalation objects
            escalation_obj = process_custom_escalation_doc_into_esclation_obj(escalation_doc,
                                                                              segment_start_date,
                                                                              segment_end_date,
                                                                              start=initial)
            # get calculation_type and frequency from custom escalation doc
            calculation_model = CUSTOM_ESCALATION_UNIT_DICT.get(
                (escalation_doc.get('rate'), escalation_doc.get('calc_type')))
            if calculation_model is not None:
                calculation, model = calculation_model
            else:
                calculation, model = None, None

        if escalation_obj is not None:
            # check if previous segment exist and extract that document if it does
            # if it doesn't, fill in the escalation default document with extracted parameters
            key_index = 1
            if escalation_connection_key in self.escalation_segment_param and cont != 'capex':
                escalation_document = self.escalation_segment_param[escalation_connection_key]
                # if escalation_obj type is a list (meaning custom escalation), loop and append
                if type(escalation_obj) == list:
                    # check if calculation, model has been extracted
                    esc_key = next(key for key in escalation_document['econ_function']['escalation_model']['rows'][-1]
                                   if 'per_year' in key)
                    if calculation is not None and model is not None:
                        # get current frequency and calculation method
                        existing_model = escalation_document['econ_function']['escalation_model'][
                            'escalation_frequency']
                        existing_calc = escalation_document['econ_function']['escalation_model']['calculation_method']
                        escalation_document, all_zeros = check_if_all_escalation_value_are_zeros(
                            escalation_document, model, calculation)
                        # check if existing model and calculation matches or if all previous escalation is zero
                        if ((existing_model == model and existing_calc == calculation) or all_zeros) \
                                and len(escalation_obj) != 0:
                            key_index = len(escalation_obj)
                            for obj in escalation_obj:
                                escalation_document['econ_function']['escalation_model']['rows'].append(obj)
                            self.escalation_unit_dic[escalation_connection_key] = [
                                CALC_MODEL_TO_ARIES_SYNTAX.get((calculation, model))
                            ]
                        else:
                            # if no match is gotten create zero escalation to fill it in
                            if esc_key is not None:
                                escalation_obj = {
                                    CCSchemaEnum.dates.value: copy.deepcopy(DEFAULT_ESCALATION_DATES),
                                    esc_key: 0
                                }
                                escalation_obj['dates']['start_date'] = segment_start_date
                                escalation_obj['dates']['end_date'] = segment_end_date
                                escalation_document['econ_function']['escalation_model']['rows'].append(escalation_obj)
                                key_index = 1
                            else:
                                return 'none'
                    else:
                        if esc_key is not None:
                            escalation_obj = {
                                CCSchemaEnum.dates.value: copy.deepcopy(DEFAULT_ESCALATION_DATES),
                                esc_key: 0
                            }
                            escalation_obj['dates']['start_date'] = segment_start_date
                            escalation_obj['dates']['end_date'] = segment_end_date
                            escalation_document['econ_function']['escalation_model']['rows'].append(escalation_obj)
                            key_index = 1
                        else:
                            return 'none'

                else:
                    escalation_document['econ_function']['escalation_model']['rows'].append(escalation_obj)
            else:
                if type(escalation_obj) == list:
                    if calculation is not None and model is not None:
                        key_index = len(escalation_obj)
                        if len(escalation_obj) == 0:
                            escalation_obj = [{
                                CCSchemaEnum.dates.value: copy.deepcopy(DEFAULT_ESCALATION_DATES),
                                'pct_per_year': 0
                            }]
                            key_index = 1
                        for obj in escalation_obj:
                            escalation_default_document['econ_function']['escalation_model']['rows'].append(obj)
                        self.escalation_unit_dic[escalation_connection_key] = [
                            CALC_MODEL_TO_ARIES_SYNTAX.get((calculation, model))
                        ]
                else:
                    escalation_default_document['econ_function']['escalation_model']['rows'].append(escalation_obj)
                escalation_default_document['econ_function']['escalation_model']['rows'].pop(0)
                escalation_default_document['econ_function']['escalation_model']['escalation_frequency'] = model
                escalation_default_document['econ_function']['escalation_model']['calculation_method'] = calculation

                self.escalation_segment_param[escalation_connection_key] = escalation_default_document

            escalation_model_document = copy.deepcopy(self.escalation_segment_param[escalation_connection_key])
            escalation_model_document['econ_function']['escalation_model']['rows'] = escalation_model_document[
                'econ_function']['escalation_model']['rows'][-key_index:]
            if cont == 'capex':
                escalation_model_document[CCSchemaEnum.created.value] = datetime.datetime.now()
                escalation_model_document[CCSchemaEnum.updated.value] = datetime.datetime.now()
                escalation_model_document, capex_all_zeros = check_if_all_escalation_value_are_zeros(
                    escalation_model_document, None, None, escalation_naming=True)
                if capex_all_zeros:
                    escalation_model_document[EconEnum.econ_function.value] = FLAT_ESCALATION_ECON_FUNC
                for _id in ls_scenarios_id:
                    if self.scenarios_dic[_id][CCSchemaEnum.name.value] == scenario:
                        escalation_model_document[CCSchemaEnum.wells.value].add((_id, property_id))
                    unique_escalation_model_document = self.compare_escalation_and_save_into_self_data_list(
                        escalation_model_document, self.escalation_data_list)
                return unique_escalation_model_document

            return escalation_model_document
        else:
            return 'none'

    # TODO: economic
    def forecast_stream_properties_model_extraction(  # noqa: C901
            self, section_economic_df, header_cols, ls_scenarios_id, scenario, property_id, index, elt=False):
        '''
        input: section 4 df with START keyword
        extract: tax, expense, escalation
        '''
        start_date = pd.to_datetime(self.dates_1_base_date).strftime('%m/%Y')

        ##################################
        # stream_properties format filling
        ##################################
        stream_properties_default_document = self.get_default_format('stream_properties')

        use_stream_properties_model = False

        ##################################
        # risking format filling
        ##################################
        risking_default_document = self.get_default_format('risking')

        use_fpd, use_asof, use_shrink = False, False, False
        repeated_forecast_keyword = {}  # only count OIL, GAS, WTR
        life_dict = {}

        check_rate_forecast_dict = {
            'oil_rate_forecast': False,
            'gas_rate_forecast': False,
            'water_rate_forecast': False
        }
        risk_model_name = ''
        stream_model_name = ''

        well_keyword_processed = False
        propnum_index, expression_index, keyword_mark_index, section_index = get_header_index([
            EconHeaderEnum.propnum.value, EconHeaderEnum.expression.value, EconHeaderEnum.keyword.value,
            EconHeaderEnum.section.value
        ], header_cols)

        qualifier_index, original_keyword_index = get_header_index(
            [EconHeaderEnum.qualifier.value, EconHeaderEnum.initial_keyword.value], header_cols)
        preceeding_keywords = set()

        self.total_prev_mu_dict = {PhaseEnum.oil.value: 0, PhaseEnum.gas.value: 0, PhaseEnum.water.value: 0}
        section_economic_df = process_wells_wls_stream_lines(section_economic_df, keyword_mark_index)
        self.segment_qend = None
        for i in range(section_economic_df.shape[0]):
            # use qualifier as forecastname
            propnum, keyword, section, expression, qualifier, original_keyword = extract_df_row_value(
                i, [
                    propnum_index, keyword_mark_index, section_index, expression_index, qualifier_index,
                    original_keyword_index
                ], section_economic_df)
            if str(keyword).strip().upper() == 'TEXT':
                continue
            try:
                try:
                    ls_expression = [
                        fetch_value(string, property_id, self.at_symbol_mapping_dic, self.CUSTOM_TABLE_dict)
                        for string in expression.strip().split()
                    ]
                except Exception:
                    self.log_report.log_error(aries_row=expression,
                                              message=ErrorMsgEnum.fetch_value_error_msg.value,
                                              scenario=scenario,
                                              well=property_id,
                                              model=ErrorMsgEnum.forecast_stream.value,
                                              severity=ErrorMsgSeverityEnum.error.value)

                # only import 1st continuous segments of GAS, OIL, WTR, if it's a new start, just skip
                forecast_repitition_identified = identify_keyword_repitition(keyword, original_keyword, index[i],
                                                                             repeated_forecast_keyword)

                if forecast_repitition_identified:
                    continue

                if keyword.startswith('*') or keyword == 'TEXT':
                    continue

                # ignore default lines for list method
                if len(ls_expression) > 0 and '#' not in str(ls_expression[-1]):
                    try:
                        ls_expression = check_for_default_lines(ls_expression, keyword, self.common_default_lines)
                    except Exception:
                        self.log_report.log_error(aries_row=str_join(ls_expression),
                                                  message=format_error_msg(ErrorMsgEnum.class3_msg.value,
                                                                           ErrorMsgEnum.default_lines.value),
                                                  scenario=scenario,
                                                  well=property_id,
                                                  model=ErrorMsgEnum.forecast_stream.value,
                                                  section=section,
                                                  severity=ErrorMsgSeverityEnum.error.value)
                if keyword == 'SHRINK':
                    use_shrink = True
                ls_expression = check_for_null_values_in_expression(ls_expression, use_shrink)

                keyword, ls_expression = handle_forecast_overlay_ratio(keyword, ls_expression)
                if keyword == 'START':
                    # START format could be 7/2017, 7/23/2017, 2017.25, 7/23/2017 0:00
                    # (2017.25 need to special handle if . exist in START)
                    # update the start_date = 07/2017, 07/2017, 03/2017, 07/2017
                    start_date = self.read_start(ls_expression, propnum, scenario, ErrorMsgEnum.forecast_stream.value,
                                                 section)
                    if start_date is None:
                        start_date = pd.to_datetime(self.dates_1_base_date).strftime('%m/%Y')
                    use_fpd, use_asof = check_if_use_fpd_asof(start_date, self.wells_dic, self.as_of_date, property_id)

                # handle for CUMS will be implemented in the future does not have any effect on forecast except when
                # forecast depends on cumulative value

                elif keyword == 'CUMS':
                    get_cums_value(ls_expression, self.total_prev_mu_dict)
                elif keyword == 'ENDDATE':
                    # create dict link between given ECL ID and a well
                    end_date_ref = (self.wells_dic[propnum]['inptID'], self.wells_dic[propnum]['_id'])
                    self.end_date_link[ls_expression[0]] = end_date_ref
                elif EconEnum.curtail_per.value in keyword:
                    self.log_report.log_error(aries_row=str_join(ls_expression),
                                              message=ErrorMsgEnum.curtailment_error_msg.value,
                                              scenario=scenario,
                                              well=property_id,
                                              model=ErrorMsgEnum.forecast_stream.value,
                                              section=section,
                                              severity=ErrorMsgSeverityEnum.error.value)
                    continue

                elif keyword == 'LIFE':
                    life_dict = update_well_life_dict(ls_expression, life_dict)

                elif keyword == 'BTU':
                    # btu (stream_properties)
                    try:
                        use_stream_properties_model = True
                        btu = eval(str(ls_expression[0]))
                        if btu < 2:
                            btu *= 1000
                        stream_properties_default_document['econ_function']['btu_content'][
                            'unshrunk_gas'] = aries_cc_round(btu)
                        stream_properties_default_document['econ_function']['btu_content'][
                            'shrunk_gas'] = aries_cc_round(btu)
                        stream_model_name = get_model_name_from_qualifiers(keyword, qualifier, stream_model_name,
                                                                           stream_properties_default_document)
                    except Exception:
                        use_stream_properties_model = False
                        message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.btu.value,
                                                   str_join(ls_expression))
                        self.log_report.log_error(aries_row=str_join(ls_expression),
                                                  message=message,
                                                  scenario=scenario,
                                                  well=property_id,
                                                  model=ErrorMsgEnum.forecast_stream.value,
                                                  section=section,
                                                  severity=ErrorMsgSeverityEnum.error.value)
                elif keyword == 'SHRINK':
                    # shrinkage (stream_properties)
                    try:
                        value = eval(str(ls_expression[0]))
                        shrinkage = value * 100
                    except Exception:
                        shrinkage = 100
                        self.log_report.log_error(aries_row=str_join(ls_expression),
                                                  message=ErrorMsgEnum.null_shrink.value,
                                                  scenario=scenario,
                                                  well=property_id,
                                                  model=ErrorMsgEnum.forecast_stream.value,
                                                  section=section,
                                                  severity=ErrorMsgSeverityEnum.warn.value)
                    shrink_key = get_valid_shrink_key(stream_properties_default_document, PhaseEnum.gas.value)
                    if shrink_key is not None:
                        if shrink_key == 'shrinkage':
                            stream_properties_default_document['econ_function']['shrinkage']['gas']['rows'][0][
                                'pct_remaining'] = aries_cc_round(shrinkage)
                        else:
                            stream_properties_default_document['econ_function']['loss_flare'][shrink_key]['rows'][0][
                                'pct_remaining'] = aries_cc_round(shrinkage)
                        self.shrink = shrinkage / 100
                        use_stream_properties_model = True
                        stream_model_name = get_model_name_from_qualifiers(keyword, qualifier, stream_model_name,
                                                                           stream_properties_default_document)
                    else:
                        self.log_report.log_error(aries_row=str_join(ls_expression),
                                                  message=ErrorMsgEnum.shrink_message.value,
                                                  scenario=scenario,
                                                  well=property_id,
                                                  model=ErrorMsgEnum.forecast_stream.value,
                                                  section=section,
                                                  severity=ErrorMsgSeverityEnum.error.value)

                elif keyword == 'SHK/GAS' or clean_overlay_keyword(keyword) in SHRINKAGE_PHASE_DICT:
                    try:
                        extract_yield_properties(start_date,
                                                 ls_expression,
                                                 keyword,
                                                 propnum,
                                                 stream_properties_default_document,
                                                 scenario,
                                                 section,
                                                 self.log_report,
                                                 use_fpd,
                                                 use_asof,
                                                 shrink=True)
                        use_stream_properties_model = True
                        stream_model_name = get_model_name_from_qualifiers(keyword, qualifier, stream_model_name,
                                                                           stream_properties_default_document)
                    except Exception:
                        self.log_report.log_error(aries_row=str_join(ls_expression),
                                                  message=format_error_msg(ErrorMsgEnum.class6_msg.value,
                                                                           ErrorMsgEnum.shrink.value,
                                                                           str_join(ls_expression)),
                                                  scenario=scenario,
                                                  well=property_id,
                                                  model=ErrorMsgEnum.forecast_stream.value,
                                                  section=section,
                                                  severity=ErrorMsgSeverityEnum.error.value)

                elif keyword == 'WELLS':
                    rows = risking_default_document[EconEnum.econ_function.value]['risking_model']['well_stream'][
                        EconEnum.rows.value]
                    process_well_stream_cut_off_expression(rows,
                                                           original_keyword,
                                                           ls_expression,
                                                           start_date,
                                                           self.well_count_by_phase_obj_dict,
                                                           wells_keyword=True)
                    well_keyword_processed = True
                    risk_model_name = get_model_name_from_qualifiers(keyword, qualifier, risk_model_name,
                                                                     risking_default_document)

                elif 'WLS/' in keyword:
                    phase = str(keyword.split('/')[-1]).lower()
                    if phase in self.well_count_by_phase_obj_dict:
                        rows = risking_default_document[EconEnum.econ_function.value]['risking_model']['well_stream'][
                            EconEnum.rows.value]
                        if '#' in ls_expression[-1]:
                            process_risking_list_method_expression(
                                self,
                                rows,
                                start_date,
                                original_keyword,
                                ls_expression,
                                propnum,
                                scenario,
                                section,
                                well_count_doc=self.well_count_by_phase_obj_dict[phase])

                        else:
                            process_well_stream_cut_off_expression(rows, original_keyword, ls_expression, start_date,
                                                                   self.well_count_by_phase_obj_dict[phase])

                        risk_model_name = get_model_name_from_qualifiers(keyword, qualifier, risk_model_name,
                                                                         risking_default_document)

                elif 'MUL' in keyword or str(keyword).strip() in ['XINVWT', 'WEIGHT']:
                    # risking (stream_properties)
                    # need to handle multilple segments in future
                    try:
                        if '#' in ls_expression[-1]:
                            phase = ARIES_PHASE_KEYWORD_TO_CC_DICT.get(str(keyword.split('/')[-1]).upper())
                            if phase is None:
                                phase = overlay_phase_dic.get(keyword)
                            if phase is None:
                                continue
                            rows = risking_default_document[EconEnum.econ_function.value]['risking_model'][phase][
                                EconEnum.rows.value]
                            process_risking_list_method_expression(self, rows, start_date, original_keyword,
                                                                   ls_expression, propnum, scenario, section)
                        else:
                            if 'MUL' in keyword:
                                ls_expression = auto_fill_ratio_lines(
                                    ls_expression, filler=['0', 'X', 'FRAC', 'TO', 'LIFE', 'PC', '0'])
                            extract_yield_properties(start_date,
                                                     ls_expression,
                                                     keyword,
                                                     propnum,
                                                     risking_default_document,
                                                     scenario,
                                                     section,
                                                     self.log_report,
                                                     use_fpd,
                                                     use_asof,
                                                     risk=True)
                        risk_model_name = get_model_name_from_qualifiers(keyword, qualifier, risk_model_name,
                                                                         risking_default_document)
                    except Exception:
                        self.log_report.log_error(aries_row=str_join(ls_expression),
                                                  message=format_error_msg(ErrorMsgEnum.class6_msg.value,
                                                                           ErrorMsgEnum.multiplier.value,
                                                                           str_join(ls_expression)),
                                                  scenario=scenario,
                                                  well=property_id,
                                                  model=ErrorMsgEnum.forecast_stream.value,
                                                  section=section,
                                                  severity=ErrorMsgSeverityEnum.error.value)

                elif keyword == 'NGL/GAS' or keyword == 'CND/GAS':
                    if 'GAS' not in preceeding_keywords:
                        continue
                    # yields (stream_properties)
                    # need to handle multilple segments
                    if '#' in ls_expression[-1]:
                        continue

                    ls_expression = auto_fill_ratio_lines(ls_expression)
                    try:
                        if PhaseEnum.aries_condensate.value in keyword.lower():
                            condensate = True
                        else:
                            condensate = False
                        extract_yield_properties(start_date,
                                                 ls_expression,
                                                 keyword,
                                                 propnum,
                                                 stream_properties_default_document,
                                                 scenario,
                                                 section,
                                                 self.log_report,
                                                 use_fpd,
                                                 use_asof,
                                                 condensate=condensate)
                        use_stream_properties_model = True
                        stream_model_name = get_model_name_from_qualifiers(keyword, qualifier, stream_model_name,
                                                                           stream_properties_default_document)
                    except Exception:
                        self.log_report.log_error(aries_row=str_join(ls_expression),
                                                  message=format_error_msg(ErrorMsgEnum.class6_msg.value,
                                                                           ErrorMsgEnum.yield_.value,
                                                                           str_join(ls_expression)),
                                                  scenario=scenario,
                                                  well=property_id,
                                                  model=ErrorMsgEnum.forecast_stream.value,
                                                  section=section,
                                                  severity=ErrorMsgSeverityEnum.error.value)
                elif '/' in keyword:
                    ratio_to_rate = process_ratio_forecast_keyword(self,
                                                                   keyword,
                                                                   propnum,
                                                                   scenario,
                                                                   ls_expression,
                                                                   start_date,
                                                                   qualifier,
                                                                   section,
                                                                   ls_scenarios_id,
                                                                   check_rate_forecast_dict,
                                                                   preceeding_keywords=preceeding_keywords)

                    if ratio_to_rate:
                        continue

                else:
                    # forecast
                    process_rate_forecast_keyword(self,
                                                  keyword,
                                                  ls_expression,
                                                  start_date,
                                                  propnum,
                                                  scenario,
                                                  qualifier,
                                                  section,
                                                  ls_scenarios_id,
                                                  check_rate_forecast_dict,
                                                  preceeding_keywords=preceeding_keywords)
                    preceeding_keywords.add(keyword)

            except Exception:
                message = format_error_msg(ErrorMsgEnum.class8_msg.value, ErrorMsgEnum.forecast_stream_param.value,
                                           keyword)
                self.log_report.log_error(message=message,
                                          scenario=scenario,
                                          well=property_id,
                                          model=ErrorMsgEnum.forecast_stream.value,
                                          section=section,
                                          severity=ErrorMsgSeverityEnum.error.value)

        major_phase = get_major_phase(section_economic_df, self.forecast_df, keyword_mark_index, expression_index,
                                      property_id, self.at_symbol_mapping_dic, self.CUSTOM_TABLE_dict, self.log_report)

        major_phase = merge_phase_ac_property_and_economic(major_phase, property_id, scenario, self.wells_dic,
                                                           self.log_report)
        self.major_phase = major_phase

        if life_dict and not self.only_forecast:
            update_param_document_based_on_life_cutoff(life_dict, section_economic_df, major_phase, property_id,
                                                       scenario, ls_scenarios_id, self.wells_dic, self.scenarios_dic,
                                                       self.projects_dic, self.dates_1_base_date, self.dates_data_list,
                                                       self.forecast_datas_dic,
                                                       self.compare_and_save_into_self_data_list,
                                                       self.get_default_format, self.log_report)

        if not self.only_forecast:
            update_life_from_major_phase(section_economic_df, major_phase, self.as_of_date, property_id, scenario,
                                         self.scenarios_dic, ls_scenarios_id, self.dates_data_list,
                                         self.forecast_datas_dic, self.projects_dic,
                                         self.compare_and_save_into_self_data_list)

        try:
            risking_default_document = update_well_count_document_with_major_phase_well(
                self, risking_default_document, major_phase, well_keyword_processed)
            risking_default_document = check_if_more_than_one_element(risking_default_document,
                                                                      self.add_zero_to_end_of_row)

            risking_default_document = combine_risking_rows(risking_default_document)
            for _id in ls_scenarios_id:
                if self.scenarios_dic[_id]['name'] == scenario:
                    risking_default_document['wells'].add((_id, property_id))

            risking_default_document['createdAt'] = datetime.datetime.now()
            risking_default_document['updatedAt'] = datetime.datetime.now()
            risk_model_name = (risk_model_name if risk_model_name != '' else
                               f'ARIES_CC_{risking_default_document[CCSchemaEnum.assumption_key.value].upper()}')
            risking_default_document = set_risk_start_date_to_base_date(risking_default_document,
                                                                        self.dates_1_base_date)
            self.compare_and_save_into_self_data_list(risking_default_document,
                                                      self.risking_data_list,
                                                      self.projects_dic,
                                                      model_name=risk_model_name,
                                                      aries=True)
        except Exception:
            message = format_error_msg(ErrorMsgEnum.class7_msg.value, ErrorMsgEnum.risk.value)
            self.log_report.log_error(message=message,
                                      scenario=scenario,
                                      well=property_id,
                                      model=ErrorMsgEnum.risk.value,
                                      section=section,
                                      severity=ErrorMsgSeverityEnum.error.value)

        if use_stream_properties_model:
            # remove the first obj in ngl yields
            if len(stream_properties_default_document['econ_function']['yields']['ngl']['rows']) > 1:
                stream_properties_default_document['econ_function']['yields']['ngl']['rows'].pop(0)
                stream_properties_default_document = combine_ngl_yield_rows(stream_properties_default_document)
            if len(stream_properties_default_document['econ_function']['yields']['drip_condensate']['rows']) > 1:
                stream_properties_default_document['econ_function']['yields']['drip_condensate']['rows'].pop(0)
                stream_properties_default_document = combine_ngl_yield_rows(stream_properties_default_document,
                                                                            condensate=True)
            if len(stream_properties_default_document['econ_function']['shrinkage']['gas']['rows']) > 1:
                stream_properties_default_document['econ_function']['shrinkage']['gas']['rows'].pop(0)

            if len(stream_properties_default_document['econ_function']['shrinkage']['oil']['rows']) > 1:
                stream_properties_default_document['econ_function']['shrinkage']['oil']['rows'].pop(0)

            if len(stream_properties_default_document['econ_function']['loss_flare']['oil_loss']['rows']) > 1:
                stream_properties_default_document['econ_function']['loss_flare']['oil_loss']['rows'].pop(0)

            if len(stream_properties_default_document['econ_function']['loss_flare']['gas_loss']['rows']) > 1:
                stream_properties_default_document['econ_function']['loss_flare']['gas_loss']['rows'].pop(0)

            if len(stream_properties_default_document['econ_function']['loss_flare']['gas_flare']['rows']) > 1:
                stream_properties_default_document['econ_function']['loss_flare']['gas_flare']['rows'].pop(0)

            for _id in ls_scenarios_id:
                if self.scenarios_dic[_id]['name'] == scenario:
                    stream_properties_default_document['wells'].add((_id, property_id))

            stream_properties_default_document['createdAt'] = datetime.datetime.now()
            stream_properties_default_document['updatedAt'] = datetime.datetime.now()
            stream_model_name = (
                stream_model_name if stream_model_name != '' else
                f'ARIES_CC_{stream_properties_default_document[CCSchemaEnum.assumption_key.value].upper()}')
            self.compare_and_save_into_self_data_list(stream_properties_default_document,
                                                      self.stream_properties_data_list,
                                                      self.projects_dic,
                                                      model_name=stream_model_name,
                                                      aries=True)

    def check_if_well_exist(self, propnum):
        '''
        Checks if a well propnum exists as key in well db and returns True if it does and False if not
        Inputs (str): Well Aries id
        Output (bool)
        '''
        # TODO: return propnum in self.wells_dic
        well_exist = True
        well_doc = self.wells_dic.get(str(propnum))
        if not well_doc:
            well_exist = False
        return well_exist

    def batch_well_import_process(self, selected_df):
        json_str = selected_df.to_json(orient='records')
        data_list = json.loads(json_str)
        if len(data_list) == 0:
            return
        document = data_list[-1]
        document = format_well_header_document(document, self.project_id,
                                               self.dictionary_format_conversion_get_default_format)
        self.well_import_list.append(document)
        self.well_count -= 1
        limit_reached = check_batch_limit(self.well_count, self.well_import_list)
        if limit_reached:
            data_settings = DataSettings('aries', self.project_id)
            import_data = AriesImportData(self.well_import_list, self.well_monthly_data, self.well_daily_data,
                                          data_settings)

            try:
                import_detail, _ = self.context.import_service.upsert_wells(import_data,
                                                                            replace_production=False,
                                                                            operation='upsert')
            except Exception:
                message = ("Could not import well header")
                self.log_report.log_error(message=message, well=document['aries_id'], severity='warning')
            update_wells_dic_and_major_product(self.wells_dic, self.well_major, self.well_import_list, import_detail)

            build_prod_data_list(self.well_monthly_data, self.create_monthly_format_via_ls, self.well_months_data_list,
                                 self.well_import_list)
            build_prod_data_list(self.well_daily_data, self.create_daily_format_via_ls, self.well_days_data_list,
                                 self.well_import_list)
            self.well_import_list = []

    # TODO: utils
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
        except KeyError:
            return document

    # TODO: utils
    def dictionary_format_conversion_get_default_format(self, document, collection_name):
        # get default format
        default_document = self.get_default_format(collection_name)
        # fill in the deault format from document
        if collection_name == 'ownership':
            pass

        if collection_name == 'wells':
            document = self.convert_datetime_string_to_object(document, 'first_prod_date')
            document = self.convert_datetime_string_to_object(document, 'end_prod_date')
            document = self.convert_datetime_string_to_object(document, 'spud_date')
            document = self.convert_datetime_string_to_object(document, 'completion_start_date')
            document = self.convert_datetime_string_to_object(document, 'completion_end_date')
            document = self.convert_datetime_string_to_object(document, 'gas_analysis_date')
            # add document information to default_document
            for key in document:
                default_document[key] = document[key]

            default_document['project'] = self.project_id
            default_document['dataSource'] = 'aries'

            default_document['chosenID'] = default_document['aries_id']
            default_document['chosenKeyID'] = 'PROPNUM'

            del default_document['surface_longitude_wgs84']
            del default_document['surface_latitude_wgs84']

            default_document['createdAt'] = datetime.datetime.now()
            default_document['updatedAt'] = datetime.datetime.now()

        if collection_name == 'price':
            pass

        if collection_name == 'general_options':
            pass

        if collection_name == 'capex':
            pass

        if collection_name == 'tax':
            pass

        if collection_name == 'expense':
            pass

        if collection_name == 'stream_properties':
            pass

        return default_document

    # TODO: Unused method
    def dictionary_format_conversionn_add_to_format_document(self, document, collection_name, filled_default_document):
        # fill in the existed format document
        if collection_name == 'ownership':
            pass

        if collection_name == 'wells':
            document = self.convert_datetime_string_to_object(document, 'first_prod_date')
            document = self.convert_datetime_string_to_object(document, 'end_prod_date')
            document = self.convert_datetime_string_to_object(document, 'spud_date')
            document = self.convert_datetime_string_to_object(document, 'completion_start_date')
            document = self.convert_datetime_string_to_object(document, 'completion_end_date')
            document = self.convert_datetime_string_to_object(document, 'gas_analysis_date')
            # update document information to filled_default_document
            for key in document:
                filled_default_document[key] = document[key]

            filled_default_document['project'] = self.project_id

            del filled_default_document['surface_longitude_wgs84']
            del filled_default_document['surface_latitude_wgs84']

            # filled_default_document['createdAt'] = datetime.datetime.now()
            filled_default_document['updatedAt'] = datetime.datetime.now()

        if collection_name == 'price':
            pass

        if collection_name == 'capex':
            pass

        if collection_name == 'tax':
            pass

        if collection_name == 'expense':
            pass

        if collection_name == 'stream_properties':
            pass

        return filled_default_document

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

        special note: if model_name is forecast_data,
                      will also create well-forecasts collection to record 1 well have how many forecast version

        """
        def get_qualifier_key(model_document, model_name):
            if model_name == 'differentials' and model_document.get('orphan', False):
                return 'qualifier1'
            return 'default'

        modified_escalation_id_ls = []  # this is the model list with the process result of escalation model

        for model_document in data_list:
            # logic for handling unique model
            if len(model_document['wells']) == 1 and model_name not in ['general_options', 'dates', 'forecast_data']:
                # the only well use this econ model
                model_document['unique'] = True
                model_document['scenario'] = model_document['wells'][0][0]
                model_document['well'] = self.wells_dic[str(model_document['wells'][0][1])]['_id']

            #############################################################################
            # special handle for capex, pricing, production_taxes, expenses
            # to fix mapping to the correspoding project_id and escalation_id
            #############################################################################

            if model_name == 'capex':
                copy_model_document = copy.deepcopy(model_document)

                capex_rows = model_document['econ_function']['other_capex']['rows']
                copy_rows = copy_model_document['econ_function']['other_capex']['rows']

                for idx in range(len(capex_rows)):
                    if capex_rows[idx]['escalation_model'] != 'none':
                        original_id = capex_rows[idx]['escalation_model']['_id']
                        project_id = model_document['project']
                        key = str(original_id) + '_' + str(project_id)

                        escalation_model_id = self.escalation_project_id_map_to_model_id[key][1]
                        copy_rows[idx]['escalation_model'] = escalation_model_id

                del copy_model_document['wells']

                copy_model_document = add_options(copy_model_document)
                modified_escalation_id_ls.append(copy_model_document)

            #############################################################################
            # special handle for capex, pricing_differentials, production_taxes, expenses
            # to fix mapping to the correspoding project_id and escalation_id
            #############################################################################
            # differential does not have escalation so this handle is not required for it
            if model_name == 'pricing':
                sub_model = 'price_model'
                phase_list = ['oil', 'gas', 'ngl', 'drip_condensate']

                copy_model_document = copy.deepcopy(model_document)

                for phase in phase_list:
                    key = None
                    try:
                        original_id = model_document['econ_function'][sub_model][phase]['escalation_model']['_id']
                        project_id = model_document['project']
                        key = str(original_id) + '_' + str(project_id)
                    except Exception:
                        pass

                    if key in self.escalation_project_id_map_to_model_id:
                        escalation_model_id = self.escalation_project_id_map_to_model_id[key][1]
                    else:
                        escalation_model_id = 'none'

                    copy_model_document['econ_function'][sub_model][phase]['escalation_model'] = escalation_model_id

                del copy_model_document['wells']

                copy_model_document = add_options(copy_model_document)
                modified_escalation_id_ls.append(copy_model_document)

            #############################################################################
            # special handle for capex, pricing, production_taxes, expenses
            # to fix mapping to the correspoding project_id and escalation_id
            #############################################################################
            if model_name == 'production_taxes':
                pass

            #############################################################################
            # special handle for capex, pricing, production_taxes, expenses
            # to fix mapping to the correspoding project_id and escalation_id
            #############################################################################
            if model_name == 'expenses':
                sub_model_name_ls = ['variable_expenses', 'fixed_expenses', 'water_disposal']
                phase_ls = ['oil', 'gas', 'ngl', 'drip_condensate']
                expense_ls = ['gathering', 'processing', 'transportation', 'marketing', 'other']
                fixed_cost_name_ls = list(FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT.keys())

                copy_model_document = copy.deepcopy(model_document)

                for sub_model_name in sub_model_name_ls:
                    if sub_model_name == 'variable_expenses':
                        for phase in phase_ls:
                            for expense in expense_ls:
                                key = None
                                try:
                                    original_id = model_document['econ_function'][sub_model_name][phase][expense][
                                        'escalation_model']['_id']
                                    project_id = model_document['project']
                                    key = str(original_id) + '_' + str(project_id)
                                except Exception:
                                    pass

                                if key in self.escalation_project_id_map_to_model_id:
                                    escalation_model_id = self.escalation_project_id_map_to_model_id[key][1]
                                else:
                                    escalation_model_id = 'none'

                                copy_model_document['econ_function'][sub_model_name][phase][expense][
                                    'escalation_model'] = escalation_model_id

                                # handles escalation by rows (not able to do in CC now), also in fixed and water
                                for idx in range(
                                        len(model_document['econ_function'][sub_model_name][phase][expense]['rows'])):
                                    key = None
                                    try:
                                        original_id = model_document['econ_function'][sub_model_name][phase][expense][
                                            'rows'][idx]['escalation_model']['_id']
                                        project_id = model_document['project']
                                        key = str(original_id) + '_' + str(project_id)
                                    except Exception:
                                        pass

                                    if key in self.escalation_project_id_map_to_model_id:
                                        escalation_model_id = self.escalation_project_id_map_to_model_id[key][1]
                                        copy_model_document['econ_function'][sub_model_name][phase][expense]['rows'][
                                            idx]['escalation_model'] = escalation_model_id

                    elif sub_model_name == 'fixed_expenses':
                        for fixed_cost_name in fixed_cost_name_ls:
                            key = None
                            try:
                                original_id = model_document['econ_function'][sub_model_name][fixed_cost_name][
                                    'escalation_model']['_id']
                                project_id = model_document['project']
                                key = str(original_id) + '_' + str(project_id)
                            except Exception:
                                pass

                            if key in self.escalation_project_id_map_to_model_id:
                                escalation_model_id = self.escalation_project_id_map_to_model_id[key][1]
                            else:
                                escalation_model_id = 'none'

                            copy_model_document['econ_function'][sub_model_name][fixed_cost_name][
                                'escalation_model'] = escalation_model_id

                            for idx in range(
                                    len(model_document['econ_function'][sub_model_name][fixed_cost_name]['rows'])):
                                key = None
                                try:
                                    original_id = model_document['econ_function'][sub_model_name][fixed_cost_name][
                                        'rows'][idx]['escalation_model']['_id']
                                    project_id = model_document['project']
                                    key = str(original_id) + '_' + str(project_id)
                                except Exception:
                                    pass

                                if key in self.escalation_project_id_map_to_model_id:
                                    escalation_model_id = self.escalation_project_id_map_to_model_id[key][1]
                                    copy_model_document['econ_function'][sub_model_name][fixed_cost_name]['rows'][idx][
                                        'escalation_model'] = escalation_model_id

                    else:  # water disposal
                        key = None
                        try:
                            original_id = model_document['econ_function'][sub_model_name]['escalation_model']['_id']
                            project_id = model_document['project']
                            key = str(original_id) + '_' + str(project_id)
                        except Exception:
                            pass

                        if key in self.escalation_project_id_map_to_model_id:
                            escalation_model_id = self.escalation_project_id_map_to_model_id[key][1]
                        else:
                            escalation_model_id = 'none'

                        copy_model_document['econ_function'][sub_model_name]['escalation_model'] = escalation_model_id

                        for idx in range(len(model_document['econ_function'][sub_model_name]['rows'])):
                            key = None
                            try:
                                original_id = model_document['econ_function'][sub_model_name]['rows'][idx][
                                    'escalation_model']['_id']
                                project_id = model_document['project']
                                key = str(original_id) + '_' + str(project_id)
                            except Exception:
                                pass

                            if key in self.escalation_project_id_map_to_model_id:
                                escalation_model_id = self.escalation_project_id_map_to_model_id[key][1]
                                copy_model_document['econ_function'][sub_model_name]['rows'][idx][
                                    'escalation_model'] = escalation_model_id

                del copy_model_document['wells']
                copy_model_document = add_options(copy_model_document)
                modified_escalation_id_ls.append(copy_model_document)

            for scenario_id_and_aries_id in model_document['wells']:
                #############################
                # scenario_id_and_well_primary_id, ex: [scenario_id, aries_id]
                #############################

                # skip general_options model, since wells only save None
                if scenario_id_and_aries_id is None:
                    continue

                scenario_id = scenario_id_and_aries_id[0]
                aries_id = scenario_id_and_aries_id[1]
                project_id = model_document['project']
                ignore_list = ['escalation', 'depreciation']
                qualifier_key = get_qualifier_key(model_document, model_name)
                model_key = 'model'

                # find the well_primary_id in scenario_well_assignments_dic
                if (scenario_id, aries_id, project_id) in scenario_well_assignments_dic:
                    # save into scenario_well_assignments_dic
                    scenario_well_doc = scenario_well_assignments_dic[(scenario_id, aries_id, project_id)]
                    if model_name == 'forecast_data':
                        scenario_well_doc['forecast'][qualifier_key][model_key] = model_document['forecast']
                    else:
                        if model_name not in ignore_list:
                            document_id = model_document['_id']
                            scenario_well_doc[model_name][qualifier_key] = {model_key: document_id}

                else:
                    # get scenario_well_assignments default format
                    # add ['scenario'] = scenario_id
                    # add ['general_options'] = general_option_id
                    # add ['well'] = well_primary_id
                    # add [model_name] = model_document['_id']
                    # save into scenario_well_assignments_dic
                    scenario_well_assignments_default_document = self.get_default_format('scenario_well_assignments')
                    scenario_well_assignments_default_document['scenario'] = scenario_id_and_aries_id[0]
                    scenario_well_assignments_default_document['well'] = self.wells_dic[str(
                        scenario_id_and_aries_id[1])]['_id']
                    scenario_well_assignments_default_document['createdAt'] = datetime.datetime.now()
                    scenario_well_assignments_default_document['updatedAt'] = datetime.datetime.now()
                    scenario_well_assignments_default_document['project'] = model_document['project']
                    scenario_well_assignments_default_document['dates'][qualifier_key][model_key] = self.dates_model_id
                    scenario_well_assignments_default_document['production_vs_fit'][qualifier_key][
                        model_key] = self.actual_or_forecast_id

                    if model_name == 'forecast_data':
                        scenario_well_assignments_default_document['forecast'][qualifier_key][
                            model_key] = model_document['forecast']
                    else:
                        if model_name not in ignore_list:
                            scenario_well_assignments_default_document[model_name][qualifier_key] = {
                                model_key: model_document['_id']
                            }

                    # the key is different to phdwin extraction class
                    scenario_well_assignments_dic[(scenario_id, aries_id,
                                                   project_id)] = scenario_well_assignments_default_document

            del model_document['wells']

        # for capex, price, tax, expense need to return the modified_escalation_id_ls
        if (model_name == 'capex' or model_name == 'pricing' or model_name == 'expenses'):
            return modified_escalation_id_ls, scenario_well_assignments_dic
        else:
            return data_list, scenario_well_assignments_dic

    def insert_many_once_for_all_well_in_one_db(self):  # noqa: C901
        '''
        insert all assumptions into mongodb once only, from self data list
        '''
        scenario_well_assignments_dic = {}

        if self.general_option_data_list:
            self.general_option_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.general_option_data_list, scenario_well_assignments_dic, 'general_options')
            try:
                self.context.assumptions_collection.insert_many(self.general_option_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.general.value),
                                          model=ErrorMsgEnum.general.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if self.dates_data_list:
            self.dates_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.dates_data_list, scenario_well_assignments_dic, 'dates')
            try:
                self.context.assumptions_collection.insert_many(self.dates_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.dates.value),
                                          model=ErrorMsgEnum.dates.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if self.ownership_data_list:
            self.ownership_data_list = self.change_wells_from_set_to_list(self.ownership_data_list)
            self.ownership_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.ownership_data_list, scenario_well_assignments_dic, 'ownership_reversion')
            try:
                self.context.assumptions_collection.insert_many(self.ownership_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.ownership.value),
                                          model=ErrorMsgEnum.ownership.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)
        if self.reserves_data_list:
            self.reserves_data_list = self.change_wells_from_set_to_list(self.reserves_data_list)
            self.reserves_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.reserves_data_list, scenario_well_assignments_dic, 'reserves_category')
            try:
                self.context.assumptions_collection.insert_many(self.reserves_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.rescat.value),
                                          model=ErrorMsgEnum.rescat.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if self.price_data_list:
            self.price_data_list = self.change_wells_from_set_to_list(self.price_data_list)
            self.price_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.price_data_list, scenario_well_assignments_dic, 'pricing')
            try:
                self.context.assumptions_collection.insert_many(self.price_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.price.value),
                                          model=ErrorMsgEnum.price.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if self.differential_data_list:
            self.differential_data_list = self.change_wells_from_set_to_list(self.differential_data_list)
            self.differential_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.differential_data_list, scenario_well_assignments_dic, 'differentials')
            try:
                self.context.assumptions_collection.insert_many(self.differential_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.diff.value),
                                          model=ErrorMsgEnum.diff.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if self.capex_data_list:
            self.capex_data_list = self.change_wells_from_set_to_list(self.capex_data_list)
            self.capex_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.capex_data_list, scenario_well_assignments_dic, 'capex')
            try:
                self.context.assumptions_collection.insert_many(self.capex_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.capex.value),
                                          model=ErrorMsgEnum.capex.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if self.tax_data_list:
            self.tax_data_list = self.change_wells_from_set_to_list(self.tax_data_list)
            self.tax_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.tax_data_list, scenario_well_assignments_dic, 'production_taxes')
            try:
                self.context.assumptions_collection.insert_many(self.tax_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.tax.value),
                                          model=ErrorMsgEnum.tax.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if self.expense_data_list:
            self.expense_data_list = self.change_wells_from_set_to_list(self.expense_data_list)
            self.expense_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.expense_data_list, scenario_well_assignments_dic, 'expenses')
            try:
                self.context.assumptions_collection.insert_many(self.expense_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.expense.value),
                                          model=ErrorMsgEnum.expense.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if self.stream_properties_data_list:
            self.stream_properties_data_list = self.change_wells_from_set_to_list(self.stream_properties_data_list)
            self.stream_properties_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.stream_properties_data_list, scenario_well_assignments_dic, 'stream_properties')
            try:
                self.context.assumptions_collection.insert_many(self.stream_properties_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.stream.value),
                                          model=ErrorMsgEnum.stream.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if self.risking_data_list:
            self.risking_data_list = self.change_wells_from_set_to_list(self.risking_data_list)
            self.risking_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.risking_data_list, scenario_well_assignments_dic, 'risking')
            try:
                self.context.assumptions_collection.insert_many(self.risking_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.risk.value),
                                          model=ErrorMsgEnum.risk.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if self.escalation_data_list:
            self.escalation_data_list = self.change_wells_from_set_to_list(self.escalation_data_list)
            self.escalation_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.escalation_data_list, scenario_well_assignments_dic, 'escalation')
            try:
                self.context.assumptions_collection.insert_many(self.escalation_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.escalation.value),
                                          model=ErrorMsgEnum.escalation.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if self.elt_data_list:
            try:
                self.context.embedded_lookup_tables_collection.insert_many(self.elt_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.pvfit.value),
                                          model=ErrorMsgEnum.pvfit.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if self.project_custom_header_data_ls:
            try:
                self.context.project_custom_headers_datas_collection.insert_many(self.project_custom_header_data_ls)
            except Exception:
                pass

        if self.project_custom_header_ls:
            try:
                self.context.project_custom_headers_collection.insert_many(self.project_custom_header_ls)
            except Exception:
                pass

        if self.actual_forecast_data_list:
            self.actual_forecast_data_list = self.change_wells_from_set_to_list(self.actual_forecast_data_list)
            self.actual_forecast_data_list, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                self.actual_forecast_data_list, scenario_well_assignments_dic, 'production_vs_fit')
            try:
                self.context.assumptions_collection.insert_many(self.actual_forecast_data_list)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.elt.value),
                                          model=ErrorMsgEnum.elt.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        forecasts_ls = list(self.forecasts_dic.values())
        if forecasts_ls:
            # self.context.forecasts_collection.insert_many(forecasts_ls)
            try:
                for forecasts_document in forecasts_ls:
                    forecasts_well_id_list = forecasts_document['wells']
                    copy_forecasts_document = copy.deepcopy(forecasts_document)
                    del copy_forecasts_document['wells']
                    self.context.forecasts_collection.update_one({'_id': forecasts_document['_id']}, {
                        '$addToSet': {
                            'wells': {
                                '$each': forecasts_well_id_list
                            }
                        },
                        '$set': copy_forecasts_document
                    },
                                                                 upsert=True)  # noqa: E126
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.forecast.value),
                                          model=ErrorMsgEnum.forecast.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        convert_arps_exp_to_modified_arps(self.forecast_datas_dic)
        forecast_datas_ls = list(self.forecast_datas_dic.values())
        if forecast_datas_ls:
            forecast_datas_ls = self.forecast_datas_format_v2_to_v3(forecast_datas_ls)
            forecast_datas_ls, scenario_well_assignments_dic = self.add_wells_map_to_models_in_scenarios(
                forecast_datas_ls, scenario_well_assignments_dic, 'forecast_data')
            forecast_datas_ls = forecast_validity_check(forecast_datas_ls)
            try:
                self.context.deterministic_forecast_datas_collection.insert_many(forecast_datas_ls)
            except Exception:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                   ErrorMsgEnum.forecast_data.value),
                                          model=ErrorMsgEnum.forecast_data.value,
                                          severity=ErrorMsgSeverityEnum.critical.value)

        if not self.only_forecast:
            if scenario_well_assignments_dic:
                # check size of scenario_well_assignments is equal to size of scenario times wells
                scenario_well_assignments_dic = self.check_wells_size_equal_to_scenario_well_assignments(
                    scenario_well_assignments_dic)
                try:
                    self.context.scenario_well_assignments_collection.insert_many(
                        list(scenario_well_assignments_dic.values()))
                except Exception:
                    self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                       ErrorMsgEnum.scenario_well.value),
                                              model=ErrorMsgEnum.scenario_well.value,
                                              severity=ErrorMsgSeverityEnum.critical.value)

            if self.scenarios_dic and scenario_well_assignments_dic:
                try:
                    for _id in self.scenarios_dic:
                        scenarios_well_id_list = self.scenarios_dic[_id]['wells']
                        copy_scenarios_document = copy.deepcopy(self.scenarios_dic[_id])
                        del copy_scenarios_document['wells']
                        self.context.scenarios_collection.update_one(
                            {'_id': _id},
                            {
                                '$addToSet': {
                                    'wells': {
                                        '$each': scenarios_well_id_list
                                    }
                                },
                                '$set': copy_scenarios_document
                            },
                            upsert=True,
                        )
                except Exception:
                    self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                                       ErrorMsgEnum.scenario.value),
                                              model=ErrorMsgEnum.scenario.value,
                                              severity=ErrorMsgSeverityEnum.critical.value)

    # this function is not used anywhere
    def update_wells_id_to_project(self):
        '''
        update wells _id to the only imported project
        '''
        # 1 get project name from self.project_dic
        # 2 if project name is 'Aries Project', put every wells _id into project document
        # 3 if project name is from PROJECT_df, then put Aries file include wells _id into project document

        project_document = self.projects_dic[self.project_id]
        project_name = project_document['name']

        if project_name == 'Aries Project':
            # put every wells _id into project document
            for propnum in self.wells_dic:
                project_document['wells'].append(self.wells_dic[propnum]['_id'])
        else:
            # put aries file defined wells _id into project document
            project_df = self.PROJECT_df.copy()
            projlist_df = self.PROJLIST_df.copy()

            df = pd.DataFrame()

            project_name_selected_df = project_df.loc[project_df['NAME'] == project_name]
            df = df.append(project_name_selected_df, ignore_index=True)

            for index, row in df.iterrows():
                entitytype_projkey_projlist_df = projlist_df.loc[(projlist_df['PROJKEY'] == row.PROJKEY)
                                                                 & (projlist_df['ENTITYTYPE'] == 'P')]

                ls_propnum = entitytype_projkey_projlist_df['INTKEY'].unique()

                for propnum in ls_propnum:
                    # if propnum not in self.wells_dic:
                    if not self.check_if_well_exist(propnum):
                        continue
                    project_document['wells'].append(self.wells_dic[propnum]['_id'])

    def extract_general_option_and_dates_model(self):  # noqa(c901)
        '''
        extract general_option model from AC_SETUPDATA, AC_SETUP
        save those general_option model to self.general_option_data_list
        '''
        ac_setup_df = self.AC_SETUP_df.copy()
        ac_setupdata_df = self.AC_SETUPDATA_df.copy()

        # change all header to upper case
        # TODO: transform map in a list comprehension
        ac_setup_df.columns = map(str.upper, [str(header) for header in ac_setup_df.columns])
        ac_setupdata_df.columns = map(str.upper, [str(header) for header in ac_setupdata_df.columns])

        if self.setups:
            selected_setup = pd.DataFrame([], columns=ac_setup_df.columns)
            for input_setting in self.setups:
                temp_df = ac_setup_df[ac_setup_df['SETUPNAME'].astype(str).str.upper().str.strip() == str(
                    input_setting).upper().strip()]
                selected_setup = selected_setup.append(temp_df, ignore_index=True)
            ac_setup_df = selected_setup
        else:
            ac_setup_df = ac_setup_df[ac_setup_df['SETUPNAME'] == ac_setup_df['SETUPNAME'].unique()[0]]

        try:
            self.common_default_lines = get_default_common_lines_from_setup(ac_setupdata_df, ac_setup_df)
        except Exception:
            self.common_default_lines = {}

        try:
            self.custom_escalation = get_custom_escalation(ac_setupdata_df, ac_setup_df)
        except Exception:
            self.custom_escalation = {}

        try:
            self.discount_rows = get_discount_rows(ac_setupdata_df, ac_setup_df)
        except Exception:
            self.discount_rows = []

        for index, row in ac_setup_df.iterrows():
            # get default general_option and dates format
            general_option_default_document = self.get_default_format('general_options')
            dates_default_document = self.get_default_format('dates')

            # extract appropriate setup data
            setupname_frame_ac_setupdata_df = extract_selected_setup_data(row, ac_setupdata_df)
            setupname_corptax_ac_setupdata_df = extract_selected_setup_data_corptax(row, ac_setupdata_df)

            if not setupname_frame_ac_setupdata_df.empty:
                # extract FRAME data
                # LINENUMBER 1 for base_date
                columns_correct, problem_column = check_for_required_cols(list(setupname_frame_ac_setupdata_df.columns),
                                                                          SETUP_DATA_RQD_COLS)

                if not columns_correct:
                    message = format_error_msg(ErrorMsgEnum.class1_msg.value, ErrorMsgEnum.setup.value, problem_column,
                                               ErrorMsgEnum.ac_setup_data.value)
                    self.log_report.log_error(message=message,
                                              model=ErrorMsgEnum.general.value,
                                              severity=ErrorMsgSeverityEnum.error.value)
                    return

                line = setupname_frame_ac_setupdata_df.loc[setupname_frame_ac_setupdata_df['LINENUMBER'] == 1]['LINE']

                try:
                    base_date = pd.to_datetime(str(line).split()[1]).strftime('%Y-%m-%d')
                except Exception:
                    self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class6_msg.value,
                                                                       ErrorMsgEnum.base_date.value, line),
                                              model=ErrorMsgEnum.general.value,
                                              severity=ErrorMsgSeverityEnum.error.value)

                try:
                    max_eco_year = get_max_eco_year_from_frame_string(line.values[-1])
                except (ValueError, TypeError, KeyError, IndexError):
                    max_eco_year = 0

                # LINENUMBER 4 for effective_date
                line = setupname_frame_ac_setupdata_df.loc[setupname_frame_ac_setupdata_df['LINENUMBER'] == 4]['LINE']
                try:
                    effective_date = pd.to_datetime(str(line).split()[1]).strftime('%Y-%m-%d')
                except Exception:
                    self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class6_msg.value,
                                                                       ErrorMsgEnum.effective_date.value, line),
                                              model=ErrorMsgEnum.general.value,
                                              severity=ErrorMsgSeverityEnum.error.value)

                # LINENUMBER 2000 for max case years
                line = setupname_frame_ac_setupdata_df.loc[setupname_frame_ac_setupdata_df['LINENUMBER'] ==
                                                           2000]['LINE']
                try:
                    max_eco_year = max_eco_year if max_eco_year != 0 else int(str(line).split()[5])
                except Exception:
                    self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class6_msg.value,
                                                                       ErrorMsgEnum.max_eco_year.value, line),
                                              model=ErrorMsgEnum.general.value,
                                              severity=ErrorMsgSeverityEnum.error.value)

                general_option_default_document = update_corptax(general_option_default_document, row,
                                                                 setupname_corptax_ac_setupdata_df)

                # filling extracted value to general_option default format
                general_option_default_document['econ_function']['main_options']['aggregation_date'] = effective_date

                # fill in dates_setting info
                dates_default_document['econ_function']['dates_setting']['max_well_life'] = max_eco_year
                dates_default_document['econ_function']['dates_setting']['discount_date'] = {'date': effective_date}
                dates_default_document['econ_function']['dates_setting']['as_of_date'] = {'date': effective_date}
                dates_default_document['econ_function']['dates_setting']['base_date'] = base_date
            else:
                self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class3_msg.value,
                                                                   ErrorMsgEnum.project_set.value),
                                          model=ErrorMsgEnum.general.value,
                                          severity=ErrorMsgSeverityEnum.error.value)
                self.log_report.log_error(message=ErrorMsgEnum.default_asof_message_error.value,
                                          severity=ErrorMsgSeverityEnum.error.value)

            setupname_pw_ac_setupdata_df = ac_setupdata_df.loc[(ac_setupdata_df['SECNAME'] == row.PW)
                                                               & (ac_setupdata_df['SECTYPE'] == 'PW')]

            if not setupname_pw_ac_setupdata_df.empty:
                # extract PW data
                # LINENUMBER 2 for primary rate, discount method
                line = setupname_pw_ac_setupdata_df.loc[setupname_pw_ac_setupdata_df['LINENUMBER'] == 2]['LINE']
                try:
                    discount_method = str(line).split()[3]
                except Exception:
                    self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class6_msg.value,
                                                                       ErrorMsgEnum.discount_method.value),
                                              model=ErrorMsgEnum.general.value,
                                              severity=ErrorMsgSeverityEnum.error.value)
                try:
                    first_discount = str(line).split()[2]
                except Exception:
                    self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class6_msg.value,
                                                                       ErrorMsgEnum.first_discount.value),
                                              model=ErrorMsgEnum.general.value,
                                              severity=ErrorMsgSeverityEnum.error.value)
                if discount_method == 'MO' or discount_method == 'MOS':
                    discount_method = 'yearly'
                # temporary fix, written this way to show that more keywords are to be considered in the future
                else:
                    discount_method = 'monthly'

                # LINENUMBER 3 for discount table
                line = setupname_pw_ac_setupdata_df.loc[setupname_pw_ac_setupdata_df['LINENUMBER'] == 3]['LINE']
                # discount length might be different, start extracting from index 1
                try:
                    ls_discount_table = line.values.flatten()[-1].split()
                except Exception:
                    ls_discount_table = []
                    self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class6_msg.value,
                                                                       ErrorMsgEnum.discount_table.value),
                                              model=ErrorMsgEnum.general.value,
                                              severity=ErrorMsgSeverityEnum.error.value)

                # filling extracted value to general_option default format
                general_option_default_document['econ_function']['discount_table']['discount_method'] = discount_method
                try:
                    first_discount = float(first_discount)
                except (ValueError, TypeError):
                    self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.invalid1_msg.value, first_discount,
                                                                       ErrorMsgEnum.first_discount.value),
                                              model=ErrorMsgEnum.general.value,
                                              severity=ErrorMsgSeverityEnum.error.value)
                    first_discount = None
                if first_discount is not None:
                    general_option_default_document['econ_function']['discount_table']['first_discount'] = float(
                        first_discount)
                    general_option_default_document['econ_function']['discount_table']['second_discount'] = float(
                        first_discount)
                    MAX_CUM_CASH_FLOW_DICT_PMAX['discount'] = first_discount

                for idx, discount_value in enumerate(ls_discount_table):
                    # first check if value from discount table can be convert to int
                    try:
                        round(float(discount_value), 2)
                    except (ValueError, IndexError):
                        if idx < len(general_option_default_document['econ_function']['discount_table']['rows']):
                            discount_table = general_option_default_document['econ_function']['discount_table']
                            discount_table['rows'] = discount_table['rows'][:idx]
                        break

                    # then check if rows in discount table has idx position to assign the discoutn value
                    try:
                        general_option_default_document['econ_function']['discount_table']['rows'][idx][
                            'discount_table'] = round(float(discount_value), 2)
                    except (ValueError, IndexError):
                        obj = {'discount_table': round(float(discount_value), 2)}
                        general_option_default_document['econ_function']['discount_table']['rows'].append(obj)

            # save filled model into general_option_data_list
            general_option_default_document['createdAt'] = datetime.datetime.now()
            general_option_default_document['updatedAt'] = datetime.datetime.now()
            general_option_default_document['wells'] = set()
            general_option_default_document['wells'].add(None)

            self.compare_and_save_into_self_data_list(general_option_default_document,
                                                      self.general_option_data_list,
                                                      self.projects_dic,
                                                      model_name='ARIES_CC_GENERAL_OPTIONS',
                                                      aries=True)

            # save filled model into general_option_data_list
            dates_default_document['createdAt'] = datetime.datetime.now()
            dates_default_document['updatedAt'] = datetime.datetime.now()
            dates_default_document['wells'] = set()
            dates_default_document['wells'].add(None)
            self.compare_and_save_into_self_data_list(dates_default_document,
                                                      self.dates_data_list,
                                                      self.projects_dic,
                                                      model_name='ARIES_CC_DATES_MODEL',
                                                      aries=True)

    def check_wells_size_equal_to_scenario_well_assignments(self, scenario_well_assignments_dic):
        '''
        check every _id of wells, if not in scenario_well_assignments_dic,
        add a no econ model assignments default document into scenario_well_assignments_dic

        input: scenario_well_assignments_dic
        output: scenario_well_assignments_dic

        noted: scenario_well_assignments_dic[(scenario_id, aries_id, project_id)]
        notedL well_forecasts is not used any more
        '''
        for scenario_id in self.scenarios_dic:
            assigned_scenario_wells = []
            for ids in scenario_well_assignments_dic:
                if scenario_id in ids:
                    assigned_scenario_wells.append(ids[1])
            non_assigned_wells = list(set(self.scenarios_dic[scenario_id]['aries_id']) - set(assigned_scenario_wells))
            if non_assigned_wells:
                for aries_id in non_assigned_wells:
                    scenario_well_assignments_default_document = self.get_default_format('scenario_well_assignments')
                    for project_id in self.projects_dic:
                        scenario_well_assignments_default_document['scenario'] = scenario_id
                        scenario_well_assignments_default_document['project'] = project_id
                        scenario_well_assignments_default_document['well'] = self.wells_dic[aries_id]['_id']
                        scenario_well_assignments_default_document['createdAt'] = datetime.datetime.now()
                        scenario_well_assignments_default_document['updatedAt'] = datetime.datetime.now()
                        scenario_well_assignments_dic[(scenario_id, aries_id,
                                                       project_id)] = scenario_well_assignments_default_document

        return scenario_well_assignments_dic

    # TODO: unused method
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
                propnum = well_document['aries_id']

                if propnum in self.aries_id_to_daily_fpd_dic and self.aries_id_to_daily_fpd_dic[propnum] is not None:
                    well_calcs_default_document['first_prod_date'] = pd.to_datetime(
                        self.aries_id_to_daily_fpd_dic[propnum])
                elif (propnum in self.aries_id_to_monthly_fpd_dic
                      and self.aries_id_to_monthly_fpd_dic[propnum] is not None):
                    # daily production does not have FPD, need to find FPD from monthly prod.
                    well_calcs_default_document['first_prod_date'] = pd.to_datetime(
                        self.aries_id_to_monthly_fpd_dic[propnum])

            # need to calculate total_prop_weight
            well_calcs_default_document = self.create_total_prop_weight_and_total_fluid_volume(
                well_calcs_default_document, well_document)

            self.well_calcs_data_list.append(well_calcs_default_document)

        self.context.well_calcs_collection.insert_many(self.well_calcs_data_list)

    # TODO: unused method
    def export_error_to_csv(self):
        error_report = open('error_report.csv', 'w')
        error_report.write(self.log_report.assumption_error_list.getvalue().replace('\n', ''))
        error_report.close()

    def update_progress_by_well(self, prog_range, total_num, batch_num, curr_idx):
        if self.notification_id:
            prog_start = prog_range[0]
            prog_end = prog_range[1]
            if (curr_idx + 1) % batch_num == 0:
                well_prog_total = prog_start + round((prog_end - prog_start) * (curr_idx + 1) / total_num)
                well_prog_allocated = well_prog_total * PROGRESS_ALLOCATED_FOR_ECOMONIC_IMPORT / 100
                self.progress.notify(INITIAL_ARIES_IMPORT_PROGRESS + well_prog_allocated)

    def format_ecophase(self):
        if self.ECOPHASE_df.empty:
            (self.backup_price_dict, self.backup_tax_dict, self.backup_ownership_dict) = None, None, None
            return
        (self.backup_price_dict, self.backup_tax_dict,
         self.backup_ownership_dict) = process_ecophase_for_price_tax_backup(self.ECOPHASE_df)

    def execute_gen_prop_extraction(self):
        try:
            self.extract_general_option_and_dates_model()
        except Exception:
            create_date_general_options_default_model(self.compare_and_save_into_self_data_list,
                                                      self.get_default_format, self.general_option_data_list,
                                                      self.dates_data_list, self.projects_dic)
            self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                               ErrorMsgEnum.default_general_date.value),
                                      model=ErrorMsgEnum.default_general_date.value,
                                      severity=ErrorMsgSeverityEnum.critical.value)
        try:
            self.create_and_insert_actual_or_forecast_model(aries_import=True)
        except Exception:
            self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                               ErrorMsgEnum.default_pvfit.value),
                                      model=ErrorMsgEnum.default_pvfit.value,
                                      severity=ErrorMsgSeverityEnum.critical.value)
        try:
            self.save_enddate_to_dic()
        except Exception:
            self.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class7_msg.value,
                                                               ErrorMsgEnum.end_date.value),
                                      model=ErrorMsgEnum.end_date.value,
                                      severity=ErrorMsgSeverityEnum.warn.value)

    def execute(self, debugging=False):
        self.progress = ProgressNotifier(self.context.pusher, self.notification_id, self.context.subdomain,
                                         str(self.user_id)) if not debugging else None

        self.create_wells_dic()

        self.execute_gen_prop_extraction()

        self.format_ecophase()

        self.progress.notify(INITIAL_ARIES_IMPORT_PROGRESS) if not debugging else None
        self.economic()

        # special handle for escalation to match the number of projects
        self.escalation_data_list_times_number_of_project()

        self.insert_many_once_for_all_well_in_one_db()
        self.progress.notify(97) if not debugging else None

        self.update_models_id_and_wells_id_to_project()

        self.progress.notify(99) if not debugging else None

        # self.export_error_to_csv()
