import datetime
import numpy as np

date_dict_generator = {
    'econ': {
        'cf_start_date': datetime.date(2023, 3, 1),
        'cf_end_date': datetime.date(2027, 2, 28),
        'cut_off_date': datetime.date(2027, 2, 28),
        'as_of_date': datetime.date(2023, 3, 1),
        'volume_start_date': datetime.date(2023, 3, 1),
        'first_production_date': datetime.date(2023, 3, 1),
        'first_segment_date': datetime.date(2023, 3, 1),
        'end_history_date': datetime.date(2023, 3, 1),
        'discount_date': datetime.date(2023, 3, 1),
        'original_discount_date': datetime.date(2023, 3, 1),
        'side_phase_end_date': None,
        'start_using_forecast': {
            'oil': datetime.date(2023, 3, 1),
            'gas': datetime.date(2023, 3, 1),
            'water': datetime.date(2023, 3, 1)
        },
        'rev_dates': []
    }
}

risk_model_count = {
    'well_stream': {
        "rows": [{
            "count": 3,
            "offset_to_fpd": {
                "start": 1,
                "end": 12,
                "period": 12,
                "end_date": "Econ Limit"
            }
        }, {
            "count": 2,
            "offset_to_fpd": {
                "start": 13,
                "end": 24,
                "period": 12
            }
        }, {
            "count": 1,
            "offset_to_fpd": {
                "start": 25,
                "end": 36,
                "period": 12
            }
        }]
    }
}

risk_model_percentage = {
    'well_stream': {
        "rows": [{
            "percentage": 3,
            "offset_to_fpd": {
                "start": 1,
                "end": 12,
                "period": 12,
                "end_date": "Econ Limit"
            }
        }, {
            "percentage": 80,
            "offset_to_fpd": {
                "start": 13,
                "end": 24,
                "period": 12
            }
        }, {
            "percentage": 60,
            "offset_to_fpd": {
                "start": 25,
                "end": 36,
                "period": 12
            }
        }]
    }
}

well_header_info = {
    'oil': {
        'primary_product': 'oil'
    },
    'gas': {
        'primary_product': 'gas'
    },
}

inputs = {
    'count': (
        date_dict_generator['econ'],
        risk_model_count,
        well_header_info['oil'],
    ),
    'percentage': (
        date_dict_generator['econ'],
        risk_model_percentage,
        well_header_info['oil'],
    ),
    'count_primary_product_gas': (
        date_dict_generator['econ'],
        risk_model_count,
        well_header_info['gas'],
    )
}

count = np.array([
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1
])

percentage = np.array([
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 1.8, 1.8, 1.8, 1.8,
    1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8
])

number_of_months = 48

ownership_dict_by_phase = {
    'oil': {
        'wi': np.ones(number_of_months),
        'nri': np.ones(number_of_months),
    },
    'gas': {
        'wi': np.repeat(0.8, number_of_months),
        'nri': np.repeat(0.6, number_of_months),
    },
}

results = {
    'count': {
        'well_count': {
            'gross_well_count': count,
            'wi_well_count': count,
            'nri_well_count': count,
        }
    },
    'percentage': {
        'well_count': {
            'gross_well_count': percentage,
            'wi_well_count': percentage,
            'nri_well_count': percentage,
        }
    },
    'count_primary_product_gas': {
        'well_count': {
            'gross_well_count': count,
            'wi_well_count': np.multiply(count, ownership_dict_by_phase['gas']['wi']),
            'nri_well_count': np.multiply(count, ownership_dict_by_phase['gas']['nri']),
        }
    }
}
