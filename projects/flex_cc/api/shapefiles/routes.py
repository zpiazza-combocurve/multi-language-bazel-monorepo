from threading import Thread

from flask import Blueprint, request

from combocurve.utils.routes import complete_routing
from combocurve.shared.helpers import jsonify
from api.decorators import with_context
from api.context import Context

shapefiles = Blueprint('shapefiles', __name__)


@shapefiles.route('/', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def upload(context: Context):
    body = request.json
    file_id = body['file']
    name = body['name']
    description = body['description']
    color = body['color']
    project_ids = body['projectIds']
    scope = body['scope']
    tileset = body['tileset']
    user_id = body['userId']

    thread = Thread(target=lambda: context.shapefile_service.upload(file_id, name, description, color, project_ids,
                                                                    scope, tileset, user_id))
    thread.start()

    return 'started'


@shapefiles.route('/geojson', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def upload_geojson(context: Context):
    body = request.json
    features = body['features']
    name = body['name']
    description = body['description']
    color = body['color']
    project_ids = body['projectIds']
    scope = body['scope']
    tileset = body['tileset']
    user_id = body['userId']

    thread = Thread(target=lambda: context.shapefile_service.upload_geojson(features, name, description, color,
                                                                            project_ids, scope, tileset, user_id))
    thread.start()

    return 'started'


@shapefiles.route('/<shapefile_id>/shapes/<index>', methods=['GET'])
@complete_routing(formatter=jsonify)
@with_context
def get_shape(context: Context, shapefile_id, index):
    return context.shapefile_service.get_shape(shapefile_id, index)


@shapefiles.route('/<shapefile_id>/export', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def export(context: Context, shapefile_id):
    body = request.json
    format = body['format']
    file_name = body['fileName']
    user_id = body['userId']

    thread = Thread(target=lambda: context.shapefile_service.export(shapefile_id, format, file_name, user_id))
    thread.start()

    return 'started'
