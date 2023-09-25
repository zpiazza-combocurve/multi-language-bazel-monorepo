'''
econ model schemas used for generate options (front end data structure) from econ_function
only need to field type of criteria-select now
'''

NOT_USED_KEY = 'not_used'

FPD_SCOURCE_CRITERIA = {
    'well_header': {
        'label': 'Well Header',
        'value': 'well_header',
        'staticValue': '',
        'fieldType': 'static',
        'fieldName': 'Well Header'
    },
    'production_data': {
        'label': 'Prod Data',
        'value': 'production_data',
        'staticValue': '',
        'fieldType': 'static',
        'fieldName': 'Prod Data'
    },
    'forecast': {
        'label': 'Forecast',
        'value': 'forecast',
        'staticValue': '',
        'fieldType': 'static',
        'fieldName': 'Forecast'
    },
    'date': {
        'label': 'Date',
        'value': 'date',
        'required': True,
        'fieldName': 'Date',
        'fieldType': 'date',
        'valType': 'datetime'
    },
    NOT_USED_KEY: {
        'label': 'Not Used',
        'value': NOT_USED_KEY,
        'staticValue': '',
        'fieldType': 'static',
        'fieldName': 'Not Used'
    },
    'link_to_wells_ecl': {
        'label': "Link to Well's ECL",
        'value': 'link_to_wells_ecl',
        'required': True,
        'fieldType': 'text',
        'fieldName': "Link to Well's ECL",
        'maxLength': 30,
        'valType': 'text',
    },
}

ESCALATION_START_CRITERIA = {
    'apply_to_criteria': {
        "label": "Apply To Criteria",
        "value": "apply_to_criteria",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'fpd': {
        "label": "FPD",
        "value": "fpd",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'as_of_date': {
        "label": "As of Date",
        "value": "as_of_date",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'econ_limit': {
        "label": "Econ Limit",
        "value": "econ_limit",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'date': {
        "required": True,
        "label": "Date",
        "value": "date",
        "fieldType": "date",
        "valType": "datetime"
    }
}
