"""
@generated by mypy-protobuf.  Do not edit manually!
isort:skip_file
"""
import builtins
import google.protobuf.descriptor
import google.protobuf.message
import google.protobuf.timestamp_pb2
import sys

if sys.version_info >= (3, 8):
    import typing as typing_extensions
else:
    import typing_extensions

DESCRIPTOR: google.protobuf.descriptor.FileDescriptor

@typing_extensions.final
class DateRange(google.protobuf.message.Message):
    """A date range. Both dates are inclusive."""

    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    START_DATE_FIELD_NUMBER: builtins.int
    END_DATE_FIELD_NUMBER: builtins.int
    @property
    def start_date(self) -> google.protobuf.timestamp_pb2.Timestamp: ...
    @property
    def end_date(self) -> google.protobuf.timestamp_pb2.Timestamp: ...
    def __init__(
        self,
        *,
        start_date: google.protobuf.timestamp_pb2.Timestamp | None = ...,
        end_date: google.protobuf.timestamp_pb2.Timestamp | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing_extensions.Literal["end_date", b"end_date", "start_date", b"start_date"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing_extensions.Literal["end_date", b"end_date", "start_date", b"start_date"]) -> None: ...

global___DateRange = DateRange
