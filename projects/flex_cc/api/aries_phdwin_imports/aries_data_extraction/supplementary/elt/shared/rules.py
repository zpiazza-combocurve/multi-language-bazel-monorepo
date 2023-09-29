from ..assumptions.general import AND_SEPARATOR, PERC_SEPARATOR


def create_rules_doc(condition_doc, header_alias):
    rules = []
    for key, value in condition_doc.items():
        conditions = []
        for condition in key.split(AND_SEPARATOR):
            condition_key, condition_value = condition.rsplit(PERC_SEPARATOR, 1)
            condition_key = header_alias.get(f'{condition_key} (ARIES LU)')
            conditions.append({
                "childrenValues": [],
                "key": condition_key,
                "operator": "equal",
                "value": condition_value
            })
        rules.append({"conditions": conditions, "values": value})
    return rules
