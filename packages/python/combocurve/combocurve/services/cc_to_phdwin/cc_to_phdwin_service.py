import datetime
import io

from bson import ObjectId
from combocurve.services.cc_to_aries.query_helper import (cc_aries_batch_input)
from combocurve.services.cc_to_phdwin.construct_phdwin_tables import CCToPhdwin
from combocurve.utils.assumption_fields import ASSUMPTION_FIELDS
from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME

from zipfile import ZipFile, ZIP_DEFLATED

INCLUDE_PRODUCTION = False
DATA_RESOLUTION = 'monthly'
SELECTED_ID_KEY = 'phdwin_id'


class CCToPhdwinService:
    def __init__(self, context):
        self.context = context

    def write_to_zip_file_and_upload(self, phdwin_result_dict, error_log, scenario_id, project_id, user_id):
        zip_buffer = io.BytesIO()

        with ZipFile(zip_buffer, mode="w", compression=ZIP_DEFLATED) as zf:
            for key in phdwin_result_dict:
                # csv
                csv_buffer = io.StringIO()
                phdwin_result_dict[key].to_csv(csv_buffer, index=False)
                zf.writestr(f'{key}.csv', csv_buffer.getvalue())
            if error_log.has_error:
                zf.writestr('Error.csv', error_log.error_report.getvalue())
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

    def reformat_phdwin_tables_zip(self, table_dict):
        phdwin_result_dict = {}
        for assumption, tables in table_dict.items():
            if len(tables) == 2:
                phdwin_result_dict[f'{assumption.upper()}_MOD'] = tables[0]
                phdwin_result_dict[f'{assumption.upper()}_PHD'] = tables[1]
            elif len(tables) == 1:
                phdwin_result_dict[f'{assumption.upper()}_PHD'] = tables[0]

        return phdwin_result_dict

    def _update_user_progress(self, user_id, notification_id, progress):
        self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
            '_id': notification_id,
            'progress': progress
        })

    def export_to_phdwin(self, scenario_id, user_id, notification_id, assignment_ids, chosen_key, table_headers):
        well_data_list, monthly_daily_dict = cc_aries_batch_input(
            self.context,
            scenario_id,
            assignment_ids,
            [*ASSUMPTION_FIELDS, 'schedule'],
            INCLUDE_PRODUCTION,
            DATA_RESOLUTION,
            user_id,
            notification_id,
            [5, 8],
        )
        # increase t 40 if we ever start handling production data in export

        scenario = self.context.scenario_service.get_scenario(ObjectId(scenario_id))
        project_id = scenario['project']

        # ignore incremental for now, need to update in future
        well_data_list = [data for data in well_data_list if data['incremental_index'] == 0]

        # well_list
        # well_ids = np.unique([w['well']['_id'] for w in well_data_list]).tolist()

        self._update_user_progress(user_id, notification_id, 10)
        cc_phdwin_obj = CCToPhdwin(self.context, user_id, notification_id, well_data_list, chosen_key, table_headers)
        table_dict, error_log = cc_phdwin_obj.execute()

        phdwin_output = self.reformat_phdwin_tables_zip(table_dict)

        gcp_name = self.write_to_zip_file_and_upload(phdwin_output, error_log, scenario_id, project_id, user_id)

        self._update_user_progress(user_id, notification_id, 99)

        return gcp_name
