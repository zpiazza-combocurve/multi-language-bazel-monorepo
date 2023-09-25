import json
import pathlib
from functools import reduce

COLLECTIONS = {
    'well_headers_source_conversion': 'wells',
    'well_months_source_conversion': 'monthly-productions',
    'well_days_source_conversion': 'daily-productions',
    'well_survey_source_conversion': 'well-directional-surveys.js',
}


class DisplayTemplatesService:
    def __init__(self, context):
        self.context = context

    def get_display_template(self, component, key):
        path = pathlib.Path(__file__).parent / 'components' / component / f'{key}.json'
        with open(path) as dt_file:
            dt = json.load(dt_file)
            return dt

    def flatten(self, arr):
        return reduce(
            lambda flat, toFlatten: flat + self.flatten(toFlatten)
            if type(toFlatten) is list else flat + [toFlatten], arr, [])

    def get_source_conversions(self):
        well_headers_source_conversion = self.get_display_template('wells', 'well_headers_source_conversion')
        well_months_source_conversion = self.get_display_template('wells', 'well_months_source_conversion')
        well_days_source_conversion = self.get_display_template('wells', 'well_days_source_conversion')
        well_survey_source_conversion = self.get_display_template('wells', 'well_survey_source_conversion')
        obj = {
            'wellHeaders': well_headers_source_conversion['fields'],
            'wellMonths': well_months_source_conversion['fields'],
            'wellDays': well_days_source_conversion['fields'],
            'wellSurveys': well_survey_source_conversion['fields']
        }
        return obj

    def get_full_source_conversions(self, key):
        base_conversions = self.get_display_template('wells', key)['fields']
        custom_headers_conversions = self.context.custom_fields_service.get_custom_fields_mappings(COLLECTIONS[key])
        return {**base_conversions, **custom_headers_conversions}
