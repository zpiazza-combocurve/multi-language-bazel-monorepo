import json
import string
import random
import re
import logging
import math
from datetime import datetime
from itertools import islice, chain
from typing import Iterable, Mapping, Any

from bson import ObjectId
from flask import jsonify as flask_jsonify
from inspect import getframeinfo, stack


def log(message):
    caller = getframeinfo(stack()[1][0])
    logging.info("%s:%d - %s" % (caller.filename, caller.lineno, message),
                 extra={'metadata': {
                     'filename': caller.filename,
                     'lineno': caller.lineno
                 }})


class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat() + 'Z'  # this assumes all datetimes are in UTC
        return json.JSONEncoder.default(self, o)


def jsonify(j):
    if j is None:
        return flask_jsonify(None)
    if isinstance(j, str):
        return j
    jj = j if type(j) == dict else list(j)
    j_j = JSONEncoder().encode(jj)
    j_j = json.loads(j_j)
    j_j = flask_jsonify(j_j)
    return j_j


def gen_req_body(req):
    body = req.json

    try:
        uid = req.uid
    except Exception:
        uid = False

    if type(body) == dict:
        body['userId'] = uid
        return body
    else:
        return {'userId': uid}


def clear(update):
    return {k: v for k, v in update.items() if v is not None}


def mapping(to_map, mapping_data):
    return {k: to_map.get(v) for k, v in mapping_data.items()}


def gen_inpt_id():
    return f'INPT{"".join(random.choices(string.ascii_letters + string.digits, k=10)) }'


def clean_dict(d):
    return {k: v for (k, v) in d.items() if v is not None}


def first_or_default(iterable, predicate):
    return next((x for x in iterable if predicate(x)), None)


def has_value(object, key):
    return key in object and object[key] is not None


def get_value(object, key, default=None):
    if (has_value(object, key)):
        return object[key]
    return default


class Mock(object):
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


def contains(value, iter):
    return value in iter


def not_contains(value, iter):
    return value not in iter


def remove_decimals_from_string(value):
    if not value:
        return value
    match = re.fullmatch(r"(\d*)\.\d*", value)
    return match.group(1) if match else value


def remove_non_alphanumeric_from_string(value):
    if not value:
        return value
    return re.sub('[^A-Za-z0-9]', '', value)


def clean_id(value):
    return remove_non_alphanumeric_from_string(remove_decimals_from_string(value))


def split_in_chunks(iterable, batch_size):
    iterator = iter(iterable)
    batch = list(islice(iterator, batch_size))
    while batch:
        yield batch
        batch = list(islice(iterator, batch_size))


def padded_indexes(total):
    pad = math.ceil(math.log(total, 10)) if total else -1
    return (str(i).zfill(pad) for i in range(total))


def move_from_dict(dict_from, dict_to, key, default=None):
    dict_to[key] = dict_from.pop(key, default)


def update_error_description_and_log_error(error_info, description, extra=None):
    error_message = error_info['message']
    if error_info['expected']:
        description += f', {error_message}'
    else:
        if extra:
            error_info = {**error_info, **extra}
        logging.error(error_message, extra={'metadata': error_info})

    return description


def clean_up_str(input_value):
    return str(input_value).strip().lower()


def get_auto_incremented_name(name: str, existing_names: Iterable[str], delimiter=' '):
    reg_expr = re.compile(rf"{re.escape(name)}(?:{re.escape(delimiter)}(\d+))?")

    matches = (reg_expr.fullmatch(n) for n in existing_names)
    str_suffixes = (match.group(1) for match in matches if match)

    suffixes = chain((int(suffix) if suffix else 0 for suffix in str_suffixes), [-1])
    max_suffix = max(suffixes) + 1

    return f'{name}{delimiter}{max_suffix}' if max_suffix else name


def get_nested(dictionary: dict, *nested_keys: Iterable[str]):
    cur = dictionary
    for key in nested_keys:
        nested = cur.get(key)
        if nested is None:
            return nested
        cur = nested
    return cur


def ordered_values(dictionary: Mapping[str, Any], key_order: Iterable[str]):
    known_keys_set = set(key_order)

    known_values = (dictionary[key] for key in key_order if key in dictionary)
    unknown_values = (value for key, value in dictionary.items() if key not in known_keys_set)

    return [*known_values, *unknown_values]


def clean_up_file_name(file_name):
    return re.sub(r'[\\/\s()]+', '_', file_name)


def remove_parentheses(input_str):
    return re.sub(r'\(.*?\)', '', input_str).strip()
