from redis import Redis


class RedisClient:
    def __init__(self, host: str, port: int):
        self.client = Redis(host=host, port=port)
