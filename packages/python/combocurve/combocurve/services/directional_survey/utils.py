from typing import Any
from collections.abc import Mapping

DIRECTIONAL_SURVEY_ARRAY_FIELDS = [
    'measuredDepth',
    'trueVerticalDepth',
    'azimuth',
    'inclination',
    'deviationNS',
    'deviationEW',
    'latitude',
    'longitude',
]

HEADERS_DISPLAY = {
    'well_name': 'Well Name',
    'well_number': 'Well Number',
    'api14': 'API 14',
    'chosenID': 'Chosen ID',
    'measuredDepth': 'Measured Depth (FT)',
    'trueVerticalDepth': 'True Vertical Depth (FT)',
    'azimuth': 'Azimuth',
    'inclination': 'Inclination',
    'deviationNS': 'Deviation NS (FT)',
    'deviationEW': 'Deviation EW (FT)',
    'latitude': 'Latitude',
    'longitude': 'Longitude',
}


def unwind_directional_survey_document(directional_survey: Mapping[str, Any]):
    existing_fields = [field for field in DIRECTIONAL_SURVEY_ARRAY_FIELDS if field in directional_survey]
    n_rows = len(directional_survey[existing_fields[0]])

    return ({
        'well': directional_survey.get('well'),
        **{field: directional_survey[field][i]
           for field in existing_fields}
    } for i in range(n_rows))
