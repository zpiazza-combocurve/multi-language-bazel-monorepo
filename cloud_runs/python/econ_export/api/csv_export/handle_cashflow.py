from cloud_runs.econ_export.context import EconExportContext
import datetime
from combocurve.science.econ.post_process import update_discount_col_name
from cloud_runs.econ_export.api.csv_export.utils import (add_bq_keys, convert_bq_to_csv_headers,
                                                         get_mapping_from_output_columns,
                                                         get_db_header_equivalent_for_aggregation_headers)
from cloud_runs.econ_export.api.csv_export.query_builder import QueryBuilder

from typing import Callable


def handle_cashflow(context: EconExportContext, export_params: dict, notify_progress: Callable):
    # parse inputs
    run_specs: dict = export_params['run_specs']
    run_id: str = str(run_specs['_id'])
    project_id: str = str(run_specs['project'])
    general_options: dict = run_specs['outputParams']['generalOptions']
    column_fields: dict = run_specs['outputParams']['columnFields']
    report_type: str = export_params['report_type']
    cashflow_report: dict = export_params['cashflow_report'].dict()
    cashflow_report_type: str = cashflow_report.get('type')
    output_columns: list = export_params['output_columns']
    if not cashflow_report['useTimePeriods']:
        cashflow_report['timePeriods'] = None

    # turn aggregation headers to db headers
    output_columns = get_db_header_equivalent_for_aggregation_headers(
        report_type=report_type,
        output_columns=output_columns,
        aggregation_headers=run_specs.get('outputParams', {}).get('headersArr', []),
    )

    # flexible discount column name
    update_discount_col_name(general_options, column_fields)

    # add bq_key to each output column
    output_columns = add_bq_keys(output_columns=output_columns)

    num_monthly_periods, calendar_or_fiscal = None, None
    if cashflow_report_type == 'hybrid':
        num_monthly_periods = cashflow_report.get('hybridOptions', {}).get('months')
        calendar_or_fiscal = cashflow_report.get('hybridOptions', {}).get('yearType')

    # get query
    query_builder = QueryBuilder(
        context=context,
        run_id=run_id,
        project_id=project_id,
        run_date=run_specs['runDate'],
        number_of_wells=len(run_specs['scenarioWellAssignments']),
        main_options=general_options['main_options'],
        reporting_units=general_options['reporting_units'],
    )

    query = query_builder.get_query(
        report_type=report_type,
        cashflow_report_type=cashflow_report_type,
        time_zone=run_specs['outputParams']['timeZone'],
        output_columns=output_columns,
        time_periods=cashflow_report.get('timePeriods'),
        num_monthly_periods=num_monthly_periods,
        calendar_or_fiscal=calendar_or_fiscal,
    )

    # get headers mapping
    csv_headers_mapping = convert_bq_to_csv_headers(
        bq_headers=[col['bq_key'] for col in output_columns],
        reporting_units=general_options['reporting_units'],
        column_fields=column_fields,
        extra_mapping=get_mapping_from_output_columns(output_columns),
        custom_fields_service=context.custom_fields_service,
    )
    notify_progress(progress=30)

    # save query result to storage
    file_date = datetime.datetime.utcnow().strftime("%Y_%m_%d_%H_%M_%S")
    file_prefix = 'grouped' if report_type == 'cashflow-agg-csv' else 'by-well'
    gcp_name = context.econ_file_service.load_bq_to_storage(
        header_list=list(csv_headers_mapping.values()),
        query=query,
        query_result_table_name=f'{run_id}-{file_prefix}-{cashflow_report_type}-{file_date}',
    )
    notify_progress(progress=90)

    return gcp_name
