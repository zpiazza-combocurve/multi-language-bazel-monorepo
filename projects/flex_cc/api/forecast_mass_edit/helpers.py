def clean_series_name(series):
    if series in ['p10', 'p50', 'p90']:
        series = series[0].upper() + series[1:]
    return series
