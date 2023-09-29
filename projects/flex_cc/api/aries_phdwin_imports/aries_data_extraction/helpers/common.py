from api.aries_phdwin_imports.aries_data_extraction.capex import Capex
from api.aries_phdwin_imports.aries_data_extraction.overlay import Overlay
from api.aries_phdwin_imports.aries_data_extraction.ownership import Ownership
from api.aries_phdwin_imports.aries_data_extraction.pricing import Pricing
from api.aries_phdwin_imports.aries_data_extraction.tax_expense import TaxExpense
from api.aries_phdwin_imports.error import ErrorMsgEnum

models = {
    Capex.__name__: ErrorMsgEnum.capex.value,
    Pricing.__name__: ErrorMsgEnum.price.value,
    Ownership.__name__: ErrorMsgEnum.ownership.value,
    TaxExpense.__name__: ErrorMsgEnum.tax_expense.value,
    Overlay.__name__: ErrorMsgEnum.overlay.value
}


def get_model_value(model: str):
    return models.get(model, ErrorMsgEnum.capex.value)


def get_shift_month_year_multiplier(ls_expression: str):
    if ls_expression in ['#', '#/M', '#M']:
        return {'shift_month': 1, 'shift_year': 0, 'multiplier': 1}

    elif ls_expression in ['#/Y', '#Y']:
        return {'shift_month': 0, 'shift_year': 1, 'multiplier': 1}

    elif ls_expression in ['M#', 'M#/M', 'M#M']:
        return {'shift_month': 1, 'shift_year': 0, 'multiplier': 1000}

    elif ls_expression in ['M#/Y', 'M#Y']:
        return {'shift_month': 0, 'shift_year': 1, 'multiplier': 1000}
