import copy

import pandas as pd
import pytest

from api.aries_phdwin_imports.aries_data_extraction.dataclasses.tax_expense import TaxConditionals, TaxExpenseBase
from api.aries_phdwin_imports.aries_data_extraction.tax_expense import TaxExpense
from api.aries_phdwin_imports.aries_data_extraction.tests.shared.mdb_extract_mock import AriesDataExtractionMock
from api.aries_phdwin_imports.aries_data_extraction.tests.tax_expense.tax_expense_scenarios import \
    ASSIGN_KEY_BASED_ON_KEYWORD_SCENARIOS, FORMAT_OBJ_KEY_SCENARIOS, ASSIGN_FIXED_EXPENSE_TO_OBJ_SCENARIOS, \
    EXTRACT_MODEL_NAME_FROM_KEY_SCENARIOS, UNPACK_EXP_VALUES_FROM_EXPRESSION_SCENARIOS, \
    UNPACK_TAX_VALUES_FROM_EXPRESSION_SCENARIOS, UPDATE_OBJ_BASED_ON_MO_CUTOFF_SCENARIOS, \
    UPDATE_OBJ_BASED_ON_YR_CUTOFF_SCENARIOS, get_process_date_format_scenarios, get_process_cutoff_format_scenarios, \
    get_process_tax_formula_method_scenarios, get_process_fixed_expenses_total, get_process_fixed_expense_per_well
from api.aries_phdwin_imports.aries_import_helpers import DEFAULT_TAX_EXPENSE_OBJ, FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT
from combocurve.shared.aries_import_enums import PhaseEnum, EconEnum


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', ASSIGN_KEY_BASED_ON_KEYWORD_SCENARIOS)
def test_assign_key_based_on_keyword(input_, output):
    assert TaxExpense.assign_key_based_on_keyword(*input_) == output


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', FORMAT_OBJ_KEY_SCENARIOS)
def test_format_obj_key(input_, output):
    assert TaxExpense.format_obj_key(*input_) == output


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', ASSIGN_FIXED_EXPENSE_TO_OBJ_SCENARIOS)
def test_assign_fixed_expense_to_obj(input_, output):
    # This function just updates one field in the tax/expense default document, so we just need to evaluate that field
    obj = {'fixed_expense': None}
    expense_default_document = AriesDataExtractionMock.get_default_format('expense')

    TaxExpense.assign_fixed_expense_to_obj(obj, *input_, expense_default_document)

    assert obj['fixed_expense'] is not None and obj['fixed_expense'] == output


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', EXTRACT_MODEL_NAME_FROM_KEY_SCENARIOS)
def test_extract_model_from_keyword(input_, output):
    tax_expense = TaxExpense(AriesDataExtractionMock())
    # Init opc_usage_dict
    tax_expense.pre_process()

    expense_default_document = AriesDataExtractionMock.get_default_format('expense')

    # Complement input
    input_ = (*input_, expense_default_document, {})

    tax_model = tax_expense.extract_model_name_from_keyword(*input_)
    assert all([tax_model.model_name == output[0], tax_model.expense == output[1], tax_model.phase == output[2]])


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', UNPACK_EXP_VALUES_FROM_EXPRESSION_SCENARIOS)
def test_unpack_exp_values_from_expression(input_, output):
    tax_expense = TaxExpense(AriesDataExtractionMock())
    expense_values = tax_expense.unpack_exp_values_from_expression(input_, 0)
    assert all([expense_values.value == output[0], expense_values.cap == output[1], expense_values.unit == output[2]])


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', UNPACK_TAX_VALUES_FROM_EXPRESSION_SCENARIOS)
def test_unpack_tax_values_from_expression(input_, output):
    tax_expense = TaxExpense(AriesDataExtractionMock())
    tax_values = tax_expense.unpack_tax_values_from_expression(input_, 0)
    output_tuple = zip(tax_values, output)
    assert (all([value[0] == value[1] for value in output_tuple]))


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', UPDATE_OBJ_BASED_ON_MO_CUTOFF_SCENARIOS)
def test_update_obj_based_on_mo_cutoff(input_, output):
    start = 0
    start_date = '02/2021'
    new_start_date = '03/2021'

    obj = copy.deepcopy(DEFAULT_TAX_EXPENSE_OBJ)
    tax_conditionals = TaxConditionals()

    TaxExpense.update_obj_based_on_mo_cutoff(obj, start, start_date, new_start_date, tax_conditionals, *input_)
    assert obj['dates'] == output


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', UPDATE_OBJ_BASED_ON_YR_CUTOFF_SCENARIOS)
def test_update_obj_based_on_yr_cutoff(input_, output):
    start = 0
    start_date = '02/2021'
    new_start_date = '03/2021'

    formatted_start_date = pd.to_datetime(start_date) + pd.offsets.MonthBegin(0)

    obj = copy.deepcopy(DEFAULT_TAX_EXPENSE_OBJ)
    tax_conditionals = TaxConditionals()

    params = {
        'obj': obj,
        'start': start,
        'cutoff_unit': input_[0],
        'formated_start_date': formatted_start_date,
        'new_start_date': new_start_date,
        'tax_conditionals': tax_conditionals,
        'expression': input_[1]
    }

    TaxExpense.update_obj_based_on_yr_cutoff(**params)
    assert obj['dates'] == output


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', get_process_date_format_scenarios())
def test_process_date_format(input_, output):
    tax_expense = TaxExpense(AriesDataExtractionMock())
    obj = copy.deepcopy(DEFAULT_TAX_EXPENSE_OBJ)
    # Init opc_usage_dict
    tax_expense.pre_process()

    tax_conditionals = TaxConditionals()
    tax_exp_base = TaxExpenseBase(start_date='12/2024',
                                  fixed_exp_assignment=copy.deepcopy(FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT),
                                  use_std_dict={
                                      PhaseEnum.oil.value: False,
                                      PhaseEnum.gas.value: False,
                                      PhaseEnum.ngl.value: False,
                                      PhaseEnum.aries_condensate.value: False
                                  },
                                  phase_tax_unit_dict={
                                      PhaseEnum.oil.value: None,
                                      PhaseEnum.gas.value: None,
                                      PhaseEnum.ngl.value: None,
                                      PhaseEnum.aries_condensate.value: None
                                  },
                                  tax_default_document=AriesDataExtractionMock.get_default_format('tax'),
                                  exp_default_document=AriesDataExtractionMock.get_default_format('expense'),
                                  tax_expense_overlay_dict={},
                                  hold_expense_doc={},
                                  ignore_list=['TEXT'])

    tax_expense.process_date_format(obj=obj,
                                    economic_values=input_[0],
                                    tax_conditionals=tax_conditionals,
                                    tax_exp_base=tax_exp_base,
                                    default_document=input_[1])

    assert all([obj[key] == item for key, item in output.items()])


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', get_process_cutoff_format_scenarios())
def test_process_cutoff_format(input_, output):
    tax_expense = TaxExpense(AriesDataExtractionMock())
    obj = copy.deepcopy(DEFAULT_TAX_EXPENSE_OBJ)
    # Init opc_usage_dict
    tax_expense.pre_process()

    tax_conditionals = TaxConditionals()
    tax_exp_base = TaxExpenseBase(start_date='12/2024',
                                  fixed_exp_assignment=copy.deepcopy(FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT),
                                  use_std_dict={
                                      PhaseEnum.oil.value: False,
                                      PhaseEnum.gas.value: False,
                                      PhaseEnum.ngl.value: False,
                                      PhaseEnum.aries_condensate.value: False
                                  },
                                  phase_tax_unit_dict={
                                      PhaseEnum.oil.value: None,
                                      PhaseEnum.gas.value: None,
                                      PhaseEnum.ngl.value: None,
                                      PhaseEnum.aries_condensate.value: None
                                  },
                                  tax_default_document=AriesDataExtractionMock.get_default_format('tax'),
                                  exp_default_document=AriesDataExtractionMock.get_default_format('expense'),
                                  tax_expense_overlay_dict={},
                                  hold_expense_doc={},
                                  ignore_list=['TEXT'])

    tax_expense.process_cutoff_format(obj=obj,
                                      economic_values=input_[0],
                                      tax_conditionals=tax_conditionals,
                                      tax_exp_base=tax_exp_base,
                                      default_document_str=input_[1])

    assert all([obj[key] == item for key, item in output.items()])


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', get_process_tax_formula_method_scenarios())
def test_process_tax_formula_method(input_, output):
    tax_expense = TaxExpense(AriesDataExtractionMock())
    obj = copy.deepcopy(DEFAULT_TAX_EXPENSE_OBJ)
    # Init opc_usage_dict
    tax_expense.pre_process()

    start_value = 0

    tax_conditionals = TaxConditionals()
    tax_exp_base = TaxExpenseBase(start_date='12/2024',
                                  fixed_exp_assignment=copy.deepcopy(FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT),
                                  use_std_dict={
                                      PhaseEnum.oil.value: False,
                                      PhaseEnum.gas.value: False,
                                      PhaseEnum.ngl.value: False,
                                      PhaseEnum.aries_condensate.value: False
                                  },
                                  phase_tax_unit_dict={
                                      PhaseEnum.oil.value: None,
                                      PhaseEnum.gas.value: None,
                                      PhaseEnum.ngl.value: None,
                                      PhaseEnum.aries_condensate.value: None
                                  },
                                  tax_default_document=AriesDataExtractionMock.get_default_format('tax'),
                                  exp_default_document=AriesDataExtractionMock.get_default_format('expense'),
                                  tax_expense_overlay_dict={},
                                  hold_expense_doc={},
                                  ignore_list=['TEXT'])

    tax_expense.process_tax_formula_method(obj=obj,
                                           economic_values=input_,
                                           tax_conditionals=tax_conditionals,
                                           tax_exp_base=tax_exp_base,
                                           start_value=start_value)

    tax, phase = list(output.keys())[0].split('.')
    if tax == 'severance_tax':
        assert output[f'{tax}.{phase}'] in tax_exp_base.tax_default_document['econ_function'][tax][phase]['rows']
    elif tax == 'ad_valorem_tax' or input_.sequence == EconEnum.overlay_sequence.value:
        assert output[f'{tax}.{phase}'] in tax_exp_base.tax_default_document['econ_function'][tax]['rows']
    else:
        assert False


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', get_process_fixed_expenses_total())
def test_process_fixed_expenses_total(input_, output):
    obj = copy.deepcopy(DEFAULT_TAX_EXPENSE_OBJ)

    tax_expense = TaxExpense(AriesDataExtractionMock())

    tax_exp_base = TaxExpenseBase(start_date='12/2024',
                                  fixed_exp_assignment=copy.deepcopy(FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT),
                                  use_std_dict={
                                      PhaseEnum.oil.value: False,
                                      PhaseEnum.gas.value: False,
                                      PhaseEnum.ngl.value: False,
                                      PhaseEnum.aries_condensate.value: False
                                  },
                                  phase_tax_unit_dict={
                                      PhaseEnum.oil.value: None,
                                      PhaseEnum.gas.value: None,
                                      PhaseEnum.ngl.value: None,
                                      PhaseEnum.aries_condensate.value: None
                                  },
                                  tax_default_document=AriesDataExtractionMock.get_default_format('tax'),
                                  exp_default_document=AriesDataExtractionMock.get_default_format('expense'),
                                  tax_expense_overlay_dict={},
                                  hold_expense_doc={},
                                  ignore_list=['TEXT'])

    tax_expense.process_fixed_expenses_total(obj=obj,
                                             economic_row=input_[0],
                                             tax_exp_base=tax_exp_base,
                                             exp_values=input_[1])

    assert obj['fixed_expense'] == output


@pytest.mark.unittest
@pytest.mark.parametrize('input_, output', get_process_fixed_expense_per_well())
def test_process_fixed_expense_per_well(input_, output):
    obj = copy.deepcopy(DEFAULT_TAX_EXPENSE_OBJ)

    tax_expense = TaxExpense(AriesDataExtractionMock())

    tax_exp_base = TaxExpenseBase(start_date='12/2024',
                                  fixed_exp_assignment=copy.deepcopy(FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT),
                                  use_std_dict={
                                      PhaseEnum.oil.value: False,
                                      PhaseEnum.gas.value: False,
                                      PhaseEnum.ngl.value: False,
                                      PhaseEnum.aries_condensate.value: False
                                  },
                                  phase_tax_unit_dict={
                                      PhaseEnum.oil.value: None,
                                      PhaseEnum.gas.value: None,
                                      PhaseEnum.ngl.value: None,
                                      PhaseEnum.aries_condensate.value: None
                                  },
                                  tax_default_document=AriesDataExtractionMock.get_default_format('tax'),
                                  exp_default_document=AriesDataExtractionMock.get_default_format('expense'),
                                  tax_expense_overlay_dict={},
                                  hold_expense_doc={},
                                  ignore_list=['TEXT'])

    tax_expense.process_fixed_expense_per_well(obj=obj,
                                               economic_row=input_[0],
                                               tax_exp_base=tax_exp_base,
                                               exp_values=input_[1])
    assert obj['fixed_expense'] == output
