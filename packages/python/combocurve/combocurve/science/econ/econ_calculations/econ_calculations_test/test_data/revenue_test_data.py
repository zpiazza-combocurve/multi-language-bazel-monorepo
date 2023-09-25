import numpy as np
import datetime

btu_content_dict = {"unshrunk_gas": 1.0, "shrunk_gas": 1.0}

volume_dict_generator = {
    "unecon": {
        "oil": {
            "date": np.array([datetime.date(1995, 11, 1)], dtype=object),
            "time": np.array([0]),
            "well_head": np.array([0]),
            "pre_risk": np.array([0]),
            "unshrunk": np.array([0.0]),
            "sales": np.array([0.0]),
            "ownership": {
                "well_head": {
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
                "pre_risk": {
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
                "unshrunk": {
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
                "sales": {
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
        "gas": {
            "date": np.array([datetime.date(1995, 11, 1)], dtype=object),
            "time": np.array([0]),
            "well_head": np.array([0]),
            "pre_risk": np.array([0]),
            "pre_flare": np.array([0.0]),
            "unshrunk": np.array([0.0]),
            "sales": np.array([0.0]),
            "pre_risk_pre_flare": np.array([0.0]),
            "pre_risk_unshrunk": np.array([0.0]),
            "pre_risk_sales": np.array([0.0]),
            "ownership": {
                "well_head": {
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
                "pre_risk": {
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
                "pre_flare": {
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
                "unshrunk": {
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
                "sales": {
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
                "pre_risk_pre_flare": {
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
                "pre_risk_unshrunk": {
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
                "pre_risk_sales": {
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
        "water": {
            "date": np.array([datetime.date(1995, 11, 1)], dtype=object),
            "time": np.array([0]),
            "well_head": np.array([0]),
            "pre_risk": np.array([0]),
            "unshrunk": np.array([0]),
            "sales": np.array([0]),
            "ownership": {
                "well_head": {
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
                "pre_risk": {
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
                "unshrunk": {
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
                "sales": {
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
        },
        "ngl": {
            "date": np.array([datetime.date(1995, 11, 1)], dtype=object),
            "time": np.array([0]),
            "pre_risk": np.array([0.0]),
            "sales": np.array([0.0]),
            "ownership": {
                "pre_risk": {
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
                "sales": {
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
        "drip_condensate": {
            "date": np.array([datetime.date(1995, 11, 1)], dtype=object),
            "time": np.array([0]),
            "pre_risk": np.array([0.0]),
            "sales": np.array([0.0]),
            "ownership": {
                "pre_risk": {
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
                "sales": {
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
        "boe": {
            "well_head": {
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
            "unshrunk": {
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
            "sales": {
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
            "well_head": {
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
            "unshrunk": {
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
            "sales": {
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
        "oil": {
            "date": np.array(
                [
                    datetime.date(1995, 11, 1),
                    datetime.date(1995, 12, 1),
                    datetime.date(1996, 1, 1),
                    datetime.date(1996, 2, 1),
                    datetime.date(1996, 3, 1),
                    datetime.date(1996, 4, 1),
                ],
                dtype=object,
            ),
            "time": np.array([0, 1, 2, 3, 4, 5]),
            "well_head": np.array([11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]),
            "pre_risk": np.array([11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]),
            "unshrunk": np.array([11124.63, 4247.1, 2254.23, 2059.2, 2316.6, 1649.34]),
            "sales": np.array(
                [11013.3837, 4204.629, 2231.6877, 2038.608, 2293.434, 1632.8466]
            ),
            "ownership": {
                "well_head": {
                    "wi": np.array([11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]),
                    "nri": np.array([8989.6, 3432.0, 1821.6, 1664.0, 1872.0, 1332.8]),
                    "lease_nri": np.array(
                        [8989.6, 3432.0, 1821.6, 1664.0, 1872.0, 1332.8]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2247.4, 858.0, 455.4, 416.0, 468.0, 333.2]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2247.4, 858.0, 455.4, 416.0, 468.0, 333.2]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [-2247.4, -858.0, -455.4, -416.0, -468.0, -333.2]
                    ),
                    "lease_nri_minus_one": np.array(
                        [-2247.4, -858.0, -455.4, -416.0, -468.0, -333.2]
                    ),
                    "100_pct_wi": np.array(
                        [11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]
                    ),
                },
                "pre_risk": {
                    "wi": np.array([11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]),
                    "nri": np.array([8989.6, 3432.0, 1821.6, 1664.0, 1872.0, 1332.8]),
                    "lease_nri": np.array(
                        [8989.6, 3432.0, 1821.6, 1664.0, 1872.0, 1332.8]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2247.4, 858.0, 455.4, 416.0, 468.0, 333.2]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2247.4, 858.0, 455.4, 416.0, 468.0, 333.2]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [-2247.4, -858.0, -455.4, -416.0, -468.0, -333.2]
                    ),
                    "lease_nri_minus_one": np.array(
                        [-2247.4, -858.0, -455.4, -416.0, -468.0, -333.2]
                    ),
                    "100_pct_wi": np.array(
                        [11237.0, 4290.0, 2277.0, 2080.0, 2340.0, 1666.0]
                    ),
                },
                "unshrunk": {
                    "wi": np.array(
                        [11124.63, 4247.1, 2254.23, 2059.2, 2316.6, 1649.34]
                    ),
                    "nri": np.array(
                        [8899.704, 3397.68, 1803.384, 1647.36, 1853.28, 1319.472]
                    ),
                    "lease_nri": np.array(
                        [8899.704, 3397.68, 1803.384, 1647.36, 1853.28, 1319.472]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2224.926, 849.42, 450.846, 411.84, 463.32, 329.868]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2224.926, 849.42, 450.846, 411.84, 463.32, 329.868]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [-2224.926, -849.42, -450.846, -411.84, -463.32, -329.868]
                    ),
                    "lease_nri_minus_one": np.array(
                        [-2224.926, -849.42, -450.846, -411.84, -463.32, -329.868]
                    ),
                    "100_pct_wi": np.array(
                        [11124.63, 4247.1, 2254.23, 2059.2, 2316.6, 1649.34]
                    ),
                },
                "sales": {
                    "wi": np.array(
                        [11013.3837, 4204.629, 2231.6877, 2038.608, 2293.434, 1632.8466]
                    ),
                    "nri": np.array(
                        [
                            8810.70696,
                            3363.7032,
                            1785.35016,
                            1630.8864,
                            1834.7472,
                            1306.27728,
                        ]
                    ),
                    "lease_nri": np.array(
                        [
                            8810.70696,
                            3363.7032,
                            1785.35016,
                            1630.8864,
                            1834.7472,
                            1306.27728,
                        ]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2202.67674, 840.9258, 446.33754, 407.7216, 458.6868, 326.56932]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2202.67674, 840.9258, 446.33754, 407.7216, 458.6868, 326.56932]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [
                            -2202.67674,
                            -840.9258,
                            -446.33754,
                            -407.7216,
                            -458.6868,
                            -326.56932,
                        ]
                    ),
                    "lease_nri_minus_one": np.array(
                        [
                            -2202.67674,
                            -840.9258,
                            -446.33754,
                            -407.7216,
                            -458.6868,
                            -326.56932,
                        ]
                    ),
                    "100_pct_wi": np.array(
                        [11013.3837, 4204.629, 2231.6877, 2038.608, 2293.434, 1632.8466]
                    ),
                },
            },
        },
        "gas": {
            "date": np.array(
                [
                    datetime.date(1995, 11, 1),
                    datetime.date(1995, 12, 1),
                    datetime.date(1996, 1, 1),
                    datetime.date(1996, 2, 1),
                    datetime.date(1996, 3, 1),
                    datetime.date(1996, 4, 1),
                ],
                dtype=object,
            ),
            "time": np.array([0, 1, 2, 3, 4, 5]),
            "well_head": np.array([13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]),
            "pre_risk": np.array([13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]),
            "pre_flare": np.array([13799.61, 8181.36, 5808.33, 2589.84, 0.0, 4648.05]),
            "unshrunk": np.array(
                [13661.6139, 8099.5464, 5750.2467, 2563.9416, 0.0, 4601.5695]
            ),
            "sales": np.array(
                [13524.997761, 8018.550936, 5692.744233, 2538.302184, 0.0, 4555.553805]
            ),
            "pre_risk_pre_flare": np.array(
                [13799.61, 8181.36, 5808.33, 2589.84, 0.0, 4648.05]
            ),
            "pre_risk_unshrunk": np.array(
                [13661.6139, 8099.5464, 5750.2467, 2563.9416, 0.0, 4601.5695]
            ),
            "pre_risk_sales": np.array(
                [13524.997761, 8018.550936, 5692.744233, 2538.302184, 0.0, 4555.553805]
            ),
            "ownership": {
                "well_head": {
                    "wi": np.array([13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]),
                    "nri": np.array([11151.2, 6611.2, 4693.6, 2092.8, 0.0, 3756.0]),
                    "lease_nri": np.array(
                        [11151.2, 6611.2, 4693.6, 2092.8, 0.0, 3756.0]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2787.8, 1652.8, 1173.4, 523.2, 0.0, 939.0]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2787.8, 1652.8, 1173.4, 523.2, 0.0, 939.0]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [-2787.8, -1652.8, -1173.4, -523.2, -0.0, -939.0]
                    ),
                    "lease_nri_minus_one": np.array(
                        [-2787.8, -1652.8, -1173.4, -523.2, -0.0, -939.0]
                    ),
                    "100_pct_wi": np.array(
                        [13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]
                    ),
                },
                "pre_risk": {
                    "wi": np.array([13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]),
                    "nri": np.array([11151.2, 6611.2, 4693.6, 2092.8, 0.0, 3756.0]),
                    "lease_nri": np.array(
                        [11151.2, 6611.2, 4693.6, 2092.8, 0.0, 3756.0]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2787.8, 1652.8, 1173.4, 523.2, 0.0, 939.0]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2787.8, 1652.8, 1173.4, 523.2, 0.0, 939.0]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [-2787.8, -1652.8, -1173.4, -523.2, -0.0, -939.0]
                    ),
                    "lease_nri_minus_one": np.array(
                        [-2787.8, -1652.8, -1173.4, -523.2, -0.0, -939.0]
                    ),
                    "100_pct_wi": np.array(
                        [13939.0, 8264.0, 5867.0, 2616.0, 0.0, 4695.0]
                    ),
                },
                "pre_flare": {
                    "wi": np.array([13799.61, 8181.36, 5808.33, 2589.84, 0.0, 4648.05]),
                    "nri": np.array(
                        [11039.688, 6545.088, 4646.664, 2071.872, 0.0, 3718.44]
                    ),
                    "lease_nri": np.array(
                        [11039.688, 6545.088, 4646.664, 2071.872, 0.0, 3718.44]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2759.922, 1636.272, 1161.666, 517.968, 0.0, 929.61]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2759.922, 1636.272, 1161.666, 517.968, 0.0, 929.61]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [-2759.922, -1636.272, -1161.666, -517.968, -0.0, -929.61]
                    ),
                    "lease_nri_minus_one": np.array(
                        [-2759.922, -1636.272, -1161.666, -517.968, -0.0, -929.61]
                    ),
                    "100_pct_wi": np.array(
                        [13799.61, 8181.36, 5808.33, 2589.84, 0.0, 4648.05]
                    ),
                },
                "unshrunk": {
                    "wi": np.array(
                        [13661.6139, 8099.5464, 5750.2467, 2563.9416, 0.0, 4601.5695]
                    ),
                    "nri": np.array(
                        [
                            10929.29112,
                            6479.63712,
                            4600.19736,
                            2051.15328,
                            0.0,
                            3681.2556,
                        ]
                    ),
                    "lease_nri": np.array(
                        [
                            10929.29112,
                            6479.63712,
                            4600.19736,
                            2051.15328,
                            0.0,
                            3681.2556,
                        ]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2732.32278, 1619.90928, 1150.04934, 512.78832, 0.0, 920.3139]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2732.32278, 1619.90928, 1150.04934, 512.78832, 0.0, 920.3139]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [
                            -2732.32278,
                            -1619.90928,
                            -1150.04934,
                            -512.78832,
                            -0.0,
                            -920.3139,
                        ]
                    ),
                    "lease_nri_minus_one": np.array(
                        [
                            -2732.32278,
                            -1619.90928,
                            -1150.04934,
                            -512.78832,
                            -0.0,
                            -920.3139,
                        ]
                    ),
                    "100_pct_wi": np.array(
                        [13661.6139, 8099.5464, 5750.2467, 2563.9416, 0.0, 4601.5695]
                    ),
                },
                "sales": {
                    "wi": np.array(
                        [
                            13524.997761,
                            8018.550936,
                            5692.744233,
                            2538.302184,
                            0.0,
                            4555.553805,
                        ]
                    ),
                    "nri": np.array(
                        [
                            10819.9982088,
                            6414.8407488,
                            4554.1953864,
                            2030.6417472,
                            0.0,
                            3644.443044,
                        ]
                    ),
                    "lease_nri": np.array(
                        [
                            10819.9982088,
                            6414.8407488,
                            4554.1953864,
                            2030.6417472,
                            0.0,
                            3644.443044,
                        ]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [
                            2704.9995522,
                            1603.7101872,
                            1138.5488466,
                            507.6604368,
                            0.0,
                            911.110761,
                        ]
                    ),
                    "one_minus_lease_nri": np.array(
                        [
                            2704.9995522,
                            1603.7101872,
                            1138.5488466,
                            507.6604368,
                            0.0,
                            911.110761,
                        ]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [
                            -2704.9995522,
                            -1603.7101872,
                            -1138.5488466,
                            -507.6604368,
                            -0.0,
                            -911.110761,
                        ]
                    ),
                    "lease_nri_minus_one": np.array(
                        [
                            -2704.9995522,
                            -1603.7101872,
                            -1138.5488466,
                            -507.6604368,
                            -0.0,
                            -911.110761,
                        ]
                    ),
                    "100_pct_wi": np.array(
                        [
                            13524.997761,
                            8018.550936,
                            5692.744233,
                            2538.302184,
                            0.0,
                            4555.553805,
                        ]
                    ),
                },
                "pre_risk_pre_flare": {
                    "wi": np.array([13799.61, 8181.36, 5808.33, 2589.84, 0.0, 4648.05]),
                    "nri": np.array(
                        [11039.688, 6545.088, 4646.664, 2071.872, 0.0, 3718.44]
                    ),
                    "lease_nri": np.array(
                        [11039.688, 6545.088, 4646.664, 2071.872, 0.0, 3718.44]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2759.922, 1636.272, 1161.666, 517.968, 0.0, 929.61]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2759.922, 1636.272, 1161.666, 517.968, 0.0, 929.61]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [-2759.922, -1636.272, -1161.666, -517.968, -0.0, -929.61]
                    ),
                    "lease_nri_minus_one": np.array(
                        [-2759.922, -1636.272, -1161.666, -517.968, -0.0, -929.61]
                    ),
                    "100_pct_wi": np.array(
                        [13799.61, 8181.36, 5808.33, 2589.84, 0.0, 4648.05]
                    ),
                },
                "pre_risk_unshrunk": {
                    "wi": np.array(
                        [13661.6139, 8099.5464, 5750.2467, 2563.9416, 0.0, 4601.5695]
                    ),
                    "nri": np.array(
                        [
                            10929.29112,
                            6479.63712,
                            4600.19736,
                            2051.15328,
                            0.0,
                            3681.2556,
                        ]
                    ),
                    "lease_nri": np.array(
                        [
                            10929.29112,
                            6479.63712,
                            4600.19736,
                            2051.15328,
                            0.0,
                            3681.2556,
                        ]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2732.32278, 1619.90928, 1150.04934, 512.78832, 0.0, 920.3139]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2732.32278, 1619.90928, 1150.04934, 512.78832, 0.0, 920.3139]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [
                            -2732.32278,
                            -1619.90928,
                            -1150.04934,
                            -512.78832,
                            -0.0,
                            -920.3139,
                        ]
                    ),
                    "lease_nri_minus_one": np.array(
                        [
                            -2732.32278,
                            -1619.90928,
                            -1150.04934,
                            -512.78832,
                            -0.0,
                            -920.3139,
                        ]
                    ),
                    "100_pct_wi": np.array(
                        [13661.6139, 8099.5464, 5750.2467, 2563.9416, 0.0, 4601.5695]
                    ),
                },
                "pre_risk_sales": {
                    "wi": np.array(
                        [
                            13524.997761,
                            8018.550936,
                            5692.744233,
                            2538.302184,
                            0.0,
                            4555.553805,
                        ]
                    ),
                    "nri": np.array(
                        [
                            10819.9982088,
                            6414.8407488,
                            4554.1953864,
                            2030.6417472,
                            0.0,
                            3644.443044,
                        ]
                    ),
                    "lease_nri": np.array(
                        [
                            10819.9982088,
                            6414.8407488,
                            4554.1953864,
                            2030.6417472,
                            0.0,
                            3644.443044,
                        ]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [
                            2704.9995522,
                            1603.7101872,
                            1138.5488466,
                            507.6604368,
                            0.0,
                            911.110761,
                        ]
                    ),
                    "one_minus_lease_nri": np.array(
                        [
                            2704.9995522,
                            1603.7101872,
                            1138.5488466,
                            507.6604368,
                            0.0,
                            911.110761,
                        ]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [
                            -2704.9995522,
                            -1603.7101872,
                            -1138.5488466,
                            -507.6604368,
                            -0.0,
                            -911.110761,
                        ]
                    ),
                    "lease_nri_minus_one": np.array(
                        [
                            -2704.9995522,
                            -1603.7101872,
                            -1138.5488466,
                            -507.6604368,
                            -0.0,
                            -911.110761,
                        ]
                    ),
                    "100_pct_wi": np.array(
                        [
                            13524.997761,
                            8018.550936,
                            5692.744233,
                            2538.302184,
                            0.0,
                            4555.553805,
                        ]
                    ),
                },
            },
        },
        "water": {
            "date": np.array(
                [
                    datetime.date(1995, 11, 1),
                    datetime.date(1995, 12, 1),
                    datetime.date(1996, 1, 1),
                    datetime.date(1996, 2, 1),
                    datetime.date(1996, 3, 1),
                    datetime.date(1996, 4, 1),
                ],
                dtype=object,
            ),
            "time": np.array([0, 1, 2, 3, 4, 5]),
            "well_head": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "pre_risk": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "unshrunk": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "sales": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            "ownership": {
                "well_head": {
                    "wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                    "lease_nri_minus_one": np.array(
                        [-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]
                    ),
                    "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "pre_risk": {
                    "wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                    "lease_nri_minus_one": np.array(
                        [-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]
                    ),
                    "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "unshrunk": {
                    "wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                    "lease_nri_minus_one": np.array(
                        [-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]
                    ),
                    "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
                "sales": {
                    "wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_lease_nri": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                    "lease_nri_minus_one": np.array(
                        [-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]
                    ),
                    "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
            },
        },
        "ngl": {
            "date": np.array(
                [
                    datetime.date(1995, 11, 1),
                    datetime.date(1995, 12, 1),
                    datetime.date(1996, 1, 1),
                    datetime.date(1996, 2, 1),
                    datetime.date(1996, 3, 1),
                    datetime.date(1996, 4, 1),
                ],
                dtype=object,
            ),
            "time": np.array([0, 1, 2, 3, 4, 5]),
            "pre_risk": np.array(
                [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
            ),
            "sales": np.array(
                [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
            ),
            "ownership": {
                "pre_risk": {
                    "wi": np.array(
                        [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
                    ),
                    "nri": np.array(
                        [
                            10.92929112,
                            6.47963712,
                            4.60019736,
                            2.05115328,
                            0.0,
                            3.6812556,
                        ]
                    ),
                    "lease_nri": np.array(
                        [
                            10.92929112,
                            6.47963712,
                            4.60019736,
                            2.05115328,
                            0.0,
                            3.6812556,
                        ]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2.73232278, 1.61990928, 1.15004934, 0.51278832, 0.0, 0.9203139]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2.73232278, 1.61990928, 1.15004934, 0.51278832, 0.0, 0.9203139]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [
                            -2.73232278,
                            -1.61990928,
                            -1.15004934,
                            -0.51278832,
                            -0.0,
                            -0.9203139,
                        ]
                    ),
                    "lease_nri_minus_one": np.array(
                        [
                            -2.73232278,
                            -1.61990928,
                            -1.15004934,
                            -0.51278832,
                            -0.0,
                            -0.9203139,
                        ]
                    ),
                    "100_pct_wi": np.array(
                        [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
                    ),
                },
                "sales": {
                    "wi": np.array(
                        [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
                    ),
                    "nri": np.array(
                        [
                            10.92929112,
                            6.47963712,
                            4.60019736,
                            2.05115328,
                            0.0,
                            3.6812556,
                        ]
                    ),
                    "lease_nri": np.array(
                        [
                            10.92929112,
                            6.47963712,
                            4.60019736,
                            2.05115328,
                            0.0,
                            3.6812556,
                        ]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2.73232278, 1.61990928, 1.15004934, 0.51278832, 0.0, 0.9203139]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2.73232278, 1.61990928, 1.15004934, 0.51278832, 0.0, 0.9203139]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [
                            -2.73232278,
                            -1.61990928,
                            -1.15004934,
                            -0.51278832,
                            -0.0,
                            -0.9203139,
                        ]
                    ),
                    "lease_nri_minus_one": np.array(
                        [
                            -2.73232278,
                            -1.61990928,
                            -1.15004934,
                            -0.51278832,
                            -0.0,
                            -0.9203139,
                        ]
                    ),
                    "100_pct_wi": np.array(
                        [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
                    ),
                },
            },
        },
        "drip_condensate": {
            "date": np.array(
                [
                    datetime.date(1995, 11, 1),
                    datetime.date(1995, 12, 1),
                    datetime.date(1996, 1, 1),
                    datetime.date(1996, 2, 1),
                    datetime.date(1996, 3, 1),
                    datetime.date(1996, 4, 1),
                ],
                dtype=object,
            ),
            "time": np.array([0, 1, 2, 3, 4, 5]),
            "pre_risk": np.array(
                [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
            ),
            "sales": np.array(
                [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
            ),
            "ownership": {
                "pre_risk": {
                    "wi": np.array(
                        [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
                    ),
                    "nri": np.array(
                        [
                            10.92929112,
                            6.47963712,
                            4.60019736,
                            2.05115328,
                            0.0,
                            3.6812556,
                        ]
                    ),
                    "lease_nri": np.array(
                        [
                            10.92929112,
                            6.47963712,
                            4.60019736,
                            2.05115328,
                            0.0,
                            3.6812556,
                        ]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2.73232278, 1.61990928, 1.15004934, 0.51278832, 0.0, 0.9203139]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2.73232278, 1.61990928, 1.15004934, 0.51278832, 0.0, 0.9203139]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [
                            -2.73232278,
                            -1.61990928,
                            -1.15004934,
                            -0.51278832,
                            -0.0,
                            -0.9203139,
                        ]
                    ),
                    "lease_nri_minus_one": np.array(
                        [
                            -2.73232278,
                            -1.61990928,
                            -1.15004934,
                            -0.51278832,
                            -0.0,
                            -0.9203139,
                        ]
                    ),
                    "100_pct_wi": np.array(
                        [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
                    ),
                },
                "sales": {
                    "wi": np.array(
                        [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
                    ),
                    "nri": np.array(
                        [
                            10.92929112,
                            6.47963712,
                            4.60019736,
                            2.05115328,
                            0.0,
                            3.6812556,
                        ]
                    ),
                    "lease_nri": np.array(
                        [
                            10.92929112,
                            6.47963712,
                            4.60019736,
                            2.05115328,
                            0.0,
                            3.6812556,
                        ]
                    ),
                    "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "one_minus_nri": np.array(
                        [2.73232278, 1.61990928, 1.15004934, 0.51278832, 0.0, 0.9203139]
                    ),
                    "one_minus_lease_nri": np.array(
                        [2.73232278, 1.61990928, 1.15004934, 0.51278832, 0.0, 0.9203139]
                    ),
                    "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "nri_minus_one": np.array(
                        [
                            -2.73232278,
                            -1.61990928,
                            -1.15004934,
                            -0.51278832,
                            -0.0,
                            -0.9203139,
                        ]
                    ),
                    "lease_nri_minus_one": np.array(
                        [
                            -2.73232278,
                            -1.61990928,
                            -1.15004934,
                            -0.51278832,
                            -0.0,
                            -0.9203139,
                        ]
                    ),
                    "100_pct_wi": np.array(
                        [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
                    ),
                },
            },
        },
        "boe": {
            "well_head": {
                "total": np.array(
                    [
                        13560.16666667,
                        5667.33333333,
                        3254.83333333,
                        2516.0,
                        2340.0,
                        2448.5,
                    ]
                ),
                "wi": np.array(
                    [
                        13560.16666667,
                        5667.33333333,
                        3254.83333333,
                        2516.0,
                        2340.0,
                        2448.5,
                    ]
                ),
                "nri": np.array(
                    [
                        10848.13333333,
                        4533.86666667,
                        2603.86666667,
                        2012.8,
                        1872.0,
                        1958.8,
                    ]
                ),
                "lease_nri": np.array(
                    [
                        10848.13333333,
                        4533.86666667,
                        2603.86666667,
                        2012.8,
                        1872.0,
                        1958.8,
                    ]
                ),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array(
                    [2712.03333333, 1133.46666667, 650.96666667, 503.2, 468.0, 489.7]
                ),
                "one_minus_lease_nri": np.array(
                    [2712.03333333, 1133.46666667, 650.96666667, 503.2, 468.0, 489.7]
                ),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array(
                    [
                        -2712.03333333,
                        -1133.46666667,
                        -650.96666667,
                        -503.2,
                        -468.0,
                        -489.7,
                    ]
                ),
                "lease_nri_minus_one": np.array(
                    [
                        -2712.03333333,
                        -1133.46666667,
                        -650.96666667,
                        -503.2,
                        -468.0,
                        -489.7,
                    ]
                ),
                "100_pct_wi": np.array(
                    [
                        13560.16666667,
                        5667.33333333,
                        3254.83333333,
                        2516.0,
                        2340.0,
                        2448.5,
                    ]
                ),
            },
            "unshrunk": {
                "total": np.array(
                    [13401.56565, 5597.0244, 3212.60445, 2486.5236, 2316.6, 2416.26825]
                ),
                "wi": np.array(
                    [13401.56565, 5597.0244, 3212.60445, 2486.5236, 2316.6, 2416.26825]
                ),
                "nri": np.array(
                    [
                        10721.25252,
                        4477.61952,
                        2570.08356,
                        1989.21888,
                        1853.28,
                        1933.0146,
                    ]
                ),
                "lease_nri": np.array(
                    [
                        10721.25252,
                        4477.61952,
                        2570.08356,
                        1989.21888,
                        1853.28,
                        1933.0146,
                    ]
                ),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array(
                    [2680.31313, 1119.40488, 642.52089, 497.30472, 463.32, 483.25365]
                ),
                "one_minus_lease_nri": np.array(
                    [2680.31313, 1119.40488, 642.52089, 497.30472, 463.32, 483.25365]
                ),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array(
                    [
                        -2680.31313,
                        -1119.40488,
                        -642.52089,
                        -497.30472,
                        -463.32,
                        -483.25365,
                    ]
                ),
                "lease_nri_minus_one": np.array(
                    [
                        -2680.31313,
                        -1119.40488,
                        -642.52089,
                        -497.30472,
                        -463.32,
                        -483.25365,
                    ]
                ),
                "100_pct_wi": np.array(
                    [13401.56565, 5597.0244, 3212.60445, 2486.5236, 2316.6, 2416.26825]
                ),
            },
            "sales": {
                "total": np.array(
                    [
                        13294.8732213,
                        5557.2532488,
                        3191.9788989,
                        2466.7862472,
                        2293.434,
                        2401.3087065,
                    ]
                ),
                "wi": np.array(
                    [
                        13294.8732213,
                        5557.2532488,
                        3191.9788989,
                        2466.7862472,
                        2293.434,
                        2401.3087065,
                    ]
                ),
                "nri": np.array(
                    [
                        10635.89857704,
                        4445.80259904,
                        2553.58311912,
                        1973.42899776,
                        1834.7472,
                        1921.0469652,
                    ]
                ),
                "lease_nri": np.array(
                    [
                        10635.89857704,
                        4445.80259904,
                        2553.58311912,
                        1973.42899776,
                        1834.7472,
                        1921.0469652,
                    ]
                ),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array(
                    [
                        2658.97464426,
                        1111.45064976,
                        638.39577978,
                        493.35724944,
                        458.6868,
                        480.2617413,
                    ]
                ),
                "one_minus_lease_nri": np.array(
                    [
                        2658.97464426,
                        1111.45064976,
                        638.39577978,
                        493.35724944,
                        458.6868,
                        480.2617413,
                    ]
                ),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array(
                    [
                        -2658.97464426,
                        -1111.45064976,
                        -638.39577978,
                        -493.35724944,
                        -458.6868,
                        -480.2617413,
                    ]
                ),
                "lease_nri_minus_one": np.array(
                    [
                        -2658.97464426,
                        -1111.45064976,
                        -638.39577978,
                        -493.35724944,
                        -458.6868,
                        -480.2617413,
                    ]
                ),
                "100_pct_wi": np.array(
                    [
                        13294.8732213,
                        5557.2532488,
                        3191.9788989,
                        2466.7862472,
                        2293.434,
                        2401.3087065,
                    ]
                ),
            },
        },
        "mcfe": {
            "well_head": {
                "total": np.array(
                    [81361.0, 34004.0, 19529.0, 15096.0, 14040.0, 14691.0]
                ),
                "wi": np.array([81361.0, 34004.0, 19529.0, 15096.0, 14040.0, 14691.0]),
                "nri": np.array([65088.8, 27203.2, 15623.2, 12076.8, 11232.0, 11752.8]),
                "lease_nri": np.array(
                    [65088.8, 27203.2, 15623.2, 12076.8, 11232.0, 11752.8]
                ),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array(
                    [16272.2, 6800.8, 3905.8, 3019.2, 2808.0, 2938.2]
                ),
                "one_minus_lease_nri": np.array(
                    [16272.2, 6800.8, 3905.8, 3019.2, 2808.0, 2938.2]
                ),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array(
                    [-16272.2, -6800.8, -3905.8, -3019.2, -2808.0, -2938.2]
                ),
                "lease_nri_minus_one": np.array(
                    [-16272.2, -6800.8, -3905.8, -3019.2, -2808.0, -2938.2]
                ),
                "100_pct_wi": np.array(
                    [81361.0, 34004.0, 19529.0, 15096.0, 14040.0, 14691.0]
                ),
            },
            "unshrunk": {
                "total": np.array(
                    [
                        80409.3939,
                        33582.1464,
                        19275.6267,
                        14919.1416,
                        13899.6,
                        14497.6095,
                    ]
                ),
                "wi": np.array(
                    [
                        80409.3939,
                        33582.1464,
                        19275.6267,
                        14919.1416,
                        13899.6,
                        14497.6095,
                    ]
                ),
                "nri": np.array(
                    [
                        64327.51512,
                        26865.71712,
                        15420.50136,
                        11935.31328,
                        11119.68,
                        11598.0876,
                    ]
                ),
                "lease_nri": np.array(
                    [
                        64327.51512,
                        26865.71712,
                        15420.50136,
                        11935.31328,
                        11119.68,
                        11598.0876,
                    ]
                ),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array(
                    [
                        16081.87878,
                        6716.42928,
                        3855.12534,
                        2983.82832,
                        2779.92,
                        2899.5219,
                    ]
                ),
                "one_minus_lease_nri": np.array(
                    [
                        16081.87878,
                        6716.42928,
                        3855.12534,
                        2983.82832,
                        2779.92,
                        2899.5219,
                    ]
                ),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array(
                    [
                        -16081.87878,
                        -6716.42928,
                        -3855.12534,
                        -2983.82832,
                        -2779.92,
                        -2899.5219,
                    ]
                ),
                "lease_nri_minus_one": np.array(
                    [
                        -16081.87878,
                        -6716.42928,
                        -3855.12534,
                        -2983.82832,
                        -2779.92,
                        -2899.5219,
                    ]
                ),
                "100_pct_wi": np.array(
                    [
                        80409.3939,
                        33582.1464,
                        19275.6267,
                        14919.1416,
                        13899.6,
                        14497.6095,
                    ]
                ),
            },
            "sales": {
                "total": np.array(
                    [
                        79769.2393278,
                        33343.5194928,
                        19151.8733934,
                        14800.7174832,
                        13760.604,
                        14407.852239,
                    ]
                ),
                "wi": np.array(
                    [
                        79769.2393278,
                        33343.5194928,
                        19151.8733934,
                        14800.7174832,
                        13760.604,
                        14407.852239,
                    ]
                ),
                "nri": np.array(
                    [
                        63815.39146224,
                        26674.81559424,
                        15321.49871472,
                        11840.57398656,
                        11008.4832,
                        11526.2817912,
                    ]
                ),
                "lease_nri": np.array(
                    [
                        63815.39146224,
                        26674.81559424,
                        15321.49871472,
                        11840.57398656,
                        11008.4832,
                        11526.2817912,
                    ]
                ),
                "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "one_minus_nri": np.array(
                    [
                        15953.84786556,
                        6668.70389856,
                        3830.37467868,
                        2960.14349664,
                        2752.1208,
                        2881.5704478,
                    ]
                ),
                "one_minus_lease_nri": np.array(
                    [
                        15953.84786556,
                        6668.70389856,
                        3830.37467868,
                        2960.14349664,
                        2752.1208,
                        2881.5704478,
                    ]
                ),
                "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "nri_minus_one": np.array(
                    [
                        -15953.84786556,
                        -6668.70389856,
                        -3830.37467868,
                        -2960.14349664,
                        -2752.1208,
                        -2881.5704478,
                    ]
                ),
                "lease_nri_minus_one": np.array(
                    [
                        -15953.84786556,
                        -6668.70389856,
                        -3830.37467868,
                        -2960.14349664,
                        -2752.1208,
                        -2881.5704478,
                    ]
                ),
                "100_pct_wi": np.array(
                    [
                        79769.2393278,
                        33343.5194928,
                        19151.8733934,
                        14800.7174832,
                        13760.604,
                        14407.852239,
                    ]
                ),
            },
        },
    },
}

price_generator = {
    "unecon": {
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
        "price_cap": {"oil": "", "gas": "", "ngl": "", "drip_condensate": ""},
        "price_escalation": {
            "oil": None,
            "gas": None,
            "ngl": None,
            "drip_condensate": None,
        },
    },
    "econ_cap": {
        "price_dict": {
            "oil": np.array([100.0, 100.0, 100.0, 100.0, 100.0, 100.0]),
            "gas": np.array([5.0, 5.0, 5.0, 5.0, 5.0, 5.0]),
            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
            "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        },
        "price_parameter": {
            "oil": "number",
            "gas": "mmbtu",
            "ngl": "ratio_of_oil",
            "drip_condensate": "number",
        },
        "price_cap": {"oil": 80, "gas": 4, "ngl": "", "drip_condensate": ""},
        "price_escalation": {
            "oil": {
                "escalation_type": "add",
                "escalation_values": np.array(
                    [0.0, 0.16666667, 0.33333333, 0.5, 0.66666667, 0.83333333]
                ),
            },
            "gas": None,
            "ngl": None,
            "drip_condensate": None,
        },
    },
    "econ_no_cap": {
        "price_dict": {
            "oil": np.array([100.0, 100.0, 100.0, 100.0, 100.0, 100.0]),
            "gas": np.array([5.0, 5.0, 5.0, 5.0, 5.0, 5.0]),
            "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
            "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        },
        "price_parameter": {
            "oil": "number",
            "gas": "mmbtu",
            "ngl": "ratio_of_oil",
            "drip_condensate": "number",
        },
        "price_cap": {"oil": "", "gas": "", "ngl": "", "drip_condensate": ""},
        "price_escalation": {
            "oil": {
                "escalation_type": "add",
                "escalation_values": np.array(
                    [0.0, 0.16666667, 0.33333333, 0.5, 0.66666667, 0.83333333]
                ),
            },
            "gas": None,
            "ngl": None,
            "drip_condensate": None,
        },
    },
}

differential_generator = {
    "unecon": {
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
    "econ_no_differential": {
        "diff_dict": {
            "differentials_1": {
                "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            },
            "differentials_2": {
                "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            },
            "differentials_3": {
                "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
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
    "econ_differential": {
        "diff_dict": {
            "differentials_1": {
                "oil": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                "gas": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                "ngl": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                "drip_condensate": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
            },
            "differentials_2": {
                "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            },
            "differentials_3": {
                "oil": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "gas": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "ngl": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                "drip_condensate": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
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


def revenue_params(unecon_bool=False, has_cap=False, has_differential=False):
    if unecon_bool:
        return (
            volume_dict_generator["unecon"],
            price_generator["unecon"],
            differential_generator["unecon"],
        )
    else:
        return (
            volume_dict_generator["econ"],
            price_generator["econ_cap"] if has_cap else price_generator["econ_no_cap"],
            differential_generator["econ_differential"]
            if has_differential
            else differential_generator["econ_no_differential"],
        )


def revenue_results(unecon_bool=False, has_cap=False, has_differential=False):
    if unecon_bool:
        return {
            "revenue_dict": {
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
                    "100_pct_wi_revenue": np.array([0.0]),
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
                    "100_pct_wi_revenue": np.array([0.0]),
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
                    "100_pct_wi_revenue": np.array([0.0]),
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
                    "100_pct_wi_revenue": np.array([0.0]),
                },
            }
        }
    elif not (has_cap or has_differential):
        return {
            "revenue_dict": {
                "oil": {
                    "original_price": np.array(
                        [
                            100.0,
                            100.16666667,
                            100.33333333,
                            100.5,
                            100.66666667,
                            100.83333333,
                        ]
                    ),
                    "differentials_1": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "price_after_diff": np.array(
                        [
                            100.0,
                            100.16666667,
                            100.33333333,
                            100.5,
                            100.66666667,
                            100.83333333,
                        ]
                    ),
                    "net_revenue": np.array(
                        [
                            881070.696,
                            336930.93721121,
                            179130.13271405,
                            163904.0832,
                            184697.88480612,
                            131716.29239565,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [
                            1101338.37,
                            421163.67151402,
                            223912.66589256,
                            204880.104,
                            230872.35600764,
                            164645.36549456,
                        ]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                1101338.37,
                                421163.67151402,
                                223912.66589256,
                                204880.104,
                                230872.35600764,
                                164645.36549456,
                            ]
                        ),
                        "nri": np.array(
                            [
                                881070.696,
                                336930.93721121,
                                179130.13271405,
                                163904.0832,
                                184697.88480612,
                                131716.29239565,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                881070.696,
                                336930.93721121,
                                179130.13271405,
                                163904.0832,
                                184697.88480612,
                                131716.29239565,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                220267.674,
                                84232.7343028,
                                44782.53317851,
                                40976.0208,
                                46174.47120153,
                                32929.07309891,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                220267.674,
                                84232.7343028,
                                44782.53317851,
                                40976.0208,
                                46174.47120153,
                                32929.07309891,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -220267.674,
                                -84232.7343028,
                                -44782.53317851,
                                -40976.0208,
                                -46174.47120153,
                                -32929.07309891,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -220267.674,
                                -84232.7343028,
                                -44782.53317851,
                                -40976.0208,
                                -46174.47120153,
                                -32929.07309891,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                1101338.37,
                                421163.67151402,
                                223912.66589256,
                                204880.104,
                                230872.35600764,
                                164645.36549456,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [
                            1101338.37,
                            421163.67151402,
                            223912.66589256,
                            204880.104,
                            230872.35600764,
                            164645.36549456,
                        ]
                    ),
                },
                "gas": {
                    "original_price": np.array([5.0, 5.0, 5.0, 5.0, 5.0, 5.0]),
                    "differentials_1": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "price_after_diff": np.array([5.0, 5.0, 5.0, 5.0, 5.0, 5.0]),
                    "net_revenue": np.array(
                        [
                            54099.991044,
                            32074.203744,
                            22770.976932,
                            10153.208736,
                            0.0,
                            18222.21522,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [
                            67624.988805,
                            40092.75468,
                            28463.721165,
                            12691.51092,
                            0.0,
                            22777.769025,
                        ]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                67624.988805,
                                40092.75468,
                                28463.721165,
                                12691.51092,
                                0.0,
                                22777.769025,
                            ]
                        ),
                        "nri": np.array(
                            [
                                54099.991044,
                                32074.203744,
                                22770.976932,
                                10153.208736,
                                0.0,
                                18222.21522,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                54099.991044,
                                32074.203744,
                                22770.976932,
                                10153.208736,
                                0.0,
                                18222.21522,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                13524.997761,
                                8018.550936,
                                5692.744233,
                                2538.302184,
                                0.0,
                                4555.553805,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                13524.997761,
                                8018.550936,
                                5692.744233,
                                2538.302184,
                                0.0,
                                4555.553805,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -13524.997761,
                                -8018.550936,
                                -5692.744233,
                                -2538.302184,
                                -0.0,
                                -4555.553805,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -13524.997761,
                                -8018.550936,
                                -5692.744233,
                                -2538.302184,
                                -0.0,
                                -4555.553805,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                67624.988805,
                                40092.75468,
                                28463.721165,
                                12691.51092,
                                0.0,
                                22777.769025,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [
                            67624.988805,
                            40092.75468,
                            28463.721165,
                            12691.51092,
                            0.0,
                            22777.769025,
                        ]
                    ),
                },
                "ngl": {
                    "original_price": np.array(
                        [
                            100.0,
                            100.16666667,
                            100.33333333,
                            100.5,
                            100.66666667,
                            100.83333333,
                        ]
                    ),
                    "differentials_1": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "price_after_diff": np.array(
                        [
                            100.0,
                            100.16666667,
                            100.33333333,
                            100.5,
                            100.66666667,
                            100.83333333,
                        ]
                    ),
                    "net_revenue": np.array(
                        [
                            1092.929112,
                            649.04365154,
                            461.5531351,
                            206.14090464,
                            0.0,
                            371.19327299,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [
                            1366.16139,
                            811.30456443,
                            576.94141888,
                            257.6761308,
                            0.0,
                            463.99159123,
                        ]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                1366.16139,
                                811.30456443,
                                576.94141888,
                                257.6761308,
                                0.0,
                                463.99159123,
                            ]
                        ),
                        "nri": np.array(
                            [
                                1092.929112,
                                649.04365154,
                                461.5531351,
                                206.14090464,
                                0.0,
                                371.19327299,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                1092.929112,
                                649.04365154,
                                461.5531351,
                                206.14090464,
                                0.0,
                                371.19327299,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                273.232278,
                                162.26091289,
                                115.38828378,
                                51.53522616,
                                0.0,
                                92.79831825,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                273.232278,
                                162.26091289,
                                115.38828378,
                                51.53522616,
                                0.0,
                                92.79831825,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -273.232278,
                                -162.26091289,
                                -115.38828378,
                                -51.53522616,
                                -0.0,
                                -92.79831825,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -273.232278,
                                -162.26091289,
                                -115.38828378,
                                -51.53522616,
                                -0.0,
                                -92.79831825,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                1366.16139,
                                811.30456443,
                                576.94141888,
                                257.6761308,
                                0.0,
                                463.99159123,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [
                            1366.16139,
                            811.30456443,
                            576.94141888,
                            257.6761308,
                            0.0,
                            463.99159123,
                        ]
                    ),
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
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                        "lease_nri_minus_one": np.array(
                            [-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]
                        ),
                        "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    },
                    "100_pct_wi_revenue": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
            }
        }
    elif has_cap and has_differential:
        return {
            "revenue_dict": {
                "oil": {
                    "original_price": np.array([80.0, 80.0, 80.0, 80.0, 80.0, 80.0]),
                    "differentials_1": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "price_after_diff": np.array([81.0, 81.0, 81.0, 81.0, 81.0, 81.0]),
                    "net_revenue": np.array(
                        [
                            713667.26376,
                            272459.9592,
                            144613.36296,
                            132101.7984,
                            148614.5232,
                            105808.45968,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [
                            892084.0797,
                            340574.949,
                            180766.7037,
                            165127.248,
                            185768.154,
                            132260.5746,
                        ]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                892084.0797,
                                340574.949,
                                180766.7037,
                                165127.248,
                                185768.154,
                                132260.5746,
                            ]
                        ),
                        "nri": np.array(
                            [
                                713667.26376,
                                272459.9592,
                                144613.36296,
                                132101.7984,
                                148614.5232,
                                105808.45968,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                713667.26376,
                                272459.9592,
                                144613.36296,
                                132101.7984,
                                148614.5232,
                                105808.45968,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                178416.81594,
                                68114.9898,
                                36153.34074,
                                33025.4496,
                                37153.6308,
                                26452.11492,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                178416.81594,
                                68114.9898,
                                36153.34074,
                                33025.4496,
                                37153.6308,
                                26452.11492,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -178416.81594,
                                -68114.9898,
                                -36153.34074,
                                -33025.4496,
                                -37153.6308,
                                -26452.11492,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -178416.81594,
                                -68114.9898,
                                -36153.34074,
                                -33025.4496,
                                -37153.6308,
                                -26452.11492,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                892084.0797,
                                340574.949,
                                180766.7037,
                                165127.248,
                                185768.154,
                                132260.5746,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [
                            892084.0797,
                            340574.949,
                            180766.7037,
                            165127.248,
                            185768.154,
                            132260.5746,
                        ]
                    ),
                },
                "gas": {
                    "original_price": np.array([4.0, 4.0, 4.0, 4.0, 4.0, 4.0]),
                    "differentials_1": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "price_after_diff": np.array([5.0, 5.0, 5.0, 5.0, 5.0, 5.0]),
                    "net_revenue": np.array(
                        [
                            54099.991044,
                            32074.203744,
                            22770.976932,
                            10153.208736,
                            0.0,
                            18222.21522,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [
                            67624.988805,
                            40092.75468,
                            28463.721165,
                            12691.51092,
                            0.0,
                            22777.769025,
                        ]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                67624.988805,
                                40092.75468,
                                28463.721165,
                                12691.51092,
                                0.0,
                                22777.769025,
                            ]
                        ),
                        "nri": np.array(
                            [
                                54099.991044,
                                32074.203744,
                                22770.976932,
                                10153.208736,
                                0.0,
                                18222.21522,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                54099.991044,
                                32074.203744,
                                22770.976932,
                                10153.208736,
                                0.0,
                                18222.21522,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                13524.997761,
                                8018.550936,
                                5692.744233,
                                2538.302184,
                                0.0,
                                4555.553805,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                13524.997761,
                                8018.550936,
                                5692.744233,
                                2538.302184,
                                0.0,
                                4555.553805,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -13524.997761,
                                -8018.550936,
                                -5692.744233,
                                -2538.302184,
                                -0.0,
                                -4555.553805,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -13524.997761,
                                -8018.550936,
                                -5692.744233,
                                -2538.302184,
                                -0.0,
                                -4555.553805,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                67624.988805,
                                40092.75468,
                                28463.721165,
                                12691.51092,
                                0.0,
                                22777.769025,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [
                            67624.988805,
                            40092.75468,
                            28463.721165,
                            12691.51092,
                            0.0,
                            22777.769025,
                        ]
                    ),
                },
                "ngl": {
                    "original_price": np.array([80.0, 80.0, 80.0, 80.0, 80.0, 80.0]),
                    "differentials_1": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "price_after_diff": np.array([81.0, 81.0, 81.0, 81.0, 81.0, 81.0]),
                    "net_revenue": np.array(
                        [
                            885.27258072,
                            524.85060672,
                            372.61598616,
                            166.14341568,
                            0.0,
                            298.1817036,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [
                            1106.5907259,
                            656.0632584,
                            465.7699827,
                            207.6792696,
                            0.0,
                            372.7271295,
                        ]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                1106.5907259,
                                656.0632584,
                                465.7699827,
                                207.6792696,
                                0.0,
                                372.7271295,
                            ]
                        ),
                        "nri": np.array(
                            [
                                885.27258072,
                                524.85060672,
                                372.61598616,
                                166.14341568,
                                0.0,
                                298.1817036,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                885.27258072,
                                524.85060672,
                                372.61598616,
                                166.14341568,
                                0.0,
                                298.1817036,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                221.31814518,
                                131.21265168,
                                93.15399654,
                                41.53585392,
                                0.0,
                                74.5454259,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                221.31814518,
                                131.21265168,
                                93.15399654,
                                41.53585392,
                                0.0,
                                74.5454259,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -221.31814518,
                                -131.21265168,
                                -93.15399654,
                                -41.53585392,
                                -0.0,
                                -74.5454259,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -221.31814518,
                                -131.21265168,
                                -93.15399654,
                                -41.53585392,
                                -0.0,
                                -74.5454259,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                1106.5907259,
                                656.0632584,
                                465.7699827,
                                207.6792696,
                                0.0,
                                372.7271295,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [
                            1106.5907259,
                            656.0632584,
                            465.7699827,
                            207.6792696,
                            0.0,
                            372.7271295,
                        ]
                    ),
                },
                "drip_condensate": {
                    "original_price": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_1": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "price_after_diff": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "net_revenue": np.array(
                        [
                            10.92929112,
                            6.47963712,
                            4.60019736,
                            2.05115328,
                            0.0,
                            3.6812556,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                13.6616139,
                                8.0995464,
                                5.7502467,
                                2.5639416,
                                0.0,
                                4.6015695,
                            ]
                        ),
                        "nri": np.array(
                            [
                                10.92929112,
                                6.47963712,
                                4.60019736,
                                2.05115328,
                                0.0,
                                3.6812556,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                10.92929112,
                                6.47963712,
                                4.60019736,
                                2.05115328,
                                0.0,
                                3.6812556,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                2.73232278,
                                1.61990928,
                                1.15004934,
                                0.51278832,
                                0.0,
                                0.9203139,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                2.73232278,
                                1.61990928,
                                1.15004934,
                                0.51278832,
                                0.0,
                                0.9203139,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -2.73232278,
                                -1.61990928,
                                -1.15004934,
                                -0.51278832,
                                -0.0,
                                -0.9203139,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -2.73232278,
                                -1.61990928,
                                -1.15004934,
                                -0.51278832,
                                -0.0,
                                -0.9203139,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                13.6616139,
                                8.0995464,
                                5.7502467,
                                2.5639416,
                                0.0,
                                4.6015695,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
                    ),
                },
            }
        }
    elif has_differential:
        return {
            "revenue_dict": {
                "oil": {
                    "original_price": np.array(
                        [
                            100.0,
                            100.16666667,
                            100.33333333,
                            100.5,
                            100.66666667,
                            100.83333333,
                        ]
                    ),
                    "differentials_1": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "price_after_diff": np.array(
                        [
                            101.0,
                            101.16666667,
                            101.33333333,
                            101.5,
                            101.66666667,
                            101.83333333,
                        ]
                    ),
                    "net_revenue": np.array(
                        [
                            889881.40296,
                            340294.64041121,
                            180915.48287405,
                            165534.9696,
                            186532.63200612,
                            133022.56967565,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [
                            1112351.7537,
                            425368.30051402,
                            226144.35359256,
                            206918.712,
                            233165.79000764,
                            166278.21209456,
                        ]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                1112351.7537,
                                425368.30051402,
                                226144.35359256,
                                206918.712,
                                233165.79000764,
                                166278.21209456,
                            ]
                        ),
                        "nri": np.array(
                            [
                                889881.40296,
                                340294.64041121,
                                180915.48287405,
                                165534.9696,
                                186532.63200612,
                                133022.56967565,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                889881.40296,
                                340294.64041121,
                                180915.48287405,
                                165534.9696,
                                186532.63200612,
                                133022.56967565,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                222470.35074,
                                85073.6601028,
                                45228.87071851,
                                41383.7424,
                                46633.15800153,
                                33255.64241891,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                222470.35074,
                                85073.6601028,
                                45228.87071851,
                                41383.7424,
                                46633.15800153,
                                33255.64241891,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -222470.35074,
                                -85073.6601028,
                                -45228.87071851,
                                -41383.7424,
                                -46633.15800153,
                                -33255.64241891,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -222470.35074,
                                -85073.6601028,
                                -45228.87071851,
                                -41383.7424,
                                -46633.15800153,
                                -33255.64241891,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                1112351.7537,
                                425368.30051402,
                                226144.35359256,
                                206918.712,
                                233165.79000764,
                                166278.21209456,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [
                            1112351.7537,
                            425368.30051402,
                            226144.35359256,
                            206918.712,
                            233165.79000764,
                            166278.21209456,
                        ]
                    ),
                },
                "gas": {
                    "original_price": np.array([5.0, 5.0, 5.0, 5.0, 5.0, 5.0]),
                    "differentials_1": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "price_after_diff": np.array([6.0, 6.0, 6.0, 6.0, 6.0, 6.0]),
                    "net_revenue": np.array(
                        [
                            64919.9892528,
                            38489.0444928,
                            27325.1723184,
                            12183.8504832,
                            0.0,
                            21866.658264,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [
                            81149.986566,
                            48111.305616,
                            34156.465398,
                            15229.813104,
                            0.0,
                            27333.32283,
                        ]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                81149.986566,
                                48111.305616,
                                34156.465398,
                                15229.813104,
                                0.0,
                                27333.32283,
                            ]
                        ),
                        "nri": np.array(
                            [
                                64919.9892528,
                                38489.0444928,
                                27325.1723184,
                                12183.8504832,
                                0.0,
                                21866.658264,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                64919.9892528,
                                38489.0444928,
                                27325.1723184,
                                12183.8504832,
                                0.0,
                                21866.658264,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                16229.9973132,
                                9622.2611232,
                                6831.2930796,
                                3045.9626208,
                                0.0,
                                5466.664566,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                16229.9973132,
                                9622.2611232,
                                6831.2930796,
                                3045.9626208,
                                0.0,
                                5466.664566,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -16229.9973132,
                                -9622.2611232,
                                -6831.2930796,
                                -3045.9626208,
                                -0.0,
                                -5466.664566,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -16229.9973132,
                                -9622.2611232,
                                -6831.2930796,
                                -3045.9626208,
                                -0.0,
                                -5466.664566,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                81149.986566,
                                48111.305616,
                                34156.465398,
                                15229.813104,
                                0.0,
                                27333.32283,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [
                            81149.986566,
                            48111.305616,
                            34156.465398,
                            15229.813104,
                            0.0,
                            27333.32283,
                        ]
                    ),
                },
                "ngl": {
                    "original_price": np.array(
                        [
                            100.0,
                            100.16666667,
                            100.33333333,
                            100.5,
                            100.66666667,
                            100.83333333,
                        ]
                    ),
                    "differentials_1": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "price_after_diff": np.array(
                        [
                            101.0,
                            101.16666667,
                            101.33333333,
                            101.5,
                            101.66666667,
                            101.83333333,
                        ]
                    ),
                    "net_revenue": np.array(
                        [
                            1103.85840312,
                            655.52328866,
                            466.15333246,
                            208.19205792,
                            0.0,
                            374.87452859,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [
                            1379.8230039,
                            819.40411083,
                            582.69166558,
                            260.2400724,
                            0.0,
                            468.59316073,
                        ]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                1379.8230039,
                                819.40411083,
                                582.69166558,
                                260.2400724,
                                0.0,
                                468.59316073,
                            ]
                        ),
                        "nri": np.array(
                            [
                                1103.85840312,
                                655.52328866,
                                466.15333246,
                                208.19205792,
                                0.0,
                                374.87452859,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                1103.85840312,
                                655.52328866,
                                466.15333246,
                                208.19205792,
                                0.0,
                                374.87452859,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                275.96460078,
                                163.88082217,
                                116.53833312,
                                52.04801448,
                                0.0,
                                93.71863215,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                275.96460078,
                                163.88082217,
                                116.53833312,
                                52.04801448,
                                0.0,
                                93.71863215,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -275.96460078,
                                -163.88082217,
                                -116.53833312,
                                -52.04801448,
                                -0.0,
                                -93.71863215,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -275.96460078,
                                -163.88082217,
                                -116.53833312,
                                -52.04801448,
                                -0.0,
                                -93.71863215,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                1379.8230039,
                                819.40411083,
                                582.69166558,
                                260.2400724,
                                0.0,
                                468.59316073,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [
                            1379.8230039,
                            819.40411083,
                            582.69166558,
                            260.2400724,
                            0.0,
                            468.59316073,
                        ]
                    ),
                },
                "drip_condensate": {
                    "original_price": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_1": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "price_after_diff": np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
                    "net_revenue": np.array(
                        [
                            10.92929112,
                            6.47963712,
                            4.60019736,
                            2.05115328,
                            0.0,
                            3.6812556,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                13.6616139,
                                8.0995464,
                                5.7502467,
                                2.5639416,
                                0.0,
                                4.6015695,
                            ]
                        ),
                        "nri": np.array(
                            [
                                10.92929112,
                                6.47963712,
                                4.60019736,
                                2.05115328,
                                0.0,
                                3.6812556,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                10.92929112,
                                6.47963712,
                                4.60019736,
                                2.05115328,
                                0.0,
                                3.6812556,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                2.73232278,
                                1.61990928,
                                1.15004934,
                                0.51278832,
                                0.0,
                                0.9203139,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                2.73232278,
                                1.61990928,
                                1.15004934,
                                0.51278832,
                                0.0,
                                0.9203139,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -2.73232278,
                                -1.61990928,
                                -1.15004934,
                                -0.51278832,
                                -0.0,
                                -0.9203139,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -2.73232278,
                                -1.61990928,
                                -1.15004934,
                                -0.51278832,
                                -0.0,
                                -0.9203139,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                13.6616139,
                                8.0995464,
                                5.7502467,
                                2.5639416,
                                0.0,
                                4.6015695,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [13.6616139, 8.0995464, 5.7502467, 2.5639416, 0.0, 4.6015695]
                    ),
                },
            }
        }
    elif has_cap:
        return {
            "revenue_dict": {
                "oil": {
                    "original_price": np.array([80.0, 80.0, 80.0, 80.0, 80.0, 80.0]),
                    "differentials_1": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "price_after_diff": np.array([80.0, 80.0, 80.0, 80.0, 80.0, 80.0]),
                    "net_revenue": np.array(
                        [
                            704856.5568,
                            269096.256,
                            142828.0128,
                            130470.912,
                            146779.776,
                            104502.1824,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [
                            881070.696,
                            336370.32,
                            178535.016,
                            163088.64,
                            183474.72,
                            130627.728,
                        ]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                881070.696,
                                336370.32,
                                178535.016,
                                163088.64,
                                183474.72,
                                130627.728,
                            ]
                        ),
                        "nri": np.array(
                            [
                                704856.5568,
                                269096.256,
                                142828.0128,
                                130470.912,
                                146779.776,
                                104502.1824,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                704856.5568,
                                269096.256,
                                142828.0128,
                                130470.912,
                                146779.776,
                                104502.1824,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                176214.1392,
                                67274.064,
                                35707.0032,
                                32617.728,
                                36694.944,
                                26125.5456,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                176214.1392,
                                67274.064,
                                35707.0032,
                                32617.728,
                                36694.944,
                                26125.5456,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -176214.1392,
                                -67274.064,
                                -35707.0032,
                                -32617.728,
                                -36694.944,
                                -26125.5456,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -176214.1392,
                                -67274.064,
                                -35707.0032,
                                -32617.728,
                                -36694.944,
                                -26125.5456,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                881070.696,
                                336370.32,
                                178535.016,
                                163088.64,
                                183474.72,
                                130627.728,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [
                            881070.696,
                            336370.32,
                            178535.016,
                            163088.64,
                            183474.72,
                            130627.728,
                        ]
                    ),
                },
                "gas": {
                    "original_price": np.array([4.0, 4.0, 4.0, 4.0, 4.0, 4.0]),
                    "differentials_1": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "price_after_diff": np.array([4.0, 4.0, 4.0, 4.0, 4.0, 4.0]),
                    "net_revenue": np.array(
                        [
                            43279.9928352,
                            25659.3629952,
                            18216.7815456,
                            8122.5669888,
                            0.0,
                            14577.772176,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [
                            54099.991044,
                            32074.203744,
                            22770.976932,
                            10153.208736,
                            0.0,
                            18222.21522,
                        ]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                54099.991044,
                                32074.203744,
                                22770.976932,
                                10153.208736,
                                0.0,
                                18222.21522,
                            ]
                        ),
                        "nri": np.array(
                            [
                                43279.9928352,
                                25659.3629952,
                                18216.7815456,
                                8122.5669888,
                                0.0,
                                14577.772176,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                43279.9928352,
                                25659.3629952,
                                18216.7815456,
                                8122.5669888,
                                0.0,
                                14577.772176,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                10819.9982088,
                                6414.8407488,
                                4554.1953864,
                                2030.6417472,
                                0.0,
                                3644.443044,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                10819.9982088,
                                6414.8407488,
                                4554.1953864,
                                2030.6417472,
                                0.0,
                                3644.443044,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -10819.9982088,
                                -6414.8407488,
                                -4554.1953864,
                                -2030.6417472,
                                -0.0,
                                -3644.443044,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -10819.9982088,
                                -6414.8407488,
                                -4554.1953864,
                                -2030.6417472,
                                -0.0,
                                -3644.443044,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                54099.991044,
                                32074.203744,
                                22770.976932,
                                10153.208736,
                                0.0,
                                18222.21522,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [
                            54099.991044,
                            32074.203744,
                            22770.976932,
                            10153.208736,
                            0.0,
                            18222.21522,
                        ]
                    ),
                },
                "ngl": {
                    "original_price": np.array([80.0, 80.0, 80.0, 80.0, 80.0, 80.0]),
                    "differentials_1": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_2": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differentials_3": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "differential": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    "price_after_diff": np.array([80.0, 80.0, 80.0, 80.0, 80.0, 80.0]),
                    "net_revenue": np.array(
                        [
                            874.3432896,
                            518.3709696,
                            368.0157888,
                            164.0922624,
                            0.0,
                            294.500448,
                        ]
                    ),
                    "gross_revenue": np.array(
                        [
                            1092.929112,
                            647.963712,
                            460.019736,
                            205.115328,
                            0.0,
                            368.12556,
                        ]
                    ),
                    "ownership": {
                        "wi": np.array(
                            [
                                1092.929112,
                                647.963712,
                                460.019736,
                                205.115328,
                                0.0,
                                368.12556,
                            ]
                        ),
                        "nri": np.array(
                            [
                                874.3432896,
                                518.3709696,
                                368.0157888,
                                164.0922624,
                                0.0,
                                294.500448,
                            ]
                        ),
                        "lease_nri": np.array(
                            [
                                874.3432896,
                                518.3709696,
                                368.0157888,
                                164.0922624,
                                0.0,
                                294.500448,
                            ]
                        ),
                        "one_minus_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "one_minus_nri": np.array(
                            [
                                218.5858224,
                                129.5927424,
                                92.0039472,
                                41.0230656,
                                0.0,
                                73.625112,
                            ]
                        ),
                        "one_minus_lease_nri": np.array(
                            [
                                218.5858224,
                                129.5927424,
                                92.0039472,
                                41.0230656,
                                0.0,
                                73.625112,
                            ]
                        ),
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array(
                            [
                                -218.5858224,
                                -129.5927424,
                                -92.0039472,
                                -41.0230656,
                                -0.0,
                                -73.625112,
                            ]
                        ),
                        "lease_nri_minus_one": np.array(
                            [
                                -218.5858224,
                                -129.5927424,
                                -92.0039472,
                                -41.0230656,
                                -0.0,
                                -73.625112,
                            ]
                        ),
                        "100_pct_wi": np.array(
                            [
                                1092.929112,
                                647.963712,
                                460.019736,
                                205.115328,
                                0.0,
                                368.12556,
                            ]
                        ),
                    },
                    "100_pct_wi_revenue": np.array(
                        [
                            1092.929112,
                            647.963712,
                            460.019736,
                            205.115328,
                            0.0,
                            368.12556,
                        ]
                    ),
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
                        "wi_minus_one": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                        "nri_minus_one": np.array([-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]),
                        "lease_nri_minus_one": np.array(
                            [-0.0, -0.0, -0.0, -0.0, -0.0, -0.0]
                        ),
                        "100_pct_wi": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                    },
                    "100_pct_wi_revenue": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
                },
            }
        }
    else:
        raise Exception("Wrong Assumptions")
