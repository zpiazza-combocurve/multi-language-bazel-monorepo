from typing import TYPE_CHECKING, Any
from flask import request, Blueprint
from api.decorators import with_api_context
from combocurve.utils.logging import add_to_logging_metadata
from combocurve.utils.routes import complete_routing

if TYPE_CHECKING:
    from api.context import APIContext

update_eur_api = Blueprint('update_eur_api', __name__)


@update_eur_api.route('/update_eur', methods=['POST'])
@complete_routing
@with_api_context
def update(**kwargs):
    context: APIContext = kwargs['context']
    req: dict[str, Any] = request.json

    try:
        update_params = {k: req[k] for k in ('forecast_ids', 'wells', 'phases', 'is_deterministic') if k in req.keys()}
        context.update_eur_service.update_eur(**update_params)
        return 'ok'
    except Exception as e:
        add_to_logging_metadata({'update_eur': update_params})
        raise e
