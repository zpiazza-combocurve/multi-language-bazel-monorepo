from typing import Optional, List
from bson import ObjectId


class WellService(object):
    def __init__(self, context):
        self.context = context

    def get_well(self, _id):
        return self.context.wells_collection.find_one({'_id': ObjectId(_id)})

    def get_wells_inptid(self, inpt_ids, projection=None):
        if projection is None:
            return list(self.context.wells_collection.find({'inptID': {'$in': inpt_ids}}))
        else:
            return list(self.context.wells_collection.find({'inptID': {'$in': inpt_ids}}, projection))

    def get_wells_from_chosen_ids(self,
                                  data_source: str,
                                  project: Optional[str],
                                  chosen_ids: List[str],
                                  fields: Optional[List[str]] = None):
        query = {
            'dataSource': data_source,
            'project': ObjectId(project) if project else None,
            'chosenID': {
                '$in': chosen_ids
            }
        }
        if fields is None:
            return self.context.wells_collection.find(query)
        else:
            return self.context.wells_collection.find(query, {f: 1 for f in fields})

    def get_wells_batch(self, ids, projection=None):
        if projection is None:
            return list(self.context.wells_collection.find({'_id': {'$in': ids}}).sort('_id', 1))
        else:
            return list(self.context.wells_collection.find({'_id': {'$in': ids}}, projection).sort('_id', 1))

    def get_di_wells(self):
        return self.context.wells_collection.find({'dataSource': 'di'}, {'api14': 1, 'inptID': 1})
