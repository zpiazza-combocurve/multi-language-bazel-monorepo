DAILY_NUMERIC_PHASE_FIELDS = [
    'bottom_hole_pressure', 'casing_head_pressure', 'choke', 'co2Injection', 'flowline_pressure', 'gas', 'gasInjection',
    'gas_lift_injection_pressure', 'hours_on', 'ngl', 'oil', 'steamInjection', 'tubing_head_pressure',
    'vessel_separator_pressure', 'water', 'waterInjection', 'customNumber0', 'customNumber1', 'customNumber2',
    'customNumber3', 'customNumber4'
]

DAILY_PHASE_FIELDS = [*DAILY_NUMERIC_PHASE_FIELDS, 'operational_tag']

MONTHLY_NUMERIC_PHASE_FIELDS = [
    'choke', 'co2Injection', 'days_on', 'gas', 'gasInjection', 'ngl', 'oil', 'steamInjection', 'water',
    'waterInjection', 'customNumber0', 'customNumber1', 'customNumber2', 'customNumber3', 'customNumber4'
]

MONTHLY_PHASE_FIELDS = [*MONTHLY_NUMERIC_PHASE_FIELDS, 'operational_tag']

DAILY_PROTO_TO_MONGO_MAPPING = {
    'date': 'date',
    'well': 'well',
    'project': 'project',
    'bottom_hole_pressure': 'bottom_hole_pressure',
    'casing_head_pressure': 'casing_head_pressure',
    'choke': 'choke',
    'co2_injection': 'co2Injection',
    'flowline_pressure': 'flowline_pressure',
    'gas': 'gas',
    'gas_injection': 'gasInjection',
    'gas_lift_injection_pressure': 'gas_lift_injection_pressure',
    'hours_on': 'hours_on',
    'ngl': 'ngl',
    'oil': 'oil',
    'steam_injection': 'steamInjection',
    'tubing_head_pressure': 'tubing_head_pressure',
    'vessel_separator_pressure': 'vessel_separator_pressure',
    'water': 'water',
    'water_injection': 'waterInjection',
    'custom_number_0': 'customNumber0',
    'custom_number_1': 'customNumber1',
    'custom_number_2': 'customNumber2',
    'custom_number_3': 'customNumber3',
    'custom_number_4': 'customNumber4',
    'operational_tag': 'operational_tag',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt'
}

DAILY_MONGO_TO_PROTO_MAPPING = {v: k for k, v in DAILY_PROTO_TO_MONGO_MAPPING.items()}

MONTHLY_PROTO_TO_MONGO_MAPPING = {
    'date': 'date',
    'well': 'well',
    'project': 'project',
    'choke': 'choke',
    'co2_injection': 'co2Injection',
    'days_on': 'days_on',
    'gas': 'gas',
    'gas_injection': 'gasInjection',
    'ngl': 'ngl',
    'oil': 'oil',
    'steam_injection': 'steamInjection',
    'water': 'water',
    'water_injection': 'waterInjection',
    'custom_number_0': 'customNumber0',
    'custom_number_1': 'customNumber1',
    'custom_number_2': 'customNumber2',
    'custom_number_3': 'customNumber3',
    'custom_number_4': 'customNumber4',
    'operational_tag': 'operational_tag',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt'
}

MONTHLY_MONGO_TO_PROTO_MAPPING = {v: k for k, v in MONTHLY_PROTO_TO_MONGO_MAPPING.items()}
