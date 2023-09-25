import datetime
import numpy as np

pricing_model_generator = {
    "unecon": {
        "oil": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "price": 0,
                "entire_well_life": "Flat"
            }],
        },
        "gas": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "dollar_per_mmbtu": 0,
                "entire_well_life": "Flat"
            }],
        },
        "ngl": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "pct_of_oil_price": 100,
                "entire_well_life": "Flat"
            }],
        },
        "drip_condensate": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "dollar_per_bbl": 0,
                "entire_well_life": "Flat"
            }],
        },
    },
    "empty_rows": {
        "oil": {
            "cap": "",
            "escalation_model": "none",
            "rows": [],
        },
        "gas": {
            "cap": "",
            "escalation_model": "none",
            "rows": [],
        },
        "ngl": {
            "cap": "",
            "escalation_model": "none",
            "rows": [],
        },
        "drip_condensate": {
            "cap": "",
            "escalation_model": "none",
            "rows": [],
        },
    },
    "flat": {
        "oil": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "price": 50,
                "entire_well_life": "Flat"
            }],
        },
        "gas": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "dollar_per_mmbtu": 1,
                "entire_well_life": "Flat"
            }],
        },
        "ngl": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "pct_of_oil_price": 100,
                "entire_well_life": "Flat"
            }],
        },
        "drip_condensate": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "dollar_per_bbl": 50,
                "entire_well_life": "Flat"
            }],
        },
    },
    "timeseries": {
        "oil": {
            "cap":
            "",
            "escalation_model":
            "none",
            "rows": [
                {
                    "price": 50,
                    "offset_to_as_of_date": {
                        "start": 1,
                        "end": 1,
                        "period": 1
                    },
                },
                {
                    "price": 55,
                    "offset_to_as_of_date": {
                        "start": 2,
                        "end": 2,
                        "period": 1
                    },
                },
                {
                    "price": 60,
                    "offset_to_as_of_date": {
                        "start": 3,
                        "end": 3,
                        "period": 1
                    },
                },
            ],
        },
        "gas": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "dollar_per_mmbtu": 1,
                "entire_well_life": "Flat"
            }],
        },
        "ngl": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "pct_of_oil_price": 100,
                "entire_well_life": "Flat"
            }],
        },
        "drip_condensate": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "dollar_per_bbl": 50,
                "entire_well_life": "Flat"
            }],
        },
    },
    "undefault_units": {
        "oil": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "price": 50,
                "entire_well_life": "Flat"
            }],
        },
        "gas": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "dollar_per_mcf": 5,
                "entire_well_life": "Flat"
            }],
        },
        "ngl": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "dollar_per_gal": 5,
                "entire_well_life": "Flat"
            }],
        },
        "drip_condensate": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "pct_of_oil_price": 100,
                "entire_well_life": "Flat"
            }],
        },
    },
    "escalation": {
        "oil": {
            "cap":
            "",
            "escalation_model": {
                "escalation_model": {
                    "escalation_frequency": "monthly",
                    "calculation_method": "simple",
                    "rows": [{
                        "dollar_per_year": 20,
                        "entire_well_life": "Flat"
                    }],
                }
            },
            "rows": [{
                "price": 50,
                "entire_well_life": "Flat",
                "dates": {
                    "start_date": datetime.date(1997, 1, 1),
                    "end_date": datetime.date(1997, 10, 31),
                },
            }],
        },
        "gas": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "dollar_per_mmbtu": 0,
                "entire_well_life": "Flat"
            }],
        },
        "ngl": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "pct_of_oil_price": 100,
                "entire_well_life": "Flat"
            }],
        },
        "drip_condensate": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "dollar_per_bbl": 0,
                "entire_well_life": "Flat"
            }],
        },
    },
    "cap": {
        "oil": {
            "cap":
            55,
            "escalation_model":
            "none",
            "rows": [
                {
                    "price": 50,
                    "offset_to_as_of_date": {
                        "start": 1,
                        "end": 1,
                        "period": 1
                    },
                },
                {
                    "price": 52,
                    "offset_to_as_of_date": {
                        "start": 2,
                        "end": 2,
                        "period": 1
                    },
                },
                {
                    "price": 54,
                    "offset_to_as_of_date": {
                        "start": 3,
                        "end": 3,
                        "period": 1
                    },
                },
                {
                    "price": 56,
                    "offset_to_as_of_date": {
                        "start": 4,
                        "end": 4,
                        "period": 1
                    },
                },
                {
                    "price": 58,
                    "offset_to_as_of_date": {
                        "start": 5,
                        "end": 5,
                        "period": 1
                    },
                },
                {
                    "price": 60,
                    "offset_to_as_of_date": {
                        "start": 6,
                        "end": 6,
                        "period": 1
                    },
                },
            ],
        },
        "gas": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "dollar_per_mmbtu": 0,
                "entire_well_life": "Flat"
            }],
        },
        "ngl": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "pct_of_oil_price": 100,
                "entire_well_life": "Flat"
            }],
        },
        "drip_condensate": {
            "cap": "",
            "escalation_model": "none",
            "rows": [{
                "dollar_per_bbl": 0,
                "entire_well_life": "Flat"
            }],
        },
    },
}

differential_model_generator = {
    "unecon": {
        "differentials_1": {
            "oil": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_mmbtu": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
        },
        "differentials_2": {
            "oil": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_mmbtu": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
        },
        "differentials_3": {
            "oil": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_mmbtu": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
        },
    },
    "empty_rows": {
        "differentials_1": {
            "oil": {
                "escalation_model": "none",
                "rows": [],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [],
            },
        },
        "differentials_2": {
            "oil": {
                "escalation_model": "none",
                "rows": [],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [],
            },
        },
        "differentials_3": {
            "oil": {
                "escalation_model": "none",
                "rows": [],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [],
            },
        },
    },
    "flat": {
        "differentials_1": {
            "oil": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 1,
                    "entire_well_life": "Flat"
                }],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_mmbtu": 1,
                    "entire_well_life": "Flat"
                }],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 1,
                    "entire_well_life": "Flat"
                }],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 1,
                    "entire_well_life": "Flat"
                }],
            },
        },
        "differentials_2": {
            "oil": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 1,
                    "entire_well_life": "Flat"
                }],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_mcf": 1,
                    "entire_well_life": "Flat"
                }],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_gal": 1,
                    "entire_well_life": "Flat"
                }],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 1,
                    "entire_well_life": "Flat"
                }],
            },
        },
        "differentials_3": {
            "oil": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_mmbtu": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
        },
    },
    "timeseries": {
        "differentials_1": {
            "oil": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_mmbtu": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
        },
        "differentials_2": {
            "oil": {
                "escalation_model":
                "none",
                "rows": [
                    {
                        "dollar_per_bbl": 0,
                        "offset_to_as_of_date": {
                            "start": 1,
                            "end": 8,
                            "period": 8
                        },
                    },
                    {
                        "dollar_per_bbl": 1,
                        "offset_to_as_of_date": {
                            "start": 8,
                            "end": 20,
                            "period": 13
                        },
                    },
                ],
            },
            "gas": {
                "escalation_model":
                "none",
                "rows": [
                    {
                        "dollar_per_mmbtu": 0,
                        "offset_to_as_of_date": {
                            "start": 1,
                            "end": 8,
                            "period": 8
                        },
                    },
                    {
                        "dollar_per_mmbtu": 1,
                        "offset_to_as_of_date": {
                            "start": 8,
                            "end": 20,
                            "period": 13
                        },
                    },
                ],
            },
            "ngl": {
                "escalation_model":
                "none",
                "rows": [
                    {
                        "dollar_per_bbl": 0,
                        "offset_to_as_of_date": {
                            "start": 1,
                            "end": 8,
                            "period": 8
                        },
                    },
                    {
                        "dollar_per_bbl": 1,
                        "offset_to_as_of_date": {
                            "start": 8,
                            "end": 20,
                            "period": 13
                        },
                    },
                ],
            },
            "drip_condensate": {
                "escalation_model":
                "none",
                "rows": [
                    {
                        "dollar_per_bbl": 0,
                        "offset_to_as_of_date": {
                            "start": 1,
                            "end": 8,
                            "period": 8
                        },
                    },
                    {
                        "dollar_per_bbl": 1,
                        "offset_to_as_of_date": {
                            "start": 8,
                            "end": 20,
                            "period": 13
                        },
                    },
                ],
            },
        },
        "differentials_3": {
            "oil": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_mmbtu": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
        },
    },
    "base_price_remaining": {
        "differentials_1": {
            "oil": {
                "escalation_model": "none",
                "rows": [{
                    "pct_of_base_price": 100,
                    "entire_well_life": "Flat"
                }],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [{
                    "pct_of_base_price": 100,
                    "entire_well_life": "Flat"
                }],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [{
                    "pct_of_base_price": 100,
                    "entire_well_life": "Flat"
                }],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [{
                    "pct_of_base_price": 100,
                    "entire_well_life": "Flat"
                }],
            },
        },
        "differentials_2": {
            "oil": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_mmbtu": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
        },
        "differentials_3": {
            "oil": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "gas": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_mmbtu": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "ngl": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
            "drip_condensate": {
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }],
            },
        },
    },
}

date_dict_generator = {
    "unecon": {
        "cf_start_date": datetime.date(1995, 11, 1),
        "cf_end_date": datetime.date(1995, 11, 1),
        "cut_off_date": datetime.date(1995, 11, 1),
        "as_of_date": datetime.date(1995, 11, 1),
        "volume_start_date": datetime.date(1995, 11, 1),
        "first_production_date": datetime.date(1995, 11, 1),
        "first_segment_date": datetime.date(1995, 11, 1),
        "end_history_date": datetime.date(2015, 9, 1),
        "discount_date": datetime.date(1995, 11, 1),
        "original_discount_date": datetime.date(1995, 11, 1),
        "side_phase_end_date": None,
        "start_using_forecast": {
            "oil": None,
            "gas": None,
            "water": None
        },
        "rev_dates": [],
    },
    "econ": {
        "cf_start_date": datetime.date(1997, 1, 1),
        "cf_end_date": datetime.date(1997, 10, 31),
        "cut_off_date": datetime.date(1997, 10, 31),
        "as_of_date": datetime.date(1997, 1, 1),
        "volume_start_date": datetime.date(1995, 11, 1),
        "first_production_date": datetime.date(1995, 11, 1),
        "first_segment_date": datetime.date(1995, 11, 1),
        "end_history_date": datetime.date(2015, 9, 1),
        "discount_date": datetime.date(1995, 11, 1),
        "original_discount_date": datetime.date(1995, 11, 1),
        "side_phase_end_date": None,
        "start_using_forecast": {
            "oil": None,
            "gas": None,
            "water": None
        },
    },
}

compositional_economics_model_generator = {
    "flat_only_gas": {
        "gas": [{
            "key": "Gas",
            "category": "N2",
            "criteria": "Flat",
            "period": ["Flat"],
            "value": [2],
            "unit": "$/MMBTU",
            "escalation_model": {
                "label": "None",
                "value": "none"
            },
            "cap": ""
        }, {
            "key": "Gas",
            "category": "CO2",
            "criteria": "Flat",
            "period": ["Flat"],
            "value": [3],
            "unit": "$/MCF",
            "escalation_model": {
                "label": "None",
                "value": "none"
            },
            "cap": ""
        }]
    },
    "flat_gas_ngl": {
        "gas": [
            {
                "key": "Gas",
                "category": "N2",
                "criteria": "Flat",
                "period": ["Flat"],
                "value": [2],
                "unit": "$/MMBTU",
                "escalation_model": {
                    "label": "None",
                    "value": "none"
                },
                "cap": ""
            },
        ],
        "ngl": [
            {
                "key": "NGL",
                "category": "CO2",
                "criteria": "Flat",
                "period": ["Flat"],
                "value": [3],
                "unit": "$/MCF",
                "escalation_model": {
                    "label": "None",
                    "value": "none"
                },
                "cap": ""
            },
        ]
    },
    "as_of_only_gas": {
        "gas": [{
            "key": "Gas",
            "category": "N2",
            "criteria": "As Of",
            "period": [1, 2],
            "value": [0, 2],
            "unit": "$/MMBTU",
            "escalation_model": {
                "label": "None",
                "value": "none"
            },
            "cap": ""
        }, {
            "key": "Gas",
            "category": "CO2",
            "criteria": "Flat",
            "period": ["Flat"],
            "value": [3],
            "unit": "$/MCF",
            "escalation_model": {
                "label": "None",
                "value": "none"
            },
            "cap": ""
        }]
    },
    "as_of_only_ngl": {
        "ngl": [{
            "key": "NGL",
            "category": "N2",
            "criteria": "As Of",
            "period": [1, 3],
            "value": [100, 200],
            "unit": "% of Oil Price",
            "escalation_model": {
                "label": "None",
                "value": "none"
            },
            "cap": ""
        }, {
            "key": "NGL",
            "category": "CO2",
            "criteria": "Flat",
            "period": ["Flat"],
            "value": [100],
            "unit": "% of Oil Price",
            "escalation_model": {
                "label": "None",
                "value": "none"
            },
            "cap": ""
        }]
    },
    "dates_only_gas": {
        "gas": [{
            "key": "Gas",
            "category": "He",
            "criteria": "Dates",
            "period": ["2023-03-03", "2023-07-07"],
            "value": [2, 3],
            "unit": "$/MMBTU",
            "escalation_model": {
                "label": "None",
                "value": "none"
            },
            "cap": ""
        }]
    }
}


def price_models(unecon_bool="econ", pricing_model="flat", differential_model="flat", compositionals_model="none"):
    return (
        date_dict_generator[unecon_bool],
        pricing_model_generator[pricing_model],
        differential_model_generator[differential_model],
        compositional_economics_model_generator.get(compositionals_model),
    )


def price_results(unecon_bool="econ", pricing_model="flat", differential_model="flat"):
    if unecon_bool == "unecon":
        return {
            "price": {
                "price_dict": {
                    "oil": np.array([0.0]),
                    "gas": np.array([0.0]),
                    "ngl": np.array([1.0]),
                    "drip_condensate": np.array([0.0]),
                },
                "price_parameter": {
                    "oil": "number",
                    "gas": "mmbtu",
                    "ngl": "ratio_of_oil",
                    "drip_condensate": "number",
                },
                "price_cap": {
                    "oil": "",
                    "gas": "",
                    "ngl": "",
                    "drip_condensate": ""
                },
                "price_escalation": {
                    "oil": None,
                    "gas": None,
                    "ngl": None,
                    "drip_condensate": None,
                },
            },
            "differential": {
                "diff_dict": {
                    "differentials_1": {
                        "oil": np.array([0.0]),
                        "gas": np.array([0.0]),
                        "ngl": np.array([0.0]),
                        "drip_condensate": np.array([0.0]),
                    },
                    "differentials_2": {
                        "oil": np.array([0.0]),
                        "gas": np.array([0.0]),
                        "ngl": np.array([0.0]),
                        "drip_condensate": np.array([0.0]),
                    },
                    "differentials_3": {
                        "oil": np.array([0.0]),
                        "gas": np.array([0.0]),
                        "ngl": np.array([0.0]),
                        "drip_condensate": np.array([0.0]),
                    },
                },
                "diff_parameter": {
                    "differentials_1": {
                        "oil": "number",
                        "gas": "mmbtu",
                        "ngl": "number",
                        "drip_condensate": "number",
                    },
                    "differentials_2": {
                        "oil": "number",
                        "gas": "mmbtu",
                        "ngl": "number",
                        "drip_condensate": "number",
                    },
                    "differentials_3": {
                        "oil": "number",
                        "gas": "mmbtu",
                        "ngl": "number",
                        "drip_condensate": "number",
                    },
                },
                "diff_escalation": {
                    "differentials_1": {
                        "oil": None,
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                    "differentials_2": {
                        "oil": None,
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                    "differentials_3": {
                        "oil": None,
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                },
            },
        }
    if pricing_model == "empty_rows":
        return {
            "price": {
                "price_dict": {},
                "price_parameter": {},
                "price_cap": {},
                "price_escalation": {},
            },
            "differential": {
                "diff_dict": {
                    "differentials_1": {
                        "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    },
                    "differentials_2": {
                        "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    },
                    "differentials_3": {
                        "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    },
                },
                "diff_parameter": {
                    "differentials_1": {
                        "oil": "number",
                        "gas": "mmbtu",
                        "ngl": "number",
                        "drip_condensate": "number",
                    },
                    "differentials_2": {
                        "oil": "number",
                        "gas": "number",
                        "ngl": "gal",
                        "drip_condensate": "number",
                    },
                    "differentials_3": {
                        "oil": "number",
                        "gas": "mmbtu",
                        "ngl": "number",
                        "drip_condensate": "number",
                    },
                },
                "diff_escalation": {
                    "differentials_1": {
                        "oil": None,
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                    "differentials_2": {
                        "oil": None,
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                    "differentials_3": {
                        "oil": None,
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                },
            },
        }
    if differential_model == "empty_rows":
        return {
            "price": {
                "price_dict": {
                    "oil": np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0]),
                    "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "drip_condensate": np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0]),
                },
                "price_parameter": {
                    "oil": "number",
                    "gas": "mmbtu",
                    "ngl": "ratio_of_oil",
                    "drip_condensate": "number",
                },
                "price_cap": {
                    "oil": "",
                    "gas": "",
                    "ngl": "",
                    "drip_condensate": ""
                },
                "price_escalation": {
                    "oil": None,
                    "gas": None,
                    "ngl": None,
                    "drip_condensate": None,
                },
            },
            "differential": {
                "diff_dict": {
                    "differentials_1": {},
                    "differentials_2": {},
                    "differentials_3": {},
                },
                "diff_parameter": {
                    "differentials_1": {},
                    "differentials_2": {},
                    "differentials_3": {},
                },
                "diff_escalation": {
                    "differentials_1": {},
                    "differentials_2": {},
                    "differentials_3": {},
                },
            },
        }
    elif pricing_model == "flat":
        if differential_model == "flat":
            return {
                "price": {
                    "price_dict": {
                        "oil": np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0]),
                        "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "drip_condensate": np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0]),
                    },
                    "price_parameter": {
                        "oil": "number",
                        "gas": "mmbtu",
                        "ngl": "ratio_of_oil",
                        "drip_condensate": "number",
                    },
                    "price_cap": {
                        "oil": "",
                        "gas": "",
                        "ngl": "",
                        "drip_condensate": "",
                    },
                    "price_escalation": {
                        "oil": None,
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                },
                "differential": {
                    "diff_dict": {
                        "differentials_1": {
                            "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        },
                        "differentials_2": {
                            "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        },
                        "differentials_3": {
                            "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        },
                    },
                    "diff_parameter": {
                        "differentials_1": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                        "differentials_2": {
                            "oil": "number",
                            "gas": "number",
                            "ngl": "gal",
                            "drip_condensate": "number",
                        },
                        "differentials_3": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                    },
                    "diff_escalation": {
                        "differentials_1": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_2": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_3": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                    },
                },
            }
        elif differential_model == "timeseries":
            return {
                "price": {
                    "price_dict": {
                        "oil": np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0]),
                        "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "drip_condensate": np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0]),
                    },
                    "price_parameter": {
                        "oil": "number",
                        "gas": "mmbtu",
                        "ngl": "ratio_of_oil",
                        "drip_condensate": "number",
                    },
                    "price_cap": {
                        "oil": "",
                        "gas": "",
                        "ngl": "",
                        "drip_condensate": "",
                    },
                    "price_escalation": {
                        "oil": None,
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                },
                "differential": {
                    "diff_dict": {
                        "differentials_1": {
                            "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        },
                        "differentials_2": {
                            "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0]),
                            "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0]),
                            "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0]),
                            "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0]),
                        },
                        "differentials_3": {
                            "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        },
                    },
                    "diff_parameter": {
                        "differentials_1": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                        "differentials_2": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                        "differentials_3": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                    },
                    "diff_escalation": {
                        "differentials_1": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_2": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_3": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                    },
                },
            }
        elif differential_model == "base_price_remaining":
            return {
                "price": {
                    "price_dict": {
                        "oil": np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0]),
                        "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "drip_condensate": np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0]),
                    },
                    "price_parameter": {
                        "oil": "number",
                        "gas": "mmbtu",
                        "ngl": "ratio_of_oil",
                        "drip_condensate": "number",
                    },
                    "price_cap": {
                        "oil": "",
                        "gas": "",
                        "ngl": "",
                        "drip_condensate": "",
                    },
                    "price_escalation": {
                        "oil": None,
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                },
                "differential": {
                    "diff_dict": {
                        "differentials_1": {
                            "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        },
                        "differentials_2": {
                            "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        },
                        "differentials_3": {
                            "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        },
                    },
                    "diff_parameter": {
                        "differentials_1": {
                            "oil": "ratio",
                            "gas": "ratio",
                            "ngl": "ratio",
                            "drip_condensate": "ratio",
                        },
                        "differentials_2": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                        "differentials_3": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                    },
                    "diff_escalation": {
                        "differentials_1": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_2": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_3": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                    },
                },
            }
    elif differential_model == "flat":
        if pricing_model == "timeseries":
            return {
                "price": {
                    "price_dict": {
                        "oil": np.array([50.0, 55.0, 60.0, 60.0, 60.0, 60.0, 60.0, 60.0, 60.0, 60.0]),
                        "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "drip_condensate": np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0]),
                    },
                    "price_parameter": {
                        "oil": "number",
                        "gas": "mmbtu",
                        "ngl": "ratio_of_oil",
                        "drip_condensate": "number",
                    },
                    "price_cap": {
                        "oil": "",
                        "gas": "",
                        "ngl": "",
                        "drip_condensate": "",
                    },
                    "price_escalation": {
                        "oil": None,
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                },
                "differential": {
                    "diff_dict": {
                        "differentials_1": {
                            "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        },
                        "differentials_2": {
                            "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        },
                        "differentials_3": {
                            "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        },
                    },
                    "diff_parameter": {
                        "differentials_1": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                        "differentials_2": {
                            "oil": "number",
                            "gas": "number",
                            "ngl": "gal",
                            "drip_condensate": "number",
                        },
                        "differentials_3": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                    },
                    "diff_escalation": {
                        "differentials_1": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_2": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_3": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                    },
                },
            }
        elif pricing_model == "undefault_units":
            return {
                "price": {
                    "price_dict": {
                        "oil": np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0]),
                        "gas": np.array([5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0]),
                        "ngl": np.array([5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0]),
                        "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    },
                    "price_parameter": {
                        "oil": "number",
                        "gas": "number",
                        "ngl": "gal",
                        "drip_condensate": "ratio_of_oil",
                    },
                    "price_cap": {
                        "oil": "",
                        "gas": "",
                        "ngl": "",
                        "drip_condensate": "",
                    },
                    "price_escalation": {
                        "oil": None,
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                },
                "differential": {
                    "diff_dict": {
                        "differentials_1": {
                            "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        },
                        "differentials_2": {
                            "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        },
                        "differentials_3": {
                            "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        },
                    },
                    "diff_parameter": {
                        "differentials_1": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                        "differentials_2": {
                            "oil": "number",
                            "gas": "number",
                            "ngl": "gal",
                            "drip_condensate": "number",
                        },
                        "differentials_3": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                    },
                    "diff_escalation": {
                        "differentials_1": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_2": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_3": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                    },
                },
            }
        elif pricing_model == "escalation":
            return {
                "price": {
                    "price_dict": {
                        "oil": np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0]),
                        "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    },
                    "price_parameter": {
                        "oil": "number",
                        "gas": "mmbtu",
                        "ngl": "ratio_of_oil",
                        "drip_condensate": "number",
                    },
                    "price_cap": {
                        "oil": "",
                        "gas": "",
                        "ngl": "",
                        "drip_condensate": "",
                    },
                    "price_escalation": {
                        "oil": {
                            "escalation_type":
                            "add",
                            "escalation_values":
                            np.array([
                                0.0,
                                1.66666667,
                                3.33333333,
                                5.0,
                                6.66666667,
                                8.33333333,
                                10.0,
                                11.66666667,
                                13.33333333,
                                15.0,
                            ]),
                        },
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                },
                "differential": {
                    "diff_dict": {
                        "differentials_1": {
                            "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        },
                        "differentials_2": {
                            "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        },
                        "differentials_3": {
                            "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        },
                    },
                    "diff_parameter": {
                        "differentials_1": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                        "differentials_2": {
                            "oil": "number",
                            "gas": "number",
                            "ngl": "gal",
                            "drip_condensate": "number",
                        },
                        "differentials_3": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                    },
                    "diff_escalation": {
                        "differentials_1": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_2": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_3": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                    },
                },
            }
        elif pricing_model == "cap":
            return {
                "price": {
                    "price_dict": {
                        "oil": np.array([50.0, 52.0, 54.0, 56.0, 58.0, 60.0, 60.0, 60.0, 60.0, 60.0]),
                        "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    },
                    "price_parameter": {
                        "oil": "number",
                        "gas": "mmbtu",
                        "ngl": "ratio_of_oil",
                        "drip_condensate": "number",
                    },
                    "price_cap": {
                        "oil": 55,
                        "gas": "",
                        "ngl": "",
                        "drip_condensate": "",
                    },
                    "price_escalation": {
                        "oil": None,
                        "gas": None,
                        "ngl": None,
                        "drip_condensate": None,
                    },
                },
                "differential": {
                    "diff_dict": {
                        "differentials_1": {
                            "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        },
                        "differentials_2": {
                            "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                            "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                        },
                        "differentials_3": {
                            "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                            "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        },
                    },
                    "diff_parameter": {
                        "differentials_1": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                        "differentials_2": {
                            "oil": "number",
                            "gas": "number",
                            "ngl": "gal",
                            "drip_condensate": "number",
                        },
                        "differentials_3": {
                            "oil": "number",
                            "gas": "mmbtu",
                            "ngl": "number",
                            "drip_condensate": "number",
                        },
                    },
                    "diff_escalation": {
                        "differentials_1": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_2": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                        "differentials_3": {
                            "oil": None,
                            "gas": None,
                            "ngl": None,
                            "drip_condensate": None,
                        },
                    },
                },
            }


def create_compositional_array(value: float, duration: int):
    return np.full(shape=duration, fill_value=value)


def create_compositionals_dict(compositionals: list[str], price_values: list[float], durations: list[int]):
    return {
        compositional: create_compositional_array(value, duration)
        for compositional, value, duration in zip(compositionals, price_values, durations)
    }


def compositional_results(compositional_model_name='flat_only_gas'):
    if compositional_model_name == 'flat_only_gas':
        return {"gas": create_compositionals_dict(['N2', 'CO2'], [2, 3], [10, 10])}
    elif compositional_model_name == 'flat_gas_ngl':
        return {
            "gas": create_compositionals_dict(['N2'], [2], [10]),
            "ngl": create_compositionals_dict(['CO2'], [3], [10])
        }
    elif compositional_model_name == "as_of_only_gas":
        return {
            "gas": create_compositionals_dict(['N2', 'CO2'], [2, 3], [10, 10]),
        }
    elif compositional_model_name == "as_of_only_ngl":
        return {"ngl": create_compositionals_dict(['N2', 'CO2'], [200, 100], [10, 10])}
    elif compositional_model_name == "dates_only_gas":
        return {
            "gas": create_compositionals_dict(['He'], [3], [10]),
        }
