MONTHLY_PROD_FIELDS = [
    'oil',
    'gas',
    'water',
    'operational_tag',
    'choke',
    'days_on',
    'gasInjection',
    'waterInjection',
    'co2Injection',
    'steamInjection',
    'ngl',
    'customNumber0',
    'customNumber1',
    'customNumber2',
    'customNumber3',
    'customNumber4',
]

DAILY_PROD_FIELDS = [
    'oil',
    'gas',
    'water',
    'choke',
    'hours_on',
    'gas_lift_injection_pressure',
    'bottom_hole_pressure',
    'tubing_head_pressure',
    'flowline_pressure',
    'casing_head_pressure',
    'operational_tag',
    'vessel_separator_pressure',
    'gasInjection',
    'waterInjection',
    'co2Injection',
    'steamInjection',
    'ngl',
    'customNumber0',
    'customNumber1',
    'customNumber2',
    'customNumber3',
    'customNumber4',
]

SURVEY_MEASURED_DEPTH_FIELD = 'measuredDepth'
SURVEY_LATITUDE_FIELD = 'latitude'
SURVEY_LONGITUDE_FIELD = 'longitude'

SURVEY_FIELDS = [
    SURVEY_MEASURED_DEPTH_FIELD,
    'trueVerticalDepth',
    'azimuth',
    'inclination',
    'deviationNS',
    'deviationEW',
    SURVEY_LATITUDE_FIELD,
    SURVEY_LONGITUDE_FIELD,
]

DAL_FIELD_NAME_MAP = {
    'gasInjection': 'gas_injection',
    'waterInjection': 'water_injection',
    'co2Injection': 'co2_injection',
    'steamInjection': 'steam_injection',
    'customNumber0': 'custom_number_0',
    'customNumber1': 'custom_number_1',
    'customNumber2': 'custom_number_2',
    'customNumber3': 'custom_number_3',
    'customNumber4': 'custom_number_4',
}
