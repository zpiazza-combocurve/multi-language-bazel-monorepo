from bson import ObjectId
import numpy as np
import polars as pl
from typing import List, DefaultDict

from collections import defaultdict, deque
from combocurve.shared.date import parse_date_str
from combocurve.shared.parquet_types import to_date

from combocurve.science.network_module.ghg_units import report_units, fuel_types

from combocurve.science.network_module.nodes.shared.type_hints import (MonthlyFrequencyDatetime64mNDArray,
                                                                       MonthlyFrequencyDatetime64dNDArray, Int32NDArray,
                                                                       Float64NDArray, EdgeParams, BaseNode,
                                                                       OptionalStreamDateAndValue, Edge)
from combocurve.shared.econ_tools.econ_model_tools import CriteriaEnum
from combocurve.science.network_module.default_network_assumptions import EmissionFactorDefaults, NetworkDefaults
from combocurve.science.network_module.ghg_units import density_dict
from combocurve.services.carbon.carbon_schemas import MONTHLY_POLARDF_SCHEMA

GHG_LIST = ['CO2', 'C1', 'N2O', 'CO2e']
PHASE_LIST = ['oil', 'gas', 'water', 'wh_oil', 'wh_gas', 'wh_water']
FUEL_LIST = fuel_types.keys()


def yearly_emission_to_monthly_per_well_emission(yearly_emission, well_count_arr: Int32NDArray):
    return {
        product: np.divide(product_value / 12,
                           well_count_arr,
                           out=np.zeros_like(well_count_arr),
                           where=well_count_arr > 0)
        for product, product_value in yearly_emission.items()
    }


def assign_product_type(product):
    if product in GHG_LIST:
        return 'ghg'
    elif product in PHASE_LIST:
        return 'product'
    elif product in FUEL_LIST:
        return 'fuel'
    else:
        return None


def assign_unit(product):
    product_unit = report_units.get(product)
    if product_unit:
        return product_unit.get('display_unit')
    return product_unit


def assign_scope(emission_type):
    # emission_type comes from node_type if it's from Scope 2 or Scope 3 top down emission category
    # otherwise it comes from emission_type field
    if emission_type in ['electricity', 'scope2']:
        return 'Scope 2'
    elif emission_type == 'scope3':
        return 'Scope 3'
    elif emission_type:
        return 'Scope 1'
    else:
        return 'No Scope'


def update_fuel_type_label(product_type):
    fuel_label = fuel_types.get(product_type)
    if fuel_label:
        return fuel_label.get('label')
    else:
        return product_type


def generate_edges_by_key(edges: List[Edge], key: str) -> DefaultDict[str, List[Edge]]:
    edges_by_key = defaultdict(list)
    for edge in edges:
        key_value = edge[key]
        edges_by_key[key_value].append(edge)
    return edges_by_key


def generate_edges_by_from(edges: List[Edge]) -> DefaultDict[str, List[Edge]]:
    return generate_edges_by_key(edges, 'from')


def generate_edges_by_to(edges: List[Edge]) -> DefaultDict[str, List[Edge]]:
    return generate_edges_by_key(edges, 'to')


def get_devlopment_nodes_id_set(well_group_id, edges):
    ret_set = set()
    if well_group_id:
        for edge in edges:
            edge_from, edge_to, edge_by = edge.get('from', None), edge.get('to', None), edge.get('by', None)
            if (edge_from == well_group_id or edge_to == well_group_id) and edge_by == 'development':
                ret_set.add(edge_from)
                ret_set.add(edge_to)

                ret_set.remove(well_group_id)
    return ret_set


def apply_time_series_allocation(date: MonthlyFrequencyDatetime64dNDArray, value: Float64NDArray,
                                 edge_params: EdgeParams, date_dict):
    time_series = edge_params['time_series']
    criteria = time_series['criteria']
    rows = time_series['rows']
    periods = [_row['period'] for _row in rows]
    ## convert allocation from percentage to decimal
    allocations = [_row['allocation'] / 100 for _row in rows]

    if criteria == CriteriaEnum.entire_well_life.name:
        return value * allocations[0]

    # if criteria == CriteriaEnum.offset_to_fpd.name:
    #     ## TODO: parse and return
    #     pass

    if criteria == CriteriaEnum.dates.name:
        np_dates = parse_criteria_dates(periods)
        time_series_allocation = get_dates_time_series(date, np_dates, allocations)
        return value * time_series_allocation


def parse_criteria_dates(raw_dates):
    return np.array(list(map(parse_date_str, raw_dates)), dtype='datetime64[D]')


def get_dates_time_series(date, np_dates, values):
    ret = np.zeros(date.shape, dtype=np.float64)
    k = len(np_dates)
    for i in range(k - 1):
        this_mask = (np_dates[i] <= date) & (date < np_dates[i + 1])
        ret[this_mask] = values[i]

    ## econ_limit
    last_mask = date >= np_dates[-1]
    ret[last_mask] = values[-1]
    return ret


## centrifugal/reciprocating compressor
## NOTE: limit the use of this to only compressor
def compressor_time_series_facility_emission(node: BaseNode, well_count_arr: Int32NDArray,
                                             date: MonthlyFrequencyDatetime64mNDArray) -> dict:
    node_type = node['type']
    emission_factor_defaults = EmissionFactorDefaults.compressor[node_type]

    time_series = node['params']['time_series']
    criteria = time_series['criteria']
    rows = time_series['rows']
    periods = [_row['period'] for _row in rows]

    if criteria == CriteriaEnum.entire_well_life.name:
        first_count = rows[0]['count']
        first_runtime = rows[0]['runtime']

        yearly_emission = {
            product: first_count * first_runtime * v['multiplier'] * density_dict[product]['multiplier']
            for product, v in emission_factor_defaults.items()
        }
        return yearly_emission_to_monthly_per_well_emission(yearly_emission, well_count_arr)

    if criteria == CriteriaEnum.dates.name:
        np_dates = parse_criteria_dates(periods)
        time_series_value = get_dates_time_series(date, np_dates, [_row['count'] * _row['runtime'] for _row in rows])
        ## NOTE: yearly emission here is actually a time series with monthly frequency
        yearly_emission = {
            product: time_series_value * v['multiplier'] * density_dict[product]['multiplier']
            for product, v in emission_factor_defaults.items()
        }
        return yearly_emission_to_monthly_per_well_emission(yearly_emission, well_count_arr)

    return {}


def pneumatic_time_series_facility_emission(node: BaseNode, well_count_arr: Int32NDArray,
                                            date: MonthlyFrequencyDatetime64mNDArray, is_device: bool):
    params = node['params']

    if params['fluid_model']:
        fluid_model = params['fluid_model']['econ_function']['gas']['composition']
    else:
        fluid_model = NetworkDefaults.fluid_model['gas']['composition']

    time_series = params['time_series']
    criteria = time_series['criteria']
    rows = time_series['rows']
    periods = [_row['period'] for _row in rows]
    device_types = [_row.get('device_type') if is_device else 'pump' for _row in rows]

    if criteria == CriteriaEnum.entire_well_life.name:
        first_device_type = device_types[0]
        first_ef = EmissionFactorDefaults.pneumatic_device[first_device_type]['multiplier']
        first_count = rows[0]['count']
        first_runtime = rows[0]['runtime']

        yearly_emission = {
            product: first_count * first_runtime * fluid_model[product]['percentage'] / 100 * first_ef
            * density_dict[product]['multiplier']
            for product in ['CO2', 'C1']
        }
        return yearly_emission_to_monthly_per_well_emission(yearly_emission, well_count_arr)

    if criteria == CriteriaEnum.dates.name:
        np_dates = parse_criteria_dates(periods)
        ef_s = [
            EmissionFactorDefaults.pneumatic_device[this_device_type]['multiplier'] for this_device_type in device_types
        ]
        time_series_value_after_ef = get_dates_time_series(
            date, np_dates, [_row['count'] * _row['runtime'] * ef_s[i] for i, _row in enumerate(rows)])
        ## NOTE: yearly emission here is actually a time series with monthly frequency
        yearly_emission = {
            product:
            time_series_value_after_ef * fluid_model[product]['percentage'] / 100 * density_dict[product]['multiplier']
            for product in ['CO2', 'C1']
        }
        return yearly_emission_to_monthly_per_well_emission(yearly_emission, well_count_arr)


def get_db_node_id(node_id, facility_id=None):
    return node_id if facility_id is None else facility_id + '+' + node_id


def get_output_df_from_date_and_value_arr(combo_name: str,
                                          well_id: ObjectId,
                                          incremental_index: np.int64,
                                          facility_id: str,
                                          node_data: dict,
                                          date: MonthlyFrequencyDatetime64mNDArray,
                                          value: np.typing.NDArray[np.float64],
                                          product: str,
                                          passed_node_type: str = None,
                                          passed_emission_type: str = None) -> pl.DataFrame:
    ## HACK: passed_node_type and passed_emission_type are for custom calculation node
    node_id = get_db_node_id(node_data['id'], facility_id)
    if passed_node_type:
        node_type = passed_node_type
    else:
        node_type = node_data['type']

    if passed_emission_type:
        emission_type = passed_emission_type
    else:
        if node_type == 'combustion':
            if node_data['params']['time_series']['fuel_type'] in EmissionFactorDefaults.electricity:
                emission_type = 'electricity'
            else:
                emission_type = 'combustion'
        else:
            emission_type = 'vented'

    ret = pl.DataFrame(
        {
            'combo_name': combo_name,
            'well_id': str(well_id),
            'incremental_index': incremental_index,
            'node_id': node_id,
            'node_type': node_type,
            'emission_type': emission_type,
            'product_type': assign_product_type(product),
            'product': product,
            'value': value,
            'date': pl.Series(date).apply(to_date)
        },
        columns=MONTHLY_POLARDF_SCHEMA)

    return ret


def generate_emission_data(date_arr, value_arr, well_id, node_id, node_type, emission_type, product_type, product):
    return [{
        'well_id': well_id,
        'node_id': node_id,
        'node_type': node_type,
        'emission_type': emission_type,
        'product_type': 'ghg',
        'product': product,
        'value': value_arr[i],
        'date': date_arr[i]
    } for i in range(len(date_arr))]


def sum_stream_date_and_value_for_2(add_date_and_value: OptionalStreamDateAndValue,
                                    existing_date_and_value: OptionalStreamDateAndValue) -> OptionalStreamDateAndValue:
    if existing_date_and_value is None:
        return add_date_and_value

    add_date_value_map = {date: add_date_and_value['value'][i] for i, date in enumerate(add_date_and_value['date'])}

    existing_date_value_map = {
        date: existing_date_and_value['value'][i]
        for i, date in enumerate(existing_date_and_value['date'])
    }

    all_dates = np.unique(np.concatenate([add_date_and_value['date'], existing_date_and_value['date']]))
    all_values = [add_date_value_map.get(date, 0) + existing_date_value_map.get(date, 0) for date in all_dates]

    return {'date': all_dates, 'value': np.array(all_values, dtype=float)}


def sum_stream_date_and_value_for_more(
        date_and_value_s: List[OptionalStreamDateAndValue]) -> OptionalStreamDateAndValue:
    date_value_map = defaultdict(float)
    for date_and_value in date_and_value_s:
        if date_and_value is not None and date_and_value.get('date') is not None:
            for i, date in enumerate(date_and_value['date']):
                date_value_map[date] += date_and_value['value'][i]

    if len(date_value_map) == 0:
        return None

    all_dates = np.sort(list(date_value_map.keys()))
    values = np.array([date_value_map[date] for date in all_dates])
    return {'date': all_dates, 'value': values}


def multiply_stream_and_value_for_2(stream_1: OptionalStreamDateAndValue, stream_2: OptionalStreamDateAndValue):
    date_value_map = defaultdict(float)
    if stream_1 is None:
        return stream_2

    for i, date in enumerate(stream_1['date']):
        date_value_map[date] = stream_1['value'][i]

    for j, date in enumerate(stream_2['date']):
        this_v = stream_2['value'][j]
        if date in date_value_map:
            date_value_map[date] *= this_v
        else:
            date_value_map[date] = this_v

    if len(date_value_map) == 0:
        return None

    all_dates = np.sort(list(date_value_map.keys()))
    values = np.array([date_value_map[date] for date in all_dates])
    return {'date': all_dates, 'value': values}


def divide_stream_and_value_for_2(stream_1: OptionalStreamDateAndValue, stream_2: OptionalStreamDateAndValue):
    date_value_map = defaultdict(float)
    if stream_1 is None:
        return stream_2

    for i, date in enumerate(stream_1['date']):
        date_value_map[date] = stream_1['value'][i]

    for j, date in enumerate(stream_2['date']):
        this_v = stream_2['value'][j]
        if this_v == 0 or date not in date_value_map:
            date_value_map[date] = 0
            continue

        date_value_map[date] /= this_v

    if len(date_value_map) == 0:
        return None

    all_dates = np.sort(list(date_value_map.keys()))
    values = np.array([date_value_map[date] for date in all_dates])
    return {'date': all_dates, 'value': values}


## NOTE: result of this is not in a gauranteed order, the set operation has some randomness
def get_relevant_edges(starting_node_ids: List[str], all_edges: List[Edge], sort_edges: bool = False) -> List[Edge]:
    edges_by_from = generate_edges_by_from(all_edges)

    active_node_ids_set = set(starting_node_ids)
    used_node_ids_set = set()
    relevant_edges = []

    while len(active_node_ids_set):
        this_node_id = active_node_ids_set.pop()
        used_node_ids_set.add(this_node_id)

        edges_from_this_node = edges_by_from[this_node_id]
        relevant_edges += edges_from_this_node
        for edge in edges_from_this_node:
            if edge['to'] not in active_node_ids_set and edge['to'] not in used_node_ids_set:
                active_node_ids_set.add(edge['to'])

    if sort_edges:
        relevant_edges.sort(key=lambda x: x['id'])

    return relevant_edges


def sort_network_nodes(starting_node_ids: List[str], all_edges: List[Edge], sort_edges: bool = False) -> List[str]:
    """
    Only sort nodes in a network. When a facility node is encountered
    it will not enter the facility to sort the nodes.
    """
    relevant_edges = get_relevant_edges(starting_node_ids, all_edges, sort_edges)

    children = defaultdict(list)
    parents = defaultdict(list)
    for edge in relevant_edges:
        from_node = edge['from']
        to_node = edge['to']
        children[from_node].append(edge)
        parents[to_node].append(edge)

    nodes_queue = deque(starting_node_ids)
    sorted_nodes = []
    while len(nodes_queue) > 0:
        n = nodes_queue.popleft()
        sorted_nodes.append(n)
        for e in children[n]:
            m = e['to']
            parents[m].remove(e)
            relevant_edges.remove(e)
            if len(parents[m]) == 0:
                nodes_queue.append(m)

    if len(relevant_edges) > 0:
        raise Exception('ERROR: There is a loop in the network!')
    else:
        return sorted_nodes
