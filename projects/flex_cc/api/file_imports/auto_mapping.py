from typing import TYPE_CHECKING
from collections import OrderedDict

from jellyfish import jaro_winkler

from combocurve.shared.aries_import_enums import AriesFilesEnum
from combocurve.shared.helpers import first_or_default

if TYPE_CHECKING:
    from context import Context

VARIABLE_SOURCES = ('other', 'internal')
PUBLIC_SOURCES_CHOSEN_ID = {'di': 'api14', 'ihs': 'api14', 'aries': 'aries_id'}

MATCH_SIMILARITY_TRESHOLD = 0.85

_display_templates_keys = {
    'headers': 'well_headers_source_conversion',
    'monthly': 'well_months_source_conversion',
    'daily': 'well_days_source_conversion',
    'survey': 'well_survey_source_conversion'
}

_aries_display_templates_keys = {
    AriesFilesEnum.ac_property.value: 'well_headers_source_conversion',
    AriesFilesEnum.ac_product.value: 'well_months_source_conversion',
    AriesFilesEnum.ac_daily.value: 'well_days_source_conversion'
}

HEADER_FILE_TYPES = {'headers', AriesFilesEnum.ac_property.value}


def _get_file(file_import, file_type):
    files = {
        'headers': file_import.headerFile,
        'monthly': file_import.productionMonthlyFile,
        'daily': file_import.productionDailyFile,
        'survey': file_import.directionalSurveyFile,
    }
    return files[file_type]


def _normalize_header_name(header_name):
    return header_name.lower().replace('_', ' ')


class AutoMappingService(object):
    def __init__(self, context: 'Context'):
        self.context = context

    def _map_exact(self, headers, mapping):
        normalized_headers = {_normalize_header_name(h): h for h in headers}
        mapped_tuples = [(normalized_headers[mapping_header], cc_header)
                         for mapping_header, cc_header in mapping.items() if mapping_header in normalized_headers]
        # reversed dict to remove duplicate values
        reversed_dict = {cc_header: file_header for (file_header, cc_header) in reversed(mapped_tuples)}
        return {file_header: cc_header for (cc_header, file_header) in reversed_dict.items()}

    def _map_by_similarity(self, headers, mapping):
        matches = ((jaro_winkler(_normalize_header_name(h), k), h, k) for h in headers for k in mapping)
        matches = sorted([(d, h, k) for (d, h, k) in matches if d >= MATCH_SIMILARITY_TRESHOLD], reverse=True)

        remaining_headers = set(headers)
        remaining_fields = set(mapping.values())
        res = {}
        for _, h, k in matches:
            cc_field = mapping[k]
            if h not in remaining_headers or cc_field not in remaining_fields:
                continue
            res[h] = cc_field
            remaining_headers.remove(h)
            remaining_fields.remove(cc_field)

        return res

    def _map(self, headers, mapping, data_source):
        normalized_mapping = {_normalize_header_name(k): v for (k, v) in mapping.items()}

        if data_source not in VARIABLE_SOURCES:
            return self._map_exact(headers, normalized_mapping)

        return self._map_by_similarity(headers, normalized_mapping)

    def _map_chosen_id(self, targets, headers, data_source, mapped, file_type):
        if data_source in PUBLIC_SOURCES_CHOSEN_ID and file_type in HEADER_FILE_TYPES:
            chosen_id_header = PUBLIC_SOURCES_CHOSEN_ID[data_source]
            return first_or_default(mapped, lambda k: mapped[k] == chosen_id_header)

        if data_source not in VARIABLE_SOURCES:
            lower_headers = {_normalize_header_name(h) for h in headers}
            return first_or_default(targets, lambda t: _normalize_header_name(t) in lower_headers)

        matches = ((jaro_winkler(_normalize_header_name(h), _normalize_header_name(t)), h) for h in headers
                   for t in targets)
        (similarity, h) = max(matches)
        return h if similarity >= MATCH_SIMILARITY_TRESHOLD else None

    def _get_source_field_names(self, field_mappings, data_source):
        inpt_mapping = field_mappings['inpt']
        data_source_mappings = field_mappings.get(data_source, [])
        other_sources_mappings = (source_field_names for (source, source_field_names) in field_mappings.items()
                                  if source not in {'inpt', data_source})
        other_sources_mappings_flat = (mapping for source_mappings in other_sources_mappings
                                       for mapping in source_mappings)

        if data_source in VARIABLE_SOURCES:
            return [*inpt_mapping, *data_source_mappings, *other_sources_mappings_flat]

        return [*inpt_mapping, *data_source_mappings]

    def auto_mapping_shared_logic(self, file_, data_source, mapping, file_type):
        if not file_.headers:
            return {}

        inpt_to_source_mapping = {
            inpt_field: self._get_source_field_names(field_mappings, data_source)
            for inpt_field, field_mappings in mapping.items()
        }

        source_to_inpt_mapping = OrderedDict(((source_name, inpt_field)
                                              for inpt_field, source_field_names in inpt_to_source_mapping.items()
                                              for source_name in source_field_names
                                              if source_name is not None and inpt_field != 'chosenID'))

        mapped = self._map(file_.headers, source_to_inpt_mapping, data_source)

        chosen_id_targets = inpt_to_source_mapping["chosenID"]
        mapped_chosen_id = self._map_chosen_id(chosen_id_targets, file_.headers, data_source, mapped, file_type)
        if mapped_chosen_id:
            mapped["chosenID"] = mapped_chosen_id

        return mapped

    def get_auto_mapping(self, import_id, file_type):
        mapping = self.context.display_templates_service.get_full_source_conversions(_display_templates_keys[file_type])

        file_import = self.context.file_import_model.objects.get(id=import_id)

        data_source = file_import.dataSource if file_import.dataSource is not None else 'other'

        file_ = _get_file(file_import, file_type)

        mapped = self.auto_mapping_shared_logic(file_, data_source, mapping, file_type)

        return mapped

    def get_auto_mapping_aries(self, import_id, category):
        mapping = self.context.display_templates_service.get_full_source_conversions(
            _aries_display_templates_keys[category])

        aries_import = self.context.file_import_model.objects.get(id=import_id)

        data_source = 'aries'

        file_ = self.context.aries_service.get_file_by_category(aries_import.files, category)

        mapped = self.auto_mapping_shared_logic(file_, data_source, mapping, category)

        return mapped
