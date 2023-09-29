from flask import Blueprint, request
from combocurve.shared.helpers import jsonify, gen_req_body, update_error_description_and_log_error
from threading import Thread
from api.decorators import with_context

from combocurve.utils.routes import complete_routing
from combocurve.utils.exceptions import get_exception_info

aries_imports = Blueprint('aries_imports', __name__)
'''
Henry created routes, not using for now

@aries_imports.route('/get_suggest_header', methods=['POST'])
@with_context
def get_suggest_header(context):
    """
    Gets suggested header from context (related to google cloud)
    """
    # POST request is stored in request.json as a json object, and is now stored in req
    req = request.json
    # gets values from "aries_imports_id" key and stores it in aries_import_id
    aries_imports_id = get_value(req, 'aries_imports_id')  # only document id needed (file-imports document _id)
    # use get_suggest_header method to get suggested headers (dictionary) for user
    suggest_header_dic = context.aries_service.get_suggest_header(aries_imports_id)
    # convert python dictionary suggest_header_dic to json object format
    return jsonify(suggest_header_dic)


@aries_imports.route('/get_projects_list', methods=['POST'])
@with_context
def get_projects_list(context):
    # POST request is stored in request.json as a json object, and is now stored in req
    req = request.json
    # gets values from "aries_imports_id" key and stores it in aries_import_id
    aries_imports_id = get_value(req, 'aries_imports_id')  # only document id needed (file-imports document _id)
    # gets names of all the projects in list format
    ls_all_projects = context.aries_service.get_projects_list(aries_imports_id)
    # converts PYTHON list data structure to JSON
    return jsonify(ls_all_projects)


@aries_imports.route('/prepare-aries-import', methods=['POST'])
@with_context
def prepare_aries_import(context):
    # POST request is stored in request.json as a json object, and is now stored in req
    req = request.json
    # gets values from "aries_imports_id" key and stores it in aries_import_id
    aries_imports_id = get_value(req, 'aries_imports_id')  # only document id needed (file-imports document _id)
    # return dictionary key-value pair "wells": suggested well_info headers,"daily": suggested daily well value headers
    # "monthly": suggested monthly well value headers, "projects": project names, "scenarios": list of unique
    # "SCEN_NAME"s
    aries_prepare_dict = context.aries_service.prepare_aries_import(aries_imports_id)
    # convert python dictionary data structure to JSON object
    return jsonify(aries_prepare_dict)


@aries_imports.route('/start_aries_import_parallel', methods=['POST'])
@with_context
def start_aries_import_parallel(context):
    req = request.json
    aries_imports_id = get_value(req, 'aries_imports_id')  # only document id needed (file-imports document _id)

    def import_file(client, aries_imports_id):
        context.aries_service.start_aries_import_parallel(aries_imports_id)

    thread = Thread(target=import_file, args=(context.pusher, aries_imports_id))

    thread.start()

    return 'start_aries_import_parallel'


# helper function only for test parallel importing
@aries_imports.route('/start_aries_import_parallel_multi_thread', methods=['POST'])
@with_context
def start_aries_import_parallel_multi_thread(context):
    req = request.json
    aries_imports_id = get_value(req, 'aries_imports_id')  # only document id needed (file-imports document _id)

    def import_file(client, aries_imports_id):
        context.aries_service.start_aries_import_parallel_multi_thread(aries_imports_id)

    thread = Thread(target=import_file, args=(context.pusher, aries_imports_id))

    thread.start()

    return 'start_aries_import_parallel_multi_thread'
'''


#### routes for preparation work before start import
@aries_imports.route('/get-aries-imports/<user_id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def get_aries_imports(user_id, context):
    return context.aries_service.get_user_aries_imports(user_id)


@aries_imports.route('/get-aries-import/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def get_aries_import(id, context):
    return context.aries_service.get_aries_import_with_files(id)


@aries_imports.route('/create-phdwin-import', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def create_phdwin_import(context):
    body = gen_req_body(request)
    args = {
        'user_id': body.get('user'),
        'description': body.get('description'),
    }
    return context.aries_service.create_phdwin_import(**args)


@aries_imports.route('/create-aries-import', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def create_aries_import(context):
    body = gen_req_body(request)
    args = {
        'user_id': body.get('user'),
        'description': body.get('description'),
    }
    return context.aries_service.create_aries_import(**args)


@aries_imports.route('/set-files/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def set_files(id, context):
    body = gen_req_body(request)
    return context.aries_service.add_files_to_aries_import(id, body['files'])


@aries_imports.route('/parse-aries-file/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def parse_aries_file(id, context):
    body = gen_req_body(request)

    def start_parsing(import_id, files, user_id, socket_name):
        try:
            context.aries_service.parse_aries_to_csv(import_id, files, user_id, socket_name)
            description = 'Parsing Aries file succeed'

            context.pusher.trigger_user_channel(context.subdomain, user_id, socket_name, {
                'success': True,
                'message': description,
            })

        except Exception as e:
            error_info = get_exception_info(e)
            description = 'Parsing Aries file failed'
            description = update_error_description_and_log_error(error_info, description)

            context.pusher.trigger_user_channel(context.subdomain, user_id, socket_name, {
                'failure': True,
                'message': description,
                'error': error_info
            })

    thread = Thread(target=start_parsing,
                    kwargs=({
                        'import_id': id,
                        'files': body['files'],
                        'user_id': body['user'],
                        'socket_name': body['socketName'],
                    }))
    thread.start()

    return 'start parsing Aries file'


@aries_imports.route('/parse-phdwin-file/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def parse_phdwin_file(id, context):
    body = gen_req_body(request)

    def start_parsing(import_id, files, user_id, socket_name):
        try:
            context.aries_service.parse_phdwin_to_csv(import_id, files, user_id, socket_name)
            description = 'Parsing PHDWIN file succeed'

            context.pusher.trigger_user_channel(context.subdomain, user_id, socket_name, {
                'success': True,
                'message': description,
            })

        except Exception as e:
            error_info = get_exception_info(e)
            description = 'Parsing PHDWIN file failed'
            description = update_error_description_and_log_error(error_info, description)

            context.pusher.trigger_user_channel(context.subdomain, user_id, socket_name, {
                'failure': True,
                'message': description,
                'error': error_info
            })

    thread = Thread(target=start_parsing,
                    kwargs=({
                        'import_id': id,
                        'files': body['files'],
                        'user_id': body['user'],
                        'socket_name': body['socketName'],
                    }))
    thread.start()

    return 'start parsing Aries file'


@aries_imports.route('/update-mapping/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def update_mapping(id, context):
    return context.aries_service.update_file_mapping(id, gen_req_body(request))


@aries_imports.route('/auto-map/<id>', methods=['GET'])
@complete_routing(formatter=jsonify)
@with_context
def get_auto_map(id, context):
    file_type = request.args.get('fileType')
    return context.auto_mapping_service.get_auto_mapping_aries(id, file_type)


@aries_imports.route('/finish-mapping', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def finish_mapping(context):
    body = gen_req_body(request)
    return context.aries_service.finish_file_mapping(body['id'], body.get('description'))


@aries_imports.route('/set-project/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def set_import_project(id, context):
    return context.aries_service.set_project(id, gen_req_body(request))


@aries_imports.route('/delete-aries-import/<id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def delete_aries(id, context):
    return context.aries_service.delete_aries_import(id)


@aries_imports.route('/get-scenarios-list/<id>', methods=['POST'])
@with_context
def get_scenarios_list(id, context):
    ls_all_scenarios = context.aries_service.get_scenarios_list(id)
    return jsonify(ls_all_scenarios)


@aries_imports.route('/save-aries-setting/<id>', methods=['POST'])
@with_context
def save_aries_setting(id, context):
    body = gen_req_body(request)

    ls_all_scenarios = context.aries_service.save_aries_setting(id, body)
    return jsonify(ls_all_scenarios)


@aries_imports.route('/save-phdwin-setting/<id>', methods=['POST'])
@with_context
def save_phdwin_setting(id, context):
    body = gen_req_body(request)
    ls_all_scenarios = context.aries_service.save_phdwin_setting(id, body)
    return jsonify(ls_all_scenarios)


@aries_imports.route('/start-phdwin-import/<id>', methods=['POST'])
@with_context
def start_phdwin_import(id, context):
    def process_phdwin_import(import_id):
        context.aries_service.start_phdwin_import(import_id)

    thread = Thread(target=process_phdwin_import, kwargs=({'import_id': id}))

    thread.start()

    return 'start_phdwin_import'


@aries_imports.route('/start-aries-import/<id>', methods=['POST'])
@with_context
def start_aries_import(id, context):
    def process_aries_import(import_id):
        context.aries_service.start_aries_import(import_id)

    thread = Thread(target=process_aries_import, kwargs=({
        'import_id': id,
    }))
    thread.start()

    return 'start_aries_import'
