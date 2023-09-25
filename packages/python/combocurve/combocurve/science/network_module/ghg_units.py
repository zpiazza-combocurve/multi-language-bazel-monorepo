# emissions (CO2, C1, N2O) will be stored in db in metric tons (mt)
ghg_unit = {
    'CO2': {
        'unit': 'metric_ton',
        'display_unit': 'MT'
    },
    'C1': {
        'unit': 'metric_ton',
        'display_unit': 'MT'
    },
    'N2O': {
        'unit': 'metric_ton',
        'display_unit': 'MT'
    },
    'CO2e': {
        'unit': 'metric_ton',
        'display_unit': 'MT'
    }
}

emission_ghgs = {
    'co2e': 'CO2e',
    'co2': 'CO2',
    'ch4': 'CH4',
    'n2o': 'N2O',
}

phase_unit = {
    'gas': {
        'unit': 'thousand_standard_cubic_feet',
        'display_unit': 'MCF'
    },
    'oil': {
        'unit': 'barrel',
        'display_unit': 'BBL'
    },
    'water': {
        'unit': 'barrel',
        'display_unit': 'BBL'
    },
    'wh_gas': {
        'unit': 'thousand_standard_cubic_feet',
        'display_unit': 'MCF'
    },
    'wh_oil': {
        'unit': 'barrel',
        'display_unit': 'BBL'
    },
    'wh_water': {
        'unit': 'barrel',
        'display_unit': 'BBL'
    },
}

density_dict = {
    'CO2': {
        'multiplier': 0.0526,
        'unit': 'mt/mcf',
    },
    'C1': {
        'multiplier': 0.0192,
        'unit': 'mt/mcf',
    },
}

flare_dict = {
    'CO2': density_dict['CO2'],
    'C1': density_dict['C1'],
    'N2O': {
        'multiplier': 0.0000001,
        'unit': 'mt/MMBtu'
    }
}
carbon_number_dict = {'C1': 1, 'C2': 2, 'C3': 3, 'iC4': 4, 'nC4': 4, 'C4': 4, 'iC5': 5, 'nC5': 5, 'C5': 5}

emission_categories = {
    'associated_gas': 'Associated Gas',
    'acid_gas_removal_units': 'Acid Gas Removal Units',
    'centrifugal_compressor': 'Centrifugal Compressor',
    'eor_hydrocarbon_liquids': 'EOR Hydrocarbon Liquids',
    'eor_injection_pumps': 'EOR Injection Pumps',
    'liquids_unloading': 'Liquids Unloading',
    'pneumatic_device': 'Pneumatic Device',
    'dehydrators': 'Dehydrators',
    'equipment_leaks': 'Equipment Leaks',
    'atmospheric_tank': 'Atmospheric Tank',
    'reciprocating_compressor': 'Reciprocating Compressor',
    'completions_with_fracturing': 'Completions With Fracturing',
    'completions_without_fracturing': 'Completions Without Fracturing',
    'drilling': 'Drilling Combustion',
    'completion': 'Completion Combustion',
    'combustion': 'Combustion',
    'pneumatic_pump': 'Pneumatic Pump',
    'well_testing': 'Well Testing',
    'blowdown_vent_stacks': 'Blowdown Vent Stacks',
    'flare': 'Flare',
    'scope2': 'Scope 2',
    'scope3': 'Scope 3',
}

emission_units = {
    'mt_per_mbbl': 'MT/MBBL',
    'mt_per_mmcf': 'MT/MMCF',
    'mt_per_mboe': 'MT/MBOE',
    'mt_per_well_per_year': 'MT/Well/Year',
    'mt_per_new_well': 'MT/New Well',
}

detailed_fuel_types = {
    'anthracite': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Coal and coke: anthracite'
    },
    'bituminous': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Coal and coke: bituminous'
    },
    'subbituminous': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Coal and coke: subbituminous'
    },
    'lignite': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Coal and coke: lignite'
    },
    'coal_coke': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Coal and coke: coal coke'
    },
    'mixed_commercial_sector': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Coal and coke: mixed (commercial sector)'
    },
    'mixed_industrial_coking': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Coal and coke: mixed (industrial coking)'
    },
    'mixed_industrial_sector': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Coal and coke: mixed (industrial sector)'
    },
    'mixed_electric_power_sector': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Coal and coke: mixed (electric power sector)'
    },
    'natural_gas': {
        'fuel_phase': 'gas',
        'fuel_unit': 'scf',
        'display_unit': 'SCF',
        'label': 'Natural gas (pipeline quality)'
    },
    'distillate_fuel_oil_number_1': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: distillate fuel oil No. 1'
    },
    'distillate_fuel_oil_number_2': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: distillate fuel oil No. 2'
    },
    'distillate_fuel_oil_number_4': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: distillate fuel oil No. 4'
    },
    'residual_fuel_oil_number_5': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: residual fuel oil No. 5'
    },
    'residual_fuel_oil_number_6': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: residual fuel oil No. 6'
    },
    'used_oil': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: used oil'
    },
    'kerosene': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: kerosene'
    },
    'liquefied_petroleum_gases_lpg': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: liquefied petroleum gases (LPG)'
    },
    'propane': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: propane'
    },
    'propylene': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: propylene'
    },
    'ethane': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: ethane'
    },
    'ethanol': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Biomass fuels - liquid: ethanol'
    },
    'ethylene': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: ethylene'
    },
    'isobutane': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: isobutane'
    },
    'isobutylene': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: isobutylene'
    },
    'butane': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: butane'
    },
    'butylene': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: butylene'
    },
    'naphtha': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: naphtha (<401 deg f)'
    },
    'natural_gasoline': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: natural gasoline'
    },
    'other_oil': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: other oil (>401 deg f)'
    },
    'pentanes_plus': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: pentanes plus'
    },
    'petrochemical_feedstocks': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: petrochemical feedstocks'
    },
    'petroleum_coke': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Other fuels - solid: petroleum coke'
    },
    'special_naphtha': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: special naphtha'
    },
    'unfinished_oils': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: unfinished oils'
    },
    'heavy_gas_oils': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: heavy gas oils'
    },
    'lubricants': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: lubricants'
    },
    'motor_gasoline': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: motor gasoline'
    },
    'aviation_gasoline': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: aviation gasoline'
    },
    'kerosene_type_jet_fuel': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: kerosene-type jet fuel'
    },
    'asphalt_and_road_oil': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: asphalt and road oil'
    },
    'crude_oil': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Petroleum products: crude oil'
    },
    'municipal_solid_waste': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Other fuels - solid: municipal solid waste'
    },
    'tires': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Other fuels - solid: tires'
    },
    'plastics': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Other fuels - solid: plastics'
    },
    'blast_furnace_gas': {
        'fuel_phase': 'gas',
        'fuel_unit': 'scf',
        'display_unit': 'SCF',
        'label': 'Other fuels - gaseous: blast furnace gas'
    },
    'coke_oven_gas': {
        'fuel_phase': 'gas',
        'fuel_unit': 'scf',
        'display_unit': 'SCF',
        'label': 'Other fuels - gaseous: coke oven gas'
    },
    'propane_gas': {
        'fuel_phase': 'gas',
        'fuel_unit': 'scf',
        'display_unit': 'SCF',
        'label': 'Other fuels - gaseous: propane gas'
    },
    'fuel_gas': {
        'fuel_phase': 'gas',
        'fuel_unit': 'scf',
        'display_unit': 'SCF',
        'label': 'Other fuels - gaseous: fuel gas'
    },
    'wood_and_wood_residuals': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Biomass fuels - solid: wood and wood residuals'
    },
    'agricultural_byproducts': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Biomass fuels - solid: agricultural byproducts'
    },
    'peat': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Biomass fuels - solid: peat'
    },
    'solid_byproducts': {
        'fuel_phase': 'solid',
        'fuel_unit': 'short_ton',
        'display_unit': 'TN',
        'label': 'Biomass fuels - solid: solid byproducts'
    },
    'landfill_gas': {
        'fuel_phase': 'gas',
        'fuel_unit': 'scf',
        'display_unit': 'SCF',
        'label': 'Biomass fuels - gaseous: landfill gas'
    },
    'other_biomass_gases': {
        'fuel_phase': 'gas',
        'fuel_unit': 'scf',
        'display_unit': 'SCF',
        'label': 'Biomass fuels - gaseous: other biomass gases'
    },
    'biodiesel': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Biomass fuels - liquid: biodiesel(100%)'
    },
    'rendered_animal_fat': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Biomass fuels - liquid: rendered animal fat'
    },
    'vegetable_oil': {
        'fuel_phase': 'liquid',
        'fuel_unit': 'gallon',
        'display_unit': 'GAL',
        'label': 'Biomass fuels - liquid: vegetable oil'
    }
}

detailed_electricity_types = {
    'electricity_us_average': {
        'fuel_phase': 'electricity',
        'fuel_unit': 'megawatt',
        'display_unit': 'MWH',
        'label': 'Electricity: U.S. Average',
    },
    'electricity_ercot': {
        'fuel_phase': 'electricity',
        'fuel_unit': 'megawatt',
        'display_unit': 'MWH',
        'label': 'Electricity: ERCOT',
    }
}

report_units = {**ghg_unit, **phase_unit, **detailed_fuel_types, **detailed_electricity_types}
fuel_types = {**detailed_fuel_types, **detailed_electricity_types}
fuel_types_rev = {fuel_dict['label']: fuel_key for fuel_key, fuel_dict in fuel_types.items()}
