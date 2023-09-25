from .fields import (MONTHLY_PHASE_FIELDS, MONTHLY_MONGO_TO_PROTO_MAPPING, DAILY_PHASE_FIELDS,
                     DAILY_MONGO_TO_PROTO_MAPPING)
from .types import to_timestamp, to_field_mask
from combocurve.shared.date import date_from_index


def map_monthly_production_mongodb_doc_to_dal_upsert_records(doc):
    return _map_production_mongodb_doc_to_dal_upsert_records(doc, MONTHLY_PHASE_FIELDS, MONTHLY_MONGO_TO_PROTO_MAPPING)


def map_daily_production_mongodb_doc_to_dal_upsert_records(doc):
    return _map_production_mongodb_doc_to_dal_upsert_records(doc, DAILY_PHASE_FIELDS, DAILY_MONGO_TO_PROTO_MAPPING)


def _map_production_mongodb_doc_to_dal_upsert_records(doc: dict, phase_fields, mongo_to_proto_mapping):
    well = str(doc.get('well'))
    project = str(doc['project']) if doc.get('project', None) is not None else None

    index_array = doc['index']
    for index in range(len(index_array)):
        date_index = index_array[index]

        if date_index is None:
            continue

        record = {
            'well': well,
            'project': project,
            'date': to_timestamp(date_from_index(date_index)),
        }

        for phase in phase_fields:
            phase_bucket = doc.get(phase, None)

            if phase_bucket is None:
                continue

            value = phase_bucket[index]
            if value is None:
                continue

            model_field = mongo_to_proto_mapping.get(phase, None)
            if model_field is None:
                continue

            record[model_field] = value

        record['field_mask'] = to_field_mask(list(record.keys()))

        yield record
