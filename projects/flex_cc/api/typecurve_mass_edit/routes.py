from flask import request, Blueprint
from api.decorators import with_context
from combocurve.services.type_curve.tc_volume_export_service import TypeCurveVolumeExportService
from combocurve.utils.exceptions import get_exception_info
from combocurve.shared.helpers import update_error_description_and_log_error
from combocurve.utils.logging import add_to_logging_metadata

tc_mass_edit = Blueprint('tc_mass_edit', __name__)


@tc_mass_edit.route('/tc-fit-export', methods=['POST'])
@with_context
def typecurve_download(context):
    req = request.json
    p_req = {
        'tc_id': req.get('tc_id'),
        'user_id': req.get('user_id'),
        'project_id': req.get('project_id'),
        'project_name': req.get('project_name'),
        'adjust_segment': req.get('adjust_segment', False)
    }

    try:
        file_id = context.tc_mass_download_service.download(p_req)
        description = 'TypeCurve export complete'

        return {'success': True, 'file_id': file_id, 'error_info': None}

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'TypeCurve export failed'
        description = update_error_description_and_log_error(error_info, description)
        add_to_logging_metadata({'typecurve export': p_req})

        return {'success': False, 'file_id': None, 'error_info': error_info}


@tc_mass_edit.route('/tc-fit-import', methods=['POST'])
@with_context
def typecurve_upload(context):
    req = request.json
    p_req = {
        'file_id': req['file_id'],
        'user_id': req.get('user_id'),
        'project_id': req.get('project_id'),
        'forecast_id': req.get('forecast_id'),
        'identifier': req.get('identifier')
    }

    try:
        file_id, has_error = context.tc_mass_upload_service.upload(p_req)
        description = 'TypeCurve import complete'
        return {'success': True, 'file_id': file_id, 'has_error': has_error}

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'TypeCurve import failed'
        description = update_error_description_and_log_error(error_info, description)
        return {'success': False, 'error_message': description}


@tc_mass_edit.route('/tc-volumes-export', methods=['POST'])
@with_context
def typecurve_volumes_export(context):
    req = request.json
    p_req = {
        'tc_id': req['tc_id'],
        'start_time': req['start_time'],
        'phases': req['phases'],
        'base_phase_series': req['base_phase_series'],
        'project_id': req['project_id']
    }

    try:
        tc_vol_export = TypeCurveVolumeExportService(context, **p_req)
        file_id = tc_vol_export.export_data()
        return {'success': True, 'file_id': file_id}

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'TypeCurve volume export failed'
        description = update_error_description_and_log_error(error_info, description)
        return {'success': False, 'error_message': description}


@tc_mass_edit.route('/tc-workflow-export', methods=['POST'])
@with_context
def typecurve_workflow_export(context):
    req = request.json

    try:
        file_id = context.tc_workflow_export_service.tc_workflow_export(req)
        description = 'TypeCurve export complete'

        return {'success': True, 'file_id': file_id, 'error_info': None}

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'TypeCurve export failed'
        description = update_error_description_and_log_error(error_info, description)
        add_to_logging_metadata({'typecurve export': req})

        return {'success': False, 'file_id': None, 'error_info': error_info}


@tc_mass_edit.route('/external-tc-volumes', methods=['POST'])
@with_context
def external_tc_volumes(context):
    req = request.json

    try:
        tc_volumes = context.tc_external_service.tc_volumes(req)
        description = 'External TC volumes export complete'

        return tc_volumes

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'External TC volumes export failed'
        description = update_error_description_and_log_error(error_info, description)
        add_to_logging_metadata({'External TC volumes export failed': req})

        return None


@tc_mass_edit.route('/external-tc-rep-wells', methods=['POST'])
@with_context
def external_tc_rep_wells(context):
    req = request.json

    try:
        tc_rep_wells = context.tc_external_service.tc_rep_wells(req)
        description = 'External TC Rep Wells export complete'

        return tc_rep_wells

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'External TC Rep wells export failed'
        description = update_error_description_and_log_error(error_info, description)
        add_to_logging_metadata({'External TC volumes export failed': req})

        return None
