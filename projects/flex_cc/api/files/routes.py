import json
from datetime import datetime, timedelta

from flask import Blueprint, redirect, request

from combocurve.utils.routes import complete_routing
from combocurve.shared.helpers import jsonify, gen_req_body
from api.decorators import with_context

files = Blueprint('files', __name__)


@files.route('/get-bucket-files', methods=['GET'])
@complete_routing(formatter=jsonify)
@with_context
def get_bucket_files_req(context):
    return context.file_service.get_bucket_files()


@files.route('/download-file/<gcp_name>/<name>', methods=['GET'])
@with_context
def download_file_req(gcp_name, name, context):
    options = {
        'expiration': datetime.utcnow() + timedelta(minutes=30),
        'response_disposition': f'attachment; filename={name}'
    }
    return redirect(context.file_service.get_url(gcp_name, options))


@files.route('/upload-files', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def upload_files_req(context):
    data = request.form
    file_data = json.loads(data['files'])
    files = request.files

    return [context.file_service.upload_file(files[f['name']], f) for f in file_data]


@files.route('/delete-file/<gcp_name>', methods=['DELETE'])
@complete_routing(formatter=jsonify)
@with_context
def delete_file_req(gcp_name, context):
    res = context.file_service.delete_file(gcp_name)
    return {'deleted': res}


@files.route('/get-signed-url', methods=['POST'])
@complete_routing(formatter=lambda x: x)
@with_context
def get_signed_url(context):
    body = gen_req_body(request)
    gcp_name = body['gcpName']
    content_type = body['contentType']
    return context.file_service.get_url(gcp_name, {
        'content_type': content_type,
        'method': 'PUT',
        'expiration': datetime.utcnow() + timedelta(minutes=30)
    })


@files.route('/save-file-info', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def save_file_info(context):
    return context.file_service.create_file(gen_req_body(request))
