def require_params(source, keys):
    try:
        return {k: source[k] for k in keys}
    except KeyError as e:
        key = e.args[0]
        raise Exception(f'Missing required parameter `{key}`')
