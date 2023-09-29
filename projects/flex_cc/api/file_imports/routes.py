from flask import Blueprint, request

from combocurve.utils.routes import complete_routing
from combocurve.utils.exceptions import get_exception_info
from combocurve.shared.helpers import jsonify, gen_req_body
from api.decorators import with_context
from api.context import Context

file_imports = Blueprint('fileimports', __name__)


class DataImportNotFoundError(Exception):
    expected = True


@file_imports.route('/get-file-imports/<user_id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def get_file_imports(user_id, context: Context):
    return context.file_import_service.get_user_file_imports(user_id)


@file_imports.route('/get-file-import/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def get_file_import(id, context: Context):
    try:
        return context.file_import_service.get_import(id)
    except Exception as error:
        error_info = get_exception_info(error)
        name = error_info.get("name")
        if (name == "DoesNotExist"):
            raise DataImportNotFoundError("Data import not found")
        raise error


@file_imports.route('/create-new-import', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def create_new_import(context: Context):
    body = gen_req_body(request)
    args = {
        'user_id': body.get('user'),
        'project_id': body.get('project'),
        'data_source': body.get('dataSource'),
        'description': body.get('description'),
        'files': body.get('files'),
    }
    return context.file_import_service.create_file_import(**args)


@file_imports.route('/create-import', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def create_import(context: Context):
    body = gen_req_body(request)
    args = {
        'user_id': body.get('user'),
        'project_id': body.get('project'),
        'data_source': body.get('dataSource'),
        'description': body.get('description'),
    }
    return context.file_import_service.create_import(**args)


@file_imports.route('/set-files/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def set_files(id, context: Context):
    body = gen_req_body(request)
    return context.file_import_service.add_files_to_file_import(id, body['files'])


@file_imports.route('/get-file-headers/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def get_file_headers(id, context: Context):
    return jsonify(context.file_import_service.get_headers(id))


@file_imports.route('/update-mapping/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def update_mapping(id, context: Context):
    return context.file_import_service.update_file_mapping(id, gen_req_body(request))


@file_imports.route('/auto-map/<id>', methods=['GET'])
@complete_routing(formatter=jsonify)
@with_context
def get_auto_map(id, context: Context):
    file_type = request.args.get('fileType')
    return context.auto_mapping_service.get_auto_mapping(id, file_type)


@file_imports.route('/finish-mapping', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def finish_mapping(context: Context):
    body = gen_req_body(request)
    return context.file_import_service.finish_file_mapping(body['id'], body.get('description'))


@file_imports.route('/get-wells-info/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def get_wells_info(id, context: Context):
    return context.file_import_service.get_wells_info(id)


@file_imports.route('/set-project/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def set_import_project(id, context: Context):
    return context.file_import_service.set_project(id, gen_req_body(request))


@file_imports.route('/config-import/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def config_import(id, context: Context):
    body = gen_req_body(request)
    return context.file_import_service.config_import(id, body.get('project'), body.get('replaceProduction'))


@file_imports.route('/delete-file/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def delete_file(id, context: Context):
    return context.file_import_service.delete_file_import(id)


@file_imports.route('/start-import/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def start_import(id, context: Context):
    body = gen_req_body(request)
    return context.file_import_service.start_file_import(id, body['user'], body['notificationId'])
