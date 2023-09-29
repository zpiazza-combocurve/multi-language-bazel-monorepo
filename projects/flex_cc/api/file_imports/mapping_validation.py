from collections.abc import Iterable

HEADERS_REQUIRED = []
MONTHLY_REQUIRED = [[["date"], ["year", "month"]], [["water"], ["oil"], ["gas"]]]
DAILY_REQUIRED = [[["date"], ["year", "month"]],
                  [["water"], ["oil"], ["gas"], ["choke"], ["hours_on"], ["gas_lift_injection_pressure"],
                   ["bottom_hole_pressure"], ["tubing_head_pressure"], ["flowline_pressure"], ["casing_head_pressure"],
                   ["vessel_separator_pressure"]]]
SURVEY_REQUIRED = [[['measuredDepth', 'inclination', 'azimuth'],
                    ['measuredDepth', 'trueVerticalDepth', 'deviationNS', 'deviationEW']]]


def _get_valid_mapping(file_import_file):
    headers = file_import_file.headers
    mapping = file_import_file.mapping
    valid_mapping = {h: mapping[h] for h in headers if h in mapping}
    chosen_id = mapping.get('chosenID')
    if chosen_id and chosen_id in headers:
        valid_mapping['chosenID'] = chosen_id
    return valid_mapping


def _check_file_mapping(file_import_file, required: Iterable[Iterable[Iterable[str]]], file_type: str):
    if not file_import_file:
        return
    mapping = _get_valid_mapping(file_import_file)
    if "chosenID" not in mapping:
        raise InvalidMappingError(f'Missing Chosen ID mapping in {file_type} file')
    values = set(mapping.values())
    if not all((any((all((h in values for h in and_group)) for and_group in or_group)) for or_group in required)):
        raise InvalidMappingError(f'Missing mapping of required fields in {file_type} file')


def _check_headers_mapping(file_import):
    _check_file_mapping(file_import.headerFile, HEADERS_REQUIRED, 'Well Headers')
    if file_import.directionalSurveyFile:
        mapping = _get_valid_mapping(file_import.directionalSurveyFile)
        mapped_fields = mapping.values()
        if 'surfaceLatitude' in mapped_fields != 'surfaceLongitude' in mapped_fields:
            raise InvalidMappingError('Missing mapping for corresponding surface coordinate in Well Headers file')
        if 'heelLatitude' in mapped_fields != 'heelLongitude' in mapped_fields:
            raise InvalidMappingError('Missing mapping for corresponding heel coordinate in Well Headers file')
        if 'toeLatitude' in mapped_fields != 'toeLongitude' in mapped_fields:
            raise InvalidMappingError('Missing mapping for corresponding toe coordinate in Well Headers file')


def _check_monthly_mapping(file_import):
    _check_file_mapping(file_import.productionMonthlyFile, MONTHLY_REQUIRED, 'Production Data (Monthly)')


def _check_daily_mapping(file_import):
    _check_file_mapping(file_import.productionDailyFile, DAILY_REQUIRED, 'Production Data (Daily)')


def _check_survey_mapping(file_import):
    _check_file_mapping(file_import.directionalSurveyFile, SURVEY_REQUIRED, 'Directional Surveys')
    if file_import.directionalSurveyFile:
        survey_mapping = _get_valid_mapping(file_import.directionalSurveyFile)
        survey_mapped_fields = survey_mapping.values()
        if 'latitude' not in survey_mapped_fields or 'longitude' not in survey_mapped_fields:
            headers_mapping = _get_valid_mapping(file_import.headerFile) if file_import.headerFile else {}
            headers_mapped_fields = headers_mapping.values()
            if 'surfaceLatitude' not in headers_mapped_fields or 'surfaceLongitude' not in headers_mapped_fields:
                raise InvalidMappingError('Surface Latitude and Surface Longitude must be mapped in Well Headers file '
                                          'if Latitude and Longitude are not mapped in Directional Surveys file')


def check_mappings(file_import):
    _check_headers_mapping(file_import)
    _check_monthly_mapping(file_import)
    _check_daily_mapping(file_import)
    _check_survey_mapping(file_import)


class InvalidMappingError(Exception):
    expected = True
