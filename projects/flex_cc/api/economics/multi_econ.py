from bson import ObjectId


class EconomicService(object):
    def __init__(self, context):
        self.context = context

    def get_econ_run_data(self, props):
        wells = props['wells']
        user = props['user']

        pipline = [{
            '$match': {
                'well': {
                    '$in': list(map(lambda x: ObjectId(x), wells))
                },
                'user': ObjectId(user)
            }
        }, {
            '$lookup': {
                'from': 'wells',
                'as': 'well',
                'localField': 'well',
                'foreignField': '_id',
            },
        }, {
            '$project': {
                '_id': 0,
                'data': 1,
                'oneLinerData': 1,
                'run': 1,
                'well.well_name': 1,
                'well.prms_reserves_category': 1,
                'well.prms_reserves_sub_category': 1,
                'well.prms_resources_class': 1,
            }
        }]

        return self.context.economic_data_collection.aggregate(pipline)

    def output_object_to_array(self, sum):
        final = []

        for key in sum.keys():
            years = []
            col = sum[key]
            obj = col.copy()

            for y in obj['years'].keys():
                year = obj['years'][y]
                years.append({'year': y, 'total': year.toal, 'months': list(year.months.values())})

            obj['years'] = years
            final[obj['order']] = obj

        return final
