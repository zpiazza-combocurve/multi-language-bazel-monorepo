from datetime import datetime, timedelta
from abc import ABC, abstractclassmethod
from combocurve.services.lookup_table_service import lines_processor


class EmbeddedConverter(ABC):

    @abstractclassmethod
    def incorporate_embedded(self):
        ...

    def get_value_as_float(self, input_value):
        try:
            return float(input_value)
        except (ValueError, TypeError):  # add to error report after we build it
            return 0

    def lines_processor(self, lines, assumption=''):
        return lines_processor(lines, assumption)

    def row_converter(self, current_input, expense_type):
        '''takes embedded lookup table values and converts them into rows format

        Args:
            current_input (dict): expense parameters for calculating rows
            expense_type (str): type of expense

        Returns:
            list: rows that reflect those of the original expense models
        '''
        criteria = current_input['criteria']
        unit = current_input['unit'] if expense_type not in ('carbon_expense') else expense_type

        # value and period can be a single number (when flat or only 1 row in time series) or a list (multiple rows)
        value = current_input['value'] if type(current_input['value']) is list else [current_input['value']]
        period = current_input['period'] if type(current_input['period']) is list else [current_input['period']]
        if len(value) < len(period):
            value.extend([0] * (len(period) - len(value)))

        if criteria == 'dates':
            start = []
            end = []

            for input_date in period:
                format_date = datetime.strptime(input_date, '%m/%Y')

                start.append(format_date.strftime('%Y-%m-%d'))
                end.append((format_date - timedelta(days=1)).strftime('%Y-%m-%d'))

            end = end[1:] + ['Econ Limit']

            expense_rows = [{
                unit: self.get_value_as_float(value[i]),
                'dates': {
                    'start_date': start[i],
                    'end_date': end[i]
                }
            } for i in range(len(start))]

        elif 'rate' in criteria:
            start = []
            end = []

            for rate_input in period:
                start.append(rate_input)
                end.append(rate_input)

            end.pop(0)
            end.append('inf')

            expense_rows = [{
                unit: self.get_value_as_float(value[i]),
                criteria: {
                    'start': start[i],
                    'end': end[i],
                }
            } for i in range(len(start))]

        elif criteria != 'entire_well_life':  # for offset criteria
            start = [1]
            end = []
            for offset_input in period:
                start.append(start[-1] + offset_input)
                end.append(start[-1] - 1)
            start.pop()

            expense_rows = [{
                unit: self.get_value_as_float(value[i]),
                criteria: {
                    'start': start[i],
                    'end': end[i],
                    'period': end[i] - start[i] + 1
                }
            } for i in range(len(start))]

        else:
            expense_rows = [{unit: self.get_value_as_float(value[-1]), 'entire_well_life': 'Flat'}]

        return expense_rows

    def orig_emb(self, dictionary, type_model):
        '''attach whether the current model is the original or a connected embedded lookup table

        Args:
            dictionary (dict): expense model parameters
            type_model (str): whether the model in the dictionary is the original model or from an embedded table

        Returns:
            dict: dictionary with type model included
        '''
        dictionary['type_model'] = type_model
        return dictionary
