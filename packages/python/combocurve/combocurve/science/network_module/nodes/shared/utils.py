NETWORK_KEY = 'network'
FACILITY_KEY = 'facility'
NETWORK_EDGES_KEY = 'network_edges'
FACILITY_EDGES_KEY = 'facility_edges'
WELL_GROUP_KEY = 'well_group'
WELL_GROUP_WELLS_KEY = 'wells'
DRILLING_KEY = 'drilling'
COMPLETION_KEY = 'completion'
FLOWBACK_KEY = 'flowback'
OIL_TANK_KEY = 'oil_tank'
FLARE_KEY = 'flare'
COMBUSTION_KEY = 'combustion'
PNEUMATIC_DEVICE_KEY = 'pneumatic_device'
PNEUMATIC_PUMP_KEY = 'pneumatic_pump'
CENTRIFUGAL_COMPRESSOR_KEY = 'centrifugal_compressor'
RECIPROCATING_COMPRESSOR_KEY = 'reciprocating_compressor'
ATMOSPHERE_KEY = 'atmosphere'
CAPTURE_KEY = 'capture'
ECON_OUTPUT_KEY = 'econ_output'
LIQUIDS_UNLOADING_KEY = 'liquids_unloading'
ASSOCIATED_GAS_KEY = 'associated_gas'
CUSTOM_CALCULATION_KEY = 'custom_calculation'

OIL = 'oil'
GAS = 'gas'
WATER = 'water'
LINK = 'link'
DEVELOPMENT = 'development'

EDGE_OPTIONS = {
    NETWORK_KEY: [OIL, GAS, WATER, LINK, DEVELOPMENT],
    FACILITY_KEY: [OIL, GAS, WATER],
}

NODE_OPTIONS = {
    NETWORK_KEY: [
        FACILITY_KEY, WELL_GROUP_KEY, DRILLING_KEY, COMPLETION_KEY, FLOWBACK_KEY, OIL_TANK_KEY, FLARE_KEY,
        ATMOSPHERE_KEY, CAPTURE_KEY, ECON_OUTPUT_KEY, LIQUIDS_UNLOADING_KEY, ASSOCIATED_GAS_KEY, CUSTOM_CALCULATION_KEY
    ],
    FACILITY_KEY: [
        OIL_TANK_KEY, FLARE_KEY, COMBUSTION_KEY, PNEUMATIC_DEVICE_KEY, PNEUMATIC_PUMP_KEY, CENTRIFUGAL_COMPRESSOR_KEY,
        RECIPROCATING_COMPRESSOR_KEY, ATMOSPHERE_KEY, CAPTURE_KEY, ECON_OUTPUT_KEY, LIQUIDS_UNLOADING_KEY,
        ASSOCIATED_GAS_KEY, CUSTOM_CALCULATION_KEY
    ],
}

NODE_PORTS = {
    WELL_GROUP_KEY: {
        'inputs': [DEVELOPMENT],
        'outputs': [OIL, GAS, WATER, LINK],
    },
    ATMOSPHERE_KEY: {
        'inputs': [GAS],
        'outputs': []
    },
    CAPTURE_KEY: {
        'inputs': [GAS],
        'outputs': []
    },
    ECON_OUTPUT_KEY: {
        'inputs': [OIL, GAS, WATER],
        'outputs': []
    },
    LIQUIDS_UNLOADING_KEY: {
        'inputs': [GAS],
        'outputs': [GAS]
    },
    FLARE_KEY: {
        'inputs': [GAS],
        'outputs': []
    },
    OIL_TANK_KEY: {
        'inputs': [OIL],
        'outputs': [OIL, GAS]
    },
    ASSOCIATED_GAS_KEY: {
        'inputs': [GAS],
        'outputs': [GAS]
    },
    COMBUSTION_KEY: {
        'inputs': [],
        'outputs': []
    },
    PNEUMATIC_DEVICE_KEY: {
        'inputs': [],
        'outputs': []
    },
    PNEUMATIC_PUMP_KEY: {
        'inputs': [],
        'outputs': []
    },
    CENTRIFUGAL_COMPRESSOR_KEY: {
        'inputs': [],
        'outputs': []
    },
    RECIPROCATING_COMPRESSOR_KEY: {
        'inputs': [],
        'outputs': []
    },
    DRILLING_KEY: {
        'inputs': [],
        'outputs': [DEVELOPMENT]
    },
    COMPLETION_KEY: {
        'inputs': [],
        'outputs': [DEVELOPMENT]
    },
    FLOWBACK_KEY: {
        'inputs': [GAS],
        'outputs': [GAS]
    },
    CUSTOM_CALCULATION_KEY: {
        'inputs': [GAS, OIL, WATER],
        'outputs': [GAS]
    },
    'input': {
        'inputs': [],
        'outputs': [GAS, OIL, WATER]
    },
    'output': {
        'inputs': [GAS, OIL, WATER],
        'outputs': []
    },
}

CUSTOM_NODE_OPTIONS = {
    'inputs': ['Gas', 'Oil', 'Water'],
    'outputs': ['Gas', 'CO2e', 'CO2', 'CH4', 'N2O'],
    'functions': {
        '@FPD': {}
    }  # keep track of valid function handles for formula validation but only need the dict keys
}

EMISSION_CATEGORIES = {
    'associated_gas': 'Associated Gas',
    'acid_gas_removal_units': 'Acid Gas Removal Units',
    'centrifugal_compressor': 'Centrifugal Compressor',
    'eor_hydrocarbon_liquids': 'EOR Hydrocarbon Liquids',
    'eor_injection_pumps': 'EOR Injection Pumps',
    'liquids_unloading': 'Liquids Unloading',
    'pneumatic_device': 'Pneumatic Device',
    'dehydrators': 'Dehydrators',
    'equipment_leaks': 'Equipment Leaks',
    'atmospheric_tank': 'Atmospheric Tank',
    'reciprocating_compressor': 'Reciprocating Compressor',
    'completions_with_fracturing': 'Completions With Fracturing',
    'completions_without_fracturing': 'Completions Without Fracturing',
    'drilling': 'Drilling Combustion',
    'completion': 'Completion Combustion',
    'combustion': 'Combustion',
    'pneumatic_pump': 'Pneumatic Pump',
    'well_testing': 'Well Testing',
    'blowdown_vent_stacks': 'Blowdown Vent Stacks',
    'flare': 'Flare',
    'scope2': 'Scope 2',
    'scope3': 'Scope 3',
    'custom_calculation': 'Custom',
}

EMISSION_TYPES = {
    'vented': 'Vented',
    'capture': 'Capture',
    'flare': 'Flare',
    'combustion': 'Combustion',
    'electricity': 'Electricity',
}
