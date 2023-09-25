# oil: bbl
# gas: mcf
# water: bbl
# boe: bbl,  gas(mcf)/6 + oil(bbl)
# gor: mcf/bbl
# mmcfge: mmcf, gas(mmcf) + 6 * oil(mbbl)

db_unit = {
    'oil': 'bbl',
    'gas': 'mcf',
    'water': 'bbl',
    'boe': 'boe',
    'gor': 'mcf/bbl',
    'mmcfge': 'mmcfe',
    'oil_per_perforated_interval': 'bbl/ft',
    'gas_per_perforated_interval': 'mcf/ft',
    'water_per_perforated_interval': 'bbl/ft',
    'boe_per_perforated_interval': 'boe/ft',
    'gor_per_perforated_interval': 'mcf/bbl/ft',
    'mmcfge_per_perforated_interval': 'mmcfe/ft'
}

base_target_unit = {
    'oil': 'mbbl',
    'gas': 'mmcf',
    'water': 'mbbl',
    'boe': 'mboe',
    'gor': 'cf/bbl',
    'mmcfge': 'mmcfe',
    'oil_per_perforated_interval': 'bbl/ft',
    'gas_per_perforated_interval': 'mcf/ft',
    'water_per_perforated_interval': 'bbl/ft',
    'boe_per_perforated_interval': 'boe/ft',
    'gor_per_perforated_interval': 'mcf/bbl/ft',
    'mmcfge_per_perforated_interval': 'mcfe/ft'
}

current_unit = {}
target_unit = {}
for item in ['cum', 'first_6', 'first_12', 'last_12', 'last_month']:
    for k, v in db_unit.items():
        current_unit[item + '_' + k] = v

    for k, v in base_target_unit.items():
        target_unit[item + '_' + k] = v

# target_unit = {
#    'cum_oil': 'mmbbl', #
#    'cum_gas': 'mmcf', #
#    'cum_water': 'mmbbl', #
#    'cum_boe': 'mboe', #
#    'cum_gor': 'cf/bbl', #
#    # 'cum_mmcfge': 'mmcfe', #
#    # 'cum_oil_per_perforated_interval': 'bbl/ft',
#    # 'cum_gas_per_perforated_interval': 'mcf/ft',
#    # 'cum_water_per_perforated_interval': 'bbl/ft',
#    # 'cum_boe_per_perforated_interval': 'boe/ft',
#    # 'cum_gor_per_perforated_interval': 'mcf/bbl/ft',
#    # 'cum_mmcfge_per_perforated_interval': 'mmcf/ft',
#    'first_6_oil': 'mbbl', #
#    'first_6_gas': 'mmcf', #
#    'first_6_water': 'mbbl', #
#    'first_6_boe': 'mboe', #
#    # 'first_6_gor': 'mcf/bbl',
#    # 'first_6_mmcfge': 'mmcfe',
#    'first_6_oil_per_perforated_interval': 'bbl/ft', #
#    'first_6_gas_per_perforated_interval': 'mcf/ft', #
#    # 'first_6_water_per_perforated_interval': 'bbl/ft',
#    'first_6_boe_per_perforated_interval': 'boe/ft', #
#    # 'first_6_gor_per_perforated_interval': 'mcf/bbl/ft',
#    # 'first_6_mmcfge_per_perforated_interval': 'mmcf/ft',
#    'first_12_oil': 'mbbl', #
#    'first_12_gas': 'mmcf', #
#    'first_12_water': 'mbbl', #
#    'first_12_boe': 'mboe', #
#    # 'first_12_gor': 'mcf/bbl',
#    'first_12_mmcfge': 'mmcfe', # unit not given, need to ask
#    'first_12_oil_per_perforated_interval': 'bbl/ft', #
#    'first_12_gas_per_perforated_interval': 'mcf/ft', #
#    # 'first_12_water_per_perforated_interval': 'bbl/ft',
#    'first_12_boe_per_perforated_interval': 'boe/ft', #
#    # 'first_12_gor_per_perforated_interval': 'mcf/bbl/ft',
#    # 'first_12_mmcfge_per_perforated_interval': 'mmcf/ft',
#    'last_12_oil': 'mbbl', #
#    'last_12_gas': 'mmcf', #
#    'last_12_water': 'mbbl', #
#    # 'last_12_boe': 'mboe',
#    'last_12_gor': 'cf/bbl', #
#    # 'last_12_mmcfge': 'mmcfe',
#    # 'last_12_oil_per_perforated_interval': 'bbl/ft',
#    # 'last_12_gas_per_perforated_interval': 'mcf/ft',
#    # 'last_12_water_per_perforated_interval': 'bbl/ft',
#    # 'last_12_boe_per_perforated_interval': 'boe/ft',
#    # 'last_12_gor_per_perforated_interval': 'mcf/bbl/ft',
#    # 'last_12_mmcfge_per_perforated_interval': 'mmcf/ft',
#    'last_month_oil': 'bbl', # unit not given, need to ask
#    'last_month_gas': 'mcf', # unit not given, need to ask
#    'last_month_water': 'bbl', # unit not given, need to ask
#    # 'last_month_boe': 'boe', # unit not given, need to ask
#    'last_month_gor': 'mcf/bbl', # unit not given, need to ask
#    # 'last_month_mmcfge': 'mmcfe',
#    # 'last_month_oil_per_perforated_interval': 'bbl/ft',
#    # 'last_month_gas_per_perforated_interval': 'mcf/ft',
#    # 'last_month_water_per_perforated_interval': 'bbl/ft',
#    # 'last_month_boe_per_perforated_interval': 'boe/ft',
#    # 'last_month_gor_per_perforated_interval': 'mcf/bbl/ft',
#    # 'last_month_mmcfge_per_perforated_interval': 'mmcf/ft'
# }

written_items = [
    'oil',
    'gas',
    'water',
    'boe',
    'gor',
    'mmcfge',
    'oil_per_perforated_interval',
    'gas_per_perforated_interval',
    'water_per_perforated_interval',
    'boe_per_perforated_interval',
    # 'gor_per_perforated_interval',
    'mmcfge_per_perforated_interval',
]
written_fields = []
for period in ['cum', 'first_6', 'first_12', 'last_12', 'last_month']:
    for item in written_items:
        written_fields += [period + '_' + item]
