from functools import partial
import datetime

from combocurve.services.data_import.import_data import DataSettings
from combocurve.services.external_api_import_data import ApiWellsImportData, ApiProdImportData, ApiDSImportData


class ExternalApiService(object):
    def __init__(self, context):
        self.context = context

    def import_well_headers(self, data, operation):
        now = datetime.datetime.now()

        extra_data = {
            'mostRecentImportDesc': f'External API Import - {now.strftime("%m/%d/%Y %I:%M:%S %p")}',
            'mostRecentImportType': 'api',
            'mostRecentImportDate': now
        }

        if operation == "replace":
            replaces = data['replaces']
            set_default_values = data.get('setDefaultValues', True)
            headers_result = self.context.import_service.replace_wells_by_id(replaces, extra_data, set_default_values)
            self.context.import_service.update_calcs_by_id([r.get('id') for r in replaces])
        else:
            data_settings = DataSettings(data['dataSource'], data.get('project'))
            import_data = ApiWellsImportData(data['wells'], data_settings, extra_data)

            headers_result, well_docs = self.context.import_service.upsert_wells(import_data,
                                                                                 replace_production=False,
                                                                                 operation=operation)
            self.context.import_service.update_calcs(well_docs, data_settings)
            self.context.import_service.add_well_docs_to_project(well_docs, data_settings)

        return self._get_stats(headers_result, operation)

    def import_production(self, data, production_kind, operation):
        project = data.get('project')
        prod_data = data['byWell']

        data_settings_for_wells = DataSettings(None, None, '_id')
        import_data_for_wells = ApiProdImportData(prod_data, production_kind, data_settings_for_wells)

        self.context.import_service.upsert_wells(import_data_for_wells,
                                                 replace_production=False,
                                                 operation='production_calcs_only')

        well_ids_dict = {id: [id] for id in prod_data}

        data_settings_for_prod = DataSettings(None, project, id='well')
        import_data_for_prod = ApiProdImportData(prod_data, production_kind, data_settings_for_prod)

        monthly_result = self.context.import_service.update_monthly(import_data_for_prod, well_ids_dict)
        daily_result = self.context.import_service.update_daily(import_data_for_prod, well_ids_dict)

        return self._get_stats(monthly_result or daily_result, operation)
    
    def import_survey(self, data, operation):
        well_id = data.get('well')
        project = data.get('project')
        data_source = data.get('dataSource')
        coordinates_system=data.get('spatialDataType')

        # The API will import just one wellDS at a time
        well_dict = {
            well_id: [well_id]
        }

        # Survey import
        settings = DataSettings(data_source, project, id='well', coordinate_reference_system=coordinates_system)
        import_structure = ApiDSImportData(well_id, data, settings)

        survey_out = self.context.import_service.replace_survey(import_structure, well_dict, {})

        # Update well headers
        settings = DataSettings(None, None, id='_id')
        import_structure = ApiDSImportData(well_id, data, settings)

        self.context.import_service.upsert_wells(import_structure,
                                                 replace_production=False,
                                                 operation='production_calcs_only')

        total_rows = survey_out.get('total_rows')
        return {
            'imported': total_rows,
            'updated': 1 if total_rows > 0 else 0,
        }

    def get_import_func(self, resource_type, import_operation):
        import_type_dict = {
            'headers': partial(self.import_well_headers, operation=import_operation),
            'monthly': partial(self.import_production, production_kind='monthly', operation=import_operation),
            'directional_surveys': partial(self.import_directional_surveys, operation=import_operation),
            'daily': partial(self.import_production, production_kind='daily', operation=import_operation)
        }
        return import_type_dict.get(resource_type)

    def import_directional_surveys(self, data, operation):
        if operation == 'insert' or operation == 'update':
            return self.import_survey(data, operation)
        elif operation == 'delete':
            id = data.get('id')
            well_id = data.get('well_id')
            return self._get_stats(self.context.import_service.delete_well_survey(id, well_id), operation)

        return self._get_stats({'err_msg': 'Invalid Operation'}) 
    	
    @staticmethod
    def _get_stats(info, operation):
        stats = {'found': 0, 'imported': 0, 'updated': 0, 'inserted': 0}
        if not info:
            return stats

        if 'err_msg' in info:
            stats['err_msg'] = info.get('err_msg')

        if 'data' in info:
            stats['data'] = info.get('data')

        stats['found'] += info.get('nMatched', 0)
        if operation == 'insert':
            n_upsert = info.get('nUpserted', 0)
            stats['inserted'] = n_upsert
            stats['imported'] = n_upsert
        elif operation == 'update':
            n_modified = info.get('nModified', 0)
            stats['imported'] = n_modified
            stats['updated'] = n_modified
        else:
            n_upsert = info.get('nUpserted', 0)
            n_modified = info.get('nModified', 0)
            stats['inserted'] = n_upsert
            stats['imported'] = n_upsert + n_modified
            stats['updated'] = n_modified

        return stats
