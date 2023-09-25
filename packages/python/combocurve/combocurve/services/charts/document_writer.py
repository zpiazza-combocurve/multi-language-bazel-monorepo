from typing import BinaryIO, Iterable
from abc import ABC, abstractmethod


class ChartsDocumentWriter(ABC):
    def __init__(self, file: BinaryIO, rows: int, columns: int, is_landscape: bool = True):
        super().__init__()
        self.file = file
        self.columns = columns
        self.rows = rows
        self.is_landscape = is_landscape

    @abstractmethod
    def draw_image(self, image_file: BinaryIO, row: int, column: int):
        pass

    @abstractmethod
    def next_page(self):
        pass

    @abstractmethod
    def close(self):
        pass

    @staticmethod
    @abstractmethod
    def merge_docs(document_files: Iterable[BinaryIO], output_file: BinaryIO):
        pass

    def __enter__(self):
        return self

    def __exit__(self, type, value, traceback):
        self.close()
