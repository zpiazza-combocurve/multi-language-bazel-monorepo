import os
import csv
import shutil
import zipfile
import logging
import datetime
import pandas as pd
from bson import ObjectId

from api.aries_phdwin_imports.mdb_extract import AriesDataExtraction
from api.file_imports.index import InvalidFileSizeError, MAX_GCS_BATCH_REQUESTS_SIZE, InvalidMappingError
from api.file_imports.mapping_validation import check_mappings
from api.aries_phdwin_imports.phd_extract import PHDWinDataExtraction
from api.aries_phdwin_imports.phdwin_helpers.wells import (get_well_and_prod_date, PHDWIN_MONTHLY_PROD_FILE_MAPPING,
                                                           PHDWIN_HEADER_FILE_MAPPING)

from combocurve.shared.aries_import_enums import AriesFilesEnum, ARIES_FILES_LABEL, WellHeaderEnum
from combocurve.shared.helpers import clean_dict, first_or_default, split_in_chunks, clean_up_file_name
from combocurve.shared.phdwin_import_constants import PHDWIN_PD_ENCODING
from combocurve.shared.phdwin_name_map import (ALL_PHDWIN_TABLES, PHDWIN_RQD_MOD_TABLES, change_name,
                                               check_for_phdwin_required_tables)
from combocurve.shared.progress_notifier import ProgressNotifier
from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.constants import (DEFAULT_USER_NOTIFICATION_ERROR, TASK_STATUS_COMPLETED, TASK_STATUS_FAILED,
                                        TASK_STATUS_RUNNING)

ARIES_IMPORT_TO_FILE_IMPORT = {
    AriesFilesEnum.ac_property.value: 'headerFile',
    AriesFilesEnum.ac_daily.value: 'productionDailyFile',
    AriesFilesEnum.ac_product.value: 'productionMonthlyFile',
}

PHDWIN_TABLE_DESCR_DICT = {
    'ACT': 'Header table',
    'TST': 'Daily production table',
    'DAT': 'Monthly production table',
    'FOR': 'Forecast table'
}

PHDWIN_IMPORT_TO_FILE_IMPORT = {
    '0': 'headerFile',
    '1': 'productionDailyFile',
    '2': 'productionMonthlyFile',
}

# ALIAS TABLE DICT, using DEFAULT ARIES ALIAS as key with how CC expects it as value
ALIAS_TBL_DICT = {
    'M': ARIES_FILES_LABEL[AriesFilesEnum.ac_property],
    'DP': ARIES_FILES_LABEL[AriesFilesEnum.ac_daily],
    'MP': ARIES_FILES_LABEL[AriesFilesEnum.ac_product],
    'EC': ARIES_FILES_LABEL[AriesFilesEnum.ac_economic],
}

MAX_PHDWIN_SIZE_LIMIT = 1000000000
FORECAST_SIZE_LIMIT_DICT = {'FOR': 1500000000}
DEFAULT_DAILY_HEADERS = ['PROPNUM', 'D_DATE', 'OIL', 'GAS', 'WATER']
DEFAULT_MONTHLY_HEADERS = ['PROPNUM', 'P_DATE', 'OIL', 'GAS', 'WATER']
DEFAULT_ARENDDATE_HEADERS = ['DBSKEY', 'RECORD_CO', 'LIFE']
DEFAULT_ECOPHASE_HEADERS = ['STRM_NUM', 'KWORD', 'TYPE', 'NET_BKUP', 'PRI_BKUP', 'TAX_BKUP']
DEFAULT_ARSYSTBL_HEADERS = ['TABLESET', 'TBL_ALIAS', 'DESCRIPTN', 'ODBCSRC', 'TABLENAME']
DEFAULT_DBSLIST_HEADERS = ['DBSKEY', 'TABLESET', 'OWNER']


class InvalidAriesImportError(Exception):
    expected = True


class ParsingAriesFileError(Exception):
    expected = True


class ParsingPHDWinFileError(Exception):
    expected = True


class AriesService(object):
    def __init__(self, context):
        self.context = context

    '''
    def get_aries_import_document(self, _id):
        # Inputs:
        # _id: Aries import id
        # returns aries import document with given id
        return self.context.aries_import_collection.find_one({'_id': ObjectId(_id)})

    def _get_gcp_name_dic(self, file_imports_document):
        gcp_name_dic = {}
        # need to use file reference to get file_document
        csv_name_dic = {
            "AC_DAILY": 'acDaily',
            "AC_ECONOMIC": 'acEconomic',
            "AC_PRODUCT": 'acProduct',
            "AC_PROPERTY": 'acProperty',
            "AC_SCENARIO": 'acScenario',
            "AC_SETUP": 'acSetup',
            "AC_SETUPDATA": 'acSetupdata',
            "AR_SIDEFILE": 'arSidefile',
            "ARENDDATE": 'arEnddate',
            "ARLOOKUP": 'arLookup',
            "PROJECT": 'ariesProject',
            "PROJLIST": 'projlist'
        }
        for csv_table_name in csv_name_dic:
            # extract file from gc
            _id = file_imports_document['files'][csv_name_dic[csv_table_name]]['file']
            gcp_name = self.context.file_service.get_file(_id).to_mongo().to_dict()['gcpName']
            gcp_name_dic[csv_table_name] = gcp_name

        return gcp_name_dic

    def get_suggest_header(self, aries_imports_id):
        # Inputs:
        # aries_import_id: id of associated aries import
        # retrieves files from gc for the cc relevant tables, passes the information to create a AriesDataExtraction
        # object, which has methods for suggesting user maps
        # returns dictionary with keys ("wells", "daily" and "monthly") representing the suggested mapping for
        # well info, daily well values and monthly well values

        # do stuff with self.context
        # store aries import document from associated id into file_imports_document
        file_imports_document = self.get_aries_import_document(aries_imports_id)
        # store user id from imported document into user_id
        user_id = file_imports_document['user']
        # get file from relevant keys ('AC Daily, AC_PRODUCT, AC_PROPERTY, AC_SETUP...from GCP)
        gcp_name_dic = self._get_gcp_name_dic(file_imports_document)

        # create parallel_dic dictionary with values of all keys set to None except batch number which is set to 0
        parallel_dic = {
            'partial_well_propnum': None,
            'user_scenarios_id': None,
            'user_forecasts_id': None,
            'batch_number': 0
        }
        # create AriesDateExtraction object named aries_data_extraction_obj
        aries_data_extraction_obj = AriesDataExtraction(user_id, gcp_name_dic, self.context, parallel_dic)
        # get suggested well_header for well header (AC_PROPERTY)
        wells_header_dic = aries_data_extraction_obj.get_combocurve_suggest_wells_mapping_for_user()
        # get suggested well_header for daily well values (AC_DAILY)
        daily_header_dic = aries_data_extraction_obj.get_combocurve_suggest_well_days_mapping_for_user()
        # get suggested well_header for monthly well values (AC_PRODUCT)
        monthly_header_dic = aries_data_extraction_obj.get_combocurve_suggest_well_months_mapping_for_user()

        # create dictionary that stores the suggested headers for the three cases (AC_PROPERTY, AC_DAILY & AC_PRODUCT)
        suggest_header_dic = {}
        suggest_header_dic['wells'] = wells_header_dic
        suggest_header_dic['daily'] = daily_header_dic
        suggest_header_dic['monthly'] = monthly_header_dic

        return suggest_header_dic

    def get_projects_list(self, aries_imports_id):
        # do stuff with self.context
        # store aries import document from associated id into file_imports_document
        file_imports_document = self.get_aries_import_document(aries_imports_id)
        # store user id from imported document into user_id
        user_id = file_imports_document['user']
        # get file from relevant keys ('AC Daily, AC_PRODUCT, AC_PROPERTY, AC_SETUP...from GCP)
        gcp_name_dic = self._get_gcp_name_dic(file_imports_document)
        # create parallel_dic dictionary with values of all keys set to None except batch number which is set to 0
        parallel_dic = {
            'partial_well_propnum': None,
            'user_scenarios_id': None,
            'user_forecasts_id': None,
            'batch_number': 0
        }
        # create AriesDateExtraction object named aries_data_extraction_obj
        aries_data_extraction_obj = AriesDataExtraction(user_id, gcp_name_dic, self.context, parallel_dic)
        # gets list of project names
        ls_all_projects = aries_data_extraction_obj.get_project_name_for_user()
        # returns list of projects
        return ls_all_projects

    def prepare_aries_import(self, aries_imports_id):
        # combine get_suggest_header, get_projects_list, get_scenarios_list
        # store aries import document from associated id into file_imports_document
        file_imports_document = self.get_aries_import_document(aries_imports_id)
        # store user id from imported document into user_id
        user_id = file_imports_document['user']
        # get file from relevant keys ('AC Daily, AC_PRODUCT, AC_PROPERTY, AC_SETUP...from GCP)
        gcp_name_dic = self._get_gcp_name_dic(file_imports_document)
        # create parallel_dic dictionary with values of all keys set to None except batch number which is set to 0
        parallel_dic = {
            'partial_well_propnum': None,
            'user_scenarios_id': None,
            'user_forecasts_id': None,
            'batch_number': 0
        }
        # create AriesDateExtraction object named aries_data_extraction_obj
        aries_data_extraction_obj = AriesDataExtraction(user_id, gcp_name_dic, self.context, parallel_dic)
        # get suggested mapping for well info (AC_PROPERTY)
        wells_header_dic = aries_data_extraction_obj.get_combocurve_suggest_wells_mapping_for_user()
        # get suggested mapping for daily well values (AC_DAILY)
        daily_header_dic = aries_data_extraction_obj.get_combocurve_suggest_well_days_mapping_for_user()
        # get suggested mapping for monthly well values (AC_PRODUCT)
        monthly_header_dic = aries_data_extraction_obj.get_combocurve_suggest_well_months_mapping_for_user()
        # gets project names from PROJECT_df
        ls_all_projects = aries_data_extraction_obj.get_project_name_for_user()
        # gets the unique "SCEN_NAME"s from the AC_SCENARIO_df
        ls_all_scenarios = aries_data_extraction_obj.get_scenario_name_for_user()

        # create empty dictionary aries_prepare_dict
        aries_prepare_dict = {}
        # store suggested well info headers in key "wells" of the aries_prepare_dict dictionary
        aries_prepare_dict['wells'] = wells_header_dic
        # store suggested daily well values in key "daily" of the aries_prepare_dict dictionary
        aries_prepare_dict['daily'] = daily_header_dic
        # store suggested monthly well values in key "monthly" of the aries_prepare_dict dictionary
        aries_prepare_dict['monthly'] = monthly_header_dic
        # store project names in key "projects" of the aries_prepare_dict dictionary
        aries_prepare_dict['projects'] = ls_all_projects
        # store unique "SCEN_NAME"s in key "scenarios" of the aries_prepare_dict dictionary
        aries_prepare_dict['scenarios'] = ls_all_scenarios
        # returns the created dictionary
        return aries_prepare_dict

    def start_aries_import_parallel(self, aries_imports_id):
        batch_size = 100  # number of wells in one batch
        # do stuff with self.context
        # store aries import document from associated id into file_imports_document
        file_imports_document = self.get_aries_import_document(aries_imports_id)
        # store user id from imported document into user_id
        user_id = file_imports_document['user']
        # store project id from imported document into user_project_id
        user_project_id = file_imports_document['project']
        # store aries project name in user_select_project_name_ls
        user_select_project_name_ls = file_imports_document['ariesProject']
        # store aries scenario name in user_select_scenario_name_ls
        user_select_scenario_name_ls = file_imports_document['ariesScenario']
        # get data from all tables and store in files
        files = file_imports_document['files']
        # get mappings
        user_wells_header_dic = files['acProperty']['mapping']
        user_daily_header_dic = files['acDaily']['mapping']
        user_monthly_header_dic = files['acProduct']['mapping']

        gcp_name_dic = self._get_gcp_name_dic(file_imports_document)

        ls_all_well_propnum = self._get_all_well_propnum(user_id, gcp_name_dic, user_wells_header_dic,
                                                         user_daily_header_dic, user_monthly_header_dic)

        # generator object
        batchs_ls_all_well_propnum = self._batchs(ls_all_well_propnum, batch_size)
        scenarios_document_id = ObjectId()
        forecasts_document_id = ObjectId()
        batch_number = 0

        for batch_propnum_ls in batchs_ls_all_well_propnum:
            parallel_dic = {
                'partial_well_propnum': batch_propnum_ls,
                'user_scenarios_id': scenarios_document_id,
                'user_forecasts_id': forecasts_document_id,
                'batch_number': batch_number
            }

            aries_data_extraction_obj = AriesDataExtraction(user_id, gcp_name_dic, self.context, parallel_dic)
            aries_data_extraction_obj.pre_process()
            aries_data_extraction_obj.set_chosen_project_name_for_combocurve(user_select_project_name_ls,
                                                                             user_project_id)
            aries_data_extraction_obj.set_chosen_scenario_name_for_combocurve(user_select_scenario_name_ls)
            aries_data_extraction_obj.set_user_define_wells_mapping_for_combocurve(user_wells_header_dic)
            aries_data_extraction_obj.set_user_define_well_days_mapping_for_combocurve(user_daily_header_dic)
            aries_data_extraction_obj.set_user_define_well_months_mapping_for_combocurve(user_monthly_header_dic)
            aries_data_extraction_obj.execute()

            batch_number += 1

        self._final_clean_step_after_parallel(user_id, gcp_name_dic, user_select_project_name_ls, user_project_id)

    def _get_all_well_propnum(self, user_id, gcp_name_dic, user_wells_header_dic, user_daily_header_dic,
                              user_monthly_header_dic):
        # get all well propnum from AC_PROPERTY, AC_ECONOMIC, AC_DAILY, AC_PRODUCT
        parallel_dic = {
            'partial_well_propnum': None,
            'user_scenarios_id': None,
            'user_forecasts_id': None,
            'batch_number': 0
        }

        aries_data_extraction_obj = AriesDataExtraction(user_id, gcp_name_dic, self.context, parallel_dic)
        aries_data_extraction_obj.set_user_define_wells_mapping_for_combocurve(user_wells_header_dic)
        aries_data_extraction_obj.set_user_define_well_days_mapping_for_combocurve(user_daily_header_dic)
        aries_data_extraction_obj.set_user_define_well_months_mapping_for_combocurve(user_monthly_header_dic)
        # get all well_ids AC_PROPERTY, AC_PRODUCT, AC_
        ls_all_well_propnum = aries_data_extraction_obj.get_all_well_propnum()

        return ls_all_well_propnum

    def _batchs(self, lst, n):
        # yield successive n-sized batchs from lst
        for i in range(0, len(lst), n):
            yield lst[i:i + n]

    # helper function only for test parallel importing
    def _batchs_ls(self, lst, n):
        # return successive n-sized batchs append in ls
        ls = []
        for i in range(0, len(lst), n):
            ls.append(lst[i:i + n])
        return ls

    def _final_clean_step_after_parallel(self, user_id, gcp_name_dic, user_select_project_name_ls, user_project_id):
        # final clean step after parallel process
        # 1. update project
        # update project only in the end of parallel process
        parallel_dic = {
            'partial_well_propnum': None,
            'user_scenarios_id': None,
            'user_forecasts_id': None,
            'batch_number': 0
        }
        aries_data_extraction_obj = AriesDataExtraction(user_id, gcp_name_dic, self.context, parallel_dic)
        aries_data_extraction_obj.pre_process()
        aries_data_extraction_obj.set_chosen_project_name_for_combocurve(user_select_project_name_ls, user_project_id)
        aries_data_extraction_obj.update_models_id_and_wells_id_to_project()

    # helper function only for test parallel importing
    def start_aries_import_parallel_multi_thread(self, aries_imports_id):
        # set how many parallel node use for import test
        node_number = 2
        # do stuff with self.context
        file_imports_document = self.get_aries_import_document(aries_imports_id)
        user_id = file_imports_document['user']
        user_project_id = file_imports_document['project']
        user_select_project_name_ls = file_imports_document['ariesProject']
        user_select_scenario_name_ls = file_imports_document['ariesScenario']
        files = file_imports_document['files']
        user_wells_header_dic = files['acProperty']['mapping']
        user_daily_header_dic = files['acDaily']['mapping']
        user_monthly_header_dic = files['acProduct']['mapping']

        gcp_name_dic = self._get_gcp_name_dic(file_imports_document)

        ls_all_well_propnum = self._get_all_well_propnum(user_id, gcp_name_dic, user_wells_header_dic,
                                                         user_daily_header_dic, user_monthly_header_dic)

        # _batchs_ls will return partial propnum list in list
        batch_size = int(np.ceil(len(ls_all_well_propnum) / node_number))
        batchs_ls_all_well_propnum = self._batchs_ls(ls_all_well_propnum, batch_size)
        scenarios_document_id = ObjectId()
        forecasts_document_id = ObjectId()

        # batch_number = 0

        def import_thread(batch_propnum_ls, scenarios_document_id, forecasts_document_id, batch_number, user_id,
                          gcp_name_dic, user_select_project_name_ls, user_project_id, user_select_scenario_name_ls,
                          user_wells_header_dic, user_daily_header_dic, user_monthly_header_dic):
            self._parallel_import_batch_process(batch_propnum_ls, scenarios_document_id, forecasts_document_id,
                                                batch_number, user_id, gcp_name_dic, user_select_project_name_ls,
                                                user_project_id, user_select_scenario_name_ls, user_wells_header_dic,
                                                user_daily_header_dic, user_monthly_header_dic)

        thread_1 = Thread(target=import_thread,
                          args=(batchs_ls_all_well_propnum[0], scenarios_document_id, forecasts_document_id, 0, user_id,
                                gcp_name_dic, user_select_project_name_ls, user_project_id,
                                user_select_scenario_name_ls, user_wells_header_dic, user_daily_header_dic,
                                user_monthly_header_dic))
        thread_2 = Thread(target=import_thread,
                          args=(batchs_ls_all_well_propnum[1], scenarios_document_id, forecasts_document_id, 1, user_id,
                                gcp_name_dic, user_select_project_name_ls, user_project_id,
                                user_select_scenario_name_ls, user_wells_header_dic, user_daily_header_dic,
                                user_monthly_header_dic))
        # thread_3 = Thread(target=import_thread,
        #                   args=(batchs_ls_all_well_propnum[2], scenarios_document_id, forecasts_document_id, 2,
        #                         ser_id,
        #                         gcp_name_dic, user_select_project_name_ls, user_project_id,
        #                         user_select_scenario_name_ls, user_wells_header_dic, user_daily_header_dic,
        #                         user_monthly_header_dic))

        thread_1.start()
        thread_2.start()
        # thread_3.start()

        while thread_1.isAlive() or thread_2.isAlive():
            pass

        self._final_clean_step_after_parallel(user_id, gcp_name_dic, user_select_project_name_ls, user_project_id)

    # helper function only for test parallel importing
    def _parallel_import_batch_process(self, batch_propnum_ls, scenarios_document_id, forecasts_document_id,
                                       batch_number, user_id, gcp_name_dic, user_select_project_name_ls,
                                       user_project_id, user_select_scenario_name_ls, user_wells_header_dic,
                                       user_daily_header_dic, user_monthly_header_dic):
        parallel_dic = {
            'partial_well_propnum': batch_propnum_ls,
            'user_scenarios_id': scenarios_document_id,
            'user_forecasts_id': forecasts_document_id,
            'batch_number': batch_number
        }

        aries_data_extraction_obj = AriesDataExtraction(user_id, gcp_name_dic, self.context, parallel_dic)
        aries_data_extraction_obj.pre_process()
        aries_data_extraction_obj.set_chosen_project_name_for_combocurve(user_select_project_name_ls, user_project_id)
        aries_data_extraction_obj.set_chosen_scenario_name_for_combocurve(user_select_scenario_name_ls)
        aries_data_extraction_obj.set_user_define_wells_mapping_for_combocurve(user_wells_header_dic)
        aries_data_extraction_obj.set_user_define_well_days_mapping_for_combocurve(user_daily_header_dic)
        aries_data_extraction_obj.set_user_define_well_months_mapping_for_combocurve(user_monthly_header_dic)
        aries_data_extraction_obj.execute()
    '''

    #### functions for preparation work before start import
    def get_file_by_category(self, aries_files, category):
        file_cat_list = [f for f in aries_files if f['category'] == category]
        if len(file_cat_list) == 0:
            return None
        else:
            return file_cat_list[0]

    def get_daily_dict_from_phdwin_files(self, phdwin_import):
        files = phdwin_import['files']
        prod_dict = [f['mapping'] for f in files if f['category'] == 'well_count']

        if len(prod_dict) == 0:
            return ({}, {}, {}, {})
        else:
            return (prod_dict[0]['daily_start'], prod_dict[0]['daily_end'], prod_dict[0]['monthly_start'],
                    prod_dict[0]['monthly_end'])

    def _to_dict_with_files(self, aries_import):
        aries_import_dict = aries_import.to_mongo().to_dict()
        aries_import_files = aries_import_dict['files']

        for f in aries_import_files:
            file_id = f['file']
            f['file'] = self.context.file_service.get_file(file_id).to_mongo().to_dict()

        return aries_import_dict

    def get_aries_import(self, import_id):
        return self.context.file_import_model.objects.get(id=import_id)

    def get_aries_import_with_files(self, import_id):
        return self._to_dict_with_files(self.get_aries_import(import_id))

    def get_user_aries_imports(self, user_id):
        files = list(
            self.context.file_import_model.objects(user=user_id, importType='aries').order_by('-events.0.date'))
        return [self._to_dict_with_files(f) for f in files]

    def create_aries_import(self, user_id, description):
        def get_default_description():
            return f'Aries Import - {datetime.datetime.now().strftime("%m/%d/%Y %I:%M:%S %p")}'

        fields = {
            'user': user_id,
            'description': description if description else get_default_description(),
            'dataSource': 'aries',  # this dataSource allowed us to use get_auto_mapping function
            'status': 'created',
            'importType': 'aries',
            'createdAt': datetime.datetime.utcnow(),
            'events': [{
                'type': 'created',
                'date': datetime.datetime.utcnow()
            }],
        }

        return self.context.file_import_model(**clean_dict(fields)).save().to_mongo().to_dict()

    def create_phdwin_import(self, user_id, description):
        def get_default_description():
            return f'PHDWIN Import - {datetime.datetime.now().strftime("%m/%d/%Y %I:%M:%S %p")}'

        fields = {
            'user': user_id,
            'description': description if description else get_default_description(),
            'dataSource': 'phdwin',  # this dataSource allowed us to use get_auto_mapping function
            'status': 'created',
            'importType': 'phdwin',
            'createdAt': datetime.datetime.utcnow(),
            'events': [{
                'type': 'created',
                'date': datetime.datetime.utcnow()
            }],
        }

        return self.context.file_import_model(**clean_dict(fields)).save().to_mongo().to_dict()

    def add_files_to_aries_import(self, import_id, files):
        aries_import = self.get_aries_import(import_id)

        def get_file(category):
            f = first_or_default(files, lambda f: f['category'] == category)
            if f is None:
                return None
            size_limit = self.context.file_import_service.get_file_size_limit(aries_import.importType)
            if f['mbSize'] > size_limit:
                raise InvalidFileSizeError(f"Size of \"{f['category']}\" exceeds limit of {size_limit} MB.")
            return self.context.file_import_file_model(file=f['_id'])

        aries_import_files = aries_import.files

        for f in files:
            f_cat = f['category']
            aries_file = get_file(f_cat)  # this function can return None
            if aries_file:
                aries_file.category = f_cat
                aries_file.headers = self.context.file_import_service._get_file_headers(aries_file)
            aries_import_files.append(aries_file)

        aries_import.change_status('mapping')

        return aries_import.save().to_mongo().to_dict()

    def create_default_table(self, csv_file, table_cat):
        csv_writer = csv.writer(csv_file)

        has_default = True

        if table_cat == AriesFilesEnum.ac_daily.value:
            csv_writer.writerow(DEFAULT_DAILY_HEADERS)
        elif table_cat == AriesFilesEnum.ac_product.value:
            csv_writer.writerow(DEFAULT_MONTHLY_HEADERS)
        elif table_cat == AriesFilesEnum.ar_enddate.value:
            csv_writer.writerow(DEFAULT_ARENDDATE_HEADERS)
        elif table_cat == AriesFilesEnum.ecophase.value:
            csv_writer.writerow(DEFAULT_ECOPHASE_HEADERS)
        elif table_cat == AriesFilesEnum.arsystbl.value:
            csv_writer.writerow(DEFAULT_ARSYSTBL_HEADERS)
        elif table_cat == AriesFilesEnum.dbslist.value:
            csv_writer.writerow(DEFAULT_DBSLIST_HEADERS)
        else:
            has_default = False

        return has_default

    EXPECTED_NUM_OF_PHDWIN_TABLES = 75

    def parse_phdwin_to_csv(self, import_id, files, user_id, socket_name):
        phz_file = files[0]
        tps_dir = 'api/aries_phdwin_imports/tps-to-csv/tps-to-csv.jar'
        gcp_name = phz_file['gcpName']
        file_name = phz_file['name']
        date_time_str = str(datetime.datetime.utcnow())
        downloaded_file_name = clean_up_file_name(str(import_id) + '--' + file_name)

        phdwin_import = self.get_aries_import(import_id)
        phdwin_import_files = phdwin_import.files

        # file from storage
        dir_path = f'/tmp/{import_id}'
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)

        phdwin_file_path = f'{dir_path}/{downloaded_file_name}'
        self.context.file_service.download_file(gcp_name, phdwin_file_path)

        with zipfile.ZipFile(phdwin_file_path, 'r') as zip:
            zip.extractall(dir_path)

        phd_files = os.listdir(dir_path)

        self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, socket_name, {'progress': 20})

        if all(any(str(phd_file).lower().endswith(f_type) for phd_file in phd_files) for f_type in ['.mod', '.phd']):
            # rename the .phd and .mod files to remove spaces
            phd_file_dict = {
                phd_file: str(phd_file).lower().replace(' ', '_').replace('&', '_').replace('(', '_').replace(')', '_')
                for phd_file in phd_files
                if str(phd_file).lower().endswith('.mod') or str(phd_file).lower().endswith('.phd')
            }

            for old_file_name, new_file_name in phd_file_dict.items():
                os.rename(f'{dir_path}/{old_file_name}', f'{dir_path}/{new_file_name}')

            try:
                for idx, file in enumerate(phd_file_dict.values()):
                    os.system(' '.join(
                        ['java', '-jar', tps_dir, '-s', f'{dir_path}/{file}', '-t', f'{dir_path}/test.csv', '-direct']))
                self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, socket_name, {'progress': 60})
                change_name(dir_path)

                valid, missing_table = check_for_phdwin_required_tables(dir_path)

                if valid:
                    for phdwin_table in ALL_PHDWIN_TABLES:
                        csv_name = f'{file_name}--{phdwin_table}.csv'
                        csv_gcp_name = f'{csv_name}--{date_time_str}.csv'
                        if phdwin_table in PHDWIN_RQD_MOD_TABLES:
                            if f'test.{phdwin_table}.csv' not in os.listdir(dir_path):
                                export_csv_path = f'{dir_path}/test.O{phdwin_table}.csv'
                            else:
                                export_csv_path = f'{dir_path}/test.{phdwin_table}.csv'
                        else:
                            export_csv_path = f'{dir_path}/test.{phdwin_table}.csv'

                        max_size = FORECAST_SIZE_LIMIT_DICT.get(phdwin_table)
                        max_size = max_size if max_size is not None else MAX_PHDWIN_SIZE_LIMIT
                        if os.path.getsize(export_csv_path) > max_size:
                            table_descr = PHDWIN_TABLE_DESCR_DICT.get(phdwin_table)
                            table_descr = table_descr if phdwin_table is not None else 'One or more tables'
                            raise ParsingPHDWinFileError(f'{table_descr} in PHDWIN file too large')

                        content_type = 'application/CSV'
                        csv_file_info = {'gcpName': csv_gcp_name, 'type': content_type, 'name': csv_name}

                        file_db_document = self.context.file_service.upload_file_from_path(
                            file_path=export_csv_path,
                            file_data=csv_file_info,
                        )
                        phdwin_file = self.context.file_import_file_model(file=file_db_document['_id'])
                        phdwin_file.category = phdwin_table

                        setattr(phdwin_import, phdwin_table, phdwin_file)

                        phdwin_import_files.append(phdwin_file)
                    self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, socket_name,
                                                             {'progress': 60})
                    act_df = pd.read_csv(f'{dir_path}/test.ACT.csv', encoding=PHDWIN_PD_ENCODING)
                    idc_df = pd.read_csv(f'{dir_path}/test.IDC.csv', encoding=PHDWIN_PD_ENCODING)
                    pnf_df = pd.read_csv(f'{dir_path}/test.PNF.csv', encoding=PHDWIN_PD_ENCODING)
                    vol_df = pd.read_csv(f'{dir_path}/test.VOL.csv', encoding=PHDWIN_PD_ENCODING)
                    cla_df = pd.read_csv(f'{dir_path}/test.CLA.csv', encoding=PHDWIN_PD_ENCODING)
                    cat_df = pd.read_csv(f'{dir_path}/test.CAT.csv', encoding=PHDWIN_PD_ENCODING)
                    dat_df = pd.read_csv(f'{dir_path}/test.DAT.csv', encoding=PHDWIN_PD_ENCODING)
                    tst_df = pd.read_csv(f'{dir_path}/test.TST.csv', encoding=PHDWIN_PD_ENCODING)
                    zon_df = pd.read_csv(f'{dir_path}/test.ZON.csv', encoding=PHDWIN_PD_ENCODING)
                    grp_df = pd.read_csv(f'{dir_path}/test.GRP.csv', encoding=PHDWIN_PD_ENCODING)

                    phdwin_import.ariesSetting['allScenarios'] = grp_df['Grp Desc'].astype(str).unique().tolist()

                    well_prod_files = get_well_and_prod_date(act_df, idc_df, pnf_df, zon_df, vol_df, cla_df, cat_df,
                                                             dat_df, tst_df, self.context, user_id, socket_name)
                    for idx, file in enumerate(well_prod_files[:-4]):
                        file_path = f'{dir_path}/WELL_{idx}.csv'
                        if idx == 0:
                            file = file[list(PHDWIN_HEADER_FILE_MAPPING.values())]
                        elif idx in [1, 2]:
                            file = file[list(PHDWIN_MONTHLY_PROD_FILE_MAPPING.values())]

                        file.to_csv(file_path, index=False)

                        csv_name = f'{file_name}--WELL_{idx}.csv'
                        csv_gcp_name = f'{csv_name}--{date_time_str}.csv'
                        content_type = 'application/CSV'
                        csv_file_info = {'gcpName': csv_gcp_name, 'type': content_type, 'name': csv_name}

                        file_db_document = self.context.file_service.upload_file_from_path(
                            file_path=file_path,
                            file_data=csv_file_info,
                        )

                        phdwin_file = self.context.file_import_file_model(file=file_db_document['_id'])

                        if str(idx) in PHDWIN_IMPORT_TO_FILE_IMPORT:
                            if idx == 0:
                                phdwin_file.mapping = PHDWIN_HEADER_FILE_MAPPING
                            else:
                                phdwin_file.mapping = PHDWIN_MONTHLY_PROD_FILE_MAPPING
                            setattr(phdwin_import, PHDWIN_IMPORT_TO_FILE_IMPORT[str(idx)], phdwin_file)
                        else:
                            phdwin_file.category = 'well_count'
                            phdwin_file.mapping = {
                                'daily_start': well_prod_files[-4],
                                'daily_end': well_prod_files[-3],
                                'monthly_start': well_prod_files[-2],
                                'monthly_end': well_prod_files[-1]
                            }
                            setattr(phdwin_import, 'well_count', phdwin_file)
                            phdwin_import_files.append(phdwin_file)
                    phdwin_import.change_status('mapped')

                    self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, socket_name,
                                                             {'progress': 99})

                    return phdwin_import.save().to_mongo().to_dict()

                else:
                    error_message = f'Missing required table: {missing_table}'
                    raise ParsingPHDWinFileError(error_message)
            except Exception as e:
                error_info = get_exception_info(e)
                logging.warning(error_info['message'], extra={'metadata': error_info})

                # remove uploaded csv file and extra file (if exists)
                file_docs = self.context.file_service.get_files([f.file for f in phdwin_import_files])
                for f in file_docs:
                    self.context.file_service.delete_file(f.gcpName)

                if error_info['expected']:
                    raise e
                else:
                    raise ParsingPHDWinFileError('Failed to parse Phdwin file')

            finally:
                # remove created local folder for csv files
                shutil.rmtree(dir_path)

                # remove aries db file, need to keep extra file if uploaded for future process
                self.context.file_service.delete_file(gcp_name)
        else:
            ParsingPHDWinFileError('MISSING MOD and/or PHD FILE')

    def parse_aries_to_csv(self, import_id, files, user_id, socket_name):  # noqa (C901)
        aries_db_file = files[0]

        gcp_name = aries_db_file['gcpName']
        file_name = aries_db_file['name']
        date_time_str = str(datetime.datetime.utcnow())
        downloaded_file_name = clean_up_file_name(str(import_id) + '--' + file_name)

        aries_import = self.get_aries_import(import_id)
        aries_import_files = aries_import.files

        # file from storage
        dir_path = f'/tmp/{import_id}'
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)

        aries_file_path = f'{dir_path}/{downloaded_file_name}'
        self.context.file_service.download_file(gcp_name, aries_file_path)

        try:
            # add extra file to aries_import.files if uploaded
            if len(files) == 2:
                extra_file = files[-1]
                aries_extra_file = self.context.file_import_file_model(file=extra_file['_id'])
                aries_extra_file.category = 'extraFile'
                aries_import_files.append(aries_extra_file)

            # get table name
            aries_file_names = list(ARIES_FILES_LABEL.values())
            file_name_to_category = {ARIES_FILES_LABEL[k]: k.value for k in ARIES_FILES_LABEL}

            table_name = 'ARSYSTBL'
            export_csv_path = f'{dir_path}/{table_name}.csv'
            csv_file = open(export_csv_path, 'w')

            return_code = os.system(' '.join(
                ['mdb-export', '-T', '%F', aries_file_path, table_name, '>', export_csv_path]))

            alias_conv_dict = {}
            if return_code == 0:
                arsystbl_df = pd.read_csv(export_csv_path, na_filter=False)
                arsystbl_df.columns = [str(header).upper() for header in arsystbl_df.columns]
                if not arsystbl_df.empty and 'TABLENAME' in arsystbl_df.columns:
                    for table_name in arsystbl_df['TABLENAME']:
                        if str(table_name).strip().upper() not in aries_file_names:
                            file_name_to_category[table_name] = f'{table_name.lower()}_%%_aries_custom'
                            aries_file_names.append(table_name)

                # alias conv dict creates mapping from ARIES defined table to CC expected table
                # check if arsystable is not empty and TBL_ALIAS and TABLENAME column in dataframe
                if not arsystbl_df.empty and all(column in arsystbl_df.columns
                                                 for column in ['TBL_ALIAS', 'TABLENAME']):
                    # Loop through dataframe
                    for idx, row in arsystbl_df.iterrows():
                        # get table alias and table name value from each row
                        row_tbl_alias = str(row.TBL_ALIAS).strip().upper()
                        row_tbl_name = str(row.TABLENAME).strip().upper()
                        # if the table_alias in ALIAS TABLE DICT DEFINED and the table name is not in rqd table
                        # this signifies that the name for that required table is different from the name expected by CC
                        if row_tbl_alias in ALIAS_TBL_DICT and row_tbl_name not in list(ARIES_FILES_LABEL.values()):
                            # use the expected table name as key and actual table name as value
                            alias_conv_dict[ALIAS_TBL_DICT.get(row_tbl_alias)] = row_tbl_name

            self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, socket_name, {'progress': 10})

            len_csv_files = len(aries_file_names)
            file_progress = 80 / len_csv_files

            for idx, table_name in enumerate(aries_file_names, start=1):
                table_cat = file_name_to_category[table_name]

                csv_name = f'{file_name}--{table_name}.csv'
                csv_gcp_name = f'{csv_name}--{date_time_str}.csv'
                export_csv_path = f'{dir_path}/{table_name}.csv'

                use_table_name = table_name if table_name not in alias_conv_dict else alias_conv_dict.get(table_name)

                return_code = os.system(' '.join(
                    ['mdb-export', '-T', '%F', aries_file_path, use_table_name, '>', export_csv_path]))

                if return_code != 0:
                    # returncode is not 0 means the csv file is empty, create default table if possible
                    csv_file = open(export_csv_path, 'w')
                    has_default = self.create_default_table(csv_file, table_cat)
                    if not has_default:
                        csv_file.close()  # close when no default
                        continue
                csv_file.close()

                # upload csv to cloud
                content_type = 'application/CSV'
                csv_file_info = {'gcpName': csv_gcp_name, 'type': content_type, 'name': csv_name}

                file_db_document = self.context.file_service.upload_file_from_path(
                    file_path=export_csv_path,
                    file_data=csv_file_info,
                )

                # aries import files
                aries_file = self.context.file_import_file_model(file=file_db_document['_id'])
                aries_file.category = table_cat

                # field not in schema, used for error message, won't insert to db
                aries_file.aries_table_name = table_name

                # handle unhandleable encoding
                try:
                    csv_file = open(export_csv_path, "r")
                    csv_reader = csv.reader(csv_file)
                    column_names = next(csv_reader)
                    csv_file.close()
                except UnicodeDecodeError:
                    continue

                aries_file.headers = column_names
                aries_import_files.append(aries_file)

                if table_cat in ARIES_IMPORT_TO_FILE_IMPORT:
                    # create file import fields
                    setattr(aries_import, ARIES_IMPORT_TO_FILE_IMPORT[table_cat], aries_file)

                if table_cat == AriesFilesEnum.ac_scenario.value:
                    scenario_df = pd.read_csv(export_csv_path, na_filter=False)
                    scenario_df.columns = [str(column).strip().upper() for column in scenario_df.columns]
                    aries_import.ariesSetting['allScenarios'] = scenario_df['SCEN_NAME'].unique().tolist()
                elif table_cat == AriesFilesEnum.ac_setup.value:
                    setup_df = pd.read_csv(export_csv_path, na_filter=False)
                    setup_df.columns = [str(column).strip().upper() for column in setup_df.columns]
                    aries_import.ariesSetting['allSetups'] = setup_df['SETUPNAME'].astype(str).unique().tolist()
                elif table_cat == AriesFilesEnum.ac_property.value:
                    well_header_df = pd.read_csv(export_csv_path, na_filter=False)
                    aries_import.ariesSetting['wellCount'] = len(well_header_df)

                # update progress
                self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, socket_name,
                                                         {'progress': 10 + idx * file_progress})

            # check for missing tables
            created_tables = [f.aries_table_name for f in aries_import_files if hasattr(f, 'aries_table_name')]
            missing_tables = [t for t in ARIES_FILES_LABEL.values() if t not in created_tables]
            if len(missing_tables) > 0:
                error_message = 'Missing required table: ' + ', '.join(missing_tables)
                raise ParsingAriesFileError(error_message)

            aries_import.change_status('mapping')

            self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, socket_name, {'progress': 99})

            return aries_import.save().to_mongo().to_dict()

        except Exception as e:
            error_info = get_exception_info(e)
            logging.warning(error_info['message'], extra={'metadata': error_info})

            # remove uploaded csv file and extra file (if exists)
            file_docs = self.context.file_service.get_files([f.file for f in aries_import_files])
            for f in file_docs:
                self.context.file_service.delete_file(f.gcpName)

            if error_info['expected']:
                raise e
            else:
                raise ParsingAriesFileError('Failed to parse Aries file')

        finally:
            # remove created local folder for csv files
            shutil.rmtree(dir_path)

            # remove aries db file, need to keep extra file if uploaded for future process
            self.context.file_service.delete_file(gcp_name)

    def update_file_mapping(self, import_id, body):
        aries_import = self.get_aries_import(import_id)

        # for aries import
        aries_import_files = aries_import.files
        aries_import_file = self.get_file_by_category(aries_import_files, body['category'])
        aries_import_file.mapping = body['mapping']

        # for file import
        file_import_file = aries_import[ARIES_IMPORT_TO_FILE_IMPORT[body['category']]]
        file_import_file.mapping = body['mapping']

        aries_import.save()

    def set_file_chosen_id_map(self, file_import_file):
        headers = file_import_file.headers
        mapping = file_import_file.mapping
        cat = file_import_file.category

        chosen_id = WellHeaderEnum.chosen_id.value
        propnum = WellHeaderEnum.propnum.value

        propnum_key = None
        for h in headers:
            if h.strip().upper() == propnum:
                propnum_key = h

        if propnum_key:
            mapping[chosen_id] = propnum_key
        else:
            raise InvalidMappingError(f'{propnum} column does not exist in {cat}')

    def _check_mappings(self, aries_import):
        aries_import_files = aries_import.files

        for table_cat, f in ARIES_IMPORT_TO_FILE_IMPORT.items():
            # set aries import file chosen id
            aries_file = self.get_file_by_category(aries_import_files, table_cat)
            self.set_file_chosen_id_map(aries_file)
            # set file import file chosen id
            self.set_file_chosen_id_map(aries_import[f])

        aries_import.save()

        check_mappings(aries_import)

    def finish_file_mapping(self, import_id, description=None):
        aries_import = self.get_aries_import(import_id)
        self._check_mappings(aries_import)
        if description is not None:
            aries_import.description = description
        aries_import.change_status('mapped')

        return self._to_dict_with_files(aries_import.save())

    def set_project(self, import_id, body):
        project = body.get('project')
        aries_import = self.get_aries_import(import_id)
        aries_import.project = project
        aries_import.replace_production = True
        return self._to_dict_with_files(aries_import.save())

    def save_aries_setting(self, import_id, body):
        aries_import = self.get_aries_import(import_id)
        aries_import.ariesSetting = {
            **aries_import.ariesSetting,
            'userId': body['user'],
            'notificationId': body['notificationId'],
            'onlyForecast': body.get('onlyForecast', False),
            'createElts': body.get('createElts', False),
            'scenarios': body.get('scenarios', []),
            'setups': body.get('setups', []),
        }
        aries_import.save()

    def save_phdwin_setting(self, import_id, body):
        phdwin_import = self.get_aries_import(import_id)
        phdwin_import.ariesSetting = {
            **phdwin_import.ariesSetting,
            'userId': body['user'],
            'notificationId': body['notificationId'],
            'scenarios': body.get('scenarios', []),
        }

        phdwin_import.save()

    def delete_aries_import(self, import_id):
        try:
            aries_import = self.get_aries_import(import_id)
        except self.context.file_import_model.DoesNotExist:
            raise InvalidAriesImportError("The specified file import could not be found.")

        aries_import_files = aries_import.files
        file_docs = self.context.file_service.get_files([f.file for f in aries_import_files if f and f.file])

        for f in file_docs:
            try:
                self.context.file_service.delete_file(f.gcpName)
            except Exception:
                pass

        try:
            batches = self.context.file_import_service._get_batch_blobs(import_id)
            for chunk in split_in_chunks(batches, MAX_GCS_BATCH_REQUESTS_SIZE):
                try:
                    self.context.file_import_service._batch_delete_files(chunk)
                except Exception:
                    pass
        except Exception:
            pass

        self.context.file_import_model.objects(id=import_id).delete()

    def _get_gcp_phdwin_name_dic_new(self, file_imports_document):
        gcp_name_dic = {}
        phdwin_import_files = file_imports_document['files']

        for table_name in ALL_PHDWIN_TABLES + ['well_count']:
            _id = self.get_file_by_category(phdwin_import_files, table_name)['file']
            gcp_name = self.context.file_service.get_file(_id).to_mongo().to_dict()['gcpName']
            gcp_name_dic[table_name] = gcp_name

        return gcp_name_dic

    def _get_gcp_name_dic_new(self, file_imports_document):
        gcp_name_dic = {}
        aries_import_files = file_imports_document['files']
        # need to use file reference to get file_document
        for f, csv_table_name in ARIES_FILES_LABEL.items():
            # extract file from gc
            _id = self.get_file_by_category(aries_import_files, f.value)['file']
            gcp_name = self.context.file_service.get_file(_id).to_mongo().to_dict()['gcpName']
            gcp_name_dic[csv_table_name] = gcp_name

        for aries_import_file in aries_import_files:
            if '%%_aries_custom' in aries_import_file['category']:
                # extract file from gc
                _id = self.get_file_by_category(aries_import_files, aries_import_file['category'])['file']
                gcp_name = self.context.file_service.get_file(_id).to_mongo().to_dict()['gcpName']
                table_name = str(aries_import_file['category'].split('_%%_aries_custom')[0]).upper()
                gcp_name_dic[table_name] = gcp_name

        return gcp_name_dic

    def _get_external_file(self, file_imports_document):
        extra_file_dict = {}
        aries_import_files = file_imports_document['files']

        extra_file = self.get_file_by_category(aries_import_files, 'extraFile')
        if extra_file is None:
            return extra_file_dict
        else:
            extra_file_id = extra_file['file']

        gcp_name = self.context.file_service.get_file(extra_file_id).to_mongo().to_dict()['gcpName']

        # load zip file to memory
        binary = self.context.file_service.download_to_memory(gcp_name)
        binary.seek(0)

        # process zip file
        zip_file = zipfile.ZipFile(binary, 'r')
        file_names = zip_file.namelist()
        file_names = [n for n in file_names if '.A' in n]  # only read .A file

        fail_to_read = []  # file names fail

        for f_name in file_names:
            try:
                file = zip_file.open(f_name)
                df = pd.read_csv(file, header=None, engine='python')
                extra_file_dict[f_name.rstrip('.A')] = df
            except Exception:
                fail_to_read.append(f_name)

        return extra_file_dict

    def get_scenarios_list(self, aries_imports_id):
        # store aries import document from associated id into file_imports_document
        file_imports_document = self.get_aries_import(aries_imports_id)
        # store user id from imported document into user_id
        user_id = file_imports_document['user']
        # get file from relevant keys ('AC Daily, AC_PRODUCT, AC_PROPERTY, AC_SETUP...from GCP)
        gcp_name_dic = self._get_gcp_name_dic_new(file_imports_document)
        # create parallel_dic dictionary with values of all keys set to None except batch number which is set to 0
        parallel_dic = {
            'partial_well_propnum': None,
            'user_scenarios_id': None,
            'user_forecasts_id': None,
            'batch_number': 0
        }
        # create AriesDateExtraction object named aries_data_extraction_obj
        aries_data_extraction_obj = AriesDataExtraction(user_id, gcp_name_dic, self.context, parallel_dic)
        # get the unique SCEN_NAME for all the scenarios as list
        ls_all_scenarios = aries_data_extraction_obj.get_scenario_name_for_user()
        #return list ls_all_scenarios
        return ls_all_scenarios

    def upload_error_report(self, aries_data_extraction_obj, import_id, user_id, project_id):
        run_date = datetime.datetime.utcnow()
        gcp_name = f'aries-import-error--{str(import_id)}--{run_date.isoformat()}.csv'
        content_type = 'application/CSV'

        csv_file_info = {
            'gcpName': gcp_name,
            'type': content_type,
            'name': 'ARIES import error',
            'user': ObjectId(user_id),
            'project': ObjectId(project_id)
        }

        created_file = self.context.file_service.upload_file_from_string(
            string_data=aries_data_extraction_obj.log_report.assumption_error_list.getvalue(),
            file_data=csv_file_info,
        )

        return created_file['_id']

    def start_phdwin_import(self, import_id):
        phdwin_import = self.get_aries_import(import_id)
        phdwin_setting = phdwin_import.ariesSetting

        user_id = phdwin_setting['userId']
        notification_id = phdwin_setting['notificationId']
        scenarios = phdwin_setting['scenarios']

        parallel_dic = {
            'partial_well_propnum': None,
            'user_scenarios_id': None,
            'user_forecasts_id': None,
            'batch_number': 0
        }

        try:
            status = 'phdwin_started'
            self.context.file_import_service._update_notification_and_notify_client(
                phdwin_import, status, notification_id, {
                    'status': TASK_STATUS_RUNNING,
                    'description': 'Importing PHDWIN Database...',
                    'extra.body.status': status
                })
            user_project_id = phdwin_import['project']
            user_select_project_name_ls = ['PHDWIN Project']

            gcp_name_dic = self._get_gcp_phdwin_name_dic_new(phdwin_import)

            prod_dict = self.get_daily_dict_from_phdwin_files(phdwin_import)

            progress = ProgressNotifier(self.context.pusher, notification_id, self.context.subdomain, str(user_id))
            progress.notify(1)

            phdwin_data_extraction_obj = PHDWinDataExtraction('PHDWIN Project',
                                                              ObjectId(user_id),
                                                              notification_id,
                                                              parallel_dic,
                                                              gcp_name_dic,
                                                              prod_dict,
                                                              self.context,
                                                              scenarios=scenarios,
                                                              progress=progress)
            phdwin_data_extraction_obj.set_chosen_project_name_for_combocurve(user_select_project_name_ls,
                                                                              user_project_id)
            phdwin_data_extraction_obj.execute()

            if phdwin_data_extraction_obj.log_report.has_error:
                error_report_file_id = self.upload_error_report(phdwin_data_extraction_obj, import_id, user_id,
                                                                user_project_id)
                phdwin_import.ariesSetting = {**phdwin_import.ariesSetting, 'errorReportId': error_report_file_id}
                phdwin_import.save()

            status = 'phdwin_complete'

            self.context.file_import_service._update_notification_and_notify_client(
                phdwin_import, status, notification_id, {
                    'status': TASK_STATUS_COMPLETED,
                    'description': 'PHDWIN data import completed',
                    'extra.body.status': status,
                })
        except Exception as e:
            error_info = get_exception_info(e)
            logging.error(error_info['message'], extra={'metadata': error_info})

            status = 'failed'
            self.context.file_import_service._update_notification_and_notify_client(
                phdwin_import, status, notification_id, {
                    'status': TASK_STATUS_FAILED,
                    'description': 'PHDWIN data import failed',
                    'extra.body.status': status
                })

    def start_aries_import(self, import_id):
        aries_import = self.get_aries_import(import_id)

        aries_setting = aries_import['ariesSetting']
        user_id = aries_setting['userId']  # string
        notification_id = aries_setting['notificationId']
        only_forecast = aries_setting['onlyForecast']
        scenarios = aries_setting['scenarios']
        setups = aries_setting['setups']
        create_elts = aries_setting['createElts']

        try:
            status = 'aries_started'
            self.context.file_import_service._update_notification_and_notify_client(
                aries_import, status, notification_id, {
                    'status': TASK_STATUS_RUNNING,
                    'description': 'Importing AC_ECONOMIC...',
                    'extra.body.status': status
                })

            user_project_id = aries_import['project']
            user_select_project_name_ls = ['Aries Project']
            # user_select_scenario_name_ls = aries_import['ariesScenario']

            parallel_dic = {
                'partial_well_propnum': None,
                'user_scenarios_id': None,
                'user_forecasts_id': None,
                'batch_number': 0
            }

            gcp_name_dic = self._get_gcp_name_dic_new(aries_import)
            external_file_dict = self._get_external_file(aries_import)

            aries_data_extraction_obj = AriesDataExtraction(
                ObjectId(user_id),
                gcp_name_dic,
                external_file_dict,
                self.context,
                parallel_dic,
                only_forecast,
                create_elts,
                notification_id,
            )

            aries_data_extraction_obj.pre_process()
            aries_data_extraction_obj.set_chosen_project_name_for_combocurve(user_select_project_name_ls,
                                                                             user_project_id)
            aries_data_extraction_obj.set_chosen_scenario_name_for_combocurve(scenarios)
            aries_data_extraction_obj.set_chosen_setup(setups)
            aries_data_extraction_obj.execute()

            # upload error report
            if aries_data_extraction_obj.log_report.has_error:
                error_report_file_id = self.upload_error_report(aries_data_extraction_obj, import_id, user_id,
                                                                user_project_id)
                aries_import.ariesSetting = {**aries_import.ariesSetting, 'errorReportId': error_report_file_id}
                aries_import.save()

            status = 'aries_complete'
            self.context.file_import_service._update_notification_and_notify_client(
                aries_import, status, notification_id, {
                    'status': TASK_STATUS_COMPLETED,
                    'description': 'ARIES data import completed',
                    'extra.body.status': status
                })
        except Exception as e:
            error_info = get_exception_info(e)
            logging.error(error_info['message'], extra={'metadata': error_info})
            user_error = error_info['message'] if error_info['expected'] else DEFAULT_USER_NOTIFICATION_ERROR

            status = 'failed'
            self.context.file_import_service._update_notification_and_notify_client(
                aries_import, status, notification_id, {
                    'status': TASK_STATUS_FAILED,
                    'description': 'ARIES data import failed',
                    'extra.body.status': status,
                    'extra.error': user_error,
                })
