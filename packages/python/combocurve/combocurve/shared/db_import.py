import logging

from pymongo.errors import BulkWriteError

from combocurve.utils.exceptions import get_exception_info
from combocurve.shared.helpers import jsonify


def min_with_check(db_field, update_field):
    return {
        '$cond': {
            'if': {
                '$eq': [{
                    '$ifNull': [db_field, None]
                }, None]
            },
            'then': update_field,
            'else': {
                '$min': [db_field, update_field]
            }
        }
    }


def set_on_insert(field_name, value):
    return {'$cond': [{'$eq': [{'$type': '$_id'}, 'missing']}, value, f'${field_name}']}


def convert_to_double(field, default=None):
    return {
        '$cond': {
            'if': {
                '$eq': [{
                    '$type': field
                }, 'date']
            },
            'then': default,
            'else': {
                '$convert': {
                    'input': field,
                    'to': "double",
                    'onError': default,
                    'onNull': default
                }
            }
        }
    }


def add_with_check(field1, field2):
    return {
        '$cond': {
            'if': {
                '$and': [{
                    '$eq': [convert_to_double(field1), None]
                }, {
                    '$eq': [convert_to_double(field2), None]
                }]
            },
            'then': None,
            'else': {
                '$add': [convert_to_double(field1, 0), convert_to_double(field2, 0)]
            }
        }
    }


def divide_with_gt0_check(dividend, divisor):
    return {
        '$cond': {
            'if': {
                '$gt': [convert_to_double(divisor), 0]
            },
            'then': {
                '$divide': [convert_to_double(dividend), convert_to_double(divisor)]
            },
            'else': None
        }
    }


calcs_pipeline = [{
    '$set': {
        'total_prop_weight': add_with_check('$first_prop_weight', '$refrac_prop_weight'),
        'total_fluid_volume': add_with_check('$first_fluid_volume', '$refrac_fluid_volume'),
    }
}, {
    '$set': {
        'first_proppant_per_perforated_interval': divide_with_gt0_check('$first_prop_weight', '$perf_lateral_length'),
        'first_fluid_per_perforated_interval': divide_with_gt0_check('$first_fluid_volume', '$perf_lateral_length'),
        'first_proppant_per_fluid': {
            '$divide': [divide_with_gt0_check('$first_prop_weight', '$first_fluid_volume'), 42]
        },
        'refrac_proppant_per_perforated_interval': divide_with_gt0_check('$refrac_prop_weight', '$perf_lateral_length'),
        'refrac_fluid_per_perforated_interval': divide_with_gt0_check('$refrac_fluid_volume', '$perf_lateral_length'),
        'refrac_proppant_per_fluid': {
            '$divide': [divide_with_gt0_check('$refrac_prop_weight', '$refrac_fluid_volume'), 42]
        },
        'total_proppant_per_perforated_interval': divide_with_gt0_check('$total_prop_weight', '$perf_lateral_length'),
        'total_fluid_per_perforated_interval': divide_with_gt0_check('$total_fluid_volume', '$perf_lateral_length'),
        'total_proppant_per_fluid': {
            '$divide': [divide_with_gt0_check('$total_prop_weight', '$total_fluid_volume'), 42]
        },
        'total_additive_volume': add_with_check('$first_additive_volume', '$refrac_additive_volume'),
        'total_cluster_count': add_with_check('$first_cluster_count', '$refrac_cluster_count'),
        'total_stage_count': add_with_check('$first_stage_count', '$refrac_stage_count')
    }
}]


def get_project_custom_headers_pipeline(project, well_ids, project_custom_headers_data_collection):
    return [
        {
            '$match': {
                '_id': {
                    '$in': well_ids
                }
            }
        },
        {
            '$project': {
                '_id': 0,
                'project': project,
                'well': '$_id',
                'customHeaders': {
                    '$literal': {}
                },
            },
        },
        {
            '$merge': {
                'into': project_custom_headers_data_collection.name,
                'on': ['project', 'well'],
                'whenMatched': [{
                    '$set': {
                        'wellHeaders': '$$new.wellHeaders'
                    }
                }],
                'whenNotMatched': 'insert',
            },
        },
    ]


def log_bulk_write_error(bwe, message):
    error_info = get_exception_info(bwe)
    error_info['mongo_error_code'] = bwe.code
    error_info['mongo_error_details'] = jsonify(bwe.details)
    logging.error(f'{message}: {error_info["message"]}', extra={'metadata': error_info})


def bulkwrite_operation(collection, operations, error_message="OPERATION ERROR PERFORMING DATABASE WRITE"):
    try:
        return collection.bulk_write(operations).bulk_api_result
    except BulkWriteError as bwe:
        log_bulk_write_error(bwe, error_message)
        raise bwe
