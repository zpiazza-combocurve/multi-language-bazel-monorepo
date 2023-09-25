from combocurve.science.econ.embedded_lookup_table.conversion import EmbeddedConverter
from combocurve.science.econ.embedded_lookup_table.expense_conversion import ExpenseConverter
from combocurve.science.econ.embedded_lookup_table.capex_conversion import CAPEXConverter

CONVERTERS = {'expense': ExpenseConverter, 'CAPEX': CAPEXConverter}


class ConversionFactory():
    def converter(self, assumption: str) -> EmbeddedConverter:
        return CONVERTERS[assumption]
