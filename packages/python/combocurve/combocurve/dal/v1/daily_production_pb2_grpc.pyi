"""
@generated by mypy-protobuf.  Do not edit manually!
isort:skip_file
"""
import abc
import collections.abc
import combocurve.dal.v1.daily_production_pb2
import grpc

class DailyProductionServiceStub:
    def __init__(self, channel: grpc.Channel) -> None: ...
    Upsert: grpc.StreamUnaryMultiCallable[
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceUpsertRequest,
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceUpsertResponse,
    ]
    """Upsert daily production data for multiple wells."""
    ChangeToCompanyScope: grpc.UnaryUnaryMultiCallable[
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceChangeToCompanyScopeRequest,
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceChangeToCompanyScopeResponse,
    ]
    """Update daily production data for multiple wells, when the wells are changed to company scope."""
    Fetch: grpc.UnaryStreamMultiCallable[
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceFetchRequest,
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceFetchResponse,
    ]
    """Fetch daily production data for multiple wells. Results are guaranteed to
    be sorted by well, then by date.
    """
    FetchByWell: grpc.UnaryStreamMultiCallable[
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceFetchByWellRequest,
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceFetchByWellResponse,
    ]
    """Fetch daily production data for multiple wells. Returns a column-structured result per well."""
    SumByWell: grpc.UnaryStreamMultiCallable[
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceSumByWellRequest,
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceSumByWellResponse,
    ]
    """Calculate the sum of daily production phases for multiple wells."""
    CountByWell: grpc.UnaryStreamMultiCallable[
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceCountByWellRequest,
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceCountByWellResponse,
    ]
    """Calculate the amount of values of daily production phases for multiple wells."""
    DeleteByProject: grpc.UnaryUnaryMultiCallable[
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceDeleteByProjectRequest,
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceDeleteByProjectResponse,
    ]
    """Delete all production data for the given project."""
    DeleteByWell: grpc.UnaryUnaryMultiCallable[
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceDeleteByWellRequest,
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceDeleteByWellResponse,
    ]
    """Delete production data for the given well. An optional date range can be
    provided to restrict the production data points to be deleted.
    """
    DeleteByManyWells: grpc.UnaryUnaryMultiCallable[
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceDeleteByManyWellsRequest,
        combocurve.dal.v1.daily_production_pb2.DailyProductionServiceDeleteByManyWellsResponse,
    ]
    """Delete all production data for the given wells."""

class DailyProductionServiceServicer(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    def Upsert(
        self,
        request_iterator: collections.abc.Iterator[combocurve.dal.v1.daily_production_pb2.DailyProductionServiceUpsertRequest],
        context: grpc.ServicerContext,
    ) -> combocurve.dal.v1.daily_production_pb2.DailyProductionServiceUpsertResponse:
        """Upsert daily production data for multiple wells."""
    @abc.abstractmethod
    def ChangeToCompanyScope(
        self,
        request: combocurve.dal.v1.daily_production_pb2.DailyProductionServiceChangeToCompanyScopeRequest,
        context: grpc.ServicerContext,
    ) -> combocurve.dal.v1.daily_production_pb2.DailyProductionServiceChangeToCompanyScopeResponse:
        """Update daily production data for multiple wells, when the wells are changed to company scope."""
    @abc.abstractmethod
    def Fetch(
        self,
        request: combocurve.dal.v1.daily_production_pb2.DailyProductionServiceFetchRequest,
        context: grpc.ServicerContext,
    ) -> collections.abc.Iterator[combocurve.dal.v1.daily_production_pb2.DailyProductionServiceFetchResponse]:
        """Fetch daily production data for multiple wells. Results are guaranteed to
        be sorted by well, then by date.
        """
    @abc.abstractmethod
    def FetchByWell(
        self,
        request: combocurve.dal.v1.daily_production_pb2.DailyProductionServiceFetchByWellRequest,
        context: grpc.ServicerContext,
    ) -> collections.abc.Iterator[combocurve.dal.v1.daily_production_pb2.DailyProductionServiceFetchByWellResponse]:
        """Fetch daily production data for multiple wells. Returns a column-structured result per well."""
    @abc.abstractmethod
    def SumByWell(
        self,
        request: combocurve.dal.v1.daily_production_pb2.DailyProductionServiceSumByWellRequest,
        context: grpc.ServicerContext,
    ) -> collections.abc.Iterator[combocurve.dal.v1.daily_production_pb2.DailyProductionServiceSumByWellResponse]:
        """Calculate the sum of daily production phases for multiple wells."""
    @abc.abstractmethod
    def CountByWell(
        self,
        request: combocurve.dal.v1.daily_production_pb2.DailyProductionServiceCountByWellRequest,
        context: grpc.ServicerContext,
    ) -> collections.abc.Iterator[combocurve.dal.v1.daily_production_pb2.DailyProductionServiceCountByWellResponse]:
        """Calculate the amount of values of daily production phases for multiple wells."""
    @abc.abstractmethod
    def DeleteByProject(
        self,
        request: combocurve.dal.v1.daily_production_pb2.DailyProductionServiceDeleteByProjectRequest,
        context: grpc.ServicerContext,
    ) -> combocurve.dal.v1.daily_production_pb2.DailyProductionServiceDeleteByProjectResponse:
        """Delete all production data for the given project."""
    @abc.abstractmethod
    def DeleteByWell(
        self,
        request: combocurve.dal.v1.daily_production_pb2.DailyProductionServiceDeleteByWellRequest,
        context: grpc.ServicerContext,
    ) -> combocurve.dal.v1.daily_production_pb2.DailyProductionServiceDeleteByWellResponse:
        """Delete production data for the given well. An optional date range can be
        provided to restrict the production data points to be deleted.
        """
    @abc.abstractmethod
    def DeleteByManyWells(
        self,
        request: combocurve.dal.v1.daily_production_pb2.DailyProductionServiceDeleteByManyWellsRequest,
        context: grpc.ServicerContext,
    ) -> combocurve.dal.v1.daily_production_pb2.DailyProductionServiceDeleteByManyWellsResponse:
        """Delete all production data for the given wells."""

def add_DailyProductionServiceServicer_to_server(servicer: DailyProductionServiceServicer, server: grpc.Server) -> None: ...
