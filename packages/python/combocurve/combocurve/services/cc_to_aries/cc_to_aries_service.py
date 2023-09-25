import io

import csv
import datetime
from bson import ObjectId
import pandas as pd
import numpy as np
from zipfile import ZipFile, ZIP_DEFLATED
import os
import logging
from shutil import copyfile

from combocurve.services.cc_to_aries.construct_ac_setupdata import get_ac_setup_data
from combocurve.services.cc_to_aries.query_helper import (
    CC_TO_ARIES_WELL_PROJECTION,
    ALL_PHASES,
    get_forecast_data,
    get_pct_key_by_phase,
    get_monthly_daily_dict,
    cc_aries_batch_input,
    use_last_prod_date_as_forecast_start_date,
)
from combocurve.services.cc_to_aries.construct_ac_df import (
    get_ac_property,
    get_aries_production,
    process_cc_forecast_volumes,
    validate_unique_id_list,
    combine_str,
    ExportToAriesError,
)
from combocurve.services.cc_to_aries.construct_ac_economic import (
    get_ac_economic,
    forecast_conv,
    get_main_phase,
    AriesStartLog,
    AC_ECONOMIC_HEADERS,
)
from combocurve.services.cc_to_aries.create_imp_buffer import (
    create_master_imp,
    create_prod_imp,
    convert_economic_to_txt,
    build_intro_html_file,
)
from combocurve.services.cc_to_aries.general_functions import truncate_inpt_id

from combocurve.shared.np_helpers import get_well_order_by_names
from combocurve.utils.assumption_fields import ASSUMPTION_FIELDS
from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME
from combocurve.utils.exceptions import get_exception_info

from combocurve.shared.aries_import_enums import (AC_ECONOMIC, AC_PROPERTY, AC_DAILY, AC_PRODUCT, AC_SETUP,
                                                  AC_SETUPDATA, AR_SIDEFILE, AR_LOOKUP, CC_FORECAST, AR_ENDDATE)

FORECAST_NOT_FOUND_ERROR = 'Forecast not found'

MAX_ROWS_PER_INSERT = 500
PROD_ROWS_LIMIT = 3500000
JACKCESS_WRITE_LIMIT = 50000


class CCToAriesService():
    def __init__(self, context):
        self.context = context

    def write_to_zip_file_and_upload(self, aries_result_dict, scenario_id, project_id, user_id):
        zip_buffer = io.BytesIO()

        with ZipFile(zip_buffer, mode="w", compression=ZIP_DEFLATED) as zf:
            for key in aries_result_dict:
                # csv
                csv_buffer = io.StringIO()
                aries_result_dict[key]['df'].to_csv(csv_buffer, index=False, date_format='%m/%d/%Y')
                zf.writestr(f'{key}.csv', csv_buffer.getvalue())
                # txt
                if aries_result_dict[key]['txt_name'] not in [
                        AC_SETUP, AC_SETUPDATA, AR_SIDEFILE, AR_LOOKUP, AR_ENDDATE
                ]:
                    zf.writestr(aries_result_dict[key]['txt_name'], aries_result_dict[key]['txt_buffer'].getvalue())
            # instruction txt
            instruction_buffer = build_intro_html_file()
            zf.writestr('instructions.html', instruction_buffer.getvalue())

        run_date = datetime.datetime.utcnow()
        gcp_name = f'{str(scenario_id)}--{run_date.isoformat()}.zip'
        content_type = 'application/zip'

        file_info = {'gcpName': gcp_name, 'type': content_type, 'name': gcp_name, 'user': user_id}
        self.context.file_service.upload_file_from_string(
            string_data=zip_buffer.getvalue(),
            file_data=file_info,
            project_id=project_id,
        )

        return gcp_name

    def write_to_access_file_and_upload(
        self,
        aries_result_dict,
        scenario_id,
        project_id,
        user_id,
        notification_id,
        progress_range,
    ):
        template_path = './api/cc_to_aries/Blank.accdb'
        db_path = f'./api/cc_to_aries/{notification_id}_BlankCopy.accdb'
        copyfile(template_path, db_path)

        prog_start = progress_range[0]
        prog_end = progress_range[1]

        insert_progress = progress_range[0] + (progress_range[1] - progress_range[0]) * 3 / 4

        try:
            '''
            put the import inside function due to it need jpype1 package,
            don't need to include it in place where don't need to write to accdb
            '''
            from combocurve.services.cc_to_aries.jackcess_insert import jackcess_insert

            # self.link_db_and_insert(db_path, aries_result_dict, user_id, notification_id, progress_range)
            jackcess_insert(
                db_path,
                aries_result_dict,
                user_id,
                notification_id,
                [prog_start, insert_progress],
                self._update_user_progress,
            )

            self._update_user_progress(user_id, notification_id, insert_progress)

            run_date = datetime.datetime.utcnow()
            gcp_name = f'{str(scenario_id)}--{run_date.isoformat()}.accdb'
            content_type = 'application/msaccess'

            file_info = {'gcpName': gcp_name, 'type': content_type, 'name': gcp_name, 'user': user_id}
            self.context.file_service.upload_file_from_path(
                file_path=db_path,
                file_data=file_info,
                project_id=project_id,
            )

            self._update_user_progress(user_id, notification_id, prog_end)

        except Exception as e:
            error_info = get_exception_info(e)
            logging.error(error_info['message'], extra={'metadata': error_info})
            raise ExportToAriesError('Failed to create MS access file')
        finally:
            if os.path.exists(db_path):
                os.remove(db_path)

        return gcp_name

    def export_to_aries(self, scenario_id, user_id, notification_id, assignment_ids, aries_setting):
        file_format = aries_setting.get('file_format', 'csv')
        include_production = aries_setting['include_production']
        data_resolution = aries_setting['data_resolution']

        # scenario
        scenario = self.context.scenario_service.get_scenario(ObjectId(scenario_id))
        project_id = scenario['project']
        combos = self.context.scenario_well_assignments_service.get_combos_by_scenario_id(ObjectId(scenario_id))

        general_options_id = scenario.get('general_options')

        self._update_user_progress(user_id, notification_id, 5)

        well_data_list, monthly_daily_dict = cc_aries_batch_input(
            self.context,
            scenario_id,
            assignment_ids,
            [*ASSUMPTION_FIELDS, 'schedule'],
            data_resolution,
            include_production,
            user_id,
            notification_id,
            [5, 40],
        )

        # TODO: ingore incremental for now, need to update in future
        well_data_list = [data for data in well_data_list if data['incremental_index'] == 0]

        # well_list
        well_ids = np.unique([w['well']['_id'] for w in well_data_list]).tolist()
        # link well's objectID to scenario assignment ID and inptID
        well_id_link = {}
        for i in range(len(well_ids)):
            well = well_data_list[i]
            well_id_link[well['well']['_id']] = {
                'well name': well['well']['well_name'],
                'assignment_id': well['assignment'],
                'inpt_id': well['well']['inptID']
            }

        # well_header (AC_PROPERTY)
        selected_id_key = aries_setting['selected_id_key']

        self._update_user_progress(user_id, notification_id, 45)
        # scenario-well-assignments (AC_ECONOMIC)
        ac_economic_output = get_ac_economic(
            self.context,
            user_id,
            notification_id,
            [45, 65],
            well_data_list,
            monthly_daily_dict,
            aries_setting,
            project_id,
            scenario_id,
            well_id_link,
            combos,
        )
        (ac_economic_df, ar_sidefile_df, ar_lookup_df, macro_dict, base_date, cc_forecast_volumes, ac_property_updates,
         ecl_links) = ac_economic_output

        ac_property_df, primary_id_to_selected_id_dic = get_ac_property(self.context, well_data_list, ac_economic_df,
                                                                        macro_dict, ac_property_updates,
                                                                        selected_id_key)

        ac_setup_df, ac_setupdata_df = get_ac_setup_data(self.context, general_options_id, base_date)

        # Commented out for future use. Generates end date link table:
        # ar_end_date_df = get_ar_enddate(ecl_links)

        cc_forecast_volumes_df = process_cc_forecast_volumes(cc_forecast_volumes, file_format)
        aries_prod_dict = {}
        prod_key_to_table_name = {'daily': AC_DAILY, 'monthly': AC_PRODUCT}
        for key in include_production:
            aries_prod_dict[key] = get_aries_production(well_ids, monthly_daily_dict, key,
                                                        primary_id_to_selected_id_dic, file_format)

        self._update_user_progress(user_id, notification_id, 70)

        # create and upload result file
        project_id = scenario['project']
        build_file_progress = [70, 95]
        missing_table = []
        if file_format == 'accdb':
            aries_result_dict = {
                AC_PROPERTY: ac_property_df,
                AC_ECONOMIC: ac_economic_df,
                CC_FORECAST: cc_forecast_volumes_df,
                AC_SETUP: ac_setup_df,
                AC_SETUPDATA: ac_setupdata_df,
                AR_SIDEFILE: ar_sidefile_df,
                AR_LOOKUP: ar_lookup_df,
            }

            for key, df in aries_prod_dict.items():
                if df.shape[0] > PROD_ROWS_LIMIT:
                    df = pd.DataFrame([], columns=df.columns)
                    missing_table.append(key)
                aries_result_dict[prod_key_to_table_name[key]] = df

            gcp_name = self.write_to_access_file_and_upload(aries_result_dict, scenario_id, project_id, user_id,
                                                            notification_id, build_file_progress)
        else:
            aries_result_dict = {
                AC_PROPERTY: {
                    'df': ac_property_df,
                    'txt_buffer': create_master_imp(ac_property_df),
                    'txt_name': 'master_instruction_file.imp'
                },
                AC_ECONOMIC: {
                    'df':
                    ac_economic_df,
                    'txt_buffer':
                    convert_economic_to_txt(self.context, ac_economic_df, user_id, notification_id,
                                            build_file_progress),
                    'txt_name':
                    f'{AC_ECONOMIC}.txt'
                },
                CC_FORECAST: {
                    'df': cc_forecast_volumes_df,
                    'txt_buffer': create_prod_imp(cc_forecast_volumes_df, 'M', cc_forecast=True),
                    'txt_name': 'cc_forecast_instruction_file.imp'
                },
                AR_SIDEFILE: {
                    'df': ar_sidefile_df,
                    'txt_buffer': '',
                    'txt_name': AR_SIDEFILE
                },
                AR_LOOKUP: {
                    'df': ar_lookup_df,
                    'txt_buffer': '',
                    'txt_name': AR_LOOKUP
                },
                AC_SETUP: {
                    'df': ac_setup_df,
                    'txt_buffer': '',
                    'txt_name': AC_SETUP
                },
                AC_SETUPDATA: {
                    'df': ac_setupdata_df,
                    'txt_buffer': '',
                    'txt_name': AC_SETUPDATA
                },
            }

            for key, df in aries_prod_dict.items():
                aries_result_dict[prod_key_to_table_name[key]] = {
                    'df': df,
                    'txt_buffer': create_prod_imp(df, key[0].upper()),
                    'txt_name': f'{key}_instruction_file.imp'
                }

            gcp_name = self.write_to_zip_file_and_upload(aries_result_dict, scenario_id, project_id, user_id)

        self._update_user_progress(user_id, notification_id, 99)

        return gcp_name, missing_table

    def get_selected_id_list(self, selected_id_key, wells):
        if selected_id_key == 'well_name_well_number':
            selected_id_list = [combine_str(str(w.get('well_name')), str(w.get('well_number'))) for w in wells]
        else:
            selected_id_list = [w.get(selected_id_key) for w in wells]
            if selected_id_key == 'inptID':
                selected_id_list = [truncate_inpt_id(_id) for _id in selected_id_list]

        validate_unique_id_list(selected_id_list)

        return selected_id_list

    def one_well_forecast(self, well_info, propnum, production_dict, forecast_data, aries_setting):
        one_well_ac_econ_list = []

        pct_key = aries_setting['pct_key']
        start_date = aries_setting['start_date']
        seg_end = aries_setting['seg_end']
        forecast_unit = aries_setting['forecast_unit']
        forecast_to_life = aries_setting['forecast_to_life']
        include_zero_forecast = aries_setting['include_zero_forecast']
        forecast_start_to_latest_prod = aries_setting['forecast_start_to_latest_prod']
        forecast_history_match = aries_setting['forecast_history_match']
        data_resolution = aries_setting['data_resolution']
        output_cums = aries_setting['output_cums']

        aries_id = well_info.get('aries_id')
        phdwin_id = well_info.get('phdwin_id')
        inpt_id = truncate_inpt_id(well_info.get('inptID', ''))
        chosen_id = well_info.get('chosenID')
        api10 = well_info.get('api10')
        api12 = well_info.get('api12')
        api14 = well_info.get('api14')
        well_name = well_info.get('well_name')
        well_number = well_info.get('well_number')

        aries_start_log = AriesStartLog()

        pct_key_by_phase = get_pct_key_by_phase(pct_key, forecast_data)

        main_phase = get_main_phase(forecast_data, well_info, pct_key_by_phase)

        if forecast_start_to_latest_prod:
            start_date_dict = use_last_prod_date_as_forecast_start_date(start_date, production_dict, data_resolution)
        else:
            start_date_dict = {'oil': start_date, 'gas': start_date, 'water': start_date}

        forecast_ret = forecast_conv(
            forecast_data,
            pct_key_by_phase,
            aries_start_log,
            production_dict={
                **production_dict, 'data_resolution': data_resolution
            },
            start_date_dict=start_date_dict,
            seg_end=seg_end,
            forecast_unit=forecast_unit,
            forecast_to_life=forecast_to_life,
            forecast_history_match=forecast_history_match,
            output_cums=output_cums,
            include_zero_forecast=include_zero_forecast,
            main_phase=main_phase,
            forecast_only_export=True,
        )

        seq_number = 0
        for i in range(len(forecast_ret)):
            seq_number += 10
            this_full_ac_row = [
                propnum, well_name, well_number, inpt_id, api10, api12, api14, chosen_id, aries_id, phdwin_id, 4,
                seq_number, 'CC_QUAL', *forecast_ret[i]
            ]
            one_well_ac_econ_list.append(this_full_ac_row)

        return one_well_ac_econ_list

    def create_forecast_csv_txt_buffer(
        self,
        sort_well_ids,
        selected_id_list,
        wells,
        sort_forecasts,
        aries_setting,
        sort_phase_freq,
        monthly_daily_dict,
        user_id,
        notification_id,
        xto_log,
    ):
        csv_buffer = io.StringIO()
        csv_writer = csv.writer(csv_buffer, quoting=csv.QUOTE_NONNUMERIC)
        csv_writer.writerow(AC_ECONOMIC_HEADERS)

        ac_econ_list = []

        # sort well by name
        well_order_list = get_well_order_by_names([w.get('well_name', '') for w in wells])

        for index, well_order in enumerate(well_order_list):
            forecast_data = sort_forecasts[well_order]
            well_info = wells[well_order]
            propnum = selected_id_list[well_order]
            phase_freq = sort_phase_freq[well_order]

            well_id = well_info.get('_id')

            production_dict = {
                'phase_freq': phase_freq,
                'monthly_dict': monthly_daily_dict['monthly'].get(well_id),
                'daily_dict': monthly_daily_dict['daily'].get(well_id),
            }

            one_forecast = self.one_well_forecast(well_info, propnum, production_dict, forecast_data, aries_setting)

            for row in one_forecast:
                ac_econ_list.append(row)
                csv_writer.writerow(row)

            # update progress bar
            if (index + 1) % 50 == 0:
                well_prog = 35 + round(45 * (index + 1) / len(sort_well_ids))
                self._update_user_progress(user_id, notification_id, well_prog)
                xto_log(f'update progress {well_prog}')

        ac_econ_df = pd.DataFrame(ac_econ_list, columns=AC_ECONOMIC_HEADERS)
        txt_buffer = convert_economic_to_txt(self.context, ac_econ_df, user_id, notification_id, [80, 95])
        xto_log('update progress 95')

        return csv_buffer, txt_buffer

    def upload_zip(self, forecast, csv_buffer, txt_buffer, user_id):
        project_id = forecast['project']
        forecast_id = forecast['_id']
        run_date = datetime.datetime.utcnow()

        gcp_name = f'cc-to-aries-forecast--{str(forecast_id)}--{run_date.isoformat()}.zip'
        content_type = 'application/zip'
        zip_file_info = {'gcpName': gcp_name, 'type': content_type, 'name': gcp_name, 'user': user_id}

        zip_buffer = io.BytesIO()

        with ZipFile(zip_buffer, mode="w", compression=ZIP_DEFLATED) as zf:
            # csv
            zf.writestr(f'{AC_ECONOMIC}.csv', csv_buffer.getvalue())
            # txt
            zf.writestr(f'{AC_ECONOMIC}.txt', txt_buffer.getvalue())

        self.context.file_service.upload_file_from_string(
            string_data=zip_buffer.getvalue(),
            file_data=zip_file_info,
            project_id=project_id,
        )

        return gcp_name

    def forecast_export_to_aries(self, forecast_id, well_ids, user_id, notification_id, aries_setting, xto_log):
        forecast = self.context.forecasts_collection.find_one({'_id': ObjectId(forecast_id)})

        if not forecast:
            raise ExportToAriesError(FORECAST_NOT_FOUND_ERROR)

        if not well_ids:
            well_ids = forecast['wells']

        well_ids = [ObjectId(id) for id in well_ids]

        self._update_user_progress(user_id, notification_id, 5)
        xto_log('update progress 5')

        # query forecast data and well headers
        sort_well_ids = sorted(well_ids)
        wells = self.context.well_service.get_wells_batch(sort_well_ids, CC_TO_ARIES_WELL_PROJECTION)
        self._update_user_progress(user_id, notification_id, 15)
        xto_log('update progress 15')

        sort_forecasts = get_forecast_data(self.context, forecast_id, sort_well_ids)
        self._update_user_progress(user_id, notification_id, 25)
        xto_log('update progress 25')

        data_resolution = aries_setting['data_resolution']
        well_data_freq = [data_resolution] * len(sort_well_ids)
        sort_phase_freq, monthly_daily_dict = get_monthly_daily_dict(
            self.context,
            sort_well_ids,
            sort_forecasts,
            ALL_PHASES,
            well_data_freq=well_data_freq,
        )
        self._update_user_progress(user_id, notification_id, 35)
        xto_log('update progress 35')

        selected_id_key = aries_setting['selected_id_key']
        selected_id_list = self.get_selected_id_list(selected_id_key, wells)

        # csv and txt buffer
        csv_buffer, txt_buffer = self.create_forecast_csv_txt_buffer(
            sort_well_ids,
            selected_id_list,
            wells,
            sort_forecasts,
            aries_setting,
            sort_phase_freq,
            monthly_daily_dict,
            user_id,
            notification_id,
            xto_log,
        )

        #  upload to cloud storage
        gcp_name = self.upload_zip(forecast, csv_buffer, txt_buffer, user_id)

        self._update_user_progress(user_id, notification_id, 99)
        xto_log('update progress 99')

        return gcp_name

    def forecast_export_to_aries_rest_api(self, forecast_id, well_ids, aries_setting):
        forecast = self.context.forecasts_collection.find_one({'_id': ObjectId(forecast_id)})

        if not forecast:
            raise ExportToAriesError(FORECAST_NOT_FOUND_ERROR)

        if not well_ids:
            well_ids = forecast['wells']

        well_ids = [ObjectId(id) for id in well_ids]
        sort_well_ids = sorted(well_ids)

        # query forecast data and well headers
        wells = self.context.well_service.get_wells_batch(sort_well_ids, CC_TO_ARIES_WELL_PROJECTION)
        well_id_to_info = {w['_id']: w for w in wells}

        sort_forecasts = get_forecast_data(self.context, forecast_id, sort_well_ids)

        sort_phase_freq, monthly_daily_dict = get_monthly_daily_dict(self.context, sort_well_ids, sort_forecasts,
                                                                     ALL_PHASES)

        selected_id_key = aries_setting['selected_id_key']
        selected_id_list = self.get_selected_id_list(selected_id_key, wells)

        validate_unique_id_list(selected_id_list)

        ret = []

        for well_idx, well_id in enumerate(sort_well_ids):
            well_info = well_id_to_info[well_id]
            forecast_data = sort_forecasts[well_idx]
            propnum = selected_id_list[well_idx]
            phase_freq = sort_phase_freq[well_idx]

            well_id = well_info.get('_id')

            production_dict = {
                'phase_freq': phase_freq,
                'monthly_dict': monthly_daily_dict['monthly'].get(well_id),
                'daily_dict': monthly_daily_dict['daily'].get(well_id),
            }

            one_forecast = self.one_well_forecast(well_info, propnum, production_dict, forecast_data, aries_setting)
            one_forecast_w_header = []

            for row in one_forecast:
                one_forecast_w_header.append(dict(zip(AC_ECONOMIC_HEADERS, row)))

            one_well_ret = {'well': str(well_info['_id']), 'forecast': one_forecast_w_header}

            ret.append(one_well_ret)

        return ret

    def _update_user_progress(self, user_id, notification_id, progress):
        self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
            '_id': notification_id,
            'progress': progress
        })

    def get_propnum(self, well_info, selected_id_key):
        if selected_id_key == 'well_name_well_number':
            well_name = well_info.get('well_name')
            well_number = well_info.get('well_number')
            if well_name and well_number:
                return f'{well_name} {well_number}'
            elif well_name:
                return well_name
            elif well_number:
                return well_number
            return 'no well name'
        else:
            return well_info.get(selected_id_key)

    def chart_aries_format(self, well_data, aries_input):
        well_info = well_data['header']
        input_forecast_data = well_data.get('forecast_data', {})

        propnum = self.get_propnum(well_info, aries_input.selected_id_key)

        production_dict = {
            'phase_freq': {},
            'daily_dict': well_data.get('daily_production'),
            'monthly_dict': well_data.get('monthly_production'),
        }

        forecast_data = {'oil': None, 'gas': None, 'water': None}
        for phase in forecast_data:
            if phase in input_forecast_data:
                forecast_data[phase] = input_forecast_data[phase]
                production_dict['phase_freq'][phase] = input_forecast_data[phase]['data_freq']
            else:
                production_dict['phase_freq'][phase] = 'monthly'

        aries_setting = {
            'pct_key': 'best',
            'start_date': aries_input.start_date,
            'seg_end': aries_input.seg_end,
            'forecast_unit': aries_input.forecast_unit,
            'forecast_to_life': aries_input.forecast_to_life,
            'data_resolution': aries_input.data_resolution,
            # TODO add these new options in forecast chart export
            'include_zero_forecast': False,
            'output_cums': True,
            'forecast_start_to_latest_prod': False,
            'forecast_history_match': False,
        }

        aries_data = {
            'with_start_date': self.one_well_forecast(
                well_info,
                propnum,
                production_dict,
                forecast_data,
                aries_setting,
            )
        }
        if aries_input.include_original_forecast:
            aries_setting['start_date'] = None
            aries_data['without_start_date'] = self.one_well_forecast(
                well_info,
                propnum,
                production_dict,
                forecast_data,
                aries_setting,
            )

        return aries_data
