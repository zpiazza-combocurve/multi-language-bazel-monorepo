import copy

import pytest

from api.aries_phdwin_imports.aries_data_extraction.pricing import Pricing
from api.aries_phdwin_imports.aries_data_extraction.tests.pricing.pricing_scenarios import \
    GET_PRICE_DIFFERENTIAL_MODEL_NAME_SCENARIOS, GET_SHIFT_MONTH_YEAR_MLTP_SCENARIOS, get_process_price_scenarios, \
    get_process_list_method_format_scenarios, UPDATE_PRICE_BASED_ON_KEY_SCENARIOS, get_process_cutoff_format, \
    get_process_date_format, APPEND_OBJ_ASSIGN_ESCALATION_SCENARIOS
from api.aries_phdwin_imports.aries_data_extraction.tests.shared.mdb_extract_mock import AriesDataExtractionMock
from api.aries_phdwin_imports.aries_import_helpers import DEFAULT_PRICE_OBJ, DEFAULT_DIFFERENTIAL_OBJ


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', GET_PRICE_DIFFERENTIAL_MODEL_NAME_SCENARIOS)
def test_get_price_differential_model_name(input_, output):
    pricing_model_extraction = Pricing(AriesDataExtractionMock())
    assert pricing_model_extraction.get_price_differential_model_name(input_) == output


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', GET_SHIFT_MONTH_YEAR_MLTP_SCENARIOS)
def test_get_shift_month_year_multiplier(input_, output):
    assert Pricing.get_shift_month_year_multiplier(input_) == output


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', get_process_list_method_format_scenarios())
def test_process_list_method_format(input_, output):
    price_model_extraction = Pricing(AriesDataExtractionMock())
    price_model_extraction.scenario = 'WFS'

    price_default_document = AriesDataExtractionMock.get_default_format('pricing')
    phase_usage_ls = set()

    price_model_extraction.process_list_method_format(**input_,
                                                      price_default_document=price_default_document,
                                                      phase_usage_ls=phase_usage_ls,
                                                      cont='price')

    obj, contained_in = output
    if isinstance(contained_in, tuple):
        model_name, phase = contained_in
        assert obj in price_default_document['econ_function'][model_name][phase]['rows']
    else:
        assert obj in getattr(price_model_extraction, contained_in)


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', get_process_cutoff_format())
def test_process_cutoff_format(input_, output):
    price_model_extraction = Pricing(AriesDataExtractionMock())
    price_default_document = AriesDataExtractionMock.get_default_format('pricing')
    price_obj = copy.deepcopy(DEFAULT_PRICE_OBJ)

    scenario = 5
    section = 15

    result = price_model_extraction.process_cutoff_format(**input_,
                                                          scenario=scenario,
                                                          section=section,
                                                          price_default_document=price_default_document,
                                                          obj=price_obj)

    assert result == output


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', get_process_date_format())
def test_process_date_format(input_, output):
    price_model_extraction = Pricing(AriesDataExtractionMock())
    price_default_document = AriesDataExtractionMock.get_default_format('pricing')
    price_obj = copy.deepcopy(DEFAULT_PRICE_OBJ)

    scenario = 5
    section = 15

    result = price_model_extraction.process_date_format(**input_,
                                                        price_default_document=price_default_document,
                                                        obj=price_obj,
                                                        scenario=scenario,
                                                        section=section)
    assert result == output


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', UPDATE_PRICE_BASED_ON_KEY_SCENARIOS)
def test_update_price_based_on_keyword(input_, output):
    Pricing.update_price_based_on_keyword(*input_)
    assert input_[0] == output


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', get_process_price_scenarios())
def test_process_price(input_, output):
    price_model_extraction = Pricing(AriesDataExtractionMock())

    price_obj = copy.deepcopy(DEFAULT_PRICE_OBJ)
    differential_obj = copy.deepcopy(DEFAULT_DIFFERENTIAL_OBJ)

    phase_usage_ls = set()
    phases_using_list_price = set()

    price_default_document = AriesDataExtractionMock.get_default_format('pricing')

    result = price_model_extraction.process_price(**input_,
                                                  scenario='WFS',
                                                  price_obj=price_obj,
                                                  differential_obj=differential_obj,
                                                  phases_using_list_price=phases_using_list_price,
                                                  phase_usage_ls=phase_usage_ls,
                                                  price_default_document=price_default_document)

    scenarios = [result == output[0]]
    if len(output) > 1:
        scenarios.append(output[1] in phases_using_list_price)

    assert all(scenarios)


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', APPEND_OBJ_ASSIGN_ESCALATION_SCENARIOS)
def test_append_obj_and_assign_escalation(input_, output):
    price_model_extraction = Pricing(AriesDataExtractionMock())
    price_model_extraction.pre_process()

    price_obj = copy.deepcopy(DEFAULT_PRICE_OBJ)
    differential_obj = copy.deepcopy(DEFAULT_DIFFERENTIAL_OBJ)
    price_default_document = AriesDataExtractionMock.get_default_format('pricing')

    phase_usage_ls = set()

    price_model_extraction.append_obj_and_assign_escalation(price_default_document, 'none', price_obj, differential_obj,
                                                            phase_usage_ls, *input_)

    assert price_obj in price_default_document['econ_function']['price_model'][output]['rows']
