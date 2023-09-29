import pytest
import pandas as pd
from api.forecast_mass_edit.forecast_import_aries import ForecastImportAries
from api.context import Context
from api.aries_phdwin_imports.aries_forecast_helpers.aries_forecast_import import AriesForecastImport
from api.aries_phdwin_imports.helpers import parallel_dic

forecast_import_aries = ForecastImportAries(Context)


def create_aries_dict(cums=list(),
                      oil=list(),
                      gas_oil=list(),
                      gas=list(),
                      ngl_gas=list(),
                      oil_gas=list(),
                      wtr=list(),
                      wtr_oil=list(),
                      wtr_gas=list()) -> dict:
    return {
        'CUMS': cums,
        'OIL': oil,
        'GAS/OIL': gas_oil,
        'GAS': gas,
        'NGL/GAS': ngl_gas,
        'OIL/GAS': oil_gas,
        'WTR': wtr,
        'WTR/OIL': wtr_oil,
        'WTR/GAS': wtr_gas
    }


@pytest.mark.unittest
def test_clean_aries_dict():

    aries_lines = {
        '4l6vmm7UGG': {
            'MISCELLANEOUS': create_aries_dict(),
            'PRODUCTION': {
                'CUMS': ['CUMS      0 68.1 0 0...   CC_QUAL'],
                'OIL': [],
                'GAS/OIL': [],
                'GAS': [
                    'START     01/2011   ...   CC_QUAL', 'GAS       8213.5524 ...   CC_QUAL',
                    '"         X X M/D 49...   CC_QUAL'
                ],
                'NGL/GAS': [],
                'OIL/GAS': [],
                'WTR': [
                    'START     06/2011   ...   CC_QUAL', 'WTR       10.2505 X ...   CC_QUAL',
                    '"         X X B/D 20...   CC_QUAL'
                ],
                'WTR/OIL': [],
                'WTR/GAS': []
            },
            'PRICES': create_aries_dict(),
            'COSTS': create_aries_dict(),
            'OWNERSHIP': create_aries_dict(),
            'INVESTMENT': create_aries_dict(),
            'OVERLAY': create_aries_dict(),
        }
    }

    cleaned_aries_dict = forecast_import_aries.clean_aries_dict(aries_lines)
    assert cleaned_aries_dict['4l6vmm7UGG']['PRODUCTION']['CUMS'] == ['CUMS      0 68.1 0 0...   CC_QUAL']
    assert cleaned_aries_dict['4l6vmm7UGG']['PRODUCTION']['GAS'] == [
        'START     01/2011   ...   CC_QUAL', 'GAS       8213.5524 ...   CC_QUAL', '"         X X M/D 49...   CC_QUAL'
    ]
    assert cleaned_aries_dict['4l6vmm7UGG']['PRODUCTION']['WTR'] == [
        'START     06/2011   ...   CC_QUAL', 'WTR       10.2505 X ...   CC_QUAL', '"         X X B/D 20...   CC_QUAL'
    ]

    aries_lines = {
        '4l6vmm7UGG': {
            'MISCELLANEOUS': create_aries_dict(),
            'PRICES': create_aries_dict(),
        }
    }
    cleaned_aries_dict = forecast_import_aries.clean_aries_dict(aries_lines)
    assert cleaned_aries_dict['4l6vmm7UGG']['PRICES']['CUMS'] == []

    aries_lines = {'4l6vmm7UGG': {'TEST': {'CUMS': []}}}
    cleaned_aries_dict = forecast_import_aries.clean_aries_dict(aries_lines)
    assert cleaned_aries_dict['4l6vmm7UGG']['TEST']['CUMS'] == []

    aries_lines = {}
    cleaned_aries_dict = forecast_import_aries.clean_aries_dict(aries_lines)
    assert cleaned_aries_dict == {}

    aries_lines = {
        'AX8qncCj7Y': {
            'MISCELLANEOUS':
            create_aries_dict(),
            'PRODUCTION':
            create_aries_dict(oil=[
                'START     03/2020   ...   CC_QUAL', 'OIL       1000.0 X B...   CC_QUAL',
                'START     03/2020   ...   CC_QUAL', '"         950.0 X B/...   CC_QUAL'
            ]),
            'PRICES':
            create_aries_dict(),
            'COSTS':
            create_aries_dict(),
            'OWNERSHIP':
            create_aries_dict(),
            'INVESTMENT':
            create_aries_dict(),
            'OVERLAY':
            create_aries_dict(),
        }
    }
    cleaned_aries_dict = forecast_import_aries.clean_aries_dict(aries_lines)
    assert cleaned_aries_dict['AX8qncCj7Y']['PRODUCTION']['OIL'] == [
        'START     03/2020   ...   CC_QUAL', 'OIL       1000.0 X B...   CC_QUAL', '"         950.0 X B/...   CC_QUAL'
    ]


@pytest.mark.unittest
@pytest.mark.parametrize("template", [{'PROPNUM': '4l6vmm7UGG', 'SECTION': '4', 'QUALIFIER': 'CC_QUAL'}])
def test_write_aries_dict(template):
    cleaned_aries_dict = {
        '4l6vmm7UGG': {
            'MISCELLANEOUS':
            create_aries_dict(),
            'PRODUCTION':
            create_aries_dict(
                cums=['CUMS      0 68.1 0 0 0 1.46795                                                  CC_QUAL'],
                gas=[
                    'START     01/2011                                                               CC_QUAL',
                    'GAS       8213.5524 X M/D 8.0 EXP B/0.9535 36.9557                              CC_QUAL',
                    '"         X X M/D 49.1499 IYR EXP 8.0                                           CC_QUAL'
                ],
                wtr=[
                    'START     06/2011                                                               CC_QUAL',
                    'WTR       10.2505 X B/D 8.0 EXP B/1.0262 62.6218                                CC_QUAL',
                    '"         X X B/D 20.2875 IYR EXP 8.0                                           CC_QUAL'
                ]),
            'PRICES':
            create_aries_dict(),
            'COSTS':
            create_aries_dict(),
            'OWNERSHIP':
            create_aries_dict(),
            'INVESTMENT':
            create_aries_dict(),
            'OVERLAY':
            create_aries_dict(),
        }
    }
    res = [
        template | {
            'SEQUENCE': 10,
            'KEYWORD': 'CUMS',
            'EXPRESSION': '0 68.1 0 0 0 1.46795'
        }, template | {
            'SEQUENCE': 20,
            'KEYWORD': 'START',
            'EXPRESSION': '01/2011'
        }, template | {
            'SEQUENCE': 30,
            'KEYWORD': 'GAS',
            'EXPRESSION': '8213.5524 X M/D 8.0 EXP B/0.9535 36.9557'
        }, template | {
            'SEQUENCE': 40,
            'KEYWORD': '"',
            'EXPRESSION': 'X X M/D 49.1499 IYR EXP 8.0'
        }, template | {
            'SEQUENCE': 50,
            'KEYWORD': 'START',
            'EXPRESSION': '06/2011'
        }, template | {
            'SEQUENCE': 60,
            'KEYWORD': 'WTR',
            'EXPRESSION': '10.2505 X B/D 8.0 EXP B/1.0262 62.6218'
        }, template | {
            'SEQUENCE': 70,
            'KEYWORD': '"',
            'EXPRESSION': 'X X B/D 20.2875 IYR EXP 8.0'
        }
    ]

    qualifier = ''

    aries_data = forecast_import_aries.write_aries_dict(cleaned_aries_dict, qualifier)
    assert len(aries_data) == 7
    assert aries_data == res

    cleaned_aries_dict = {
        'MISCELLANEOUS': create_aries_dict(),
        'PRICES': create_aries_dict(),
    }
    aries_data = forecast_import_aries.write_aries_dict(cleaned_aries_dict, qualifier)
    assert len(aries_data) == 0

    cleaned_aries_dict = {}
    aries_data = forecast_import_aries.write_aries_dict(cleaned_aries_dict, qualifier)
    assert len(aries_data) == 0

    cleaned_aries_dict = {
        '4l6vmm7UGG': {
            'MISCELLANEOUS':
            create_aries_dict(),
            'PRODUCTION':
            create_aries_dict(
                cums=['CUMS      0 68.1 0 0 0 1.46795                                                  CC_QUAL'],
                gas=[
                    'START     01/2011                                                               CC_QUAL',
                    'GAS       8213.5524 X M/D 8.0 EXP B/0.9535 36.9557                              CC_QUAL',
                    '"         X X M/D 49.1499 IYR EXP 8.0                                           CC_QUAL'
                ],
                wtr=[
                    'START     06/2011                                                               CC_QUAL',
                    'WTR       10.2505 X B/D 8.0 EXP B/1.0262 62.6218                                CC_QUAL',
                    '"         X X B/D 20.2875 IYR EXP 8.0                                           CC_QUAL'
                ])
        }
    }
    aries_data = forecast_import_aries.write_aries_dict(cleaned_aries_dict, qualifier)
    assert len(aries_data) == 7
    assert aries_data == res

    cleaned_aries_dict = {
        '4l6vmm7UGG': {
            'MISCELLANEOUS':
            create_aries_dict(),
            'PRODUCTION':
            create_aries_dict(oil=[
                'START     03/2020                                                               CC_QUAL',
                'OIL       1000.0 X B/D 0.2519 YRS EXP 30.5977                                   CC_QUAL',
                '"         950.0 X B/D 0.2519 IYR B/0.9 27.08                                    CC_QUAL'
            ], ),
            'PRICES':
            create_aries_dict(),
            'COSTS':
            create_aries_dict(),
            'OWNERSHIP':
            create_aries_dict(),
            'INVESTMENT':
            create_aries_dict(),
            'OVERLAY':
            create_aries_dict(),
        }
    }

    res = [
        template | {
            'SEQUENCE': 10,
            'KEYWORD': 'START',
            'EXPRESSION': '03/2020'
        }, template | {
            'SEQUENCE': 20,
            'KEYWORD': 'OIL',
            'EXPRESSION': '1000.0 X B/D 0.2519 YRS EXP 30.5977'
        }, template | {
            'SEQUENCE': 30,
            'KEYWORD': '"',
            'EXPRESSION': '950.0 X B/D 0.2519 IYR B/0.9 27.08'
        }
    ]
    aries_data = forecast_import_aries.write_aries_dict(cleaned_aries_dict, qualifier)
    assert len(aries_data) == 3
    assert aries_data == res


@pytest.mark.unittest
@pytest.mark.parametrize("template", [{
    'PROPNUM': 'DNr3PXcJLc',
    'WELL NAME': 'BURKMONT FARMS BRA 2H',
    'WELL NUMBER': '',
    'SECTION': 4,
    'INPT ID': 'DNr3PXcJLc',
    'API10': '',
    'API12': '',
    'API14': 370000000000.0,
    'CHOSEN ID': 'M98HAGD0KS',
    'ARIES ID': '',
    'PHDWIN ID': ''
}])
def test_select_qualifier(template):

    aries_data = [
        template | {
            'SEQUENCE': 10,
            'QUALIFIER': 'CC_QUAL',
            'KEYWORD': 'CUMS',
            'EXPRESSION': '0 29.3 0 0 0 0'
        }, template | {
            'SEQUENCE': 20,
            'QUALIFIER': 'CC_QUAL',
            'KEYWORD': 'START',
            'EXPRESSION': '05/2013'
        }, template | {
            'SEQUENCE': 30,
            'QUALIFIER': 'CC_QUAL',
            'KEYWORD': 'GAS',
            'EXPRESSION': '12123.2033 X M/D 8.0 EXP B/0.9894 45.2315'
        }, template | {
            'SEQUENCE': 40,
            'QUALIFIER': 'CC',
            'KEYWORD': '"',
            'EXPRESSION': 'X X M/D 49.0294 IYR EXP 8.0'
        }
    ]
    aries_data_unique_qualifier = forecast_import_aries.select_qualifier(aries_data, qualifier=None)
    assert len(aries_data_unique_qualifier) == 3
    assert aries_data_unique_qualifier[0]['QUALIFIER'] == 'CC_QUAL'
    assert aries_data_unique_qualifier[1]['QUALIFIER'] == 'CC_QUAL'

    aries_data_unique_qualifier = forecast_import_aries.select_qualifier(aries_data, qualifier='CC')
    assert len(aries_data_unique_qualifier) == 1
    assert aries_data_unique_qualifier[0]['QUALIFIER'] == 'CC'

    aries_data_unique_qualifier = forecast_import_aries.select_qualifier(aries_data, qualifier='CC_QUAL')
    assert len(aries_data_unique_qualifier) == 3
    assert aries_data_unique_qualifier[0]['QUALIFIER'] == 'CC_QUAL'
    assert aries_data_unique_qualifier[1]['QUALIFIER'] == 'CC_QUAL'


@pytest.mark.parametrize("template", [{
    'PROPNUM': 'DNr3PXcJLc',
    'WELL NAME': 'BURKMONT FARMS BRA 2H',
    'WELL NUMBER': '',
    'SECTION': 4,
    'INPT ID': 'DNr3PXcJLc',
    'API10': '',
    'API12': '',
    'API14': 370000000000.0,
    'CHOSEN ID': 'M98HAGD0KS',
    'ARIES ID': '',
    'PHDWIN ID': ''
}])
def test_aries_cc_translator(template):
    aries_data = [
        template | {
            'SEQUENCE': 10,
            'QUALIFIER': 'CC_QUAL',
            'KEYWORD': 'CUMS',
            'EXPRESSION': '0 29.3 0 0 0 0'
        }, template | {
            'SEQUENCE': 20,
            'QUALIFIER': 'CC_QUAL',
            'KEYWORD': 'START',
            'EXPRESSION': '05/2013'
        }, template | {
            'SEQUENCE': 30,
            'QUALIFIER': 'CC_QUAL',
            'KEYWORD': 'GAS',
            'EXPRESSION': '12123.2033 X M/D 8.0 EXP B/0.9894 45.2315'
        }, template | {
            'SEQUENCE': 40,
            'QUALIFIER': 'CC_QUAL',
            'KEYWORD': '"',
            'EXPRESSION': 'X X M/D 49.0294 IYR EXP 8.0'
        }
    ]

    aries_data_df = pd.DataFrame.from_records(aries_data)
    aries_data_df = aries_data_df.dropna(how='all')

    aries_forecast_param_obj = AriesForecastImport('myfakeuserid', None, None, None, parallel_dic)
    aries_forecast_param_obj.pre_process()

    cc_forecast_import_df, error_log, valid_input = aries_forecast_param_obj.aries_forecast_import_parameters(
        aries_data_df)

    assert type(cc_forecast_import_df) == pd.DataFrame
    assert error_log == []
    assert valid_input is True

    aries_forecast_param_obj = AriesForecastImport('myfakeuserid', None, None, None, parallel_dic)
    aries_forecast_param_obj.pre_process()

    cc_forecast_import_df, error_log, valid_input = aries_forecast_param_obj.aries_forecast_import_parameters([])
    assert cc_forecast_import_df.shape == (0, 0)
    assert len(error_log) == 0
    assert valid_input is False

    aries_forecast_param_obj = AriesForecastImport('myfakeuserid', None, None, None, parallel_dic)
    aries_forecast_param_obj.pre_process()
    aries_data = [
        template | {
            'QUALIFIER': 'CC_QUAL',
            'SEQUENCE': 10,
            'KEYWORD': 'CUMS',
            'EXPRESSION': '0 68.1 0 0 0 1.46795'
        }, template | {
            'QUALIFIER': 'CC_QUAL',
            'SEQUENCE': 20,
            'KEYWORD': 'START',
            'EXPRESSION': '01/2011'
        }, template | {
            'QUALIFIER': 'CC_QUAL',
            'SEQUENCE': 30,
            'KEYWORD': 'GAS',
            'EXPRESSION': '8213.5524 X M/D 8.0 EXP B/0.9535 36.9557'
        }, template | {
            'QUALIFIER': 'CC_QUAL',
            'SEQUENCE': 40,
            'KEYWORD': '"',
            'EXPRESSION': 'X X M/D 49.1499 IYR EXP 8.0'
        }, template | {
            'QUALIFIER': 'CC_QUAL',
            'SEQUENCE': 50,
            'KEYWORD': 'START',
            'EXPRESSION': '06/2011'
        }, template | {
            'QUALIFIER': 'CC_QUAL',
            'SEQUENCE': 60,
            'KEYWORD': 'WTR',
            'EXPRESSION': '10.2505 X B/D 8.0 EXP B/1.0262 62.6218'
        }, template | {
            'QUALIFIER': 'CC_QUAL',
            'SEQUENCE': 70,
            'KEYWORD': '"',
            'EXPRESSION': 'X X B/D 20.2875 IYR EXP 8.0'
        }
    ]
    aries_data_df = pd.DataFrame.from_records(aries_data)
    aries_data_df = aries_data_df.dropna(how='all')
    cc_forecast_import_df, error_log, valid_input = aries_forecast_param_obj.aries_forecast_import_parameters(
        aries_data_df)

    assert type(cc_forecast_import_df) == pd.DataFrame
    assert error_log == []
    assert valid_input is True
