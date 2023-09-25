import logging
from typing import Optional
import re
from grpc import Channel, secure_channel, insecure_channel, intercept_channel, ssl_channel_credentials
from grpc.experimental import ChannelOptions

from .client_interceptor import DALMetadataClientInterceptor

from combocurve.dal.stubs import DailyProduction, MonthlyProduction

_CHANNEL_OPTIONS = [(ChannelOptions.SingleThreadedUnaryStream, 1)]


class DAL:
    '''
        The DAL client.

        Usage:

        Somewhere in come context class:

        ```python
        self.dal = DAL.connect(tenant_id, dal_url)
        ```

        Somewhere in come service class:

        ```python
        self.context.dal.daily_production.FetchByWell()
        ```
    '''
    daily_production: DailyProduction
    monthly_production: MonthlyProduction

    def __init__(self, channel: Channel) -> None:
        self.daily_production = DailyProduction(channel)
        self.monthly_production = MonthlyProduction(channel)

    @staticmethod
    def connect(tenant_id: str, dal_url: str, dal_service_account: Optional[str] = None) -> 'DAL':
        '''
            Connect to the DAL server and return a DAL client instance.

            `tenant_id`: the tenant id
            `dal_url`: the address of the DAL server
            `dal_service_account`: the service account email to use for authentication. Defaults to None. Not used
            normally, except for testing.
        '''
        secure = dal_url.startswith('https://')
        simplified_url = re.sub(r'http[s]?://', '', dal_url)

        if simplified_url == 'localhost:50051':
            simplified_url = 'host.docker.internal:50051'
            logging.info(f'Replacing url to {simplified_url}')

        if secure:
            logging.info(f'Using secure channel to {simplified_url}')
            channel = secure_channel(simplified_url, ssl_channel_credentials(), _CHANNEL_OPTIONS)
        else:
            logging.info(f'Using insecure channel to {simplified_url}')
            channel = insecure_channel(simplified_url, _CHANNEL_OPTIONS)

        channel = intercept_channel(channel, DALMetadataClientInterceptor(tenant_id, dal_url, dal_service_account))

        return DAL(channel)
