from operator import itemgetter

TEXT_BEHAVIOUR_CONV_DICT = {'M': 'regular', 'R': 'ratio', 'I': 'interpolation'}


def create_elt_configurations(lookup_criteria, project_custom_header_alias):
    """
        Creates the configuration object for the ELT doc based on the lookup criteria and project custom header aliases.

        Args:
            lookup_criteria (list): A list containing dictionaries with the column name and criterion.
            project_custom_header_alias (dict): A dictionary containing the custom header aliases and
            their corresponding column names.

        Returns:
            dict: A configuration object for the ELT doc containing the selected headers, selected headers',
            match behavior, and case-insensitivity flag.
    """
    selected_headers = []
    selected_match_behaviour = {}
    for table_data in lookup_criteria[0][:-1]:
        column_name, criterion = itemgetter('column_name', 'criterion')(table_data)
        name = f'{column_name} (ARIES LU)'
        selected_headers.append(project_custom_header_alias[name])
        selected_match_behaviour[project_custom_header_alias[name]] = TEXT_BEHAVIOUR_CONV_DICT.get(
            str(criterion).upper(), 'regular')

    configuration = {
        'caseInsensitiveMatching': True,
        'selectedHeaders': selected_headers,
        'selectedHeadersMatchBehavior': selected_match_behaviour
    }

    return configuration
