from bson import ObjectId
import collections
import numpy as np


class TypecurveUploadWells:
    def __init__(self, context):
        self.context = context

    def check_identifier_header(self, typecurve_df, chosen_identifier):
        if chosen_identifier not in typecurve_df:
            typecurve_df[chosen_identifier] = np.nan

    def get_tc_identifiers(self, typecurve_df, tc_names_ids, chosen_identifier):
        '''
        tc_identifiers = {
            tc_id1 : [well1, well2, well3, well4, ...]
            tc_id2 : [well2, well3, well4, ...]
        }
        '''

        tc_ids_identifiers = {}
        typecurve_df = typecurve_df[['TC Name', chosen_identifier]]
        typecurve_df.dropna(subset=[chosen_identifier], inplace=True)

        tc_names_identifiers = {}

        for index, row in typecurve_df.iterrows():
            tc_name = row['TC Name']
            if tc_name not in tc_names_identifiers:
                tc_names_identifiers[tc_name] = set()

            row_identifiers = row[chosen_identifier]
            if type(row_identifiers) == float:
                row_identifiers = int(row_identifiers)

            for identifier in str(row_identifiers).split(','):
                if identifier:
                    tc_names_identifiers[tc_name].add(identifier.strip())

        for name in tc_names_identifiers:
            tc_id = tc_names_ids[name]
            tc_ids_identifiers[ObjectId(tc_id)] = tc_names_identifiers[name]

        return tc_ids_identifiers

    def get_well_identifiers_from_forecast(self, forecast_id, chosen_identifier, tc_identifiers, tcs_name_forecast,
                                           tc_names_ids):

        tc_well_list_result = {}
        well_identifier_dict = {}
        tc_ids_forecast = {}
        forecasts = []
        unmatched_wells = collections.defaultdict(set)
        overlimit_wells = collections.defaultdict(set)

        for tc_name in tc_names_ids:
            if tc_name in tcs_name_forecast and tcs_name_forecast[tc_name] == 'undefined':
                continue
            elif tc_name in tcs_name_forecast:
                forecasts.append(tcs_name_forecast[tc_name])
                tc_ids_forecast[ObjectId(tc_names_ids[tc_name])] = tcs_name_forecast[tc_name]
            elif forecast_id:
                forecasts.append(ObjectId(forecast_id))
                tc_ids_forecast[ObjectId(tc_names_ids[tc_name])] = ObjectId(forecast_id)

        if forecast_id and ObjectId(forecast_id) not in forecasts:
            forecasts.append(ObjectId(forecast_id))

        well_forecast_dict = collections.defaultdict(list)
        wells = set()
        forecasts_documents = self.context.forecasts_collection.aggregate([{'$match': {'_id': {'$in': forecasts}}}])

        for forecast in forecasts_documents:
            forecast_wells = forecast['wells']
            wells.update(forecast_wells)
            for well in forecast_wells:
                well_forecast_dict[well].append(forecast)

        well_documents = list(
            self.context.wells_collection.aggregate([{
                '$match': {
                    '_id': {
                        '$in': list(wells)
                    }
                }
            }, {
                '$project': {
                    '_id': 1,
                    chosen_identifier: 1,
                }
            }]))

        for well in well_documents:
            if well.get(chosen_identifier):
                well_in_forecasts = well_forecast_dict[well['_id']]
                for f in well_in_forecasts:
                    if f['_id'] not in well_identifier_dict:
                        well_identifier_dict[f['_id']] = collections.defaultdict(list)

                    well_identifier_dict[f['_id']][well[chosen_identifier]].append(well['_id'])

        self.get_tc_well_list_result(tc_identifiers, tc_ids_forecast, well_identifier_dict, overlimit_wells,
                                     unmatched_wells, tc_well_list_result)

        return tc_well_list_result, unmatched_wells, overlimit_wells

    def get_tc_well_list_result(self, tc_identifiers, tc_ids_forecast, well_identifier_dict, overlimit_wells,
                                unmatched_wells, tc_well_list_result):

        for tc_id in tc_identifiers:
            forecast = tc_ids_forecast.get(tc_id)
            if forecast:
                if forecast not in tc_well_list_result:
                    tc_well_list_result[forecast] = {tc_id: []}
                if tc_id not in tc_well_list_result[forecast]:
                    tc_well_list_result[forecast][tc_id] = []

                for identifier in tc_identifiers[tc_id]:
                    if identifier in well_identifier_dict[forecast] and len(tc_well_list_result[forecast][tc_id]) < 500:
                        tc_well_list_result[forecast][tc_id] += well_identifier_dict[forecast][identifier]
                    elif len(tc_well_list_result[forecast][tc_id]) >= 500:
                        overlimit_wells[tc_id].add(identifier)
                    else:
                        unmatched_wells[tc_id].add(identifier)
