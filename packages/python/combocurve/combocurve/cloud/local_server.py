from flask import Flask, request

from cloud_runs.external_api_import.main import handle as handle_external_api_import
from cloud_functions.file_import.main import handle as handle_file_import
from cloud_functions.archive.main import handle as handle_archive
from cloud_functions.well_calcs.main import handle as hand_well_calcs
from cloud_functions.econ_well_calcs.main import handle as handle_econ_run_well_calcs
from cloud_functions.remove_leading_zeros.main import handle as handle_remove_leading_zeros
from cloud_functions.econ_report_by_well.main import handle as handle_econ_report_by_well
from cloud_runs.econ_export.api.csv_export.handler import csv_export_handler

app = Flask(__name__)


@app.route('/external_api_import', methods=['POST'])
def external_api_import():
    return handle_external_api_import(request)


@app.route('/one_liner_export', methods=['POST'])
def one_liner_export():
    return csv_export_handler(request)


@app.route('/file_import', methods=['POST'])
def file_import():
    return handle_file_import(request)


@app.route('/archive', methods=['POST'])
def archive():
    return handle_archive(request)


@app.route('/well_calcs', methods=['POST'])
def well_calcs():
    return hand_well_calcs(request)


@app.route('/econ_well_calcs', methods=['POST'])
def econ_run_well_calcs():
    return handle_econ_run_well_calcs(request)


@app.route('/remove_leading_zeros', methods=['POST'])
def remove_leading_zeros():
    return handle_remove_leading_zeros(request)


@app.route('/econ_report_by_well', methods=['POST'])
def econ_report_by_well():
    return handle_econ_report_by_well(request)


if __name__ == '__main__':
    app.run(port=5003, debug=True)
