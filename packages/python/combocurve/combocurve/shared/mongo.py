from typing import List

from bson import ObjectId


def get_ids_query(ids: List[ObjectId]):
    return {'_id': {'$in': ids}}


def get_references_query(external_collection_ids: List[ObjectId], reference_field: str):
    return {reference_field: {'$in': external_collection_ids}}


def get_wells_data_query(well_ids: List[ObjectId]):
    return get_references_query(well_ids, 'well')


def get_belongs_to_project_query(project_id: ObjectId, project_field='project'):
    return {project_field: project_id}


def get_belongs_to_forecasts_query(forecast_ids: List[ObjectId]):
    return get_references_query(forecast_ids, 'forecast')


def get_belongs_to_type_curves_query(type_curve_ids: List[ObjectId]):
    return get_references_query(type_curve_ids, 'typeCurve')


def get_shapefile_belongs_to_project_query(project_id: ObjectId):
    return {'$or': [{'visibility': 'company'}, {'projectIds': str(project_id)}]}
