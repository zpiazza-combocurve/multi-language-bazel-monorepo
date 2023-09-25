"""
@generated by mypy-protobuf.  Do not edit manually!
isort:skip_file
"""
import abc
import collections.abc
import combocurve.external.v1.monthly_production_pb2
import grpc

class ExternalMonthlyProductionServiceStub:
    def __init__(self, channel: grpc.Channel) -> None: ...
    Count: grpc.UnaryUnaryMultiCallable[
        combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceCountRequest,
        combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceCountResponse,
    ]
    """Count monthly production data for multiple wells."""
    Fetch: grpc.UnaryStreamMultiCallable[
        combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceFetchRequest,
        combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceFetchResponse,
    ]
    """Fetch monthly production data for multiple wells."""
    Upsert: grpc.StreamUnaryMultiCallable[
        combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceUpsertRequest,
        combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceUpsertResponse,
    ]
    """Upsert monthly production data for multiple wells."""
    DeleteByWell: grpc.UnaryUnaryMultiCallable[
        combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceDeleteByWellRequest,
        combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceDeleteByWellResponse,
    ]
    """Delete production data for the given well. An optional date range can be
    provided to restrict the production data points to be deleted.
    """

class ExternalMonthlyProductionServiceServicer(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    def Count(
        self,
        request: combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceCountRequest,
        context: grpc.ServicerContext,
    ) -> combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceCountResponse:
        """Count monthly production data for multiple wells."""
    @abc.abstractmethod
    def Fetch(
        self,
        request: combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceFetchRequest,
        context: grpc.ServicerContext,
    ) -> collections.abc.Iterator[combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceFetchResponse]:
        """Fetch monthly production data for multiple wells."""
    @abc.abstractmethod
    def Upsert(
        self,
        request_iterator: collections.abc.Iterator[combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceUpsertRequest],
        context: grpc.ServicerContext,
    ) -> combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceUpsertResponse:
        """Upsert monthly production data for multiple wells."""
    @abc.abstractmethod
    def DeleteByWell(
        self,
        request: combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceDeleteByWellRequest,
        context: grpc.ServicerContext,
    ) -> combocurve.external.v1.monthly_production_pb2.ExternalMonthlyProductionServiceDeleteByWellResponse:
        """Delete production data for the given well. An optional date range can be
        provided to restrict the production data points to be deleted.
        """

def add_ExternalMonthlyProductionServiceServicer_to_server(servicer: ExternalMonthlyProductionServiceServicer, server: grpc.Server) -> None: ...
