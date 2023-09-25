from bson import ObjectId


class ScenarioService(object):
    def __init__(self, context):
        self.context = context

    def get_scenario(self, _id):
        return self.context.scenarios_collection.find_one({'_id': ObjectId(_id)})

    def update_scenario(self, _id, body):
        return self.context.scenarios_collection.update_one({'_id': ObjectId(_id)}, {'$set': body})
