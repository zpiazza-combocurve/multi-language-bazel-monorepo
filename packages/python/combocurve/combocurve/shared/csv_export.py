from typing import Mapping, Iterable
from io import TextIOBase
import csv


def export_headers(headers: Iterable[str], headers_file: TextIOBase):
    csv.writer(headers_file).writerow(headers)


def export_rows_with_headers(rows: Iterable[Mapping[str, str]], headers: Iterable[str], dest_file: TextIOBase):
    writer = csv.DictWriter(dest_file, headers, extrasaction='ignore')
    writer.writerows(rows)


def export_rows(rows: Iterable[Mapping[str, str]], headers_file: TextIOBase, dest_file: TextIOBase):
    headers = next(csv.reader(headers_file))
    export_rows_with_headers(rows, headers, dest_file)
