from combocurve.science.forecast.auto_forecast_warnings import NO_WARNING

EMPTY_P_SEGS = {'best': {'segments': [], 'diagnostics': {}, 'eur': None, 'rur': None}}

EMPTY_RATIO = {'segments': [], 'diagnostics': {}, 'basePhase': None, 'x': None, 'eur': None, 'rur': None}


# Moved into its own file to avoid circular dependency error
def return_template(P_dict: dict = EMPTY_P_SEGS,
                    diagnostics: dict = {},
                    forecastType: str = 'rate',
                    forecastSubType: str = 'automatic',
                    warning: dict = NO_WARNING,
                    ratio: dict = EMPTY_RATIO,
                    forecasted: bool = True,
                    data_freq: str = None) -> dict:

    ret = {
        'P_dict': P_dict,
        'diagnostics': diagnostics,
        'forecastType': forecastType,
        'forecastSubType': forecastSubType,
        'warning': warning,
        'ratio': ratio,
        'forecasted': forecasted,
        'data_freq': data_freq
    }
    return ret
