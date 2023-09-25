import json
from os import path


def get_schema():
    current_dir = path.dirname(path.realpath(__file__))

    file_path = f"{current_dir}/schema.json"

    if path.exists(file_path) is True:
        with open(file_path, "r") as fp:
            return json.load(fp)

    return None
