DEFAULT_CUSTOM_FIELDS_DT_KEY = {
    'wells': 'well_headers_custom_default',
    'monthly-productions': 'well_months_custom_default',
    'daily-productions': 'well_days_custom_default'
}
DEFAULT_CUSTOM_FIELDS_DT_COMPONENT = 'wells'

BASE_MAPPING_ENTRY = {'other': [None], 'internal': [None], 'di': [None], 'ihs': [None], 'aries': [None]}


def _to_mapping_entry(label: str):
    return {**BASE_MAPPING_ENTRY, 'inpt': [label]}


class CustomFieldsService:
    def __init__(self, context):
        self.context = context

    def get_custom_fields(self, collection: str):
        all_custom_fields = self.context.custom_header_configurations_collection.find_one()
        collection_custom_fields = all_custom_fields.get(collection, {}) if all_custom_fields else {}
        custom_fields_from_db = {
            key: field['label']
            for key, field in collection_custom_fields.items() if 'label' in field
        }

        if collection not in DEFAULT_CUSTOM_FIELDS_DT_KEY:
            return custom_fields_from_db

        default_custom_fields = self.context.display_templates_service.get_display_template(
            DEFAULT_CUSTOM_FIELDS_DT_COMPONENT, DEFAULT_CUSTOM_FIELDS_DT_KEY[collection])
        return {**default_custom_fields, **custom_fields_from_db}

    def get_custom_fields_mappings(self, collection: str = 'wells'):
        custom_headers_doc = self.get_custom_fields(collection)
        return {key: _to_mapping_entry(label) for key, label in custom_headers_doc.items()}
