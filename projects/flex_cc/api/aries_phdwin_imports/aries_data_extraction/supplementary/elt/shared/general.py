def get_shared_keys(dict_list):
    """
    Accepts a list of dictionaries with the same keys and returns a list of keys that have the same
    values for all dictionaries in the list.

    Args:
    - dict_list (list): A list of dictionaries with the same keys.

    Returns:
    - A list of keys that have the same values for all dictionaries in the list.
    """
    shared_keys = []
    if len(dict_list) > 0:
        first_dict = dict_list[0]
        for key in first_dict:
            if all(d.get(key) == first_dict[key] for d in dict_list):
                shared_keys.append(key)
    return shared_keys


def compare_docs_for_elt(dict_list):
    """
        Accepts a list of dictionaries as input. Each dictionary has similar keys.
        The first dictionary will behave as a reference dictionary. The function compares
        the remaining dictionaries with the reference dictionary, identifying all the keys
        across the remaining dictionaries that have different values from the reference dictionary.
        It then returns a list of dictionaries that consist of the remaining dictionaries with all
        the keys that were identified to have changed.

        Args:
        - dict_list (list): A list of dictionaries, where each dictionary has similar keys.

        Returns:
        - A list of dictionaries that consist of the remaining dictionaries with all the keys
        that were identified to have changed.
    """
    ref_dict = dict_list[0]
    changed_keys = []
    for key in ref_dict:
        for i in range(1, len(dict_list)):
            if ref_dict[key] != dict_list[i][key]:
                changed_keys.append(key)
                break
    result = []
    for dictionary in dict_list[1:]:
        new_dict = {}
        for key in changed_keys:
            if key in dictionary:
                new_dict[key] = dictionary.get(key)
        if new_dict:
            result.append(new_dict)
    return result
