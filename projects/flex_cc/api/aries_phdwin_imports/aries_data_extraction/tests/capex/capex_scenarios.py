import numpy as np
from bson import ObjectId
from pandas import Series

from api.aries_phdwin_imports.aries_data_extraction.tests.shared.mdb_extract_mock import AriesDataExtractionMock
"""Describes different scenarios for testing purposes following the tuple structure (input, output, base_date)
input: dict -> {'row': pd.Series, 'ls_expression': List[str], 'start_date': str}
output: Optional[dict]
base_date: Optional[str]
"""

CAPEX_TEST_HEADERS = ('PROPNUM', 'SECTION', 'keyword_mark', 'EXPRESSION')
PROPNUM = 'KCAKOBFMHJ'

CREATE_CAPEX_OBJ_SCENARIOS = [
    ({
        'row': Series(data=(PROPNUM, 6, 'PLUG', '35 X M$ TO LIFE PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0'],
        'start_date': '02/2023'
    }, {
        'category': 'abandonment',
        'tangible': 35,
        'intangible': 0,
        'capex_expense': 'capex',
        'after_econ_limit': 'yes',
        'calculation': 'gross',
        'depreciation_model': 'none',
        'deal_terms': 1,
        'description': 'PLUG',
        'offset_to_econ_limit': 0
    }, None),
    (
        {  #noqa(E126)
            'row': Series(data=(PROPNUM, 6, 'PLUG', '35 X M$ 10.4 AD PC 0'), index=CAPEX_TEST_HEADERS),
            'ls_expression': ['35', 'X', 'M$', '2021.4', 'AD', 'PC', '0'],
            'start_date': '02/2023'
        },
        {
            'category': 'abandonment',
            'date': '2021-06-01',
            'tangible': 35,
            'intangible': 0,
            'capex_expense': 'capex',
            'after_econ_limit': 'no',
            'calculation': 'gross',
            'depreciation_model': 'none',
            'deal_terms': 1,
            'description': 'PLUG'
        },
        '01/2024'),
    ({
        'row': Series(data=(PROPNUM, 6, 'PLUG', '35 bad_value M$ TO LIFE PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['35', 'bad_value', 'M$', 'TO', 'LIFE', 'PC', '0'],
        'start_date': '02/2023'
    }, {
        'category': 'abandonment',
        'tangible': 35,
        'intangible': 0,
        'capex_expense': 'capex',
        'after_econ_limit': 'yes',
        'calculation': 'gross',
        'depreciation_model': 'none',
        'deal_terms': 1,
        'description': 'PLUG',
        'offset_to_econ_limit': 0
    }, None),
    ({
        'row': Series(data=(PROPNUM, 6, 'SALV', '35 X M$ TO LIFE PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0'],
        'start_date': '02/2023'
    }, {
        'category': 'salvage',
        'tangible': -35,
        'intangible': 0,
        'capex_expense': 'capex',
        'after_econ_limit': 'yes',
        'calculation': 'gross',
        'depreciation_model': 'none',
        'deal_terms': 1,
        'description': 'SALV',
        'offset_to_econ_limit': 0
    }, None),
    ({
        'row': Series(data=(PROPNUM, 6, 'ABANDON', '35 X M$ TO LIFE PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0'],
        'start_date': '02/2023'
    }, None, None),
    ({
        'row': Series(data=(PROPNUM, 6, 'SALVAGE', '35 X M$ TO LIFE PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0'],
        'start_date': '02/2023'
    }, None, None),
    ({
        'row': Series(data=(PROPNUM, 6, 'SALV', '35 X M$ 10.4 YR PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['35', 'X', 'M$', '10.4', 'YR', 'PC', '0'],
        'start_date': 'wrong_date_format'
    }, {
        'category': 'salvage',
        'date': '2021-01-01',
        'tangible': -35,
        'intangible': 0,
        'capex_expense': 'capex',
        'after_econ_limit': 'no',
        'calculation': 'gross',
        'depreciation_model': 'none',
        'deal_terms': 1,
        'description': 'SALV'
    }, None),
    ({
        'row': Series(data=(PROPNUM, 6, 'SALV', '35 X M$ 10.4 YR PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['35', 'X', 'M$', '10.4', 'YR', 'PC', '0'],
        'start_date': 'base_date_test'
    }, {
        'category': 'salvage',
        'date': '2021-04-01',
        'tangible': -35,
        'intangible': 0,
        'capex_expense': 'capex',
        'after_econ_limit': 'no',
        'calculation': 'gross',
        'depreciation_model': 'none',
        'deal_terms': 1,
        'description': 'SALV'
    }, '04/2021'),
    ({
        'row': Series(data=(PROPNUM, 6, 'SALV', '42 X M$ 10.4 YR PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['42', 'X', 'M$', '10.4', 'YR', 'PC', '0'],
        'start_date': '04/2024'
    }, {
        'category': 'salvage',
        'date': '2034-08-25',
        'tangible': -42,
        'intangible': 0,
        'capex_expense': 'capex',
        'after_econ_limit': 'no',
        'calculation': 'gross',
        'depreciation_model': 'none',
        'deal_terms': 1,
        'description': 'SALV'
    }, None),
    ({
        'row': Series(data=(PROPNUM, 6, 'SALV', '86 X M$ 9.4 IMOS PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['86', 'X', 'M$', '9.4', 'IMOS', 'PC', '0'],
        'start_date': '04/2024'
    }, {
        'category': 'salvage',
        'date': '2020-10-13',
        'tangible': -86,
        'intangible': 0,
        'capex_expense': 'capex',
        'after_econ_limit': 'no',
        'calculation': 'gross',
        'depreciation_model': 'none',
        'deal_terms': 1,
        'description': 'SALV'
    }, None),
    ({
        'row': Series(data=(PROPNUM, 6, 'SALV', '86 X M$ 9.4 MOS PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['86', 'X', 'M$', '9.4', 'MOS', 'PC', '0'],
        'start_date': '04/2024'
    }, {
        'category': 'salvage',
        'date': '2025-01-13',
        'tangible': -86,
        'intangible': 0,
        'capex_expense': 'capex',
        'after_econ_limit': 'no',
        'calculation': 'gross',
        'depreciation_model': 'none',
        'deal_terms': 1,
        'description': 'SALV'
    }, None),
    ({
        'row': Series(data=(PROPNUM, 6, 'SALV', '73 X M$ 9.4 IYR PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['73', 'X', 'M$', '9.4', 'IYR', 'PC', '0'],
        'start_date': '04/2024'
    }, {
        'category': 'salvage',
        'date': '2029-05-25',
        'tangible': -73,
        'intangible': 0,
        'capex_expense': 'capex',
        'after_econ_limit': 'no',
        'calculation': 'gross',
        'depreciation_model': 'none',
        'deal_terms': 1,
        'description': 'SALV'
    }, None),
    ({
        'row': Series(data=(PROPNUM, 8, 'ABAN', '73 X M$ 9.2 BBL PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['73', 'X', 'M$', '9.2', 'BBL', 'PC', '0'],
        'start_date': '04/2024'
    }, {
        'category': 'other_investment',
        'date': '2024-04-01',
        'tangible': 73,
        'intangible': 0,
        'capex_expense': 'capex',
        'after_econ_limit': 'no',
        'calculation': 'gross',
        'depreciation_model': 'none',
        'deal_terms': 1,
        'description': 'ABAN',
        'well_head_oil_cum': 9.2,
        'start': '04/2024'
    }, None),
    ({
        'row': Series(data=(PROPNUM, 8, 'SALV', '-73 90.5 $N 9.2 BBL PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['-73', '90.5', '$N', '9.2', 'BBL', 'PC', '0'],
        'start_date': '04/2024'
    }, {
        'category': 'salvage',
        'date': '2024-04-01',
        'tangible': -73,
        'intangible': -90.5,
        'capex_expense': 'capex',
        'after_econ_limit': 'no',
        'calculation': 'net',
        'depreciation_model': 'none',
        'deal_terms': 1,
        'description': 'SALV',
        'well_head_oil_cum': 9.2,
        'start': '04/2024'
    }, None),
    ({
        'row': Series(data=(PROPNUM, 8, 'SALV', '-73 90.5 $ 5.2 MB PC 0'), index=CAPEX_TEST_HEADERS),
        'ls_expression': ['-73000', '90000.5', '$', '5.2', 'MB', 'PC', '0'],
        'start_date': '04/2024'
    }, {
        'category': 'salvage',
        'date': '2024-04-01',
        'tangible': -73.0,
        'intangible': -90.0005,
        'capex_expense': 'capex',
        'after_econ_limit': 'no',
        'calculation': 'gross',
        'depreciation_model': 'none',
        'deal_terms': 1,
        'description': 'SALV',
        'well_head_oil_cum': 5200.0,
        'start': '04/2024'
    }, '04/1995')
]
"""Describes different scenarios for testing preprocess method adding conditionals about the final state of certain
variables after calling the `pre_process` method.
input: List[Tuple[str, Any]] -> e.g [('capex.var', 'final_state')]
"""
CAPEX_PREPROCESS_SCENARIOS = [('capex_default_document', AriesDataExtractionMock.get_default_format('capex')),
                              ('invwt_multiplier', 1), ('abandon_delay_days', None), ('abandon_delay_date', None),
                              ('salvage_delay_days', None), ('salvage_delay_date', None)]
"""Describes different scenarios for testing ls_expression building based on raw expression extracted from the economic
dataframe.
input: List[Dict] -> {'expression': str, 'section': str, 'keyword': str}
output: List[str] -> ['35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0']
"""
CAPEX_BUILD_LS_EXPRESSION_SCENARIOS = [
    ({
        'expression': '35 X M$ TO LIFE PC 0',
        'section': '6',
        'keyword': 'PLUG'
    }, ['35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0']),
    (
        {  # noqa (E126)
            'expression': '@M.WFS_START_DATE',
            'section': '6',
            'keyword': 'START'
        },
        ['2023-02-01 00:00:00']),
    ({
        'expression': 2,
        'section': '6',
        'keyword': 'random_keyword'
    }, [])
]
"""Describes different scenarios for testing append capex rows to main data list"""
CAPEX_APPEND_ROW_TO_DATA_LIST_SCENARIOS = [('WFS', [ObjectId(b'scenari_test')]), ('', [ObjectId(b'scenari_test')])]
"""Describes different scenarios for testing model_extraction process"""
CAPEX_MODEL_EXTRACTION_SCENARIOS = [{
    'section_economic_df':
    np.array([[PROPNUM, '6', '40', 'WFS', 'PLUG', '35 X M$ TO LIFE PC 0', None, 'PLUG'],
              [PROPNUM, '6', '10', 'WFS', 'START', '@M.WFS_START_DATE', None, 'PLUG']])
}]
