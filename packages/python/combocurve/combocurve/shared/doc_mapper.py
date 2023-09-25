from typing import Mapping, List, Any

from bson import ObjectId

from .helpers import gen_inpt_id

NEW_INPT_ID = '$$INPTID'


class DocMapper:
    def __init__(self, ids_mapping: Mapping[ObjectId, ObjectId], set_fields: Mapping[str, Any],
                 string_mapping: Mapping[str, str]):
        self.ids_mapping = ids_mapping
        self.set_fields = set_fields
        self.string_mapping = string_mapping

    def map(self, doc: Mapping[str, Any]):
        mapped = self._map(doc)
        return self._apply_set_fields(mapped)

    def _map(self, doc):
        if isinstance(doc, Mapping):
            return {k: self._map(v) for k, v in doc.items()}
        if isinstance(doc, List):
            return [self._map(elem) for elem in doc]
        if isinstance(doc, ObjectId):
            return self.ids_mapping.get(doc, doc)
        if isinstance(doc, str):
            return self.string_mapping.get(doc, doc)
        return doc

    def _apply_set_fields(self, doc: Mapping[str, Any]):
        return {k: self._get_field_value(k, v) for k, v in doc.items()}

    def _get_field_value(self, field, value):
        res = self.set_fields.get(field, value)
        if res == NEW_INPT_ID:
            return gen_inpt_id()
        return res
