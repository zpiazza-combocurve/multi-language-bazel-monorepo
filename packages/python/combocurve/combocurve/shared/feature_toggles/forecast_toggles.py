'''
This is a naive implementation of feature toggles, until a system can be built to integrate with our auth system. To
use, simply specify the truth value of your feature flag. Changing the state of the flag will require a push to
production code, which is not optimal.
'''

NORMALIZATIONS_VERSION = 2


def use_normalization_v2():
    return NORMALIZATIONS_VERSION == 2
