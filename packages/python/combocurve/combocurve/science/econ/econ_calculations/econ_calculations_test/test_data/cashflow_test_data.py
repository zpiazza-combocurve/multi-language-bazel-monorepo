import numpy as np
import datetime

# BFIT VARIABLES
capex_dict_generator = {
    "unecon": {
        "time": np.array([0]),
        "capex_by_category": {
            "gross": {
                "drilling": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "completion": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "legal": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "pad": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "facilities": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "artificial_lift": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "workover": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "leasehold": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "development": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "pipelines": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "exploration": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "waterline": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "appraisal": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "other_investment": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "abandonment": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "salvage": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
            },
            "net": {
                "drilling": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "completion": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "legal": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "pad": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "facilities": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "artificial_lift": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "workover": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "leasehold": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "development": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "pipelines": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "exploration": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "waterline": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "appraisal": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "other_investment": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "abandonment": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
                "salvage": {
                    "tangible": np.array([0.0]),
                    "intangible": np.array([0.0]),
                    "total": np.array([0.0]),
                },
            },
        },
        "tangible": np.array([0.0]),
        "intangible": np.array([0.0]),
        "total_capex": np.array([0.0]),
        "total_gross_capex": np.array([0.0]),
        "capex_detail": [],
    },
    "econ_no_capex": {
        "time": np.array([0, 1, 2, 3, 4, 5]),
        "capex_by_category": {
            "gross": {
                "drilling": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "completion": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "legal": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "pad": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "facilities": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "artificial_lift": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "workover": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "leasehold": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "development": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "pipelines": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "exploration": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "waterline": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "appraisal": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "other_investment": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "abandonment": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "salvage": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
            },
            "net": {
                "drilling": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "completion": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "legal": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "pad": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "facilities": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "artificial_lift": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "workover": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "leasehold": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "development": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "pipelines": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "exploration": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "waterline": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "appraisal": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "other_investment": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "abandonment": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "salvage": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
            },
        },
        "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "total_capex": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "total_gross_capex": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "capex_detail": [],
    },
    "econ_capex": {
        "time":
        np.array([0, 1, 2, 3, 4, 5]),
        "capex_by_category": {
            "gross": {
                "drilling": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "completion": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "legal": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "pad": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "facilities": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "artificial_lift": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "workover": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "leasehold": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "development": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "pipelines": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "exploration": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "waterline": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "appraisal": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "other_investment": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "abandonment": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "salvage": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
            },
            "net": {
                "drilling": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "completion": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "legal": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "pad": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "facilities": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "artificial_lift": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "workover": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "leasehold": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "development": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "pipelines": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "exploration": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "waterline": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "appraisal": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "other_investment": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "abandonment": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "salvage": {
                    "tangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
            },
        },
        "tangible":
        np.array([0.0, 100000.0, 0.0, 0.0, 0.0, 0.0]),
        "intangible":
        np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "total_capex":
        np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "total_gross_capex":
        np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "capex_detail": [{
            "date": datetime.date(1995, 11, 11),
            "index": 0,
            "tangible": 0.0,
            "intangible": 0.0,
            "total": 0.0,
            "after_econ_limit": "yes",
        }],
    },
}

carbon_expense_generator = {
    "unecon": [
        {
            "category": "co2e",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "co2",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "ch4",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "n2o",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
    ],
    "econ_no_expense": [
        {
            "category": "co2e",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "co2",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "ch4",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "n2o",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
    ],
    "econ_expense": [
        {
            "category": "co2e",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "co2",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "ch4",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "n2o",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
    ],
}

fixed_expense_generator = {
    "unecon": [
        {
            "category": "monthly_well_cost",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_1",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_2",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_3",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_4",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_5",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_6",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_7",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_8",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
    ],
    "econ_no_expense": [
        {
            "category": "monthly_well_cost",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_1",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_2",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_3",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_4",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_5",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_6",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_7",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_8",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
    ],
    "econ_expense": [
        {
            "category": "monthly_well_cost",
            "values": np.array([0.9, 0.9, 0.9, 0.9, 0.9, 0.9]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_1",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_2",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_3",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_4",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_5",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_6",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_7",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "category": "other_monthly_cost_8",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
    ],
}

variable_expense_generator = {
    "unecon": [
        {
            "key": "oil",
            "category": "gathering",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "oil",
            "category": "processing",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "oil",
            "category": "transportation",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "oil",
            "category": "marketing",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "oil",
            "category": "other",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "gathering",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "processing",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "transportation",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "marketing",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "other",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "gathering",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "processing",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "transportation",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "marketing",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "other",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "gathering",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "processing",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "transportation",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "marketing",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "other",
            "values": np.array([0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
    ],
    "econ_no_expense": [
        {
            "key": "oil",
            "category": "gathering",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "oil",
            "category": "processing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "oil",
            "category": "transportation",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "oil",
            "category": "marketing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "oil",
            "category": "other",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "gathering",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "processing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "transportation",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "marketing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "other",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "gathering",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "processing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "transportation",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "marketing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "other",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "gathering",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "processing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "transportation",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "marketing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "other",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
    ],
    "econ_expense": [
        {
            "key": "oil",
            "category": "gathering",
            "values": np.array([2528.325, 965.25, 512.325, 468.0, 526.5, 374.85]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "oil",
            "category": "processing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "oil",
            "category": "transportation",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "oil",
            "category": "marketing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "oil",
            "category": "other",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "gathering",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "processing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "transportation",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "marketing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "gas",
            "category": "other",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "gathering",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "processing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "transportation",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "marketing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "ngl",
            "category": "other",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "gathering",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "processing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "transportation",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "marketing",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
        {
            "key": "drip_condensate",
            "category": "other",
            "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "affect_econ_limit": "yes",
            "deduct_before_severance_tax": "no",
            "deduct_before_ad_val_tax": "no",
        },
    ],
}

water_expense_generator = {
    "unecon": [{
        "values": np.array([0.0]),
        "affect_econ_limit": "yes",
        "deduct_before_severance_tax": "no",
        "deduct_before_ad_val_tax": "no",
    }],
    "econ_no_expense": [{
        "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "affect_econ_limit": "yes",
        "deduct_before_severance_tax": "no",
        "deduct_before_ad_val_tax": "no",
    }],
    "econ_expense": [{
        "values": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "affect_econ_limit": "yes",
        "deduct_before_severance_tax": "no",
        "deduct_before_ad_val_tax": "no",
    }],
}

revenue_dict_generator = {
    "unecon": {
        "oil": {
            "original_price": np.array([0.0]),
            "differentials_1": np.array([0.0]),
            "differentials_2": np.array([0.0]),
            "differentials_3": np.array([0.0]),
            "differential": np.array([0.0]),
            "price_after_diff": np.array([0.0]),
            "net_revenue": np.array([0.0]),
            "gross_revenue": np.array([0.0]),
            "ownership": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0.0]),
            },
        },
        "gas": {
            "original_price": np.array([0.0]),
            "differentials_1": np.array([0.0]),
            "differentials_2": np.array([0.0]),
            "differentials_3": np.array([0.0]),
            "differential": np.array([0.0]),
            "price_after_diff": np.array([0.0]),
            "net_revenue": np.array([0.0]),
            "gross_revenue": np.array([0.0]),
            "ownership": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0.0]),
            },
        },
        "ngl": {
            "original_price": np.array([0.0]),
            "differentials_1": np.array([0.0]),
            "differentials_2": np.array([0.0]),
            "differentials_3": np.array([0.0]),
            "differential": np.array([0.0]),
            "price_after_diff": np.array([0.0]),
            "net_revenue": np.array([0.0]),
            "gross_revenue": np.array([0.0]),
            "ownership": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0.0]),
            },
        },
        "drip_condensate": {
            "original_price": np.array([0.0]),
            "differentials_1": np.array([0.0]),
            "differentials_2": np.array([0.0]),
            "differentials_3": np.array([0.0]),
            "differential": np.array([0.0]),
            "price_after_diff": np.array([0.0]),
            "net_revenue": np.array([0.0]),
            "gross_revenue": np.array([0.0]),
            "ownership": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0.0]),
            },
        },
    },
    "econ": {
        "oil": {
            "original_price": np.array([80.0, 80.16666667, 80.33333333, 80.5, 80.66666667, 80.83333333]),
            "differentials_1": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differential": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "price_after_diff": np.array([80.0, 80.16666667, 80.33333333, 80.5, 80.66666667, 80.83333333]),
            "net_revenue": np.array([719168.0, 275132.0, 146335.2, 133952.0, 151008.0, 107734.66666667]),
            "gross_revenue": np.array([809064.0, 309523.5, 164627.1, 150696.0, 169884.0, 121201.5]),
            "ownership": {
                "wi": np.array([809064.0, 309523.5, 164627.1, 150696.0, 169884.0, 121201.5]),
                "nri": np.array([719168.0, 275132.0, 146335.2, 133952.0, 151008.0, 107734.66666667]),
                "lease_nri": np.array([719168.0, 275132.0, 146335.2, 133952.0, 151008.0, 107734.66666667]),
                "one_minus_wi": np.array([89896.0, 34391.5, 18291.9, 16744.0, 18876.0, 13466.83333333]),
                "one_minus_nri": np.array([179792.0, 68783.0, 36583.8, 33488.0, 37752.0, 26933.66666667]),
                "one_minus_lease_nri": np.array([179792.0, 68783.0, 36583.8, 33488.0, 37752.0, 26933.66666667]),
                "wi_minus_one": np.array([-89896.0, -34391.5, -18291.9, -16744.0, -18876.0, -13466.83333333]),
                "nri_minus_one": np.array([-179792.0, -68783.0, -36583.8, -33488.0, -37752.0, -26933.66666667]),
                "lease_nri_minus_one": np.array([-179792.0, -68783.0, -36583.8, -33488.0, -37752.0, -26933.66666667]),
                "100_pct_wi": np.array([898960.0, 343915.0, 182919.0, 167440.0, 188760.0, 134668.33333333]),
            },
        },
        "gas": {
            "original_price": np.array([3.0, 3.0, 3.0, 3.0, 3.0, 3.0]),
            "differentials_1": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differential": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "price_after_diff": np.array([3.0, 3.0, 3.0, 3.0, 3.0, 3.0]),
            "net_revenue": np.array([33453.6, 19833.6, 14080.8, 6278.4, 0.0, 11268.0]),
            "gross_revenue": np.array([37635.3, 22312.8, 15840.9, 7063.2, 0.0, 12676.5]),
            "ownership": {
                "wi": np.array([37635.3, 22312.8, 15840.9, 7063.2, 0.0, 12676.5]),
                "nri": np.array([33453.6, 19833.6, 14080.8, 6278.4, 0.0, 11268.0]),
                "lease_nri": np.array([33453.6, 19833.6, 14080.8, 6278.4, 0.0, 11268.0]),
                "one_minus_wi": np.array([4181.7, 2479.2, 1760.1, 784.8, 0.0, 1408.5]),
                "one_minus_nri": np.array([8363.4, 4958.4, 3520.2, 1569.6, 0.0, 2817.0]),
                "one_minus_lease_nri": np.array([8363.4, 4958.4, 3520.2, 1569.6, 0.0, 2817.0]),
                "wi_minus_one": np.array([-4181.7, -2479.2, -1760.1, -784.8, -0.0, -1408.5]),
                "nri_minus_one": np.array([-8363.4, -4958.4, -3520.2, -1569.6, -0.0, -2817.0]),
                "lease_nri_minus_one": np.array([-8363.4, -4958.4, -3520.2, -1569.6, -0.0, -2817.0]),
                "100_pct_wi": np.array([41817.0, 24792.0, 17601.0, 7848.0, 0.0, 14085.0]),
            },
        },
        "ngl": {
            "original_price": np.array([80.0, 80.16666667, 80.33333333, 80.5, 80.66666667, 80.83333333]),
            "differentials_1": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differential": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "price_after_diff": np.array([80.0, 80.16666667, 80.33333333, 80.5, 80.66666667, 80.83333333]),
            "net_revenue": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "gross_revenue": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "ownership": {
                "wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "wi_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "lease_nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            },
        },
        "drip_condensate": {
            "original_price": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differentials_1": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "differential": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "price_after_diff": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "net_revenue": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "gross_revenue": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "ownership": {
                "wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "wi_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "lease_nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            },
        },
    },
}

production_tax_dict_generator = {
    "unecon": {
        "time": np.array([0]),
        "oil_severance_tax": np.array([0.0]),
        "gas_severance_tax": np.array([0.0]),
        "ngl_severance_tax": np.array([0.0]),
        "drip_condensate_severance_tax": np.array([0.0]),
        "ad_valorem_tax": np.array([0.0]),
        "total_production_tax": np.array([0.0]),
    },
    "no_tax": {
        "time": np.array([0, 1, 2, 3, 4, 5]),
        "oil_severance_tax": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "gas_severance_tax": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "ngl_severance_tax": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "drip_condensate_severance_tax": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "ad_valorem_tax": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "total_production_tax": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
    },
    "tax": {
        "time": np.array([0, 1, 2, 3, 4, 5]),
        "oil_severance_tax": np.array([33154.54376, 12683.8712, 6746.17416, 6175.2704, 6961.5312, 4966.59034667]),
        "gas_severance_tax": np.array([2516.82584, 1492.14784, 1059.34552, 472.34496, 0.0, 847.7292]),
        "ngl_severance_tax": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "drip_condensate_severance_tax": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "ad_valorem_tax": np.array([18815.54, 7374.14, 4010.4, 3505.76, 3775.2, 2975.06666667]),
        "total_production_tax": np.array([
            54486.9096,
            21550.15904,
            11815.91968,
            10153.37536,
            10736.7312,
            8789.38621333,
        ]),
    },
}

npi_generator = {
    "unecon": {
        "expense": np.array([0.01])
    },
    "econ": {
        "expense": np.array([0.01, 0.01, 0.01, 0.01, 0.01, 0.01])
    },
}

t_all_generator = {"unecon": np.array([0]), "econ": np.array([0, 1, 2, 3, 4, 5])}

# AFIT VARIABLES
date_dict_generator = {
    "unecon": {
        "cf_start_date": datetime.date(1995, 11, 1),
        "cf_end_date": datetime.date(1995, 11, 1),
        "cut_off_date": datetime.date(1995, 11, 1),
        "as_of_date": datetime.date(1995, 11, 1),
        "volume_start_date": datetime.date(1995, 11, 1),
        "first_production_date": datetime.date(1995, 11, 1),
        "first_segment_date": datetime.date(2015, 6, 15),
        "end_history_date": datetime.date(2015, 9, 1),
        "discount_date": datetime.date(1995, 11, 1),
        "original_discount_date": datetime.date(1995, 11, 1),
        "side_phase_end_date": None,
        "start_using_forecast": {
            "oil": datetime.date(2015, 6, 15),
            "gas": datetime.date(2015, 6, 15),
            "water": datetime.date(2015, 6, 15),
        },
        "rev_dates": [],
    },
    "econ": {
        "cf_start_date": datetime.date(1995, 11, 1),
        "cf_end_date": datetime.date(1996, 4, 30),
        "cut_off_date": datetime.date(1996, 4, 30),
        "as_of_date": datetime.date(1995, 11, 1),
        "volume_start_date": datetime.date(1995, 11, 1),
        "first_production_date": datetime.date(1995, 11, 1),
        "first_segment_date": datetime.date(2015, 6, 15),
        "end_history_date": datetime.date(2015, 9, 1),
        "discount_date": datetime.date(1995, 11, 1),
        "original_discount_date": datetime.date(1995, 11, 1),
        "side_phase_end_date": None,
        "start_using_forecast": {
            "oil": datetime.date(2015, 6, 15),
            "gas": datetime.date(2015, 6, 15),
            "water": datetime.date(2015, 6, 15),
        },
        "rev_dates": [],
    },
}

general_option_generator = {
    "basic": {
        "main_options": {
            "aggregation_date": "1995-12-01",
            "currency": "USD",
            "reporting_period": "calendar",
            "fiscal": "",
            "income_tax": "yes",
            "project_type": "primary_recovery",
        },
        "income_tax": {
            "fifteen_depletion": "no",
            "state_income_tax": {
                "rows": [
                    {
                        "multiplier": 10,
                        "offset_to_as_of_date": {
                            "start": 1,
                            "end": 5,
                            "period": 5
                        },
                    },
                    {
                        "multiplier": 7,
                        "offset_to_as_of_date": {
                            "start": 6,
                            "end": 13,
                            "period": 8
                        },
                    },
                    {
                        "multiplier": 6,
                        "offset_to_as_of_date": {
                            "start": 14,
                            "end": 14,
                            "period": 1
                        },
                    },
                ]
            },
            "federal_income_tax": {
                "rows": [
                    {
                        "multiplier": 10,
                        "offset_to_as_of_date": {
                            "start": 1,
                            "end": 5,
                            "period": 5
                        },
                    },
                    {
                        "multiplier": 4,
                        "offset_to_as_of_date": {
                            "start": 6,
                            "end": 13,
                            "period": 8
                        },
                    },
                    {
                        "multiplier": 2,
                        "offset_to_as_of_date": {
                            "start": 14,
                            "end": 27,
                            "period": 14
                        },
                    },
                ]
            },
            "carry_forward": "no",
        },
        "discount_table": {
            "discount_method":
            "yearly",
            "cash_accrual_time":
            "end_month",
            "first_discount":
            10,
            "second_discount":
            15,
            "rows": [
                {
                    "discount_table": 0
                },
                {
                    "discount_table": 2
                },
                {
                    "discount_table": 5
                },
                {
                    "discount_table": 8
                },
                {
                    "discount_table": 10
                },
                {
                    "discount_table": 12
                },
                {
                    "discount_table": 15
                },
                {
                    "discount_table": 20
                },
                {
                    "discount_table": 25
                },
                {
                    "discount_table": 30
                },
                {
                    "discount_table": 40
                },
                {
                    "discount_table": 50
                },
                {
                    "discount_table": 60
                },
                {
                    "discount_table": 70
                },
                {
                    "discount_table": 80
                },
                {
                    "discount_table": 100
                },
            ],
        },
        "boe_conversion": {
            "oil": 1,
            "wet_gas": 6,
            "dry_gas": 6,
            "ngl": 1,
            "drip_condensate": 1,
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
            "ngl_yield": "BBL/MMCF",
        },
    },
    "fifteen": {
        "main_options": {
            "aggregation_date": "1995-12-01",
            "currency": "USD",
            "reporting_period": "calendar",
            "fiscal": "",
            "income_tax": "yes",
            "project_type": "primary_recovery",
        },
        "income_tax": {
            "fifteen_depletion": "yes",
            "state_income_tax": {
                "rows": [
                    {
                        "multiplier": 10,
                        "offset_to_as_of_date": {
                            "start": 1,
                            "end": 5,
                            "period": 5
                        },
                    },
                    {
                        "multiplier": 7,
                        "offset_to_as_of_date": {
                            "start": 6,
                            "end": 13,
                            "period": 8
                        },
                    },
                    {
                        "multiplier": 6,
                        "offset_to_as_of_date": {
                            "start": 14,
                            "end": 14,
                            "period": 1
                        },
                    },
                ]
            },
            "federal_income_tax": {
                "rows": [
                    {
                        "multiplier": 10,
                        "offset_to_as_of_date": {
                            "start": 1,
                            "end": 5,
                            "period": 5
                        },
                    },
                    {
                        "multiplier": 4,
                        "offset_to_as_of_date": {
                            "start": 6,
                            "end": 13,
                            "period": 8
                        },
                    },
                    {
                        "multiplier": 2,
                        "offset_to_as_of_date": {
                            "start": 14,
                            "end": 27,
                            "period": 14
                        },
                    },
                ]
            },
            "carry_forward": "no",
        },
        "discount_table": {
            "discount_method":
            "yearly",
            "cash_accrual_time":
            "end_month",
            "first_discount":
            10,
            "second_discount":
            15,
            "rows": [
                {
                    "discount_table": 0
                },
                {
                    "discount_table": 2
                },
                {
                    "discount_table": 5
                },
                {
                    "discount_table": 8
                },
                {
                    "discount_table": 10
                },
                {
                    "discount_table": 12
                },
                {
                    "discount_table": 15
                },
                {
                    "discount_table": 20
                },
                {
                    "discount_table": 25
                },
                {
                    "discount_table": 30
                },
                {
                    "discount_table": 40
                },
                {
                    "discount_table": 50
                },
                {
                    "discount_table": 60
                },
                {
                    "discount_table": 70
                },
                {
                    "discount_table": 80
                },
                {
                    "discount_table": 100
                },
            ],
        },
        "boe_conversion": {
            "oil": 1,
            "wet_gas": 6,
            "dry_gas": 6,
            "ngl": 1,
            "drip_condensate": 1,
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
            "ngl_yield": "BBL/MMCF",
        },
    },
    "carry_forward": {
        "main_options": {
            "aggregation_date": "1995-12-01",
            "currency": "USD",
            "reporting_period": "calendar",
            "fiscal": "",
            "income_tax": "yes",
            "project_type": "primary_recovery",
        },
        "income_tax": {
            "fifteen_depletion": "no",
            "state_income_tax": {
                "rows": [
                    {
                        "multiplier": 10,
                        "offset_to_as_of_date": {
                            "start": 1,
                            "end": 5,
                            "period": 5
                        },
                    },
                    {
                        "multiplier": 7,
                        "offset_to_as_of_date": {
                            "start": 6,
                            "end": 13,
                            "period": 8
                        },
                    },
                    {
                        "multiplier": 6,
                        "offset_to_as_of_date": {
                            "start": 14,
                            "end": 14,
                            "period": 1
                        },
                    },
                ]
            },
            "federal_income_tax": {
                "rows": [
                    {
                        "multiplier": 10,
                        "offset_to_as_of_date": {
                            "start": 1,
                            "end": 5,
                            "period": 5
                        },
                    },
                    {
                        "multiplier": 4,
                        "offset_to_as_of_date": {
                            "start": 6,
                            "end": 13,
                            "period": 8
                        },
                    },
                    {
                        "multiplier": 2,
                        "offset_to_as_of_date": {
                            "start": 14,
                            "end": 27,
                            "period": 14
                        },
                    },
                ]
            },
            "carry_forward": "yes",
        },
        "discount_table": {
            "discount_method":
            "yearly",
            "cash_accrual_time":
            "end_month",
            "first_discount":
            10,
            "second_discount":
            15,
            "rows": [
                {
                    "discount_table": 0
                },
                {
                    "discount_table": 2
                },
                {
                    "discount_table": 5
                },
                {
                    "discount_table": 8
                },
                {
                    "discount_table": 10
                },
                {
                    "discount_table": 12
                },
                {
                    "discount_table": 15
                },
                {
                    "discount_table": 20
                },
                {
                    "discount_table": 25
                },
                {
                    "discount_table": 30
                },
                {
                    "discount_table": 40
                },
                {
                    "discount_table": 50
                },
                {
                    "discount_table": 60
                },
                {
                    "discount_table": 70
                },
                {
                    "discount_table": 80
                },
                {
                    "discount_table": 100
                },
            ],
        },
        "boe_conversion": {
            "oil": 1,
            "wet_gas": 6,
            "dry_gas": 6,
            "ngl": 1,
            "drip_condensate": 1,
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
            "ngl_yield": "BBL/MMCF",
        },
    },
    "fifteen_carry_forward": {
        "main_options": {
            "aggregation_date": "1995-12-01",
            "currency": "USD",
            "reporting_period": "calendar",
            "fiscal": "",
            "income_tax": "yes",
            "project_type": "primary_recovery",
        },
        "income_tax": {
            "fifteen_depletion": "yes",
            "state_income_tax": {
                "rows": [
                    {
                        "multiplier": 10,
                        "offset_to_as_of_date": {
                            "start": 1,
                            "end": 5,
                            "period": 5
                        },
                    },
                    {
                        "multiplier": 7,
                        "offset_to_as_of_date": {
                            "start": 6,
                            "end": 13,
                            "period": 8
                        },
                    },
                    {
                        "multiplier": 6,
                        "offset_to_as_of_date": {
                            "start": 14,
                            "end": 14,
                            "period": 1
                        },
                    },
                ]
            },
            "federal_income_tax": {
                "rows": [
                    {
                        "multiplier": 10,
                        "offset_to_as_of_date": {
                            "start": 1,
                            "end": 5,
                            "period": 5
                        },
                    },
                    {
                        "multiplier": 4,
                        "offset_to_as_of_date": {
                            "start": 6,
                            "end": 13,
                            "period": 8
                        },
                    },
                    {
                        "multiplier": 2,
                        "offset_to_as_of_date": {
                            "start": 14,
                            "end": 27,
                            "period": 14
                        },
                    },
                ]
            },
            "carry_forward": "yes",
        },
        "discount_table": {
            "discount_method":
            "yearly",
            "cash_accrual_time":
            "end_month",
            "first_discount":
            10,
            "second_discount":
            15,
            "rows": [
                {
                    "discount_table": 0
                },
                {
                    "discount_table": 2
                },
                {
                    "discount_table": 5
                },
                {
                    "discount_table": 8
                },
                {
                    "discount_table": 10
                },
                {
                    "discount_table": 12
                },
                {
                    "discount_table": 15
                },
                {
                    "discount_table": 20
                },
                {
                    "discount_table": 25
                },
                {
                    "discount_table": 30
                },
                {
                    "discount_table": 40
                },
                {
                    "discount_table": 50
                },
                {
                    "discount_table": 60
                },
                {
                    "discount_table": 70
                },
                {
                    "discount_table": 80
                },
                {
                    "discount_table": 100
                },
            ],
        },
        "boe_conversion": {
            "oil": 1,
            "wet_gas": 6,
            "dry_gas": 6,
            "ngl": 1,
            "drip_condensate": 1,
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
            "ngl_yield": "BBL/MMCF",
        },
    },
}

all_capex_generator = {
    "unecon": [],
    "no_dda": [{
        "category": "drilling",
        "description": "",
        "tangible": 10000,
        "intangible": 10000,
        "offset_to_fpd": 0,
        "capex_expense": "capex",
        "after_econ_limit": "yes",
        "calculation": "gross",
        "escalation_model": {
            "escalation_model": {
                "escalation_frequency": "monthly",
                "calculation_method": "simple",
                "rows": [{
                    "dollar_per_year": 2,
                    "entire_well_life": "Flat"
                }],
            }
        },
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
        "seed": 1,
        "date": datetime.date(1995, 11, 1),
        "offset_date": datetime.date(1995, 11, 1),
        "time": 0,
        "escalation_param": {
            "type": "add",
            "value": 0.0
        },
    }],
    "depreciation": [{
        "category": "drilling",
        "description": "",
        "tangible": 10000,
        "intangible": 10000,
        "offset_to_fpd": 0,
        "capex_expense": "capex",
        "after_econ_limit": "yes",
        "calculation": "gross",
        "escalation_model": {
            "escalation_model": {
                "escalation_frequency": "monthly",
                "calculation_method": "simple",
                "rows": [{
                    "dollar_per_year": 2,
                    "entire_well_life": "Flat"
                }],
            }
        },
        "escalation_start": {
            "apply_to_criteria": 0
        },
        "depreciation_model": {
            "depreciation_model": {
                "depreciation_or_depletion": "depreciation",
                "prebuilt": "acr_10",
                "tax_credit": 0,
                "tangible_immediate_depletion": 0,
                "intangible_immediate_depletion": 0,
                "tangible_depletion_model": "unit_of_production_major",
                "intangible_depletion_model": "unit_of_production_major",
                "depreciation": {
                    "rows": [
                        {
                            "year": 1,
                            "tan_factor": 10,
                            "tan_cumulative": 0,
                            "intan_factor": 10,
                            "intan_cumulative": 0,
                        },
                        {
                            "year": "",
                            "tan_factor": 18,
                            "tan_cumulative": "",
                            "intan_factor": 18,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 14.4,
                            "tan_cumulative": "",
                            "intan_factor": 14.4,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 11.52,
                            "tan_cumulative": "",
                            "intan_factor": 11.52,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 9.22,
                            "tan_cumulative": "",
                            "intan_factor": 9.22,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 7.37,
                            "tan_cumulative": "",
                            "intan_factor": 7.37,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.55,
                            "tan_cumulative": "",
                            "intan_factor": 6.55,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.55,
                            "tan_cumulative": "",
                            "intan_factor": 6.55,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.56,
                            "tan_cumulative": "",
                            "intan_factor": 6.56,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.55,
                            "tan_cumulative": "",
                            "intan_factor": 6.55,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 3.28,
                            "tan_cumulative": "",
                            "intan_factor": 3.28,
                            "intan_cumulative": "",
                        },
                    ]
                },
            }
        },
        "deal_terms": 1,
        "distribution_type": "na",
        "mean": 0,
        "standard_deviation": 0,
        "lower_bound": 0,
        "upper_bound": 0,
        "mode": 0,
        "seed": 1,
        "date": datetime.date(1995, 11, 1),
        "offset_date": datetime.date(1995, 11, 1),
        "time": 0,
        "escalation_param": {
            "type": "add",
            "value": 0.0
        },
    }],
    "depreciation_with_tax_credit": [{
        "category": "drilling",
        "description": "",
        "tangible": 10000,
        "intangible": 10000,
        "offset_to_fpd": 0,
        "capex_expense": "capex",
        "after_econ_limit": "yes",
        "calculation": "gross",
        "escalation_model": {
            "escalation_model": {
                "escalation_frequency": "monthly",
                "calculation_method": "simple",
                "rows": [{
                    "dollar_per_year": 2,
                    "entire_well_life": "Flat"
                }],
            }
        },
        "escalation_start": {
            "apply_to_criteria": 0
        },
        "depreciation_model": {
            "depreciation_model": {
                "depreciation_or_depletion": "depreciation",
                "prebuilt": "acr_10",
                "tax_credit": 20,
                "tangible_immediate_depletion": 0,
                "intangible_immediate_depletion": 0,
                "tangible_depletion_model": "unit_of_production_major",
                "intangible_depletion_model": "unit_of_production_major",
                "depreciation": {
                    "rows": [
                        {
                            "year": 1,
                            "tan_factor": 10,
                            "tan_cumulative": 0,
                            "intan_factor": 10,
                            "intan_cumulative": 0,
                        },
                        {
                            "year": "",
                            "tan_factor": 18,
                            "tan_cumulative": "",
                            "intan_factor": 18,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 14.4,
                            "tan_cumulative": "",
                            "intan_factor": 14.4,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 11.52,
                            "tan_cumulative": "",
                            "intan_factor": 11.52,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 9.22,
                            "tan_cumulative": "",
                            "intan_factor": 9.22,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 7.37,
                            "tan_cumulative": "",
                            "intan_factor": 7.37,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.55,
                            "tan_cumulative": "",
                            "intan_factor": 6.55,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.55,
                            "tan_cumulative": "",
                            "intan_factor": 6.55,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.56,
                            "tan_cumulative": "",
                            "intan_factor": 6.56,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.55,
                            "tan_cumulative": "",
                            "intan_factor": 6.55,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 3.28,
                            "tan_cumulative": "",
                            "intan_factor": 3.28,
                            "intan_cumulative": "",
                        },
                    ]
                },
            }
        },
        "deal_terms": 1,
        "distribution_type": "na",
        "mean": 0,
        "standard_deviation": 0,
        "lower_bound": 0,
        "upper_bound": 0,
        "mode": 0,
        "seed": 1,
        "date": datetime.date(1995, 11, 1),
        "offset_date": datetime.date(1995, 11, 1),
        "time": 0,
        "escalation_param": {
            "type": "add",
            "value": 0.0
        },
    }],
    "depletion_with_immediate_depletion": [{
        "category": "drilling",
        "description": "",
        "tangible": 10000,
        "intangible": 10000,
        "offset_to_fpd": 0,
        "capex_expense": "capex",
        "after_econ_limit": "yes",
        "calculation": "gross",
        "escalation_model": {
            "escalation_model": {
                "escalation_frequency": "monthly",
                "calculation_method": "simple",
                "rows": [{
                    "dollar_per_year": 2,
                    "entire_well_life": "Flat"
                }],
            }
        },
        "escalation_start": {
            "apply_to_criteria": 0
        },
        "depreciation_model": {
            "depreciation_model": {
                "depreciation_or_depletion": "depletion",
                "prebuilt": "acr_10",
                "tax_credit": 0,
                "tangible_immediate_depletion": 10,
                "intangible_immediate_depletion": 15,
                "tangible_depletion_model": "unit_of_production_major",
                "intangible_depletion_model": "unit_of_production_major",
                "depreciation": {
                    "rows": [
                        {
                            "year": 1,
                            "tan_factor": 10,
                            "tan_cumulative": 0,
                            "intan_factor": 10,
                            "intan_cumulative": 0,
                        },
                        {
                            "year": "",
                            "tan_factor": 18,
                            "tan_cumulative": "",
                            "intan_factor": 18,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 14.4,
                            "tan_cumulative": "",
                            "intan_factor": 14.4,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 11.52,
                            "tan_cumulative": "",
                            "intan_factor": 11.52,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 9.22,
                            "tan_cumulative": "",
                            "intan_factor": 9.22,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 7.37,
                            "tan_cumulative": "",
                            "intan_factor": 7.37,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.55,
                            "tan_cumulative": "",
                            "intan_factor": 6.55,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.55,
                            "tan_cumulative": "",
                            "intan_factor": 6.55,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.56,
                            "tan_cumulative": "",
                            "intan_factor": 6.56,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.55,
                            "tan_cumulative": "",
                            "intan_factor": 6.55,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 3.28,
                            "tan_cumulative": "",
                            "intan_factor": 3.28,
                            "intan_cumulative": "",
                        },
                    ]
                },
            }
        },
        "deal_terms": 1,
        "distribution_type": "na",
        "mean": 0,
        "standard_deviation": 0,
        "lower_bound": 0,
        "upper_bound": 0,
        "mode": 0,
        "seed": 1,
        "date": datetime.date(1995, 11, 1),
        "offset_date": datetime.date(1995, 11, 1),
        "time": 0,
        "escalation_param": {
            "type": "add",
            "value": 0.0
        },
    }],
    "UOP_major": [{
        "category": "drilling",
        "description": "",
        "tangible": 10000,
        "intangible": 10000,
        "offset_to_fpd": 0,
        "capex_expense": "capex",
        "after_econ_limit": "yes",
        "calculation": "gross",
        "escalation_model": {
            "escalation_model": {
                "escalation_frequency": "monthly",
                "calculation_method": "simple",
                "rows": [{
                    "dollar_per_year": 2,
                    "entire_well_life": "Flat"
                }],
            }
        },
        "escalation_start": {
            "apply_to_criteria": 0
        },
        "depreciation_model": {
            "depreciation_model": {
                "depreciation_or_depletion": "depletion",
                "prebuilt": "custom",
                "tax_credit": 0,
                "tangible_immediate_depletion": 0,
                "intangible_immediate_depletion": 0,
                "tangible_depletion_model": "unit_of_production_major",
                "intangible_depletion_model": "unit_of_production_major",
                "depreciation": {
                    "rows": [{
                        "year": 1,
                        "tan_factor": 0,
                        "tan_cumulative": 0,
                        "intan_factor": 0,
                        "intan_cumulative": 0,
                    }]
                },
            }
        },
        "deal_terms": 1,
        "distribution_type": "na",
        "mean": 0,
        "standard_deviation": 0,
        "lower_bound": 0,
        "upper_bound": 0,
        "mode": 0,
        "seed": 1,
        "date": datetime.date(1995, 11, 1),
        "offset_date": datetime.date(1995, 11, 1),
        "time": 0,
        "escalation_param": {
            "type": "add",
            "value": 0.0
        },
    }],
    "UOP_BOE": [{
        "category": "drilling",
        "description": "",
        "tangible": 10000,
        "intangible": 10000,
        "offset_to_fpd": 0,
        "capex_expense": "capex",
        "after_econ_limit": "yes",
        "calculation": "gross",
        "escalation_model": {
            "escalation_model": {
                "escalation_frequency": "monthly",
                "calculation_method": "simple",
                "rows": [{
                    "dollar_per_year": 2,
                    "entire_well_life": "Flat"
                }],
            }
        },
        "escalation_start": {
            "apply_to_criteria": 0
        },
        "depreciation_model": {
            "depreciation_model": {
                "depreciation_or_depletion": "depletion",
                "prebuilt": "custom",
                "tax_credit": 0,
                "tangible_immediate_depletion": 0,
                "intangible_immediate_depletion": 0,
                "tangible_depletion_model": "unit_of_production_BOE",
                "intangible_depletion_model": "unit_of_production_BOE",
                "depreciation": {
                    "rows": [{
                        "year": 1,
                        "tan_factor": 0,
                        "tan_cumulative": 0,
                        "intan_factor": 0,
                        "intan_cumulative": 0,
                    }]
                },
            }
        },
        "deal_terms": 1,
        "distribution_type": "na",
        "mean": 0,
        "standard_deviation": 0,
        "lower_bound": 0,
        "upper_bound": 0,
        "mode": 0,
        "seed": 1,
        "date": datetime.date(1995, 11, 1),
        "offset_date": datetime.date(1995, 11, 1),
        "time": 0,
        "escalation_param": {
            "type": "add",
            "value": 0.0
        },
    }],
    "deduct_ecl": [{
        "category": "drilling",
        "description": "",
        "tangible": 10000,
        "intangible": 10000,
        "offset_to_fpd": 0,
        "capex_expense": "capex",
        "after_econ_limit": "yes",
        "calculation": "gross",
        "escalation_model": {
            "escalation_model": {
                "escalation_frequency": "monthly",
                "calculation_method": "simple",
                "rows": [{
                    "dollar_per_year": 2,
                    "entire_well_life": "Flat"
                }],
            }
        },
        "escalation_start": {
            "apply_to_criteria": 0
        },
        "depreciation_model": {
            "depreciation_model": {
                "depreciation_or_depletion": "depletion",
                "prebuilt": "custom",
                "tax_credit": 0,
                "tangible_immediate_depletion": 0,
                "intangible_immediate_depletion": 0,
                "tangible_depletion_model": "ecl",
                "intangible_depletion_model": "ecl",
                "depreciation": {
                    "rows": [{
                        "year": 1,
                        "tan_factor": 0,
                        "tan_cumulative": 0,
                        "intan_factor": 0,
                        "intan_cumulative": 0,
                    }]
                },
            }
        },
        "deal_terms": 1,
        "distribution_type": "na",
        "mean": 0,
        "standard_deviation": 0,
        "lower_bound": 0,
        "upper_bound": 0,
        "mode": 0,
        "seed": 1,
        "date": datetime.date(1995, 11, 1),
        "offset_date": datetime.date(1995, 11, 1),
        "time": 0,
        "escalation_param": {
            "type": "add",
            "value": 0.0
        },
    }],
    "expense_fpd": [{
        "category": "drilling",
        "description": "",
        "tangible": 10000,
        "intangible": 10000,
        "offset_to_fpd": 0,
        "capex_expense": "capex",
        "after_econ_limit": "yes",
        "calculation": "gross",
        "escalation_model": {
            "escalation_model": {
                "escalation_frequency": "monthly",
                "calculation_method": "simple",
                "rows": [{
                    "dollar_per_year": 2,
                    "entire_well_life": "Flat"
                }],
            }
        },
        "escalation_start": {
            "apply_to_criteria": 0
        },
        "depreciation_model": {
            "depreciation_model": {
                "depreciation_or_depletion": "depletion",
                "prebuilt": "custom",
                "tax_credit": 0,
                "tangible_immediate_depletion": 0,
                "intangible_immediate_depletion": 0,
                "tangible_depletion_model": "fpd",
                "intangible_depletion_model": "fpd",
                "depreciation": {
                    "rows": [{
                        "year": 1,
                        "tan_factor": 0,
                        "tan_cumulative": 0,
                        "intan_factor": 0,
                        "intan_cumulative": 0,
                    }]
                },
            }
        },
        "deal_terms": 1,
        "distribution_type": "na",
        "mean": 0,
        "standard_deviation": 0,
        "lower_bound": 0,
        "upper_bound": 0,
        "mode": 0,
        "seed": 1,
        "date": datetime.date(1995, 11, 1),
        "offset_date": datetime.date(1995, 11, 1),
        "time": 0,
        "escalation_param": {
            "type": "add",
            "value": 0.0
        },
    }],
    "no_depletion": [{
        "category": "drilling",
        "description": "",
        "tangible": 10000,
        "intangible": 10000,
        "offset_to_fpd": 0,
        "capex_expense": "capex",
        "after_econ_limit": "yes",
        "calculation": "gross",
        "escalation_model": {
            "escalation_model": {
                "escalation_frequency": "monthly",
                "calculation_method": "simple",
                "rows": [{
                    "dollar_per_year": 2,
                    "entire_well_life": "Flat"
                }],
            }
        },
        "escalation_start": {
            "apply_to_criteria": 0
        },
        "depreciation_model": {
            "depreciation_model": {
                "depreciation_or_depletion": "depletion",
                "prebuilt": "custom",
                "tax_credit": 0,
                "tangible_immediate_depletion": 0,
                "intangible_immediate_depletion": 0,
                "tangible_depletion_model": "never",
                "intangible_depletion_model": "never",
                "depreciation": {
                    "rows": [{
                        "year": 1,
                        "tan_factor": 0,
                        "tan_cumulative": 0,
                        "intan_factor": 0,
                        "intan_cumulative": 0,
                    }]
                },
            }
        },
        "deal_terms": 1,
        "distribution_type": "na",
        "mean": 0,
        "standard_deviation": 0,
        "lower_bound": 0,
        "upper_bound": 0,
        "mode": 0,
        "seed": 1,
        "date": datetime.date(1995, 11, 1),
        "offset_date": datetime.date(1995, 11, 1),
        "time": 0,
        "escalation_param": {
            "type": "add",
            "value": 0.0
        },
    }],
    "depreciation_and_depletion": [
        {
            "category": "drilling",
            "description": "",
            "tangible": 10000,
            "intangible": 10000,
            "offset_to_fpd": 0,
            "capex_expense": "capex",
            "after_econ_limit": "yes",
            "calculation": "gross",
            "escalation_model": {
                "escalation_model": {
                    "escalation_frequency": "monthly",
                    "calculation_method": "simple",
                    "rows": [{
                        "dollar_per_year": 2,
                        "entire_well_life": "Flat"
                    }],
                }
            },
            "escalation_start": {
                "apply_to_criteria": 0
            },
            "depreciation_model": {
                "depreciation_model": {
                    "depreciation_or_depletion": "depletion",
                    "prebuilt": "custom",
                    "tax_credit": 0,
                    "tangible_immediate_depletion": 0,
                    "intangible_immediate_depletion": 0,
                    "tangible_depletion_model": "unit_of_production_major",
                    "intangible_depletion_model": "unit_of_production_BOE",
                    "depreciation": {
                        "rows": [{
                            "year": 1,
                            "tan_factor": 0,
                            "tan_cumulative": 0,
                            "intan_factor": 0,
                            "intan_cumulative": 0,
                        }]
                    },
                }
            },
            "deal_terms": 1,
            "distribution_type": "na",
            "mean": 0,
            "standard_deviation": 0,
            "lower_bound": 0,
            "upper_bound": 0,
            "mode": 0,
            "seed": 1,
            "date": datetime.date(1995, 11, 1),
            "offset_date": datetime.date(1995, 11, 1),
            "time": 0,
            "escalation_param": {
                "type": "add",
                "value": 0.0
            },
        },
        {
            "category": "other_investment",
            "description": "",
            "tangible": 10000,
            "intangible": 10000,
            "offset_to_fpd": 0,
            "capex_expense": "capex",
            "after_econ_limit": "no",
            "calculation": "gross",
            "escalation_model": "none",
            "escalation_start": {
                "apply_to_criteria": 0
            },
            "depreciation_model": {
                "depreciation_model": {
                    "depreciation_or_depletion": "depreciation",
                    "prebuilt": "acr_10",
                    "tax_credit": 0,
                    "tangible_depletion_model": "unit_of_production_major",
                    "intangible_depletion_model": "unit_of_production_major",
                    "depreciation": {
                        "rows": [
                            {
                                "year": 1,
                                "tan_factor": 10,
                                "tan_cumulative": 0,
                                "intan_factor": 10,
                                "intan_cumulative": 0,
                            },
                            {
                                "year": "",
                                "tan_factor": 18,
                                "tan_cumulative": "",
                                "intan_factor": 18,
                                "intan_cumulative": "",
                            },
                            {
                                "year": "",
                                "tan_factor": 14.4,
                                "tan_cumulative": "",
                                "intan_factor": 14.4,
                                "intan_cumulative": "",
                            },
                            {
                                "year": "",
                                "tan_factor": 11.52,
                                "tan_cumulative": "",
                                "intan_factor": 11.52,
                                "intan_cumulative": "",
                            },
                            {
                                "year": "",
                                "tan_factor": 9.22,
                                "tan_cumulative": "",
                                "intan_factor": 9.22,
                                "intan_cumulative": "",
                            },
                            {
                                "year": "",
                                "tan_factor": 7.37,
                                "tan_cumulative": "",
                                "intan_factor": 7.37,
                                "intan_cumulative": "",
                            },
                            {
                                "year": "",
                                "tan_factor": 6.55,
                                "tan_cumulative": "",
                                "intan_factor": 6.55,
                                "intan_cumulative": "",
                            },
                            {
                                "year": "",
                                "tan_factor": 6.55,
                                "tan_cumulative": "",
                                "intan_factor": 6.55,
                                "intan_cumulative": "",
                            },
                            {
                                "year": "",
                                "tan_factor": 6.56,
                                "tan_cumulative": "",
                                "intan_factor": 6.56,
                                "intan_cumulative": "",
                            },
                            {
                                "year": "",
                                "tan_factor": 6.55,
                                "tan_cumulative": "",
                                "intan_factor": 6.55,
                                "intan_cumulative": "",
                            },
                            {
                                "year": "",
                                "tan_factor": 3.28,
                                "tan_cumulative": "",
                                "intan_factor": 3.28,
                                "intan_cumulative": "",
                            },
                        ]
                    },
                }
            },
            "deal_terms": 1,
            "distribution_type": "na",
            "mean": 0,
            "standard_deviation": 0,
            "lower_bound": 0,
            "upper_bound": 0,
            "mode": 0,
            "seed": 1,
            "date": datetime.date(1995, 11, 1),
            "offset_date": datetime.date(1995, 11, 1),
            "time": 0,
            "escalation_param": None,
        },
    ],
    "bonus_depreciation": [{
        "category": "drilling",
        "description": "",
        "tangible": 10000,
        "intangible": 10000,
        "offset_to_fpd": 0,
        "capex_expense": "capex",
        "after_econ_limit": "yes",
        "calculation": "gross",
        "escalation_model": {
            "escalation_model": {
                "escalation_frequency": "monthly",
                "calculation_method": "simple",
                "rows": [{
                    "dollar_per_year": 2,
                    "entire_well_life": "Flat"
                }],
            }
        },
        "escalation_start": {
            "apply_to_criteria": 0
        },
        "depreciation_model": {
            "depreciation_model": {
                "depreciation_or_depletion": "depreciation",
                "prebuilt": "acr_10",
                "tax_credit": 0,
                "tcja_bonus": "no",
                "bonus_depreciation": {
                    "rows": [{
                        'tangible_bonus_depreciation': 50,
                        'intangible_bonus_depreciation': 50
                    }]
                },
                "tangible_immediate_depletion": 0,
                "intangible_immediate_depletion": 0,
                "tangible_depletion_model": "unit_of_production_major",
                "intangible_depletion_model": "unit_of_production_major",
                "depreciation": {
                    "rows": [
                        {
                            "year": 1,
                            "tan_factor": 10,
                            "tan_cumulative": 0,
                            "intan_factor": 10,
                            "intan_cumulative": 0,
                        },
                        {
                            "year": "",
                            "tan_factor": 18,
                            "tan_cumulative": "",
                            "intan_factor": 18,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 14.4,
                            "tan_cumulative": "",
                            "intan_factor": 14.4,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 11.52,
                            "tan_cumulative": "",
                            "intan_factor": 11.52,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 9.22,
                            "tan_cumulative": "",
                            "intan_factor": 9.22,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 7.37,
                            "tan_cumulative": "",
                            "intan_factor": 7.37,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.55,
                            "tan_cumulative": "",
                            "intan_factor": 6.55,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.55,
                            "tan_cumulative": "",
                            "intan_factor": 6.55,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.56,
                            "tan_cumulative": "",
                            "intan_factor": 6.56,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 6.55,
                            "tan_cumulative": "",
                            "intan_factor": 6.55,
                            "intan_cumulative": "",
                        },
                        {
                            "year": "",
                            "tan_factor": 3.28,
                            "tan_cumulative": "",
                            "intan_factor": 3.28,
                            "intan_cumulative": "",
                        },
                    ]
                },
            }
        },
        "deal_terms": 1,
        "distribution_type": "na",
        "mean": 0,
        "standard_deviation": 0,
        "lower_bound": 0,
        "upper_bound": 0,
        "mode": 0,
        "seed": 1,
        "date": datetime.date(1995, 11, 1),
        "offset_date": datetime.date(1995, 11, 1),
        "time": 0,
        "escalation_param": {
            "type": "add",
            "value": 0.0
        },
    }],
}

bfit_cf_dict_generator = {
    "unecon": {
        "time": np.array([0]),
        "total_net_revenue": np.array([0.0]),
        "total_gross_revenue": np.array([0.0]),
        "expense": np.array([0.0]),
        "production_tax": np.array([0.0]),
        "capex": np.array([0.0]),
        "net_profit": np.array([0.0]),
        "net_income": np.array([0.0]),
        "bfit_cf": np.array([0.0]),
    },
    "econ": {
        "time":
        np.array([0, 1, 2, 3, 4, 5]),
        "total_net_revenue":
        np.array([954716.0, 376828.0, 206235.2, 177696.0, 188448.0, 153170.66666667]),
        "total_gross_revenue":
        np.array([1193395.0, 471035.0, 257794.0, 222120.0, 235560.0, 191463.33333333]),
        "expense":
        np.array([2810.25, 1073.5, 570.25, 521.0, 586.0, 417.5]),
        "production_tax":
        np.array([
            69482.3816,
            27745.83904,
            15341.31168,
            12934.81536,
            13394.9712,
            11433.16221333,
        ]),
        "capex":
        np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "net_profit":
        np.array([
            -8824.233684,
            -3480.0866096,
            -1903.2363832,
            -1642.4018464,
            -1744.670288,
            -1413.20004453,
        ]),
        "net_income":
        np.array([
            873599.134716,
            344528.5743504,
            188420.4019368,
            162597.7827936,
            172722.358512,
            139906.8044088,
        ]),
        "bfit_cf":
        np.array([
            873599.134716,
            344528.5743504,
            188420.4019368,
            162597.7827936,
            172722.358512,
            139906.8044088,
        ]),
    },
}

ownership_dict_by_phase_generator = {
    "unecon": {
        "oil": {
            "wi": np.array([0.9]),
            "nri": np.array([0.8]),
            "lease_nri": np.array([0.8]),
            "one_minus_wi": np.array([0.1]),
            "one_minus_nri": np.array([0.2]),
            "one_minus_lease_nri": np.array([0.2]),
            "wi_minus_one": np.array([-0.1]),
            "nri_minus_one": np.array([-0.2]),
            "lease_nri_minus_one": np.array([-0.2]),
            "100_pct_wi": np.array([1]),
        },
        "gas": {
            "wi": np.array([0.9]),
            "nri": np.array([0.8]),
            "lease_nri": np.array([0.8]),
            "one_minus_wi": np.array([0.1]),
            "one_minus_nri": np.array([0.2]),
            "one_minus_lease_nri": np.array([0.2]),
            "wi_minus_one": np.array([-0.1]),
            "nri_minus_one": np.array([-0.2]),
            "lease_nri_minus_one": np.array([-0.2]),
            "100_pct_wi": np.array([1]),
        },
        "ngl": {
            "wi": np.array([0.9]),
            "nri": np.array([0.8]),
            "lease_nri": np.array([0.8]),
            "one_minus_wi": np.array([0.1]),
            "one_minus_nri": np.array([0.2]),
            "one_minus_lease_nri": np.array([0.2]),
            "wi_minus_one": np.array([-0.1]),
            "nri_minus_one": np.array([-0.2]),
            "lease_nri_minus_one": np.array([-0.2]),
            "100_pct_wi": np.array([1]),
        },
        "drip_condensate": {
            "wi": np.array([0.9]),
            "nri": np.array([0.8]),
            "lease_nri": np.array([0.8]),
            "one_minus_wi": np.array([0.1]),
            "one_minus_nri": np.array([0.2]),
            "one_minus_lease_nri": np.array([0.2]),
            "wi_minus_one": np.array([-0.1]),
            "nri_minus_one": np.array([-0.2]),
            "lease_nri_minus_one": np.array([-0.2]),
            "100_pct_wi": np.array([1]),
        },
        "original": {
            "wi": np.array([0.9]),
            "nri": np.array([0.8]),
            "lease_nri": np.array([0.8]),
            "one_minus_wi": np.array([0.1]),
            "one_minus_nri": np.array([0.2]),
            "one_minus_lease_nri": np.array([0.2]),
            "wi_minus_one": np.array([-0.1]),
            "nri_minus_one": np.array([-0.2]),
            "lease_nri_minus_one": np.array([-0.2]),
            "100_pct_wi": np.array([1]),
        },
    },
    "econ": {
        "oil": {
            "wi": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
            "nri": np.array([0.8, 0.8, 0.8, 0.8, 0.8, 0.8]),
            "lease_nri": np.array([0.8, 0.8, 0.8, 0.8, 0.8, 0.8]),
            "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "one_minus_nri": np.array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
            "one_minus_lease_nri": np.array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
            "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "nri_minus_one": np.array([-0.2, -0.2, -0.2, -0.2, -0.2, -0.2]),
            "lease_nri_minus_one": np.array([-0.2, -0.2, -0.2, -0.2, -0.2, -0.2]),
            "100_pct_wi": np.array([1, 1, 1, 1, 1, 1]),
        },
        "gas": {
            "wi": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
            "nri": np.array([0.8, 0.8, 0.8, 0.8, 0.8, 0.8]),
            "lease_nri": np.array([0.8, 0.8, 0.8, 0.8, 0.8, 0.8]),
            "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "one_minus_nri": np.array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
            "one_minus_lease_nri": np.array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
            "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "nri_minus_one": np.array([-0.2, -0.2, -0.2, -0.2, -0.2, -0.2]),
            "lease_nri_minus_one": np.array([-0.2, -0.2, -0.2, -0.2, -0.2, -0.2]),
            "100_pct_wi": np.array([1, 1, 1, 1, 1, 1]),
        },
        "ngl": {
            "wi": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
            "nri": np.array([0.8, 0.8, 0.8, 0.8, 0.8, 0.8]),
            "lease_nri": np.array([0.8, 0.8, 0.8, 0.8, 0.8, 0.8]),
            "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "one_minus_nri": np.array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
            "one_minus_lease_nri": np.array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
            "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "nri_minus_one": np.array([-0.2, -0.2, -0.2, -0.2, -0.2, -0.2]),
            "lease_nri_minus_one": np.array([-0.2, -0.2, -0.2, -0.2, -0.2, -0.2]),
            "100_pct_wi": np.array([1, 1, 1, 1, 1, 1]),
        },
        "drip_condensate": {
            "wi": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
            "nri": np.array([0.8, 0.8, 0.8, 0.8, 0.8, 0.8]),
            "lease_nri": np.array([0.8, 0.8, 0.8, 0.8, 0.8, 0.8]),
            "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "one_minus_nri": np.array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
            "one_minus_lease_nri": np.array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
            "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "nri_minus_one": np.array([-0.2, -0.2, -0.2, -0.2, -0.2, -0.2]),
            "lease_nri_minus_one": np.array([-0.2, -0.2, -0.2, -0.2, -0.2, -0.2]),
            "100_pct_wi": np.array([1, 1, 1, 1, 1, 1]),
        },
        "original": {
            "wi": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
            "nri": np.array([0.8, 0.8, 0.8, 0.8, 0.8, 0.8]),
            "lease_nri": np.array([0.8, 0.8, 0.8, 0.8, 0.8, 0.8]),
            "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "one_minus_nri": np.array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
            "one_minus_lease_nri": np.array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
            "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "nri_minus_one": np.array([-0.2, -0.2, -0.2, -0.2, -0.2, -0.2]),
            "lease_nri_minus_one": np.array([-0.2, -0.2, -0.2, -0.2, -0.2, -0.2]),
            "100_pct_wi": np.array([1, 1, 1, 1, 1, 1]),
        },
    },
}

ownership_volume_dict_generator = {
    "unecon": {
        "well_head": {
            "time": np.array([0]),
            "oil": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0]),
            },
            "gas": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0]),
            },
            "water": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0]),
            },
        },
        "unshrunk": {
            "time": np.array([0]),
            "oil": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0.0]),
            },
            "gas": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0.0]),
            },
            "water": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0]),
            },
        },
        "sales": {
            "time": np.array([0]),
            "oil": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0.0]),
            },
            "gas": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0.0]),
            },
            "water": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0]),
            },
            "ngl": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0.0]),
            },
            "drip_condensate": {
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([-0.0]),
                "nri_minus_one": np.array([-0.0]),
                "lease_nri_minus_one": np.array([-0.0]),
                "100_pct_wi": np.array([0.0]),
            },
        },
        "boe": {
            "well_head_boe": {
                "total": np.array([0.0]),
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([0.0]),
                "nri_minus_one": np.array([0.0]),
                "lease_nri_minus_one": np.array([0.0]),
                "100_pct_wi": np.array([0.0]),
            },
            "unshrunk_boe": {
                "total": np.array([0.0]),
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([0.0]),
                "nri_minus_one": np.array([0.0]),
                "lease_nri_minus_one": np.array([0.0]),
                "100_pct_wi": np.array([0.0]),
            },
            "sales_boe": {
                "total": np.array([0.0]),
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([0.0]),
                "nri_minus_one": np.array([0.0]),
                "lease_nri_minus_one": np.array([0.0]),
                "100_pct_wi": np.array([0.0]),
            },
        },
        "mcfe": {
            "well_head_mcfe": {
                "total": np.array([0.0]),
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([0.0]),
                "nri_minus_one": np.array([0.0]),
                "lease_nri_minus_one": np.array([0.0]),
                "100_pct_wi": np.array([0.0]),
            },
            "unshrunk_mcfe": {
                "total": np.array([0.0]),
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([0.0]),
                "nri_minus_one": np.array([0.0]),
                "lease_nri_minus_one": np.array([0.0]),
                "100_pct_wi": np.array([0.0]),
            },
            "sales_mcfe": {
                "total": np.array([0.0]),
                "wi": np.array([0.0]),
                "nri": np.array([0.0]),
                "lease_nri": np.array([0.0]),
                "one_minus_wi": np.array([0.0]),
                "one_minus_nri": np.array([0.0]),
                "one_minus_lease_nri": np.array([0.0]),
                "wi_minus_one": np.array([0.0]),
                "nri_minus_one": np.array([0.0]),
                "lease_nri_minus_one": np.array([0.0]),
                "100_pct_wi": np.array([0.0]),
            },
        },
    },
    "econ": {
        "well_head": {
            "time": np.array([0, 1, 2, 3, 4, 5]),
            "oil": {
                "wi": np.array([11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]),
                "nri": np.array([8989.6, 3432.0, 1821.6, 1664.0, 1872.0, 1332.8]),
                "lease_nri": np.array([8989.6, 3432.0, 1821.6, 1664.0, 1872.0, 1332.8]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([2247.4, 858.0, 455.4, 416.0, 468.0, 333.2]),
                "one_minus_lease_nri": np.array([2247.4, 858.0, 455.4, 416.0, 468.0, 333.2]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-2247.4, -858.0, -455.4, -416.0, -468.0, -333.2]),
                "lease_nri_minus_one": np.array([-2247.4, -858.0, -455.4, -416.0, -468.0, -333.2]),
                "100_pct_wi": np.array([11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]),
            },
            "gas": {
                "wi": np.array([13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]),
                "nri": np.array([11151.2, 6611.2, 4693.6, 2092.8, 0.0, 3756.0]),
                "lease_nri": np.array([11151.2, 6611.2, 4693.6, 2092.8, 0.0, 3756.0]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([2787.8, 1652.8, 1173.4, 523.2, 0.0, 939.0]),
                "one_minus_lease_nri": np.array([2787.8, 1652.8, 1173.4, 523.2, 0.0, 939.0]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-2787.8, -1652.8, -1173.4, -523.2, -0.0, -939.0]),
                "lease_nri_minus_one": np.array([-2787.8, -1652.8, -1173.4, -523.2, -0.0, -939.0]),
                "100_pct_wi": np.array([13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]),
            },
            "water": {
                "wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "lease_nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            },
        },
        "unshrunk": {
            "time": np.array([0, 1, 2, 3, 4, 5]),
            "oil": {
                "wi": np.array([11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]),
                "nri": np.array([8989.6, 3432.0, 1821.6, 1664.0, 1872.0, 1332.8]),
                "lease_nri": np.array([8989.6, 3432.0, 1821.6, 1664.0, 1872.0, 1332.8]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([2247.4, 858.0, 455.4, 416.0, 468.0, 333.2]),
                "one_minus_lease_nri": np.array([2247.4, 858.0, 455.4, 416.0, 468.0, 333.2]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-2247.4, -858.0, -455.4, -416.0, -468.0, -333.2]),
                "lease_nri_minus_one": np.array([-2247.4, -858.0, -455.4, -416.0, -468.0, -333.2]),
                "100_pct_wi": np.array([11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]),
            },
            "gas": {
                "wi": np.array([13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]),
                "nri": np.array([11151.2, 6611.2, 4693.6, 2092.8, 0.0, 3756.0]),
                "lease_nri": np.array([11151.2, 6611.2, 4693.6, 2092.8, 0.0, 3756.0]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([2787.8, 1652.8, 1173.4, 523.2, 0.0, 939.0]),
                "one_minus_lease_nri": np.array([2787.8, 1652.8, 1173.4, 523.2, 0.0, 939.0]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-2787.8, -1652.8, -1173.4, -523.2, -0.0, -939.0]),
                "lease_nri_minus_one": np.array([-2787.8, -1652.8, -1173.4, -523.2, -0.0, -939.0]),
                "100_pct_wi": np.array([13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]),
            },
            "water": {
                "wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "lease_nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            },
        },
        "sales": {
            "time": np.array([0, 1, 2, 3, 4, 5]),
            "oil": {
                "wi": np.array([11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]),
                "nri": np.array([8989.6, 3432.0, 1821.6, 1664.0, 1872.0, 1332.8]),
                "lease_nri": np.array([8989.6, 3432.0, 1821.6, 1664.0, 1872.0, 1332.8]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([2247.4, 858.0, 455.4, 416.0, 468.0, 333.2]),
                "one_minus_lease_nri": np.array([2247.4, 858.0, 455.4, 416.0, 468.0, 333.2]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-2247.4, -858.0, -455.4, -416.0, -468.0, -333.2]),
                "lease_nri_minus_one": np.array([-2247.4, -858.0, -455.4, -416.0, -468.0, -333.2]),
                "100_pct_wi": np.array([11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]),
            },
            "gas": {
                "wi": np.array([13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]),
                "nri": np.array([11151.2, 6611.2, 4693.6, 2092.8, 0.0, 3756.0]),
                "lease_nri": np.array([11151.2, 6611.2, 4693.6, 2092.8, 0.0, 3756.0]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([2787.8, 1652.8, 1173.4, 523.2, 0.0, 939.0]),
                "one_minus_lease_nri": np.array([2787.8, 1652.8, 1173.4, 523.2, 0.0, 939.0]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-2787.8, -1652.8, -1173.4, -523.2, -0.0, -939.0]),
                "lease_nri_minus_one": np.array([-2787.8, -1652.8, -1173.4, -523.2, -0.0, -939.0]),
                "100_pct_wi": np.array([13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]),
            },
            "water": {
                "wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "lease_nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            },
            "ngl": {
                "wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "lease_nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            },
            "drip_condensate": {
                "wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "lease_nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            },
        },
        "boe": {
            "well_head_boe": {
                "total": np.array([
                    13560.16666667,
                    5667.33333333,
                    3254.83333333,
                    2516.0,
                    2340.0,
                    2448.5,
                ]),
                "wi": np.array([
                    13560.16666667,
                    5667.33333333,
                    3254.83333333,
                    2516.0,
                    2340.0,
                    2448.5,
                ]),
                "nri": np.array([
                    10848.13333333,
                    4533.86666667,
                    2603.86666667,
                    2012.8,
                    1872.0,
                    1958.8,
                ]),
                "lease_nri": np.array([
                    10848.13333333,
                    4533.86666667,
                    2603.86666667,
                    2012.8,
                    1872.0,
                    1958.8,
                ]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([2712.03333333, 1133.46666667, 650.96666667, 503.2, 468.0, 489.7]),
                "one_minus_lease_nri": np.array([2712.03333333, 1133.46666667, 650.96666667, 503.2, 468.0, 489.7]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([
                    -2712.03333333,
                    -1133.46666667,
                    -650.96666667,
                    -503.2,
                    -468.0,
                    -489.7,
                ]),
                "lease_nri_minus_one": np.array([
                    -2712.03333333,
                    -1133.46666667,
                    -650.96666667,
                    -503.2,
                    -468.0,
                    -489.7,
                ]),
                "100_pct_wi": np.array([
                    13560.16666667,
                    5667.33333333,
                    3254.83333333,
                    2516.0,
                    2340.0,
                    2448.5,
                ]),
            },
            "unshrunk_boe": {
                "total": np.array([
                    13560.16666667,
                    5667.33333333,
                    3254.83333333,
                    2516.0,
                    2340.0,
                    2448.5,
                ]),
                "wi": np.array([
                    13560.16666667,
                    5667.33333333,
                    3254.83333333,
                    2516.0,
                    2340.0,
                    2448.5,
                ]),
                "nri": np.array([
                    10848.13333333,
                    4533.86666667,
                    2603.86666667,
                    2012.8,
                    1872.0,
                    1958.8,
                ]),
                "lease_nri": np.array([
                    10848.13333333,
                    4533.86666667,
                    2603.86666667,
                    2012.8,
                    1872.0,
                    1958.8,
                ]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([2712.03333333, 1133.46666667, 650.96666667, 503.2, 468.0, 489.7]),
                "one_minus_lease_nri": np.array([2712.03333333, 1133.46666667, 650.96666667, 503.2, 468.0, 489.7]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([
                    -2712.03333333,
                    -1133.46666667,
                    -650.96666667,
                    -503.2,
                    -468.0,
                    -489.7,
                ]),
                "lease_nri_minus_one": np.array([
                    -2712.03333333,
                    -1133.46666667,
                    -650.96666667,
                    -503.2,
                    -468.0,
                    -489.7,
                ]),
                "100_pct_wi": np.array([
                    13560.16666667,
                    5667.33333333,
                    3254.83333333,
                    2516.0,
                    2340.0,
                    2448.5,
                ]),
            },
            "sales_boe": {
                "total": np.array([
                    13560.16666667,
                    5667.33333333,
                    3254.83333333,
                    2516.0,
                    2340.0,
                    2448.5,
                ]),
                "wi": np.array([
                    13560.16666667,
                    5667.33333333,
                    3254.83333333,
                    2516.0,
                    2340.0,
                    2448.5,
                ]),
                "nri": np.array([
                    10848.13333333,
                    4533.86666667,
                    2603.86666667,
                    2012.8,
                    1872.0,
                    1958.8,
                ]),
                "lease_nri": np.array([
                    10848.13333333,
                    4533.86666667,
                    2603.86666667,
                    2012.8,
                    1872.0,
                    1958.8,
                ]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([2712.03333333, 1133.46666667, 650.96666667, 503.2, 468.0, 489.7]),
                "one_minus_lease_nri": np.array([2712.03333333, 1133.46666667, 650.96666667, 503.2, 468.0, 489.7]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([
                    -2712.03333333,
                    -1133.46666667,
                    -650.96666667,
                    -503.2,
                    -468.0,
                    -489.7,
                ]),
                "lease_nri_minus_one": np.array([
                    -2712.03333333,
                    -1133.46666667,
                    -650.96666667,
                    -503.2,
                    -468.0,
                    -489.7,
                ]),
                "100_pct_wi": np.array([
                    13560.16666667,
                    5667.33333333,
                    3254.83333333,
                    2516.0,
                    2340.0,
                    2448.5,
                ]),
            },
        },
        "mcfe": {
            "well_head_mcfe": {
                "total": np.array([81361.0, 34004.0, 19529.0, 15096.0, 14040.0, 14691.0]),
                "wi": np.array([81361.0, 34004.0, 19529.0, 15096.0, 14040.0, 14691.0]),
                "nri": np.array([65088.8, 27203.2, 15623.2, 12076.8, 11232.0, 11752.8]),
                "lease_nri": np.array([65088.8, 27203.2, 15623.2, 12076.8, 11232.0, 11752.8]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([16272.2, 6800.8, 3905.8, 3019.2, 2808.0, 2938.2]),
                "one_minus_lease_nri": np.array([16272.2, 6800.8, 3905.8, 3019.2, 2808.0, 2938.2]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-16272.2, -6800.8, -3905.8, -3019.2, -2808.0, -2938.2]),
                "lease_nri_minus_one": np.array([-16272.2, -6800.8, -3905.8, -3019.2, -2808.0, -2938.2]),
                "100_pct_wi": np.array([81361.0, 34004.0, 19529.0, 15096.0, 14040.0, 14691.0]),
            },
            "unshrunk_mcfe": {
                "total": np.array([81361.0, 34004.0, 19529.0, 15096.0, 14040.0, 14691.0]),
                "wi": np.array([81361.0, 34004.0, 19529.0, 15096.0, 14040.0, 14691.0]),
                "nri": np.array([65088.8, 27203.2, 15623.2, 12076.8, 11232.0, 11752.8]),
                "lease_nri": np.array([65088.8, 27203.2, 15623.2, 12076.8, 11232.0, 11752.8]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([16272.2, 6800.8, 3905.8, 3019.2, 2808.0, 2938.2]),
                "one_minus_lease_nri": np.array([16272.2, 6800.8, 3905.8, 3019.2, 2808.0, 2938.2]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-16272.2, -6800.8, -3905.8, -3019.2, -2808.0, -2938.2]),
                "lease_nri_minus_one": np.array([-16272.2, -6800.8, -3905.8, -3019.2, -2808.0, -2938.2]),
                "100_pct_wi": np.array([81361.0, 34004.0, 19529.0, 15096.0, 14040.0, 14691.0]),
            },
            "sales_mcfe": {
                "total": np.array([81361.0, 34004.0, 19529.0, 15096.0, 14040.0, 14691.0]),
                "wi": np.array([81361.0, 34004.0, 19529.0, 15096.0, 14040.0, 14691.0]),
                "nri": np.array([65088.8, 27203.2, 15623.2, 12076.8, 11232.0, 11752.8]),
                "lease_nri": np.array([65088.8, 27203.2, 15623.2, 12076.8, 11232.0, 11752.8]),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array([16272.2, 6800.8, 3905.8, 3019.2, 2808.0, 2938.2]),
                "one_minus_lease_nri": np.array([16272.2, 6800.8, 3905.8, 3019.2, 2808.0, 2938.2]),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array([-16272.2, -6800.8, -3905.8, -3019.2, -2808.0, -2938.2]),
                "lease_nri_minus_one": np.array([-16272.2, -6800.8, -3905.8, -3019.2, -2808.0, -2938.2]),
                "100_pct_wi": np.array([81361.0, 34004.0, 19529.0, 15096.0, 14040.0, 14691.0]),
            },
        },
    },
}

unadjusted_wh_volume_generator = {
    "unecon": 0,
    "econ": {
        "oil": np.array([11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]),
        "gas": np.array([13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]),
        "water": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
    },
}


def BFIT_cashflow_parameters(unecon_bool=False, is_capex=False, is_expense=False, is_production_tax=False):
    if unecon_bool:
        return (
            revenue_dict_generator['unecon'],
            fixed_expense_generator['unecon'],
            variable_expense_generator['unecon'],
            water_expense_generator['unecon'],
            carbon_expense_generator['unecon'],
            production_tax_dict_generator['unecon'],
            capex_dict_generator['unecon'],
            npi_generator['unecon'],
            t_all_generator['unecon']
        )
    else:
        return (
            revenue_dict_generator['econ'],
            fixed_expense_generator['econ_expense'] if is_expense else fixed_expense_generator['econ_no_expense'],
            variable_expense_generator['econ_expense'] if is_expense else variable_expense_generator['econ_no_expense'],
            water_expense_generator['econ_expense'] if is_expense else water_expense_generator['econ_no_expense'],
            carbon_expense_generator['econ_expense'] if is_expense else carbon_expense_generator['econ_no_expense'],
            production_tax_dict_generator['tax'] if is_production_tax else production_tax_dict_generator['no_tax'],
            capex_dict_generator['econ_capex'] if is_capex else capex_dict_generator['econ_no_capex'],
            npi_generator['econ'],
            t_all_generator['econ']
        )


def BFIT_cashflow_results(unecon_bool=False, is_capex=False, is_expense=False, is_production_tax=False):
    if unecon_bool:
        return {
            "bfit_cf_dict": {
                "time": np.array([0]),
                "total_net_revenue": np.array([0.0]),
                "total_gross_revenue": np.array([0.0]),
                "expense": np.array([0.0]),
                "production_tax": np.array([0.0]),
                "capex": np.array([0.0]),
                "net_profit": np.array([0.0]),
                "net_income": np.array([0.0]),
                "bfit_cf": np.array([0.0]),
            }
        }
    elif is_capex and is_expense and is_production_tax:
        return {
            "bfit_cf_dict": {
                "time":
                np.array([0, 1, 2, 3, 4, 5]),
                "total_net_revenue":
                np.array([752621.6, 294965.6, 160416.0, 140230.4, 151008.0, 119002.66666667]),
                "total_gross_revenue":
                np.array([846699.3, 331836.3, 180468.0, 157759.2, 169884.0, 133878.0]),
                "expense":
                np.array([2529.225, 966.15, 513.225, 468.9, 527.4, 375.75]),
                "production_tax":
                np.array([
                    54486.9096,
                    21550.15904,
                    11815.91968,
                    10153.37536,
                    10736.7312,
                    8789.38621333,
                ]),
                "capex":
                np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "net_profit":
                np.array([
                    -6956.054654,
                    -2724.4929096,
                    -1480.8685532,
                    -1296.0812464,
                    -1397.438688,
                    -1098.37530453,
                ]),
                "net_income":
                np.array([
                    688649.410746,
                    269724.7980504,
                    146605.9867668,
                    128312.0433936,
                    138346.430112,
                    108739.15514881,
                ]),
                "bfit_cf":
                np.array([
                    688649.410746,
                    269724.7980504,
                    146605.9867668,
                    128312.0433936,
                    138346.430112,
                    108739.15514881,
                ]),
            }
        }
    elif is_capex:
        return {
            "bfit_cf_dict": {
                "time": np.array([0, 1, 2, 3, 4, 5]),
                "total_net_revenue": np.array([752621.6, 294965.6, 160416.0, 140230.4, 151008.0, 119002.66666667]),
                "total_gross_revenue": np.array([846699.3, 331836.3, 180468.0, 157759.2, 169884.0, 133878.0]),
                "expense": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "production_tax": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "capex": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "net_profit": np.array([
                    -7526.216,
                    -2949.656,
                    -1604.16,
                    -1402.304,
                    -1510.08,
                    -1190.02666667,
                ]),
                "net_income": np.array([
                    745095.384,
                    292015.944,
                    158811.84,
                    138828.096,
                    149497.92,
                    117812.64,
                ]),
                "bfit_cf": np.array([
                    745095.384,
                    292015.944,
                    158811.84,
                    138828.096,
                    149497.92,
                    117812.64,
                ]),
            }
        }
    elif is_expense:
        return {
            "bfit_cf_dict": {
                "time": np.array([0, 1, 2, 3, 4, 5]),
                "total_net_revenue": np.array([752621.6, 294965.6, 160416.0, 140230.4, 151008.0, 119002.66666667]),
                "total_gross_revenue": np.array([846699.3, 331836.3, 180468.0, 157759.2, 169884.0, 133878.0]),
                "expense": np.array([2529.225, 966.15, 513.225, 468.9, 527.4, 375.75]),
                "production_tax": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "capex": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "net_profit": np.array([
                    -7500.92375,
                    -2939.9945,
                    -1599.02775,
                    -1397.615,
                    -1504.806,
                    -1186.26916667,
                ]),
                "net_income": np.array([
                    742591.45125,
                    291059.4555,
                    158303.74725,
                    138363.885,
                    148975.794,
                    117440.6475,
                ]),
                "bfit_cf": np.array([
                    742591.45125,
                    291059.4555,
                    158303.74725,
                    138363.885,
                    148975.794,
                    117440.6475,
                ]),
            }
        }
    elif is_production_tax:
        return {
            "bfit_cf_dict": {
                "time":
                np.array([0, 1, 2, 3, 4, 5]),
                "total_net_revenue":
                np.array([752621.6, 294965.6, 160416.0, 140230.4, 151008.0, 119002.66666667]),
                "total_gross_revenue":
                np.array([846699.3, 331836.3, 180468.0, 157759.2, 169884.0, 133878.0]),
                "expense":
                np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "production_tax":
                np.array([
                    54486.9096,
                    21550.15904,
                    11815.91968,
                    10153.37536,
                    10736.7312,
                    8789.38621333,
                ]),
                "capex":
                np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "net_profit":
                np.array([
                    -6981.346904,
                    -2734.1544096,
                    -1486.0008032,
                    -1300.7702464,
                    -1402.712688,
                    -1102.13280453,
                ]),
                "net_income":
                np.array([
                    691153.343496,
                    270681.2865504,
                    147114.0795168,
                    128776.2543936,
                    138868.556112,
                    109111.14764881,
                ]),
                "bfit_cf":
                np.array([
                    691153.343496,
                    270681.2865504,
                    147114.0795168,
                    128776.2543936,
                    138868.556112,
                    109111.14764881,
                ]),
            }
        }
    else:
        pass


# AFIT TESTS RAN WITH ALL ENABLED
def AFIT_cashflow_models(unecon_bool=False, income_tax_specification="basic", primary_product="oil"):
    return (
        date_dict_generator["unecon"] if unecon_bool else date_dict_generator["econ"],
        general_option_generator[income_tax_specification],
        primary_product,
    )


# AFIT TESTS RAN WITH ALL ENABLED
def AFIT_cashflow_parameters(unecon_bool=False, dda_model="no_dda"):
    return (
        bfit_cf_dict_generator["unecon"] if unecon_bool else bfit_cf_dict_generator["econ"],
        all_capex_generator[dda_model],
        ownership_dict_by_phase_generator["unecon"] if unecon_bool else ownership_dict_by_phase_generator["econ"],
        ownership_volume_dict_generator["unecon"] if unecon_bool else ownership_volume_dict_generator["econ"],
        npi_generator["unecon"] if unecon_bool else npi_generator["econ"],
        unadjusted_wh_volume_generator["unecon"] if unecon_bool else unadjusted_wh_volume_generator["econ"],
    )


def AFIT_cashflow_results(
    unecon_bool=False,
    dda_model="no_dda",
    income_tax_specification="basic",
    primary_product="oil",
):
    if unecon_bool:
        return {
            "afit_cf_dict": {
                "time": np.array([0]),
                "bfit_cf": np.array([0.0]),
                "depreciation": np.array([0.0]),
                "tangible_depreciation": np.array([0.0]),
                "intangible_depreciation": np.array([0.0]),
                "depletion": np.array([0.0]),
                "tangible_depletion": np.array([0.0]),
                "intangible_depletion": np.array([0.0]),
                "total_deductions": np.array([0.0]),
                "percentage_depletion": np.array([0.0]),
                "taxable_income": np.array([0.0]),
                "state_income_tax": np.array([0.0]),
                "state_tax_rate": np.array([0.1]),
                "federal_income_tax": np.array([0.0]),
                "federal_tax_rate": np.array([0.1]),
                "tax_credit": np.array([0.0]),
                "afit_cf": np.array([0.0]),
            }
        }
    if income_tax_specification != "basic":
        if income_tax_specification == "fifteen":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tax_credit":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total_deductions":
                    np.array([179009.25, 70655.25, 38669.1, 33318.0, 35334.0, 28719.5]),
                    "percentage_depletion":
                    np.array([179009.25, 70655.25, 38669.1, 33318.0, 35334.0, 28719.5]),
                    "taxable_income":
                    np.array([
                        694589.884716,
                        273873.3243504,
                        149751.3019368,
                        129279.7827936,
                        137388.358512,
                        111187.3044088,
                    ]),
                    "state_income_tax":
                    np.array([
                        69458.9884716,
                        27387.33243504,
                        14975.13019368,
                        12927.97827936,
                        13738.8358512,
                        7783.11130862,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        62513.08962444,
                        24648.59919154,
                        13477.61717431,
                        11635.18045142,
                        12364.95226608,
                        4136.16772401,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "afit_cf":
                    np.array([
                        741627.05661996,
                        292492.64272382,
                        159967.65456881,
                        138034.62406282,
                        146618.57039472,
                        127987.52537618,
                    ]),
                }
            }
        elif income_tax_specification == "carry_forward":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total_deductions":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "percentage_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "taxable_income":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "state_income_tax":
                    np.array([
                        87359.9134716,
                        34452.85743504,
                        18842.04019368,
                        16259.77827936,
                        17272.2358512,
                        9793.47630862,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        78623.92212444,
                        31007.57169154,
                        16957.83617431,
                        14633.80045142,
                        15545.01226608,
                        5204.53312401,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "tax_credit":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "afit_cf":
                    np.array([
                        707615.29911996,
                        279068.14522382,
                        152620.52556881,
                        131704.20406282,
                        139905.11039472,
                        124908.79497618,
                    ]),
                }
            }
        elif income_tax_specification == "fifteen_carry_forward":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total_deductions":
                    np.array([179009.25, 70655.25, 38669.1, 33318.0, 35334.0, 28719.5]),
                    "percentage_depletion":
                    np.array([179009.25, 70655.25, 38669.1, 33318.0, 35334.0, 28719.5]),
                    "taxable_income":
                    np.array([
                        694589.884716,
                        273873.3243504,
                        149751.3019368,
                        129279.7827936,
                        137388.358512,
                        111187.3044088,
                    ]),
                    "state_income_tax":
                    np.array([
                        69458.9884716,
                        27387.33243504,
                        14975.13019368,
                        12927.97827936,
                        13738.8358512,
                        7783.11130862,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        62513.08962444,
                        24648.59919154,
                        13477.61717431,
                        11635.18045142,
                        12364.95226608,
                        4136.16772401,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "tax_credit":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "afit_cf":
                    np.array([
                        741627.05661996,
                        292492.64272382,
                        159967.65456881,
                        138034.62406282,
                        146618.57039472,
                        127987.52537618,
                    ]),
                }
            }
        else:
            raise Exception("Unsupported Income Tax Specification")
    elif dda_model != "no_dda":
        if dda_model == "depreciation":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([1000.0, 1000.0, 300.0, 300.0, 300.0, 17100.0]),
                    "tangible_depreciation":
                    np.array([500.0, 500.0, 150.0, 150.0, 150.0, 8550.0]),
                    "intangible_depreciation":
                    np.array([500.0, 500.0, 150.0, 150.0, 150.0, 8550.0]),
                    "tax_credit":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total_deductions":
                    np.array([1000.0, 1000.0, 300.0, 300.0, 300.0, 17100.0]),
                    "percentage_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "taxable_income":
                    np.array([
                        872599.134716,
                        343528.5743504,
                        188120.4019368,
                        162297.7827936,
                        172422.358512,
                        122806.8044088,
                    ]),
                    "state_income_tax":
                    np.array([
                        87259.9134716,
                        34352.85743504,
                        18812.04019368,
                        16229.77827936,
                        17242.2358512,
                        8596.47630862,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        78533.92212444,
                        30917.57169154,
                        16930.83617431,
                        14606.80045142,
                        15518.01226608,
                        4568.41312401,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "afit_cf":
                    np.array([
                        707805.29911996,
                        279258.14522382,
                        152677.52556881,
                        131761.20406282,
                        139962.11039472,
                        126741.91497618,
                    ]),
                }
            }
        elif dda_model == "bonus_depreciation":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([5500.0, 5500.0, 150.0, 150.0, 150.0, 8550.0]),
                    "tangible_depreciation":
                    np.array([2750.0, 2750.0, 75.0, 75.0, 75.0, 4275.0]),
                    "intangible_depreciation":
                    np.array([2750.0, 2750.0, 75.0, 75.0, 75.0, 4275.0]),
                    "tax_credit":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total_deductions":
                    np.array([5500.0, 5500.0, 150.0, 150.0, 150.0, 8550.0]),
                    "percentage_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "taxable_income":
                    np.array([
                        868099.134716,
                        339028.5743504,
                        188270.4019368,
                        162447.7827936,
                        172572.358512,
                        131356.8044088,
                    ]),
                    "state_income_tax":
                    np.array([
                        86809.9134716,
                        33902.85743504,
                        18827.04019368,
                        16244.77827936,
                        17257.2358512,
                        9194.97630862,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        78128.92212444,
                        30512.57169154,
                        16944.33617431,
                        14620.30045142,
                        15531.51226608,
                        4886.47312401,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "afit_cf":
                    np.array([
                        708660.29911996,
                        280113.14522382,
                        152649.02556881,
                        131732.70406282,
                        139933.61039472,
                        125825.35497617,
                    ]),
                }
            }
        elif dda_model == "depreciation_with_tax_credit":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([1000.0, 1000.0, 300.0, 300.0, 300.0, 17100.0]),
                    "tangible_depreciation":
                    np.array([500.0, 500.0, 150.0, 150.0, 150.0, 8550.0]),
                    "intangible_depreciation":
                    np.array([500.0, 500.0, 150.0, 150.0, 150.0, 8550.0]),
                    "tax_credit":
                    np.array([2000.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total_deductions":
                    np.array([1000.0, 1000.0, 300.0, 300.0, 300.0, 17100.0]),
                    "percentage_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "taxable_income":
                    np.array([
                        872599.134716,
                        343528.5743504,
                        188120.4019368,
                        162297.7827936,
                        172422.358512,
                        122806.8044088,
                    ]),
                    "state_income_tax":
                    np.array([
                        87259.9134716,
                        34352.85743504,
                        18812.04019368,
                        16229.77827936,
                        17242.2358512,
                        8596.47630862,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        78533.92212444,
                        30917.57169154,
                        16930.83617431,
                        14606.80045142,
                        15518.01226608,
                        4568.41312401,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "afit_cf":
                    np.array([
                        709805.29911996,
                        279258.14522382,
                        152677.52556881,
                        131761.20406282,
                        139962.11039472,
                        126741.91497618,
                    ]),
                }
            }
        elif dda_model == "depletion_with_immediate_depletion":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tax_credit":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([
                        10731.37295937,
                        3142.5282545,
                        1667.95730432,
                        1523.6500628,
                        1714.10632064,
                        1220.38509836,
                    ]),
                    "tangible_depletion":
                    np.array([
                        5233.27752197,
                        1616.15738803,
                        857.80661365,
                        783.59146087,
                        881.54039347,
                        627.62662201,
                    ]),
                    "intangible_depletion":
                    np.array([
                        5498.0954374,
                        1526.37086647,
                        810.15069067,
                        740.05860193,
                        832.56592717,
                        592.75847635,
                    ]),
                    "total_deductions":
                    np.array([
                        10731.37295937,
                        3142.5282545,
                        1667.95730432,
                        1523.6500628,
                        1714.10632064,
                        1220.38509836,
                    ]),
                    "percentage_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "taxable_income":
                    np.array([
                        862867.76175663,
                        341386.0460959,
                        186752.44463248,
                        161074.1327308,
                        171008.25219136,
                        138686.41931044,
                    ]),
                    "state_income_tax":
                    np.array([
                        86286.77617566,
                        34138.6046095,
                        18675.24446324,
                        16107.4132730,
                        17100.82521913,
                        9708.049351728,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        77658.09855809,
                        30724.7441486,
                        16807.72001692,
                        14496.6719457,
                        15390.74269722,
                        5159.13479835,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "afit_cf":
                    np.array([
                        709654.25998225,
                        279665.22559218,
                        152937.43745663,
                        131993.69757475,
                        140230.79059564,
                        125039.62025872,
                    ]),
                }
            }
        elif dda_model == "UOP_major":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tax_credit":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([
                        9407.28338217,
                        3591.46086229,
                        1906.23691921,
                        1741.31435747,
                        1958.97865216,
                        1394.72582671,
                    ]),
                    "tangible_depletion":
                    np.array([
                        4703.64169108,
                        1795.73043114,
                        953.11845961,
                        870.65717874,
                        979.48932608,
                        697.36291335,
                    ]),
                    "intangible_depletion":
                    np.array([
                        4703.64169108,
                        1795.73043114,
                        953.11845961,
                        870.65717874,
                        979.48932608,
                        697.36291335,
                    ]),
                    "total_deductions":
                    np.array([
                        9407.28338217,
                        3591.46086229,
                        1906.23691921,
                        1741.31435747,
                        1958.97865216,
                        1394.72582671,
                    ]),
                    "percentage_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "taxable_income":
                    np.array([
                        864191.85133383,
                        340937.11348811,
                        186514.16501759,
                        160856.46843613,
                        170763.37985984,
                        138512.07858209,
                    ]),
                    "state_income_tax":
                    np.array([
                        86419.18513338,
                        34093.71134881,
                        18651.41650176,
                        16085.64684361,
                        17076.33798598,
                        9695.84550075,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        77777.26662004,
                        30684.34021393,
                        16786.27485158,
                        14477.08215925,
                        15368.70418739,
                        5152.64932325,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "afit_cf":
                    np.array([
                        709402.68296257,
                        279750.52278766,
                        152982.71058346,
                        132035.05379074,
                        140277.31633863,
                        125058.3095848,
                    ]),
                }
            }
        elif dda_model == "UOP_BOE":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tax_credit":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([
                        9104.80581465,
                        3805.26071362,
                        2185.4174943,
                        1689.33701132,
                        1571.16399304,
                        1644.01497306,
                    ]),
                    "tangible_depletion":
                    np.array([
                        4552.40290733,
                        1902.63035681,
                        1092.70874715,
                        844.66850566,
                        785.58199652,
                        822.00748653,
                    ]),
                    "intangible_depletion":
                    np.array([
                        4552.40290733,
                        1902.63035681,
                        1092.70874715,
                        844.66850566,
                        785.58199652,
                        822.00748653,
                    ]),
                    "total_deductions":
                    np.array([
                        9104.80581465,
                        3805.26071362,
                        2185.4174943,
                        1689.33701132,
                        1571.16399304,
                        1644.01497306,
                    ]),
                    "percentage_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "taxable_income":
                    np.array([
                        864494.32890135,
                        340723.31363678,
                        186234.9844425,
                        160908.44578228,
                        171151.19451896,
                        138262.78943574,
                    ]),
                    "state_income_tax":
                    np.array([
                        86449.43289013,
                        34072.33136368,
                        18623.49844425,
                        16090.84457823,
                        17115.1194519,
                        9678.3952605,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        77804.48960112,
                        30665.09822731,
                        16761.14859982,
                        14481.76012041,
                        15403.60750671,
                        5143.37576701,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "afit_cf":
                    np.array([
                        709345.21222474,
                        279791.14475941,
                        153035.75489273,
                        132025.17809497,
                        140203.6315534,
                        125085.03338129,
                    ]),
                }
            }
        elif dda_model == "deduct_ecl":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tax_credit":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 20000.0]),
                    "tangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 10000.0]),
                    "intangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 10000.0]),
                    "total_deductions":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 20000.0]),
                    "percentage_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "taxable_income":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        119906.8044088,
                    ]),
                    "state_income_tax":
                    np.array([
                        87359.9134716,
                        34452.85743504,
                        18842.04019368,
                        16259.77827936,
                        17272.2358512,
                        8393.47630862,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        78623.92212444,
                        31007.57169154,
                        16957.83617431,
                        14633.80045142,
                        15545.01226608,
                        4460.53312401,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "afit_cf":
                    np.array([
                        707615.29911996,
                        279068.14522382,
                        152620.52556881,
                        131704.20406282,
                        139905.11039472,
                        127052.79497618,
                    ]),
                }
            }
        elif dda_model == "expense_fpd":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tax_credit":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([20000.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depletion":
                    np.array([10000.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depletion":
                    np.array([10000.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total_deductions":
                    np.array([20000.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "percentage_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "taxable_income":
                    np.array([
                        853599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "state_income_tax":
                    np.array([
                        85359.9134716,
                        34452.85743504,
                        18842.04019368,
                        16259.77827936,
                        17272.2358512,
                        9793.47630862,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        76823.92212444,
                        31007.57169154,
                        16957.83617431,
                        14633.80045142,
                        15545.01226608,
                        5204.53312401,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "afit_cf":
                    np.array([
                        711415.29911996,
                        279068.14522382,
                        152620.52556881,
                        131704.20406282,
                        139905.11039472,
                        124908.79497618,
                    ]),
                }
            }
        elif dda_model == "no_depletion":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depreciation":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "tangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "intangible_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "total_deductions":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "percentage_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "taxable_income":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "state_income_tax":
                    np.array([
                        87359.9134716,
                        34452.85743504,
                        18842.04019368,
                        16259.77827936,
                        17272.2358512,
                        9793.47630862,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        78623.92212444,
                        31007.57169154,
                        16957.83617431,
                        14633.80045142,
                        15545.01226608,
                        5204.53312401,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "tax_credit":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "afit_cf":
                    np.array([
                        707615.29911996,
                        279068.14522382,
                        152620.52556881,
                        131704.20406282,
                        139905.11039472,
                        124908.79497618,
                    ]),
                }
            }
        elif dda_model == "depreciation_and_depletion":
            return {
                "afit_cf_dict": {
                    "time":
                    np.array([0, 1, 2, 3, 4, 5]),
                    "bfit_cf":
                    np.array([
                        873599.134716,
                        344528.5743504,
                        188420.4019368,
                        162597.7827936,
                        172722.358512,
                        139906.8044088,
                    ]),
                    "depreciation":
                    np.array([1000.0, 1000.0, 300.0, 300.0, 300.0, 17100.0]),
                    "tangible_depreciation":
                    np.array([500.0, 500.0, 150.0, 150.0, 150.0, 8550.0]),
                    "intangible_depreciation":
                    np.array([500.0, 500.0, 150.0, 150.0, 150.0, 8550.0]),
                    "tax_credit":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "depletion":
                    np.array([
                        9256.04459841,
                        3698.36078795,
                        2045.82720676,
                        1715.3256844,
                        1765.0713226,
                        1519.37039988,
                    ]),
                    "tangible_depletion":
                    np.array([
                        4703.64169108,
                        1795.73043114,
                        953.11845961,
                        870.65717874,
                        979.48932608,
                        697.36291335,
                    ]),
                    "intangible_depletion":
                    np.array([
                        4552.40290733,
                        1902.63035681,
                        1092.70874715,
                        844.66850566,
                        785.58199652,
                        822.00748653,
                    ]),
                    "total_deductions":
                    np.array([
                        10256.04459841,
                        4698.36078795,
                        2345.82720676,
                        2015.3256844,
                        2065.0713226,
                        18619.37039988,
                    ]),
                    "percentage_depletion":
                    np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "taxable_income":
                    np.array([
                        863343.09011759,
                        339830.21356245,
                        186074.57473004,
                        160582.4571092,
                        170657.2871894,
                        121287.43400892,
                    ]),
                    "state_income_tax":
                    np.array([
                        86334.30901176,
                        33983.02135624,
                        18607.457473,
                        16058.24571092,
                        17065.72871894,
                        8490.12038062,
                    ]),
                    "state_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.07]),
                    "federal_income_tax":
                    np.array([
                        77700.87811058,
                        30584.71922062,
                        16746.7117257,
                        14452.42113983,
                        15359.15584705,
                        4511.89254513,
                    ]),
                    "federal_tax_rate":
                    np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.04]),
                    "afit_cf":
                    np.array([
                        709563.94759366,
                        279960.83377354,
                        153066.23273809,
                        132087.11594285,
                        140297.47394601,
                        126904.79148304,
                    ]),
                }
            }
        else:
            raise Exception("Unsupported Depreciation and Depletion Model")
