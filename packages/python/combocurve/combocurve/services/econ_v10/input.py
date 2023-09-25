from combocurve.services.econ.econ_input_batch import get_econ_batch_input
from combocurve.services.econ_v10.schemas.get_json_validator import get_json_validator


def econ_inputs(
    context,
    scenario_id,
    assignment_ids,
    combos,
    columns,
    column_fields,
    ghg_id,
    project_id,
):

    # query models
    nested_econ_inputs = get_econ_batch_input(
        context,
        scenario_id,
        assignment_ids,
        combos,
        columns,
        column_fields,
        ghg_id,
        project_id,
    )

    # jsonschema validator
    Validator = get_json_validator()

    # separate regular and incremental wells
    well_inputs, inc_well_inputs = {}, {}
    for qualifier in nested_econ_inputs:
        well_inputs[qualifier], inc_well_inputs[qualifier] = [], []
        for _inputs in nested_econ_inputs[qualifier].values():
            for incremental_idx, _input in _inputs.items():

                Validator.validate(instance=_input)

                if incremental_idx == 0:
                    well_inputs[qualifier].append(_input)
                elif incremental_idx == 1:
                    inc_well_inputs[qualifier].append((_inputs[0], _input))

    return well_inputs, inc_well_inputs


def parse_assumptions(assumptions):
    parsed_assumptions = {}
    return parsed_assumptions


def validate_inputs(inputs):
    # do stuff
    pass


class WellInput():
    pass
