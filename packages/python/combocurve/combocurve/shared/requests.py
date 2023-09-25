from typing import Iterable, Mapping, Any, List


def extract_parameters(body: Mapping[str, Any], parameters: Iterable[str] = [], required=False) -> List[Any]:
    if not required:
        return [body.get(param, None) for param in parameters]

    try:
        return [body[param] for param in parameters]
    except KeyError as e:
        raise MissingParameterError(e.args[0])


class MissingParameterError(Exception):
    def __init__(self, parameter_name):
        super().__init__(f'Missing parameter {parameter_name}')
        self.expected = True
