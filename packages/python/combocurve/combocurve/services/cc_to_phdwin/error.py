import io
import csv

ERROR_REPORT_COLUMNS = ['Case', 'InptID', 'Model', 'Message']


class ErrorLog:
    def __init__(self):
        self.error_report = io.StringIO()
        self.csv_writer = csv.writer(self.error_report, quoting=csv.QUOTE_NONNUMERIC)
        self.csv_writer.writerow(ERROR_REPORT_COLUMNS)
        self.has_error = False

    def log_error(self, **kwargs):
        self.has_error = True
        name = kwargs.get('name')
        assumption_type = kwargs.get('assumption')

        if assumption_type == 'Dates':
            message = 'No Dates model found, using FPD as ASOF and Discount Date'
        elif name is None:
            message = 'Error Processing Assumption for this well'
        else:
            message = f'Error Processing Model name: {name}'
        error_row = [kwargs.get('well_name'), kwargs.get('chosen_id'), assumption_type, message]
        self.csv_writer.writerow(error_row)
