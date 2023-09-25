import traceback


def _get_custom_exception_attrs(instance):
    attrs = {}
    for key in dir(instance):
        if not key.startswith('__') and not callable(getattr(instance, key)) and not key == 'args':
            attrs[key] = getattr(instance, key)
    return attrs


def get_exception_info(instance):
    '''
        Returns a dictionary with info about an Exception instance.
        This may be useful for sending error info back on HTTP requests after catching Python exceptions.
        See: api/helpers/errors.js in main-combocurve
    '''
    return {
        # Whether this error was thrown on purpose or not i.e: invalid user input was detected
        # When sub-classing Exception please define this attribute for better error handling
        'expected': getattr(instance, 'expected', False),

        # Name of the exception
        'name': instance.__class__.__name__,

        # Message provided when thrown, must be 1st arg
        'message': str(instance.args[0]) if len(instance.args) > 0 else 'An exception occurred',

        # TODO: Temp. disabled until we find a way of making sure everything under details is JSON-serializable
        # 'details': _get_custom_exception_attrs(instance),
        'details': None,

        # Traceback
        'traceback': ''.join(traceback.format_tb(getattr(instance, '__traceback__', None))),

        # Just a signature to recognize this kind of object
        'py_exception': True,
    }


'''
Example:
>>> class InvalidInputError(Exception):
>>>     expected = True
>>>     def __init__(self, message):
>>>         self.context = "Stuff"

>>> print(get_exception_info(Exception('Kaaa...', {'optional': 'info'})))
<<<
    {
        'expected': False,
        'name': 'Exception',
        'message': 'Kaaa...',
        'details': {
            'optional': 'info'
        },
        'py_exception': True
    }
>>> print(get_exception_info(InvalidInputError('Boooom!!!')))
<<<
{
    'context': 'Stuff',
    'expected': True,
    'name': 'InvalidInputError',
    'message': 'Boooom!!!',
    'details': None,
    'py_exception': True
}
'''
