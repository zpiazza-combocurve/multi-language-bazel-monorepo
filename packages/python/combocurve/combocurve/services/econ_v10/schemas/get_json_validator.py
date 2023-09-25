from datetime import datetime
import jsonschema
from os import path
from combocurve.services.econ_v10.schemas.get_schema import get_schema
from pathlib import Path
from bson import ObjectId


def is_datetime(checker, instance):
    return isinstance(instance, datetime)


def is_objectId(checker, instance):
    return isinstance(instance, ObjectId)


def get_json_validator():
    base_validator = jsonschema.Draft7Validator

    type_checkers = base_validator.TYPE_CHECKER.redefine_many({
        'datetime': is_datetime,
        'objectId': is_objectId,
    })

    Validator = jsonschema.validators.extend(base_validator, type_checker=type_checkers)

    Validator.VALIDATORS["bsonType"] = jsonschema.Draft7Validator.VALIDATORS["type"]

    schema = get_schema()

    current_dir = path.dirname(path.realpath(__file__))

    resolver = jsonschema.RefResolver(base_uri=f'{Path(current_dir).as_uri()}/', referrer=schema)

    return Validator(schema=schema, resolver=resolver)
