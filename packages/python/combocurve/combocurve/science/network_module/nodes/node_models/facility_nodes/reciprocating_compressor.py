from combocurve.science.network_module.nodes.shared.helper import compressor_time_series_facility_emission
from combocurve.science.network_module.nodes.shared.type_hints import MonthlyFrequencyDatetime64mNDArray, Int32NDArray


def calculate_reciprocating_compressor(node_data, well_count_arr: Int32NDArray,
                                       date: MonthlyFrequencyDatetime64mNDArray):
    """Calculates emissions for centrifugal compressor node.

    Does not require inputs from well
    Ideally this is defined for a group of wells, i.e. 1 compressor for 3 wells,

    Arguments:
        node_data: params stored in a node, {'time_series': {'criteria': str, 'rows': []}}
        well_count_arr: number of active wells at each time_stamp for this facility
        date: an array of date that is the same length as well_count_arr
    Returns:
        A time series of per well emission from overall_min_date to overall_max_date
    """
    return compressor_time_series_facility_emission(node_data, well_count_arr, date)
