import numpy as np
import datetime

stream_inputs = {
    'Oil': {
        'date': np.array([datetime.date(2000, 1, 1),
                          datetime.date(2000, 2, 1),
                          datetime.date(2000, 3, 1)]),
        'value': np.array([1, 2, 3], dtype=float)
    },
    'Gas': {
        'date': np.array([datetime.date(2000, 1, 1),
                          datetime.date(2000, 2, 1),
                          datetime.date(2000, 3, 1)]),
        'value': np.array([5, 6, 7], dtype=float)
    }
}

functions = {
    '@FPD': lambda value: {
        'date': np.array([datetime.date(2000, 1, 1)]),
        'value': np.array([value], dtype=float)
    }
}
