from typing import BinaryIO, Iterable

from reportlab.graphics import renderPDF
from reportlab.graphics.shapes import Drawing
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import inch
from svglib.svglib import svg2rlg
from PyPDF2 import PdfFileMerger

from .document_writer import ChartsDocumentWriter


def _scale_drawing(drawing: Drawing, width, height):
    scale_x = width / drawing.width
    scale_y = height / drawing.height
    drawing.width = width
    drawing.height = height
    drawing.scale(scale_x, scale_y)


class ChartsPdfWriter(ChartsDocumentWriter):
    margin = 0.25 * inch

    def __init__(self, file: BinaryIO, rows: int, columns: int, is_landscape: bool = True):
        super().__init__(file, rows, columns, is_landscape)
        self.page_size = landscape(A4) if self.is_landscape else A4
        self.page_width, self.page_height = self.page_size
        self.inner_width = self.page_width - 2 * self.margin
        self.inner_height = self.page_height - 2 * self.margin
        self.image_width = self.inner_width / columns
        self.image_height = self.inner_height / rows
        self.canvas = Canvas(file, pagesize=self.page_size)
        self.opened_first_page = False

    def draw_image(self, image_file: BinaryIO, row: int, column: int):
        if not self.opened_first_page:
            raise AssertionError(
                'Attempted to draw image before getting first page. Remember to call `next_page` first.')

        x = self.margin + column * self.image_width
        y = self.page_height - self.margin - (row + 1) * self.image_height
        image_drawing = svg2rlg(image_file)
        _scale_drawing(image_drawing, self.image_width, self.image_height)
        renderPDF.draw(image_drawing, self.canvas, x, y)

    def next_page(self):
        if not self.opened_first_page:
            self.opened_first_page = True
            return
        self.canvas.showPage()

    def close(self):
        self.canvas.showPage()
        self.canvas.save()

    @staticmethod
    def merge_docs(document_files: Iterable[BinaryIO], output_file: BinaryIO):
        merger = PdfFileMerger()
        for doc in document_files:
            merger.append(doc)
        merger.write(output_file)
