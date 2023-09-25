import numpy as np

BASE_TIME_STR = '1900-01-01'
BASE_TIME_NPDATETIME64 = np.datetime64(BASE_TIME_STR)
BASE_TIME_IDX = 0
BASE_TIMESTAMP = -2208988800
MAX_TIME_STR = '2199-12-31'
DATE_IDX_LARGE = 109572  # 12/31/2199
MAX_TIME_NPDATETIME64 = np.datetime64(MAX_TIME_STR)
MAX_TIME_IDX = (MAX_TIME_NPDATETIME64 - BASE_TIME_NPDATETIME64).astype(int)
DAYS_IN_YEAR = 365.25
DAYS_IN_MONTH = 30.4375
MONTHS_IN_YEAR = 12  # Stupid, but makes code more readable.
PROBABILISTIC_STR = 'probabilistic'
DETERMINISTIC_STR = 'deterministic'
P10_STR = 'P10'
P50_STR = 'P50'
P90_STR = 'P90'
BEST_STR = 'best'
OIL_STR = 'oil'
GAS_STR = 'gas'
WATER_STR = 'water'
PHASES = [OIL_STR, GAS_STR, WATER_STR]
PROB_SERIES = [BEST_STR, P10_STR, P50_STR, P90_STR]
MONTHLY_UNIT_TEMPLATE = {
    "gas/oil": "MCF/BBL",
    "gas/water": "MCF/BBL",
    "oil/gas": "BBL/MCF",
    "oil/water": "BBL/BBL",
    "water/gas": "BBL/MCF",
    "water/oil": "BBL/BBL",
    "gas/oil/pll": "MCF/BBL/FT",
    "gas/water/pll": "MCF/BBL/FT",
    "oil/gas/pll": "BBL/MCF/FT",
    "oil/water/pll": "BBL/BBL/FT",
    "water/gas/pll": "BBL/MCF/FT",
    "water/oil/pll": "BBL/BBL/FT",
    "cumsum_gas": "MCF",
    "cumsum_oil": "BBL",
    "cumsum_water": "BBL",
    "cumsum_gas/pll": "MCF/FT",
    "cumsum_oil/pll": "BBL/FT",
    "cumsum_water/pll": "BBL/FT",
    "gas": "MCF/M",
    "oil": "BBL/M",
    "water": "BBL/M",
    "gas/pll": "MCF/M/FT",
    "oil/pll": "BBL/M/FT",
    "water/pll": "BBL/M/FT",
    "bottom_hole_pressure": "PSI",
    "casing_head_pressure": "PSI",
    "flowline_pressure": "PSI",
    "gas_lift_injection_pressure": "PSI",
    "tubing_head_pressure": "PSI",
    "vessel_separator_pressure": "PSI",
    "choke": "in",
    "gasInjection": "MCF/M",
    "waterInjection": "BBL/M",
    "co2Injection": "MCF/M",
    "steamInjection": "MCF/M",
    "ngl": "BBL/M",
    "pll": "FT",
    "gas_eur": "MCF",
    "gas_eur/pll": "MCF/FT",
    "oil_eur": "BBL",
    "oil_eur/pll": "BBL/FT",
    "water_eur": "BBL",
    "water_eur/pll": "BBL/FT",
    "oil_k": "BBL/D/D",
    "gas_k": "MCF/D/D",
    "water_k": "BBL/D/D",
    "gas/oil_k": "MCF/BBL/D",
    "gas/water_k": "MCF/BBL/D",
    "oil/gas_k": "BBL/MCF/D",
    "oil/water_k": "BBL/BBL/D",
    "water/gas_k": "BBL/MCF/D",
    "water/oil_k": "BBL/BBL/D",
    "boe": "BOE/M",
    "mcfe": "MCFE/M"
}
DEFAULT_UNIT_TEMPLATE = {
    "gas/oil": "CF/BBL",
    "gas/water": "MCF/BBL",
    "oil/gas": "BBL/MMCF",
    "oil/water": "BBL/BBL",
    "water/gas": "BBL/MMCF",
    "water/oil": "BBL/BBL",
    "gas/oil/pll": "MCF/BBL/FT",
    "gas/water/pll": "MCF/BBL/FT",
    "oil/gas/pll": "BBL/MCF/FT",
    "oil/water/pll": "BBL/BBL/FT",
    "water/gas/pll": "BBL/MCF/FT",
    "water/oil/pll": "BBL/BBL/FT",
    "cumsum_gas": "MMCF",
    "cumsum_oil": "MBBL",
    "cumsum_water": "MBBL",
    "cumsum_gas/pll": "MCF/FT",
    "cumsum_oil/pll": "BBL/FT",
    "cumsum_water/pll": "BBL/FT",
    "gas": "MCF/D",
    "oil": "BBL/D",
    "water": "BBL/D",
    "gas/pll": "MCF/D/1000FT",
    "oil/pll": "BBL/D/1000FT",
    "water/pll": "BBL/D/1000FT",
    "bottom_hole_pressure": "PSI",
    "casing_head_pressure": "PSI",
    "flowline_pressure": "PSI",
    "gas_lift_injection_pressure": "PSI",
    "tubing_head_pressure": "PSI",
    "vessel_separator_pressure": "PSI",
    "choke": "in",
    "gasInjection": "MCF/D",
    "waterInjection": "BBL/D",
    "co2Injection": "MCF/D",
    "steamInjection": "MCF/D",
    "ngl": "BBL/D",
    "pll": "FT",
    "gas_eur": "MMCF",
    "gas_eur/pll": "MCF/FT",
    "oil_eur": "MBBL",
    "oil_eur/pll": "BBL/FT",
    "water_eur": "MBBL",
    "water_eur/pll": "BBL/FT",
    "oil_k": "BBL/D/D",
    "gas_k": "MCF/D/D",
    "water_k": "BBL/D/D",
    "gas/oil_k": "CF/BBL/D",
    "gas/water_k": "MCF/BBL/D",
    "oil/gas_k": "BBL/MMCF/D",
    "oil/water_k": "BBL/BBL/D",
    "water/gas_k": "BBL/MMCF/D",
    "water/oil_k": "BBL/BBL/D",
    "boe": "BOE/D",
    "mcfe": "MCFE/D"
}

# Reasonable bounds for D_eff
D_EFF_MAX = 0.999
D_EFF_MIN = np.finfo(np.float64).min
D_EFF_MIN_DECLINE = 0.0001

# max/min allowable rates
Q_MAX = 1e9
Q_MIN = 1e-6
