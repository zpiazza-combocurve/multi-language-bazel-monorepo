from typing import Iterable, Sequence
from io import BytesIO, TextIOWrapper
from csv import DictWriter


class CsvWriter:
    def __init__(self, columns: Sequence[str]):
        self.file = BytesIO()
        self.text_wrapper = TextIOWrapper(self.file, newline='', encoding='utf-8-sig')
        self.writer = DictWriter(self.text_wrapper, columns)
        self.writer.writeheader()

    def write_row(self, row: dict):
        self.writer.writerow(row)

    def write_rows(self, rows: Iterable[dict]):
        self.writer.writerows(rows)

    def finish(self):
        self.text_wrapper.flush()
        self.file.seek(0)
        return self.file
