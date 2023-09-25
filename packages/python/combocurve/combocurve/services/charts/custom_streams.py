from collections import defaultdict
from typing import Any

All_STREAMS = {'customNumber0', 'customNumber1', 'customNumber2', 'customNumber3', 'customNumber4'}
DEFAULT_STREAMS = {
    'monthly': {
        'customNumber0': 'customNumber0Monthly',
        'customNumber1': 'customNumber1Monthly',
        'customNumber2': 'customNumber2Monthly',
        'customNumber3': 'customNumber3Monthly',
        'customNumber4': 'customNumber4Monthly',
    },
    'daily': {
        'customNumber0': 'customNumber0Daily',
        'customNumber1': 'customNumber1Daily',
        'customNumber2': 'customNumber2Daily',
        'customNumber3': 'customNumber3Daily',
        'customNumber4': 'customNumber4Daily',
    }
}


def get_custom_streams(context: Any) -> defaultdict(dict):
    '''Get custom streams keys and labels: both daily and monthly
       Return format:
       {'daily': {'customNumber0': 'label'}, 'monthly': {'customNumber0': 'label'}}
    Args:
        context: a context instance for db connection
    Returns:
        defaultdict(dict): The defaultdict dict that contains custom streams and their labels
    '''
    customized_streams = defaultdict(dict)
    custom_document = context.custom_header_configurations_collection.find_one({})
    if not custom_document:
        return DEFAULT_STREAMS

    for key in ['daily', 'monthly']:
        if custom_document.get(f'{key}-productions'):
            stream_headers = custom_document.get(f'{key}-productions')
            resolution_str = key.capitalize()
            for stream in stream_headers:
                customized_streams[key][stream] = stream_headers[stream].get(
                    'label', f'{stream}{resolution_str}')

    return customized_streams
