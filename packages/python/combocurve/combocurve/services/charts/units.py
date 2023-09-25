import os
import json

# TODO: implement proper units handling module (CC-6625)
# TODO: consider how to avoid duplication of this json file when the units module is implemented
header_units_file_path = os.path.join(os.path.dirname(__file__), 'well_header_units.json')
with open(header_units_file_path) as header_units_file:
    WELL_HEADER_UNITS = json.load(header_units_file)


def bbl_to_mbbl(value: float):
    return value / 1000


def get_header_unit(header):
    return WELL_HEADER_UNITS['fields'].get(header)
