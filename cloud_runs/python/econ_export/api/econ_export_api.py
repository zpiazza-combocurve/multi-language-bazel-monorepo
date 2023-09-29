from cloud_runs.econ_export.api.csv_export.handler import csv_export_handler
from cloud_runs.econ_export.api.request_models import CSVExportRequestModel
from fastapi import FastAPI, Request
import requests

app = FastAPI(
    title="Econ Export",
    description="HTTP service for economics export",
    version="0.1.0",
    docs_url=None,  # No Swagger UI
    redoc_url="/docs"  # Serve ReDoc in /docs, where the Swagger UI normally is
)


@app.post('/csv_export')
async def economics_csv_export(model: CSVExportRequestModel, request: Request):
    usual_request = requests.Request(json=model.__dict__, headers=dict(request.headers))
    return csv_export_handler(usual_request)
