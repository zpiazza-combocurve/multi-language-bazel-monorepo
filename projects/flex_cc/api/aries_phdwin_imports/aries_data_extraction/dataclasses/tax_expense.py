from dataclasses import dataclass
from typing import Union

import pandas as pd


@dataclass
class TaxModel:
    model_name: str = ''
    phase: str = ''
    fixed_cost_name: str = ''
    expense: str = ''


@dataclass
class TaxExpenseNaming:
    tax_model_name: str = ''
    expense_model_name: str = ''


@dataclass
class TaxConditionals:
    start_fpd: bool = False
    start_asof: bool = False
    auto_return: bool = False
    use_fpd: bool = False
    use_asof: bool = False
    tax_overlay_present: bool = False
    use_tax_model: bool = False
    use_expense_model: bool = False
    expense_overlay_present: bool = False


@dataclass
class TaxExpenseBase:
    start_date: Union[str, pd.DatetimeIndex]
    fixed_exp_assignment: dict
    use_std_dict: dict
    phase_tax_unit_dict: dict
    tax_default_document: dict
    exp_default_document: dict
    tax_expense_overlay_dict: dict
    hold_expense_doc: dict
    ignore_list: list[str]


@dataclass
class ExpenseValues:
    unit: str = ''
    cap: str = ''
    value: str = ''
