from combocurve.utils.routes import complete_routing_cf
from combocurve.cloud.concurrent.with_context_decorator import with_context
from combocurve.shared.helpers import jsonify
from cloud_runs.external_api_import.context import ExternalAPIImportContext


class ExternalApiParamsError(Exception):
    expected = True


@complete_routing_cf(formatter=jsonify)
@with_context(ExternalAPIImportContext)
def handle(request, context):
    payload = request.json
    try:
        data = payload['data']
        import_operation = payload['importOperation']
        resource_type = payload['resourceType']
    except KeyError as error:
        missing_param = error.args[0]
        raise ExternalApiParamsError(f'Missing required parameter {missing_param}')

    import_func = context.external_api_service.get_import_func(resource_type, import_operation)

    res = import_func(data=data)

    return res
