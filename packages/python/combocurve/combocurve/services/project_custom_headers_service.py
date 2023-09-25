from typing import TYPE_CHECKING, Iterable, Optional

from bson import ObjectId

if TYPE_CHECKING:
    from apps.python_apis.api.context import APIContext


class ProjectCustomHeadersService:
    def __init__(self, context: 'APIContext') -> None:
        self.context = context

    def get_project_custom_headers_doc(self, project: ObjectId) -> dict:
        return self.context.project_custom_headers_collection.find_one({'project': project})

    def get_project_custom_headers_dict(self, project: ObjectId) -> dict:
        project_custom_headers_doc = self.get_project_custom_headers_doc(project)

        headers = {}

        if project_custom_headers_doc:
            for header_info in project_custom_headers_doc['headers']:
                headers[header_info['name']] = header_info['label']

        return headers

    def get_custom_headers_in_project(self, project: ObjectId):
        project_custom_headers_doc = self.get_project_custom_headers_doc(project)

        if project_custom_headers_doc:
            return [h['name'] for h in project_custom_headers_doc['headers']]
        return []

    def get_custom_headers_data(self, project: ObjectId, wells: Iterable[ObjectId], headers=None):
        projection = [f'customHeaders.{h}' for h in headers] if headers else []
        project_headers_docs = self.context.project_custom_headers_datas_collection.find(
            {
                'project': project,
                'well': {
                    '$in': list(wells)
                }
            }, ['well', *projection])
        return {doc['well']: doc.get('customHeaders', {}) for doc in project_headers_docs}

    def get_well_headers_with_custom_headers(
        self,
        project_id: ObjectId,
        wells: Iterable[ObjectId],
        headers: Optional[Iterable[str]] = None,
    ):
        wells_pipeline = [{
            '$match': {
                '_id': {
                    '$in': list(wells)
                }
            }
        }, {
            '$lookup': {
                'from': 'project-custom-headers-datas',
                'localField': '_id',
                'foreignField': 'well',
                'as': 'customHeaders',
                'let': {},
                'pipeline': [{
                    '$match': {
                        'project': project_id
                    }
                }, {
                    '$project': {
                        '_id': 0,
                        'customHeaders': 1
                    }
                }]
            },
        }, {
            '$unwind': {
                'path': '$customHeaders',
                'preserveNullAndEmptyArrays': True
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': ['$customHeaders', '$$ROOT']
                }
            }
        }, {
            '$unset': 'customHeaders'
        }]

        if headers is not None:
            wells_pipeline.append({'$project': {h: 1 for h in headers}})

        result = {doc['_id']: doc for doc in self.context.wells_collection.aggregate(wells_pipeline)}
        return result
