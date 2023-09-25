from datetime import datetime
from bson.objectid import ObjectId
import pandas as pd

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

SCHEDULE_SETTINGS_FIXTURE = [{
    "_id":
    ObjectId("63a3437aef6ee60012751127"),
    "name":
    "generic test Config",
    "project":
    ObjectId("6356db57192dfc0012ea8847"),
    "createdBy":
    ObjectId("6356aa16192dfc0012ea8401"),
    "createdAt":
    datetime.fromisoformat("2022-12-21T17:33:46.936"),
    "updatedAt":
    datetime.fromisoformat("2022-12-21T17:33:46.936"),
    "__v":
    0,
    "activitySteps": [{
        'color': '#00ffff',
        "name": "Pad Preparation",
        "requiresResources": True,
        "padOperation": "parallel",
        "stepDuration": {
            "days": 5,
            "useLookup": False
        },
        "delayAfterStep": 0,
        "stepIdx": 0,
        "previousStepIdx": []
    }, {
        'color': '#00ffff',
        "name": "Drill",
        "requiresResources": True,
        "padOperation": "sequence",
        "stepDuration": {
            "days": 15,
            "useLookup": False
        },
        "delayAfterStep": 0,
        "stepIdx": 1,
        "previousStepIdx": [0]
    }, {
        'color': '#00ffff',
        "name": "Completion",
        "requiresResources": True,
        "padOperation": "sequence",
        "stepDuration": {
            "days": 15,
            "useLookup": False
        },
        "delayAfterStep": 0,
        "stepIdx": 2,
        "previousStepIdx": [1]
    }, {
        "name": "Facility Construction",
        "requiresResources": False,
        "padOperation": "parallel",
        "stepDuration": {
            "days": 15,
            "useLookup": False
        },
        "delayAfterStep": 0,
        "stepIdx": 3,
        "previousStepIdx": [2]
    }],
    "resources": [{
        "stepIdx": [0],
        "active": True,
        "availability": {
            "start": 0,
            "end": 109572
        },
        "demobilizationDays": 0,
        "mobilizationDays": 0,
        "workOnHolidays": True,
        "name": "Pad Preparation Crew 1"
    }, {
        "stepIdx": [0],
        "active": True,
        "availability": {
            "start": 0,
            "end": 109572
        },
        "demobilizationDays": 0,
        "mobilizationDays": 0,
        "workOnHolidays": True,
        "name": "Pad Preparation Crew 2"
    }, {
        "stepIdx": [1],
        "active": True,
        "availability": {
            "start": 44914,
            "end": 117964
        },
        "demobilizationDays": 1,
        "mobilizationDays": 1,
        "workOnHolidays": True,
        "name": "Primary Rig 1"
    }, {
        "stepIdx": [2],
        "active": True,
        "availability": {
            "start": 44914,
            "end": 117964
        },
        "demobilizationDays": 1,
        "mobilizationDays": 1,
        "workOnHolidays": True,
        "name": "Completion Crew 1"
    }],
    "startProgram":
    44914
}, {
    "_id":
    ObjectId("63ade34611f1ba0012fe421a"),
    "name":
    "Schedule 1 Config",
    "project":
    ObjectId("63ade2e811f1ba0012fe4152"),
    "createdBy":
    ObjectId("63add98711f1ba0012fe3ff4"),
    "createdAt":
    datetime.fromisoformat("2022-12-29T18:58:14.025"),
    "updatedAt":
    datetime.fromisoformat("2022-12-29T18:58:35.641"),
    "__v":
    0,
    "activitySteps": [{
        "name": "Pad Preparation",
        "requireResources": True,
        "padOperation": "parallel",
        "stepDuration": {
            "days": 5,
            "useLookup": False
        },
        "delayAfterStep": 0,
        "stepIdx": 0,
        "previousStepIdx": []
    }, {
        "name": "Drill",
        "requireResources": True,
        "padOperation": "disabled",
        "stepDuration": {
            "days": 15,
            "useLookup": False
        },
        "delayAfterStep": 0,
        "stepIdx": 1,
        "previousStepIdx": [0]
    }, {
        "name": "Completion",
        "requireResources": True,
        "padOperation": "batch",
        "stepDuration": {
            "days": 15,
            "useLookup": False
        },
        "delayAfterStep": 0,
        "stepIdx": 2,
        "previousStepIdx": [1]
    }, {
        "name": "Facility Construction",
        "requireResources": False,
        "padOperation": "parallel",
        "stepDuration": {
            "days": 15,
            "useLookup": False
        },
        "delayAfterStep": 0,
        "stepIdx": 3,
        "previousStepIdx": [2]
    }],
    "resources": [{
        "stepIdx": [0],
        "active": True,
        "availability": {
            "start": 0,
            "end": 109572
        },
        "demobilizationDays": 0,
        "mobilizationDays": 0,
        "workOnHolidays": True,
        "name": "Pad Preparation Crew 1"
    }, {
        "stepIdx": [0],
        "active": True,
        "availability": {
            "start": 0,
            "end": 109572
        },
        "demobilizationDays": 0,
        "mobilizationDays": 0,
        "workOnHolidays": True,
        "name": "Pad Preparation Crew 2"
    }, {
        "stepIdx": [1],
        "active": True,
        "availability": {
            "start": 44923,
            "end": 117973
        },
        "demobilizationDays": 2,
        "mobilizationDays": 1,
        "workOnHolidays": True,
        "name": "Primary Rig 1 - 1"
    }, {
        "stepIdx": [1],
        "active": True,
        "availability": {
            "start": 117974,
            "end": 191024
        },
        "demobilizationDays": 2,
        "mobilizationDays": 1,
        "workOnHolidays": True,
        "name": "Primary Rig 1 - 2"
    }, {
        "stepIdx": [2],
        "active": True,
        "availability": {
            "start": 44923,
            "end": 117973
        },
        "demobilizationDays": 0,
        "mobilizationDays": 0,
        "workOnHolidays": True,
        "name": "Completion Crew 1"
    }],
    "startProgram":
    44923
}]

SCHEDULES_FIXTURE = [{
    "_id":
    ObjectId("63a34377ef6ee600127510d7"),
    "inputData": [
        {
            "well": ObjectId("63b4454fa93ecf00138dad03"),
            "priority": 1,
            "status": "not_started"
        },
        {
            "well": ObjectId("63d4482fea5f6e0013cfa1df"),
            "priority": 2,
            "status": "not_started"
        },
        {
            "well": ObjectId("63d4482fea5f6e0013cfa1df"),
            "priority": 3,
            "status": "producing"
        },
    ],
    "modified":
    False,
    "constructed":
    True,
    "tags": [],
    "method":
    "auto",
    "name":
    "generic test",
    "project":
    ObjectId("6356db57192dfc0012ea8847"),
    "createdBy":
    ObjectId("6356aa16192dfc0012ea8401"),
    "createdAt":
    datetime.fromisoformat("2022-12-21T17:33:43.203"),
    "updatedAt":
    datetime.fromisoformat("2022-12-21T17:33:47.944"),
    "__v":
    0,
    "qualifiers": {},
    "setting":
    ObjectId("63a3437aef6ee60012751127")
}, {
    "_id":
    ObjectId("63a3438def6ee60012751170"),
    "inputData": [
        {
            "well": ObjectId("63b4454fa93ecf00138dad03"),
            "priority": 1,
            "status": "not_started"
        },
        {
            "well": ObjectId("63d4482fea5f6e0013cfa1df"),
            "priority": 2,
            "status": "not_started"
        },
        {
            "well": ObjectId("63d4482fea5f6e0013cfa1df"),
            "priority": 3,
            "status": "producing"
        },
    ],
    "modified":
    False,
    "constructed":
    True,
    "tags": [],
    "method":
    "auto",
    "name":
    "generic test - 1",
    "project":
    ObjectId("6356db57192dfc0012ea8847"),
    "createdBy":
    ObjectId("6356aa16192dfc0012ea8401"),
    "createdAt":
    datetime.fromisoformat("2022-12-21T17:34:09.525"),
    "updatedAt":
    datetime.fromisoformat("2022-12-21T17:34:09.525"),
    "__v":
    0,
    "setting":
    ObjectId("63a3437aef6ee60012751127")
}, {
    "_id":
    ObjectId("63d05d7d8c8c590012b5b65a"),
    "inputData": [
        {
            "well": ObjectId("63b4454fa93ecf00138dad03"),
            "priority": 1,
            "status": "not_started"
        },
        {
            "well": ObjectId("63d4482fea5f6e0013cfa1df"),
            "priority": 2,
            "status": "not_started"
        },
        {
            "well": ObjectId("63d4482fea5f6e0013cfa1df"),
            "priority": 3,
            "status": "producing"
        },
    ],
    "modified":
    True,
    "constructed":
    True,
    "tags": [],
    "method":
    "auto",
    "name":
    "test2 ",
    "project":
    ObjectId("63b4453ca93ecf00138dac9b"),
    "createdBy":
    ObjectId("63b4445ea93ecf00138daaff"),
    "createdAt":
    datetime.fromisoformat("2023-01-24T22:36:45.060"),
    "updatedAt":
    datetime.fromisoformat("2023-03-01T15:37:06.985"),
    "__v":
    0,
    "qualifiers": {},
    "setting":
    ObjectId("63d405a7d2ef9b0013ba9cfa")
}]

WELL_OUTPUTS_FIXTURE = [{
    "_id": ObjectId("63a3437d6f86ee8162228c69"),
    "output": {
        "events": [{
            "activityStepIdx": 0,
            "activityStepName": "Pad Preparation",
            "resourceIdx": 0,
            "resourceName": "Pad Preparation Crew 1",
            "mob": {
                "start": None,
                "end": None
            },
            "work": {
                "start": 5,
                "end": 9
            },
            "demob": {
                "start": None,
                "end": None
            }
        }, {
            "activityStepIdx": 1,
            "activityStepName": "Drill",
            "resourceIdx": 2,
            "resourceName": "Primary Rig 1",
            "mob": {
                "start": 114,
                "end": 114
            },
            "work": {
                "start": 115,
                "end": 129
            },
            "demob": {
                "start": None,
                "end": None
            }
        }, {
            "activityStepIdx": 2,
            "activityStepName": "Completion",
            "resourceIdx": 3,
            "resourceName": "Completion Crew 1",
            "mob": {
                "start": 176,
                "end": 176
            },
            "work": {
                "start": 177,
                "end": 191
            },
            "demob": {
                "start": None,
                "end": None
            }
        }],
        "FPD":
        237
    },
    "project": ObjectId("6356db57192dfc0012ea8847"),
    "schedule": ObjectId("63a34377ef6ee600127510d7"),
    "construction": ObjectId("63a3437d65edbaecbaeafe68"),
    "well": ObjectId("63750838f52f9500123c9b7e")
}, {
    "_id": ObjectId("63a3437d6f86ee8162228c68"),
    "output": {
        "events": [{
            "activityStepIdx": 0,
            "activityStepName": "Pad Preparation",
            "resourceIdx": 0,
            "resourceName": "Pad Preparation Crew 1",
            "mob": {
                "start": None,
                "end": None
            },
            "work": {
                "start": 0,
                "end": 4
            },
            "demob": {
                "start": None,
                "end": None
            }
        }, {
            "activityStepIdx": 1,
            "activityStepName": "Drill",
            "resourceIdx": 2,
            "resourceName": "Primary Rig 1",
            "mob": {
                "start": 67,
                "end": 67
            },
            "work": {
                "start": 68,
                "end": 82
            },
            "demob": {
                "start": None,
                "end": None
            }
        }, {
            "activityStepIdx": 2,
            "activityStepName": "Completion",
            "resourceIdx": 3,
            "resourceName": "Completion Crew 1",
            "mob": {
                "start": 129,
                "end": 129
            },
            "work": {
                "start": 130,
                "end": 144
            },
            "demob": {
                "start": None,
                "end": None
            }
        }],
        "FPD":
        190
    },
    "project": ObjectId("6356db57192dfc0012ea8847"),
    "schedule": ObjectId("63a34377ef6ee600127510d7"),
    "construction": ObjectId("63a3437d65edbaecbaeafe68"),
    "well": ObjectId("63750838f52f9500123c9b7d")
}, {
    "_id": ObjectId("63ff6fe375403ea4c8de741a"),
    "construction": ObjectId("63ff6fa075403ea4c8de5e48"),
    "project": ObjectId("63b4453ca93ecf00138dac9b"),
    "schedule": ObjectId("63d05d7d8c8c590012b5b65a"),
    "well": ObjectId("63b4454fa93ecf00138dacf9"),
    "output": {
        "events": [{
            "activityStepIdx": 1,
            "activityStepName": "Step Name 1",
            "demob": {
                "end": 63,
                "start": 62
            },
            "mob": {
                "end": 57,
                "start": 56
            },
            "resourceIdx": 0,
            "resourceName": "Resource 1A",
            "work": {
                "end": 62,
                "start": 57
            }
        }, {
            "activityStepIdx": 2,
            "activityStepName": "Step Name 2",
            "demob": {
                "end": 70,
                "start": 69
            },
            "mob": {
                "end": 64,
                "start": 63
            },
            "resourceIdx": 5,
            "resourceName": "Resource 6",
            "work": {
                "end": 69,
                "start": 64
            }
        }, {
            "activityStepIdx": 3,
            "activityStepName": "Step Name 3",
            "demob": {
                "end": 147,
                "start": 146
            },
            "mob": {
                "end": 141,
                "start": 140
            },
            "resourceIdx": 2,
            "resourceName": "Resource 3",
            "work": {
                "end": 146,
                "start": 141
            }
        }, {
            "activityStepIdx": 4,
            "activityStepName": "Step Name 4",
            "demob": {
                "end": 154,
                "start": 153
            },
            "mob": {
                "end": 148,
                "start": 147
            },
            "resourceIdx": 7,
            "resourceName": "Resource 8",
            "work": {
                "end": 153,
                "start": 148
            }
        }],
        "FPD":
        154
    }
}, {
    "_id": ObjectId("63ff6fe375403ea4c8de7410"),
    "construction": ObjectId("63ff6fa075403ea4c8de5e48"),
    "project": ObjectId("63b4453ca93ecf00138dac9b"),
    "schedule": ObjectId("63d05d7d8c8c590012b5b65a"),
    "well": ObjectId("63b4454fa93ecf00138dacf0"),
    "output": {
        "events": [{
            "activityStepIdx": 1,
            "activityStepName": "Step Name 1",
            "demob": {
                "end": 42,
                "start": 41
            },
            "mob": {
                "end": 36,
                "start": 35
            },
            "resourceIdx": 0,
            "resourceName": "Resource 1A",
            "work": {
                "end": 41,
                "start": 36
            }
        }, {
            "activityStepIdx": 2,
            "activityStepName": "Step Name 2",
            "demob": {
                "end": 49,
                "start": 48
            },
            "mob": {
                "end": 43,
                "start": 42
            },
            "resourceIdx": 5,
            "resourceName": "Resource 6",
            "work": {
                "end": 48,
                "start": 43
            }
        }, {
            "activityStepIdx": 3,
            "activityStepName": "Step Name 3",
            "demob": {
                "end": 56,
                "start": 55
            },
            "mob": {
                "end": 50,
                "start": 49
            },
            "resourceIdx": 6,
            "resourceName": "Resource 7",
            "work": {
                "end": 55,
                "start": 50
            }
        }, {
            "activityStepIdx": 4,
            "activityStepName": "Step Name 4",
            "demob": {
                "end": 63,
                "start": 62
            },
            "mob": {
                "end": 57,
                "start": 56
            },
            "resourceIdx": 7,
            "resourceName": "Resource 8",
            "work": {
                "end": 62,
                "start": 57
            }
        }],
        "FPD":
        63
    }
}]

WELLS_FIXTURE = [{
    "_id": ObjectId("63b4454fa93ecf00138dad03"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63b4453ca93ecf00138dac9b"),
    "lateral_length": None,
    "perf_lateral_length": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": None,
    "surfaceLongitude": None,
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
    "well_name": "Well-24",
    "pad_name": "Well-pad-24",
    "refrac_prop_weight": None,
    "refrac_fluid_volume": None,
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "has_daily": False,
    "has_monthly": False,
    "inptID": "INPTEBvpZGJnnz",
    "chosenID": "INPTEBvpZGJnnz",
    "chosenKeyID": "inptID",
    "generic": True,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-01-03T15:10:07.825"),
    "updatedAt": datetime.fromisoformat("2023-02-13T19:24:59.944"),
    "custom_number_0": 24,
}, {
    "_id": ObjectId("63d4482fea5f6e0013cfa1df"),
    "schemaVersion": 1,
    "dataPool": "internal",
    "dataSource": "internal",
    "project": ObjectId("63b4453ca93ecf00138dac9b"),
    "lateral_length": None,
    "perf_lateral_length": None,
    "primary_product": None,
    "true_vertical_depth": None,
    "copied": False,
    "first_fluid_volume": None,
    "first_prop_weight": None,
    "measured_depth": None,
    "surfaceLatitude": None,
    "surfaceLongitude": None,
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
    "well_name": "Wells  two pads-9",
    "pad_name": "Wells  two pads-pad-5",
    "refrac_prop_weight": None,
    "refrac_fluid_volume": None,
    "total_additive_volume": None,
    "total_cluster_count": None,
    "total_stage_count": None,
    "has_daily": False,
    "has_monthly": False,
    "inptID": "INPTdX1LTZfOzC",
    "chosenID": "INPTdX1LTZfOzC",
    "chosenKeyID": "inptID",
    "generic": True,
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-01-27T21:54:55.300"),
    "updatedAt": datetime.fromisoformat("2023-02-13T19:24:59.944"),
    "custom_number_0": 109
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
}]

INPUT_TABLE_FIXTURE = {
    'wells':
    [ObjectId("63a0e8dce640e5a88bb7d9d6"),
     ObjectId("63a0e8dce640e5a88bb7d9d7"),
     ObjectId("63a0e8dce640e5a88bb7d9d8")],
    'ownership_reversion':
    [ObjectId("643d7451ce99c485813e3f38"),
     ObjectId("643d7451ce99c485813e3f38"),
     ObjectId("643d7451ce99c485813e3f38")],
    'ownership_reversion_type': ['model', 'model', 'model'],
    'forecast':
    [ObjectId("64373c00078ba5001254989c"),
     ObjectId("644695f6e3d2200021a1872a"),
     ObjectId("64373c00078ba5001254989c")],
    'forecast_type': ['forecast', 'forecast', 'forecast'],
    'p_series': ['P50', 'P50', 'P50'],
    'dates':
    [ObjectId("6441c752fc13ce001268efee"),
     ObjectId("6441c812fc13ce001268f20e"),
     ObjectId("6441c752fc13ce001268efee")],
    'dates_type': ['model', 'lookup', 'model'],
    'capex': [ObjectId("6441c79ffc13ce001268f099"),
              ObjectId("6441c79ffc13ce001268f099"), None],
    'capex_type': ['model', 'model', None],
    'pricing':
    [ObjectId("6441c7e2fc13ce001268f131"),
     ObjectId("6441c7e2fc13ce001268f131"),
     ObjectId("6441c7cdfc13ce001268f110")],
    'pricing_type': ['model', 'model', 'model']
}

ASSUMPTIONS = [{
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
    "lastUpdatedBy": ObjectId("611beca03556540015af8562"),
    "createdAt": datetime.fromisoformat("2023-04-17T16:31:13.129"),
    "updatedAt": datetime.fromisoformat("2023-04-17T16:31:13.129"),
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
                "value": datetime.fromisoformat("2023-05-01T00:00:00.000"),
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
                "value": datetime.fromisoformat("2023-05-01T00:00:00.000"),
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
    "lastUpdatedBy": ObjectId("611beca03556540015af8562"),
    "createdAt": datetime.fromisoformat("2023-04-20T23:14:26.232"),
    "updatedAt": datetime.fromisoformat("2023-04-20T23:14:26.232"),
    "__v": 0
}, {
    "_id": ObjectId("6441c79ffc13ce001268f099"),
    "copiedFrom": None,
    "unique": False,
    "tags": [],
    "embeddedLookupTables": [ObjectId("6441c787fc13ce001268f080")],
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "assumptionKey": "capex",
    "assumptionName": "CAPEX",
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
                "rows": []
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
        }
    },
    "econ_function": {
        "other_capex": {
            "rows": []
        }
    },
    "name": "bas",
    "createdBy": ObjectId("611beca03556540015af8562"),
    "lastUpdatedBy": ObjectId("611beca03556540015af8562"),
    "createdAt": datetime.fromisoformat("2023-04-20T23:15:43.969"),
    "updatedAt": datetime.fromisoformat("2023-04-20T23:15:43.969"),
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
}]

DETERMINISTIC_FORECAST_DATAS_FIXTURE = [{
    "_id": ObjectId("64373c00078ba500125498a0"),
    "lastAutomaticRun": {
        "date": None,
        "source": None,
        "success": False
    },
    "warning": {
        "status": False,
        "message": ""
    },
    "ratio": {
        "segments": [],
        "basePhase": None,
        "diagnostics": {},
        "x": None
    },
    "data_freq": "monthly",
    "diagDate": None,
    "forecasted": False,
    "forecastType": "not_forecasted",
    "forecastSubType": None,
    "phase": "water",
    "runDate": None,
    "typeCurve": None,
    "status": "in_progress",
    "reviewedAt": None,
    "reviewedBy": None,
    "forecastedAt": None,
    "forecastedBy": None,
    "forecast": ObjectId("64373c00078ba5001254989c"),
    "P_dict": {},
    "p_extra": {},
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "well": ObjectId("63a0e8dce640e5a88bb7d9d6"),
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-12T23:17:20.953"),
    "updatedAt": datetime.fromisoformat("2023-04-24T14:44:39.427"),
    "diagnostics": {}
}, {
    "_id": ObjectId("64373c00078ba5001254989e"),
    "lastAutomaticRun": {
        "date": None,
        "source": None,
        "success": False
    },
    "warning": {
        "status": False,
        "message": ""
    },
    "ratio": {
        "segments": [],
        "basePhase": None,
        "diagnostics": {},
        "x": None
    },
    "data_freq": "monthly",
    "diagDate": None,
    "forecasted": False,
    "forecastType": "not_forecasted",
    "forecastSubType": None,
    "phase": "oil",
    "runDate": None,
    "typeCurve": None,
    "status": "in_progress",
    "reviewedAt": None,
    "reviewedBy": None,
    "forecastedAt": None,
    "forecastedBy": None,
    "forecast": ObjectId("64373c00078ba5001254989c"),
    "P_dict": {},
    "p_extra": {},
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "well": ObjectId("63a0e8dce640e5a88bb7d9d6"),
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-12T23:17:20.949"),
    "updatedAt": datetime.fromisoformat("2023-04-24T14:44:39.427"),
    "diagnostics": {}
}, {
    "_id": ObjectId("64373c00078ba5001254989f"),
    "lastAutomaticRun": {
        "date": None,
        "source": None,
        "success": False
    },
    "warning": {
        "status": False,
        "message": ""
    },
    "ratio": {
        "segments": [],
        "basePhase": None,
        "diagnostics": {},
        "x": None
    },
    "data_freq": "monthly",
    "diagDate": None,
    "forecasted": False,
    "forecastType": "not_forecasted",
    "forecastSubType": None,
    "phase": "gas",
    "runDate": None,
    "typeCurve": None,
    "status": "in_progress",
    "reviewedAt": None,
    "reviewedBy": None,
    "forecastedAt": None,
    "forecastedBy": None,
    "forecast": ObjectId("64373c00078ba5001254989c"),
    "P_dict": {},
    "p_extra": {},
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "well": ObjectId("63a0e8dce640e5a88bb7d9d6"),
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-12T23:17:20.953"),
    "updatedAt": datetime.fromisoformat("2023-04-24T14:44:39.427"),
    "diagnostics": {}
}, {
    "_id": ObjectId("64373c00078ba500125498a6"),
    "lastAutomaticRun": {
        "date": None,
        "source": None,
        "success": False
    },
    "warning": {
        "status": False,
        "message": ""
    },
    "ratio": {
        "segments": [],
        "basePhase": None,
        "x": None,
        "eur": None,
        "rur": None,
        "diagnostics": {}
    },
    "data_freq": "monthly",
    "diagDate": None,
    "forecasted": True,
    "forecastType": "rate",
    "forecastSubType": "automatic",
    "phase": "water",
    "runDate": None,
    "typeCurve": None,
    "status": "in_progress",
    "reviewedAt": None,
    "reviewedBy": None,
    "forecastedAt": datetime.fromisoformat("2023-04-17T18:58:54.673"),
    "forecastedBy": ObjectId("611beca03556540015af8562"),
    "forecast": ObjectId("64373c00078ba5001254989c"),
    "P_dict": {
        "best": {
            "diagnostics": {},
            "eur":
            23654.7585757481,
            "rur":
            4083.75857574806,
            "segments": [{
                "name": "exp_inc",
                "slope": 1.0,
                "D_eff": -38842.2693096192,
                "D": -0.0289316634979958,
                "q_start": 2.92402464065708,
                "q_end": 6.76646781722748,
                "start_idx": 44148.0,
                "end_idx": 44177.0
            }, {
                "name": "arps",
                "slope": -1.0,
                "b": 2.0,
                "D_eff": 0.750657091083206,
                "D": 0.0206494735426658,
                "q_start": 6.96509240246407,
                "q_end": 0.75436245529805,
                "start_idx": 44178.0,
                "end_idx": 46218.0
            }, {
                "name": "arps_modified",
                "q_start": 0.739251732076699,
                "q_end": 0.100011443812301,
                "slope": -1.0,
                "D_eff": 0.0812611691683313,
                "D": 0.000242159095816774,
                "b": 1.00000089896618,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.08,
                "sw_idx": 46469.9455655644,
                "q_sw": 0.696901876431788,
                "D_exp_eff": 0.08,
                "D_exp": 0.000228286403666122,
                "start_idx": 46219.0,
                "end_idx": 54974.0
            }]
        }
    },
    "p_extra": {},
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "well": ObjectId("63a0e8dce640e5a88bb7d9d8"),
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-12T23:17:20.954"),
    "updatedAt": datetime.fromisoformat("2023-04-17T18:58:54.673")
}, {
    "_id": ObjectId("64373c00078ba500125498a4"),
    "lastAutomaticRun": {
        "date": None,
        "source": None,
        "success": False
    },
    "warning": {
        "status": False,
        "message": ""
    },
    "ratio": {
        "segments": [],
        "basePhase": None,
        "x": None,
        "eur": None,
        "rur": None,
        "diagnostics": {}
    },
    "data_freq": "monthly",
    "diagDate": None,
    "forecasted": True,
    "forecastType": "rate",
    "forecastSubType": "automatic",
    "phase": "oil",
    "runDate": None,
    "typeCurve": None,
    "status": "in_progress",
    "reviewedAt": None,
    "reviewedBy": None,
    "forecastedAt": datetime.fromisoformat("2023-04-17T18:58:54.124"),
    "forecastedBy": ObjectId("611beca03556540015af8562"),
    "forecast": ObjectId("64373c00078ba5001254989c"),
    "P_dict": {
        "best": {
            "diagnostics": {},
            "eur":
            95306.3948540238,
            "rur":
            27802.3948540238,
            "segments": [{
                "name": "exp_inc",
                "slope": 1.0,
                "D_eff": -0.988515647637276,
                "D": -0.00188196702176705,
                "q_start": 7.54925616096676,
                "q_end": 9.44422187095249,
                "start_idx": 44148.0,
                "end_idx": 44267.0
            }, {
                "name": "arps",
                "slope": -1.0,
                "b": 2.0,
                "D_eff": 0.276640605968604,
                "D": 0.00124727814044963,
                "q_start": 9.46201232032854,
                "q_end": 3.50654376729859,
                "start_idx": 44268.0,
                "end_idx": 46786.0
            }, {
                "name": "arps_modified",
                "q_start": 3.50217829764569,
                "q_end": 0.198887661150014,
                "slope": -1.0,
                "D_eff": 0.0588695765074376,
                "D": 0.000171258002038945,
                "b": 0.999999920303991,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.0606357715351483,
                "sw_idx": 46787.0,
                "q_sw": 3.50217829764569,
                "D_exp_eff": 0.0606357715351483,
                "D_exp": 0.000171258002038945,
                "start_idx": 46787.0,
                "end_idx": 63536.0
            }]
        }
    },
    "p_extra": {},
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "well": ObjectId("63a0e8dce640e5a88bb7d9d8"),
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-12T23:17:20.954"),
    "updatedAt": datetime.fromisoformat("2023-04-17T18:58:54.124")
}, {
    "_id": ObjectId("64373c00078ba500125498a5"),
    "lastAutomaticRun": {
        "date": None,
        "source": None,
        "success": False
    },
    "warning": {
        "status": False,
        "message": ""
    },
    "ratio": {
        "segments": [],
        "basePhase": None,
        "x": None,
        "eur": None,
        "rur": None,
        "diagnostics": {}
    },
    "data_freq": "monthly",
    "diagDate": None,
    "forecasted": True,
    "forecastType": "rate",
    "forecastSubType": "automatic",
    "phase": "gas",
    "runDate": None,
    "typeCurve": None,
    "status": "in_progress",
    "reviewedAt": None,
    "reviewedBy": None,
    "forecastedAt": datetime.fromisoformat("2023-04-17T18:58:54.326"),
    "forecastedBy": ObjectId("611beca03556540015af8562"),
    "forecast": ObjectId("64373c00078ba5001254989c"),
    "P_dict": {
        "best": {
            "diagnostics": {},
            "eur":
            1770002.63642548,
            "rur":
            697715.636425481,
            "segments": [{
                "name": "exp_inc",
                "slope": 1.0,
                "D_eff": -0.288927939935455,
                "D": -0.000694896149330327,
                "q_start": 189.031487035535,
                "q_end": 205.327495001239,
                "start_idx": 44148.0,
                "end_idx": 44267.0
            }, {
                "name": "arps",
                "slope": -1.0,
                "b": 2.0,
                "D_eff": 0.137651239311771,
                "D": 0.000471905493126853,
                "q_start": 205.47022587269,
                "q_end": 143.689029536192,
                "start_idx": 44268.0,
                "end_idx": 45375.0
            }, {
                "name": "arps_modified",
                "q_start": 143.62126985433,
                "q_end": 2.2737807345946,
                "slope": -1.0,
                "D_eff": 0.0777119015977203,
                "D": 0.000230691028548651,
                "b": 0.999999894491732,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.08,
                "sw_idx": 45421.6600760794,
                "q_sw": 142.124222840529,
                "D_exp_eff": 0.08,
                "D_exp": 0.000228286403666122,
                "start_idx": 45376.0,
                "end_idx": 63536.0
            }]
        }
    },
    "p_extra": {},
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "well": ObjectId("63a0e8dce640e5a88bb7d9d8"),
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-12T23:17:20.954"),
    "updatedAt": datetime.fromisoformat("2023-04-17T18:58:54.326")
}]

PROBABILISTIC_FORECAST_DATAS_FIXTURE = [{
    "_id": ObjectId("644695f6e3d2200021a18731"),
    "lastAutomaticRun": {
        "date": None,
        "source": None,
        "success": False
    },
    "warning": {
        "status": False,
        "message": ""
    },
    "ratio": {
        "enabled": False,
        "phase": "oil",
        "value": 1
    },
    "data_freq": "monthly",
    "diagDate": None,
    "forecasted": True,
    "phase": "water",
    "runDate": None,
    "forecastType": "prob",
    "typeCurve": None,
    "status": "in_progress",
    "reviewedAt": None,
    "reviewedBy": None,
    "forecastedAt": datetime.fromisoformat("2023-04-24T14:45:39.588"),
    "forecastedBy": ObjectId("611beca03556540015af8562"),
    "forecast": ObjectId("644695f6e3d2200021a1872a"),
    "P_dict": {
        "P10": {
            "diagnostics": {},
            "eur":
            64937.6769406624,
            "rur":
            13176.6769406624,
            "segments": [{
                "name": "arps_modified",
                "q_start": 8.90349075975359,
                "q_end": 0.100015352234134,
                "slope": -1.0,
                "D_eff": 0.262655491203661,
                "D": 0.000973430039965999,
                "b": 0.988186090599164,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.08,
                "sw_idx": 46626.2547786403,
                "q_sw": 2.05213519078164,
                "D_exp_eff": 0.08,
                "D_exp": 0.000228286403666122,
                "start_idx": 43233.0,
                "end_idx": 59861.0
            }]
        },
        "P50": {
            "diagnostics": {},
            "eur":
            57891.0626997903,
            "rur":
            6130.06269979027,
            "segments": [{
                "name": "arps_modified",
                "q_start": 8.90349075975359,
                "q_end": 0.100018797698904,
                "slope": -1.0,
                "D_eff": 0.459931293458269,
                "D": 0.00231582057304034,
                "b": 0.97997954106901,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.08,
                "sw_idx": 47262.3187948697,
                "q_sw": 0.837102837800562,
                "D_exp_eff": 0.08,
                "D_exp": 0.000228286403666122,
                "start_idx": 43233.0,
                "end_idx": 56569.0
            }]
        },
        "P90": {
            "diagnostics": {},
            "eur":
            54215.6372229949,
            "rur":
            2454.63722299487,
            "segments": [{
                "name": "arps_modified",
                "q_start": 8.90349075975359,
                "q_end": 0.100015436642636,
                "slope": -1.0,
                "D_eff": 0.599172122534559,
                "D": 0.00366694315987516,
                "b": 0.788254276201336,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.08,
                "sw_idx": 48444.2063095167,
                "q_sw": 0.262917968312102,
                "D_exp_eff": 0.08,
                "D_exp": 0.000228286403666122,
                "start_idx": 43233.0,
                "end_idx": 52678.0
            }]
        },
        "best": {
            "diagnostics": {},
            "eur":
            57729.4128189884,
            "rur":
            5968.41281898838,
            "segments": [{
                "name": "arps_modified",
                "q_start": 8.90349075975359,
                "q_end": 0.100008019554716,
                "slope": -1.0,
                "D_eff": 0.476554653225259,
                "D": 0.00250523183751518,
                "b": 1.01410637622327,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.08,
                "sw_idx": 47158.9172464563,
                "q_sw": 0.838810994520981,
                "D_exp_eff": 0.08,
                "D_exp": 0.000228286403666122,
                "start_idx": 43233.0,
                "end_idx": 56475.0
            }]
        }
    },
    "p_extra": {
        "eur_ratio": {
            "P10": 1.8998783920099,
            "P50": 1.0,
            "P90": 0.530634733554971
        }
    },
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "well": ObjectId("63a0e8dce640e5a88bb7d9d7"),
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-24T14:45:10.794"),
    "updatedAt": datetime.fromisoformat("2023-04-24T14:45:39.588")
}, {
    "_id": ObjectId("644695f6e3d2200021a18730"),
    "lastAutomaticRun": {
        "date": None,
        "source": None,
        "success": False
    },
    "warning": {
        "status": False,
        "message": ""
    },
    "ratio": {
        "enabled": False,
        "phase": "oil",
        "value": 1
    },
    "data_freq": "monthly",
    "diagDate": None,
    "forecasted": True,
    "phase": "gas",
    "runDate": None,
    "forecastType": "prob",
    "typeCurve": None,
    "status": "in_progress",
    "reviewedAt": None,
    "reviewedBy": None,
    "forecastedAt": datetime.fromisoformat("2023-04-24T14:45:39.027"),
    "forecastedBy": ObjectId("611beca03556540015af8562"),
    "forecast": ObjectId("644695f6e3d2200021a1872a"),
    "P_dict": {
        "P10": {
            "diagnostics": {},
            "eur":
            2230838.74141768,
            "rur":
            958979.741417679,
            "segments": [{
                "name": "arps_modified",
                "q_start": 381.700205338809,
                "q_end": 3.00159056251798,
                "slope": -1.0,
                "D_eff": 0.208142516745529,
                "D": 0.000724110251592336,
                "b": 1.05087966213853,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.08,
                "sw_idx": 47153.2347005986,
                "q_sw": 127.253579728229,
                "D_exp_eff": 0.08,
                "D_exp": 0.000228286403666122,
                "start_idx": 44299.0,
                "end_idx": 63567.0
            }]
        },
        "P50": {
            "diagnostics": {},
            "eur":
            1949326.50577894,
            "rur":
            677467.50577894,
            "segments": [{
                "name": "arps_modified",
                "q_start": 381.700205338809,
                "q_end": 2.03619583784841,
                "slope": -1.0,
                "D_eff": 0.309851348112341,
                "D": 0.00124158614067738,
                "b": 1.05087966213853,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.0799999999999998,
                "sw_idx": 47700.9508926554,
                "q_sw": 76.179056262577,
                "D_exp_eff": 0.0799999999999998,
                "D_exp": 0.000228286403666122,
                "start_idx": 44299.0,
                "end_idx": 63567.0
            }]
        },
        "P90": {
            "diagnostics": {},
            "eur":
            1747396.58147603,
            "rur":
            475537.581476029,
            "segments": [{
                "name": "arps_modified",
                "q_start": 381.700205338809,
                "q_end": 1.31243598200523,
                "slope": -1.0,
                "D_eff": 0.379417853733093,
                "D": 0.0016157383741107,
                "b": 0.861950628282186,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.08,
                "sw_idx": 48662.9973817077,
                "q_sw": 39.4197159765664,
                "D_exp_eff": 0.08,
                "D_exp": 0.000228286403666122,
                "start_idx": 44299.0,
                "end_idx": 63567.0
            }]
        },
        "best": {
            "diagnostics": {},
            "eur":
            1914373.68532692,
            "rur":
            642514.68532692,
            "segments": [{
                "name": "arps_modified",
                "q_start": 381.700205338809,
                "q_end": 1.91663293365584,
                "slope": -1.0,
                "D_eff": 0.324159071806162,
                "D": 0.00132385050997227,
                "b": 1.0387483517775,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.08,
                "sw_idx": 47788.8636070643,
                "q_sw": 70.2811748477229,
                "D_exp_eff": 0.08,
                "D_exp": 0.000228286403666122,
                "start_idx": 44299.0,
                "end_idx": 63567.0
            }]
        }
    },
    "p_extra": {
        "eur_ratio": {
            "P10": 1.39139505097846,
            "P50": 1.0,
            "P90": 0.719250664628999
        }
    },
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "well": ObjectId("63a0e8dce640e5a88bb7d9d7"),
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-24T14:45:10.794"),
    "updatedAt": datetime.fromisoformat("2023-04-24T14:45:39.027")
}, {
    "_id": ObjectId("644695f6e3d2200021a1872f"),
    "lastAutomaticRun": {
        "date": None,
        "source": None,
        "success": False
    },
    "warning": {
        "status": False,
        "message": ""
    },
    "ratio": {
        "enabled": False,
        "phase": "oil",
        "value": 1
    },
    "data_freq": "monthly",
    "diagDate": None,
    "forecasted": True,
    "phase": "oil",
    "runDate": None,
    "forecastType": "prob",
    "typeCurve": None,
    "status": "in_progress",
    "reviewedAt": None,
    "reviewedBy": None,
    "forecastedAt": datetime.fromisoformat("2023-04-24T14:45:38.444"),
    "forecastedBy": ObjectId("611beca03556540015af8562"),
    "forecast": ObjectId("644695f6e3d2200021a1872a"),
    "P_dict": {
        "P10": {
            "diagnostics": {},
            "eur":
            227403.592139656,
            "rur":
            98543.5921396559,
            "segments": [{
                "name": "arps_modified",
                "q_start": 31.5400410677618,
                "q_end": 0.316210594894272,
                "slope": -1.0,
                "D_eff": 0.146010243509098,
                "D": 0.000470272850107371,
                "b": 1.05708617008746,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.0800000000000001,
                "sw_idx": 46400.3117393421,
                "q_sw": 15.9199760824179,
                "D_exp_eff": 0.0800000000000001,
                "D_exp": 0.000228286403666122,
                "start_idx": 44268.0,
                "end_idx": 63567.0
            }]
        },
        "P50": {
            "diagnostics": {},
            "eur":
            184527.895548152,
            "rur":
            55667.8955481517,
            "segments": [{
                "name": "arps_modified",
                "q_start": 31.5400410677618,
                "q_end": 0.168043045390143,
                "slope": -1.0,
                "D_eff": 0.309335909067449,
                "D": 0.0012400849171487,
                "b": 1.05708617008746,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.08,
                "sw_idx": 47649.0545231184,
                "q_sw": 6.36182583312829,
                "D_exp_eff": 0.08,
                "D_exp": 0.000228286403666122,
                "start_idx": 44268.0,
                "end_idx": 63567.0
            }]
        },
        "P90": {
            "diagnostics": {},
            "eur":
            161178.939566498,
            "rur":
            32318.9395664979,
            "segments": [{
                "name": "arps_modified",
                "q_start": 31.5400410677618,
                "q_end": 0.100002413211267,
                "slope": -1.0,
                "D_eff": 0.41771102192655,
                "D": 0.00185994419769235,
                "b": 0.813787879092125,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.08,
                "sw_idx": 48990.1295945241,
                "q_sw": 2.39541905987859,
                "D_exp_eff": 0.08,
                "D_exp": 0.000228286403666122,
                "start_idx": 44268.0,
                "end_idx": 62903.0
            }]
        },
        "best": {
            "diagnostics": {},
            "eur":
            177731.71985056,
            "rur":
            48871.7198505596,
            "segments": [{
                "name": "arps_modified",
                "q_start": 31.5400410677618,
                "q_end": 0.14481118623989,
                "slope": -1.0,
                "D_eff": 0.343577166967399,
                "D": 0.00144055364990718,
                "b": 1.0232849587692,
                "target_D_eff_sw": 0.08,
                "realized_D_eff_sw": 0.08,
                "sw_idx": 47870.4030129994,
                "q_sw": 5.21216401233599,
                "D_exp_eff": 0.08,
                "D_exp": 0.000228286403666122,
                "start_idx": 44268.0,
                "end_idx": 63567.0
            }]
        }
    },
    "p_extra": {
        "eur_ratio": {
            "P10": 1.71577012170474,
            "P50": 1.0,
            "P90": 0.610210762357859
        }
    },
    "project": ObjectId("63a0e8dbe640e5a88bb7d909"),
    "well": ObjectId("63a0e8dce640e5a88bb7d9d7"),
    "__v": 0,
    "createdAt": datetime.fromisoformat("2023-04-24T14:45:10.794"),
    "updatedAt": datetime.fromisoformat("2023-04-24T14:45:38.444")
}]

LOOKUP_TABLES_FIXTURE = [{
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


def schedule_input_table_result():
    result_table = pd.DataFrame(INPUT_TABLE_FIXTURE)
    result_table.set_index('wells', inplace=True)
    truncated_deterministic_datas_1 = {'oil': None, 'gas': None, 'water': None}
    truncated_deterministic_datas_2 = {
        data['phase']: {
            'ratio': data['ratio'],
            'data_freq': data['data_freq'],
            'forecasted': data['forecasted'],
            'phase': data['phase'],
            'forecastType': data['forecastType'],
            'forecastSubType': data['forecastSubType'],
            'typeCurve': data['typeCurve'],
            'forecast': data['forecast'],
            'P_dict': data['P_dict'],
            'well': data['well']
        }
        for data in DETERMINISTIC_FORECAST_DATAS_FIXTURE[3:]
    }
    truncated_probabilistic_datas = {
        data['phase']: {
            'ratio': data['ratio'],
            'data_freq': data['data_freq'],
            'forecasted': data['forecasted'],
            'phase': data['phase'],
            'forecastType': data['forecastType'],
            'typeCurve': data['typeCurve'],
            'forecast': data['forecast'],
            'P_dict': data['P_dict'],
            'well': data['well']
        }
        for data in PROBABILISTIC_FORECAST_DATAS_FIXTURE
    }
    result_table.at[ObjectId("63a0e8dce640e5a88bb7d9d6"), 'forecast'] = truncated_deterministic_datas_1
    result_table.at[ObjectId("63a0e8dce640e5a88bb7d9d8"), 'forecast'] = truncated_deterministic_datas_2
    result_table.at[ObjectId("63a0e8dce640e5a88bb7d9d7"), 'forecast'] = truncated_probabilistic_datas
    truncated_assumpetions = [{
        'assumption_key': a['assumptionKey'],
        'unique': a['unique'],
        'name': a['name'],
        'embedded': a['embeddedLookupTables'],
        **a['econ_function']
    } for a in ASSUMPTIONS]
    result_table['ownership_reversion'] = [truncated_assumpetions[0]] * 3
    result_table.at[ObjectId("63a0e8dce640e5a88bb7d9d6"), 'dates'] = truncated_assumpetions[1]
    result_table.at[ObjectId("63a0e8dce640e5a88bb7d9d8"), 'dates'] = truncated_assumpetions[1]
    result_table.at[ObjectId("63a0e8dce640e5a88bb7d9d7"), 'dates'] = None
    result_table.at[ObjectId("63a0e8dce640e5a88bb7d9d7"), 'dates_type'] = None
    result_table.at[ObjectId("63a0e8dce640e5a88bb7d9d6"), 'capex'] = truncated_assumpetions[2]
    result_table.at[ObjectId("63a0e8dce640e5a88bb7d9d7"), 'capex'] = truncated_assumpetions[2]
    result_table.at[ObjectId("63a0e8dce640e5a88bb7d9d6"), 'pricing'] = truncated_assumpetions[4]
    result_table.at[ObjectId("63a0e8dce640e5a88bb7d9d7"), 'pricing'] = truncated_assumpetions[4]
    result_table.at[ObjectId("63a0e8dce640e5a88bb7d9d8"), 'pricing'] = truncated_assumpetions[3]
    return result_table


SCHEDULE_INPUT_RESULT_FIXTURE = schedule_input_table_result()

ECON_INPUT_RESULT_FIXTURE = [{
    "assignment_id": None,
    "production_data": {
        "oil": None,
        "gas": None,
        "water": None
    },
    "forecast_data": {
        "oil": None,
        "gas": None,
        "water": None
    },
    "p_series": "P50",
    "well": {
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
        "first_prod_date_monthly_calc": datetime.fromisoformat("2013-08-15T00:00:00.000000"),
        "chosenID": "3305304293",
        "api10": "3305304293",
        "api14": "33053042930100",
        "chosenKeyID": "API10",
        "completion_start_date": datetime.fromisoformat("2013-09-02T00:00:00.000000"),
        "county": "MCKENZIE",
        "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766000"),
        "current_operator": "Hess",
        "custom_bool_0": False,
        "custom_bool_1": False,
        "custom_number_0": 100,
        "custom_number_1": 109,
        "field": "BLUE BUTTES",
        "first_prod_date": datetime.fromisoformat("2013-08-01T00:00:00.000000"),
        "geohash": "c8wbderbzn3r",
        "has_daily": False,
        "has_monthly": True,
        "hole_direction": "H",
        "inptID": "INPTBSICb6I7ii",
        "last_prod_date_daily": None,
        "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000000"),
        "lease_name": "BB-BURK-151-95",
        "location": {
            "type": "Point",
            "coordinates": [-102.887004053, 47.918406942]
        },
        "lower_perforation": 20839,
        "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167000"),
        "mostRecentImportDesc": "Survey",
        "mostRecentImportType": "spreadsheet",
        "permit_date": datetime.fromisoformat("2012-08-10T00:00:00.000000"),
        "range": "95W",
        "section": "7",
        "spud_date": datetime.fromisoformat("2013-06-15T00:00:00.000000"),
        "state": "ND",
        "toeLatitude": 47.891607582,
        "toeLocation": {
            "type": "Point",
            "coordinates": [-102.893859182, 47.891607582]
        },
        "toeLongitude": -102.893859182,
        "township": "151N",
        "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766000"),
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
    },
    "incremental_index": 0,
    "combo_name": None,
    "assumptions": {
        "capex": {
            "unique":
            False,
            "name":
            "bas",
            "other_capex": {
                "rows": []
            },
            "embedded": [ObjectId("6441c787fc13ce001268f080")],
            "fetched_embedded": [
                [
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
            ]
        },
        "dates": {
            "unique": False,
            "name": "bar",
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
            },
            "embedded": []
        },
        "ownership_reversion": {
            "unique": False,
            "name": "foo",
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
            },
            "embedded": []
        },
        "pricing": {
            "unique": False,
            "name": "bed",
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
            },
            "embedded": []
        }
    },
    "forecast_name": None,
    "oil_tc_risking": None,
    "gas_tc_risking": None,
    "water_tc_risking": None,
    "apply_normalization": None,
    "network": None,
    "ghg": None,
    "schedule": {}
}, {
    "assignment_id": None,
    "production_data": {
        "oil": None,
        "gas": None,
        "water": None
    },
    "forecast_data": {
        "oil": {
            "ratio": {
                "enabled": False,
                "phase": "oil",
                "value": 1
            },
            "data_freq": "monthly",
            "forecasted": True,
            "phase": "oil",
            "forecastType": "prob",
            "typeCurve": None,
            "forecast": ObjectId("644695f6e3d2200021a1872a"),
            "P_dict": {
                "P10": {
                    "diagnostics": {},
                    "eur":
                    227403.59213965587,
                    "rur":
                    98543.59213965587,
                    "segments": [{
                        "name": "arps_modified",
                        "q_start": 31.540041067761805,
                        "q_end": 0.31621059489427195,
                        "slope": -1.0,
                        "D_eff": 0.14601024350909797,
                        "D": 0.00047027285010737104,
                        "b": 1.0570861700874574,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.08000000000000007,
                        "sw_idx": 46400.311739342105,
                        "q_sw": 15.919976082417891,
                        "D_exp_eff": 0.08000000000000007,
                        "D_exp": 0.00022828640366612206,
                        "start_idx": 44268.0,
                        "end_idx": 63567.0
                    }]
                },
                "P50": {
                    "diagnostics": {},
                    "eur":
                    184527.89554815166,
                    "rur":
                    55667.89554815166,
                    "segments": [{
                        "name": "arps_modified",
                        "q_start": 31.540041067761805,
                        "q_end": 0.16804304539014278,
                        "slope": -1.0,
                        "D_eff": 0.30933590906744923,
                        "D": 0.0012400849171486999,
                        "b": 1.0570861700874574,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999996,
                        "sw_idx": 47649.05452311842,
                        "q_sw": 6.361825833128293,
                        "D_exp_eff": 0.07999999999999996,
                        "D_exp": 0.00022828640366612179,
                        "start_idx": 44268.0,
                        "end_idx": 63567.0
                    }]
                },
                "P90": {
                    "diagnostics": {},
                    "eur":
                    161178.93956649792,
                    "rur":
                    32318.939566497924,
                    "segments": [{
                        "name": "arps_modified",
                        "q_start": 31.540041067761805,
                        "q_end": 0.10000241321126659,
                        "slope": -1.0,
                        "D_eff": 0.41771102192654996,
                        "D": 0.0018599441976923491,
                        "b": 0.8137878790921255,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999996,
                        "sw_idx": 48990.12959452413,
                        "q_sw": 2.395419059878586,
                        "D_exp_eff": 0.07999999999999996,
                        "D_exp": 0.000228286403666122,
                        "start_idx": 44268.0,
                        "end_idx": 62903.0
                    }]
                },
                "best": {
                    "diagnostics": {},
                    "eur":
                    177731.71985055957,
                    "rur":
                    48871.71985055957,
                    "segments": [{
                        "name": "arps_modified",
                        "q_start": 31.540041067761805,
                        "q_end": 0.14481118623988987,
                        "slope": -1.0,
                        "D_eff": 0.34357716696739893,
                        "D": 0.0014405536499071843,
                        "b": 1.0232849587691977,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999996,
                        "sw_idx": 47870.40301299945,
                        "q_sw": 5.212164012335993,
                        "D_exp_eff": 0.07999999999999996,
                        "D_exp": 0.000228286403666122,
                        "start_idx": 44268.0,
                        "end_idx": 63567.0
                    }]
                }
            },
            "well": ObjectId("63a0e8dce640e5a88bb7d9d7")
        },
        "gas": {
            "ratio": {
                "enabled": False,
                "phase": "oil",
                "value": 1
            },
            "data_freq": "monthly",
            "forecasted": True,
            "phase": "gas",
            "forecastType": "prob",
            "typeCurve": None,
            "forecast": ObjectId("644695f6e3d2200021a1872a"),
            "P_dict": {
                "P10": {
                    "diagnostics": {},
                    "eur":
                    2230838.7414176795,
                    "rur":
                    958979.7414176795,
                    "segments": [{
                        "name": "arps_modified",
                        "q_start": 381.70020533880904,
                        "q_end": 3.0015905625179835,
                        "slope": -1.0,
                        "D_eff": 0.20814251674552853,
                        "D": 0.0007241102515923364,
                        "b": 1.0508796621385266,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999996,
                        "sw_idx": 47153.23470059855,
                        "q_sw": 127.25357972822896,
                        "D_exp_eff": 0.07999999999999996,
                        "D_exp": 0.00022828640366612184,
                        "start_idx": 44299.0,
                        "end_idx": 63567.0
                    }]
                },
                "P50": {
                    "diagnostics": {},
                    "eur":
                    1949326.5057789404,
                    "rur":
                    677467.5057789404,
                    "segments": [{
                        "name": "arps_modified",
                        "q_start": 381.70020533880904,
                        "q_end": 2.036195837848414,
                        "slope": -1.0,
                        "D_eff": 0.3098513481123414,
                        "D": 0.0012415861406773754,
                        "b": 1.0508796621385266,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999985,
                        "sw_idx": 47700.950892655426,
                        "q_sw": 76.17905626257696,
                        "D_exp_eff": 0.07999999999999985,
                        "D_exp": 0.00022828640366612168,
                        "start_idx": 44299.0,
                        "end_idx": 63567.0
                    }]
                },
                "P90": {
                    "diagnostics": {},
                    "eur":
                    1747396.5814760285,
                    "rur":
                    475537.58147602854,
                    "segments": [{
                        "name": "arps_modified",
                        "q_start": 381.70020533880904,
                        "q_end": 1.3124359820052331,
                        "slope": -1.0,
                        "D_eff": 0.379417853733093,
                        "D": 0.0016157383741107027,
                        "b": 0.8619506282821862,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999996,
                        "sw_idx": 48662.99738170772,
                        "q_sw": 39.419715976566444,
                        "D_exp_eff": 0.07999999999999996,
                        "D_exp": 0.0002282864036661218,
                        "start_idx": 44299.0,
                        "end_idx": 63567.0
                    }]
                },
                "best": {
                    "diagnostics": {},
                    "eur":
                    1914373.6853269197,
                    "rur":
                    642514.6853269197,
                    "segments": [{
                        "name": "arps_modified",
                        "q_start": 381.70020533880904,
                        "q_end": 1.9166329336558416,
                        "slope": -1.0,
                        "D_eff": 0.3241590718061619,
                        "D": 0.0013238505099722722,
                        "b": 1.0387483517775007,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999996,
                        "sw_idx": 47788.863607064304,
                        "q_sw": 70.28117484772294,
                        "D_exp_eff": 0.07999999999999996,
                        "D_exp": 0.00022828640366612203,
                        "start_idx": 44299.0,
                        "end_idx": 63567.0
                    }]
                }
            },
            "well": ObjectId("63a0e8dce640e5a88bb7d9d7")
        },
        "water": {
            "ratio": {
                "enabled": False,
                "phase": "oil",
                "value": 1
            },
            "data_freq": "monthly",
            "forecasted": True,
            "phase": "water",
            "forecastType": "prob",
            "typeCurve": None,
            "forecast": ObjectId("644695f6e3d2200021a1872a"),
            "P_dict": {
                "P10": {
                    "diagnostics": {},
                    "eur":
                    64937.676940662415,
                    "rur":
                    13176.676940662415,
                    "segments": [{
                        "name": "arps_modified",
                        "q_start": 8.903490759753593,
                        "q_end": 0.10001535223413438,
                        "slope": -1.0,
                        "D_eff": 0.26265549120366116,
                        "D": 0.0009734300399659988,
                        "b": 0.9881860905991635,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999996,
                        "sw_idx": 46626.25477864025,
                        "q_sw": 2.0521351907816356,
                        "D_exp_eff": 0.07999999999999996,
                        "D_exp": 0.00022828640366612203,
                        "start_idx": 43233.0,
                        "end_idx": 59861.0
                    }]
                },
                "P50": {
                    "diagnostics": {},
                    "eur":
                    57891.062699790265,
                    "rur":
                    6130.0626997902655,
                    "segments": [{
                        "name": "arps_modified",
                        "q_start": 8.903490759753593,
                        "q_end": 0.10001879769890407,
                        "slope": -1.0,
                        "D_eff": 0.4599312934582688,
                        "D": 0.0023158205730403375,
                        "b": 0.9799795410690099,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999996,
                        "sw_idx": 47262.31879486965,
                        "q_sw": 0.8371028378005623,
                        "D_exp_eff": 0.07999999999999996,
                        "D_exp": 0.00022828640366612192,
                        "start_idx": 43233.0,
                        "end_idx": 56569.0
                    }]
                },
                "P90": {
                    "diagnostics": {},
                    "eur":
                    54215.63722299487,
                    "rur":
                    2454.6372229948684,
                    "segments": [{
                        "name": "arps_modified",
                        "q_start": 8.903490759753593,
                        "q_end": 0.1000154366426363,
                        "slope": -1.0,
                        "D_eff": 0.599172122534559,
                        "D": 0.0036669431598751624,
                        "b": 0.7882542762013361,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999996,
                        "sw_idx": 48444.20630951669,
                        "q_sw": 0.2629179683121018,
                        "D_exp_eff": 0.07999999999999996,
                        "D_exp": 0.0002282864036661218,
                        "start_idx": 43233.0,
                        "end_idx": 52678.0
                    }]
                },
                "best": {
                    "diagnostics": {},
                    "eur":
                    57729.412818988385,
                    "rur":
                    5968.412818988385,
                    "segments": [{
                        "name": "arps_modified",
                        "q_start": 8.903490759753593,
                        "q_end": 0.10000801955471578,
                        "slope": -1.0,
                        "D_eff": 0.47655465322525936,
                        "D": 0.0025052318375151815,
                        "b": 1.014106376223273,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999996,
                        "sw_idx": 47158.9172464563,
                        "q_sw": 0.838810994520981,
                        "D_exp_eff": 0.07999999999999996,
                        "D_exp": 0.00022828640366612192,
                        "start_idx": 43233.0,
                        "end_idx": 56475.0
                    }]
                }
            },
            "well": ObjectId("63a0e8dce640e5a88bb7d9d7")
        }
    },
    "p_series": "P50",
    "well": {
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
        "first_prod_date_monthly_calc": datetime.fromisoformat("2014-01-15T00:00:00.000000"),
        "chosenID": "0512337761",
        "api10": "0512337761",
        "api14": "05123377610000",
        "chosenKeyID": "API10",
        "completion_start_date": datetime.fromisoformat("2014-01-24T00:00:00.000000"),
        "county": "WELD",
        "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766000"),
        "current_operator": "OXY",
        "custom_bool_0": False,
        "custom_bool_1": False,
        "custom_number_0": 100,
        "field": "WATTENBERG",
        "first_prod_date": datetime.fromisoformat("2014-01-01T00:00:00.000000"),
        "geohash": "9xjkwz4cuw8b",
        "has_daily": False,
        "has_monthly": True,
        "hole_direction": "H",
        "inptID": "INPTMO2pbhI5TT",
        "last_prod_date_daily": None,
        "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000000"),
        "lease_name": "HARRIS FEDERAL",
        "location": {
            "type": "Point",
            "coordinates": [-104.81658593, 40.204803119]
        },
        "lower_perforation": 15575,
        "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167000"),
        "mostRecentImportDesc": "Survey",
        "mostRecentImportType": "spreadsheet",
        "permit_date": datetime.fromisoformat("2013-07-26T00:00:00.000000"),
        "range": "66W",
        "section": "19",
        "spud_date": datetime.fromisoformat("2013-07-31T00:00:00.000000"),
        "state": "CO",
        "status": "A",
        "toeLatitude": 40.22942519,
        "toeLocation": {
            "type": "Point",
            "coordinates": [-104.818129889, 40.22942519]
        },
        "toeLongitude": -104.818129889,
        "township": "3N",
        "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766000"),
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
    },
    "incremental_index": 0,
    "combo_name": None,
    "assumptions": {
        "capex": {
            "unique":
            False,
            "name":
            "bas",
            "other_capex": {
                "rows": []
            },
            "embedded": [ObjectId("6441c787fc13ce001268f080")],
            "fetched_embedded": [
                [
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
            ]
        },
        "ownership_reversion": {
            "unique": False,
            "name": "foo",
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
            },
            "embedded": []
        },
        "pricing": {
            "unique": False,
            "name": "bed",
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
            },
            "embedded": []
        }
    },
    "forecast_name": None,
    "oil_tc_risking": None,
    "gas_tc_risking": None,
    "water_tc_risking": None,
    "apply_normalization": None,
    "network": None,
    "ghg": None,
    "schedule": {}
}, {
    "assignment_id": None,
    "production_data": {
        "oil": None,
        "gas": None,
        "water": None
    },
    "forecast_data": {
        "oil": {
            "ratio": {
                "segments": [],
                "basePhase": None,
                "x": None,
                "eur": None,
                "rur": None,
                "diagnostics": {}
            },
            "data_freq": "monthly",
            "forecasted": True,
            "forecastType": "rate",
            "forecastSubType": "automatic",
            "phase": "oil",
            "typeCurve": None,
            "forecast": ObjectId("64373c00078ba5001254989c"),
            "P_dict": {
                "best": {
                    "diagnostics": {},
                    "eur":
                    95306.39485402378,
                    "rur":
                    27802.394854023776,
                    "segments": [{
                        "name": "exp_inc",
                        "slope": 1.0,
                        "D_eff": -0.9885156476372761,
                        "D": -0.001881967021767046,
                        "q_start": 7.549256160966756,
                        "q_end": 9.444221870952495,
                        "start_idx": 44148.0,
                        "end_idx": 44267.0
                    }, {
                        "name": "arps",
                        "slope": -1.0,
                        "b": 2.0,
                        "D_eff": 0.27664060596860396,
                        "D": 0.0012472781404496312,
                        "q_start": 9.462012320328542,
                        "q_end": 3.5065437672985915,
                        "start_idx": 44268.0,
                        "end_idx": 46786.0
                    }, {
                        "name": "arps_modified",
                        "q_start": 3.5021782976456874,
                        "q_end": 0.19888766115001352,
                        "slope": -1.0,
                        "D_eff": 0.058869576507437626,
                        "D": 0.00017125800203894487,
                        "b": 0.9999999203039907,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.06063577153514832,
                        "sw_idx": 46787.0,
                        "q_sw": 3.5021782976456874,
                        "D_exp_eff": 0.06063577153514832,
                        "D_exp": 0.00017125800203894487,
                        "start_idx": 46787.0,
                        "end_idx": 63536.0
                    }]
                }
            },
            "well": ObjectId("63a0e8dce640e5a88bb7d9d8")
        },
        "gas": {
            "ratio": {
                "segments": [],
                "basePhase": None,
                "x": None,
                "eur": None,
                "rur": None,
                "diagnostics": {}
            },
            "data_freq": "monthly",
            "forecasted": True,
            "forecastType": "rate",
            "forecastSubType": "automatic",
            "phase": "gas",
            "typeCurve": None,
            "forecast": ObjectId("64373c00078ba5001254989c"),
            "P_dict": {
                "best": {
                    "diagnostics": {},
                    "eur":
                    1770002.6364254812,
                    "rur":
                    697715.6364254812,
                    "segments": [{
                        "name": "exp_inc",
                        "slope": 1.0,
                        "D_eff": -0.2889279399354552,
                        "D": -0.0006948961493303265,
                        "q_start": 189.0314870355351,
                        "q_end": 205.32749500123896,
                        "start_idx": 44148.0,
                        "end_idx": 44267.0
                    }, {
                        "name": "arps",
                        "slope": -1.0,
                        "b": 2.0,
                        "D_eff": 0.13765123931177123,
                        "D": 0.0004719054931268535,
                        "q_start": 205.47022587268995,
                        "q_end": 143.68902953619155,
                        "start_idx": 44268.0,
                        "end_idx": 45375.0
                    }, {
                        "name": "arps_modified",
                        "q_start": 143.62126985432985,
                        "q_end": 2.2737807345946024,
                        "slope": -1.0,
                        "D_eff": 0.07771190159772035,
                        "D": 0.00023069102854865142,
                        "b": 0.9999998944917315,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999996,
                        "sw_idx": 45421.66007607943,
                        "q_sw": 142.1242228405287,
                        "D_exp_eff": 0.07999999999999996,
                        "D_exp": 0.00022828640366612192,
                        "start_idx": 45376.0,
                        "end_idx": 63536.0
                    }]
                }
            },
            "well": ObjectId("63a0e8dce640e5a88bb7d9d8")
        },
        "water": {
            "ratio": {
                "segments": [],
                "basePhase": None,
                "x": None,
                "eur": None,
                "rur": None,
                "diagnostics": {}
            },
            "data_freq": "monthly",
            "forecasted": True,
            "forecastType": "rate",
            "forecastSubType": "automatic",
            "phase": "water",
            "typeCurve": None,
            "forecast": ObjectId("64373c00078ba5001254989c"),
            "P_dict": {
                "best": {
                    "diagnostics": {},
                    "eur":
                    23654.758575748063,
                    "rur":
                    4083.758575748063,
                    "segments": [{
                        "name": "exp_inc",
                        "slope": 1.0,
                        "D_eff": -38842.26930961915,
                        "D": -0.028931663497995752,
                        "q_start": 2.924024640657084,
                        "q_end": 6.766467817227477,
                        "start_idx": 44148.0,
                        "end_idx": 44177.0
                    }, {
                        "name": "arps",
                        "slope": -1.0,
                        "b": 2.0,
                        "D_eff": 0.7506570910832063,
                        "D": 0.02064947354266577,
                        "q_start": 6.965092402464066,
                        "q_end": 0.7543624552980497,
                        "start_idx": 44178.0,
                        "end_idx": 46218.0
                    }, {
                        "name": "arps_modified",
                        "q_start": 0.7392517320766993,
                        "q_end": 0.10001144381230079,
                        "slope": -1.0,
                        "D_eff": 0.08126116916833126,
                        "D": 0.00024215909581677396,
                        "b": 1.0000008989661848,
                        "target_D_eff_sw": 0.08,
                        "realized_D_eff_sw": 0.07999999999999996,
                        "sw_idx": 46469.94556556439,
                        "q_sw": 0.6969018764317876,
                        "D_exp_eff": 0.07999999999999996,
                        "D_exp": 0.0002282864036661218,
                        "start_idx": 46219.0,
                        "end_idx": 54974.0
                    }]
                }
            },
            "well": ObjectId("63a0e8dce640e5a88bb7d9d8")
        }
    },
    "p_series": "P50",
    "well": {
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
        "first_prod_date_monthly_calc": datetime.fromisoformat("2013-12-15T00:00:00.000000"),
        "chosenID": "0512337574",
        "api10": "0512337574",
        "api14": "05123375740000",
        "chosenKeyID": "API10",
        "completion_start_date": datetime.fromisoformat("2013-12-27T00:00:00.000000"),
        "county": "WELD",
        "createdAt": datetime.fromisoformat("2022-12-19T22:42:44.766000"),
        "current_operator": "OXY",
        "custom_bool_0": False,
        "custom_bool_1": False,
        "custom_number_0": 100,
        "field": "WATTENBERG",
        "first_prod_date": datetime.fromisoformat("2013-12-01T00:00:00.000000"),
        "geohash": "9xjkzmu2npz3",
        "has_daily": False,
        "has_monthly": True,
        "hole_direction": "H",
        "inptID": "INPT9RbMOJBC2w",
        "last_prod_date_daily": None,
        "last_prod_date_monthly": datetime.fromisoformat("2022-10-15T00:00:00.000000"),
        "lease_name": "EISENACH FEDERAL",
        "location": {
            "type": "Point",
            "coordinates": [-104.79248009, 40.241588449]
        },
        "lower_perforation": 12059,
        "mostRecentImportDate": datetime.fromisoformat("2022-12-19T21:40:04.167000"),
        "mostRecentImportDesc": "Survey",
        "mostRecentImportType": "spreadsheet",
        "permit_date": datetime.fromisoformat("2013-06-13T00:00:00.000000"),
        "range": "66W",
        "section": "8",
        "spud_date": datetime.fromisoformat("2013-07-16T00:00:00.000000"),
        "state": "CO",
        "status": "A",
        "toeLatitude": 40.241861484,
        "toeLocation": {
            "type": "Point",
            "coordinates": [-104.810624621, 40.241861484]
        },
        "toeLongitude": -104.810624621,
        "township": "3N",
        "updatedAt": datetime.fromisoformat("2022-12-19T22:42:44.766000"),
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
    },
    "incremental_index": 0,
    "combo_name": None,
    "assumptions": {
        "dates": {
            "unique": False,
            "name": "bar",
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
            },
            "embedded": []
        },
        "ownership_reversion": {
            "unique": False,
            "name": "foo",
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
            },
            "embedded": []
        },
        "pricing": {
            "unique": False,
            "name": "bunk",
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
            },
            "embedded": []
        }
    },
    "forecast_name": None,
    "oil_tc_risking": None,
    "gas_tc_risking": None,
    "water_tc_risking": None,
    "apply_normalization": None,
    "network": None,
    "ghg": None,
    "schedule": {}
}]
