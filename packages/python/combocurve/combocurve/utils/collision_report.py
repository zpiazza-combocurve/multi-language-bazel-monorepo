from typing import Union, Tuple

FIELDS = [
    'well_name',
    'well_number',
    'project',
    'dataSource',
    'chosenID',
    'chosenKeyID',
    'inptID',
    'api10',
    'api12',
    'api14',
    'aries_id',
    'phdwin_id',
]

_HEADER_DISPLAY = {
    'source': 'Source',
    'dest': 'Destination',
    '->': '->',
    'well_name': 'Well Name',
    'well_number': 'Well Number',
    'project': 'Scope',
    'dataSource': 'Data Source',
    'chosenID': 'Chosen ID',
    'chosenKeyID': 'Chosen ID Key',
    'inptID': 'INPT ID',
    'api10': 'API 10',
    'api12': 'API 12',
    'api14': 'API 14',
    'aries_id': 'ARIES ID',
    'phdwin_id': 'PhdWin ID',
}


def get_headers(single_wells: bool):
    if single_wells:
        return FIELDS
    return [*[('source', field) for field in FIELDS], '->', *[('dest', field) for field in FIELDS]]


def get_header_display(header: Union[str, Tuple[str, str]]):
    if isinstance(header, str):
        return _HEADER_DISPLAY[header]
    return f'{get_header_display(header[0])} {get_header_display(header[1])}'


def get_pair_row(source_well: dict, dest_well: dict):
    return {header: _get_value(source_well, dest_well, header) for header in get_headers(False)}


def get_single_well_row(well: dict):
    return {header: _get_well_value(well, header) for header in get_headers(True)}


def _get_well_value(well: dict, field: str):
    if field == 'project':
        return 'Project' if well.get('project') else 'Company'
    return well.get(field)


def _get_value(source_well: dict, dest_well: dict, header: Union[str, Tuple[str, str]]):
    if isinstance(header, str):
        return header

    which_well, field = header
    well = dest_well if which_well == 'dest' else source_well

    return _get_well_value(well, field)
