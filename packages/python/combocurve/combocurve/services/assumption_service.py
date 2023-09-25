from bson import ObjectId


class AssumptionService(object):
    def __init__(self, context):
        self.context = context

    def get_assumption(self, _id):
        return self.context.assumptions_collection.find_one({'_id': ObjectId(_id)})

    def get_assumptions_batch(self, ids, projection=None):
        if projection is None:
            return list(self.context.assumptions_collection.find({'_id': {'$in': ids}}))
        else:
            return list(self.context.assumptions_collection.find({'_id': {'$in': ids}}, projection))

    def assumption_bulk_write(self, command_list):
        return self.context.assumptions_collection.bulk_write(command_list)

    def get_project_models(self, project_id, assumption_key):
        return list(
            self.context.assumptions_collection.find(
                {
                    'project': ObjectId(project_id),
                    'assumptionKey': assumption_key,
                    'unique': False
                }, {'name': 1}))

    def get_unique_models(self, scenario_id, assumption_key):
        return list(
            self.context.assumptions_collection.find(
                {
                    'scenario': ObjectId(scenario_id),
                    'assumptionKey': assumption_key,
                    'unique': True
                }, {'_id': 1}))

    def get_unique_models_by_well(self, scenario_id, well_id, assumption_key):
        return list(
            self.context.assumptions_collection.find(
                {
                    'scenario': ObjectId(scenario_id),
                    'well': ObjectId(well_id),
                    'assumptionKey': assumption_key
                }, {'name': 1}))

    def get_escalation_models(self, project_id):
        return list(
            self.context.assumptions_collection.find({
                'project': ObjectId(project_id),
                'assumptionKey': 'escalation'
            }, {
                'name': 1,
                'econ_function': 1
            }))

    def get_depreciation_models(self, project_id):
        return list(
            self.context.assumptions_collection.find({
                'project': ObjectId(project_id),
                'assumptionKey': 'depreciation'
            }, {
                'name': 1,
                'econ_function': 1
            }))
