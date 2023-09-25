from typing import Callable, Any, Optional, Sequence, Union, Tuple
from grpc_interceptor import ClientCallDetails, ClientInterceptor

from combocurve.shared.google_auth import get_auth_token, generate_id_token


def requires_auth(dal_url: str) -> bool:
    return dal_url.startswith('https://')


class DALMetadataClientInterceptor(ClientInterceptor):
    _tenant_id: str
    _dal_url: str
    _service_account_email: Optional[str]

    def __init__(self, tenant_id: str, dar_url: str, service_account_email: Optional[str] = None) -> None:
        super().__init__()
        self._tenant_id = tenant_id
        self._dal_url = dar_url
        self._service_account_email = service_account_email

    def intercept(
        self,
        method: Callable,
        request_or_iterator: Any,
        call_details: ClientCallDetails,
    ):
        """Override this method to implement a custom interceptor.

        This method is called for all unary and streaming RPCs. The interceptor
        implementation should call `method` using a `grpc.ClientCallDetails` and the
        `request_or_iterator` object as parameters. The `request_or_iterator`
        parameter may be type checked to determine if this is a singular request
        for unary RPCs or an iterator for client-streaming or client-server streaming
        RPCs.

        Args:
            method: A function that proceeds with the invocation by executing the next
                interceptor in the chain or invoking the actual RPC on the underlying
                channel.
            request_or_iterator: RPC request message or iterator of request messages
                for streaming requests.
            call_details: Describes an RPC to be invoked.

        Returns:
            The type of the return should match the type of the return value received
            by calling `method`. This is an object that is both a
            `Call <https://grpc.github.io/grpc/python/grpc.html#grpc.Call>`_ for the
            RPC and a `Future <https://grpc.github.io/grpc/python/grpc.html#grpc.Future>`_.

            The actual result from the RPC can be got by calling `.result()` on the
            value returned from `method`.
        """

        metadata: Sequence[Tuple[str, str]] = [tuple(("tenant-id", self._tenant_id))]

        if requires_auth(self._dal_url):
            token = generate_id_token(self._service_account_email,
                                      self._dal_url) if self._service_account_email else get_auth_token(self._dal_url)
            metadata.append(("authorization", f"Bearer {token}"))

        new_details = ClientCallDetails(
            call_details.method,
            call_details.timeout,
            metadata,
            call_details.credentials,
            call_details.wait_for_ready,
            call_details.compression,
        )

        return method(request_or_iterator, new_details)
