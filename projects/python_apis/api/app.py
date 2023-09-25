from flask import Flask
from flask_cors import CORS

from api.diagnostic.diagnostic_api import diagnostic_api
from api.econ.econ_api import econ_api
from api.forecast.forecast_api import forecast_api
from api.forecast.proximity_forecast_api import proximity_forecast_api
from api.forecast.forecast_mass_add_last_segment_api import forecast_mass_add_last_segment_api
from api.forecast.forecast_mass_modify_well_life_api import forecast_mass_modify_well_life_api
from api.forecast.forecast_mass_shift_segments_api import forecast_mass_shift_segments_api
from api.forecast.mass_adjust_terminal_decline_api import mass_adjust_terminal_decline_api
from api.forecast.forecast_conv_api import forecast_conv_api
from api.forecast.volumes_api import volumes_api
from api.forecast.forecast_volumes_export_api import forecast_volumes_export_api
from api.rollUp.roll_up_api import roll_up_api
from api.scheduling.scheduling_api import scheduling_api
from api.type_curve.fit_percentile_api import fit_percentile_api
from api.type_curve.normalization_api import normalization_api
from api.type_curve.tc_apply_api import tc_apply_api
from api.type_curve.tc_chart_export_api import tc_chart_export_api
from api.type_curve.tc_init_api import tc_init_api
from api.type_curve.tc_rep_init_api import tc_rep_init_api
from api.warmup.warmup_api import warmup_api
from api.well_spacing.calculating_well_spacing_api import well_spacing_api
from api.ghg.ghg_api import ghg_api  # noqa: E402
from api.forecast.update_eur_api import update_eur_api


def _register_blueprints(app):
    app.register_blueprint(warmup_api)
    app.register_blueprint(diagnostic_api)
    app.register_blueprint(econ_api)
    app.register_blueprint(forecast_api)
    app.register_blueprint(proximity_forecast_api)
    app.register_blueprint(forecast_mass_add_last_segment_api)
    app.register_blueprint(forecast_mass_modify_well_life_api)
    app.register_blueprint(forecast_mass_shift_segments_api)
    app.register_blueprint(forecast_volumes_export_api)
    app.register_blueprint(mass_adjust_terminal_decline_api)
    app.register_blueprint(forecast_conv_api, url_prefix='/cc-to-aries')
    app.register_blueprint(volumes_api)
    app.register_blueprint(roll_up_api)
    app.register_blueprint(scheduling_api, url_prefix='/scheduling')
    app.register_blueprint(fit_percentile_api, url_prefix='/type-curve')
    app.register_blueprint(normalization_api, url_prefix='/type-curve')
    app.register_blueprint(tc_apply_api, url_prefix='/type-curve')
    app.register_blueprint(tc_init_api, url_prefix='/type-curve')
    app.register_blueprint(tc_rep_init_api, url_prefix='/type-curve')
    app.register_blueprint(tc_chart_export_api, url_prefix='/type-curve')
    app.register_blueprint(well_spacing_api, url_prefix='/well-spacing')
    app.register_blueprint(ghg_api)
    app.register_blueprint(update_eur_api)

    @app.route('/')
    def hello():
        return 'python-combocurve', 200


def create_app():
    app = Flask(__name__)

    CORS(app)
    _register_blueprints(app)

    return app
