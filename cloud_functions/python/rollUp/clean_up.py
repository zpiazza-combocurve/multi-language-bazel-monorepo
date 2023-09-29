import datetime
import pandas as pd
from combocurve.services.rollUp.roll_up_service import (get_table_name, RESOLUTION, STREAM_TYPE_NAME)
from combocurve.shared.parquet_types import to_date
from combocurve.services.rollUp.roll_up_export import get_aggregation_query

BATCH_TABLE_EXPIRATION_TIME = 3600


def get_metadata_table_name(type):
    return f'volumes_v2_{type}_runs'


def bigquery_export_aggregation(context, rollup_module, run_id_str, groups, bq_run_date, data_freq, by_well):
    table_name = get_table_name(rollup_module, data_freq, aggregation=True)
    agg_query = get_aggregation_query(
        context,
        rollup_module,
        run_id_str,
        groups,
        bq_run_date,
        data_freq=data_freq,
        by_well=by_well,
    )

    dataset_id = context.tenant_info['big_query_dataset']
    #dataset_id = 'dev1_experiment_dataset'
    context.big_query_client.save_query_result_to_table(dataset_id, agg_query, table_name, 'WRITE_APPEND')


def get_forecast_rollup_metadata(context, rollup_module, rollup_document, df_meta):
    if rollup_module == 'forecast':
        #df_meta['rollup_type'] = 'forecast'
        df_meta['forecast_id'] = str(rollup_document.get('forecast'))
        df_meta['forecast_name'] = context.forecasts_collection.find_one({
            '_id': rollup_document.get('forecast')
        }).get('name')


def get_scenario_metadata(context, rollup_module, rollup_document, df_meta):
    if rollup_module == 'scenario':
        #df_meta['rollup_type'] = 'scenario'
        df_meta['scenario_id'] = str(rollup_document.get('scenario'))
        df_meta['scenario_name'] = context.scenarios_collection.find_one({
            '_id': rollup_document.get('scenario')
        }).get('name')


def get_common_metadata(context, rollup_document, run_id, stream_type, df_meta):
    user_id = rollup_document.get('createdBy', '')
    project_id = rollup_document.get('project')
    resolution = rollup_document.get('resolution', 'monthly')

    df_meta['resolution'] = resolution if resolution != 'both' else 'daily_and_monthly'
    df_meta['run_at'] = rollup_document['createdAt']
    df_meta['run_id'] = str(run_id)
    df_meta['user_id'] = str(user_id)
    df_meta['project_id'] = str(project_id)
    user_document = context.users_collection.find_one({'_id': user_id})
    df_meta['user_name'] = user_document.get('firstName', '') + ' ' + user_document.get('lastName', '')
    df_meta['project_name'] = context.projects_collection.find_one({'_id': project_id}).get('name', '')

    for type in stream_type:
        df_meta[type] = stream_type[type]


def write_metadata_table(context, rollup_module, rollup_document, run_id, stream_type):
    df_meta = {}
    get_forecast_rollup_metadata(context, rollup_module, rollup_document, df_meta)
    get_scenario_metadata(context, rollup_module, rollup_document, df_meta)
    get_common_metadata(context, rollup_document, run_id, stream_type, df_meta)

    df_meta = pd.DataFrame(df_meta, index=[0])
    table_name = get_metadata_table_name(rollup_module)
    table_path = context.big_query_client.table_path(context.tenant_info['big_query_dataset'], table_name)
    table_id = context.big_query_client.get_table(table_path)
    context.big_query_client.insert_rows_df(table_id, df_meta)


def clean_up(context, run_id, success):
    try:
        forecast_roll_up = False
        rollup_document = context.scen_roll_up_runs_collection.find_one({'_id': run_id})
        if not rollup_document:
            forecast_roll_up = True
            rollup_document = context.forecast_roll_up_runs_collection.find_one({'_id': run_id})

        by_well = rollup_document.get('byWell', False)
        run_id_str = str(run_id)
        rollup_module = 'forecast' if forecast_roll_up else 'scenario'
        bq_run_date = to_date(rollup_document['createdAt'])
        resolution = RESOLUTION[rollup_document.get('resolution', 'monthly')]
        roll_up_groups = rollup_document.get('groups')

        if not by_well:
            # create temporary batch table
            for data_freq in resolution:
                if data_freq == 'monthly':
                    context.roll_up_service.create_batch_table(run_id_str, rollup_module, data_freq,
                                                               BATCH_TABLE_EXPIRATION_TIME)
                else:
                    context.roll_up_service.create_batch_table(run_id_str, rollup_module, data_freq,
                                                               BATCH_TABLE_EXPIRATION_TIME)

        set_dict = {
            'batches': [],
            'runDate': datetime.datetime.utcnow(),
            'running': False,
        }

        for data_freq in resolution:
            # load json to bigquery
            context.roll_up_service.load_batch_result_to_bigquery(run_id_str, rollup_module, data_freq, by_well)
            data = context.roll_up_service.bigquery_grand_total(run_id_str, bq_run_date, rollup_module, data_freq,
                                                                by_well)
            # grand total from bigquery
            set_dict[f'data.{data_freq}'] = data

            bigquery_export_aggregation(context, rollup_module, run_id_str, roll_up_groups, bq_run_date, data_freq,
                                        by_well)

        if forecast_roll_up:
            context.forecast_roll_up_runs_collection.update_one({'_id': run_id}, {'$set': set_dict})
        else:
            context.scen_roll_up_runs_collection.update_one({'_id': run_id}, {'$set': set_dict})

        if by_well:
            stream_type = get_stream_type(data)
            write_metadata_table(context, rollup_module, rollup_document, run_id, stream_type)

    except Exception as e:
        raise e

    return 'Your roll up chart has been generated'


def get_stream_type(data):
    stream_type = {'only_forecast': False, 'only_production': False, 'stitch': False}
    for stream in data:
        if data[stream]:
            stream_type[STREAM_TYPE_NAME[stream]] = True

    return stream_type
