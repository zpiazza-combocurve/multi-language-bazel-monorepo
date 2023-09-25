from copy import deepcopy

###### segment templates
common_template = {'start_idx': None, 'end_idx': None, 'q_start': None, 'q_end': None}
exp_inc_template = {'name': 'exp_inc', 'slope': 1, 'D_eff': None, 'D': None}
exp_dec_template = {'name': 'exp_dec', 'slope': -1, 'D_eff': None, 'D': None}
arps_template = {'name': 'arps', 'slope': -1, 'b': None, 'D_eff': None, 'D': None}
arps_inc_template = {'name': 'arps_inc', 'slope': 1, 'b': None, 'D_eff': None, 'D': None}

arps_modified_template = {
    'name': 'arps_modified',
    'slope': -1,
    'D_eff': None,
    'D': None,
    'b': None,
    'target_D_eff_sw': None,
    'realized_D_eff_sw': None,
    'sw_idx': None,
    'q_sw': None,
    'D_exp_eff': None,
    'D_exp': None
}
flat_template = {'name': 'flat', 'slope': 0, 'c': None}
empty_template = {'name': 'empty', 'slope': 0}
linear_template = {'name': 'linear', 'slope': 0, 'k': None}

templates = {
    'common': common_template,
    'exp_inc': exp_inc_template,
    'exp_dec': exp_dec_template,
    'arps': arps_template,
    'arps_inc': arps_inc_template,
    'arps_modified': arps_modified_template,
    'flat': flat_template,
    'empty': empty_template,
    'linear': linear_template
}


def get_template(name):
    com_dict = deepcopy(templates['common'])
    name_dict = deepcopy(templates[name])
    com_dict.update(name_dict)
    return com_dict
