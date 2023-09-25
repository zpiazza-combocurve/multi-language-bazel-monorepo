from typing import Mapping
from enum import Enum
from datetime import datetime, timedelta

from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME, COMPANY_NOTIFICATION_UPDATE_EVENT_NAME
from combocurve.utils.pusher import PusherWrapper


class PusherChannel(Enum):
    USER = 'user'
    COMPANY = 'company'


class ProgressNotifier:
    def __init__(self,
                 pusher: PusherWrapper,
                 notification_id: str,
                 subdomain: str,
                 user_id: str,
                 pusher_channel=PusherChannel.USER,
                 min_time_interval=timedelta(seconds=1),
                 min_progress_interval=1):
        self.pusher = pusher
        self.notification_id = notification_id
        self.subdomain = subdomain
        self.user_id = user_id
        self.pusher_channel = pusher_channel
        self.min_time_interval = min_time_interval
        self.min_progress_interval = min_progress_interval
        self._last_notify_time = datetime.min
        self._last_notify_progress = float('-inf')

    def _trigger_pusher(self, progress):
        update = {'_id': self.notification_id, 'progress': progress if progress <= 99 else 99}
        if self.pusher_channel == PusherChannel.USER:
            self.pusher.trigger_user_channel(self.subdomain, self.user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, update)
        else:
            self.pusher.trigger_company_channel(self.subdomain, COMPANY_NOTIFICATION_UPDATE_EVENT_NAME, update)

    def notify(self, progress):
        now = datetime.now()
        time_diff = now - self._last_notify_time
        progress_diff = progress - self._last_notify_progress
        if progress != 100 and (time_diff < self.min_time_interval or progress_diff < self.min_progress_interval):
            return
        self._last_notify_time = now
        self._last_notify_progress = progress
        self._trigger_pusher(progress)


class WeightedProgressNotifier(ProgressNotifier):
    def __init__(self,
                 weights: Mapping[str, float],
                 pusher: PusherWrapper,
                 notification_id: str,
                 subdomain: str,
                 user_id: str,
                 min_time_interval=timedelta(seconds=1),
                 min_progress_interval=1):
        super().__init__(pusher, notification_id, subdomain, user_id, PusherChannel.USER, min_time_interval,
                         min_progress_interval)
        self.weights = weights
        self._weight_progress = 0
        self._total_weight = sum(self.weights.values())

    @property
    def progress(self):
        return self._weight_progress * 100 / self._total_weight

    def add_partial_progress(self, category: str, fraction: float):
        self._weight_progress += self.weights[category] * fraction
        self.notify(self.progress)
