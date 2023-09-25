import locale
import numpy as np


def get_well_order_by_names(well_names):
    '''
    locale only works on app engine
    '''
    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
    return np.argsort([locale.strxfrm(name or '') for name in well_names])
