from datetime import datetime
from bson.objectid import ObjectId

ASSUMPTIONS_FIXTURE = [{
    "_id": ObjectId("63766e02023757c1078bff2a"),
    "name": "11/26/20_14:18:49_166",
    "unique": True,
    "assumptionKey": "ownership_reversion",
    "assumptionName": "Ownership and Reversion",
    "well": ObjectId("63766e07023757c1078ce5d7"),
    "scenario": ObjectId("643dbfbfccae6148ebc0ea37"),
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "createdBy": ObjectId("611beca03556540015af8562"),
    "lastUpdatedBy": ObjectId("5faaec86d9bb860012ddb7b8"),
    "econ_function": {
        "ownership": {
            "initial_ownership": {
                "working_interest": 100,
                "original_ownership": {
                    "net_revenue_interest": 82.338,
                    "lease_net_revenue_interest": 100
                },
                "oil_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest_type": "expense",
                "net_profit_interest": 0
            },
            "first_reversion": {
                "no_reversion": "",
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "oil_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": ""
            },
            "second_reversion": {
                "no_reversion": "",
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "oil_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": ""
            },
            "third_reversion": {
                "no_reversion": "",
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "oil_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": ""
            },
            "fourth_reversion": {
                "no_reversion": "",
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "oil_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": ""
            },
            "fifth_reversion": {
                "no_reversion": "",
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "oil_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": ""
            }
        }
    },
    "options": {
        "ownership": {
            "segment": {
                "label": "Initial Ownership",
                "value": "initial_ownership"
            },
            "initial_ownership": {
                "subItems": {
                    "working_interest": 100,
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": 82.338,
                            "lease_net_revenue_interest": 100
                        }
                    },
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "empty_header": "",
                    "net_profit_interest_type": {
                        "label": "Expense",
                        "value": "expense"
                    },
                    "net_profit_interest": 0
                }
            },
            "first_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "empty_header": "",
                    "net_profit_interest": ""
                }
            },
            "second_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "empty_header": "",
                    "net_profit_interest": ""
                }
            },
            "third_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "empty_header": "",
                    "net_profit_interest": ""
                }
            },
            "fourth_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "empty_header": "",
                    "net_profit_interest": ""
                }
            },
            "fifth_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "empty_header": "",
                    "net_profit_interest": ""
                }
            }
        }
    },
    "createdAt": datetime.fromisoformat("2022-11-17T17:24:17.668"),
    "updatedAt": datetime.fromisoformat("2022-11-17T17:24:17.668")
}, {
    "_id": ObjectId("643d7451ce99c485813e3f38"),
    "copiedFrom": None,
    "unique": False,
    "tags": [],
    "embeddedLookupTables": [],
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "assumptionKey": "ownership_reversion",
    "assumptionName": "Ownership and Reversion",
    "options": {
        "ownership": {
            "segment": {
                "label": "Initial",
                "value": "initial_ownership"
            },
            "initial_ownership": {
                "subItems": {
                    "working_interest": 44,
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": 4,
                            "lease_net_revenue_interest": 4
                        }
                    },
                    "net_profit_interest_type": {
                        "label": "Expense",
                        "value": "expense"
                    },
                    "net_profit_interest": 0,
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    }
                }
            },
            "first_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "empty_header": "",
                    "reversion_tied_to": {
                        "criteria": {
                            "label": "As Of",
                            "value": "as_of",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "As Of"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "net_profit_interest": 0,
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    }
                }
            },
            "second_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "empty_header": "",
                    "reversion_tied_to": {
                        "criteria": {
                            "label": "As Of",
                            "value": "as_of",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "As Of"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "net_profit_interest": 0,
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    }
                }
            },
            "third_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "empty_header": "",
                    "reversion_tied_to": {
                        "criteria": {
                            "label": "As Of",
                            "value": "as_of",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "As Of"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "net_profit_interest": 0,
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    }
                }
            },
            "fourth_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "empty_header": "",
                    "reversion_tied_to": {
                        "criteria": {
                            "label": "As Of",
                            "value": "as_of",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "As Of"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "net_profit_interest": 0,
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    }
                }
            },
            "fifth_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "empty_header": "",
                    "reversion_tied_to": {
                        "criteria": {
                            "label": "As Of",
                            "value": "as_of",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "As Of"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "net_profit_interest": 0,
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    }
                }
            },
            "sixth_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "empty_header": "",
                    "reversion_tied_to": {
                        "criteria": {
                            "label": "As Of",
                            "value": "as_of",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "As Of"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "net_profit_interest": 0,
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    }
                }
            },
            "seventh_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "empty_header": "",
                    "reversion_tied_to": {
                        "criteria": {
                            "label": "As Of",
                            "value": "as_of",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "As Of"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "net_profit_interest": 0,
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    }
                }
            },
            "eighth_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "empty_header": "",
                    "reversion_tied_to": {
                        "criteria": {
                            "label": "As Of",
                            "value": "as_of",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "As Of"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "net_profit_interest": 0,
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    }
                }
            },
            "ninth_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "empty_header": "",
                    "reversion_tied_to": {
                        "criteria": {
                            "label": "As Of",
                            "value": "as_of",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "As Of"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "net_profit_interest": 0,
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    }
                }
            },
            "tenth_reversion": {
                "subItems": {
                    "criteria": {
                        "criteria": {
                            "required": False,
                            "label": "No Reversion",
                            "value": "no_reversion",
                            "fieldType": "static",
                            "staticValue": ""
                        },
                        "value": ""
                    },
                    "empty_header": "",
                    "reversion_tied_to": {
                        "criteria": {
                            "label": "As Of",
                            "value": "as_of",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "As Of"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "balance": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "include_net_profit_interest": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "working_interest": "",
                    "original_ownership": {
                        "subItems": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        }
                    },
                    "net_profit_interest": 0,
                    "phase": {
                        "label": "Oil",
                        "value": "oil_ownership"
                    },
                    "oil_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "gas_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "ngl_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    },
                    "drip_condensate_ownership": {
                        "subItems": {
                            "net_revenue_interest": ""
                        }
                    }
                }
            }
        }
    },
    "econ_function": {
        "ownership": {
            "initial_ownership": {
                "working_interest": 44,
                "original_ownership": {
                    "net_revenue_interest": 4,
                    "lease_net_revenue_interest": 4
                },
                "net_profit_interest_type": "expense",
                "net_profit_interest": 0,
                "oil_ownership": {
                    "net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": ""
                }
            },
            "first_reversion": {
                "no_reversion": "",
                "reversion_tied_to": {
                    "as_of": ""
                },
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": 0,
                "oil_ownership": {
                    "net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": ""
                }
            },
            "second_reversion": {
                "no_reversion": "",
                "reversion_tied_to": {
                    "as_of": ""
                },
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": 0,
                "oil_ownership": {
                    "net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": ""
                }
            },
            "third_reversion": {
                "no_reversion": "",
                "reversion_tied_to": {
                    "as_of": ""
                },
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": 0,
                "oil_ownership": {
                    "net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": ""
                }
            },
            "fourth_reversion": {
                "no_reversion": "",
                "reversion_tied_to": {
                    "as_of": ""
                },
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": 0,
                "oil_ownership": {
                    "net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": ""
                }
            },
            "fifth_reversion": {
                "no_reversion": "",
                "reversion_tied_to": {
                    "as_of": ""
                },
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": 0,
                "oil_ownership": {
                    "net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": ""
                }
            },
            "sixth_reversion": {
                "no_reversion": "",
                "reversion_tied_to": {
                    "as_of": ""
                },
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": 0,
                "oil_ownership": {
                    "net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": ""
                }
            },
            "seventh_reversion": {
                "no_reversion": "",
                "reversion_tied_to": {
                    "as_of": ""
                },
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": 0,
                "oil_ownership": {
                    "net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": ""
                }
            },
            "eighth_reversion": {
                "no_reversion": "",
                "reversion_tied_to": {
                    "as_of": ""
                },
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": 0,
                "oil_ownership": {
                    "net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": ""
                }
            },
            "ninth_reversion": {
                "no_reversion": "",
                "reversion_tied_to": {
                    "as_of": ""
                },
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": 0,
                "oil_ownership": {
                    "net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": ""
                }
            },
            "tenth_reversion": {
                "no_reversion": "",
                "reversion_tied_to": {
                    "as_of": ""
                },
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": 0,
                "oil_ownership": {
                    "net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": ""
                }
            }
        }
    },
    "name": "foo",
    "createdBy": ObjectId("611beca03556540015af8562"),
    "lastUpdatedBy": ObjectId("636ea8e46e8de4001284cf99"),
    "createdAt": datetime.fromisoformat("2023-04-17T16:31:13.129"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:46:05.930"),
    "__v": 0
}, {
    "_id": ObjectId("6441c752fc13ce001268efee"),
    "copiedFrom": None,
    "unique": False,
    "tags": [],
    "embeddedLookupTables": [],
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "assumptionKey": "dates",
    "assumptionName": "Dates",
    "options": {
        "dates_setting": {
            "max_well_life": 50,
            "as_of_date": {
                "criteria": {
                    "label": "Date",
                    "value": "date",
                    "required": True,
                    "fieldName": "Date",
                    "fieldType": "date",
                    "valType": "datetime"
                },
                "value": "2023-05-01T00:00:00.000Z",
                "criteriaHeader": True
            },
            "discount_date": {
                "criteria": {
                    "label": "Date",
                    "value": "date",
                    "required": True,
                    "fieldName": "Date",
                    "fieldType": "date",
                    "valType": "datetime"
                },
                "value": "2023-05-01T00:00:00.000Z",
                "criteriaHeader": True
            },
            "cash_flow_prior_to_as_of_date": {
                "label": "No",
                "value": "no"
            },
            "production_data_resolution": {
                "label": "Same As Forecast",
                "value": "same_as_forecast"
            },
            "fpd_source_hierarchy": {
                "subItems": {
                    "first_fpd_source": {
                        "criteria": {
                            "label": "Well Header",
                            "value": "well_header",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "Well Header"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "second_fpd_source": {
                        "criteria": {
                            "label": "Prod Data",
                            "value": "production_data",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "Prod Data"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "third_fpd_source": {
                        "criteria": {
                            "label": "Forecast/Schedule",
                            "value": "forecast",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "Forecast/Schedule"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "fourth_fpd_source": {
                        "criteria": {
                            "label": "Not Used",
                            "value": "not_used",
                            "staticValue": "",
                            "fieldType": "static",
                            "fieldName": "Not Used"
                        },
                        "value": "",
                        "criteriaHeader": True
                    },
                    "use_forecast_schedule_when_no_prod": {
                        "label": "Yes",
                        "value": "yes"
                    }
                }
            }
        },
        "cut_off": {
            "cut_off": {
                "criteria": {
                    "label": "Max Cum Cash Flow",
                    "value": "max_cum_cash_flow",
                    "staticValue": "",
                    "fieldType": "static",
                    "fieldName": "Max Cum Cash Flow"
                },
                "value": ""
            },
            "min_cut_off": {
                "criteria": {
                    "label": "None",
                    "value": "none",
                    "staticValue": "",
                    "fieldType": "static"
                },
                "value": "",
                "criteriaHeader": True
            },
            "capex_offset_to_ecl": {
                "label": "No",
                "value": "no"
            },
            "include_capex": {
                "label": "No",
                "value": "no"
            },
            "discount": 0,
            "consecutive_negative": 0,
            "econ_limit_delay": 0,
            "side_phase_end": {
                "label": "No",
                "value": "no"
            }
        }
    },
    "econ_function": {
        "dates_setting": {
            "max_well_life": 50,
            "as_of_date": {
                "date": "2023-05-01"
            },
            "discount_date": {
                "date": "2023-05-01"
            },
            "cash_flow_prior_to_as_of_date": "no",
            "production_data_resolution": "same_as_forecast",
            "fpd_source_hierarchy": {
                "first_fpd_source": {
                    "well_header": ""
                },
                "second_fpd_source": {
                    "production_data": ""
                },
                "third_fpd_source": {
                    "forecast": ""
                },
                "fourth_fpd_source": {
                    "not_used": ""
                },
                "use_forecast_schedule_when_no_prod": "yes"
            }
        },
        "cut_off": {
            "max_cum_cash_flow": "",
            "min_cut_off": {
                "none": ""
            },
            "capex_offset_to_ecl": "no",
            "include_capex": "no",
            "discount": 0,
            "consecutive_negative": 0,
            "econ_limit_delay": 0,
            "side_phase_end": "no"
        }
    },
    "name": "bar",
    "createdBy": ObjectId("611beca03556540015af8562"),
    "lastUpdatedBy": ObjectId("636ea8e46e8de4001284cf99"),
    "createdAt": datetime.fromisoformat("2023-04-20T23:14:26.232"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:46:21.866"),
    "__v": 0
}, {
    "_id": ObjectId("6441c79ffc13ce001268f099"),
    "copiedFrom": None,
    "unique": False,
    "tags": [],
    "embeddedLookupTables": [ObjectId("6441c787fc13ce001268f080")],
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "assumptionKey": "capex",
    "assumptionName": "Capex",
    "options": {
        "other_capex": {
            "row_view": {
                "headers": {
                    "category": "Category",
                    "description": "Description",
                    "tangible": "Tangible",
                    "intangible": "Intangible",
                    "criteria": "Criteria",
                    "capex_expense": "CAPEX/Expense",
                    "after_econ_limit": "Appear After Econ Limit",
                    "calculation": "Calculation",
                    "escalation_model": "Escalation",
                    "escalation_start": "Escalation Start",
                    "depreciation_model": "DD&A",
                    "deal_terms": "Paying WI ÷ Earning WI",
                    "distribution_type": "Distribution Type",
                    "mean": "Mean ($M)",
                    "standard_deviation": "Standard Deviation ($M)",
                    "lower_bound": "Lower Bound ($M)",
                    "upper_bound": "Upper Bound ($M)",
                    "mode": "Mode ($M)",
                    "seed": "Seed"
                },
                "rows": [{
                    "category": {
                        "label": "Other Investment",
                        "value": "other_investment"
                    },
                    "description": "",
                    "tangible": 0,
                    "intangible": 0,
                    "criteria": {
                        "criteria": {
                            "required": True,
                            "label": "FPD",
                            "value": "offset_to_fpd",
                            "fieldType": "number",
                            "valType": "days",
                            "min": -20000,
                            "max": 20000,
                            "Default": -120
                        },
                        "value": -120
                    },
                    "capex_expense": {
                        "label": "CAPEX",
                        "value": "capex"
                    },
                    "after_econ_limit": {
                        "label": "No",
                        "value": "no"
                    },
                    "calculation": {
                        "label": "Gross",
                        "value": "gross"
                    },
                    "escalation_model": {
                        "label": "None",
                        "value": "none"
                    },
                    "escalation_start": {
                        "criteria": {
                            "label": "Apply To Criteria",
                            "value": "apply_to_criteria",
                            "fieldType": "number",
                            "valType": "days",
                            "min": -20000,
                            "max": 20000,
                            "Default": 0
                        },
                        "value": 0
                    },
                    "depreciation_model": {
                        "label": "None",
                        "value": "none"
                    },
                    "deal_terms": 1,
                    "distribution_type": {
                        "label": "N/A",
                        "value": "na"
                    },
                    "mean": 0,
                    "standard_deviation": 0,
                    "lower_bound": 0,
                    "upper_bound": 0,
                    "mode": 0,
                    "seed": 1
                }]
            }
        },
        "drilling_cost": {
            "dollar_per_ft_of_vertical": 0,
            "dollar_per_ft_of_horizontal": 0,
            "fixed_cost": 0,
            "tangible_pct": 0,
            "calculation": {
                "label": "Gross",
                "value": "gross"
            },
            "escalation_model": {
                "label": "None",
                "value": "none"
            },
            "depreciation_model": {
                "label": "None",
                "value": "none"
            },
            "deal_terms": 1,
            "empty_header": {
                "subItems": {
                    "row_view": {
                        "headers": {
                            "pct_of_total_cost": "% of Total Cost",
                            "criteria": {
                                "label": "FPD",
                                "value": "offset_to_fpd"
                            }
                        },
                        "rows": [{
                            "pct_of_total_cost": 100,
                            "criteria": -120
                        }]
                    }
                }
            },
            "omitSection": True
        },
        "completion_cost": {
            "dollar_per_ft_of_vertical": 0,
            "dollar_per_ft_of_horizontal": {
                "subItems": {
                    "row_view": {
                        "headers": {
                            "unit_cost": "Unit Cost",
                            "prop_ll": "Prop/PLL"
                        },
                        "rows": [{
                            "unit_cost": 600,
                            "prop_ll": 2000
                        }]
                    }
                }
            },
            "fixed_cost": 0,
            "tangible_pct": 0,
            "calculation": {
                "label": "Gross",
                "value": "gross"
            },
            "escalation_model": {
                "label": "None",
                "value": "none"
            },
            "depreciation_model": {
                "label": "None",
                "value": "none"
            },
            "deal_terms": 1,
            "empty_header": {
                "subItems": {
                    "row_view": {
                        "headers": {
                            "pct_of_total_cost": "% of Total Cost",
                            "criteria": {
                                "label": "FPD",
                                "value": "offset_to_fpd"
                            }
                        },
                        "rows": [{
                            "pct_of_total_cost": 100,
                            "criteria": -120
                        }]
                    }
                }
            },
            "omitSection": True
        },
        "recompletion_workover": {}
    },
    "econ_function": {
        "other_capex": {
            "rows": [{
                "category": "other_investment",
                "description": "",
                "tangible": 0,
                "intangible": 0,
                "offset_to_fpd": -120,
                "capex_expense": "capex",
                "after_econ_limit": "no",
                "calculation": "gross",
                "escalation_model": "none",
                "escalation_start": {
                    "apply_to_criteria": 0
                },
                "depreciation_model": "none",
                "deal_terms": 1,
                "distribution_type": "na",
                "mean": 0,
                "standard_deviation": 0,
                "lower_bound": 0,
                "upper_bound": 0,
                "mode": 0,
                "seed": 1
            }]
        },
        "drilling_cost": {},
        "completion_cost": {},
        "recompletion_workover": {}
    },
    "name": "bas",
    "createdBy": ObjectId("611beca03556540015af8562"),
    "lastUpdatedBy": ObjectId("636ea8e46e8de4001284cf99"),
    "createdAt": datetime.fromisoformat("2023-04-20T23:15:43.969"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.767"),
    "__v": 0
}, {
    "_id": ObjectId("6441c7cdfc13ce001268f110"),
    "copiedFrom": None,
    "unique": False,
    "tags": [],
    "embeddedLookupTables": [],
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "assumptionKey": "pricing",
    "assumptionName": "Pricing",
    "options": {
        "price_model": {
            "oil": {
                "subItems": {
                    "cap": "",
                    "escalation_model": {
                        "label": "None",
                        "value": "none"
                    },
                    "row_view": {
                        "headers": {
                            "price": "$/BBL",
                            "criteria": {
                                "label": "Flat",
                                "value": "entire_well_life"
                            }
                        },
                        "rows": [{
                            "price": 0,
                            "criteria": "Flat"
                        }]
                    }
                }
            },
            "gas": {
                "subItems": {
                    "cap": "",
                    "escalation_model": {
                        "label": "None",
                        "value": "none"
                    },
                    "row_view": {
                        "headers": {
                            "price": {
                                "label": "$/MMBTU",
                                "value": "dollar_per_mmbtu"
                            },
                            "criteria": {
                                "label": "Flat",
                                "value": "entire_well_life"
                            }
                        },
                        "rows": [{
                            "price": 0,
                            "criteria": "Flat"
                        }]
                    }
                }
            },
            "ngl": {
                "subItems": {
                    "cap": "",
                    "escalation_model": {
                        "label": "None",
                        "value": "none"
                    },
                    "row_view": {
                        "headers": {
                            "price": {
                                "label": "% of Oil Price",
                                "value": "pct_of_oil_price"
                            },
                            "criteria": {
                                "label": "Flat",
                                "value": "entire_well_life"
                            }
                        },
                        "rows": [{
                            "price": 100,
                            "criteria": "Flat"
                        }]
                    }
                }
            },
            "drip_condensate": {
                "subItems": {
                    "cap": "",
                    "escalation_model": {
                        "label": "None",
                        "value": "none"
                    },
                    "row_view": {
                        "headers": {
                            "price": {
                                "label": "$/BBL",
                                "value": "dollar_per_bbl"
                            },
                            "criteria": {
                                "label": "Flat",
                                "value": "entire_well_life"
                            }
                        },
                        "rows": [{
                            "price": 0,
                            "criteria": "Flat"
                        }]
                    }
                }
            }
        },
        "breakeven": {
            "npv_discount": 0,
            "based_on_price_ratio": {
                "label": "No",
                "value": "no"
            },
            "price_ratio": ""
        }
    },
    "econ_function": {
        "price_model": {
            "oil": {
                "cap": "",
                "escalation_model": "none",
                "rows": [{
                    "price": 0,
                    "entire_well_life": "Flat"
                }]
            },
            "gas": {
                "cap": "",
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_mmbtu": 0,
                    "entire_well_life": "Flat"
                }]
            },
            "ngl": {
                "cap": "",
                "escalation_model": "none",
                "rows": [{
                    "pct_of_oil_price": 100,
                    "entire_well_life": "Flat"
                }]
            },
            "drip_condensate": {
                "cap": "",
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }]
            }
        },
        "breakeven": {
            "npv_discount": 0,
            "based_on_price_ratio": "no",
            "price_ratio": ""
        }
    },
    "name": "bunk",
    "createdBy": ObjectId("611beca03556540015af8562"),
    "lastUpdatedBy": ObjectId("611beca03556540015af8562"),
    "createdAt": datetime.fromisoformat("2023-04-20T23:16:29.424"),
    "updatedAt": datetime.fromisoformat("2023-04-20T23:16:29.424"),
    "__v": 0
}, {
    "_id": ObjectId("6441c7e2fc13ce001268f131"),
    "copiedFrom": None,
    "unique": False,
    "tags": [],
    "embeddedLookupTables": [],
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "assumptionKey": "pricing",
    "assumptionName": "Pricing",
    "options": {
        "price_model": {
            "oil": {
                "subItems": {
                    "cap": 900,
                    "escalation_model": {
                        "label": "None",
                        "value": "none"
                    },
                    "row_view": {
                        "headers": {
                            "price": "$/BBL",
                            "criteria": {
                                "label": "Flat",
                                "value": "entire_well_life"
                            }
                        },
                        "rows": [{
                            "price": 0,
                            "criteria": "Flat"
                        }]
                    }
                }
            },
            "gas": {
                "subItems": {
                    "cap": "",
                    "escalation_model": {
                        "label": "None",
                        "value": "none"
                    },
                    "row_view": {
                        "headers": {
                            "price": {
                                "label": "$/MMBTU",
                                "value": "dollar_per_mmbtu"
                            },
                            "criteria": {
                                "label": "Flat",
                                "value": "entire_well_life"
                            }
                        },
                        "rows": [{
                            "price": 0,
                            "criteria": "Flat"
                        }]
                    }
                }
            },
            "ngl": {
                "subItems": {
                    "cap": "",
                    "escalation_model": {
                        "label": "None",
                        "value": "none"
                    },
                    "row_view": {
                        "headers": {
                            "price": {
                                "label": "% of Oil Price",
                                "value": "pct_of_oil_price"
                            },
                            "criteria": {
                                "label": "Flat",
                                "value": "entire_well_life"
                            }
                        },
                        "rows": [{
                            "price": 100,
                            "criteria": "Flat"
                        }]
                    }
                }
            },
            "drip_condensate": {
                "subItems": {
                    "cap": "",
                    "escalation_model": {
                        "label": "None",
                        "value": "none"
                    },
                    "row_view": {
                        "headers": {
                            "price": {
                                "label": "$/BBL",
                                "value": "dollar_per_bbl"
                            },
                            "criteria": {
                                "label": "Flat",
                                "value": "entire_well_life"
                            }
                        },
                        "rows": [{
                            "price": 0,
                            "criteria": "Flat"
                        }]
                    }
                }
            }
        },
        "breakeven": {
            "npv_discount": 0,
            "based_on_price_ratio": {
                "label": "No",
                "value": "no"
            },
            "price_ratio": ""
        }
    },
    "econ_function": {
        "price_model": {
            "oil": {
                "cap": 900,
                "escalation_model": "none",
                "rows": [{
                    "price": 0,
                    "entire_well_life": "Flat"
                }]
            },
            "gas": {
                "cap": "",
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_mmbtu": 0,
                    "entire_well_life": "Flat"
                }]
            },
            "ngl": {
                "cap": "",
                "escalation_model": "none",
                "rows": [{
                    "pct_of_oil_price": 100,
                    "entire_well_life": "Flat"
                }]
            },
            "drip_condensate": {
                "cap": "",
                "escalation_model": "none",
                "rows": [{
                    "dollar_per_bbl": 0,
                    "entire_well_life": "Flat"
                }]
            }
        },
        "breakeven": {
            "npv_discount": 0,
            "based_on_price_ratio": "no",
            "price_ratio": ""
        }
    },
    "name": "bed",
    "createdBy": ObjectId("611beca03556540015af8562"),
    "lastUpdatedBy": ObjectId("611beca03556540015af8562"),
    "createdAt": datetime.fromisoformat("2023-04-20T23:16:50.500"),
    "updatedAt": datetime.fromisoformat("2023-04-20T23:16:50.500"),
    "__v": 0
}, {
    "_id": ObjectId("64472805e86823482c7137ca"),
    "copiedFrom": None,
    "unique": False,
    "tags": [],
    "embeddedLookupTables": [],
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "assumptionKey": "general_options",
    "assumptionName": "General Options",
    "options": {
        "main_options": {
            "aggregation_date": "2023-05-01T00:00:00.000Z",
            "currency": {
                "label": "USD",
                "value": "USD"
            },
            "reporting_period": {
                "label": "Calendar",
                "value": "calendar"
            },
            "fiscal": {
                "label": "",
                "value": ""
            },
            "income_tax": {
                "label": "No",
                "value": "no"
            },
            "project_type": {
                "label": "Primary Recovery",
                "value": "primary_recovery"
            }
        },
        "income_tax": {
            "fifteen_depletion": {
                "label": "No",
                "value": "no"
            },
            "carry_forward": {
                "label": "No",
                "value": "no"
            },
            "state_income_tax": {
                "subItems": {
                    "row_view": {
                        "headers": {
                            "multiplier": "Rate",
                            "criteria": {
                                "label": "Flat",
                                "value": "entire_well_life"
                            }
                        },
                        "rows": [{
                            "multiplier": 0,
                            "criteria": "Flat"
                        }]
                    }
                }
            },
            "federal_income_tax": {
                "subItems": {
                    "row_view": {
                        "headers": {
                            "multiplier": "Rate",
                            "criteria": {
                                "label": "Flat",
                                "value": "entire_well_life"
                            }
                        },
                        "rows": [{
                            "multiplier": 0,
                            "criteria": "Flat"
                        }]
                    }
                }
            }
        },
        "discount_table": {
            "discount_method": {
                "label": "Yearly (N = 1)",
                "value": "yearly"
            },
            "cash_accrual_time": {
                "label": "Mid Month",
                "value": "mid_month"
            },
            "first_discount": 10,
            "second_discount": 15,
            "vertical_row_view": {
                "headers": {
                    "discount_table": "Discount Table"
                },
                "rows": [{
                    "discount_table": 0
                }, {
                    "discount_table": 2
                }, {
                    "discount_table": 5
                }, {
                    "discount_table": 8
                }, {
                    "discount_table": 10
                }, {
                    "discount_table": 12
                }, {
                    "discount_table": 15
                }, {
                    "discount_table": 20
                }, {
                    "discount_table": 25
                }, {
                    "discount_table": 30
                }, {
                    "discount_table": 40
                }, {
                    "discount_table": 50
                }, {
                    "discount_table": 60
                }, {
                    "discount_table": 70
                }, {
                    "discount_table": 80
                }, {
                    "discount_table": 100
                }]
            }
        },
        "boe_conversion": {
            "oil": 1,
            "wet_gas": 6,
            "dry_gas": 6,
            "ngl": 1,
            "drip_condensate": 1
        },
        "reporting_units": {
            "oil": {
                "label": "MBBL",
                "value": "MBBL"
            },
            "gas": {
                "label": "MMCF",
                "value": "MMCF"
            },
            "ngl": {
                "label": "MBBL",
                "value": "MBBL"
            },
            "drip_condensate": {
                "label": "MBBL",
                "value": "MBBL"
            },
            "water": {
                "label": "MBBL",
                "value": "MBBL"
            },
            "pressure": {
                "label": "PSI",
                "value": "PSI"
            },
            "cash": {
                "label": "M$",
                "value": "M$"
            },
            "water_cut": "BBL/BOE",
            "gor": {
                "label": "CF/BBL",
                "value": "CF/BBL"
            },
            "condensate_gas_ratio": {
                "label": "BBL/MMCF",
                "value": "BBL/MMCF"
            },
            "drip_condensate_yield": {
                "label": "BBL/MMCF",
                "value": "BBL/MMCF"
            },
            "ngl_yield": {
                "label": "BBL/MMCF",
                "value": "BBL/MMCF"
            }
        }
    },
    "econ_function": {
        "main_options": {
            "aggregation_date": "2023-05-01",
            "currency": "USD",
            "reporting_period": "calendar",
            "fiscal": "",
            "income_tax": "no",
            "project_type": "primary_recovery"
        },
        "income_tax": {
            "fifteen_depletion": "no",
            "carry_forward": "no",
            "state_income_tax": {
                "rows": [{
                    "multiplier": 0,
                    "entire_well_life": "Flat"
                }]
            },
            "federal_income_tax": {
                "rows": [{
                    "multiplier": 0,
                    "entire_well_life": "Flat"
                }]
            }
        },
        "discount_table": {
            "discount_method":
            "yearly",
            "cash_accrual_time":
            "mid_month",
            "first_discount":
            10,
            "second_discount":
            15,
            "rows": [{
                "discount_table": 0
            }, {
                "discount_table": 2
            }, {
                "discount_table": 5
            }, {
                "discount_table": 8
            }, {
                "discount_table": 10
            }, {
                "discount_table": 12
            }, {
                "discount_table": 15
            }, {
                "discount_table": 20
            }, {
                "discount_table": 25
            }, {
                "discount_table": 30
            }, {
                "discount_table": 40
            }, {
                "discount_table": 50
            }, {
                "discount_table": 60
            }, {
                "discount_table": 70
            }, {
                "discount_table": 80
            }, {
                "discount_table": 100
            }]
        },
        "boe_conversion": {
            "oil": 1,
            "wet_gas": 6,
            "dry_gas": 6,
            "ngl": 1,
            "drip_condensate": 1
        },
        "reporting_units": {
            "oil": "MBBL",
            "gas": "MMCF",
            "ngl": "MBBL",
            "drip_condensate": "MBBL",
            "water": "MBBL",
            "pressure": "PSI",
            "cash": "M$",
            "water_cut": "BBL/BOE",
            "gor": "CF/BBL",
            "condensate_gas_ratio": "BBL/MMCF",
            "drip_condensate_yield": "BBL/MMCF",
            "ngl_yield": "BBL/MMCF"
        }
    },
    "name": "asdf",
    "createdBy": ObjectId("611beca03556540015af8562"),
    "lastUpdatedBy": ObjectId("636ea8e46e8de4001284cf99"),
    "createdAt": datetime.fromisoformat("2023-04-25T01:08:21.732"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:45:55.520"),
    "__v": 0
}]

SCENARIO_WELL_ASSIGNMENTS_FIXTURE = [{
    "_id": ObjectId("643dbfbfccae6148ebc0ea3a"),
    "capex": {
        "default": {
            "model": None
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("63766e02023757c1078c0148")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("64385416e0906be49c49a0a0")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63766e07023757c1078ce5d6"),
    "scenario": ObjectId("643dbfbfccae6148ebc0ea37"),
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.940"),
    "updatedAt": datetime.fromisoformat("2023-04-17T21:53:36.850")
}, {
    "_id": ObjectId("643dbfbfccae6148ebc0ea3b"),
    "capex": {
        "default": {
            "model": None
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("63766e02023757c1078c0148")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("64385416e0906be49c49a0a0")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63766e07023757c1078ce5d7"),
    "scenario": ObjectId("643dbfbfccae6148ebc0ea37"),
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.940"),
    "updatedAt": datetime.fromisoformat("2023-04-17T21:53:36.850")
}, {
    "_id": ObjectId("643dbfbfccae6148ebc0ea3c"),
    "capex": {
        "default": {
            "model": None
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("63766e02023757c1078c0148")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("64385416e0906be49c49a0a0")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63766e07023757c1078ce5d8"),
    "scenario": ObjectId("643dbfbfccae6148ebc0ea37"),
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.940"),
    "updatedAt": datetime.fromisoformat("2023-04-17T21:53:36.850")
}, {
    "_id": ObjectId("643dbfbfccae6148ebc0ea3d"),
    "capex": {
        "default": {
            "model": None
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("63766e02023757c1078c0148")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("64385416e0906be49c49a0a0")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63766e07023757c1078ce5d9"),
    "scenario": ObjectId("643dbfbfccae6148ebc0ea37"),
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.940"),
    "updatedAt": datetime.fromisoformat("2023-04-17T21:53:36.850")
}, {
    "_id": ObjectId("643dbfbfccae6148ebc0ea3e"),
    "capex": {
        "default": {
            "model": None
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("63766e02023757c1078c0148")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("64385416e0906be49c49a0a0")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63766e07023757c1078ce5da"),
    "scenario": ObjectId("643dbfbfccae6148ebc0ea37"),
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.940"),
    "updatedAt": datetime.fromisoformat("2023-04-17T21:53:36.850")
}, {
    "_id": ObjectId("643dbfbfccae6148ebc0ea3f"),
    "capex": {
        "default": {
            "model": None
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("63766e02023757c1078c0148")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("64385416e0906be49c49a0a0")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63766e07023757c1078ce5db"),
    "scenario": ObjectId("643dbfbfccae6148ebc0ea37"),
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.940"),
    "updatedAt": datetime.fromisoformat("2023-04-17T21:53:36.850")
}, {
    "_id": ObjectId("643dbfbfccae6148ebc0ea40"),
    "capex": {
        "default": {
            "model": None
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("63766e02023757c1078c0148")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("64385416e0906be49c49a0a0")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63766e07023757c1078ce5dc"),
    "scenario": ObjectId("643dbfbfccae6148ebc0ea37"),
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.941"),
    "updatedAt": datetime.fromisoformat("2023-04-17T21:53:36.850")
}, {
    "_id": ObjectId("643dbfbfccae6148ebc0ea41"),
    "capex": {
        "default": {
            "model": None
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("63766e02023757c1078c0148")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("64385416e0906be49c49a0a0")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63766e07023757c1078ce5dd"),
    "scenario": ObjectId("643dbfbfccae6148ebc0ea37"),
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.941"),
    "updatedAt": datetime.fromisoformat("2023-04-17T21:53:36.850")
}, {
    "_id": ObjectId("643dbfbfccae6148ebc0ea42"),
    "capex": {
        "default": {
            "model": None
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("63766e02023757c1078c0148")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("64385416e0906be49c49a0a0")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63766e07023757c1078ce5de"),
    "scenario": ObjectId("643dbfbfccae6148ebc0ea37"),
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.941"),
    "updatedAt": datetime.fromisoformat("2023-04-17T21:53:36.850")
}, {
    "_id": ObjectId("643dbfbfccae6148ebc0ea43"),
    "capex": {
        "default": {
            "model": None
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("63766e02023757c1078c0148")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("64385416e0906be49c49a0a0")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63766e07023757c1078ce5df"),
    "scenario": ObjectId("643dbfbfccae6148ebc0ea37"),
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.941"),
    "updatedAt": datetime.fromisoformat("2023-04-17T21:53:36.850")
}, {
    "_id": ObjectId("643dbfbfccae6148ebc0ea44"),
    "capex": {
        "default": {
            "model": None
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("63766e02023757c1078c0148")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("64385416e0906be49c49a0a0")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63766e07023757c1078ce5e0"),
    "scenario": ObjectId("643dbfbfccae6148ebc0ea37"),
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.941"),
    "updatedAt": datetime.fromisoformat("2023-04-17T21:53:36.850")
}, {
    "_id": ObjectId("64499b8adf547cea7b9f4c57"),
    "capex": {
        "default": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        },
        "qualifier1": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("6441c752fc13ce001268efee")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("643d7451ce99c485813e3f38")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63a0e8dce640e5a88bb7d9d6"),
    "scenario": ObjectId("64499b8adf547cea7b9f4c54"),
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.301"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.196")
}, {
    "_id": ObjectId("64499b8adf547cea7b9f4c58"),
    "capex": {
        "default": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        },
        "qualifier1": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("6441c752fc13ce001268efee")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("643d7451ce99c485813e3f38")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63a0e8dce640e5a88bb7d9d7"),
    "scenario": ObjectId("64499b8adf547cea7b9f4c54"),
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.301"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.196")
}, {
    "_id": ObjectId("64499b8adf547cea7b9f4c59"),
    "capex": {
        "default": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        },
        "qualifier1": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("6441c752fc13ce001268efee")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("643d7451ce99c485813e3f38")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63a0e8dce640e5a88bb7d9d8"),
    "scenario": ObjectId("64499b8adf547cea7b9f4c54"),
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.301"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.196")
}, {
    "_id": ObjectId("64499b8adf547cea7b9f4c5a"),
    "capex": {
        "default": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        },
        "qualifier1": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("6441c752fc13ce001268efee")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("643d7451ce99c485813e3f38")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63a0e8dce640e5a88bb7d9d9"),
    "scenario": ObjectId("64499b8adf547cea7b9f4c54"),
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.301"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.196")
}, {
    "_id": ObjectId("64499b8adf547cea7b9f4c5b"),
    "capex": {
        "default": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        },
        "qualifier1": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("6441c752fc13ce001268efee")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("643d7451ce99c485813e3f38")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63a0e8dce640e5a88bb7d9da"),
    "scenario": ObjectId("64499b8adf547cea7b9f4c54"),
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.301"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.196")
}, {
    "_id": ObjectId("64499b8adf547cea7b9f4c5c"),
    "capex": {
        "default": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        },
        "qualifier1": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("6441c752fc13ce001268efee")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("643d7451ce99c485813e3f38")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63a0e8dce640e5a88bb7d9db"),
    "scenario": ObjectId("64499b8adf547cea7b9f4c54"),
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.301"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.196")
}, {
    "_id": ObjectId("64499b8adf547cea7b9f4c5d"),
    "capex": {
        "default": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        },
        "qualifier1": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("6441c752fc13ce001268efee")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("643d7451ce99c485813e3f38")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63a0e8dce640e5a88bb7d9dc"),
    "scenario": ObjectId("64499b8adf547cea7b9f4c54"),
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.301"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.196")
}, {
    "_id": ObjectId("64499b8adf547cea7b9f4c5e"),
    "capex": {
        "default": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        },
        "qualifier1": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("6441c752fc13ce001268efee")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("643d7451ce99c485813e3f38")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63a0e8dce640e5a88bb7d9dd"),
    "scenario": ObjectId("64499b8adf547cea7b9f4c54"),
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.301"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.196")
}, {
    "_id": ObjectId("64499b8adf547cea7b9f4c5f"),
    "capex": {
        "default": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        },
        "qualifier1": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("6441c752fc13ce001268efee")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("643d7451ce99c485813e3f38")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63a0e8dce640e5a88bb7d9de"),
    "scenario": ObjectId("64499b8adf547cea7b9f4c54"),
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.301"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.196")
}, {
    "_id": ObjectId("64499b8adf547cea7b9f4c60"),
    "capex": {
        "default": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        },
        "qualifier1": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("6441c752fc13ce001268efee")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("643d7451ce99c485813e3f38")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63a0e8dce640e5a88bb7d9df"),
    "scenario": ObjectId("64499b8adf547cea7b9f4c54"),
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.301"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.196")
}, {
    "_id": ObjectId("64499b8adf547cea7b9f4c61"),
    "capex": {
        "default": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        },
        "qualifier1": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("6441c752fc13ce001268efee")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("643d7451ce99c485813e3f38")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63a0e8dce640e5a88bb7d9e0"),
    "scenario": ObjectId("64499b8adf547cea7b9f4c54"),
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.301"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.196")
}, {
    "_id": ObjectId("64499b8adf547cea7b9f4c62"),
    "capex": {
        "default": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        },
        "qualifier1": {
            "model": ObjectId("6441c79ffc13ce001268f099")
        }
    },
    "dates": {
        "default": {
            "model": ObjectId("6441c752fc13ce001268efee")
        }
    },
    "depreciation": {
        "default": {
            "model": None
        }
    },
    "escalation": {
        "default": {
            "model": None
        }
    },
    "expenses": {
        "default": {
            "model": None
        }
    },
    "network": {
        "default": {
            "model": None
        }
    },
    "ownership_reversion": {
        "default": {
            "model": ObjectId("643d7451ce99c485813e3f38")
        }
    },
    "pricing": {
        "default": {
            "model": None
        }
    },
    "differentials": {
        "default": {
            "model": None
        }
    },
    "production_taxes": {
        "default": {
            "model": None
        }
    },
    "production_vs_fit": {
        "default": {
            "model": None
        }
    },
    "reserves_category": {
        "default": {
            "model": None
        }
    },
    "risking": {
        "default": {
            "model": None
        }
    },
    "stream_properties": {
        "default": {
            "model": None
        }
    },
    "emission": {
        "default": {
            "model": None
        }
    },
    "forecast": {
        "default": {
            "model": None
        }
    },
    "forecast_p_series": {
        "default": {
            "model": None
        }
    },
    "schedule": {
        "default": {
            "model": None
        }
    },
    "well": ObjectId("63a0e8dce640e5a88bb7d9e1"),
    "scenario": ObjectId("64499b8adf547cea7b9f4c54"),
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "schemaVersion": 3,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.302"),
    "updatedAt": datetime.fromisoformat("2023-04-26T21:47:58.196")
}]

PROJECT_CUSTOM_HEADERS_FIXTURE = [{}]

SCENARIO_FIXTURE = [{
    "_id":
    ObjectId("643dbfbfccae6148ebc0ea37"),
    "columns": {
        "capex": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.884")
                }
            }
        },
        "dates": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.884")
                }
            }
        },
        "depreciation": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.884")
                }
            }
        },
        "escalation": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.884")
                }
            }
        },
        "expenses": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.884")
                }
            }
        },
        "forecast": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.884")
                }
            }
        },
        "forecast_p_series": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.884")
                }
            }
        },
        "network": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.884")
                }
            }
        },
        "ownership_reversion": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.885")
                }
            }
        },
        "pricing": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.885")
                }
            }
        },
        "differentials": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.885")
                }
            }
        },
        "production_taxes": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.885")
                }
            }
        },
        "production_vs_fit": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.885")
                }
            }
        },
        "reserves_category": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.885")
                }
            }
        },
        "risking": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.885")
                }
            }
        },
        "schedule": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.885")
                }
            }
        },
        "stream_properties": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.885")
                }
            }
        },
        "emission": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-17T21:53:03.885")
                }
            }
        }
    },
    "wells": [
        ObjectId("63766e07023757c1078ce5d6"),
        ObjectId("63766e07023757c1078ce5d7"),
        ObjectId("63766e07023757c1078ce5d8"),
        ObjectId("63766e07023757c1078ce5d9"),
        ObjectId("63766e07023757c1078ce5da"),
        ObjectId("63766e07023757c1078ce5db"),
        ObjectId("63766e07023757c1078ce5dc"),
        ObjectId("63766e07023757c1078ce5dd"),
        ObjectId("63766e07023757c1078ce5de"),
        ObjectId("63766e07023757c1078ce5df"),
        ObjectId("63766e07023757c1078ce5e0")
    ],
    "tags": [],
    "modular":
    False,
    "createdBy":
    ObjectId("636ea8e46e8de4001284cf99"),
    "name":
    "Test 1",
    "project":
    ObjectId("63766e02023757c1078bfe7d"),
    "createdAt":
    datetime.fromisoformat("2023-04-17T21:53:03.890"),
    "updatedAt":
    datetime.fromisoformat("2023-04-17T21:53:12.821"),
    "schemaVersion":
    2,
    "__v":
    0,
    "general_options":
    ObjectId("63766e02023757c1078c014b")
}, {
    "_id":
    ObjectId("64499b8adf547cea7b9f4c54"),
    "columns": {
        "capex": {
            "activeQualifier": "qualifier1",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.254")
                },
                "qualifier1": {
                    "createdAt": datetime.fromisoformat("2023-04-26T21:47:40.592"),
                    "createdBy": "636ea8e46e8de4001284cf99",
                    "createdByName": "Nick Ruta",
                    "name": "CAPE_2023_Q2"
                }
            }
        },
        "dates": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "depreciation": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "escalation": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "expenses": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "forecast": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "forecast_p_series": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "network": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "ownership_reversion": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "pricing": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "differentials": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "production_taxes": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "production_vs_fit": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "reserves_category": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "risking": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "schedule": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "stream_properties": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        },
        "emission": {
            "activeQualifier": "default",
            "qualifiers": {
                "default": {
                    "name": "Default",
                    "createdAt": datetime.fromisoformat("2023-04-26T21:45:46.255")
                }
            }
        }
    },
    "wells": [
        ObjectId("63a0e8dce640e5a88bb7d9d6"),
        ObjectId("63a0e8dce640e5a88bb7d9d7"),
        ObjectId("63a0e8dce640e5a88bb7d9d8"),
        ObjectId("63a0e8dce640e5a88bb7d9d9"),
        ObjectId("63a0e8dce640e5a88bb7d9da"),
        ObjectId("63a0e8dce640e5a88bb7d9db"),
        ObjectId("63a0e8dce640e5a88bb7d9dc"),
        ObjectId("63a0e8dce640e5a88bb7d9dd"),
        ObjectId("63a0e8dce640e5a88bb7d9de"),
        ObjectId("63a0e8dce640e5a88bb7d9df"),
        ObjectId("63a0e8dce640e5a88bb7d9e0"),
        ObjectId("63a0e8dce640e5a88bb7d9e1")
    ],
    "tags": [],
    "modular":
    False,
    "createdBy":
    ObjectId("636ea8e46e8de4001284cf99"),
    "name":
    "Test 1 w/ assumptions",
    "project":
    ObjectId("63a0e8dbe640e5a88bb7d909"),
    "createdAt":
    datetime.fromisoformat("2023-04-26T21:45:46.255"),
    "updatedAt":
    datetime.fromisoformat("2023-04-26T21:47:40.592"),
    "schemaVersion":
    2,
    "__v":
    0,
    "general_options":
    ObjectId("64472805e86823482c7137ca")
}]

WELLS_FIXTURE = [{
    "_id": ObjectId("63766e07023757c1078ce5d7"),
    "chosenID": "840370000540963",
    "dataSource": "other",
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "first_fluid_volume": None,
    "first_prod_date": None,
    "first_prop_weight": None,
    "lateral_length": None,
    "measured_depth": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": None,
    "createdAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "inptID": "INPTMO7FZwP0Ui",
    "has_monthly": False,
    "last_prod_date_monthly": None,
    "has_daily": False,
    "last_prod_date_daily": None,
    "dataPool": "external",
    "location": {
        "type": "Point",
        "coordinates": [-76.860006, 41.769678]
    },
    "toeLocation": {
        "type": "Point",
        "coordinates": [-76.870161, 41.783814]
    },
    "geohash": "dr3me5bq003d",
    "chosenKeyID": "WellID",
    "mostRecentImport": ObjectId("5fb2f984af874989da757db9"),
    "mostRecentImportDesc": "kwalker20201116t171317",
    "mostRecentImportType": "spreadsheet",
    "mostRecentImportDate": datetime.fromisoformat("2020-11-16T22:13:24.095"),
    "county": "BRADFORD",
    "current_operator": "REPSOL",
    "landing_zone": "MARCELLUS",
    "perf_lateral_length": 5180,
    "surfaceLatitude": 41.769678,
    "surfaceLongitude": -76.860006,
    "toeLatitude": 41.783814,
    "toeLongitude": -76.870161,
    "well_name": "MORGAN 01 074 05 W 5H",
    "updatedAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "undiscounted_roi": None,
    "schemaVersion": 1,
    "copied": False
}, {
    "_id": ObjectId("63766e07023757c1078ce5da"),
    "chosenID": "840370000543967",
    "dataSource": "other",
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "first_fluid_volume": None,
    "first_prod_date": None,
    "first_prop_weight": None,
    "lateral_length": None,
    "measured_depth": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": None,
    "createdAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "inptID": "INPTvqFrLTA6Hi",
    "has_monthly": False,
    "last_prod_date_monthly": None,
    "has_daily": False,
    "last_prod_date_daily": None,
    "dataPool": "external",
    "location": {
        "type": "Point",
        "coordinates": [-76.855694, 41.718206]
    },
    "toeLocation": {
        "type": "Point",
        "coordinates": [-76.858992, 41.725914]
    },
    "geohash": "dr3m74e6ht2b",
    "chosenKeyID": "WellID",
    "mostRecentImport": ObjectId("5fb2f984af874989da757db9"),
    "mostRecentImportDesc": "kwalker20201116t171317",
    "mostRecentImportType": "spreadsheet",
    "mostRecentImportDate": datetime.fromisoformat("2020-11-16T22:13:24.095"),
    "county": "BRADFORD",
    "current_operator": "REPSOL",
    "landing_zone": "MARCELLUS",
    "perf_lateral_length": 2282,
    "surfaceLatitude": 41.718206,
    "surfaceLongitude": -76.855694,
    "toeLatitude": 41.725914,
    "toeLongitude": -76.858992,
    "well_name": "HARRIS M 2H",
    "updatedAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "undiscounted_roi": None,
    "schemaVersion": 1,
    "copied": False
}, {
    "_id": ObjectId("63766e07023757c1078ce5d8"),
    "chosenID": "840370000541639",
    "dataSource": "other",
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "first_prod_date": None,
    "lateral_length": None,
    "measured_depth": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "first_proppant_per_fluid": 1.437155855899498,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": 58980,
    "total_prop_weight": 3560065,
    "total_proppant_per_fluid": 1.437155855899498,
    "first_proppant_per_perforated_interval": 1129.104027909927,
    "first_fluid_per_perforated_interval": 18.705994291151285,
    "total_fluid_per_perforated_interval": 18.705994291151285,
    "total_proppant_per_perforated_interval": 1129.104027909927,
    "first_prod_date_daily_calc": None,
    "createdAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "inptID": "INPTcYKWToCRUX",
    "has_daily": False,
    "last_prod_date_daily": None,
    "dataPool": "external",
    "location": {
        "type": "Point",
        "coordinates": [-76.859647, 41.769424]
    },
    "toeLocation": {
        "type": "Point",
        "coordinates": [-76.85288556327617, 41.76199550314993]
    },
    "geohash": "dr3me5bs82vr",
    "chosenKeyID": "WellID",
    "mostRecentImport": ObjectId("5fb2f984af874989da757db9"),
    "mostRecentImportDesc": "kwalker20201116t171317",
    "mostRecentImportType": "spreadsheet",
    "mostRecentImportDate": datetime.fromisoformat("2020-11-16T22:13:24.095"),
    "county": "BRADFORD",
    "current_operator": "REPSOL",
    "first_fluid_volume": 58980,
    "first_prop_weight": 3560065,
    "landing_zone": "MARCELLUS",
    "perf_lateral_length": 3153,
    "surfaceLatitude": 41.769424,
    "surfaceLongitude": -76.859647,
    "toeLatitude": 41.76199550314993,
    "toeLongitude": -76.85288556327617,
    "well_name": "MORGAN 01 074 04 W 4H",
    "updatedAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "has_monthly": True,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2011-04-15T00:00:00.000"),
    "last_prod_date_monthly": datetime.fromisoformat("2020-05-01T00:00:00.000"),
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "undiscounted_roi": None,
    "schemaVersion": 1,
    "copied": False
}, {
    "_id": ObjectId("63766e07023757c1078ce5df"),
    "chosenID": "840370000544716",
    "dataSource": "other",
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "first_prod_date": None,
    "lateral_length": None,
    "measured_depth": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "first_proppant_per_fluid": 1.1445583278919909,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": 101078,
    "total_prop_weight": 4858966,
    "total_proppant_per_fluid": 1.1445583278919909,
    "first_proppant_per_perforated_interval": 999.3759769642122,
    "first_fluid_per_perforated_interval": 20.78938708350473,
    "total_fluid_per_perforated_interval": 20.78938708350473,
    "total_proppant_per_perforated_interval": 999.3759769642122,
    "first_prod_date_daily_calc": None,
    "createdAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "inptID": "INPTFzjuuyYwyH",
    "has_daily": False,
    "last_prod_date_daily": None,
    "dataPool": "external",
    "location": {
        "type": "Point",
        "coordinates": [-77.56584, 41.371355]
    },
    "toeLocation": {
        "type": "Point",
        "coordinates": [-77.57665976433465, 41.385756073962646]
    },
    "geohash": "dr2g6gqm8gt9",
    "chosenKeyID": "WellID",
    "mostRecentImport": ObjectId("5fb2f984af874989da757db9"),
    "mostRecentImportDesc": "kwalker20201116t171317",
    "mostRecentImportType": "spreadsheet",
    "mostRecentImportDate": datetime.fromisoformat("2020-11-16T22:13:24.095"),
    "county": "CLINTON",
    "current_operator": "ALTA RESOURCES",
    "first_fluid_volume": 101078,
    "first_prop_weight": 4858966,
    "landing_zone": "MARCELLUS",
    "perf_lateral_length": 4862,
    "surfaceLatitude": 41.371355,
    "surfaceLongitude": -77.56584,
    "toeLatitude": 41.385756073962646,
    "toeLongitude": -77.57665976433465,
    "well_name": "COP TRACT 285 A1007H",
    "updatedAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "has_monthly": True,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2010-12-15T00:00:00.000"),
    "last_prod_date_monthly": datetime.fromisoformat("2020-05-01T00:00:00.000"),
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "undiscounted_roi": None,
    "schemaVersion": 1,
    "copied": False
}, {
    "_id": ObjectId("63766e07023757c1078ce5dc"),
    "chosenID": "840370000544709",
    "dataSource": "other",
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "first_fluid_volume": None,
    "first_prod_date": None,
    "first_prop_weight": None,
    "lateral_length": None,
    "measured_depth": None,
    "perf_lateral_length": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": None,
    "createdAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "inptID": "INPTbX9Fscq1vz",
    "has_monthly": False,
    "last_prod_date_monthly": None,
    "has_daily": False,
    "last_prod_date_daily": None,
    "dataPool": "external",
    "location": {
        "type": "Point",
        "coordinates": [-77.467374, 41.230617]
    },
    "geohash": "dr2ft1vcz256",
    "chosenKeyID": "WellID",
    "mostRecentImport": ObjectId("5fb2f984af874989da757db9"),
    "mostRecentImportDesc": "kwalker20201116t171317",
    "mostRecentImportType": "spreadsheet",
    "mostRecentImportDate": datetime.fromisoformat("2020-11-16T22:13:24.095"),
    "county": "CLINTON",
    "current_operator": "RANGE RESOURCES",
    "landing_zone": "LOCK HAVEN",
    "surfaceLatitude": 41.230617,
    "surfaceLongitude": -77.467374,
    "well_name": "MOHAWK LODGE UNIT 1",
    "updatedAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "undiscounted_roi": None,
    "schemaVersion": 1,
    "copied": False
}, {
    "_id": ObjectId("63766e07023757c1078ce5d6"),
    "chosenID": "840370000540962",
    "dataSource": "other",
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "first_prod_date": None,
    "lateral_length": None,
    "measured_depth": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "first_proppant_per_fluid": 1.4447770417983672,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": 52473,
    "total_prop_weight": 3184095,
    "total_proppant_per_fluid": 1.4447770417983672,
    "first_proppant_per_perforated_interval": 1140.0268528464017,
    "first_fluid_per_perforated_interval": 18.78732545649839,
    "total_fluid_per_perforated_interval": 18.78732545649839,
    "total_proppant_per_perforated_interval": 1140.0268528464017,
    "first_prod_date_daily_calc": None,
    "createdAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "inptID": "INPTyskb0UoRaz",
    "has_daily": False,
    "last_prod_date_daily": None,
    "dataPool": "external",
    "location": {
        "type": "Point",
        "coordinates": [-76.859738, 41.769419]
    },
    "toeLocation": {
        "type": "Point",
        "coordinates": [-76.85829374122999, 41.76803291505431]
    },
    "geohash": "dr3me5bkw219",
    "chosenKeyID": "WellID",
    "mostRecentImport": ObjectId("5fb2f984af874989da757db9"),
    "mostRecentImportDesc": "kwalker20201116t171317",
    "mostRecentImportType": "spreadsheet",
    "mostRecentImportDate": datetime.fromisoformat("2020-11-16T22:13:24.095"),
    "county": "BRADFORD",
    "current_operator": "REPSOL",
    "first_fluid_volume": 52473,
    "first_prop_weight": 3184095,
    "landing_zone": "MARCELLUS",
    "perf_lateral_length": 2793,
    "surfaceLatitude": 41.769419,
    "surfaceLongitude": -76.859738,
    "toeLatitude": 41.76803291505431,
    "toeLongitude": -76.85829374122999,
    "well_name": "MORGAN 01 074 03 W 3H",
    "updatedAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "has_monthly": True,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2011-04-15T00:00:00.000"),
    "last_prod_date_monthly": datetime.fromisoformat("2020-05-01T00:00:00.000"),
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "undiscounted_roi": None,
    "schemaVersion": 1,
    "copied": False
}, {
    "_id": ObjectId("63766e07023757c1078ce5d9"),
    "chosenID": "840370000543365",
    "dataSource": "other",
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "first_fluid_volume": None,
    "first_prod_date": None,
    "first_prop_weight": None,
    "lateral_length": None,
    "measured_depth": None,
    "perf_lateral_length": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": None,
    "createdAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "inptID": "INPTDNrFFxjCeE",
    "has_monthly": False,
    "last_prod_date_monthly": None,
    "has_daily": False,
    "last_prod_date_daily": None,
    "dataPool": "external",
    "location": {
        "type": "Point",
        "coordinates": [-76.854981, 41.605189]
    },
    "geohash": "dr3kejgzv1ke",
    "chosenKeyID": "WellID",
    "mostRecentImport": ObjectId("5fb2f984af874989da757db9"),
    "mostRecentImportDesc": "kwalker20201116t171317",
    "mostRecentImportType": "spreadsheet",
    "mostRecentImportDate": datetime.fromisoformat("2020-11-16T22:13:24.095"),
    "county": "BRADFORD",
    "current_operator": "SHELL",
    "landing_zone": "MARCELLUS",
    "surfaceLatitude": 41.605189,
    "surfaceLongitude": -76.854981,
    "well_name": "HICKOK 114 8H",
    "updatedAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "undiscounted_roi": None,
    "schemaVersion": 1,
    "copied": False
}, {
    "_id": ObjectId("63766e07023757c1078ce5de"),
    "chosenID": "840370000544713",
    "dataSource": "other",
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "first_prod_date": None,
    "lateral_length": None,
    "measured_depth": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "first_proppant_per_fluid": 0.9171166086388858,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": 126048,
    "total_prop_weight": 4855230,
    "total_proppant_per_fluid": 0.9171166086388858,
    "first_proppant_per_perforated_interval": 889.7251236943375,
    "first_fluid_per_perforated_interval": 23.09840571742716,
    "total_fluid_per_perforated_interval": 23.09840571742716,
    "total_proppant_per_perforated_interval": 889.7251236943375,
    "first_prod_date_daily_calc": None,
    "createdAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "inptID": "INPTbo6f0JMs5F",
    "has_daily": False,
    "last_prod_date_daily": None,
    "dataPool": "external",
    "location": {
        "type": "Point",
        "coordinates": [-77.591731, 41.192831]
    },
    "toeLocation": {
        "type": "Point",
        "coordinates": [-77.58051834862282, 41.178251475493184]
    },
    "geohash": "dr2f66gmts7b",
    "chosenKeyID": "WellID",
    "mostRecentImport": ObjectId("5fb2f984af874989da757db9"),
    "mostRecentImportDesc": "kwalker20201116t171317",
    "mostRecentImportType": "spreadsheet",
    "mostRecentImportDate": datetime.fromisoformat("2020-11-16T22:13:24.095"),
    "county": "CLINTON",
    "current_operator": "ALTA RESOURCES",
    "first_fluid_volume": 126048,
    "first_prop_weight": 4855230,
    "landing_zone": "MARCELLUS",
    "perf_lateral_length": 5457,
    "surfaceLatitude": 41.192831,
    "surfaceLongitude": -77.591731,
    "toeLatitude": 41.178251475493184,
    "toeLongitude": -77.58051834862282,
    "well_name": "COP TRACT 252 B1002H",
    "updatedAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "has_monthly": True,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2010-12-15T00:00:00.000"),
    "last_prod_date_monthly": datetime.fromisoformat("2020-05-01T00:00:00.000"),
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "undiscounted_roi": None,
    "schemaVersion": 1,
    "copied": False
}, {
    "_id": ObjectId("63766e07023757c1078ce5e0"),
    "chosenID": "840370000544723",
    "dataSource": "other",
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "first_prod_date": None,
    "lateral_length": None,
    "measured_depth": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "first_proppant_per_fluid": 1.4562985745719996,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": 85742,
    "total_prop_weight": 5244370,
    "total_proppant_per_fluid": 1.4562985745719996,
    "first_proppant_per_perforated_interval": 1212.010630922117,
    "first_fluid_per_perforated_interval": 19.81557661197134,
    "total_fluid_per_perforated_interval": 19.81557661197134,
    "total_proppant_per_perforated_interval": 1212.010630922117,
    "first_prod_date_daily_calc": None,
    "createdAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "inptID": "INPT93t2txGEjQ",
    "has_daily": False,
    "last_prod_date_daily": None,
    "dataPool": "external",
    "location": {
        "type": "Point",
        "coordinates": [-77.546464, 41.385646]
    },
    "toeLocation": {
        "type": "Point",
        "coordinates": [-77.5554971780401, 41.3975057329806]
    },
    "geohash": "dr2g7qh2u7t6",
    "chosenKeyID": "WellID",
    "mostRecentImport": ObjectId("5fb2f984af874989da757db9"),
    "mostRecentImportDesc": "kwalker20201116t171317",
    "mostRecentImportType": "spreadsheet",
    "mostRecentImportDate": datetime.fromisoformat("2020-11-16T22:13:24.095"),
    "county": "CLINTON",
    "current_operator": "ALTA RESOURCES",
    "first_fluid_volume": 85742,
    "first_prop_weight": 5244370,
    "landing_zone": "MARCELLUS",
    "perf_lateral_length": 4327,
    "surfaceLatitude": 41.385646,
    "surfaceLongitude": -77.546464,
    "toeLatitude": 41.3975057329806,
    "toeLongitude": -77.5554971780401,
    "well_name": "COP TRACT 285 E 1027H",
    "updatedAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "has_monthly": True,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2011-11-15T00:00:00.000"),
    "last_prod_date_monthly": datetime.fromisoformat("2020-05-01T00:00:00.000"),
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "undiscounted_roi": None,
    "schemaVersion": 1,
    "copied": False
}, {
    "_id": ObjectId("63766e07023757c1078ce5db"),
    "chosenID": "840370000543982",
    "dataSource": "other",
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "first_prod_date": None,
    "lateral_length": None,
    "measured_depth": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "first_proppant_per_fluid": 1.2340027985538962,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": 77489,
    "total_prop_weight": 4016109,
    "total_proppant_per_fluid": 1.2340027985538962,
    "first_proppant_per_perforated_interval": 1081.6345273363856,
    "first_fluid_per_perforated_interval": 20.869647185564233,
    "total_fluid_per_perforated_interval": 20.869647185564233,
    "total_proppant_per_perforated_interval": 1081.6345273363856,
    "first_prod_date_daily_calc": None,
    "createdAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "inptID": "INPTGmtl6v5bxk",
    "has_daily": False,
    "last_prod_date_daily": None,
    "dataPool": "external",
    "location": {
        "type": "Point",
        "coordinates": [-76.85558979, 41.71825390000001]
    },
    "toeLocation": {
        "type": "Point",
        "coordinates": [-76.8479101125493, 41.70813688692206]
    },
    "geohash": "dr3m74e6qynt",
    "chosenKeyID": "WellID",
    "mostRecentImport": ObjectId("5fb2f984af874989da757db9"),
    "mostRecentImportDesc": "kwalker20201116t171317",
    "mostRecentImportType": "spreadsheet",
    "mostRecentImportDate": datetime.fromisoformat("2020-11-16T22:13:24.095"),
    "county": "BRADFORD",
    "current_operator": "REPSOL",
    "first_fluid_volume": 77489,
    "first_prop_weight": 4016109,
    "landing_zone": "MARCELLUS",
    "perf_lateral_length": 3713,
    "surfaceLatitude": 41.71825390000001,
    "surfaceLongitude": -76.85558979,
    "toeLatitude": 41.70813688692206,
    "toeLongitude": -76.8479101125493,
    "well_name": "HARRIS 01 004 03 M 5H",
    "updatedAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "has_monthly": True,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2009-07-15T00:00:00.000"),
    "last_prod_date_monthly": datetime.fromisoformat("2020-05-01T00:00:00.000"),
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "undiscounted_roi": None,
    "schemaVersion": 1,
    "copied": False
}, {
    "_id": ObjectId("63766e07023757c1078ce5dd"),
    "chosenID": "840370000544711",
    "dataSource": "other",
    "project": ObjectId("63766e02023757c1078bfe7d"),
    "first_fluid_volume": None,
    "first_prod_date": None,
    "first_prop_weight": None,
    "lateral_length": None,
    "measured_depth": None,
    "perf_lateral_length": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": None,
    "createdAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "inptID": "INPTzggPAZWygd",
    "has_monthly": False,
    "last_prod_date_monthly": None,
    "has_daily": False,
    "last_prod_date_daily": None,
    "dataPool": "external",
    "location": {
        "type": "Point",
        "coordinates": [-77.472041, 41.188034]
    },
    "geohash": "dr2fm449dw53",
    "chosenKeyID": "WellID",
    "mostRecentImport": ObjectId("5fb2f984af874989da757db9"),
    "mostRecentImportDesc": "kwalker20201116t171317",
    "mostRecentImportType": "spreadsheet",
    "mostRecentImportDate": datetime.fromisoformat("2020-11-16T22:13:24.095"),
    "county": "CLINTON",
    "current_operator": "RANGE RESOURCES",
    "landing_zone": "MARCELLUS",
    "surfaceLatitude": 41.188034,
    "surfaceLongitude": -77.472041,
    "well_name": "PENNYPACKER 1H",
    "updatedAt": datetime.fromisoformat("2022-11-17T17:23:58.551"),
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "undiscounted_roi": None,
    "schemaVersion": 1,
    "copied": False
}, {
    "_id": ObjectId("63a0e8dce640e5a88bb7d9d6"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "lateral_length": None,
    "perf_lateral_length": 9908,
    "primary_product": None,
    "true_vertical_depth": 10781,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": 47.918406942,
    "surfaceLongitude": -102.887004053,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2013-08-15T00:00:00.000"),
    "chosenID": "3305304293",
    "api10": "3305304293",
    "api14": "33053042930100",
    "chosenKeyID": "API10",
    "completion_start_date": datetime.fromisoformat("2013-09-02T00:00:00.000"),
    "county": "MCKENZIE",
    "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "current_operator": "Hess",
    "custom_bool_0": False,
    "custom_bool_1": False,
    "custom_number_0": 100,
    "custom_number_1": 109,
    "field": "BLUE BUTTES",
    "first_prod_date": datetime.fromisoformat("2013-08-01T00:00:00.000"),
    "geohash": "c8wbderbzn3r",
    "has_daily": False,
    "has_monthly": True,
    "hole_direction": "H",
    "inptID": "INPTBSICb6I7ii",
    "last_prod_date_daily": None,
    "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000"),
    "lease_name": "BB-BURK-151-95",
    "location": {
        "type": "Point",
        "coordinates": [-102.887004053, 47.918406942]
    },
    "lower_perforation": 20839,
    "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167"),
    "mostRecentImportDesc": "Survey",
    "mostRecentImportType": "spreadsheet",
    "permit_date": datetime.fromisoformat("2012-08-10T00:00:00.000"),
    "range": "95W",
    "section": "7",
    "spud_date": datetime.fromisoformat("2013-06-15T00:00:00.000"),
    "state": "ND",
    "toeLatitude": 47.891607582,
    "toeLocation": {
        "type": "Point",
        "coordinates": [-102.893859182, 47.891607582]
    },
    "toeLongitude": -102.893859182,
    "township": "151N",
    "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "upper_perforation": 17474,
    "well_name": "BB-BURK-151-95 0718H-4",
    "well_number": "0718H-4",
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "basin": "Williston",
    "custom_string_2": "01PDP",
    "custom_string_5": "IHS PROD",
    "custom_string_8": "IHS PROD",
    "status": "A",
    "well_type": "OIL",
    "custom_number_2": 19,
    "custom_string_0": "UPPER THREE FORKS",
    "custom_string_1": "ACTUAL",
    "custom_string_10": "WILLISTON AOI",
    "custom_string_7": "WILLISTON_19",
    "custom_string_3": "ACTUAL",
    "type_curve_area": "2022_11_WILLISTON_1",
    "__v": 0,
    "mostRecentImport": ObjectId("63a0da346d559865423fa422"),
    "elevation": 2428,
    "has_directional_survey": True
}, {
    "_id": ObjectId("63a0e8dce640e5a88bb7d9d7"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "lateral_length": None,
    "perf_lateral_length": 8993,
    "primary_product": None,
    "true_vertical_depth": 7339,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": 40.204803119,
    "surfaceLongitude": -104.81658593,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2014-01-15T00:00:00.000"),
    "chosenID": "0512337761",
    "api10": "0512337761",
    "api14": "05123377610000",
    "chosenKeyID": "API10",
    "completion_start_date": datetime.fromisoformat("2014-01-24T00:00:00.000"),
    "county": "WELD",
    "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "current_operator": "OXY",
    "custom_bool_0": False,
    "custom_bool_1": False,
    "custom_number_0": 100,
    "field": "WATTENBERG",
    "first_prod_date": datetime.fromisoformat("2014-01-01T00:00:00.000"),
    "geohash": "9xjkwz4cuw8b",
    "has_daily": False,
    "has_monthly": True,
    "hole_direction": "H",
    "inptID": "INPTMO2pbhI5TT",
    "last_prod_date_daily": None,
    "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000"),
    "lease_name": "HARRIS FEDERAL",
    "location": {
        "type": "Point",
        "coordinates": [-104.81658593, 40.204803119]
    },
    "lower_perforation": 15575,
    "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167"),
    "mostRecentImportDesc": "Survey",
    "mostRecentImportType": "spreadsheet",
    "permit_date": datetime.fromisoformat("2013-07-26T00:00:00.000"),
    "range": "66W",
    "section": "19",
    "spud_date": datetime.fromisoformat("2013-07-31T00:00:00.000"),
    "state": "CO",
    "status": "A",
    "toeLatitude": 40.22942519,
    "toeLocation": {
        "type": "Point",
        "coordinates": [-104.818129889, 40.22942519]
    },
    "toeLongitude": -104.818129889,
    "township": "3N",
    "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "upper_perforation": 7703,
    "well_name": "HARRIS FEDERAL 15C-18HZ",
    "well_number": "15C-18HZ",
    "well_type": "OIL",
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "basin": "DJ",
    "custom_number_1": 93,
    "custom_string_2": "01PDP",
    "custom_string_5": "IHS PROD",
    "custom_string_8": "IHS PROD",
    "custom_number_2": 17,
    "custom_string_0": "Codell",
    "custom_string_1": "ACTUAL",
    "custom_string_10": "DJ AOI",
    "custom_string_7": "DJ_17",
    "custom_string_3": "ACTUAL",
    "type_curve_area": "CC_DJ_2019+_S GC",
    "__v": 0,
    "mostRecentImport": ObjectId("63a0da346d559865423fa422"),
    "elevation": 4857,
    "has_directional_survey": True,
    "closest_well_any_zone": ObjectId("63a0e8dce640e5a88bb7d9e0"),
    "hz_well_spacing_any_zone": 270.492,
    "vt_well_spacing_any_zone": 197.974
}, {
    "_id": ObjectId("63a0e8dce640e5a88bb7d9d8"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "lateral_length": None,
    "perf_lateral_length": 4907,
    "primary_product": None,
    "true_vertical_depth": 7108,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": 40.241588449,
    "surfaceLongitude": -104.79248009,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2013-12-15T00:00:00.000"),
    "chosenID": "0512337574",
    "api10": "0512337574",
    "api14": "05123375740000",
    "chosenKeyID": "API10",
    "completion_start_date": datetime.fromisoformat("2013-12-27T00:00:00.000"),
    "county": "WELD",
    "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "current_operator": "OXY",
    "custom_bool_0": False,
    "custom_bool_1": False,
    "custom_number_0": 100,
    "field": "WATTENBERG",
    "first_prod_date": datetime.fromisoformat("2013-12-01T00:00:00.000"),
    "geohash": "9xjkzmu2npz3",
    "has_daily": False,
    "has_monthly": True,
    "hole_direction": "H",
    "inptID": "INPT9RbMOJBC2w",
    "last_prod_date_daily": None,
    "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000"),
    "lease_name": "EISENACH FEDERAL",
    "location": {
        "type": "Point",
        "coordinates": [-104.79248009, 40.241588449]
    },
    "lower_perforation": 12059,
    "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167"),
    "mostRecentImportDesc": "Survey",
    "mostRecentImportType": "spreadsheet",
    "permit_date": datetime.fromisoformat("2013-06-13T00:00:00.000"),
    "range": "66W",
    "section": "8",
    "spud_date": datetime.fromisoformat("2013-07-16T00:00:00.000"),
    "state": "CO",
    "status": "A",
    "toeLatitude": 40.241861484,
    "toeLocation": {
        "type": "Point",
        "coordinates": [-104.810624621, 40.241861484]
    },
    "toeLongitude": -104.810624621,
    "township": "3N",
    "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "upper_perforation": 7532,
    "well_name": "EISENACH FEDERAL 5N-8HZ",
    "well_number": "5N-8HZ",
    "well_type": "OIL",
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "basin": "DJ",
    "custom_number_1": 107,
    "custom_string_2": "01PDP",
    "custom_string_5": "IHS PROD",
    "custom_string_8": "IHS PROD",
    "custom_number_2": 17,
    "custom_string_0": "Niobrara A",
    "custom_string_1": "ACTUAL",
    "custom_string_10": "DJ AOI",
    "custom_string_7": "DJ_17",
    "custom_string_3": "ACTUAL",
    "type_curve_area": "CC_DJ_2019+_S GC",
    "__v": 0,
    "mostRecentImport": ObjectId("63a0da346d559865423fa422"),
    "elevation": 4851,
    "has_directional_survey": True,
    "closest_well_any_zone": ObjectId("63a0e8dce640e5a88bb7d9e2"),
    "hz_well_spacing_any_zone": 647.226,
    "vt_well_spacing_any_zone": 29.384
}, {
    "_id": ObjectId("63a0e8dce640e5a88bb7d9d9"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "lateral_length": None,
    "perf_lateral_length": 9301,
    "primary_product": None,
    "true_vertical_depth": 7172,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": 40.205314366,
    "surfaceLongitude": -104.81328696,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2014-01-15T00:00:00.000"),
    "chosenID": "0512337638",
    "api10": "0512337638",
    "api14": "05123376380000",
    "chosenKeyID": "API10",
    "completion_start_date": datetime.fromisoformat("2014-02-05T00:00:00.000"),
    "county": "WELD",
    "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "current_operator": "OXY",
    "custom_bool_0": False,
    "custom_bool_1": False,
    "custom_number_0": 100,
    "field": "WATTENBERG",
    "first_prod_date": datetime.fromisoformat("2014-01-01T00:00:00.000"),
    "geohash": "9xjkwzjkcmud",
    "has_daily": False,
    "has_monthly": True,
    "hole_direction": "H",
    "inptID": "INPTW8PkPwCPWJ",
    "last_prod_date_daily": None,
    "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000"),
    "lease_name": "HARRIS FEDERAL",
    "location": {
        "type": "Point",
        "coordinates": [-104.81328696, 40.205314366]
    },
    "lower_perforation": 15975,
    "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167"),
    "mostRecentImportDesc": "Survey",
    "mostRecentImportType": "spreadsheet",
    "permit_date": datetime.fromisoformat("2013-06-28T00:00:00.000"),
    "range": "66W",
    "section": "19",
    "spud_date": datetime.fromisoformat("2013-09-03T00:00:00.000"),
    "state": "CO",
    "status": "A",
    "toeLatitude": 40.23077946,
    "toeLocation": {
        "type": "Point",
        "coordinates": [-104.814844247, 40.23077946]
    },
    "toeLongitude": -104.814844247,
    "township": "3N",
    "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "upper_perforation": 7601,
    "well_name": "HARRIS FEDERAL 16N-18HZ",
    "well_number": "16N-18HZ",
    "well_type": "OIL",
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "basin": "DJ",
    "custom_number_1": 103,
    "custom_string_2": "01PDP",
    "custom_string_5": "IHS PROD",
    "custom_string_8": "IHS PROD",
    "custom_number_2": 17,
    "custom_string_0": "Niobrara A",
    "custom_string_1": "ACTUAL",
    "custom_string_10": "DJ AOI",
    "custom_string_7": "DJ_17",
    "custom_string_3": "ACTUAL",
    "type_curve_area": "CC_DJ_2019+_S GC",
    "__v": 0,
    "mostRecentImport": ObjectId("63a0da346d559865423fa422"),
    "elevation": 4881,
    "has_directional_survey": True,
    "closest_well_any_zone": ObjectId("63a0e8dce640e5a88bb7d9e0"),
    "hz_well_spacing_any_zone": 1258.515,
    "vt_well_spacing_any_zone": 50.439
}, {
    "_id": ObjectId("63a0e8dce640e5a88bb7d9da"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "lateral_length": None,
    "perf_lateral_length": 9849,
    "primary_product": None,
    "true_vertical_depth": 10703,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": 47.918406837,
    "surfaceLongitude": -102.886800135,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2013-08-15T00:00:00.000"),
    "chosenID": "3305304292",
    "api10": "3305304292",
    "api14": "33053042920000",
    "chosenKeyID": "API10",
    "completion_start_date": datetime.fromisoformat("2013-08-24T00:00:00.000"),
    "county": "MCKENZIE",
    "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "current_operator": "Hess",
    "custom_bool_0": False,
    "custom_bool_1": False,
    "custom_number_0": 100,
    "custom_number_1": 107,
    "field": "BLUE BUTTES",
    "first_prod_date": datetime.fromisoformat("2013-08-01T00:00:00.000"),
    "geohash": "c8wbdg20gy3q",
    "has_daily": False,
    "has_monthly": True,
    "hole_direction": "H",
    "inptID": "INPT7WowB8Be1g",
    "last_prod_date_daily": None,
    "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000"),
    "lease_name": "BB-BURK-151-95",
    "location": {
        "type": "Point",
        "coordinates": [-102.886800135, 47.918406837]
    },
    "lower_perforation": 20325,
    "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167"),
    "mostRecentImportDesc": "Survey",
    "mostRecentImportType": "spreadsheet",
    "permit_date": datetime.fromisoformat("2012-08-10T00:00:00.000"),
    "range": "95W",
    "section": "7",
    "spud_date": datetime.fromisoformat("2013-03-08T00:00:00.000"),
    "state": "ND",
    "status": "A",
    "toeLatitude": 47.891605336,
    "toeLocation": {
        "type": "Point",
        "coordinates": [-102.891839295, 47.891605336]
    },
    "toeLongitude": -102.891839295,
    "township": "151N",
    "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "upper_perforation": 11125,
    "well_name": "BB-BURK-151-95 0718H-3",
    "well_number": "0718H-3",
    "well_type": "OIL",
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "basin": "Williston",
    "custom_string_2": "01PDP",
    "custom_string_5": "IHS PROD",
    "custom_string_8": "IHS PROD",
    "custom_number_2": 19,
    "custom_string_0": "MIDDLE BAKKEN",
    "custom_string_1": "ACTUAL",
    "custom_string_10": "WILLISTON AOI",
    "custom_string_7": "WILLISTON_19",
    "custom_string_3": "ACTUAL",
    "type_curve_area": "2022_11_WILLISTON_1",
    "__v": 0,
    "mostRecentImport": ObjectId("63a0da346d559865423fa422"),
    "elevation": 2430,
    "has_directional_survey": True,
    "closest_well_any_zone": ObjectId("63a0e8dce640e5a88bb7d9df"),
    "hz_well_spacing_any_zone": 606.337,
    "vt_well_spacing_any_zone": 70.001
}, {
    "_id": ObjectId("63a0e8dce640e5a88bb7d9db"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "lateral_length": None,
    "perf_lateral_length": 4591,
    "primary_product": None,
    "true_vertical_depth": 7180,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": 40.233065344,
    "surfaceLongitude": -104.80151768,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2014-01-15T00:00:00.000"),
    "chosenID": "0512337592",
    "api10": "0512337592",
    "api14": "05123375920000",
    "chosenKeyID": "API10",
    "completion_start_date": datetime.fromisoformat("2014-01-21T00:00:00.000"),
    "county": "WELD",
    "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "current_operator": "OXY",
    "custom_bool_0": False,
    "custom_bool_1": False,
    "custom_number_0": 100,
    "field": "WATTENBERG",
    "first_prod_date": datetime.fromisoformat("2014-01-01T00:00:00.000"),
    "geohash": "9xjkzhjyedur",
    "has_daily": False,
    "has_monthly": True,
    "hole_direction": "H",
    "inptID": "INPTipRkHKC64I",
    "last_prod_date_daily": None,
    "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000"),
    "lease_name": "BELLA FEDERAL",
    "location": {
        "type": "Point",
        "coordinates": [-104.80151768, 40.233065344]
    },
    "lower_perforation": 12030,
    "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167"),
    "mostRecentImportDesc": "Survey",
    "mostRecentImportType": "spreadsheet",
    "permit_date": datetime.fromisoformat("2013-06-24T00:00:00.000"),
    "range": "66W",
    "section": "8",
    "spud_date": datetime.fromisoformat("2013-08-07T00:00:00.000"),
    "state": "CO",
    "status": "A",
    "toeLatitude": 40.231933683,
    "toeLocation": {
        "type": "Point",
        "coordinates": [-104.81846559, 40.231933683]
    },
    "toeLongitude": -104.81846559,
    "township": "3N",
    "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "upper_perforation": 7544,
    "well_name": "BELLA FEDERAL 36N-7HZ",
    "well_number": "36N-7HZ",
    "well_type": "OIL",
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "basin": "DJ",
    "custom_number_1": 103,
    "custom_string_2": "01PDP",
    "custom_string_5": "IHS PROD",
    "custom_string_8": "IHS PROD",
    "custom_number_2": 17,
    "custom_string_0": "Niobrara C",
    "custom_string_1": "ACTUAL",
    "custom_string_10": "DJ AOI",
    "custom_string_7": "DJ_17",
    "custom_string_3": "ACTUAL",
    "type_curve_area": "CC_DJ_2019+_S GC",
    "__v": 0,
    "mostRecentImport": ObjectId("63a0da346d559865423fa422"),
    "elevation": 4892,
    "has_directional_survey": True,
    "closest_well_any_zone": ObjectId("63a0e8dce640e5a88bb7d9e9"),
    "hz_well_spacing_any_zone": 3073.357,
    "vt_well_spacing_any_zone": 143.405
}, {
    "_id": ObjectId("63a0e8dce640e5a88bb7d9dc"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "lateral_length": None,
    "perf_lateral_length": 9277,
    "primary_product": None,
    "true_vertical_depth": 7225,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": 40.205398144,
    "surfaceLongitude": -104.813241073,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2014-01-15T00:00:00.000"),
    "chosenID": "0512337639",
    "api10": "0512337639",
    "api14": "05123376390100",
    "chosenKeyID": "API10",
    "completion_start_date": datetime.fromisoformat("2014-02-05T00:00:00.000"),
    "county": "WELD",
    "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "current_operator": "OXY",
    "custom_bool_0": False,
    "custom_bool_1": False,
    "custom_number_0": 100,
    "field": "WATTENBERG",
    "first_prod_date": datetime.fromisoformat("2014-01-01T00:00:00.000"),
    "geohash": "9xjkwzjm6mqv",
    "has_daily": False,
    "has_monthly": True,
    "hole_direction": "H",
    "inptID": "INPTxMamRHQJPo",
    "last_prod_date_daily": None,
    "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000"),
    "lease_name": "HARRIS",
    "location": {
        "type": "Point",
        "coordinates": [-104.813241073, 40.205398144]
    },
    "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167"),
    "mostRecentImportDesc": "Survey",
    "mostRecentImportType": "spreadsheet",
    "permit_date": datetime.fromisoformat("2013-06-28T00:00:00.000"),
    "range": "66W",
    "section": "19",
    "spud_date": datetime.fromisoformat("2013-09-15T00:00:00.000"),
    "state": "CO",
    "toeLatitude": 40.230809852,
    "toeLocation": {
        "type": "Point",
        "coordinates": [-104.813668099, 40.230809852]
    },
    "toeLongitude": -104.813668099,
    "township": "3N",
    "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "well_name": "HARRIS 38N-18HZX",
    "well_number": "38N-18HZX",
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "basin": "DJ",
    "custom_number_1": 104,
    "custom_string_2": "01PDP",
    "custom_string_5": "IHS PROD",
    "custom_string_8": "IHS PROD",
    "lower_perforation": 16238,
    "status": "A",
    "upper_perforation": 7598,
    "well_type": "OIL",
    "custom_number_2": 17,
    "custom_string_0": "Niobrara B",
    "custom_string_1": "ACTUAL",
    "custom_string_10": "DJ AOI",
    "custom_string_7": "DJ_17",
    "custom_string_3": "ACTUAL",
    "type_curve_area": "CC_DJ_2019+_S GC",
    "__v": 0,
    "mostRecentImport": ObjectId("63a0da346d559865423fa422"),
    "elevation": 4883,
    "has_directional_survey": True
}, {
    "_id": ObjectId("63a0e8dce640e5a88bb7d9dd"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "lateral_length": None,
    "perf_lateral_length": 9802,
    "primary_product": None,
    "true_vertical_depth": 7299,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": 40.205082221,
    "surfaceLongitude": -104.80219552,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2021-01-15T00:00:00.000"),
    "chosenID": "0512350216",
    "api10": "0512350216",
    "api14": "05123502160000",
    "chosenKeyID": "API10",
    "completion_start_date": datetime.fromisoformat("2021-03-13T00:00:00.000"),
    "county": "WELD",
    "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "current_operator": "OXY",
    "custom_bool_0": False,
    "custom_bool_1": False,
    "custom_number_0": 100,
    "field": "WATTENBERG",
    "first_prod_date": datetime.fromisoformat("2021-01-01T00:00:00.000"),
    "geohash": "9xjkxpj7efe1",
    "has_daily": False,
    "has_monthly": True,
    "hole_direction": "H",
    "inptID": "INPTUMMs3mlG4R",
    "last_prod_date_daily": None,
    "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000"),
    "lease_name": "BARCLAY FARMS",
    "location": {
        "type": "Point",
        "coordinates": [-104.80219552, 40.205082221]
    },
    "lower_perforation": 18285,
    "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167"),
    "mostRecentImportDesc": "Survey",
    "mostRecentImportType": "spreadsheet",
    "permit_date": datetime.fromisoformat("2019-06-19T00:00:00.000"),
    "range": "66W",
    "section": "20",
    "spud_date": datetime.fromisoformat("2019-10-09T00:00:00.000"),
    "state": "CO",
    "status": "A",
    "toeLatitude": 40.23189168,
    "toeLocation": {
        "type": "Point",
        "coordinates": [-104.804698827, 40.23189168]
    },
    "toeLongitude": -104.804698827,
    "township": "3N",
    "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "upper_perforation": 7841,
    "well_name": "BARCLAY FARMS 20-7HZ",
    "well_number": "20-7HZ",
    "well_type": "OIL",
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "basin": "DJ",
    "custom_number_1": 22,
    "custom_string_2": "01PDP",
    "custom_string_5": "IHS PROD",
    "custom_string_8": "IHS PROD",
    "custom_number_2": 17,
    "custom_string_0": "Niobrara B",
    "custom_string_1": "ACTUAL",
    "custom_string_10": "DJ AOI",
    "custom_string_7": "DJ_17",
    "custom_string_3": "ACTUAL",
    "type_curve_area": "CC_DJ_2019+_S GC",
    "__v": 0,
    "mostRecentImport": ObjectId("63a0da346d559865423fa422"),
    "elevation": 4939,
    "has_directional_survey": True,
    "closest_well_any_zone": ObjectId("63a0e8dce640e5a88bb7d9f2"),
    "hz_well_spacing_any_zone": 320.282,
    "vt_well_spacing_any_zone": 69.398
}, {
    "_id": ObjectId("63a0e8dce640e5a88bb7d9de"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "lateral_length": None,
    "perf_lateral_length": 9789,
    "primary_product": None,
    "true_vertical_depth": 7159,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": 40.205165221,
    "surfaceLongitude": -104.80219452,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2021-01-15T00:00:00.000"),
    "chosenID": "0512350215",
    "api10": "0512350215",
    "api14": "05123502150000",
    "chosenKeyID": "API10",
    "completion_start_date": datetime.fromisoformat("2021-03-15T00:00:00.000"),
    "county": "WELD",
    "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "current_operator": "OXY",
    "custom_bool_0": False,
    "custom_bool_1": False,
    "custom_number_0": 100,
    "field": "WATTENBERG",
    "first_prod_date": datetime.fromisoformat("2021-01-01T00:00:00.000"),
    "geohash": "9xjkxpjk5f5b",
    "has_daily": False,
    "has_monthly": True,
    "hole_direction": "H",
    "inptID": "INPTlCIsTF0Qg3",
    "last_prod_date_daily": None,
    "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000"),
    "lease_name": "BARCLAY FARMS",
    "location": {
        "type": "Point",
        "coordinates": [-104.80219452, 40.205165221]
    },
    "lower_perforation": 18423,
    "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167"),
    "mostRecentImportDesc": "Survey",
    "mostRecentImportType": "spreadsheet",
    "permit_date": datetime.fromisoformat("2019-06-19T00:00:00.000"),
    "range": "66W",
    "section": "20",
    "spud_date": datetime.fromisoformat("2019-10-18T00:00:00.000"),
    "state": "CO",
    "status": "A",
    "toeLatitude": 40.231785997,
    "toeLocation": {
        "type": "Point",
        "coordinates": [-104.806949019, 40.231785997]
    },
    "toeLongitude": -104.806949019,
    "township": "3N",
    "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "upper_perforation": 8073,
    "well_name": "BARCLAY FARMS 20-5HZ",
    "well_number": "20-5HZ",
    "well_type": "OIL",
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "basin": "DJ",
    "custom_number_1": 22,
    "custom_string_2": "01PDP",
    "custom_string_5": "IHS PROD",
    "custom_string_8": "IHS PROD",
    "custom_number_2": 17,
    "custom_string_0": "Niobrara B",
    "custom_string_1": "ACTUAL",
    "custom_string_10": "DJ AOI",
    "custom_string_7": "DJ_17",
    "custom_string_3": "ACTUAL",
    "type_curve_area": "CC_DJ_2019+_S GC",
    "__v": 0,
    "mostRecentImport": ObjectId("63a0da346d559865423fa422"),
    "elevation": 4939,
    "has_directional_survey": True,
    "closest_well_any_zone": ObjectId("63a0e8dce640e5a88bb7d9ea"),
    "hz_well_spacing_any_zone": 304.225,
    "vt_well_spacing_any_zone": 75.449
}, {
    "_id": ObjectId("63a0e8dce640e5a88bb7d9df"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "lateral_length": None,
    "perf_lateral_length": 9797,
    "primary_product": None,
    "true_vertical_depth": 10769,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": 47.918406731,
    "surfaceLongitude": -102.886596217,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2013-08-15T00:00:00.000"),
    "chosenID": "3305304291",
    "api10": "3305304291",
    "api14": "33053042910000",
    "chosenKeyID": "API10",
    "completion_start_date": datetime.fromisoformat("2013-08-13T00:00:00.000"),
    "county": "MCKENZIE",
    "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "current_operator": "Hess",
    "custom_bool_0": False,
    "custom_bool_1": False,
    "custom_number_0": 100,
    "custom_number_1": 107,
    "field": "BLUE BUTTES",
    "first_prod_date": datetime.fromisoformat("2013-08-01T00:00:00.000"),
    "geohash": "c8wbdg22bw3q",
    "has_daily": False,
    "has_monthly": True,
    "hole_direction": "H",
    "inptID": "INPT33M3tj3vNC",
    "last_prod_date_daily": None,
    "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000"),
    "lease_name": "BB-BURK-151-95",
    "location": {
        "type": "Point",
        "coordinates": [-102.886596217, 47.918406731]
    },
    "lower_perforation": 20340,
    "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167"),
    "mostRecentImportDesc": "Survey",
    "mostRecentImportType": "spreadsheet",
    "permit_date": datetime.fromisoformat("2012-08-10T00:00:00.000"),
    "range": "95W",
    "section": "7",
    "spud_date": datetime.fromisoformat("2013-03-21T00:00:00.000"),
    "state": "ND",
    "status": "A",
    "toeLatitude": 47.891607575,
    "toeLocation": {
        "type": "Point",
        "coordinates": [-102.889108912, 47.891607575]
    },
    "toeLongitude": -102.889108912,
    "township": "151N",
    "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "upper_perforation": 11195,
    "well_name": "BB-BURK-151-95 0718H-2",
    "well_number": "0718H-2",
    "well_type": "OIL",
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "basin": "Williston",
    "custom_string_2": "01PDP",
    "custom_string_5": "IHS PROD",
    "custom_string_8": "IHS PROD",
    "custom_number_2": 19,
    "custom_string_0": "UPPER THREE FORKS",
    "custom_string_1": "ACTUAL",
    "custom_string_10": "WILLISTON AOI",
    "custom_string_7": "WILLISTON_19",
    "custom_string_3": "ACTUAL",
    "type_curve_area": "2022_11_WILLISTON_1",
    "__v": 0,
    "mostRecentImport": ObjectId("63a0da346d559865423fa422"),
    "elevation": 2430,
    "has_directional_survey": True,
    "closest_well_any_zone": ObjectId("63a0e8dce640e5a88bb7d9da"),
    "hz_well_spacing_any_zone": 606.337,
    "vt_well_spacing_any_zone": 70.001
}, {
    "_id": ObjectId("63a0e8dce640e5a88bb7d9e0"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "lateral_length": None,
    "perf_lateral_length": 9467,
    "primary_product": None,
    "true_vertical_depth": 7139,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": 40.204885119,
    "surfaceLongitude": -104.81659593,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2014-01-15T00:00:00.000"),
    "chosenID": "0512337762",
    "api10": "0512337762",
    "api14": "05123377620000",
    "chosenKeyID": "API10",
    "completion_start_date": datetime.fromisoformat("2014-01-24T00:00:00.000"),
    "county": "WELD",
    "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "current_operator": "OXY",
    "custom_bool_0": False,
    "custom_bool_1": False,
    "custom_number_0": 100,
    "field": "WATTENBERG",
    "first_prod_date": datetime.fromisoformat("2014-01-01T00:00:00.000"),
    "geohash": "9xjkwz4fkmc3",
    "has_daily": False,
    "has_monthly": True,
    "hole_direction": "H",
    "inptID": "INPTV1jbYvkPLH",
    "last_prod_date_daily": None,
    "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000"),
    "lease_name": "HARRIS FEDERAL",
    "location": {
        "type": "Point",
        "coordinates": [-104.81659593, 40.204885119]
    },
    "lower_perforation": 15815,
    "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167"),
    "mostRecentImportDesc": "Survey",
    "mostRecentImportType": "spreadsheet",
    "permit_date": datetime.fromisoformat("2013-07-26T00:00:00.000"),
    "range": "66W",
    "section": "19",
    "spud_date": datetime.fromisoformat("2013-08-02T00:00:00.000"),
    "state": "CO",
    "status": "A",
    "toeLatitude": 40.230779491,
    "toeLocation": {
        "type": "Point",
        "coordinates": [-104.818994218, 40.230779491]
    },
    "toeLongitude": -104.818994218,
    "township": "3N",
    "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "upper_perforation": 7665,
    "well_name": "HARRIS FEDERAL 36N-E18HZ",
    "well_number": "36N-E18HZ",
    "well_type": "OIL",
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "basin": "DJ",
    "custom_number_1": 104,
    "custom_string_2": "01PDP",
    "custom_string_5": "IHS PROD",
    "custom_string_8": "IHS PROD",
    "custom_number_2": 17,
    "custom_string_0": "Niobrara A",
    "custom_string_1": "ACTUAL",
    "custom_string_10": "DJ AOI",
    "custom_string_7": "DJ_17",
    "custom_string_3": "ACTUAL",
    "type_curve_area": "CC_DJ_2019+_S GC",
    "__v": 0,
    "mostRecentImport": ObjectId("63a0da346d559865423fa422"),
    "elevation": 4857,
    "has_directional_survey": True,
    "closest_well_any_zone": ObjectId("63a0e8dce640e5a88bb7d9d7"),
    "hz_well_spacing_any_zone": 270.492,
    "vt_well_spacing_any_zone": 197.974
}, {
    "_id": ObjectId("63a0e8dce640e5a88bb7d9e1"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "lateral_length": None,
    "perf_lateral_length": 10179,
    "primary_product": None,
    "true_vertical_depth": 10633,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": 47.89153873,
    "surfaceLongitude": -102.879127036,
    "first_proppant_per_fluid": None,
    "refrac_proppant_per_perforated_interval": None,
    "refrac_fluid_per_perforated_interval": None,
    "refrac_proppant_per_fluid": None,
    "total_fluid_volume": None,
    "total_prop_weight": None,
    "total_proppant_per_fluid": None,
    "first_proppant_per_perforated_interval": None,
    "first_fluid_per_perforated_interval": None,
    "total_fluid_per_perforated_interval": None,
    "total_proppant_per_perforated_interval": None,
    "first_prod_date_daily_calc": None,
    "first_prod_date_monthly_calc": datetime.fromisoformat("2018-09-15T00:00:00.000"),
    "chosenID": "3305308164",
    "api10": "3305308164",
    "api14": "33053081640000",
    "chosenKeyID": "API10",
    "completion_start_date": datetime.fromisoformat("2018-09-10T00:00:00.000"),
    "county": "MCKENZIE",
    "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "current_operator": "Hess",
    "custom_bool_0": False,
    "custom_bool_1": False,
    "custom_number_0": 100,
    "custom_number_1": 50,
    "field": "BLUE BUTTES",
    "first_prod_date": datetime.fromisoformat("2018-09-01T00:00:00.000"),
    "geohash": "c8wb6ymsqtfu",
    "has_daily": False,
    "has_monthly": True,
    "hole_direction": "H",
    "inptID": "INPTxgp2HjBw6O",
    "last_prod_date_daily": None,
    "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000"),
    "lease_name": "BB-BURK",
    "location": {
        "type": "Point",
        "coordinates": [-102.879127036, 47.89153873]
    },
    "lower_perforation": 20838,
    "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167"),
    "mostRecentImportDesc": "Survey",
    "mostRecentImportType": "spreadsheet",
    "permit_date": datetime.fromisoformat("2017-09-11T00:00:00.000"),
    "range": "95W",
    "section": "18",
    "spud_date": datetime.fromisoformat("2018-03-28T00:00:00.000"),
    "state": "ND",
    "status": "A",
    "toeLatitude": 47.919431119,
    "toeLocation": {
        "type": "Point",
        "coordinates": [-102.881567353, 47.919431119]
    },
    "toeLongitude": -102.881567353,
    "township": "151N",
    "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766"),
    "upper_perforation": 10910,
    "well_name": "BB-BURK 151-95-1807H-7",
    "well_number": "151-95-1807H-7",
    "well_type": "OIL",
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "basin": "Williston",
    "custom_string_2": "01PDP",
    "custom_string_5": "IHS PROD",
    "custom_string_8": "IHS PROD",
    "custom_number_2": 19,
    "custom_string_0": "MIDDLE BAKKEN",
    "custom_string_1": "ACTUAL",
    "custom_string_10": "WILLISTON AOI",
    "custom_string_7": "WILLISTON_19",
    "custom_string_3": "ACTUAL",
    "type_curve_area": "2022_11_WILLISTON_1",
    "__v": 0,
    "mostRecentImport": ObjectId("63a0da346d559865423fa422"),
    "elevation": 2412,
    "has_directional_survey": True,
    "closest_well_any_zone": ObjectId("63a0e8dce640e5a88bb7d9e3"),
    "hz_well_spacing_any_zone": 243.608,
    "vt_well_spacing_any_zone": 71.469
}]

FORECASTS_FIXTURE = []

ECON_RUN_OUTPUT_1_2_FIXTURE = [{
    'assignment_id': ObjectId('643dbfbfccae6148ebc0ea3a'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63766e07023757c1078ce5d6'),
        'chosenID': '840370000540962',
        'dataSource': 'other',
        'project': ObjectId('63766e02023757c1078bfe7d'),
        'first_prod_date': None,
        'lateral_length': None,
        'measured_depth': None,
        'primary_product': None,
        'true_vertical_depth': None,
        'first_proppant_per_fluid': 1.4447770417983672,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': 52473,
        'total_prop_weight': 3184095,
        'total_proppant_per_fluid': 1.4447770417983672,
        'first_proppant_per_perforated_interval': 1140.0268528464017,
        'first_fluid_per_perforated_interval': 18.78732545649839,
        'total_fluid_per_perforated_interval': 18.78732545649839,
        'total_proppant_per_perforated_interval': 1140.0268528464017,
        'first_prod_date_daily_calc': None,
        'createdAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'inptID': 'INPTyskb0UoRaz',
        'has_daily': False,
        'last_prod_date_daily': None,
        'dataPool': 'external',
        'location': {
            'type': 'Point',
            'coordinates': [-76.859738, 41.769419]
        },
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-76.85829374122999, 41.76803291505431]
        },
        'geohash': 'dr3me5bkw219',
        'chosenKeyID': 'WellID',
        'mostRecentImport': ObjectId('5fb2f984af874989da757db9'),
        'mostRecentImportDesc': 'kwalker20201116t171317',
        'mostRecentImportType': 'spreadsheet',
        'mostRecentImportDate': datetime(2020, 11, 16, 22, 13, 24, 95000),
        'county': 'BRADFORD',
        'current_operator': 'REPSOL',
        'first_fluid_volume': 52473,
        'first_prop_weight': 3184095,
        'landing_zone': 'MARCELLUS',
        'perf_lateral_length': 2793,
        'surfaceLatitude': 41.769419,
        'surfaceLongitude': -76.859738,
        'toeLatitude': 41.76803291505431,
        'toeLongitude': -76.85829374122999,
        'well_name': 'MORGAN 01 074 03 W 3H',
        'updatedAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'has_monthly': True,
        'first_prod_date_monthly_calc': datetime(2011, 4, 15, 0, 0),
        'last_prod_date_monthly': datetime(2020, 5, 1, 0, 0),
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'undiscounted_roi': None,
        'schemaVersion': 1,
        'copied': False
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {},
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('643dbfbfccae6148ebc0ea3b'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63766e07023757c1078ce5d7'),
        'chosenID': '840370000540963',
        'dataSource': 'other',
        'project': ObjectId('63766e02023757c1078bfe7d'),
        'first_fluid_volume': None,
        'first_prod_date': None,
        'first_prop_weight': None,
        'lateral_length': None,
        'measured_depth': None,
        'primary_product': None,
        'true_vertical_depth': None,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': None,
        'createdAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'inptID': 'INPTMO7FZwP0Ui',
        'has_monthly': False,
        'last_prod_date_monthly': None,
        'has_daily': False,
        'last_prod_date_daily': None,
        'dataPool': 'external',
        'location': {
            'type': 'Point',
            'coordinates': [-76.860006, 41.769678]
        },
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-76.870161, 41.783814]
        },
        'geohash': 'dr3me5bq003d',
        'chosenKeyID': 'WellID',
        'mostRecentImport': ObjectId('5fb2f984af874989da757db9'),
        'mostRecentImportDesc': 'kwalker20201116t171317',
        'mostRecentImportType': 'spreadsheet',
        'mostRecentImportDate': datetime(2020, 11, 16, 22, 13, 24, 95000),
        'county': 'BRADFORD',
        'current_operator': 'REPSOL',
        'landing_zone': 'MARCELLUS',
        'perf_lateral_length': 5180,
        'surfaceLatitude': 41.769678,
        'surfaceLongitude': -76.860006,
        'toeLatitude': 41.783814,
        'toeLongitude': -76.870161,
        'well_name': 'MORGAN 01 074 05 W 5H',
        'updatedAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'undiscounted_roi': None,
        'schemaVersion': 1,
        'copied': False
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {},
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('643dbfbfccae6148ebc0ea3c'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63766e07023757c1078ce5d8'),
        'chosenID': '840370000541639',
        'dataSource': 'other',
        'project': ObjectId('63766e02023757c1078bfe7d'),
        'first_prod_date': None,
        'lateral_length': None,
        'measured_depth': None,
        'primary_product': None,
        'true_vertical_depth': None,
        'first_proppant_per_fluid': 1.437155855899498,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': 58980,
        'total_prop_weight': 3560065,
        'total_proppant_per_fluid': 1.437155855899498,
        'first_proppant_per_perforated_interval': 1129.104027909927,
        'first_fluid_per_perforated_interval': 18.705994291151285,
        'total_fluid_per_perforated_interval': 18.705994291151285,
        'total_proppant_per_perforated_interval': 1129.104027909927,
        'first_prod_date_daily_calc': None,
        'createdAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'inptID': 'INPTcYKWToCRUX',
        'has_daily': False,
        'last_prod_date_daily': None,
        'dataPool': 'external',
        'location': {
            'type': 'Point',
            'coordinates': [-76.859647, 41.769424]
        },
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-76.85288556327617, 41.76199550314993]
        },
        'geohash': 'dr3me5bs82vr',
        'chosenKeyID': 'WellID',
        'mostRecentImport': ObjectId('5fb2f984af874989da757db9'),
        'mostRecentImportDesc': 'kwalker20201116t171317',
        'mostRecentImportType': 'spreadsheet',
        'mostRecentImportDate': datetime(2020, 11, 16, 22, 13, 24, 95000),
        'county': 'BRADFORD',
        'current_operator': 'REPSOL',
        'first_fluid_volume': 58980,
        'first_prop_weight': 3560065,
        'landing_zone': 'MARCELLUS',
        'perf_lateral_length': 3153,
        'surfaceLatitude': 41.769424,
        'surfaceLongitude': -76.859647,
        'toeLatitude': 41.76199550314993,
        'toeLongitude': -76.85288556327617,
        'well_name': 'MORGAN 01 074 04 W 4H',
        'updatedAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'has_monthly': True,
        'first_prod_date_monthly_calc': datetime(2011, 4, 15, 0, 0),
        'last_prod_date_monthly': datetime(2020, 5, 1, 0, 0),
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'undiscounted_roi': None,
        'schemaVersion': 1,
        'copied': False
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {},
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('643dbfbfccae6148ebc0ea3d'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63766e07023757c1078ce5d9'),
        'chosenID': '840370000543365',
        'dataSource': 'other',
        'project': ObjectId('63766e02023757c1078bfe7d'),
        'first_fluid_volume': None,
        'first_prod_date': None,
        'first_prop_weight': None,
        'lateral_length': None,
        'measured_depth': None,
        'perf_lateral_length': None,
        'primary_product': None,
        'true_vertical_depth': None,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': None,
        'createdAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'inptID': 'INPTDNrFFxjCeE',
        'has_monthly': False,
        'last_prod_date_monthly': None,
        'has_daily': False,
        'last_prod_date_daily': None,
        'dataPool': 'external',
        'location': {
            'type': 'Point',
            'coordinates': [-76.854981, 41.605189]
        },
        'geohash': 'dr3kejgzv1ke',
        'chosenKeyID': 'WellID',
        'mostRecentImport': ObjectId('5fb2f984af874989da757db9'),
        'mostRecentImportDesc': 'kwalker20201116t171317',
        'mostRecentImportType': 'spreadsheet',
        'mostRecentImportDate': datetime(2020, 11, 16, 22, 13, 24, 95000),
        'county': 'BRADFORD',
        'current_operator': 'SHELL',
        'landing_zone': 'MARCELLUS',
        'surfaceLatitude': 41.605189,
        'surfaceLongitude': -76.854981,
        'well_name': 'HICKOK 114 8H',
        'updatedAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'undiscounted_roi': None,
        'schemaVersion': 1,
        'copied': False
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {},
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('643dbfbfccae6148ebc0ea3e'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63766e07023757c1078ce5da'),
        'chosenID': '840370000543967',
        'dataSource': 'other',
        'project': ObjectId('63766e02023757c1078bfe7d'),
        'first_fluid_volume': None,
        'first_prod_date': None,
        'first_prop_weight': None,
        'lateral_length': None,
        'measured_depth': None,
        'primary_product': None,
        'true_vertical_depth': None,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': None,
        'createdAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'inptID': 'INPTvqFrLTA6Hi',
        'has_monthly': False,
        'last_prod_date_monthly': None,
        'has_daily': False,
        'last_prod_date_daily': None,
        'dataPool': 'external',
        'location': {
            'type': 'Point',
            'coordinates': [-76.855694, 41.718206]
        },
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-76.858992, 41.725914]
        },
        'geohash': 'dr3m74e6ht2b',
        'chosenKeyID': 'WellID',
        'mostRecentImport': ObjectId('5fb2f984af874989da757db9'),
        'mostRecentImportDesc': 'kwalker20201116t171317',
        'mostRecentImportType': 'spreadsheet',
        'mostRecentImportDate': datetime(2020, 11, 16, 22, 13, 24, 95000),
        'county': 'BRADFORD',
        'current_operator': 'REPSOL',
        'landing_zone': 'MARCELLUS',
        'perf_lateral_length': 2282,
        'surfaceLatitude': 41.718206,
        'surfaceLongitude': -76.855694,
        'toeLatitude': 41.725914,
        'toeLongitude': -76.858992,
        'well_name': 'HARRIS M 2H',
        'updatedAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'undiscounted_roi': None,
        'schemaVersion': 1,
        'copied': False
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {},
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('643dbfbfccae6148ebc0ea3f'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63766e07023757c1078ce5db'),
        'chosenID': '840370000543982',
        'dataSource': 'other',
        'project': ObjectId('63766e02023757c1078bfe7d'),
        'first_prod_date': None,
        'lateral_length': None,
        'measured_depth': None,
        'primary_product': None,
        'true_vertical_depth': None,
        'first_proppant_per_fluid': 1.2340027985538962,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': 77489,
        'total_prop_weight': 4016109,
        'total_proppant_per_fluid': 1.2340027985538962,
        'first_proppant_per_perforated_interval': 1081.6345273363856,
        'first_fluid_per_perforated_interval': 20.869647185564233,
        'total_fluid_per_perforated_interval': 20.869647185564233,
        'total_proppant_per_perforated_interval': 1081.6345273363856,
        'first_prod_date_daily_calc': None,
        'createdAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'inptID': 'INPTGmtl6v5bxk',
        'has_daily': False,
        'last_prod_date_daily': None,
        'dataPool': 'external',
        'location': {
            'type': 'Point',
            'coordinates': [-76.85558979, 41.71825390000001]
        },
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-76.8479101125493, 41.70813688692206]
        },
        'geohash': 'dr3m74e6qynt',
        'chosenKeyID': 'WellID',
        'mostRecentImport': ObjectId('5fb2f984af874989da757db9'),
        'mostRecentImportDesc': 'kwalker20201116t171317',
        'mostRecentImportType': 'spreadsheet',
        'mostRecentImportDate': datetime(2020, 11, 16, 22, 13, 24, 95000),
        'county': 'BRADFORD',
        'current_operator': 'REPSOL',
        'first_fluid_volume': 77489,
        'first_prop_weight': 4016109,
        'landing_zone': 'MARCELLUS',
        'perf_lateral_length': 3713,
        'surfaceLatitude': 41.71825390000001,
        'surfaceLongitude': -76.85558979,
        'toeLatitude': 41.70813688692206,
        'toeLongitude': -76.8479101125493,
        'well_name': 'HARRIS 01 004 03 M 5H',
        'updatedAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'has_monthly': True,
        'first_prod_date_monthly_calc': datetime(2009, 7, 15, 0, 0),
        'last_prod_date_monthly': datetime(2020, 5, 1, 0, 0),
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'undiscounted_roi': None,
        'schemaVersion': 1,
        'copied': False
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {},
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('643dbfbfccae6148ebc0ea40'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63766e07023757c1078ce5dc'),
        'chosenID': '840370000544709',
        'dataSource': 'other',
        'project': ObjectId('63766e02023757c1078bfe7d'),
        'first_fluid_volume': None,
        'first_prod_date': None,
        'first_prop_weight': None,
        'lateral_length': None,
        'measured_depth': None,
        'perf_lateral_length': None,
        'primary_product': None,
        'true_vertical_depth': None,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': None,
        'createdAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'inptID': 'INPTbX9Fscq1vz',
        'has_monthly': False,
        'last_prod_date_monthly': None,
        'has_daily': False,
        'last_prod_date_daily': None,
        'dataPool': 'external',
        'location': {
            'type': 'Point',
            'coordinates': [-77.467374, 41.230617]
        },
        'geohash': 'dr2ft1vcz256',
        'chosenKeyID': 'WellID',
        'mostRecentImport': ObjectId('5fb2f984af874989da757db9'),
        'mostRecentImportDesc': 'kwalker20201116t171317',
        'mostRecentImportType': 'spreadsheet',
        'mostRecentImportDate': datetime(2020, 11, 16, 22, 13, 24, 95000),
        'county': 'CLINTON',
        'current_operator': 'RANGE RESOURCES',
        'landing_zone': 'LOCK HAVEN',
        'surfaceLatitude': 41.230617,
        'surfaceLongitude': -77.467374,
        'well_name': 'MOHAWK LODGE UNIT 1',
        'updatedAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'undiscounted_roi': None,
        'schemaVersion': 1,
        'copied': False
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {},
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('643dbfbfccae6148ebc0ea41'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63766e07023757c1078ce5dd'),
        'chosenID': '840370000544711',
        'dataSource': 'other',
        'project': ObjectId('63766e02023757c1078bfe7d'),
        'first_fluid_volume': None,
        'first_prod_date': None,
        'first_prop_weight': None,
        'lateral_length': None,
        'measured_depth': None,
        'perf_lateral_length': None,
        'primary_product': None,
        'true_vertical_depth': None,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': None,
        'createdAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'inptID': 'INPTzggPAZWygd',
        'has_monthly': False,
        'last_prod_date_monthly': None,
        'has_daily': False,
        'last_prod_date_daily': None,
        'dataPool': 'external',
        'location': {
            'type': 'Point',
            'coordinates': [-77.472041, 41.188034]
        },
        'geohash': 'dr2fm449dw53',
        'chosenKeyID': 'WellID',
        'mostRecentImport': ObjectId('5fb2f984af874989da757db9'),
        'mostRecentImportDesc': 'kwalker20201116t171317',
        'mostRecentImportType': 'spreadsheet',
        'mostRecentImportDate': datetime(2020, 11, 16, 22, 13, 24, 95000),
        'county': 'CLINTON',
        'current_operator': 'RANGE RESOURCES',
        'landing_zone': 'MARCELLUS',
        'surfaceLatitude': 41.188034,
        'surfaceLongitude': -77.472041,
        'well_name': 'PENNYPACKER 1H',
        'updatedAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'undiscounted_roi': None,
        'schemaVersion': 1,
        'copied': False
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {},
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('643dbfbfccae6148ebc0ea42'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63766e07023757c1078ce5de'),
        'chosenID': '840370000544713',
        'dataSource': 'other',
        'project': ObjectId('63766e02023757c1078bfe7d'),
        'first_prod_date': None,
        'lateral_length': None,
        'measured_depth': None,
        'primary_product': None,
        'true_vertical_depth': None,
        'first_proppant_per_fluid': 0.9171166086388858,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': 126048,
        'total_prop_weight': 4855230,
        'total_proppant_per_fluid': 0.9171166086388858,
        'first_proppant_per_perforated_interval': 889.7251236943375,
        'first_fluid_per_perforated_interval': 23.09840571742716,
        'total_fluid_per_perforated_interval': 23.09840571742716,
        'total_proppant_per_perforated_interval': 889.7251236943375,
        'first_prod_date_daily_calc': None,
        'createdAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'inptID': 'INPTbo6f0JMs5F',
        'has_daily': False,
        'last_prod_date_daily': None,
        'dataPool': 'external',
        'location': {
            'type': 'Point',
            'coordinates': [-77.591731, 41.192831]
        },
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-77.58051834862282, 41.178251475493184]
        },
        'geohash': 'dr2f66gmts7b',
        'chosenKeyID': 'WellID',
        'mostRecentImport': ObjectId('5fb2f984af874989da757db9'),
        'mostRecentImportDesc': 'kwalker20201116t171317',
        'mostRecentImportType': 'spreadsheet',
        'mostRecentImportDate': datetime(2020, 11, 16, 22, 13, 24, 95000),
        'county': 'CLINTON',
        'current_operator': 'ALTA RESOURCES',
        'first_fluid_volume': 126048,
        'first_prop_weight': 4855230,
        'landing_zone': 'MARCELLUS',
        'perf_lateral_length': 5457,
        'surfaceLatitude': 41.192831,
        'surfaceLongitude': -77.591731,
        'toeLatitude': 41.178251475493184,
        'toeLongitude': -77.58051834862282,
        'well_name': 'COP TRACT 252 B1002H',
        'updatedAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'has_monthly': True,
        'first_prod_date_monthly_calc': datetime(2010, 12, 15, 0, 0),
        'last_prod_date_monthly': datetime(2020, 5, 1, 0, 0),
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'undiscounted_roi': None,
        'schemaVersion': 1,
        'copied': False
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {},
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('643dbfbfccae6148ebc0ea43'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63766e07023757c1078ce5df'),
        'chosenID': '840370000544716',
        'dataSource': 'other',
        'project': ObjectId('63766e02023757c1078bfe7d'),
        'first_prod_date': None,
        'lateral_length': None,
        'measured_depth': None,
        'primary_product': None,
        'true_vertical_depth': None,
        'first_proppant_per_fluid': 1.1445583278919909,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': 101078,
        'total_prop_weight': 4858966,
        'total_proppant_per_fluid': 1.1445583278919909,
        'first_proppant_per_perforated_interval': 999.3759769642122,
        'first_fluid_per_perforated_interval': 20.78938708350473,
        'total_fluid_per_perforated_interval': 20.78938708350473,
        'total_proppant_per_perforated_interval': 999.3759769642122,
        'first_prod_date_daily_calc': None,
        'createdAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'inptID': 'INPTFzjuuyYwyH',
        'has_daily': False,
        'last_prod_date_daily': None,
        'dataPool': 'external',
        'location': {
            'type': 'Point',
            'coordinates': [-77.56584, 41.371355]
        },
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-77.57665976433465, 41.385756073962646]
        },
        'geohash': 'dr2g6gqm8gt9',
        'chosenKeyID': 'WellID',
        'mostRecentImport': ObjectId('5fb2f984af874989da757db9'),
        'mostRecentImportDesc': 'kwalker20201116t171317',
        'mostRecentImportType': 'spreadsheet',
        'mostRecentImportDate': datetime(2020, 11, 16, 22, 13, 24, 95000),
        'county': 'CLINTON',
        'current_operator': 'ALTA RESOURCES',
        'first_fluid_volume': 101078,
        'first_prop_weight': 4858966,
        'landing_zone': 'MARCELLUS',
        'perf_lateral_length': 4862,
        'surfaceLatitude': 41.371355,
        'surfaceLongitude': -77.56584,
        'toeLatitude': 41.385756073962646,
        'toeLongitude': -77.57665976433465,
        'well_name': 'COP TRACT 285 A1007H',
        'updatedAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'has_monthly': True,
        'first_prod_date_monthly_calc': datetime(2010, 12, 15, 0, 0),
        'last_prod_date_monthly': datetime(2020, 5, 1, 0, 0),
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'undiscounted_roi': None,
        'schemaVersion': 1,
        'copied': False
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {},
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('643dbfbfccae6148ebc0ea44'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63766e07023757c1078ce5e0'),
        'chosenID': '840370000544723',
        'dataSource': 'other',
        'project': ObjectId('63766e02023757c1078bfe7d'),
        'first_prod_date': None,
        'lateral_length': None,
        'measured_depth': None,
        'primary_product': None,
        'true_vertical_depth': None,
        'first_proppant_per_fluid': 1.4562985745719996,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': 85742,
        'total_prop_weight': 5244370,
        'total_proppant_per_fluid': 1.4562985745719996,
        'first_proppant_per_perforated_interval': 1212.010630922117,
        'first_fluid_per_perforated_interval': 19.81557661197134,
        'total_fluid_per_perforated_interval': 19.81557661197134,
        'total_proppant_per_perforated_interval': 1212.010630922117,
        'first_prod_date_daily_calc': None,
        'createdAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'inptID': 'INPT93t2txGEjQ',
        'has_daily': False,
        'last_prod_date_daily': None,
        'dataPool': 'external',
        'location': {
            'type': 'Point',
            'coordinates': [-77.546464, 41.385646]
        },
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-77.5554971780401, 41.3975057329806]
        },
        'geohash': 'dr2g7qh2u7t6',
        'chosenKeyID': 'WellID',
        'mostRecentImport': ObjectId('5fb2f984af874989da757db9'),
        'mostRecentImportDesc': 'kwalker20201116t171317',
        'mostRecentImportType': 'spreadsheet',
        'mostRecentImportDate': datetime(2020, 11, 16, 22, 13, 24, 95000),
        'county': 'CLINTON',
        'current_operator': 'ALTA RESOURCES',
        'first_fluid_volume': 85742,
        'first_prop_weight': 5244370,
        'landing_zone': 'MARCELLUS',
        'perf_lateral_length': 4327,
        'surfaceLatitude': 41.385646,
        'surfaceLongitude': -77.546464,
        'toeLatitude': 41.3975057329806,
        'toeLongitude': -77.5554971780401,
        'well_name': 'COP TRACT 285 E 1027H',
        'updatedAt': datetime(2022, 11, 17, 17, 23, 58, 551000),
        'has_monthly': True,
        'first_prod_date_monthly_calc': datetime(2011, 11, 15, 0, 0),
        'last_prod_date_monthly': datetime(2020, 5, 1, 0, 0),
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'undiscounted_roi': None,
        'schemaVersion': 1,
        'copied': False
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {},
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}]

ECON_RUN_OUTPUT_3_FIXTURE = [{
    'assignment_id': ObjectId('64499b8adf547cea7b9f4c57'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63a0e8dce640e5a88bb7d9d6'),
        'schemaVersion': 1,
        'dataPool': 'internal',
        'dataSource': 'internal',
        'project': ObjectId('63a0e8dbe640e5a88bb7d909'),
        'lateral_length': None,
        'perf_lateral_length': 9908,
        'primary_product': None,
        'true_vertical_depth': 10781,
        'copied': False,
        'first_fluid_volume': None,
        'first_prop_weight': None,
        'measured_depth': None,
        'surfaceLatitude': 47.918406942,
        'surfaceLongitude': -102.887004053,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': datetime(2013, 8, 15, 0, 0),
        'chosenID': '3305304293',
        'api10': '3305304293',
        'api14': '33053042930100',
        'chosenKeyID': 'API10',
        'completion_start_date': datetime(2013, 9, 2, 0, 0),
        'county': 'MCKENZIE',
        'createdAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'current_operator': 'Hess',
        'custom_bool_0': False,
        'custom_bool_1': False,
        'custom_number_0': 100,
        'custom_number_1': 109,
        'field': 'BLUE BUTTES',
        'first_prod_date': datetime(2013, 8, 1, 0, 0),
        'geohash': 'c8wbderbzn3r',
        'has_daily': False,
        'has_monthly': True,
        'hole_direction': 'H',
        'inptID': 'INPTBSICb6I7ii',
        'last_prod_date_daily': None,
        'last_prod_date_monthly': datetime(2022, 10, 15, 0, 0),
        'lease_name': 'BB-BURK-151-95',
        'location': {
            'type': 'Point',
            'coordinates': [-102.887004053, 47.918406942]
        },
        'lower_perforation': 20839,
        'mostRecentImportDate': datetime(2022, 12, 19, 21, 40, 4, 167000),
        'mostRecentImportDesc': 'Survey',
        'mostRecentImportType': 'spreadsheet',
        'permit_date': datetime(2012, 8, 10, 0, 0),
        'range': '95W',
        'section': '7',
        'spud_date': datetime(2013, 6, 15, 0, 0),
        'state': 'ND',
        'toeLatitude': 47.891607582,
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-102.893859182, 47.891607582]
        },
        'toeLongitude': -102.893859182,
        'township': '151N',
        'updatedAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'upper_perforation': 17474,
        'well_name': 'BB-BURK-151-95 0718H-4',
        'well_number': '0718H-4',
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'basin': 'Williston',
        'custom_string_2': '01PDP',
        'custom_string_5': 'IHS PROD',
        'custom_string_8': 'IHS PROD',
        'status': 'A',
        'well_type': 'OIL',
        'custom_number_2': 19,
        'custom_string_0': 'UPPER THREE FORKS',
        'custom_string_1': 'ACTUAL',
        'custom_string_10': 'WILLISTON AOI',
        'custom_string_7': 'WILLISTON_19',
        'custom_string_3': 'ACTUAL',
        'type_curve_area': '2022_11_WILLISTON_1',
        '__v': 0,
        'mostRecentImport': ObjectId('63a0da346d559865423fa422'),
        'elevation': 2428,
        'has_directional_survey': True
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {
        'general_options': {
            'main_options': {
                'aggregation_date': '2023-05-01',
                'currency': 'USD',
                'reporting_period': 'calendar',
                'fiscal': '',
                'income_tax': 'no',
                'project_type': 'primary_recovery'
            },
            'income_tax': {
                'fifteen_depletion': 'no',
                'carry_forward': 'no',
                'state_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                },
                'federal_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                }
            },
            'discount_table': {
                'discount_method':
                'yearly',
                'cash_accrual_time':
                'mid_month',
                'first_discount':
                10,
                'second_discount':
                15,
                'rows': [{
                    'discount_table': 0
                }, {
                    'discount_table': 2
                }, {
                    'discount_table': 5
                }, {
                    'discount_table': 8
                }, {
                    'discount_table': 10
                }, {
                    'discount_table': 12
                }, {
                    'discount_table': 15
                }, {
                    'discount_table': 20
                }, {
                    'discount_table': 25
                }, {
                    'discount_table': 30
                }, {
                    'discount_table': 40
                }, {
                    'discount_table': 50
                }, {
                    'discount_table': 60
                }, {
                    'discount_table': 70
                }, {
                    'discount_table': 80
                }, {
                    'discount_table': 100
                }]
            },
            'boe_conversion': {
                'oil': 1,
                'wet_gas': 6,
                'dry_gas': 6,
                'ngl': 1,
                'drip_condensate': 1
            },
            'reporting_units': {
                'oil': 'MBBL',
                'gas': 'MMCF',
                'ngl': 'MBBL',
                'drip_condensate': 'MBBL',
                'water': 'MBBL',
                'pressure': 'PSI',
                'cash': 'M$',
                'water_cut': 'BBL/BOE',
                'gor': 'CF/BBL',
                'condensate_gas_ratio': 'BBL/MMCF',
                'drip_condensate_yield': 'BBL/MMCF',
                'ngl_yield': 'BBL/MMCF'
            }
        },
        'capex': {
            'unique':
            False,
            'name':
            'bas',
            'other_capex': {
                'rows': [{
                    'category': 'other_investment',
                    'description': '',
                    'tangible': 0,
                    'intangible': 0,
                    'offset_to_fpd': -120,
                    'capex_expense': 'capex',
                    'after_econ_limit': 'no',
                    'calculation': 'gross',
                    'escalation_model': 'none',
                    'escalation_start': {
                        'apply_to_criteria': 0
                    },
                    'depreciation_model': 'none',
                    'deal_terms': 1,
                    'distribution_type': 'na',
                    'mean': 0,
                    'standard_deviation': 0,
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'mode': 0,
                    'seed': 1
                }]
            },
            'drilling_cost': {},
            'completion_cost': {},
            'recompletion_workover': {},
            'embedded': [ObjectId('6441c787fc13ce001268f080')],
            'fetched_embedded': [
                [
                    [{
                        'key': 'category',
                        'value': 'drilling'
                    }, {
                        'key': 'description',
                        'value': ''
                    }, {
                        'key': 'tangible',
                        'value': 0
                    }, {
                        'key': 'intangible',
                        'value': 0
                    }, {
                        'key': 'capex_expense',
                        'value': 'capex'
                    }, {
                        'key': 'after_econ_limit',
                        'value': 'no'
                    }, {
                        'key': 'calculation',
                        'value': 'gross'
                    }, {
                        'key': 'escalation_model',
                        'value': 'none'
                    }, {
                        'key': 'depreciation_model',
                        'value': 'none'
                    }, {
                        'key': 'deal_terms',
                        'value': 1
                    }, {
                        'key': 'criteria_option',
                        'value': 'offset_to_fpd'
                    }, {
                        'key': 'criteria_value',
                        'value': -120
                    }, {
                        'key': 'escalation_start_option',
                        'value': 'apply_to_criteria'
                    }, {
                        'key': 'escalation_start_value',
                        'value': 0
                    }],
                    [
                        {
                            'key': 'category',
                            'value': 'drilling'
                        },
                        {
                            'key': 'description',
                            'value': ''
                        },
                        {
                            'key': 'tangible',
                            'value': 0
                        },
                        {
                            'key': 'intangible',
                            'value': 0
                        },
                        {
                            'key': 'capex_expense',
                            'value': 'capex'
                        },
                        {
                            'key': 'after_econ_limit',
                            'value': 'no'
                        },
                        {
                            'key': 'calculation',
                            'value': 'gross'
                        },
                        {
                            'key': 'escalation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'depreciation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'deal_terms',
                            'value': 1
                        },
                        {
                            'key': 'criteria_option',
                            'value': 'offset_to_fpd'
                        },
                        {
                            'key': 'criteria_value',
                            'value': -120
                        },
                        {
                            'key': 'escalation_start_option',
                            'value': 'apply_to_criteria'
                        },
                        {
                            'key': 'escalation_start_value',
                            'value': 0
                        },
                    ],
                ],
            ]
        },
        'dates': {
            'unique': False,
            'name': 'bar',
            'dates_setting': {
                'max_well_life': 50,
                'as_of_date': {
                    'date': '2023-05-01'
                },
                'discount_date': {
                    'date': '2023-05-01'
                },
                'cash_flow_prior_to_as_of_date': 'no',
                'production_data_resolution': 'same_as_forecast',
                'fpd_source_hierarchy': {
                    'first_fpd_source': {
                        'well_header': ''
                    },
                    'second_fpd_source': {
                        'production_data': ''
                    },
                    'third_fpd_source': {
                        'forecast': ''
                    },
                    'fourth_fpd_source': {
                        'not_used': ''
                    },
                    'use_forecast_schedule_when_no_prod': 'yes'
                }
            },
            'cut_off': {
                'max_cum_cash_flow': '',
                'min_cut_off': {
                    'none': ''
                },
                'capex_offset_to_ecl': 'no',
                'include_capex': 'no',
                'discount': 0,
                'consecutive_negative': 0,
                'econ_limit_delay': 0,
                'side_phase_end': 'no'
            },
            'embedded': []
        },
        'ownership_reversion': {
            'unique': False,
            'name': 'foo',
            'ownership': {
                'initial_ownership': {
                    'working_interest': 44,
                    'original_ownership': {
                        'net_revenue_interest': 4,
                        'lease_net_revenue_interest': 4
                    },
                    'net_profit_interest_type': 'expense',
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'first_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'second_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'third_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fourth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fifth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'sixth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'seventh_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'eighth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'ninth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'tenth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                }
            },
            'embedded': []
        }
    },
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('64499b8adf547cea7b9f4c58'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63a0e8dce640e5a88bb7d9d7'),
        'schemaVersion': 1,
        'dataPool': 'internal',
        'dataSource': 'internal',
        'project': ObjectId('63a0e8dbe640e5a88bb7d909'),
        'lateral_length': None,
        'perf_lateral_length': 8993,
        'primary_product': None,
        'true_vertical_depth': 7339,
        'copied': False,
        'first_fluid_volume': None,
        'first_prop_weight': None,
        'measured_depth': None,
        'surfaceLatitude': 40.204803119,
        'surfaceLongitude': -104.81658593,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': datetime(2014, 1, 15, 0, 0),
        'chosenID': '0512337761',
        'api10': '0512337761',
        'api14': '05123377610000',
        'chosenKeyID': 'API10',
        'completion_start_date': datetime(2014, 1, 24, 0, 0),
        'county': 'WELD',
        'createdAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'current_operator': 'OXY',
        'custom_bool_0': False,
        'custom_bool_1': False,
        'custom_number_0': 100,
        'field': 'WATTENBERG',
        'first_prod_date': datetime(2014, 1, 1, 0, 0),
        'geohash': '9xjkwz4cuw8b',
        'has_daily': False,
        'has_monthly': True,
        'hole_direction': 'H',
        'inptID': 'INPTMO2pbhI5TT',
        'last_prod_date_daily': None,
        'last_prod_date_monthly': datetime(2022, 10, 15, 0, 0),
        'lease_name': 'HARRIS FEDERAL',
        'location': {
            'type': 'Point',
            'coordinates': [-104.81658593, 40.204803119]
        },
        'lower_perforation': 15575,
        'mostRecentImportDate': datetime(2022, 12, 19, 21, 40, 4, 167000),
        'mostRecentImportDesc': 'Survey',
        'mostRecentImportType': 'spreadsheet',
        'permit_date': datetime(2013, 7, 26, 0, 0),
        'range': '66W',
        'section': '19',
        'spud_date': datetime(2013, 7, 31, 0, 0),
        'state': 'CO',
        'status': 'A',
        'toeLatitude': 40.22942519,
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-104.818129889, 40.22942519]
        },
        'toeLongitude': -104.818129889,
        'township': '3N',
        'updatedAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'upper_perforation': 7703,
        'well_name': 'HARRIS FEDERAL 15C-18HZ',
        'well_number': '15C-18HZ',
        'well_type': 'OIL',
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'basin': 'DJ',
        'custom_number_1': 93,
        'custom_string_2': '01PDP',
        'custom_string_5': 'IHS PROD',
        'custom_string_8': 'IHS PROD',
        'custom_number_2': 17,
        'custom_string_0': 'Codell',
        'custom_string_1': 'ACTUAL',
        'custom_string_10': 'DJ AOI',
        'custom_string_7': 'DJ_17',
        'custom_string_3': 'ACTUAL',
        'type_curve_area': 'CC_DJ_2019+_S GC',
        '__v': 0,
        'mostRecentImport': ObjectId('63a0da346d559865423fa422'),
        'elevation': 4857,
        'has_directional_survey': True,
        'closest_well_any_zone': ObjectId('63a0e8dce640e5a88bb7d9e0'),
        'hz_well_spacing_any_zone': 270.492,
        'vt_well_spacing_any_zone': 197.974
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {
        'general_options': {
            'main_options': {
                'aggregation_date': '2023-05-01',
                'currency': 'USD',
                'reporting_period': 'calendar',
                'fiscal': '',
                'income_tax': 'no',
                'project_type': 'primary_recovery'
            },
            'income_tax': {
                'fifteen_depletion': 'no',
                'carry_forward': 'no',
                'state_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                },
                'federal_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                }
            },
            'discount_table': {
                'discount_method':
                'yearly',
                'cash_accrual_time':
                'mid_month',
                'first_discount':
                10,
                'second_discount':
                15,
                'rows': [{
                    'discount_table': 0
                }, {
                    'discount_table': 2
                }, {
                    'discount_table': 5
                }, {
                    'discount_table': 8
                }, {
                    'discount_table': 10
                }, {
                    'discount_table': 12
                }, {
                    'discount_table': 15
                }, {
                    'discount_table': 20
                }, {
                    'discount_table': 25
                }, {
                    'discount_table': 30
                }, {
                    'discount_table': 40
                }, {
                    'discount_table': 50
                }, {
                    'discount_table': 60
                }, {
                    'discount_table': 70
                }, {
                    'discount_table': 80
                }, {
                    'discount_table': 100
                }]
            },
            'boe_conversion': {
                'oil': 1,
                'wet_gas': 6,
                'dry_gas': 6,
                'ngl': 1,
                'drip_condensate': 1
            },
            'reporting_units': {
                'oil': 'MBBL',
                'gas': 'MMCF',
                'ngl': 'MBBL',
                'drip_condensate': 'MBBL',
                'water': 'MBBL',
                'pressure': 'PSI',
                'cash': 'M$',
                'water_cut': 'BBL/BOE',
                'gor': 'CF/BBL',
                'condensate_gas_ratio': 'BBL/MMCF',
                'drip_condensate_yield': 'BBL/MMCF',
                'ngl_yield': 'BBL/MMCF'
            }
        },
        'capex': {
            'unique':
            False,
            'name':
            'bas',
            'other_capex': {
                'rows': [{
                    'category': 'other_investment',
                    'description': '',
                    'tangible': 0,
                    'intangible': 0,
                    'offset_to_fpd': -120,
                    'capex_expense': 'capex',
                    'after_econ_limit': 'no',
                    'calculation': 'gross',
                    'escalation_model': 'none',
                    'escalation_start': {
                        'apply_to_criteria': 0
                    },
                    'depreciation_model': 'none',
                    'deal_terms': 1,
                    'distribution_type': 'na',
                    'mean': 0,
                    'standard_deviation': 0,
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'mode': 0,
                    'seed': 1
                }]
            },
            'drilling_cost': {},
            'completion_cost': {},
            'recompletion_workover': {},
            'embedded': [ObjectId('6441c787fc13ce001268f080')],
            'fetched_embedded': [
                [
                    [{
                        'key': 'category',
                        'value': 'drilling'
                    }, {
                        'key': 'description',
                        'value': ''
                    }, {
                        'key': 'tangible',
                        'value': 0
                    }, {
                        'key': 'intangible',
                        'value': 0
                    }, {
                        'key': 'capex_expense',
                        'value': 'capex'
                    }, {
                        'key': 'after_econ_limit',
                        'value': 'no'
                    }, {
                        'key': 'calculation',
                        'value': 'gross'
                    }, {
                        'key': 'escalation_model',
                        'value': 'none'
                    }, {
                        'key': 'depreciation_model',
                        'value': 'none'
                    }, {
                        'key': 'deal_terms',
                        'value': 1
                    }, {
                        'key': 'criteria_option',
                        'value': 'offset_to_fpd'
                    }, {
                        'key': 'criteria_value',
                        'value': -120
                    }, {
                        'key': 'escalation_start_option',
                        'value': 'apply_to_criteria'
                    }, {
                        'key': 'escalation_start_value',
                        'value': 0
                    }],
                    [
                        {
                            'key': 'category',
                            'value': 'drilling'
                        },
                        {
                            'key': 'description',
                            'value': ''
                        },
                        {
                            'key': 'tangible',
                            'value': 0
                        },
                        {
                            'key': 'intangible',
                            'value': 0
                        },
                        {
                            'key': 'capex_expense',
                            'value': 'capex'
                        },
                        {
                            'key': 'after_econ_limit',
                            'value': 'no'
                        },
                        {
                            'key': 'calculation',
                            'value': 'gross'
                        },
                        {
                            'key': 'escalation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'depreciation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'deal_terms',
                            'value': 1
                        },
                        {
                            'key': 'criteria_option',
                            'value': 'offset_to_fpd'
                        },
                        {
                            'key': 'criteria_value',
                            'value': -120
                        },
                        {
                            'key': 'escalation_start_option',
                            'value': 'apply_to_criteria'
                        },
                        {
                            'key': 'escalation_start_value',
                            'value': 0
                        },
                    ],
                ],
            ]
        },
        'dates': {
            'unique': False,
            'name': 'bar',
            'dates_setting': {
                'max_well_life': 50,
                'as_of_date': {
                    'date': '2023-05-01'
                },
                'discount_date': {
                    'date': '2023-05-01'
                },
                'cash_flow_prior_to_as_of_date': 'no',
                'production_data_resolution': 'same_as_forecast',
                'fpd_source_hierarchy': {
                    'first_fpd_source': {
                        'well_header': ''
                    },
                    'second_fpd_source': {
                        'production_data': ''
                    },
                    'third_fpd_source': {
                        'forecast': ''
                    },
                    'fourth_fpd_source': {
                        'not_used': ''
                    },
                    'use_forecast_schedule_when_no_prod': 'yes'
                }
            },
            'cut_off': {
                'max_cum_cash_flow': '',
                'min_cut_off': {
                    'none': ''
                },
                'capex_offset_to_ecl': 'no',
                'include_capex': 'no',
                'discount': 0,
                'consecutive_negative': 0,
                'econ_limit_delay': 0,
                'side_phase_end': 'no'
            },
            'embedded': []
        },
        'ownership_reversion': {
            'unique': False,
            'name': 'foo',
            'ownership': {
                'initial_ownership': {
                    'working_interest': 44,
                    'original_ownership': {
                        'net_revenue_interest': 4,
                        'lease_net_revenue_interest': 4
                    },
                    'net_profit_interest_type': 'expense',
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'first_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'second_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'third_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fourth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fifth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'sixth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'seventh_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'eighth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'ninth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'tenth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                }
            },
            'embedded': []
        }
    },
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('64499b8adf547cea7b9f4c59'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63a0e8dce640e5a88bb7d9d8'),
        'schemaVersion': 1,
        'dataPool': 'internal',
        'dataSource': 'internal',
        'project': ObjectId('63a0e8dbe640e5a88bb7d909'),
        'lateral_length': None,
        'perf_lateral_length': 4907,
        'primary_product': None,
        'true_vertical_depth': 7108,
        'copied': False,
        'first_fluid_volume': None,
        'first_prop_weight': None,
        'measured_depth': None,
        'surfaceLatitude': 40.241588449,
        'surfaceLongitude': -104.79248009,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': datetime(2013, 12, 15, 0, 0),
        'chosenID': '0512337574',
        'api10': '0512337574',
        'api14': '05123375740000',
        'chosenKeyID': 'API10',
        'completion_start_date': datetime(2013, 12, 27, 0, 0),
        'county': 'WELD',
        'createdAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'current_operator': 'OXY',
        'custom_bool_0': False,
        'custom_bool_1': False,
        'custom_number_0': 100,
        'field': 'WATTENBERG',
        'first_prod_date': datetime(2013, 12, 1, 0, 0),
        'geohash': '9xjkzmu2npz3',
        'has_daily': False,
        'has_monthly': True,
        'hole_direction': 'H',
        'inptID': 'INPT9RbMOJBC2w',
        'last_prod_date_daily': None,
        'last_prod_date_monthly': datetime(2022, 10, 15, 0, 0),
        'lease_name': 'EISENACH FEDERAL',
        'location': {
            'type': 'Point',
            'coordinates': [-104.79248009, 40.241588449]
        },
        'lower_perforation': 12059,
        'mostRecentImportDate': datetime(2022, 12, 19, 21, 40, 4, 167000),
        'mostRecentImportDesc': 'Survey',
        'mostRecentImportType': 'spreadsheet',
        'permit_date': datetime(2013, 6, 13, 0, 0),
        'range': '66W',
        'section': '8',
        'spud_date': datetime(2013, 7, 16, 0, 0),
        'state': 'CO',
        'status': 'A',
        'toeLatitude': 40.241861484,
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-104.810624621, 40.241861484]
        },
        'toeLongitude': -104.810624621,
        'township': '3N',
        'updatedAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'upper_perforation': 7532,
        'well_name': 'EISENACH FEDERAL 5N-8HZ',
        'well_number': '5N-8HZ',
        'well_type': 'OIL',
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'basin': 'DJ',
        'custom_number_1': 107,
        'custom_string_2': '01PDP',
        'custom_string_5': 'IHS PROD',
        'custom_string_8': 'IHS PROD',
        'custom_number_2': 17,
        'custom_string_0': 'Niobrara A',
        'custom_string_1': 'ACTUAL',
        'custom_string_10': 'DJ AOI',
        'custom_string_7': 'DJ_17',
        'custom_string_3': 'ACTUAL',
        'type_curve_area': 'CC_DJ_2019+_S GC',
        '__v': 0,
        'mostRecentImport': ObjectId('63a0da346d559865423fa422'),
        'elevation': 4851,
        'has_directional_survey': True,
        'closest_well_any_zone': ObjectId('63a0e8dce640e5a88bb7d9e2'),
        'hz_well_spacing_any_zone': 647.226,
        'vt_well_spacing_any_zone': 29.384
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {
        'general_options': {
            'main_options': {
                'aggregation_date': '2023-05-01',
                'currency': 'USD',
                'reporting_period': 'calendar',
                'fiscal': '',
                'income_tax': 'no',
                'project_type': 'primary_recovery'
            },
            'income_tax': {
                'fifteen_depletion': 'no',
                'carry_forward': 'no',
                'state_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                },
                'federal_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                }
            },
            'discount_table': {
                'discount_method':
                'yearly',
                'cash_accrual_time':
                'mid_month',
                'first_discount':
                10,
                'second_discount':
                15,
                'rows': [{
                    'discount_table': 0
                }, {
                    'discount_table': 2
                }, {
                    'discount_table': 5
                }, {
                    'discount_table': 8
                }, {
                    'discount_table': 10
                }, {
                    'discount_table': 12
                }, {
                    'discount_table': 15
                }, {
                    'discount_table': 20
                }, {
                    'discount_table': 25
                }, {
                    'discount_table': 30
                }, {
                    'discount_table': 40
                }, {
                    'discount_table': 50
                }, {
                    'discount_table': 60
                }, {
                    'discount_table': 70
                }, {
                    'discount_table': 80
                }, {
                    'discount_table': 100
                }]
            },
            'boe_conversion': {
                'oil': 1,
                'wet_gas': 6,
                'dry_gas': 6,
                'ngl': 1,
                'drip_condensate': 1
            },
            'reporting_units': {
                'oil': 'MBBL',
                'gas': 'MMCF',
                'ngl': 'MBBL',
                'drip_condensate': 'MBBL',
                'water': 'MBBL',
                'pressure': 'PSI',
                'cash': 'M$',
                'water_cut': 'BBL/BOE',
                'gor': 'CF/BBL',
                'condensate_gas_ratio': 'BBL/MMCF',
                'drip_condensate_yield': 'BBL/MMCF',
                'ngl_yield': 'BBL/MMCF'
            }
        },
        'capex': {
            'unique':
            False,
            'name':
            'bas',
            'other_capex': {
                'rows': [{
                    'category': 'other_investment',
                    'description': '',
                    'tangible': 0,
                    'intangible': 0,
                    'offset_to_fpd': -120,
                    'capex_expense': 'capex',
                    'after_econ_limit': 'no',
                    'calculation': 'gross',
                    'escalation_model': 'none',
                    'escalation_start': {
                        'apply_to_criteria': 0
                    },
                    'depreciation_model': 'none',
                    'deal_terms': 1,
                    'distribution_type': 'na',
                    'mean': 0,
                    'standard_deviation': 0,
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'mode': 0,
                    'seed': 1
                }]
            },
            'drilling_cost': {},
            'completion_cost': {},
            'recompletion_workover': {},
            'embedded': [ObjectId('6441c787fc13ce001268f080')],
            'fetched_embedded': [
                [
                    [{
                        'key': 'category',
                        'value': 'drilling'
                    }, {
                        'key': 'description',
                        'value': ''
                    }, {
                        'key': 'tangible',
                        'value': 0
                    }, {
                        'key': 'intangible',
                        'value': 0
                    }, {
                        'key': 'capex_expense',
                        'value': 'capex'
                    }, {
                        'key': 'after_econ_limit',
                        'value': 'no'
                    }, {
                        'key': 'calculation',
                        'value': 'gross'
                    }, {
                        'key': 'escalation_model',
                        'value': 'none'
                    }, {
                        'key': 'depreciation_model',
                        'value': 'none'
                    }, {
                        'key': 'deal_terms',
                        'value': 1
                    }, {
                        'key': 'criteria_option',
                        'value': 'offset_to_fpd'
                    }, {
                        'key': 'criteria_value',
                        'value': -120
                    }, {
                        'key': 'escalation_start_option',
                        'value': 'apply_to_criteria'
                    }, {
                        'key': 'escalation_start_value',
                        'value': 0
                    }],
                    [
                        {
                            'key': 'category',
                            'value': 'drilling'
                        },
                        {
                            'key': 'description',
                            'value': ''
                        },
                        {
                            'key': 'tangible',
                            'value': 0
                        },
                        {
                            'key': 'intangible',
                            'value': 0
                        },
                        {
                            'key': 'capex_expense',
                            'value': 'capex'
                        },
                        {
                            'key': 'after_econ_limit',
                            'value': 'no'
                        },
                        {
                            'key': 'calculation',
                            'value': 'gross'
                        },
                        {
                            'key': 'escalation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'depreciation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'deal_terms',
                            'value': 1
                        },
                        {
                            'key': 'criteria_option',
                            'value': 'offset_to_fpd'
                        },
                        {
                            'key': 'criteria_value',
                            'value': -120
                        },
                        {
                            'key': 'escalation_start_option',
                            'value': 'apply_to_criteria'
                        },
                        {
                            'key': 'escalation_start_value',
                            'value': 0
                        },
                    ],
                ],
            ]
        },
        'dates': {
            'unique': False,
            'name': 'bar',
            'dates_setting': {
                'max_well_life': 50,
                'as_of_date': {
                    'date': '2023-05-01'
                },
                'discount_date': {
                    'date': '2023-05-01'
                },
                'cash_flow_prior_to_as_of_date': 'no',
                'production_data_resolution': 'same_as_forecast',
                'fpd_source_hierarchy': {
                    'first_fpd_source': {
                        'well_header': ''
                    },
                    'second_fpd_source': {
                        'production_data': ''
                    },
                    'third_fpd_source': {
                        'forecast': ''
                    },
                    'fourth_fpd_source': {
                        'not_used': ''
                    },
                    'use_forecast_schedule_when_no_prod': 'yes'
                }
            },
            'cut_off': {
                'max_cum_cash_flow': '',
                'min_cut_off': {
                    'none': ''
                },
                'capex_offset_to_ecl': 'no',
                'include_capex': 'no',
                'discount': 0,
                'consecutive_negative': 0,
                'econ_limit_delay': 0,
                'side_phase_end': 'no'
            },
            'embedded': []
        },
        'ownership_reversion': {
            'unique': False,
            'name': 'foo',
            'ownership': {
                'initial_ownership': {
                    'working_interest': 44,
                    'original_ownership': {
                        'net_revenue_interest': 4,
                        'lease_net_revenue_interest': 4
                    },
                    'net_profit_interest_type': 'expense',
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'first_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'second_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'third_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fourth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fifth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'sixth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'seventh_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'eighth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'ninth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'tenth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                }
            },
            'embedded': []
        }
    },
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('64499b8adf547cea7b9f4c5a'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63a0e8dce640e5a88bb7d9d9'),
        'schemaVersion': 1,
        'dataPool': 'internal',
        'dataSource': 'internal',
        'project': ObjectId('63a0e8dbe640e5a88bb7d909'),
        'lateral_length': None,
        'perf_lateral_length': 9301,
        'primary_product': None,
        'true_vertical_depth': 7172,
        'copied': False,
        'first_fluid_volume': None,
        'first_prop_weight': None,
        'measured_depth': None,
        'surfaceLatitude': 40.205314366,
        'surfaceLongitude': -104.81328696,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': datetime(2014, 1, 15, 0, 0),
        'chosenID': '0512337638',
        'api10': '0512337638',
        'api14': '05123376380000',
        'chosenKeyID': 'API10',
        'completion_start_date': datetime(2014, 2, 5, 0, 0),
        'county': 'WELD',
        'createdAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'current_operator': 'OXY',
        'custom_bool_0': False,
        'custom_bool_1': False,
        'custom_number_0': 100,
        'field': 'WATTENBERG',
        'first_prod_date': datetime(2014, 1, 1, 0, 0),
        'geohash': '9xjkwzjkcmud',
        'has_daily': False,
        'has_monthly': True,
        'hole_direction': 'H',
        'inptID': 'INPTW8PkPwCPWJ',
        'last_prod_date_daily': None,
        'last_prod_date_monthly': datetime(2022, 10, 15, 0, 0),
        'lease_name': 'HARRIS FEDERAL',
        'location': {
            'type': 'Point',
            'coordinates': [-104.81328696, 40.205314366]
        },
        'lower_perforation': 15975,
        'mostRecentImportDate': datetime(2022, 12, 19, 21, 40, 4, 167000),
        'mostRecentImportDesc': 'Survey',
        'mostRecentImportType': 'spreadsheet',
        'permit_date': datetime(2013, 6, 28, 0, 0),
        'range': '66W',
        'section': '19',
        'spud_date': datetime(2013, 9, 3, 0, 0),
        'state': 'CO',
        'status': 'A',
        'toeLatitude': 40.23077946,
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-104.814844247, 40.23077946]
        },
        'toeLongitude': -104.814844247,
        'township': '3N',
        'updatedAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'upper_perforation': 7601,
        'well_name': 'HARRIS FEDERAL 16N-18HZ',
        'well_number': '16N-18HZ',
        'well_type': 'OIL',
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'basin': 'DJ',
        'custom_number_1': 103,
        'custom_string_2': '01PDP',
        'custom_string_5': 'IHS PROD',
        'custom_string_8': 'IHS PROD',
        'custom_number_2': 17,
        'custom_string_0': 'Niobrara A',
        'custom_string_1': 'ACTUAL',
        'custom_string_10': 'DJ AOI',
        'custom_string_7': 'DJ_17',
        'custom_string_3': 'ACTUAL',
        'type_curve_area': 'CC_DJ_2019+_S GC',
        '__v': 0,
        'mostRecentImport': ObjectId('63a0da346d559865423fa422'),
        'elevation': 4881,
        'has_directional_survey': True,
        'closest_well_any_zone': ObjectId('63a0e8dce640e5a88bb7d9e0'),
        'hz_well_spacing_any_zone': 1258.515,
        'vt_well_spacing_any_zone': 50.439
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {
        'general_options': {
            'main_options': {
                'aggregation_date': '2023-05-01',
                'currency': 'USD',
                'reporting_period': 'calendar',
                'fiscal': '',
                'income_tax': 'no',
                'project_type': 'primary_recovery'
            },
            'income_tax': {
                'fifteen_depletion': 'no',
                'carry_forward': 'no',
                'state_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                },
                'federal_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                }
            },
            'discount_table': {
                'discount_method':
                'yearly',
                'cash_accrual_time':
                'mid_month',
                'first_discount':
                10,
                'second_discount':
                15,
                'rows': [{
                    'discount_table': 0
                }, {
                    'discount_table': 2
                }, {
                    'discount_table': 5
                }, {
                    'discount_table': 8
                }, {
                    'discount_table': 10
                }, {
                    'discount_table': 12
                }, {
                    'discount_table': 15
                }, {
                    'discount_table': 20
                }, {
                    'discount_table': 25
                }, {
                    'discount_table': 30
                }, {
                    'discount_table': 40
                }, {
                    'discount_table': 50
                }, {
                    'discount_table': 60
                }, {
                    'discount_table': 70
                }, {
                    'discount_table': 80
                }, {
                    'discount_table': 100
                }]
            },
            'boe_conversion': {
                'oil': 1,
                'wet_gas': 6,
                'dry_gas': 6,
                'ngl': 1,
                'drip_condensate': 1
            },
            'reporting_units': {
                'oil': 'MBBL',
                'gas': 'MMCF',
                'ngl': 'MBBL',
                'drip_condensate': 'MBBL',
                'water': 'MBBL',
                'pressure': 'PSI',
                'cash': 'M$',
                'water_cut': 'BBL/BOE',
                'gor': 'CF/BBL',
                'condensate_gas_ratio': 'BBL/MMCF',
                'drip_condensate_yield': 'BBL/MMCF',
                'ngl_yield': 'BBL/MMCF'
            }
        },
        'capex': {
            'unique':
            False,
            'name':
            'bas',
            'other_capex': {
                'rows': [{
                    'category': 'other_investment',
                    'description': '',
                    'tangible': 0,
                    'intangible': 0,
                    'offset_to_fpd': -120,
                    'capex_expense': 'capex',
                    'after_econ_limit': 'no',
                    'calculation': 'gross',
                    'escalation_model': 'none',
                    'escalation_start': {
                        'apply_to_criteria': 0
                    },
                    'depreciation_model': 'none',
                    'deal_terms': 1,
                    'distribution_type': 'na',
                    'mean': 0,
                    'standard_deviation': 0,
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'mode': 0,
                    'seed': 1
                }]
            },
            'drilling_cost': {},
            'completion_cost': {},
            'recompletion_workover': {},
            'embedded': [ObjectId('6441c787fc13ce001268f080')],
            'fetched_embedded': [
                [
                    [{
                        'key': 'category',
                        'value': 'drilling'
                    }, {
                        'key': 'description',
                        'value': ''
                    }, {
                        'key': 'tangible',
                        'value': 0
                    }, {
                        'key': 'intangible',
                        'value': 0
                    }, {
                        'key': 'capex_expense',
                        'value': 'capex'
                    }, {
                        'key': 'after_econ_limit',
                        'value': 'no'
                    }, {
                        'key': 'calculation',
                        'value': 'gross'
                    }, {
                        'key': 'escalation_model',
                        'value': 'none'
                    }, {
                        'key': 'depreciation_model',
                        'value': 'none'
                    }, {
                        'key': 'deal_terms',
                        'value': 1
                    }, {
                        'key': 'criteria_option',
                        'value': 'offset_to_fpd'
                    }, {
                        'key': 'criteria_value',
                        'value': -120
                    }, {
                        'key': 'escalation_start_option',
                        'value': 'apply_to_criteria'
                    }, {
                        'key': 'escalation_start_value',
                        'value': 0
                    }],
                    [
                        {
                            'key': 'category',
                            'value': 'drilling'
                        },
                        {
                            'key': 'description',
                            'value': ''
                        },
                        {
                            'key': 'tangible',
                            'value': 0
                        },
                        {
                            'key': 'intangible',
                            'value': 0
                        },
                        {
                            'key': 'capex_expense',
                            'value': 'capex'
                        },
                        {
                            'key': 'after_econ_limit',
                            'value': 'no'
                        },
                        {
                            'key': 'calculation',
                            'value': 'gross'
                        },
                        {
                            'key': 'escalation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'depreciation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'deal_terms',
                            'value': 1
                        },
                        {
                            'key': 'criteria_option',
                            'value': 'offset_to_fpd'
                        },
                        {
                            'key': 'criteria_value',
                            'value': -120
                        },
                        {
                            'key': 'escalation_start_option',
                            'value': 'apply_to_criteria'
                        },
                        {
                            'key': 'escalation_start_value',
                            'value': 0
                        },
                    ],
                ],
            ]
        },
        'dates': {
            'unique': False,
            'name': 'bar',
            'dates_setting': {
                'max_well_life': 50,
                'as_of_date': {
                    'date': '2023-05-01'
                },
                'discount_date': {
                    'date': '2023-05-01'
                },
                'cash_flow_prior_to_as_of_date': 'no',
                'production_data_resolution': 'same_as_forecast',
                'fpd_source_hierarchy': {
                    'first_fpd_source': {
                        'well_header': ''
                    },
                    'second_fpd_source': {
                        'production_data': ''
                    },
                    'third_fpd_source': {
                        'forecast': ''
                    },
                    'fourth_fpd_source': {
                        'not_used': ''
                    },
                    'use_forecast_schedule_when_no_prod': 'yes'
                }
            },
            'cut_off': {
                'max_cum_cash_flow': '',
                'min_cut_off': {
                    'none': ''
                },
                'capex_offset_to_ecl': 'no',
                'include_capex': 'no',
                'discount': 0,
                'consecutive_negative': 0,
                'econ_limit_delay': 0,
                'side_phase_end': 'no'
            },
            'embedded': []
        },
        'ownership_reversion': {
            'unique': False,
            'name': 'foo',
            'ownership': {
                'initial_ownership': {
                    'working_interest': 44,
                    'original_ownership': {
                        'net_revenue_interest': 4,
                        'lease_net_revenue_interest': 4
                    },
                    'net_profit_interest_type': 'expense',
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'first_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'second_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'third_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fourth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fifth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'sixth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'seventh_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'eighth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'ninth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'tenth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                }
            },
            'embedded': []
        }
    },
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('64499b8adf547cea7b9f4c5b'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63a0e8dce640e5a88bb7d9da'),
        'schemaVersion': 1,
        'dataPool': 'internal',
        'dataSource': 'internal',
        'project': ObjectId('63a0e8dbe640e5a88bb7d909'),
        'lateral_length': None,
        'perf_lateral_length': 9849,
        'primary_product': None,
        'true_vertical_depth': 10703,
        'copied': False,
        'first_fluid_volume': None,
        'first_prop_weight': None,
        'measured_depth': None,
        'surfaceLatitude': 47.918406837,
        'surfaceLongitude': -102.886800135,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': datetime(2013, 8, 15, 0, 0),
        'chosenID': '3305304292',
        'api10': '3305304292',
        'api14': '33053042920000',
        'chosenKeyID': 'API10',
        'completion_start_date': datetime(2013, 8, 24, 0, 0),
        'county': 'MCKENZIE',
        'createdAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'current_operator': 'Hess',
        'custom_bool_0': False,
        'custom_bool_1': False,
        'custom_number_0': 100,
        'custom_number_1': 107,
        'field': 'BLUE BUTTES',
        'first_prod_date': datetime(2013, 8, 1, 0, 0),
        'geohash': 'c8wbdg20gy3q',
        'has_daily': False,
        'has_monthly': True,
        'hole_direction': 'H',
        'inptID': 'INPT7WowB8Be1g',
        'last_prod_date_daily': None,
        'last_prod_date_monthly': datetime(2022, 10, 15, 0, 0),
        'lease_name': 'BB-BURK-151-95',
        'location': {
            'type': 'Point',
            'coordinates': [-102.886800135, 47.918406837]
        },
        'lower_perforation': 20325,
        'mostRecentImportDate': datetime(2022, 12, 19, 21, 40, 4, 167000),
        'mostRecentImportDesc': 'Survey',
        'mostRecentImportType': 'spreadsheet',
        'permit_date': datetime(2012, 8, 10, 0, 0),
        'range': '95W',
        'section': '7',
        'spud_date': datetime(2013, 3, 8, 0, 0),
        'state': 'ND',
        'status': 'A',
        'toeLatitude': 47.891605336,
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-102.891839295, 47.891605336]
        },
        'toeLongitude': -102.891839295,
        'township': '151N',
        'updatedAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'upper_perforation': 11125,
        'well_name': 'BB-BURK-151-95 0718H-3',
        'well_number': '0718H-3',
        'well_type': 'OIL',
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'basin': 'Williston',
        'custom_string_2': '01PDP',
        'custom_string_5': 'IHS PROD',
        'custom_string_8': 'IHS PROD',
        'custom_number_2': 19,
        'custom_string_0': 'MIDDLE BAKKEN',
        'custom_string_1': 'ACTUAL',
        'custom_string_10': 'WILLISTON AOI',
        'custom_string_7': 'WILLISTON_19',
        'custom_string_3': 'ACTUAL',
        'type_curve_area': '2022_11_WILLISTON_1',
        '__v': 0,
        'mostRecentImport': ObjectId('63a0da346d559865423fa422'),
        'elevation': 2430,
        'has_directional_survey': True,
        'closest_well_any_zone': ObjectId('63a0e8dce640e5a88bb7d9df'),
        'hz_well_spacing_any_zone': 606.337,
        'vt_well_spacing_any_zone': 70.001
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {
        'general_options': {
            'main_options': {
                'aggregation_date': '2023-05-01',
                'currency': 'USD',
                'reporting_period': 'calendar',
                'fiscal': '',
                'income_tax': 'no',
                'project_type': 'primary_recovery'
            },
            'income_tax': {
                'fifteen_depletion': 'no',
                'carry_forward': 'no',
                'state_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                },
                'federal_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                }
            },
            'discount_table': {
                'discount_method':
                'yearly',
                'cash_accrual_time':
                'mid_month',
                'first_discount':
                10,
                'second_discount':
                15,
                'rows': [{
                    'discount_table': 0
                }, {
                    'discount_table': 2
                }, {
                    'discount_table': 5
                }, {
                    'discount_table': 8
                }, {
                    'discount_table': 10
                }, {
                    'discount_table': 12
                }, {
                    'discount_table': 15
                }, {
                    'discount_table': 20
                }, {
                    'discount_table': 25
                }, {
                    'discount_table': 30
                }, {
                    'discount_table': 40
                }, {
                    'discount_table': 50
                }, {
                    'discount_table': 60
                }, {
                    'discount_table': 70
                }, {
                    'discount_table': 80
                }, {
                    'discount_table': 100
                }]
            },
            'boe_conversion': {
                'oil': 1,
                'wet_gas': 6,
                'dry_gas': 6,
                'ngl': 1,
                'drip_condensate': 1
            },
            'reporting_units': {
                'oil': 'MBBL',
                'gas': 'MMCF',
                'ngl': 'MBBL',
                'drip_condensate': 'MBBL',
                'water': 'MBBL',
                'pressure': 'PSI',
                'cash': 'M$',
                'water_cut': 'BBL/BOE',
                'gor': 'CF/BBL',
                'condensate_gas_ratio': 'BBL/MMCF',
                'drip_condensate_yield': 'BBL/MMCF',
                'ngl_yield': 'BBL/MMCF'
            }
        },
        'capex': {
            'unique':
            False,
            'name':
            'bas',
            'other_capex': {
                'rows': [{
                    'category': 'other_investment',
                    'description': '',
                    'tangible': 0,
                    'intangible': 0,
                    'offset_to_fpd': -120,
                    'capex_expense': 'capex',
                    'after_econ_limit': 'no',
                    'calculation': 'gross',
                    'escalation_model': 'none',
                    'escalation_start': {
                        'apply_to_criteria': 0
                    },
                    'depreciation_model': 'none',
                    'deal_terms': 1,
                    'distribution_type': 'na',
                    'mean': 0,
                    'standard_deviation': 0,
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'mode': 0,
                    'seed': 1
                }]
            },
            'drilling_cost': {},
            'completion_cost': {},
            'recompletion_workover': {},
            'embedded': [ObjectId('6441c787fc13ce001268f080')],
            'fetched_embedded': [
                [
                    [{
                        'key': 'category',
                        'value': 'drilling'
                    }, {
                        'key': 'description',
                        'value': ''
                    }, {
                        'key': 'tangible',
                        'value': 0
                    }, {
                        'key': 'intangible',
                        'value': 0
                    }, {
                        'key': 'capex_expense',
                        'value': 'capex'
                    }, {
                        'key': 'after_econ_limit',
                        'value': 'no'
                    }, {
                        'key': 'calculation',
                        'value': 'gross'
                    }, {
                        'key': 'escalation_model',
                        'value': 'none'
                    }, {
                        'key': 'depreciation_model',
                        'value': 'none'
                    }, {
                        'key': 'deal_terms',
                        'value': 1
                    }, {
                        'key': 'criteria_option',
                        'value': 'offset_to_fpd'
                    }, {
                        'key': 'criteria_value',
                        'value': -120
                    }, {
                        'key': 'escalation_start_option',
                        'value': 'apply_to_criteria'
                    }, {
                        'key': 'escalation_start_value',
                        'value': 0
                    }],
                    [
                        {
                            'key': 'category',
                            'value': 'drilling'
                        },
                        {
                            'key': 'description',
                            'value': ''
                        },
                        {
                            'key': 'tangible',
                            'value': 0
                        },
                        {
                            'key': 'intangible',
                            'value': 0
                        },
                        {
                            'key': 'capex_expense',
                            'value': 'capex'
                        },
                        {
                            'key': 'after_econ_limit',
                            'value': 'no'
                        },
                        {
                            'key': 'calculation',
                            'value': 'gross'
                        },
                        {
                            'key': 'escalation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'depreciation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'deal_terms',
                            'value': 1
                        },
                        {
                            'key': 'criteria_option',
                            'value': 'offset_to_fpd'
                        },
                        {
                            'key': 'criteria_value',
                            'value': -120
                        },
                        {
                            'key': 'escalation_start_option',
                            'value': 'apply_to_criteria'
                        },
                        {
                            'key': 'escalation_start_value',
                            'value': 0
                        },
                    ],
                ],
            ]
        },
        'dates': {
            'unique': False,
            'name': 'bar',
            'dates_setting': {
                'max_well_life': 50,
                'as_of_date': {
                    'date': '2023-05-01'
                },
                'discount_date': {
                    'date': '2023-05-01'
                },
                'cash_flow_prior_to_as_of_date': 'no',
                'production_data_resolution': 'same_as_forecast',
                'fpd_source_hierarchy': {
                    'first_fpd_source': {
                        'well_header': ''
                    },
                    'second_fpd_source': {
                        'production_data': ''
                    },
                    'third_fpd_source': {
                        'forecast': ''
                    },
                    'fourth_fpd_source': {
                        'not_used': ''
                    },
                    'use_forecast_schedule_when_no_prod': 'yes'
                }
            },
            'cut_off': {
                'max_cum_cash_flow': '',
                'min_cut_off': {
                    'none': ''
                },
                'capex_offset_to_ecl': 'no',
                'include_capex': 'no',
                'discount': 0,
                'consecutive_negative': 0,
                'econ_limit_delay': 0,
                'side_phase_end': 'no'
            },
            'embedded': []
        },
        'ownership_reversion': {
            'unique': False,
            'name': 'foo',
            'ownership': {
                'initial_ownership': {
                    'working_interest': 44,
                    'original_ownership': {
                        'net_revenue_interest': 4,
                        'lease_net_revenue_interest': 4
                    },
                    'net_profit_interest_type': 'expense',
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'first_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'second_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'third_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fourth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fifth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'sixth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'seventh_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'eighth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'ninth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'tenth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                }
            },
            'embedded': []
        }
    },
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('64499b8adf547cea7b9f4c5c'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63a0e8dce640e5a88bb7d9db'),
        'schemaVersion': 1,
        'dataPool': 'internal',
        'dataSource': 'internal',
        'project': ObjectId('63a0e8dbe640e5a88bb7d909'),
        'lateral_length': None,
        'perf_lateral_length': 4591,
        'primary_product': None,
        'true_vertical_depth': 7180,
        'copied': False,
        'first_fluid_volume': None,
        'first_prop_weight': None,
        'measured_depth': None,
        'surfaceLatitude': 40.233065344,
        'surfaceLongitude': -104.80151768,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': datetime(2014, 1, 15, 0, 0),
        'chosenID': '0512337592',
        'api10': '0512337592',
        'api14': '05123375920000',
        'chosenKeyID': 'API10',
        'completion_start_date': datetime(2014, 1, 21, 0, 0),
        'county': 'WELD',
        'createdAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'current_operator': 'OXY',
        'custom_bool_0': False,
        'custom_bool_1': False,
        'custom_number_0': 100,
        'field': 'WATTENBERG',
        'first_prod_date': datetime(2014, 1, 1, 0, 0),
        'geohash': '9xjkzhjyedur',
        'has_daily': False,
        'has_monthly': True,
        'hole_direction': 'H',
        'inptID': 'INPTipRkHKC64I',
        'last_prod_date_daily': None,
        'last_prod_date_monthly': datetime(2022, 10, 15, 0, 0),
        'lease_name': 'BELLA FEDERAL',
        'location': {
            'type': 'Point',
            'coordinates': [-104.80151768, 40.233065344]
        },
        'lower_perforation': 12030,
        'mostRecentImportDate': datetime(2022, 12, 19, 21, 40, 4, 167000),
        'mostRecentImportDesc': 'Survey',
        'mostRecentImportType': 'spreadsheet',
        'permit_date': datetime(2013, 6, 24, 0, 0),
        'range': '66W',
        'section': '8',
        'spud_date': datetime(2013, 8, 7, 0, 0),
        'state': 'CO',
        'status': 'A',
        'toeLatitude': 40.231933683,
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-104.81846559, 40.231933683]
        },
        'toeLongitude': -104.81846559,
        'township': '3N',
        'updatedAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'upper_perforation': 7544,
        'well_name': 'BELLA FEDERAL 36N-7HZ',
        'well_number': '36N-7HZ',
        'well_type': 'OIL',
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'basin': 'DJ',
        'custom_number_1': 103,
        'custom_string_2': '01PDP',
        'custom_string_5': 'IHS PROD',
        'custom_string_8': 'IHS PROD',
        'custom_number_2': 17,
        'custom_string_0': 'Niobrara C',
        'custom_string_1': 'ACTUAL',
        'custom_string_10': 'DJ AOI',
        'custom_string_7': 'DJ_17',
        'custom_string_3': 'ACTUAL',
        'type_curve_area': 'CC_DJ_2019+_S GC',
        '__v': 0,
        'mostRecentImport': ObjectId('63a0da346d559865423fa422'),
        'elevation': 4892,
        'has_directional_survey': True,
        'closest_well_any_zone': ObjectId('63a0e8dce640e5a88bb7d9e9'),
        'hz_well_spacing_any_zone': 3073.357,
        'vt_well_spacing_any_zone': 143.405
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {
        'general_options': {
            'main_options': {
                'aggregation_date': '2023-05-01',
                'currency': 'USD',
                'reporting_period': 'calendar',
                'fiscal': '',
                'income_tax': 'no',
                'project_type': 'primary_recovery'
            },
            'income_tax': {
                'fifteen_depletion': 'no',
                'carry_forward': 'no',
                'state_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                },
                'federal_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                }
            },
            'discount_table': {
                'discount_method':
                'yearly',
                'cash_accrual_time':
                'mid_month',
                'first_discount':
                10,
                'second_discount':
                15,
                'rows': [{
                    'discount_table': 0
                }, {
                    'discount_table': 2
                }, {
                    'discount_table': 5
                }, {
                    'discount_table': 8
                }, {
                    'discount_table': 10
                }, {
                    'discount_table': 12
                }, {
                    'discount_table': 15
                }, {
                    'discount_table': 20
                }, {
                    'discount_table': 25
                }, {
                    'discount_table': 30
                }, {
                    'discount_table': 40
                }, {
                    'discount_table': 50
                }, {
                    'discount_table': 60
                }, {
                    'discount_table': 70
                }, {
                    'discount_table': 80
                }, {
                    'discount_table': 100
                }]
            },
            'boe_conversion': {
                'oil': 1,
                'wet_gas': 6,
                'dry_gas': 6,
                'ngl': 1,
                'drip_condensate': 1
            },
            'reporting_units': {
                'oil': 'MBBL',
                'gas': 'MMCF',
                'ngl': 'MBBL',
                'drip_condensate': 'MBBL',
                'water': 'MBBL',
                'pressure': 'PSI',
                'cash': 'M$',
                'water_cut': 'BBL/BOE',
                'gor': 'CF/BBL',
                'condensate_gas_ratio': 'BBL/MMCF',
                'drip_condensate_yield': 'BBL/MMCF',
                'ngl_yield': 'BBL/MMCF'
            }
        },
        'capex': {
            'unique':
            False,
            'name':
            'bas',
            'other_capex': {
                'rows': [{
                    'category': 'other_investment',
                    'description': '',
                    'tangible': 0,
                    'intangible': 0,
                    'offset_to_fpd': -120,
                    'capex_expense': 'capex',
                    'after_econ_limit': 'no',
                    'calculation': 'gross',
                    'escalation_model': 'none',
                    'escalation_start': {
                        'apply_to_criteria': 0
                    },
                    'depreciation_model': 'none',
                    'deal_terms': 1,
                    'distribution_type': 'na',
                    'mean': 0,
                    'standard_deviation': 0,
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'mode': 0,
                    'seed': 1
                }]
            },
            'drilling_cost': {},
            'completion_cost': {},
            'recompletion_workover': {},
            'embedded': [ObjectId('6441c787fc13ce001268f080')],
            'fetched_embedded': [
                [
                    [{
                        'key': 'category',
                        'value': 'drilling'
                    }, {
                        'key': 'description',
                        'value': ''
                    }, {
                        'key': 'tangible',
                        'value': 0
                    }, {
                        'key': 'intangible',
                        'value': 0
                    }, {
                        'key': 'capex_expense',
                        'value': 'capex'
                    }, {
                        'key': 'after_econ_limit',
                        'value': 'no'
                    }, {
                        'key': 'calculation',
                        'value': 'gross'
                    }, {
                        'key': 'escalation_model',
                        'value': 'none'
                    }, {
                        'key': 'depreciation_model',
                        'value': 'none'
                    }, {
                        'key': 'deal_terms',
                        'value': 1
                    }, {
                        'key': 'criteria_option',
                        'value': 'offset_to_fpd'
                    }, {
                        'key': 'criteria_value',
                        'value': -120
                    }, {
                        'key': 'escalation_start_option',
                        'value': 'apply_to_criteria'
                    }, {
                        'key': 'escalation_start_value',
                        'value': 0
                    }],
                    [
                        {
                            'key': 'category',
                            'value': 'drilling'
                        },
                        {
                            'key': 'description',
                            'value': ''
                        },
                        {
                            'key': 'tangible',
                            'value': 0
                        },
                        {
                            'key': 'intangible',
                            'value': 0
                        },
                        {
                            'key': 'capex_expense',
                            'value': 'capex'
                        },
                        {
                            'key': 'after_econ_limit',
                            'value': 'no'
                        },
                        {
                            'key': 'calculation',
                            'value': 'gross'
                        },
                        {
                            'key': 'escalation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'depreciation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'deal_terms',
                            'value': 1
                        },
                        {
                            'key': 'criteria_option',
                            'value': 'offset_to_fpd'
                        },
                        {
                            'key': 'criteria_value',
                            'value': -120
                        },
                        {
                            'key': 'escalation_start_option',
                            'value': 'apply_to_criteria'
                        },
                        {
                            'key': 'escalation_start_value',
                            'value': 0
                        },
                    ],
                ],
            ]
        },
        'dates': {
            'unique': False,
            'name': 'bar',
            'dates_setting': {
                'max_well_life': 50,
                'as_of_date': {
                    'date': '2023-05-01'
                },
                'discount_date': {
                    'date': '2023-05-01'
                },
                'cash_flow_prior_to_as_of_date': 'no',
                'production_data_resolution': 'same_as_forecast',
                'fpd_source_hierarchy': {
                    'first_fpd_source': {
                        'well_header': ''
                    },
                    'second_fpd_source': {
                        'production_data': ''
                    },
                    'third_fpd_source': {
                        'forecast': ''
                    },
                    'fourth_fpd_source': {
                        'not_used': ''
                    },
                    'use_forecast_schedule_when_no_prod': 'yes'
                }
            },
            'cut_off': {
                'max_cum_cash_flow': '',
                'min_cut_off': {
                    'none': ''
                },
                'capex_offset_to_ecl': 'no',
                'include_capex': 'no',
                'discount': 0,
                'consecutive_negative': 0,
                'econ_limit_delay': 0,
                'side_phase_end': 'no'
            },
            'embedded': []
        },
        'ownership_reversion': {
            'unique': False,
            'name': 'foo',
            'ownership': {
                'initial_ownership': {
                    'working_interest': 44,
                    'original_ownership': {
                        'net_revenue_interest': 4,
                        'lease_net_revenue_interest': 4
                    },
                    'net_profit_interest_type': 'expense',
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'first_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'second_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'third_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fourth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fifth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'sixth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'seventh_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'eighth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'ninth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'tenth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                }
            },
            'embedded': []
        }
    },
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('64499b8adf547cea7b9f4c5d'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63a0e8dce640e5a88bb7d9dc'),
        'schemaVersion': 1,
        'dataPool': 'internal',
        'dataSource': 'internal',
        'project': ObjectId('63a0e8dbe640e5a88bb7d909'),
        'lateral_length': None,
        'perf_lateral_length': 9277,
        'primary_product': None,
        'true_vertical_depth': 7225,
        'copied': False,
        'first_fluid_volume': None,
        'first_prop_weight': None,
        'measured_depth': None,
        'surfaceLatitude': 40.205398144,
        'surfaceLongitude': -104.813241073,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': datetime(2014, 1, 15, 0, 0),
        'chosenID': '0512337639',
        'api10': '0512337639',
        'api14': '05123376390100',
        'chosenKeyID': 'API10',
        'completion_start_date': datetime(2014, 2, 5, 0, 0),
        'county': 'WELD',
        'createdAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'current_operator': 'OXY',
        'custom_bool_0': False,
        'custom_bool_1': False,
        'custom_number_0': 100,
        'field': 'WATTENBERG',
        'first_prod_date': datetime(2014, 1, 1, 0, 0),
        'geohash': '9xjkwzjm6mqv',
        'has_daily': False,
        'has_monthly': True,
        'hole_direction': 'H',
        'inptID': 'INPTxMamRHQJPo',
        'last_prod_date_daily': None,
        'last_prod_date_monthly': datetime(2022, 10, 15, 0, 0),
        'lease_name': 'HARRIS',
        'location': {
            'type': 'Point',
            'coordinates': [-104.813241073, 40.205398144]
        },
        'mostRecentImportDate': datetime(2022, 12, 19, 21, 40, 4, 167000),
        'mostRecentImportDesc': 'Survey',
        'mostRecentImportType': 'spreadsheet',
        'permit_date': datetime(2013, 6, 28, 0, 0),
        'range': '66W',
        'section': '19',
        'spud_date': datetime(2013, 9, 15, 0, 0),
        'state': 'CO',
        'toeLatitude': 40.230809852,
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-104.813668099, 40.230809852]
        },
        'toeLongitude': -104.813668099,
        'township': '3N',
        'updatedAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'well_name': 'HARRIS 38N-18HZX',
        'well_number': '38N-18HZX',
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'basin': 'DJ',
        'custom_number_1': 104,
        'custom_string_2': '01PDP',
        'custom_string_5': 'IHS PROD',
        'custom_string_8': 'IHS PROD',
        'lower_perforation': 16238,
        'status': 'A',
        'upper_perforation': 7598,
        'well_type': 'OIL',
        'custom_number_2': 17,
        'custom_string_0': 'Niobrara B',
        'custom_string_1': 'ACTUAL',
        'custom_string_10': 'DJ AOI',
        'custom_string_7': 'DJ_17',
        'custom_string_3': 'ACTUAL',
        'type_curve_area': 'CC_DJ_2019+_S GC',
        '__v': 0,
        'mostRecentImport': ObjectId('63a0da346d559865423fa422'),
        'elevation': 4883,
        'has_directional_survey': True
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {
        'general_options': {
            'main_options': {
                'aggregation_date': '2023-05-01',
                'currency': 'USD',
                'reporting_period': 'calendar',
                'fiscal': '',
                'income_tax': 'no',
                'project_type': 'primary_recovery'
            },
            'income_tax': {
                'fifteen_depletion': 'no',
                'carry_forward': 'no',
                'state_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                },
                'federal_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                }
            },
            'discount_table': {
                'discount_method':
                'yearly',
                'cash_accrual_time':
                'mid_month',
                'first_discount':
                10,
                'second_discount':
                15,
                'rows': [{
                    'discount_table': 0
                }, {
                    'discount_table': 2
                }, {
                    'discount_table': 5
                }, {
                    'discount_table': 8
                }, {
                    'discount_table': 10
                }, {
                    'discount_table': 12
                }, {
                    'discount_table': 15
                }, {
                    'discount_table': 20
                }, {
                    'discount_table': 25
                }, {
                    'discount_table': 30
                }, {
                    'discount_table': 40
                }, {
                    'discount_table': 50
                }, {
                    'discount_table': 60
                }, {
                    'discount_table': 70
                }, {
                    'discount_table': 80
                }, {
                    'discount_table': 100
                }]
            },
            'boe_conversion': {
                'oil': 1,
                'wet_gas': 6,
                'dry_gas': 6,
                'ngl': 1,
                'drip_condensate': 1
            },
            'reporting_units': {
                'oil': 'MBBL',
                'gas': 'MMCF',
                'ngl': 'MBBL',
                'drip_condensate': 'MBBL',
                'water': 'MBBL',
                'pressure': 'PSI',
                'cash': 'M$',
                'water_cut': 'BBL/BOE',
                'gor': 'CF/BBL',
                'condensate_gas_ratio': 'BBL/MMCF',
                'drip_condensate_yield': 'BBL/MMCF',
                'ngl_yield': 'BBL/MMCF'
            }
        },
        'capex': {
            'unique':
            False,
            'name':
            'bas',
            'other_capex': {
                'rows': [{
                    'category': 'other_investment',
                    'description': '',
                    'tangible': 0,
                    'intangible': 0,
                    'offset_to_fpd': -120,
                    'capex_expense': 'capex',
                    'after_econ_limit': 'no',
                    'calculation': 'gross',
                    'escalation_model': 'none',
                    'escalation_start': {
                        'apply_to_criteria': 0
                    },
                    'depreciation_model': 'none',
                    'deal_terms': 1,
                    'distribution_type': 'na',
                    'mean': 0,
                    'standard_deviation': 0,
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'mode': 0,
                    'seed': 1
                }]
            },
            'drilling_cost': {},
            'completion_cost': {},
            'recompletion_workover': {},
            'embedded': [ObjectId('6441c787fc13ce001268f080')],
            'fetched_embedded': [
                [
                    [{
                        'key': 'category',
                        'value': 'drilling'
                    }, {
                        'key': 'description',
                        'value': ''
                    }, {
                        'key': 'tangible',
                        'value': 0
                    }, {
                        'key': 'intangible',
                        'value': 0
                    }, {
                        'key': 'capex_expense',
                        'value': 'capex'
                    }, {
                        'key': 'after_econ_limit',
                        'value': 'no'
                    }, {
                        'key': 'calculation',
                        'value': 'gross'
                    }, {
                        'key': 'escalation_model',
                        'value': 'none'
                    }, {
                        'key': 'depreciation_model',
                        'value': 'none'
                    }, {
                        'key': 'deal_terms',
                        'value': 1
                    }, {
                        'key': 'criteria_option',
                        'value': 'offset_to_fpd'
                    }, {
                        'key': 'criteria_value',
                        'value': -120
                    }, {
                        'key': 'escalation_start_option',
                        'value': 'apply_to_criteria'
                    }, {
                        'key': 'escalation_start_value',
                        'value': 0
                    }],
                    [
                        {
                            'key': 'category',
                            'value': 'drilling'
                        },
                        {
                            'key': 'description',
                            'value': ''
                        },
                        {
                            'key': 'tangible',
                            'value': 0
                        },
                        {
                            'key': 'intangible',
                            'value': 0
                        },
                        {
                            'key': 'capex_expense',
                            'value': 'capex'
                        },
                        {
                            'key': 'after_econ_limit',
                            'value': 'no'
                        },
                        {
                            'key': 'calculation',
                            'value': 'gross'
                        },
                        {
                            'key': 'escalation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'depreciation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'deal_terms',
                            'value': 1
                        },
                        {
                            'key': 'criteria_option',
                            'value': 'offset_to_fpd'
                        },
                        {
                            'key': 'criteria_value',
                            'value': -120
                        },
                        {
                            'key': 'escalation_start_option',
                            'value': 'apply_to_criteria'
                        },
                        {
                            'key': 'escalation_start_value',
                            'value': 0
                        },
                    ],
                ],
            ]
        },
        'dates': {
            'unique': False,
            'name': 'bar',
            'dates_setting': {
                'max_well_life': 50,
                'as_of_date': {
                    'date': '2023-05-01'
                },
                'discount_date': {
                    'date': '2023-05-01'
                },
                'cash_flow_prior_to_as_of_date': 'no',
                'production_data_resolution': 'same_as_forecast',
                'fpd_source_hierarchy': {
                    'first_fpd_source': {
                        'well_header': ''
                    },
                    'second_fpd_source': {
                        'production_data': ''
                    },
                    'third_fpd_source': {
                        'forecast': ''
                    },
                    'fourth_fpd_source': {
                        'not_used': ''
                    },
                    'use_forecast_schedule_when_no_prod': 'yes'
                }
            },
            'cut_off': {
                'max_cum_cash_flow': '',
                'min_cut_off': {
                    'none': ''
                },
                'capex_offset_to_ecl': 'no',
                'include_capex': 'no',
                'discount': 0,
                'consecutive_negative': 0,
                'econ_limit_delay': 0,
                'side_phase_end': 'no'
            },
            'embedded': []
        },
        'ownership_reversion': {
            'unique': False,
            'name': 'foo',
            'ownership': {
                'initial_ownership': {
                    'working_interest': 44,
                    'original_ownership': {
                        'net_revenue_interest': 4,
                        'lease_net_revenue_interest': 4
                    },
                    'net_profit_interest_type': 'expense',
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'first_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'second_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'third_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fourth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fifth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'sixth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'seventh_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'eighth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'ninth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'tenth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                }
            },
            'embedded': []
        }
    },
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('64499b8adf547cea7b9f4c5e'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63a0e8dce640e5a88bb7d9dd'),
        'schemaVersion': 1,
        'dataPool': 'internal',
        'dataSource': 'internal',
        'project': ObjectId('63a0e8dbe640e5a88bb7d909'),
        'lateral_length': None,
        'perf_lateral_length': 9802,
        'primary_product': None,
        'true_vertical_depth': 7299,
        'copied': False,
        'first_fluid_volume': None,
        'first_prop_weight': None,
        'measured_depth': None,
        'surfaceLatitude': 40.205082221,
        'surfaceLongitude': -104.80219552,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': datetime(2021, 1, 15, 0, 0),
        'chosenID': '0512350216',
        'api10': '0512350216',
        'api14': '05123502160000',
        'chosenKeyID': 'API10',
        'completion_start_date': datetime(2021, 3, 13, 0, 0),
        'county': 'WELD',
        'createdAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'current_operator': 'OXY',
        'custom_bool_0': False,
        'custom_bool_1': False,
        'custom_number_0': 100,
        'field': 'WATTENBERG',
        'first_prod_date': datetime(2021, 1, 1, 0, 0),
        'geohash': '9xjkxpj7efe1',
        'has_daily': False,
        'has_monthly': True,
        'hole_direction': 'H',
        'inptID': 'INPTUMMs3mlG4R',
        'last_prod_date_daily': None,
        'last_prod_date_monthly': datetime(2022, 10, 15, 0, 0),
        'lease_name': 'BARCLAY FARMS',
        'location': {
            'type': 'Point',
            'coordinates': [-104.80219552, 40.205082221]
        },
        'lower_perforation': 18285,
        'mostRecentImportDate': datetime(2022, 12, 19, 21, 40, 4, 167000),
        'mostRecentImportDesc': 'Survey',
        'mostRecentImportType': 'spreadsheet',
        'permit_date': datetime(2019, 6, 19, 0, 0),
        'range': '66W',
        'section': '20',
        'spud_date': datetime(2019, 10, 9, 0, 0),
        'state': 'CO',
        'status': 'A',
        'toeLatitude': 40.23189168,
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-104.804698827, 40.23189168]
        },
        'toeLongitude': -104.804698827,
        'township': '3N',
        'updatedAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'upper_perforation': 7841,
        'well_name': 'BARCLAY FARMS 20-7HZ',
        'well_number': '20-7HZ',
        'well_type': 'OIL',
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'basin': 'DJ',
        'custom_number_1': 22,
        'custom_string_2': '01PDP',
        'custom_string_5': 'IHS PROD',
        'custom_string_8': 'IHS PROD',
        'custom_number_2': 17,
        'custom_string_0': 'Niobrara B',
        'custom_string_1': 'ACTUAL',
        'custom_string_10': 'DJ AOI',
        'custom_string_7': 'DJ_17',
        'custom_string_3': 'ACTUAL',
        'type_curve_area': 'CC_DJ_2019+_S GC',
        '__v': 0,
        'mostRecentImport': ObjectId('63a0da346d559865423fa422'),
        'elevation': 4939,
        'has_directional_survey': True,
        'closest_well_any_zone': ObjectId('63a0e8dce640e5a88bb7d9f2'),
        'hz_well_spacing_any_zone': 320.282,
        'vt_well_spacing_any_zone': 69.398
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {
        'general_options': {
            'main_options': {
                'aggregation_date': '2023-05-01',
                'currency': 'USD',
                'reporting_period': 'calendar',
                'fiscal': '',
                'income_tax': 'no',
                'project_type': 'primary_recovery'
            },
            'income_tax': {
                'fifteen_depletion': 'no',
                'carry_forward': 'no',
                'state_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                },
                'federal_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                }
            },
            'discount_table': {
                'discount_method':
                'yearly',
                'cash_accrual_time':
                'mid_month',
                'first_discount':
                10,
                'second_discount':
                15,
                'rows': [{
                    'discount_table': 0
                }, {
                    'discount_table': 2
                }, {
                    'discount_table': 5
                }, {
                    'discount_table': 8
                }, {
                    'discount_table': 10
                }, {
                    'discount_table': 12
                }, {
                    'discount_table': 15
                }, {
                    'discount_table': 20
                }, {
                    'discount_table': 25
                }, {
                    'discount_table': 30
                }, {
                    'discount_table': 40
                }, {
                    'discount_table': 50
                }, {
                    'discount_table': 60
                }, {
                    'discount_table': 70
                }, {
                    'discount_table': 80
                }, {
                    'discount_table': 100
                }]
            },
            'boe_conversion': {
                'oil': 1,
                'wet_gas': 6,
                'dry_gas': 6,
                'ngl': 1,
                'drip_condensate': 1
            },
            'reporting_units': {
                'oil': 'MBBL',
                'gas': 'MMCF',
                'ngl': 'MBBL',
                'drip_condensate': 'MBBL',
                'water': 'MBBL',
                'pressure': 'PSI',
                'cash': 'M$',
                'water_cut': 'BBL/BOE',
                'gor': 'CF/BBL',
                'condensate_gas_ratio': 'BBL/MMCF',
                'drip_condensate_yield': 'BBL/MMCF',
                'ngl_yield': 'BBL/MMCF'
            }
        },
        'capex': {
            'unique':
            False,
            'name':
            'bas',
            'other_capex': {
                'rows': [{
                    'category': 'other_investment',
                    'description': '',
                    'tangible': 0,
                    'intangible': 0,
                    'offset_to_fpd': -120,
                    'capex_expense': 'capex',
                    'after_econ_limit': 'no',
                    'calculation': 'gross',
                    'escalation_model': 'none',
                    'escalation_start': {
                        'apply_to_criteria': 0
                    },
                    'depreciation_model': 'none',
                    'deal_terms': 1,
                    'distribution_type': 'na',
                    'mean': 0,
                    'standard_deviation': 0,
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'mode': 0,
                    'seed': 1
                }]
            },
            'drilling_cost': {},
            'completion_cost': {},
            'recompletion_workover': {},
            'embedded': [ObjectId('6441c787fc13ce001268f080')],
            'fetched_embedded': [
                [
                    [{
                        'key': 'category',
                        'value': 'drilling'
                    }, {
                        'key': 'description',
                        'value': ''
                    }, {
                        'key': 'tangible',
                        'value': 0
                    }, {
                        'key': 'intangible',
                        'value': 0
                    }, {
                        'key': 'capex_expense',
                        'value': 'capex'
                    }, {
                        'key': 'after_econ_limit',
                        'value': 'no'
                    }, {
                        'key': 'calculation',
                        'value': 'gross'
                    }, {
                        'key': 'escalation_model',
                        'value': 'none'
                    }, {
                        'key': 'depreciation_model',
                        'value': 'none'
                    }, {
                        'key': 'deal_terms',
                        'value': 1
                    }, {
                        'key': 'criteria_option',
                        'value': 'offset_to_fpd'
                    }, {
                        'key': 'criteria_value',
                        'value': -120
                    }, {
                        'key': 'escalation_start_option',
                        'value': 'apply_to_criteria'
                    }, {
                        'key': 'escalation_start_value',
                        'value': 0
                    }],
                    [
                        {
                            'key': 'category',
                            'value': 'drilling'
                        },
                        {
                            'key': 'description',
                            'value': ''
                        },
                        {
                            'key': 'tangible',
                            'value': 0
                        },
                        {
                            'key': 'intangible',
                            'value': 0
                        },
                        {
                            'key': 'capex_expense',
                            'value': 'capex'
                        },
                        {
                            'key': 'after_econ_limit',
                            'value': 'no'
                        },
                        {
                            'key': 'calculation',
                            'value': 'gross'
                        },
                        {
                            'key': 'escalation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'depreciation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'deal_terms',
                            'value': 1
                        },
                        {
                            'key': 'criteria_option',
                            'value': 'offset_to_fpd'
                        },
                        {
                            'key': 'criteria_value',
                            'value': -120
                        },
                        {
                            'key': 'escalation_start_option',
                            'value': 'apply_to_criteria'
                        },
                        {
                            'key': 'escalation_start_value',
                            'value': 0
                        },
                    ],
                ],
            ]
        },
        'dates': {
            'unique': False,
            'name': 'bar',
            'dates_setting': {
                'max_well_life': 50,
                'as_of_date': {
                    'date': '2023-05-01'
                },
                'discount_date': {
                    'date': '2023-05-01'
                },
                'cash_flow_prior_to_as_of_date': 'no',
                'production_data_resolution': 'same_as_forecast',
                'fpd_source_hierarchy': {
                    'first_fpd_source': {
                        'well_header': ''
                    },
                    'second_fpd_source': {
                        'production_data': ''
                    },
                    'third_fpd_source': {
                        'forecast': ''
                    },
                    'fourth_fpd_source': {
                        'not_used': ''
                    },
                    'use_forecast_schedule_when_no_prod': 'yes'
                }
            },
            'cut_off': {
                'max_cum_cash_flow': '',
                'min_cut_off': {
                    'none': ''
                },
                'capex_offset_to_ecl': 'no',
                'include_capex': 'no',
                'discount': 0,
                'consecutive_negative': 0,
                'econ_limit_delay': 0,
                'side_phase_end': 'no'
            },
            'embedded': []
        },
        'ownership_reversion': {
            'unique': False,
            'name': 'foo',
            'ownership': {
                'initial_ownership': {
                    'working_interest': 44,
                    'original_ownership': {
                        'net_revenue_interest': 4,
                        'lease_net_revenue_interest': 4
                    },
                    'net_profit_interest_type': 'expense',
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'first_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'second_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'third_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fourth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fifth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'sixth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'seventh_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'eighth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'ninth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'tenth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                }
            },
            'embedded': []
        }
    },
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('64499b8adf547cea7b9f4c5f'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63a0e8dce640e5a88bb7d9de'),
        'schemaVersion': 1,
        'dataPool': 'internal',
        'dataSource': 'internal',
        'project': ObjectId('63a0e8dbe640e5a88bb7d909'),
        'lateral_length': None,
        'perf_lateral_length': 9789,
        'primary_product': None,
        'true_vertical_depth': 7159,
        'copied': False,
        'first_fluid_volume': None,
        'first_prop_weight': None,
        'measured_depth': None,
        'surfaceLatitude': 40.205165221,
        'surfaceLongitude': -104.80219452,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': datetime(2021, 1, 15, 0, 0),
        'chosenID': '0512350215',
        'api10': '0512350215',
        'api14': '05123502150000',
        'chosenKeyID': 'API10',
        'completion_start_date': datetime(2021, 3, 15, 0, 0),
        'county': 'WELD',
        'createdAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'current_operator': 'OXY',
        'custom_bool_0': False,
        'custom_bool_1': False,
        'custom_number_0': 100,
        'field': 'WATTENBERG',
        'first_prod_date': datetime(2021, 1, 1, 0, 0),
        'geohash': '9xjkxpjk5f5b',
        'has_daily': False,
        'has_monthly': True,
        'hole_direction': 'H',
        'inptID': 'INPTlCIsTF0Qg3',
        'last_prod_date_daily': None,
        'last_prod_date_monthly': datetime(2022, 10, 15, 0, 0),
        'lease_name': 'BARCLAY FARMS',
        'location': {
            'type': 'Point',
            'coordinates': [-104.80219452, 40.205165221]
        },
        'lower_perforation': 18423,
        'mostRecentImportDate': datetime(2022, 12, 19, 21, 40, 4, 167000),
        'mostRecentImportDesc': 'Survey',
        'mostRecentImportType': 'spreadsheet',
        'permit_date': datetime(2019, 6, 19, 0, 0),
        'range': '66W',
        'section': '20',
        'spud_date': datetime(2019, 10, 18, 0, 0),
        'state': 'CO',
        'status': 'A',
        'toeLatitude': 40.231785997,
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-104.806949019, 40.231785997]
        },
        'toeLongitude': -104.806949019,
        'township': '3N',
        'updatedAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'upper_perforation': 8073,
        'well_name': 'BARCLAY FARMS 20-5HZ',
        'well_number': '20-5HZ',
        'well_type': 'OIL',
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'basin': 'DJ',
        'custom_number_1': 22,
        'custom_string_2': '01PDP',
        'custom_string_5': 'IHS PROD',
        'custom_string_8': 'IHS PROD',
        'custom_number_2': 17,
        'custom_string_0': 'Niobrara B',
        'custom_string_1': 'ACTUAL',
        'custom_string_10': 'DJ AOI',
        'custom_string_7': 'DJ_17',
        'custom_string_3': 'ACTUAL',
        'type_curve_area': 'CC_DJ_2019+_S GC',
        '__v': 0,
        'mostRecentImport': ObjectId('63a0da346d559865423fa422'),
        'elevation': 4939,
        'has_directional_survey': True,
        'closest_well_any_zone': ObjectId('63a0e8dce640e5a88bb7d9ea'),
        'hz_well_spacing_any_zone': 304.225,
        'vt_well_spacing_any_zone': 75.449
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {
        'general_options': {
            'main_options': {
                'aggregation_date': '2023-05-01',
                'currency': 'USD',
                'reporting_period': 'calendar',
                'fiscal': '',
                'income_tax': 'no',
                'project_type': 'primary_recovery'
            },
            'income_tax': {
                'fifteen_depletion': 'no',
                'carry_forward': 'no',
                'state_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                },
                'federal_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                }
            },
            'discount_table': {
                'discount_method':
                'yearly',
                'cash_accrual_time':
                'mid_month',
                'first_discount':
                10,
                'second_discount':
                15,
                'rows': [{
                    'discount_table': 0
                }, {
                    'discount_table': 2
                }, {
                    'discount_table': 5
                }, {
                    'discount_table': 8
                }, {
                    'discount_table': 10
                }, {
                    'discount_table': 12
                }, {
                    'discount_table': 15
                }, {
                    'discount_table': 20
                }, {
                    'discount_table': 25
                }, {
                    'discount_table': 30
                }, {
                    'discount_table': 40
                }, {
                    'discount_table': 50
                }, {
                    'discount_table': 60
                }, {
                    'discount_table': 70
                }, {
                    'discount_table': 80
                }, {
                    'discount_table': 100
                }]
            },
            'boe_conversion': {
                'oil': 1,
                'wet_gas': 6,
                'dry_gas': 6,
                'ngl': 1,
                'drip_condensate': 1
            },
            'reporting_units': {
                'oil': 'MBBL',
                'gas': 'MMCF',
                'ngl': 'MBBL',
                'drip_condensate': 'MBBL',
                'water': 'MBBL',
                'pressure': 'PSI',
                'cash': 'M$',
                'water_cut': 'BBL/BOE',
                'gor': 'CF/BBL',
                'condensate_gas_ratio': 'BBL/MMCF',
                'drip_condensate_yield': 'BBL/MMCF',
                'ngl_yield': 'BBL/MMCF'
            }
        },
        'capex': {
            'unique':
            False,
            'name':
            'bas',
            'other_capex': {
                'rows': [{
                    'category': 'other_investment',
                    'description': '',
                    'tangible': 0,
                    'intangible': 0,
                    'offset_to_fpd': -120,
                    'capex_expense': 'capex',
                    'after_econ_limit': 'no',
                    'calculation': 'gross',
                    'escalation_model': 'none',
                    'escalation_start': {
                        'apply_to_criteria': 0
                    },
                    'depreciation_model': 'none',
                    'deal_terms': 1,
                    'distribution_type': 'na',
                    'mean': 0,
                    'standard_deviation': 0,
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'mode': 0,
                    'seed': 1
                }]
            },
            'drilling_cost': {},
            'completion_cost': {},
            'recompletion_workover': {},
            'embedded': [ObjectId('6441c787fc13ce001268f080')],
            'fetched_embedded': [
                [
                    [{
                        'key': 'category',
                        'value': 'drilling'
                    }, {
                        'key': 'description',
                        'value': ''
                    }, {
                        'key': 'tangible',
                        'value': 0
                    }, {
                        'key': 'intangible',
                        'value': 0
                    }, {
                        'key': 'capex_expense',
                        'value': 'capex'
                    }, {
                        'key': 'after_econ_limit',
                        'value': 'no'
                    }, {
                        'key': 'calculation',
                        'value': 'gross'
                    }, {
                        'key': 'escalation_model',
                        'value': 'none'
                    }, {
                        'key': 'depreciation_model',
                        'value': 'none'
                    }, {
                        'key': 'deal_terms',
                        'value': 1
                    }, {
                        'key': 'criteria_option',
                        'value': 'offset_to_fpd'
                    }, {
                        'key': 'criteria_value',
                        'value': -120
                    }, {
                        'key': 'escalation_start_option',
                        'value': 'apply_to_criteria'
                    }, {
                        'key': 'escalation_start_value',
                        'value': 0
                    }],
                    [
                        {
                            'key': 'category',
                            'value': 'drilling'
                        },
                        {
                            'key': 'description',
                            'value': ''
                        },
                        {
                            'key': 'tangible',
                            'value': 0
                        },
                        {
                            'key': 'intangible',
                            'value': 0
                        },
                        {
                            'key': 'capex_expense',
                            'value': 'capex'
                        },
                        {
                            'key': 'after_econ_limit',
                            'value': 'no'
                        },
                        {
                            'key': 'calculation',
                            'value': 'gross'
                        },
                        {
                            'key': 'escalation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'depreciation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'deal_terms',
                            'value': 1
                        },
                        {
                            'key': 'criteria_option',
                            'value': 'offset_to_fpd'
                        },
                        {
                            'key': 'criteria_value',
                            'value': -120
                        },
                        {
                            'key': 'escalation_start_option',
                            'value': 'apply_to_criteria'
                        },
                        {
                            'key': 'escalation_start_value',
                            'value': 0
                        },
                    ],
                ],
            ]
        },
        'dates': {
            'unique': False,
            'name': 'bar',
            'dates_setting': {
                'max_well_life': 50,
                'as_of_date': {
                    'date': '2023-05-01'
                },
                'discount_date': {
                    'date': '2023-05-01'
                },
                'cash_flow_prior_to_as_of_date': 'no',
                'production_data_resolution': 'same_as_forecast',
                'fpd_source_hierarchy': {
                    'first_fpd_source': {
                        'well_header': ''
                    },
                    'second_fpd_source': {
                        'production_data': ''
                    },
                    'third_fpd_source': {
                        'forecast': ''
                    },
                    'fourth_fpd_source': {
                        'not_used': ''
                    },
                    'use_forecast_schedule_when_no_prod': 'yes'
                }
            },
            'cut_off': {
                'max_cum_cash_flow': '',
                'min_cut_off': {
                    'none': ''
                },
                'capex_offset_to_ecl': 'no',
                'include_capex': 'no',
                'discount': 0,
                'consecutive_negative': 0,
                'econ_limit_delay': 0,
                'side_phase_end': 'no'
            },
            'embedded': []
        },
        'ownership_reversion': {
            'unique': False,
            'name': 'foo',
            'ownership': {
                'initial_ownership': {
                    'working_interest': 44,
                    'original_ownership': {
                        'net_revenue_interest': 4,
                        'lease_net_revenue_interest': 4
                    },
                    'net_profit_interest_type': 'expense',
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'first_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'second_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'third_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fourth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fifth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'sixth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'seventh_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'eighth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'ninth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'tenth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                }
            },
            'embedded': []
        }
    },
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}, {
    'assignment_id': ObjectId('64499b8adf547cea7b9f4c60'),
    'production_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'forecast_data': {
        'oil': None,
        'gas': None,
        'water': None
    },
    'p_series': 'P50',
    'well': {
        '_id': ObjectId('63a0e8dce640e5a88bb7d9df'),
        'schemaVersion': 1,
        'dataPool': 'internal',
        'dataSource': 'internal',
        'project': ObjectId('63a0e8dbe640e5a88bb7d909'),
        'lateral_length': None,
        'perf_lateral_length': 9797,
        'primary_product': None,
        'true_vertical_depth': 10769,
        'copied': False,
        'first_fluid_volume': None,
        'first_prop_weight': None,
        'measured_depth': None,
        'surfaceLatitude': 47.918406731,
        'surfaceLongitude': -102.886596217,
        'first_proppant_per_fluid': None,
        'refrac_proppant_per_perforated_interval': None,
        'refrac_fluid_per_perforated_interval': None,
        'refrac_proppant_per_fluid': None,
        'total_fluid_volume': None,
        'total_prop_weight': None,
        'total_proppant_per_fluid': None,
        'first_proppant_per_perforated_interval': None,
        'first_fluid_per_perforated_interval': None,
        'total_fluid_per_perforated_interval': None,
        'total_proppant_per_perforated_interval': None,
        'first_prod_date_daily_calc': None,
        'first_prod_date_monthly_calc': datetime(2013, 8, 15, 0, 0),
        'chosenID': '3305304291',
        'api10': '3305304291',
        'api14': '33053042910000',
        'chosenKeyID': 'API10',
        'completion_start_date': datetime(2013, 8, 13, 0, 0),
        'county': 'MCKENZIE',
        'createdAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'current_operator': 'Hess',
        'custom_bool_0': False,
        'custom_bool_1': False,
        'custom_number_0': 100,
        'custom_number_1': 107,
        'field': 'BLUE BUTTES',
        'first_prod_date': datetime(2013, 8, 1, 0, 0),
        'geohash': 'c8wbdg22bw3q',
        'has_daily': False,
        'has_monthly': True,
        'hole_direction': 'H',
        'inptID': 'INPT33M3tj3vNC',
        'last_prod_date_daily': None,
        'last_prod_date_monthly': datetime(2022, 10, 15, 0, 0),
        'lease_name': 'BB-BURK-151-95',
        'location': {
            'type': 'Point',
            'coordinates': [-102.886596217, 47.918406731]
        },
        'lower_perforation': 20340,
        'mostRecentImportDate': datetime(2022, 12, 19, 21, 40, 4, 167000),
        'mostRecentImportDesc': 'Survey',
        'mostRecentImportType': 'spreadsheet',
        'permit_date': datetime(2012, 8, 10, 0, 0),
        'range': '95W',
        'section': '7',
        'spud_date': datetime(2013, 3, 21, 0, 0),
        'state': 'ND',
        'status': 'A',
        'toeLatitude': 47.891607575,
        'toeLocation': {
            'type': 'Point',
            'coordinates': [-102.889108912, 47.891607575]
        },
        'toeLongitude': -102.889108912,
        'township': '151N',
        'updatedAt': datetime(2022, 12, 19, 22, 42, 44, 766000),
        'upper_perforation': 11195,
        'well_name': 'BB-BURK-151-95 0718H-2',
        'well_number': '0718H-2',
        'well_type': 'OIL',
        'total_additive_volume': None,
        'total_cluster_count': None,
        'total_stage_count': None,
        'basin': 'Williston',
        'custom_string_2': '01PDP',
        'custom_string_5': 'IHS PROD',
        'custom_string_8': 'IHS PROD',
        'custom_number_2': 19,
        'custom_string_0': 'UPPER THREE FORKS',
        'custom_string_1': 'ACTUAL',
        'custom_string_10': 'WILLISTON AOI',
        'custom_string_7': 'WILLISTON_19',
        'custom_string_3': 'ACTUAL',
        'type_curve_area': '2022_11_WILLISTON_1',
        '__v': 0,
        'mostRecentImport': ObjectId('63a0da346d559865423fa422'),
        'elevation': 2430,
        'has_directional_survey': True,
        'closest_well_any_zone': ObjectId('63a0e8dce640e5a88bb7d9da'),
        'hz_well_spacing_any_zone': 606.337,
        'vt_well_spacing_any_zone': 70.001
    },
    'incremental_index': 0,
    'combo_name': '01-Default 1',
    'assumptions': {
        'general_options': {
            'main_options': {
                'aggregation_date': '2023-05-01',
                'currency': 'USD',
                'reporting_period': 'calendar',
                'fiscal': '',
                'income_tax': 'no',
                'project_type': 'primary_recovery'
            },
            'income_tax': {
                'fifteen_depletion': 'no',
                'carry_forward': 'no',
                'state_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                },
                'federal_income_tax': {
                    'rows': [{
                        'multiplier': 0,
                        'entire_well_life': 'Flat'
                    }]
                }
            },
            'discount_table': {
                'discount_method':
                'yearly',
                'cash_accrual_time':
                'mid_month',
                'first_discount':
                10,
                'second_discount':
                15,
                'rows': [{
                    'discount_table': 0
                }, {
                    'discount_table': 2
                }, {
                    'discount_table': 5
                }, {
                    'discount_table': 8
                }, {
                    'discount_table': 10
                }, {
                    'discount_table': 12
                }, {
                    'discount_table': 15
                }, {
                    'discount_table': 20
                }, {
                    'discount_table': 25
                }, {
                    'discount_table': 30
                }, {
                    'discount_table': 40
                }, {
                    'discount_table': 50
                }, {
                    'discount_table': 60
                }, {
                    'discount_table': 70
                }, {
                    'discount_table': 80
                }, {
                    'discount_table': 100
                }]
            },
            'boe_conversion': {
                'oil': 1,
                'wet_gas': 6,
                'dry_gas': 6,
                'ngl': 1,
                'drip_condensate': 1
            },
            'reporting_units': {
                'oil': 'MBBL',
                'gas': 'MMCF',
                'ngl': 'MBBL',
                'drip_condensate': 'MBBL',
                'water': 'MBBL',
                'pressure': 'PSI',
                'cash': 'M$',
                'water_cut': 'BBL/BOE',
                'gor': 'CF/BBL',
                'condensate_gas_ratio': 'BBL/MMCF',
                'drip_condensate_yield': 'BBL/MMCF',
                'ngl_yield': 'BBL/MMCF'
            }
        },
        'capex': {
            'unique':
            False,
            'name':
            'bas',
            'other_capex': {
                'rows': [{
                    'category': 'other_investment',
                    'description': '',
                    'tangible': 0,
                    'intangible': 0,
                    'offset_to_fpd': -120,
                    'capex_expense': 'capex',
                    'after_econ_limit': 'no',
                    'calculation': 'gross',
                    'escalation_model': 'none',
                    'escalation_start': {
                        'apply_to_criteria': 0
                    },
                    'depreciation_model': 'none',
                    'deal_terms': 1,
                    'distribution_type': 'na',
                    'mean': 0,
                    'standard_deviation': 0,
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'mode': 0,
                    'seed': 1
                }]
            },
            'drilling_cost': {},
            'completion_cost': {},
            'recompletion_workover': {},
            'embedded': [ObjectId('6441c787fc13ce001268f080')],
            'fetched_embedded': [
                [
                    [{
                        'key': 'category',
                        'value': 'drilling'
                    }, {
                        'key': 'description',
                        'value': ''
                    }, {
                        'key': 'tangible',
                        'value': 0
                    }, {
                        'key': 'intangible',
                        'value': 0
                    }, {
                        'key': 'capex_expense',
                        'value': 'capex'
                    }, {
                        'key': 'after_econ_limit',
                        'value': 'no'
                    }, {
                        'key': 'calculation',
                        'value': 'gross'
                    }, {
                        'key': 'escalation_model',
                        'value': 'none'
                    }, {
                        'key': 'depreciation_model',
                        'value': 'none'
                    }, {
                        'key': 'deal_terms',
                        'value': 1
                    }, {
                        'key': 'criteria_option',
                        'value': 'offset_to_fpd'
                    }, {
                        'key': 'criteria_value',
                        'value': -120
                    }, {
                        'key': 'escalation_start_option',
                        'value': 'apply_to_criteria'
                    }, {
                        'key': 'escalation_start_value',
                        'value': 0
                    }],
                    [
                        {
                            'key': 'category',
                            'value': 'drilling'
                        },
                        {
                            'key': 'description',
                            'value': ''
                        },
                        {
                            'key': 'tangible',
                            'value': 0
                        },
                        {
                            'key': 'intangible',
                            'value': 0
                        },
                        {
                            'key': 'capex_expense',
                            'value': 'capex'
                        },
                        {
                            'key': 'after_econ_limit',
                            'value': 'no'
                        },
                        {
                            'key': 'calculation',
                            'value': 'gross'
                        },
                        {
                            'key': 'escalation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'depreciation_model',
                            'value': 'none'
                        },
                        {
                            'key': 'deal_terms',
                            'value': 1
                        },
                        {
                            'key': 'criteria_option',
                            'value': 'offset_to_fpd'
                        },
                        {
                            'key': 'criteria_value',
                            'value': -120
                        },
                        {
                            'key': 'escalation_start_option',
                            'value': 'apply_to_criteria'
                        },
                        {
                            'key': 'escalation_start_value',
                            'value': 0
                        },
                    ],
                ],
            ]
        },
        'dates': {
            'unique': False,
            'name': 'bar',
            'dates_setting': {
                'max_well_life': 50,
                'as_of_date': {
                    'date': '2023-05-01'
                },
                'discount_date': {
                    'date': '2023-05-01'
                },
                'cash_flow_prior_to_as_of_date': 'no',
                'production_data_resolution': 'same_as_forecast',
                'fpd_source_hierarchy': {
                    'first_fpd_source': {
                        'well_header': ''
                    },
                    'second_fpd_source': {
                        'production_data': ''
                    },
                    'third_fpd_source': {
                        'forecast': ''
                    },
                    'fourth_fpd_source': {
                        'not_used': ''
                    },
                    'use_forecast_schedule_when_no_prod': 'yes'
                }
            },
            'cut_off': {
                'max_cum_cash_flow': '',
                'min_cut_off': {
                    'none': ''
                },
                'capex_offset_to_ecl': 'no',
                'include_capex': 'no',
                'discount': 0,
                'consecutive_negative': 0,
                'econ_limit_delay': 0,
                'side_phase_end': 'no'
            },
            'embedded': []
        },
        'ownership_reversion': {
            'unique': False,
            'name': 'foo',
            'ownership': {
                'initial_ownership': {
                    'working_interest': 44,
                    'original_ownership': {
                        'net_revenue_interest': 4,
                        'lease_net_revenue_interest': 4
                    },
                    'net_profit_interest_type': 'expense',
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'first_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'second_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'third_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fourth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'fifth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'sixth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'seventh_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'eighth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'ninth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                },
                'tenth_reversion': {
                    'no_reversion': '',
                    'reversion_tied_to': {
                        'as_of': ''
                    },
                    'balance': 'gross',
                    'include_net_profit_interest': 'yes',
                    'working_interest': '',
                    'original_ownership': {
                        'net_revenue_interest': '',
                        'lease_net_revenue_interest': ''
                    },
                    'net_profit_interest': 0,
                    'oil_ownership': {
                        'net_revenue_interest': ''
                    },
                    'gas_ownership': {
                        'net_revenue_interest': ''
                    },
                    'ngl_ownership': {
                        'net_revenue_interest': ''
                    },
                    'drip_condensate_ownership': {
                        'net_revenue_interest': ''
                    }
                }
            },
            'embedded': []
        }
    },
    'forecast_name': None,
    'oil_tc_risking': None,
    'gas_tc_risking': None,
    'water_tc_risking': None,
    'apply_normalization': None,
    'network': None,
    'ghg': None,
    'schedule': {}
}]

ECON_BATCH_INPUT_1_2_FIXTURE = [{
    "scenario_id":
    ObjectId('643dbfbfccae6148ebc0ea37'),
    "project_id":
    ObjectId('63766e02023757c1078bfe7d'),
    "assignment_ids": [
        ObjectId('643dbfbfccae6148ebc0ea3b'),
        ObjectId('643dbfbfccae6148ebc0ea3e'),
        ObjectId('643dbfbfccae6148ebc0ea3c'),
        ObjectId('643dbfbfccae6148ebc0ea43'),
        ObjectId('643dbfbfccae6148ebc0ea40'),
        ObjectId('643dbfbfccae6148ebc0ea3a'),
        ObjectId('643dbfbfccae6148ebc0ea3d'),
        ObjectId('643dbfbfccae6148ebc0ea42'),
        ObjectId('643dbfbfccae6148ebc0ea44'),
        ObjectId('643dbfbfccae6148ebc0ea3f'),
        ObjectId('643dbfbfccae6148ebc0ea41')
    ],
    "assumption_keys": [
        'capex', 'dates', 'expenses', 'ownership_reversion', 'pricing', 'differentials', 'production_taxes',
        'production_vs_fit', 'reserves_category', 'risking', 'stream_properties', 'emission', 'schedule', 'network'
    ],
    "combos": [{
        'qualifiers': {
            'reserves_category': {
                'key': 'default',
                'name': 'Default'
            },
            'dates': {
                'key': 'default',
                'name': 'Default'
            },
            'ownership_reversion': {
                'key': 'default',
                'name': 'Default'
            },
            'forecast': {
                'key': 'default',
                'name': 'Default'
            },
            'forecast_p_series': {
                'key': 'default',
                'name': 'Default'
            },
            'network': {
                'key': 'default',
                'name': 'Default'
            },
            'schedule': {
                'key': 'default',
                'name': 'Default'
            },
            'capex': {
                'key': 'default',
                'name': 'Default'
            },
            'pricing': {
                'key': 'default',
                'name': 'Default'
            },
            'differentials': {
                'key': 'default',
                'name': 'Default'
            },
            'stream_properties': {
                'key': 'default',
                'name': 'Default'
            },
            'expenses': {
                'key': 'default',
                'name': 'Default'
            },
            'production_taxes': {
                'key': 'default',
                'name': 'Default'
            },
            'production_vs_fit': {
                'key': 'default',
                'name': 'Default'
            },
            'risking': {
                'key': 'default',
                'name': 'Default'
            },
            'emission': {
                'key': 'default',
                'name': 'Default'
            }
        },
        'selected': True,
        'name': '01-Default 1'
    }]
}, {
    "scenario_id":
    ObjectId('643dbfbfccae6148ebc0ea37'),
    "project_id":
    ObjectId('63766e02023757c1078bfe7d'),
    "assignment_ids": [
        ObjectId('643dbfbfccae6148ebc0ea3b'),
        ObjectId('643dbfbfccae6148ebc0ea3e'),
        ObjectId('643dbfbfccae6148ebc0ea3c'),
        ObjectId('643dbfbfccae6148ebc0ea43'),
        ObjectId('643dbfbfccae6148ebc0ea40'),
        ObjectId('643dbfbfccae6148ebc0ea3a'),
        ObjectId('643dbfbfccae6148ebc0ea3d'),
        ObjectId('643dbfbfccae6148ebc0ea42'),
        ObjectId('643dbfbfccae6148ebc0ea44'),
        ObjectId('643dbfbfccae6148ebc0ea3f'),
        ObjectId('643dbfbfccae6148ebc0ea41')
    ],
    "assumption_keys": [
        'capex', 'dates', 'expenses', 'ownership_reversion', 'pricing', 'differentials', 'production_taxes',
        'production_vs_fit', 'reserves_category', 'risking', 'stream_properties', 'emission', 'schedule', 'network'
    ],
    "combos": [{
        'qualifiers': {
            'reserves_category': {
                'key': 'default',
                'name': 'Default'
            },
            'dates': {
                'key': 'default',
                'name': 'Default'
            },
            'ownership_reversion': {
                'key': 'default',
                'name': 'Default'
            },
            'forecast': {
                'key': 'default',
                'name': 'Default'
            },
            'forecast_p_series': {
                'key': 'default',
                'name': 'Default'
            },
            'network': {
                'key': 'default',
                'name': 'Default'
            },
            'schedule': {
                'key': 'default',
                'name': 'Default'
            },
            'capex': {
                'key': 'qualifier1',
                'name': 'CAPE_2023_Q2'
            },
            'pricing': {
                'key': 'default',
                'name': 'Default'
            },
            'differentials': {
                'key': 'default',
                'name': 'Default'
            },
            'stream_properties': {
                'key': 'default',
                'name': 'Default'
            },
            'expenses': {
                'key': 'default',
                'name': 'Default'
            },
            'production_taxes': {
                'key': 'default',
                'name': 'Default'
            },
            'production_vs_fit': {
                'key': 'default',
                'name': 'Default'
            },
            'risking': {
                'key': 'default',
                'name': 'Default'
            },
            'emission': {
                'key': 'default',
                'name': 'Default'
            }
        },
        'selected': True,
        'name': '01-Default 1'
    }]
}]

ECON_BATCH_INPUT_FIXTURE_3 = [{
    "scenario_id":
    ObjectId('64499b8adf547cea7b9f4c54'),
    "project_id":
    ObjectId('63a0e8dbe640e5a88bb7d909'),
    "assignment_ids": [
        ObjectId('64499b8adf547cea7b9f4c57'),
        ObjectId('64499b8adf547cea7b9f4c58'),
        ObjectId('64499b8adf547cea7b9f4c59'),
        ObjectId('64499b8adf547cea7b9f4c5a'),
        ObjectId('64499b8adf547cea7b9f4c5b'),
        ObjectId('64499b8adf547cea7b9f4c5c'),
        ObjectId('64499b8adf547cea7b9f4c5d'),
        ObjectId('64499b8adf547cea7b9f4c5e'),
        ObjectId('64499b8adf547cea7b9f4c5f'),
        ObjectId('64499b8adf547cea7b9f4c60')
    ],
    "assumption_keys": [
        'capex', 'dates', 'expenses', 'ownership_reversion', 'pricing', 'differentials', 'production_taxes',
        'production_vs_fit', 'reserves_category', 'risking', 'stream_properties', 'emission', 'schedule', 'network'
    ],
    "combos": [{
        'qualifiers': {
            'reserves_category': {
                'key': 'default',
                'name': 'Default'
            },
            'dates': {
                'key': 'default',
                'name': 'Default'
            },
            'ownership_reversion': {
                'key': 'default',
                'name': 'Default'
            },
            'forecast': {
                'key': 'default',
                'name': 'Default'
            },
            'forecast_p_series': {
                'key': 'default',
                'name': 'Default'
            },
            'network': {
                'key': 'default',
                'name': 'Default'
            },
            'schedule': {
                'key': 'default',
                'name': 'Default'
            },
            'capex': {
                'key': 'qualifier1',
                'name': 'CAPE_2023_Q2'
            },
            'pricing': {
                'key': 'default',
                'name': 'Default'
            },
            'differentials': {
                'key': 'default',
                'name': 'Default'
            },
            'stream_properties': {
                'key': 'default',
                'name': 'Default'
            },
            'expenses': {
                'key': 'default',
                'name': 'Default'
            },
            'production_taxes': {
                'key': 'default',
                'name': 'Default'
            },
            'production_vs_fit': {
                'key': 'default',
                'name': 'Default'
            },
            'risking': {
                'key': 'default',
                'name': 'Default'
            },
            'emission': {
                'key': 'default',
                'name': 'Default'
            }
        },
        'selected': True,
        'name': '01-Default 1'
    }],
}]

LOOKUP_TABLE_FIXTURE = [{
    "_id":
    ObjectId("6441c812fc13ce001268f20e"),
    "configuration": {
        "caseInsensitiveMatching": True,
        "selectedHeaders": ["type_curve_area", "perf_lateral_length", "first_prod_date"],
        "selectedAssumptions": ["dates"]
    },
    "copiedFrom":
    None,
    "tags": [],
    "name":
    "skrughoff20230420t171735",
    "project":
    ObjectId("63a0e8dbe640e5a88bb7d909"),
    "createdBy":
    ObjectId("611beca03556540015af8562"),
    "rules": [{
        "dates": ObjectId("6441c752fc13ce001268efee"),
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f231"),
                "key": "type_curve_area",
                "value": "2022_11_WILLISTON_1"
            }, {
                "operator": "less_than_equal",
                "_id": ObjectId("6441c83dfc13ce001268f232"),
                "key": "perf_lateral_length",
                "value": 900000
            }, {
                "operator": "greater_than_equal",
                "_id": ObjectId("6441c83dfc13ce001268f233"),
                "key": "perf_lateral_length",
                "value": 1
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f234"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f235"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f236"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f237"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f238"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f239"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f23a"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f23b"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f23c"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f23d"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f23e"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f23f"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f240"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f241"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f242"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f243"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f244"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f245"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f246"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f247"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f248"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f249"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f24a"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f24b"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f24c"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f24d"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f24e"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f24f"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f250"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f251"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f252"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f253"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f254"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f255"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f256"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f257"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f258"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f259"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f25a"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f25b"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f25c"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f25d"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f25e"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f25f"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f260"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f261"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f262"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f263"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f264"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f265"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f266"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f267"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f268"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f269"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f26a"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f26b"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f26c"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f26d"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f26e"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f26f"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f270"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f271"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f272"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f273"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f274"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f275"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f276"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f277"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f278"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f279"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f27a"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f27b"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f27c"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f27d"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f27e"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f27f"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f280"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f281"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f282"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f283"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f284"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f285"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f286"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f287"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f288"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f289"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f28a"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f28b"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f28c"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f28d"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f28e"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f28f"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f290"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83dfc13ce001268f291"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83efc13ce001268f292"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83efc13ce001268f293"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83efc13ce001268f294"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83efc13ce001268f295"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }, {
        "filter": {
            "conditions": [{
                "operator": "equal",
                "_id": ObjectId("6441c83efc13ce001268f296"),
                "key": "type_curve_area",
                "value": ""
            }]
        }
    }],
    "createdAt":
    datetime.fromisoformat("2023-04-20T23:17:38.026"),
    "updatedAt":
    datetime.fromisoformat("2023-04-20T23:18:21.981"),
    "__v":
    0
}]

EMBEDDED_LOOKUP_TABLES_FIXTURE = [{
    "_id":
    ObjectId("6441c787fc13ce001268f080"),
    "configuration": {
        "caseInsensitiveMatching": True,
        "selectedHeaders": [],
        "selectedHeadersMatchBehavior": {}
    },
    "copiedFrom":
    None,
    "tags": [],
    "lines": [
        [{
            "key": "category",
            "value": "drilling"
        }, {
            "key": "description",
            "value": ""
        }, {
            "key": "tangible",
            "value": 0
        }, {
            "key": "intangible",
            "value": 0
        }, {
            "key": "capex_expense",
            "value": "capex"
        }, {
            "key": "after_econ_limit",
            "value": "no"
        }, {
            "key": "calculation",
            "value": "gross"
        }, {
            "key": "escalation_model",
            "value": "none"
        }, {
            "key": "depreciation_model",
            "value": "none"
        }, {
            "key": "deal_terms",
            "value": 1
        }, {
            "key": "criteria_option",
            "value": "offset_to_fpd"
        }, {
            "key": "criteria_value",
            "value": -120
        }, {
            "key": "escalation_start_option",
            "value": "apply_to_criteria"
        }, {
            "key": "escalation_start_value",
            "value": 0
        }],
        [
            {
                "key": "category",
                "value": "drilling"
            },
            {
                "key": "description",
                "value": ""
            },
            {
                "key": "tangible",
                "value": 0
            },
            {
                "key": "intangible",
                "value": 0
            },
            {
                "key": "capex_expense",
                "value": "capex"
            },
            {
                "key": "after_econ_limit",
                "value": "no"
            },
            {
                "key": "calculation",
                "value": "gross"
            },
            {
                "key": "escalation_model",
                "value": "none"
            },
            {
                "key": "depreciation_model",
                "value": "none"
            },
            {
                "key": "deal_terms",
                "value": 1
            },
            {
                "key": "criteria_option",
                "value": "offset_to_fpd"
            },
            {
                "key": "criteria_value",
                "value": -120
            },
            {
                "key": "escalation_start_option",
                "value": "apply_to_criteria"
            },
            {
                "key": "escalation_start_value",
                "value": 0
            },
        ],
    ],
    "name":
    "skrughoff20230420t171515",
    "assumptionKey":
    "capex",
    "project":
    ObjectId("63a0e8dbe640e5a88bb7d909"),
    "rules": [],
    "createdBy":
    ObjectId("611beca03556540015af8562"),
    "createdAt":
    datetime.fromisoformat("2023-04-20T23:15:19.107"),
    "updatedAt":
    datetime.fromisoformat("2023-04-20T23:15:28.073"),
    "__v":
    0
}]
