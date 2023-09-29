import datetime
from typing import Optional
from copy import deepcopy
from cloud_runs.econ_export.context import EconExportContext
from combocurve.services.econ.econ_columns import SPECIAL_COL_DICT
from cloud_runs.econ_export.api.csv_export.utils import get_sorted_order_by_columns, create_all_headers_table
from combocurve.science.econ.big_query import (JOINED_TABLE_NAME, datetime_to_local_time_str,
                                               get_one_col_aggregation_str, get_joined_agg_table_bq,
                                               get_joined_monthly_table_bq)
from combocurve.services.econ.econ_big_query_schema import (MONTHLY_SCHEMA, WELL_HEADER_SCHEMA, METADATA_SCHEMA,
                                                            NON_BQ_HEADERS)
from combocurve.services.econ.econ_output_service import get_schema

JOINED_WITH_YEAR_TABLE_NAME = 'joined_table_with_year'
ONELINER_IN_MONTHLY_SCHEMA = [{
    'name': 'oil_start_using_forecast_date',
    'type': 'DATE'
}, {
    'name': 'gas_start_using_forecast_date',
    'type': 'DATE'
}, {
    'name': 'water_start_using_forecast_date',
    'type': 'DATE'
}, {
    'name': 'econ_first_production_date',
    'type': 'DATE'
}, {
    'name': 'reversion_date',
    'type': 'STRING'
}, {
    'name': 'gor',
    'type': 'NUMERIC'
}, {
    'name': 'wor',
    'type': 'NUMERIC'
}, {
    'name': 'water_cut',
    'type': 'NUMERIC'
}]


class QueryBuilder:
    # query builder for cashflow report
    def __init__(
        self,
        context: EconExportContext,
        run_id: str,
        project_id: str,
        run_date: datetime.datetime,
        number_of_wells: int,
        main_options: dict,
        reporting_units: dict,
    ):
        self.context = context
        self.run_id = run_id
        self.project_id = project_id
        self.run_date = run_date
        self.number_of_wells = number_of_wells
        self.main_options = main_options
        self.reporting_units = reporting_units

    def add_item_to_list(self, initial_list: list, list_to_add: list) -> list:
        for element in list_to_add:
            if element not in initial_list:
                initial_list.append(element)
        return initial_list

    def add_independent_columns(self, bq_keys: list) -> list:
        for phase in ['oil', 'gas', 'water', 'ngl', 'drip_condensate']:
            if f'{phase}_risk' in bq_keys:
                gross_volume = f'gross_{phase}_'
                gross_volume += 'well_head_volume' if phase in ['gas', 'water', 'oil'] else 'sales_volume'
                bq_keys = self.add_item_to_list(bq_keys, [gross_volume, f'pre_risk_{phase}_volume'])

            if any([f'{phase}_differentials_' in bq_key for bq_key in bq_keys]):
                bq_keys = self.add_item_to_list(bq_keys, [f'net_{phase}_sales_volume'])

            if any([f'{phase}_price' in bq_key for bq_key in bq_keys]):
                bq_keys = self.add_item_to_list(bq_keys, [f'net_{phase}_sales_volume'])

            if f'wi_{phase}' in bq_keys:
                bq_keys = self.add_item_to_list(bq_keys, [f'gross_{phase}_sales_volume', f'wi_{phase}_sales_volume'])

            if f'nri_{phase}' in bq_keys:
                bq_keys = self.add_item_to_list(bq_keys, [f'gross_{phase}_sales_volume', f'net_{phase}_sales_volume'])

            if f'{phase}_shrinkage' in bq_keys:
                bq_keys = self.add_item_to_list(bq_keys, [f'gross_{phase}_sales_volume', f'unshrunk_{phase}_volume'])

        if 'oil_loss' in bq_keys:
            bq_keys = self.add_item_to_list(bq_keys, ['gross_oil_well_head_volume', 'unshrunk_oil_volume'])

        if 'gas_loss' in bq_keys:
            bq_keys = self.add_item_to_list(bq_keys, ['gross_gas_well_head_volume', 'pre_flare_gas_volume'])

        if 'gas_flare' in bq_keys:
            bq_keys = self.add_item_to_list(bq_keys, ['unshrunk_gas_volume', 'pre_flare_gas_volume'])

        if 'ngl_yield' in bq_keys:
            bq_keys = self.add_item_to_list(bq_keys, ['pre_yield_gas_volume_ngl'])

        if 'drip_condensate_yield' in bq_keys:
            bq_keys = self.add_item_to_list(bq_keys, ['pre_yield_gas_volume_drip_condensate'])

        if 'lease_nri' in bq_keys:
            bq_keys = self.add_item_to_list(bq_keys, ['wi_oil_sales_volume', 'net_oil_sales_volume'])

        for tax in ['state_tax_rate', 'federal_tax_rate']:
            if tax in bq_keys:
                bq_keys = self.add_item_to_list(bq_keys, ['taxable_income'])
        return bq_keys

    def get_cumulative_column_sql_equivalent(
        self,
        bq_keys: list,
        report_type: str,
        max_number_of_wells: int = 100,
    ) -> list:
        mapper = {
            'cashflow-csv': 'partition by combo_name, well_id, incremental_index order by date',
            'cashflow-agg-csv': 'partition by combo_name, aggregation_group order by date'
        }
        part_str = mapper[report_type]

        for bq_key in bq_keys:
            if bq_key.startswith('cum_'):
                bq_key_index = bq_keys.index(bq_key)
                if self.number_of_wells > max_number_of_wells:
                    bq_keys[bq_key_index] = f'null as {bq_key}'
                    continue
                col_key = bq_key.split('cum_')[1]
                bq_keys[bq_key_index] = f'round(sum({col_key}) over({part_str}), 9) as {bq_key}'
        return bq_keys

    def get_mandatory_headers_for_grouping(self, report_type: str) -> str:
        if report_type == 'cashflow-agg-csv':
            return ['combo_name', 'aggregation_group']
        elif report_type == 'cashflow-csv':
            return ['combo_name', 'well_id', 'incremental_index']

    def get_from_string(
        self,
        bq_keys: list,
        num_monthly_periods: Optional[int],
        time_periods: Optional[int],
        report_type: str,
        cashflow_report_type: str,
        calendar_or_fiscal: Optional[str],
    ) -> str:
        bq_keys = deepcopy(bq_keys)

        if 'created_at' in bq_keys:
            bq_keys.pop(bq_keys.index('created_at'))

        if 'date' in bq_keys and cashflow_report_type == 'yearly':
            bq_keys[bq_keys.index('date')] = 'year as date'
        if 'range' in bq_keys:
            bq_keys[bq_keys.index('range')] = '`range`'

        bq_keys = self.add_independent_columns(bq_keys=bq_keys)

        bq_keys = self.get_cumulative_column_sql_equivalent(bq_keys=bq_keys, report_type=report_type)

        for header in self.get_mandatory_headers_for_grouping(report_type):
            if header not in bq_keys:
                bq_keys = [header] + bq_keys

        if cashflow_report_type == 'monthly':
            num_monthly_periods = 'date_diff(max(date) over(), min(date) over(), MONTH) + 1'
            convert_date = 'MAX(date) over()'
        elif cashflow_report_type == 'yearly':
            num_monthly_periods = 0
            convert_date = 'date_add(min(date) over(), interval 1 MONTH)'
        elif cashflow_report_type == 'hybrid':
            num_monthly_periods = 0 if not num_monthly_periods else num_monthly_periods
            convert_date = f'date_add(min(date) over(), interval {num_monthly_periods} MONTH)'

        convert_year = f'extract(YEAR from {convert_date})'

        if not time_periods and time_periods != 0:
            time_periods = 'safe_cast("Infinity" AS FLOAT64)'

        row = f'least(date_diff(date, min(date) over(), MONTH), {num_monthly_periods})'
        row_number_new_mapper = {
            'monthly':
            f'least({row} + floor(greatest(date_diff(date, {convert_date}, MONTH) / 12, 0)), {time_periods})',
            'yearly': f'least(year - min(year) over(), {time_periods})',
            'hybrid': {
                'fiscal':
                f'least({row} + floor(greatest(date_diff(date, {convert_date}, MONTH) / 12, 0)), {time_periods})',
                'calendar': f'least({row} + greatest(extract(YEAR from date) - {convert_year}, 0), {time_periods})'
            }
        }

        row_number_new = row_number_new_mapper.get(cashflow_report_type)
        new_date = ''
        if cashflow_report_type == 'hybrid':
            row_number_new = row_number_new.get(calendar_or_fiscal)
            if calendar_or_fiscal == 'fiscal':
                new_date = f"""
                case
                    when date < {convert_date} then date
                    else
                        date_add(
                            date_add({convert_date}, interval -1 month),
                                interval  cast(ceil(date_diff(
                                date,
                                date_sub({convert_date}, interval 1 month), month) / 12) as INT64) year
                            )
                end as new_date,
                """
            elif calendar_or_fiscal == 'calendar':
                new_date = f"""
                case
                    when date < {convert_date} then date
                    else date_add(date_trunc(date, year), interval 11 month)
                end as new_date,
                """

        from_string = f"""
        FROM (
            SELECT
                {", ".join(bq_keys)},
                {row_number_new} as row_number_new,
                {new_date}
            FROM {JOINED_WITH_YEAR_TABLE_NAME if cashflow_report_type == 'yearly' else JOINED_TABLE_NAME}
        )
        """
        return from_string + ' '

    def get_select_string(
        self,
        bq_keys: list,
        report_type: str,
        cashflow_report_type: str,
        time_zone: Optional[str],
    ) -> str:
        monthly_schema = get_schema(MONTHLY_SCHEMA)
        monthly_schema_agg = {
            k: v
            for k, v in monthly_schema.items() if v == 'NUMERIC' and k not in {
                **SPECIAL_COL_DICT,
                **get_schema(ONELINER_IN_MONTHLY_SCHEMA),
                'well_index': 'NUMERIC',
            }
        }

        monthly_schema_non_agg = {
            k: v
            for k, v in monthly_schema.items() if k not in {
                **SPECIAL_COL_DICT,
                **monthly_schema_agg
            }
        }
        project_custom_headers = [key for key in bq_keys if 'project_custom_header' in key]

        all_headers = get_schema(WELL_HEADER_SCHEMA + METADATA_SCHEMA + NON_BQ_HEADERS)
        any_value_cols = list({**all_headers, **monthly_schema_non_agg}) + project_custom_headers

        special_keys = list(SPECIAL_COL_DICT.keys())
        select_string = 'select '
        for bq_key in bq_keys:
            if bq_key == 'created_at':
                select_string += f'"{datetime_to_local_time_str(self.run_date, time_zone)}" AS created_at, '
            # for cum column
            elif bq_key.startswith('cum_') or bq_key.endswith('_well_count'):
                select_string += f'max({bq_key}) as {bq_key}, '
            elif bq_key == 'date':
                new_bq_key = bq_key
                if cashflow_report_type == 'hybrid':
                    new_bq_key = 'new_date'
                select_string += f'max({new_bq_key}) as {bq_key}, '
            elif bq_key in self.get_mandatory_headers_for_grouping(report_type):
                select_string += f'{bq_key}, '
            elif bq_key in SPECIAL_COL_DICT:
                select_string += get_one_col_aggregation_str(bq_key, special_keys, self.reporting_units)
            elif bq_key in monthly_schema_agg:
                select_string += f'sum({bq_key}) as {bq_key}, '
            elif bq_key in any_value_cols:
                if bq_key == 'range':
                    select_string += f'any_value(`{bq_key}`) as `{bq_key}`, '
                else:
                    select_string += f'any_value({bq_key}) as {bq_key}, '

        return select_string

    def get_fiscal_year(self, fiscal):
        # extract year as fiscal year if fiscal option is toggled
        year_str = 'extract(YEAR from date)'
        if fiscal:
            fiscal_start = int(fiscal[0]) + 1
            return f'IF (extract(MONTH from date) >= {fiscal_start}, {year_str}+1, {year_str}) as year, '
        else:
            return f'{year_str} as year, '

    def get_with_string(self, report_type: str, cashflow_report_type: str, output_columns: list) -> str:
        joined_table_func_mapper = {
            'cashflow-agg-csv': get_joined_agg_table_bq,
            'cashflow-csv': get_joined_monthly_table_bq,
        }

        run_date_str = str(self.run_date.date())
        join_query = f'{joined_table_func_mapper[report_type](self.context, self.run_id, run_date_str)} '

        # left join on the temporary table with missing headers(it is not needed for aggregate cashflow)
        if report_type == 'cashflow-csv':
            all_headers_table_path = create_all_headers_table(self.context, self.run_id, self.project_id,
                                                              output_columns)
            prefix, suffix = join_query.split('FROM')
            join_clause = f'FROM {all_headers_table_path}  LEFT JOIN '
            new_suffix = suffix[:-2] + ' USING (well_id))'
            join_query = prefix + join_clause + new_suffix

        if cashflow_report_type == 'yearly':
            fiscal = self.main_options['fiscal'] if self.main_options['reporting_period'] == 'fiscal' else None
            fiscal_str = self.get_fiscal_year(fiscal)
            join_query += f', {JOINED_WITH_YEAR_TABLE_NAME} as (select * , {fiscal_str} from {JOINED_TABLE_NAME})'
        return join_query

    def get_group_by_string(self, report_type: str) -> str:
        return f'GROUP BY {", ".join(self.get_mandatory_headers_for_grouping(report_type))}, row_number_new '

    def get_order_by_string(self, output_columns: list) -> str:
        order_cols = get_sorted_order_by_columns(output_columns)
        if order_cols:
            order_by_string = 'ORDER BY '
            order_by_options = []
            for col in order_cols:
                bq_key = col['bq_key'] if col['bq_key'] != 'range' else '`range`'
                order_by_options.append(f'{bq_key} {col["sortingOptions"]["direction"]}')
            order_by_string += ', '.join(order_by_options)
            return order_by_string
        return ''

    def get_query(
        self,
        report_type: str,
        cashflow_report_type: str,
        time_zone: Optional[str],
        output_columns: list,
        time_periods: Optional[int],
        num_monthly_periods: Optional[int],
        calendar_or_fiscal: Optional[str],
    ) -> str:

        bq_keys = [col['bq_key'] for col in output_columns]

        table_with_query = self.get_with_string(report_type, cashflow_report_type, output_columns)
        select_str = self.get_select_string(bq_keys, report_type, cashflow_report_type, time_zone)
        from_str = self.get_from_string(bq_keys, num_monthly_periods, time_periods, report_type, cashflow_report_type,
                                        calendar_or_fiscal)
        group_by_str = self.get_group_by_string(report_type)
        order_by_str = self.get_order_by_string(output_columns)
        return table_with_query + select_str + from_str + group_by_str + order_by_str
