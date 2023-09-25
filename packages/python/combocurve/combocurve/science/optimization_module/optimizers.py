import numpy as np
from scipy.optimize import differential_evolution, minimize


def get_use_para_dict(valid_parameter_names, parameter_dictionary):
    use_para_dictionary = {}
    for k, v in parameter_dictionary.items():
        if k in valid_parameter_names:
            use_para_dictionary[k] = v

    return use_para_dictionary


def my_differential_evolution(target_fun, parameter_dictionary):
    valid_parameter_names = [
        'bounds', 'args', 'strategy', 'maxiter', 'popsize', 'tol', 'mutation', 'recombination', 'seed', 'disp',
        'callback', 'polish', 'init', 'atol', 'updating', 'workers', 'constraints'
    ]

    use_para_dictionary = get_use_para_dict(valid_parameter_names, parameter_dictionary)
    # scipy.optimize.Bounds
    # lower_bounds = [bound[0] for bound in use_para_dictionary['bounds']]
    # upper_bounds = [bound[1] for bound in use_para_dictionary['bounds']]
    # use_para_dictionary['bounds'] = Bounds(lower_bounds, upper_bounds, keep_feasible=True)
    if 'constraints' in use_para_dictionary:
        use_para_dictionary.pop('constraints')
    return differential_evolution(target_fun, **use_para_dictionary)


def repeated_differential_evolution(target_fun, parameter_dictionary):
    random_seeds = parameter_dictionary.get('random_seeds')
    if random_seeds:
        valid_parameter_names = [
            'bounds', 'args', 'strategy', 'maxiter', 'popsize', 'tol', 'mutation', 'recombination', 'disp', 'callback',
            'polish', 'init', 'atol', 'updating', 'workers', 'constraints'
        ]
        use_para_dictionary = get_use_para_dict(valid_parameter_names, parameter_dictionary)
        err = []
        fits = []
        for seed in random_seeds:
            use_para_dictionary['seed'] = seed
            this_fit = differential_evolution(target_fun, **use_para_dictionary)
            err += [this_fit.fun]
            fits += [this_fit]

        min_err_idx = np.argmin(err)
        return fits[min_err_idx]
    else:
        ### Raise exception
        raise Exception('Missing random_seeds for repeated differential evolution')


def my_minimize(target_fun, parameter_dictionary):
    valid_parameter_names = ['bounds', 'args', 'tol', 'jac', 'hess', 'hessp', 'callback', 'constraints']
    valid_bfgs_options = [
        'disp', 'maxcor', 'ftol', 'gtol', 'eps', 'maxfun', 'maxiter', 'iprint', 'maxls', 'finite_diff_rel_step'
    ]

    use_para_dictionary = get_use_para_dict(valid_parameter_names, parameter_dictionary)
    use_bfgs_options = get_use_para_dict(valid_bfgs_options, parameter_dictionary)
    if use_bfgs_options.get('maxiter') is None:
        # No protection for None in maxiter for L-BFGS. Set to default, per documentation.
        use_bfgs_options['maxiter'] = 15000
    if 'constraints' in use_para_dictionary:
        use_para_dictionary.pop('constraints')
    if 'x0' not in use_para_dictionary:
        # Set initial guess as average of bounds.
        use_para_dictionary['x0'] = [sum(b) / len(b) for b in parameter_dictionary['bounds']]
    return minimize(target_fun, method='L-BFGS-B', options=use_bfgs_options, **use_para_dictionary)


optimizers = {
    'my_differential_evolution': my_differential_evolution,
    'repeated_differential_evolution': repeated_differential_evolution,
    'my_minimize': my_minimize
}
