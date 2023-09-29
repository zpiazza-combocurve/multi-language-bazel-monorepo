import csv
from io import TextIOWrapper
from os import SEEK_END
from abc import ABC, abstractmethod
import logging
from combocurve.utils.exceptions import get_exception_info

import xlrd


def _get_file_size(file):
    current_pos = file.tell()
    file.seek(0, SEEK_END)
    res = file.tell()
    file.seek(current_pos)
    return res


class SpreadsheetReader(ABC):
    @abstractmethod
    def __init__(self):
        self.errors = []

    @abstractmethod
    def open(self):
        pass

    @abstractmethod
    def get_headers(self):
        return []

    @abstractmethod
    def get_rows(self):
        while False:
            yield []

    @abstractmethod
    def get_progress(self):
        return 0

    @abstractmethod
    def close(self):
        pass

    def __enter__(self):
        self.open()
        return self

    def __exit__(self, type, value, traceback):
        self.close()

    def get_dicts(self):
        headers = self.get_headers()
        return ({headers[i]: row[i] for i in range(len(headers))} for row in self.get_rows())


class ExcelFileReader(SpreadsheetReader):
    def __init__(self, file):
        super().__init__()
        self.file = file
        self.sheet = None
        self.file_size = _get_file_size(file)
        self._total = 0
        self._cur = 0

    def open(self):
        self.file.seek(0)
        wb = xlrd.open_workbook(file_contents=self.file.read())
        self.sheet = wb.sheet_by_index(0)
        self._total = self.sheet.nrows

    def get_headers(self):
        return [str(self.sheet.cell(0, col).value) for col in range(0, self.sheet.ncols)]

    def get_rows(self):
        for row in range(1, self.sheet.nrows):
            self._cur = row
            row_values = [self._get_str_value(row, col) for col in range(self.sheet.ncols)]
            if not any(row_values):
                continue
            yield row_values

    def _get_str_value(self, row, col):
        cell = self.sheet.cell(row, col)
        if cell.ctype in {xlrd.XL_CELL_EMPTY, xlrd.XL_CELL_TEXT, xlrd.XL_CELL_BLANK}:
            return cell.value
        if cell.ctype == xlrd.XL_CELL_NUMBER:
            val = cell.value
            if isinstance(val, float) and val.is_integer():
                val = int(val)
            return str(val)
        if cell.ctype == xlrd.XL_CELL_BOOLEAN:
            return "True" if cell.value else "False"
        if cell.ctype == xlrd.XL_CELL_DATE:
            datetime = xlrd.xldate.xldate_as_datetime(cell.value, self.sheet.book.datemode)
            return datetime.isoformat() + 'Z'  # this assumes all datetimes are in UTC
        return None

    def get_progress(self):
        return self._cur / self._total

    def close(self):
        self.file.close()


class CsvFileReader(SpreadsheetReader):
    def __init__(self, file):
        super().__init__()
        self._original_file = file
        # using errors='replace' will cause us to lose characters that cannot be decoded with UTF-8
        # however, MongoDB only accepts UTF-8, so they would be lost anyway, sooner or later
        self.file = TextIOWrapper(file, newline='', errors='replace')
        self.reader = None
        self.file_size = _get_file_size(self._original_file)
        self.current_line = 0

    def open(self):
        self.file.seek(0)
        self.reader = csv.reader(self.file)

    def _read_rows(self):
        try:
            for row in self.reader:
                yield row
        except csv.Error as e:
            error_info = get_exception_info(e)
            logging.error('Error reading CSV file', extra={'metadata': {'error': error_info}})

            raise InvalidCsvError('Error reading CSV file. Check your file for anything invalid.')

    def get_headers(self):
        self.file.seek(0)
        self.current_line = 0
        try:
            return next(self._read_rows())
        except StopIteration:
            raise EmptyFileError('One of the files is empty. This could be due to a problem during upload.\n'
                                 'Check your files first, then retry the upload.\n'
                                 'If the problem persists, contact support.')

    def _get_row(self, headers, row):
        res = list(row)

        if len(headers) != len(res):
            self.errors.append({"line": self.current_line, "error": "Invalid number of columns"})
            res = None
        elif not any(res):
            res = None

        self.current_line += 1
        return res

    def get_rows(self):
        self.errors = []
        self.file.seek(0)

        headers = list(self.get_headers())

        self.current_line = 1
        all_rows = (self._get_row(headers, row) for row in self._read_rows())

        return (row for row in all_rows if row is not None)

    def get_progress(self):
        return self._original_file.tell() / self.file_size

    def close(self):
        self.file.close()


class EmptyFileError(Exception):
    expected = True


class InvalidCsvError(Exception):
    expected = True
