GROUP_INDEPENDENT = 'group-independent'
CANNOT_EXCEED_GROUP = 'cannot-exceed-group'
MUST_BE_GROUP = 'must-be-group'

GROUP_PROPERTY_DEFAULTS = {'econLimit': GROUP_INDEPENDENT}


def get_one_group_setting(group_settings, econ_group, combo_name):
    return group_settings.get(econ_group, {}).get(combo_name, {})


def get_group_properties(group_settings, econ_group, combo_name):
    '''
    return group_property for a Econ group and ensure fill in missing options with default
    '''
    return {
        **GROUP_PROPERTY_DEFAULTS,
        **get_one_group_setting(group_settings, econ_group, combo_name).get('properties', {})
    }


def get_allocation_bool(group_properties_dict):
    return group_properties_dict.get('allocation', {}).get('properties', 'none') == 'individual-wells'


def get_group_ecl_option(group_properties):
    ecl_option = group_properties.get('econLimit')
    if ecl_option is None or ecl_option == '':
        return GROUP_INDEPENDENT
    return ecl_option


def get_allocation_method(group_properties):
    allocation_method = group_properties['allocation'].get('method')
    if allocation_method is None or allocation_method == '':
        return 'well-count'
    return allocation_method


def get_allocation_info(group_properties):
    allocation_method_type = group_properties['allocation'].get('methodType', 'gross')
    allocation_bool = get_allocation_bool(group_properties)
    allocation_basis = group_properties['allocation'].get('basis', 'net')
    allocation_timing = group_properties['allocation'].get('timing', 'monthly')

    return allocation_method_type, allocation_bool, allocation_basis, allocation_timing
