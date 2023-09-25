from typing import Iterable, BinaryIO, Mapping, Type

from combocurve.shared.collections import split_in_chunks_lazy
from combocurve.services.forecast.export_settings import ChartsExportSettings
from .document_writer import ChartsDocumentWriter
from .pdf_writer import ChartsPdfWriter
from .pptx_writer import ChartsPptxWriter

DEFAULT_ROWS = 2
DEFAULT_COLUMNS = 2

CHARTS_DISTRIBUTION = {
    1: (1, 1),
    2: (1, 2),
    4: (2, 2),
    6: (2, 3),
    8: (2, 4),
}

WRITER_CLASSES: Mapping[str, Type[ChartsDocumentWriter]] = {
    'pdf': ChartsPdfWriter,
    'pptx': ChartsPptxWriter,
}


def generate_document(images_files: Iterable[BinaryIO], output_file: BinaryIO, settings: ChartsExportSettings):
    rows, columns = CHARTS_DISTRIBUTION.get(settings.effective_charts_per_page, (DEFAULT_ROWS, DEFAULT_COLUMNS))

    writer_cls = WRITER_CLASSES[settings.document_format]

    with writer_cls(output_file, rows, columns, settings.landscape_orientation) as writer:
        # using split_in_chunks_lazy is important here to guarantee that the generator producing the files can close
        # them after they are processed
        for page_images in split_in_chunks_lazy(images_files, rows * columns):
            writer.next_page()
            positions = ((r, c) for r in range(rows) for c in range(columns))
            for ((r, c), image) in zip(positions, page_images):
                writer.draw_image(image, r, c)


def merge_documents(partial_files: Iterable[BinaryIO], output_file: BinaryIO, settings: ChartsExportSettings):
    writer_cls = WRITER_CLASSES[settings.document_format]
    writer_cls.merge_docs(partial_files, output_file)
