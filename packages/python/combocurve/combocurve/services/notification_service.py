from datetime import datetime

from bson import ObjectId
from pymongo import ReturnDocument
from combocurve.shared.serialization import make_serializable

from combocurve.utils.constants import COMPANY_NOTIFICATION_UPDATE_EVENT_NAME, USER_NOTIFICATION_UPDATE_EVENT_NAME


class NotificationService(object):
    def __init__(self, context):
        self.context = context

    def get_notification(self, id):
        return self.context.notifications_collection.find_one({'_id': ObjectId(id)})

    def update_notification(self, _id, body):
        query = {'_id': ObjectId(_id)}
        update = {'$set': {**body, 'updatedAt': datetime.utcnow()}}
        return self.context.notifications_collection.find_one_and_update(query,
                                                                         update,
                                                                         return_document=ReturnDocument.AFTER)

    def add_notification(self, body):
        document = {**body, 'updatedAt': datetime.utcnow(), 'createdAt': datetime.utcnow()}
        result = self.context.notifications_collection.insert_one(document)
        return self.get_notification(result.inserted_id)

    def update_notification_with_notifying_target(self, _id, body):
        updated = self.update_notification(_id, body)
        self._push_notification(updated)
        return updated

    def add_notification_with_notifying_target(self, body):
        notification = self.add_notification(body)
        self._push_notification(notification)
        return notification

    def notify_progress(self, notification_id, user_id, progress):
        if progress >= 0 and progress <= 100:
            self._push_notification({'_id': notification_id, 'forUser': user_id, 'progress': progress})

    def _push_notification(self, notification):
        if notification['forUser']:
            self.context.pusher.trigger_user_channel(
                self.context.subdomain,
                str(notification['forUser']),
                USER_NOTIFICATION_UPDATE_EVENT_NAME,
                make_serializable(notification),
            )
        else:
            self.context.pusher.trigger_company_channel(
                self.context.subdomain,
                COMPANY_NOTIFICATION_UPDATE_EVENT_NAME,
                make_serializable(notification),
            )
