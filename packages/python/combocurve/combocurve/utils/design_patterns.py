import threading


class SingletonMeta(type):
    """This is a thread-safe Metaclass implementation of the Singleton design pattern.

    You should not inherit from this class directly, but rather use it as a metaclass."""

    _instances = {}

    _lock: threading.Lock = threading.Lock()

    def __call__(cls, *args, **kwargs):
        with cls._lock:
            if cls not in cls._instances:
                instance = super().__call__(*args, **kwargs)
                cls._instances[cls] = instance
        return cls._instances[cls]
