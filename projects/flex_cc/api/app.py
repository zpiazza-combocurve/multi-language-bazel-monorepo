from flask import Flask
from flask_cors import CORS

from api.economics.routes import economics
from api.files.routes import files
from api.cc_to_cc.routes import cc_to_cc
from api.cc_to_aries.routes import cc_to_aries
from api.cc_to_phdwin.routes import cc_to_phdwin
from api.forecast_mass_edit.routes import forecast_mass_edit
from api.file_imports.routes import file_imports
from api.archive.routes import archive
from api.scenarios.routes import scenarios
from api.shapefiles.routes import shapefiles
from api.shareable_codes.routes import shareable_codes

from api.aries_phdwin_imports.routes import aries_imports
from api.typecurve_mass_edit.routes import tc_mass_edit


def _register_blueprints(app):
    app.register_blueprint(economics, url_prefix='/api/economics')
    app.register_blueprint(files, url_prefix='/api/files')
    app.register_blueprint(cc_to_cc, url_prefix='/api/cc-to-cc')
    app.register_blueprint(cc_to_aries, url_prefix='/api/cc-to-aries')
    app.register_blueprint(cc_to_phdwin, url_prefix='/api/cc-to-phdwin')
    app.register_blueprint(forecast_mass_edit, url_prefix='/api/forecast-mass-edit')
    app.register_blueprint(file_imports, url_prefix='/api/file-imports')
    app.register_blueprint(aries_imports, url_prefix='/api/aries-phdwin-imports')
    app.register_blueprint(archive, url_prefix='/api/archive')
    app.register_blueprint(scenarios, url_prefix='/api/scenarios')
    app.register_blueprint(shapefiles, url_prefix='/api/shapefiles')
    app.register_blueprint(shareable_codes, url_prefix='/api/shareable-codes')
    app.register_blueprint(tc_mass_edit, url_prefix='/api/tc-mass-edit')

    @app.route('/')
    def hello():
        return 'flex-combocurve', 200


def create_app():
    app = Flask(__name__)

    CORS(app)
    _register_blueprints(app)

    return app
