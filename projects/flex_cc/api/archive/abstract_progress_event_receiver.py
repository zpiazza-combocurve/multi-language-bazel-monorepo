from abc import ABC, abstractmethod


def get_progress_name(step: str, name: str):
    return f'{step}__{name}'


class AbstractProgressEventReceiver(ABC):
    @abstractmethod
    def __init__(self, context, user_id: str, notification_id: str):
        pass

    @abstractmethod
    def init(self):
        pass

    @abstractmethod
    def end(self, results: dict):
        pass

    @abstractmethod
    def error(self, error: Exception):
        pass

    @abstractmethod
    def progress(self, name: str, progress: float):
        pass
