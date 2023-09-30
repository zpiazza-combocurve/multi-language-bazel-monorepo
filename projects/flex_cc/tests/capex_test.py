import numpy as np
import pandas as pd
import pytest
from bson import ObjectId

from api.aries_phdwin_imports.aries_data_extraction.capex import Capex
from api.aries_phdwin_imports.aries_data_extraction.tests.constants import AC_ECONOMIC_TABLE
from api.aries_phdwin_imports.aries_data_extraction.tests.shared.mdb_extract_mock import AriesDataExtractionMock
from api.aries_phdwin_imports.aries_data_extraction.tests.capex.capex_scenarios import CREATE_CAPEX_OBJ_SCENARIOS, \
    CAPEX_PREPROCESS_SCENARIOS, CAPEX_APPEND_ROW_TO_DATA_LIST_SCENARIOS, CAPEX_BUILD_LS_EXPRESSION_SCENARIOS, \
    CAPEX_MODEL_EXTRACTION_SCENARIOS


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output, base_date', CREATE_CAPEX_OBJ_SCENARIOS)
def test_create_capex_obj(input_, output, base_date):
    capex_model_extraction = Capex(AriesDataExtractionMock())
    capex_model_extraction.capex_default_document = AriesDataExtractionMock.get_default_format('capex')
    if base_date:
        capex_model_extraction.aries_data_extraction.dates_1_base_date = base_date

    capex_obj = capex_model_extraction.create_capex_object(**input_)
    if capex_obj:
        # delete escalation keys
        del capex_obj['escalation_model']
    assert capex_obj == output


@pytest.mark.unittest
def test_pre_process():
    capex_model_extraction = Capex(AriesDataExtractionMock())
    capex_model_extraction.property_id = 'KCAKOBFMHJ'

    section_economic_df = pd.DataFrame(AC_ECONOMIC_TABLE)
    capex_model_extraction.header_cols = list(section_economic_df.columns)

    capex_model_extraction.section_economic_df = np.array(section_economic_df)

    capex_model_extraction.pre_process()

    # Compare the actual final state of capex_model_extraction obj with the expected output
    compiled_scenarios = [getattr(capex_model_extraction, scn[0]) == scn[1] for scn in CAPEX_PREPROCESS_SCENARIOS]
    assert all(compiled_scenarios)


@pytest.mark.unittest
@pytest.mark.parametrize('input_, ls_expression', CAPEX_BUILD_LS_EXPRESSION_SCENARIOS)
def test_build_ls_expression(input_, ls_expression):
    capex_model_extraction = Capex(AriesDataExtractionMock())
    capex_model_extraction.property_id = 'KCAKOBFMHJ'
    capex_model_extraction.scenario = 'WFS'

    assert capex_model_extraction.build_ls_expression(**input_, model=Capex.__name__) == ls_expression


@pytest.mark.unittest
@pytest.mark.parametrize('capex_model_name, ls_scenarios_id', CAPEX_APPEND_ROW_TO_DATA_LIST_SCENARIOS)
def test_append_capex_row_to_data_list(capex_model_name, ls_scenarios_id):
    capex_model_extraction = Capex(AriesDataExtractionMock())
    capex_model_extraction.capex_default_document = AriesDataExtractionMock.get_default_format('capex')
    capex_model_extraction.ls_scenarios_id = ls_scenarios_id

    capex_model_extraction.scenario = 'WFS'
    capex_model_extraction.property_id = 'KCAKOBFMHJ'

    capex_model_extraction.append_capex_row_to_data_list(capex_model_name)

    assert capex_model_extraction.capex_default_document in capex_model_extraction.aries_data_extraction.capex_data_list


@pytest.mark.unittest
@pytest.mark.parametrize('input_', CAPEX_MODEL_EXTRACTION_SCENARIOS)
def test_model_extraction(input_):
    capex_model_extraction = Capex(AriesDataExtractionMock())
    capex_model_extraction.aries_data_extraction.dates_1_base_date = '04/2000'
    input_.update({
        'header_cols':
        ['PROPNUM', 'SECTION', 'SEQUENCE', 'QUALIFIER', 'KEYWORD', 'EXPRESSION', 'EXTRACTED SEQUENCE', 'keyword_mark'],
        'ls_scenarios_id': [ObjectId(b'scenari_test')],
        'scenario':
        'WFS',
        'property_id':
        'KCAKOBFMHJ',
        'index':
        'unused',
        'elt':
        False
    })

    capex_model_extraction.model_extraction(**input_)
    assert len(capex_model_extraction.aries_data_extraction.capex_data_list) > 0
