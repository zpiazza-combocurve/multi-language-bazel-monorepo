from typing import Iterable
from bson import ObjectId


class WellService(object):

    def __init__(self, context):
        self.context = context

    def get_wells(self, ids: Iterable[ObjectId]):
        return list(self.context.wells_collection.find({'_id': {'$in': ids}}))
