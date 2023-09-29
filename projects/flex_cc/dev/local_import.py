import sys
import certifi
import os
import yaml
import pymongo
import pandas as pd
import numpy as np
import time
import copy
from os.path import dirname, abspath, join

sys.path.insert(1, f'{os.path.abspath(os.curdir)}\\apps\\flex_cc')
sys.path.insert(1, os.path.abspath(os.curdir))

from dev.dev_context_local import open_context  # noqa: E402
from api.aries_phdwin_imports.mdb_extract import AriesDataExtraction  # noqa: E402
from dev.extract_phd import extract_phdwin_files  # noqa: E402
from dev.extract_access import extract_aries_access_files  # noqa: E402
from api.aries_phdwin_imports.phd_extract import PHDWinDataExtraction  # noqa: E402
from api.aries_phdwin_imports.phdwin_helpers.wells import delete_created_phdwin_wells  # noqa: E402
from api.aries_phdwin_imports.helpers import (  # noqa: E402
    user_id, parallel_dic, import_external_a_file)
from api.aries_phdwin_imports.aries_import_helpers import (  # noqa: E402
    create_custom_dict_local, clean_propnum_in_property_df, FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT)

from combocurve.shared.aries_import_enums import FileDir, ARIES_FILES_LABEL, AriesFilesEnum  # noqa: E402
from combocurve.science.segment_models.multiple_segments import MultipleSegments  # noqa: E402
from combocurve.utils.exceptions import get_exception_info  # noqa: E402


class PHDWinDataExtractionLocal(PHDWinDataExtraction):
    def execute(self):
        self.get_lease_id_to_exclsum_dic()

        self.well_days()

        self.well_months()

        self.wells()

        try:
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

            # partially data for stream_properties (Shrinkage + Yield + BTU or Shrinkage + BTU model)
            self.prices_taxes_expense()

            # partially data for stream_properties (Yield + BTU or BTU model)
            self.yield_shrinkage_compare_and_save_into_self_data_list()

            self.update_well_models()

            self.insert_many_once_for_all_well_in_one_db()

            self.update_models_id_and_wells_id_to_project()

            self.create_and_insert_well_calcs_collection()

            self.wells_add_has_daily_monthly()

            if self.debug:
                self.log_report.output_debug_error()
        except Exception as e:
            print(get_exception_info(e))  # noqa (T001)
            delete_created_phdwin_wells(self.db, self.wells_dic)


class AriesDataExtractionLocal(AriesDataExtraction):

    # development only
    def pre_process_local(self):
        '''
        move partial table reading and pre process in __init__ here
        used in nonparallel and parallel
        '''
        # self.read_all_table()

        # define symbal mapping to file dictionary
        #self.folder_name = name
        # self.context.db['well-calcs'].insert_many(self.well_calcs_data_list)

        # set attribute forecasts_collection for Context object

        # TODO get files from storage. Pass name from front end
        try:
            self.external_file_dict = import_external_a_file(os.listdir(FileDir.base.value + self.folder_name),
                                                             self.folder_name)
        except Exception:
            self.external_file_dict = {}
        self.AC_DAILY_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.daily.value, engine="python")
        self.AC_PRODUCT_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.monthly.value, engine="python")
        self.AC_PROPERTY_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.info.value,
                                          dtype="object",
                                          engine="python")
        self.AC_ECONOMIC_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.economic.value,
                                          dtype="object",
                                          engine="python")
        self.AC_SCENARIO_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.scenario.value,
                                          dtype="object",
                                          engine="python")
        self.ARLOOKUP_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.lookup.value, engine="python")
        self.ARENDDATE_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.end.value, engine="python")
        self.AR_SIDEFILE_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.sidefile.value,
                                          engine="python")
        self.PROJECT_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.project.value, engine="python")
        self.PROJLIST_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.projlist.value, engine="python")
        self.AC_SETUPDATA_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.setup_data.value,
                                           engine="python")
        self.AC_SETUP_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.setup.value, engine="python")
        self.ECOPHASE_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.ecophase.value, engine="python")
        self.DBSLIST_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.dbslist.value, engine="python")
        self.ARSYSTBL_df = pd.read_csv(FileDir.base.value + self.folder_name + FileDir.arsystbl.value, engine="python")
        self.CUSTOM_TABLE_dict = create_custom_dict_local(self.ARSYSTBL_df,
                                                          os.listdir(FileDir.base.value + self.folder_name),
                                                          self.folder_name)

        clean_propnum_in_property_df(self.AC_PROPERTY_df)
        self.AC_PROPERTY_df.columns = [str(header).upper() for header in self.AC_PROPERTY_df.columns]
        self.at_symbol_mapping_dic = {
            FileDir.m.value: [self.AC_PROPERTY_df, ARIES_FILES_LABEL[AriesFilesEnum.ac_property]]
        }

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
        self.escalation_segment_param = {}
        self.escalation_unit_dic = {}
        self.escalation_document = {}
        self.forecast_df = np.array([])
        self.actual_vs_forecast_param = {}

        self.overlay_tax_param = {}
        self.overlay_expense_param = {}
        self.overlay_yield_param = {}
        self.overlay_price_param = {}
        self.overlay_differential_param = {}
        self.use_end_date = True
        self.expense_name_assignment = copy.deepcopy(FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT)

        self.elt_data_dict = {}

        # important note:
        # in phdwin, self.wells_dic use _id as key
        # in aries, self.wells_dic use aries_id as key

        # create project at very beginning then let user to choose 1 project to import
        self.create_project_collection_from_aries_table()

        # select the first project
        first_proj_key = list(self.projects_dic.keys())[0]
        self.projects_dic = {first_proj_key: self.projects_dic[first_proj_key]}

        # create_monthly_id_map_to_fpd
        self.aries_id_to_daily_fpd_dic = {}
        self.aries_id_to_monthly_fpd_dic = {}

        # create_scenario_ls
        # self.scenario_ls = []

        ac_scenario_df = self.AC_SCENARIO_df.copy()
        ac_scenario_df.columns = map(str.upper, ac_scenario_df.columns)
        self.scenario_ls = list(ac_scenario_df['SCEN_NAME'].unique())
        self.setups = []

        # discard
        # 01/28/2020 for parallel, map forecasts document _id to the exist document _id
        # self.forecasts_parallel_id_map = {}  # {str(ObjectId()): ObjectId()}
        # VERY TENTATIVE!!!!!!!!!!!!!
        for _id in self.projects_dic:
            self.project_id = _id
        # print("Project ID {}".format(self.project_id))

        # look for checks in well keywords, more checks would be added as more information is gotten
        self.ignore_overhead = False
        # stores major product of each well
        self.well_major = {}
        self.risking_params = {}
        self.well_count = 0
        self.well_import_list = []

        self.project_custom_header_well_data = {}
        self.project_customer_header_alias = {}
        self.project_custom_header_ls = []
        self.project_custom_header_data_ls = []

        self.segment_conversion = MultipleSegments()

    def execute(self):
        self.pre_process_local()
        # required for local testing
        # try:
        #     self.wells()
        # except Exception as e:
        #     message = "Could not fetch well information!"
        #     self.log_report.log_error(message=message, error=e, severity='critical')
        # print(self.projects_dic)
        # self.update_models_id_and_wells_id_to_project()

        super().execute(debugging=True)


def check_db_exists():
    """
    Checks if the tenant to be written to exist in database
    """
    dir_path = dirname(abspath(__file__))
    with open(join(dir_path, 'dev_tenant.yaml'), 'r') as stream:
        tenant_info = yaml.full_load(stream)
    uri = tenant_info['db_connection_string'].rsplit('/', 1)[0]
    db_name = tenant_info['db_name']
    client = pymongo.MongoClient(uri, tls=True, tlsCAFile=certifi.where())
    db_name_list = [db_dic['name'] for db_dic in list(client.list_databases())]
    if db_name not in db_name_list:
        raise NameError('Database {} Does not Exist!'.format(db_name))


def class_main_extract(folder_name=None, aries=False, just_extract=False):
    check_db_exists()
    if aries:
        with open_context() as context:
            use_folder_name = extract_aries_access_files(folder_name)
            if use_folder_name is None:
                print('COULD NOT START ARIES IMPORT')  # noqa: T001
                return
            if just_extract:
                return
            extraction_obj = AriesDataExtractionLocal(user_id, None, None, context, parallel_dic, create_elts=True)
            setattr(extraction_obj, 'folder_name', use_folder_name)
            start = time.time()
            extraction_obj.execute()
            end = time.time()
            seconds = end - start
            print('Conversion Time:', time.strftime("%H:%M:%S", time.gmtime(seconds)))  # noqa(T001)
    else:
        with open_context() as context:
            use_folder_name = extract_phdwin_files(folder_name)
            if use_folder_name is None:
                print('COULD NOT START PHDWIN IMPORT')  # noqa: T001
                return
            if just_extract:
                return
            print('STARTING PHDWIN IMPORT')  # noqa: T001
            extraction_obj = PHDWinDataExtractionLocal(use_folder_name,
                                                       user_id,
                                                       None,
                                                       parallel_dic,
                                                       None, ({}, {}, {}, {}),
                                                       context,
                                                       debug=True,
                                                       local=True)
            start = time.time()
            extraction_obj.execute()
            end = time.time()
            seconds = end - start
            print('Conversion Time:', time.strftime("%H:%M:%S", time.gmtime(seconds)))  # noqa(T001)


class_main_extract()
