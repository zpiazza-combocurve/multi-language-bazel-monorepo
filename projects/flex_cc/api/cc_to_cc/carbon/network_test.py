import pandas as pd
import uuid
from bson import ObjectId
import datetime
import pytest
from api.cc_to_cc.carbon.network import network_export, network_edges_export, network_edges_import


@pytest.fixture
def test_network():
    test_network = {
        '_id':
        ObjectId('6463f57b05bfb500218f8ff2'),
        'fluidModels': [ObjectId('62ec5bcfec23a3496058335c'),
                        ObjectId('642c990009e3f300120dd027')],
        'wells': [ObjectId('5e272d3bb78910dd2a1be75a')],
        'facilities': [ObjectId('6463f60505bfb500218f9014'),
                       ObjectId('6463f66405bfb500218f9118')],
        'copiedFrom':
        None,
        'project':
        ObjectId('61c38ef6b43dd00013a58fc7'),
        # Only the user id is contained in the mongo doc, the dict is added in carbon_export
        'createdBy': {
            'id': ObjectId('61c0f6f4a8d7e10013a8550e'),
            'firstName': 'Brandon',
            'lastName': 'Lowe',
        },
        'name':
        'Import/Export Unit Test',
        'nodes': [{
            'id': '6dad314d-b52d-4203-a3d7-7bfc4deb1acd',
            'type': 'oil_tank',
        }, {
            'id': 'f6de439b-f8fe-4e1c-b22c-b9601bce2925',
            'type': 'atmosphere',
        }, {
            'id': '1e11ca31-eb09-4c57-949d-9db160208531',
            'type': 'liquids_unloading',
        }, {
            'id': 'e1f4d0bd-f3d2-4242-a302-09120eb8f817',
            'type': 'flare',
        }, {
            'id': 'c24a7edf-2f6b-460d-a038-c162fd65cf26',
            'type': 'associated_gas',
        }, {
            'id': 'ee06b5d7-bd7c-4c20-91cf-30af7c89855c',
            'type': 'econ_output',
        }, {
            'id': '397aaf57-e78f-476a-975f-5310530b4407',
            'type': 'capture',
        }, {
            'id': 'node1',
            'type': 'facility',
            'name': 'Link for unit test',
        }, {
            'id': 'node',
            'type': 'facility',
            'name': 'Import/Export Unit Test',
        }, {
            'id': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'type': 'well_group',
        }, {
            'id': '2fcb297d-ef85-4874-99c7-9301f087fea4',
            'type': 'completion',
        }, {
            'id': '1ca9d049-7ac3-4d97-b01f-4c0e7e982047',
            'type': 'drilling',
        }, {
            'id': 'fd24263a-bd52-4fa4-8801-280e22a0aded',
            'type': 'flowback',
        }, {
            'id': '6ca6b299-e93f-42ce-bb83-9c133cb56f67',
            'type': 'custom_calculation',
        }, {
            'id': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'type': 'custom_calculation',
        }],
        'edges': [{
            'id': '68187ca1-57ad-4c11-8d0c-d3e1570a3929',
            'by': 'oil',
            'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'fromHandle': 'oil',
            'to': '6dad314d-b52d-4203-a3d7-7bfc4deb1acd',
            'toHandle': 'oil',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': '9a8f6b66-d9e6-42be-a147-4ca1b02e5e50',
            'by': 'gas',
            'from': '6dad314d-b52d-4203-a3d7-7bfc4deb1acd',
            'fromHandle': 'gas',
            'to': 'f6de439b-f8fe-4e1c-b22c-b9601bce2925',
            'toHandle': 'gas',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'dates',
                    'rows': [{
                        'period': '05/01/2023',
                        'allocation': 100
                    }, {
                        'period': '06/01/2023',
                        'allocation': 50
                    }]
                }
            }
        }, {
            'id': 'a81253ea-4433-47f4-8dcf-0bcd35e99241',
            'by': 'gas',
            'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'fromHandle': 'gas',
            'to': '1e11ca31-eb09-4c57-949d-9db160208531',
            'toHandle': 'gas',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': '882366aa-72f5-4f36-9662-58b233f2e8b3',
            'by': 'gas',
            'from': '1e11ca31-eb09-4c57-949d-9db160208531',
            'fromHandle': 'gas',
            'to': 'e1f4d0bd-f3d2-4242-a302-09120eb8f817',
            'toHandle': 'gas',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': '27919797-ceb3-46db-88a2-e43092da0d08',
            'by': 'gas',
            'from': '1e11ca31-eb09-4c57-949d-9db160208531',
            'fromHandle': 'gas',
            'to': 'c24a7edf-2f6b-460d-a038-c162fd65cf26',
            'toHandle': 'gas',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': '58bcb8f0-e1a8-4622-8452-0a9794b1f3d7',
            'by': 'water',
            'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'fromHandle': 'water',
            'to': 'ee06b5d7-bd7c-4c20-91cf-30af7c89855c',
            'toHandle': 'water',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': '90b7cbfb-c114-4d1b-89ec-963585058bb9',
            'by': 'gas',
            'from': 'c24a7edf-2f6b-460d-a038-c162fd65cf26',
            'fromHandle': 'gas',
            'to': '397aaf57-e78f-476a-975f-5310530b4407',
            'toHandle': 'gas',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': 'e03d3baf-679a-4a4b-ac58-4fd83094780b',
            'by': 'link',
            'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'toFacilityObjectId': '6463f60505bfb500218f9014',
            'fromHandle': 'link',
            'to': 'node1',
            'toHandle': 'link',
            'shape': {
                'vertices': []
            },
            'name': ''
        }, {
            'id': 'e3fa783e-7cb4-4ec5-8f5f-a97405516aed',
            'by': 'oil',
            'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'fromHandle': 'oil',
            'to': 'node',
            'toHandle': '1f51f705-fa5e-4d0c-9fc0-994513a51313',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': 'd4ee8fdb-3672-44c8-97d2-65aaf8924883',
            'by': 'gas',
            'from': 'node',
            'fromHandle': '783f898c-4995-484a-a7f1-cd69feb96247',
            'to': 'f6de439b-f8fe-4e1c-b22c-b9601bce2925',
            'toHandle': 'gas',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': '9fb64fde-bf03-4e7d-97d2-7c2a652d2976',
            'by': 'development',
            'from': '2fcb297d-ef85-4874-99c7-9301f087fea4',
            'to': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'name': ''
        }, {
            'id': '626654c4-f358-490c-a916-f86178f2c1ba',
            'by': 'development',
            'from': '1ca9d049-7ac3-4d97-b01f-4c0e7e982047',
            'to': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'name': ''
        }, {
            'id': '2956fb42-78e5-4665-8cf2-800821327af8',
            'by': 'gas',
            'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'fromHandle': 'gas',
            'to': 'fd24263a-bd52-4fa4-8801-280e22a0aded',
            'toHandle': 'gas',
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': 'c8e8b10f-c772-451d-8af0-017617039242',
            'by': 'gas',
            'from': 'fd24263a-bd52-4fa4-8801-280e22a0aded',
            'fromHandle': 'gas',
            'to': 'ee06b5d7-bd7c-4c20-91cf-30af7c89855c',
            'toHandle': 'gas',
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': '441e0af7-b470-46da-bc3a-ea957a523c49',
            'by': 'link',
            'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'fromHandle': 'link',
            'to': '6ca6b299-e93f-42ce-bb83-9c133cb56f67',
            'toHandle': 'link',
            'name': ''
        }, {
            'id': '6812a2bb-698f-4732-ab3d-ed0be637cdaf',
            'by': 'oil',
            'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'fromHandle': 'oil',
            'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'toHandle': 'Oil',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': '503891da-0a7c-449f-9885-30b9edfdd54f',
            'by': 'gas',
            'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'fromHandle': 'gas',
            'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'toHandle': 'Gas',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': '3d2e5fd5-397b-4f76-91ce-e584a822f7fd',
            'by': 'water',
            'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
            'fromHandle': 'water',
            'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'toHandle': 'Water',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }, {
            'id': 'b4ca119e-2374-49a1-abf6-8c98a4e71421',
            'by': 'gas',
            'from': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'fromHandle': 'Gas',
            'to': '397aaf57-e78f-476a-975f-5310530b4407',
            'toHandle': 'gas',
            'shape': {
                'vertices': []
            },
            'name': '',
            'params': {
                'time_series': {
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'allocation': 100
                    }]
                }
            }
        }],
        'createdAt':
        datetime.datetime(2023, 5, 16, 21, 28, 27, 407000),
        'updatedAt':
        datetime.datetime(2023, 5, 19, 00, 59, 25, 819000),
        '__v':
        0,
    }
    return test_network


@pytest.fixture
def expected_response_node_id_dict():
    expected_response_node_id_dict = {
        '6dad314d-b52d-4203-a3d7-7bfc4deb1acd': 'Import/Export Unit Test_oil tank_1',
        'f6de439b-f8fe-4e1c-b22c-b9601bce2925': 'Import/Export Unit Test_atmosphere_2',
        '1e11ca31-eb09-4c57-949d-9db160208531': 'Import/Export Unit Test_liquids unloading_3',
        'e1f4d0bd-f3d2-4242-a302-09120eb8f817': 'Import/Export Unit Test_flare_4',
        'c24a7edf-2f6b-460d-a038-c162fd65cf26': 'Import/Export Unit Test_associated gas_5',
        'ee06b5d7-bd7c-4c20-91cf-30af7c89855c': 'Import/Export Unit Test_econ output_6',
        '397aaf57-e78f-476a-975f-5310530b4407': 'Import/Export Unit Test_capture_7',
        'node1': 'Import/Export Unit Test_facility_8',
        'node': 'Import/Export Unit Test_facility_9',
        '93dcc305-2dfb-4ad8-af10-8e1f43de120f': 'Import/Export Unit Test_well group_10',
        '2fcb297d-ef85-4874-99c7-9301f087fea4': 'Import/Export Unit Test_completion_11',
        '1ca9d049-7ac3-4d97-b01f-4c0e7e982047': 'Import/Export Unit Test_drilling_12',
        'fd24263a-bd52-4fa4-8801-280e22a0aded': 'Import/Export Unit Test_flowback_13',
        '6ca6b299-e93f-42ce-bb83-9c133cb56f67': 'Import/Export Unit Test_custom calculation_14',
        '75fa021a-bed5-4792-a0dd-a0013c14e9a0': 'Import/Export Unit Test_custom calculation_15',
    }
    return expected_response_node_id_dict


@pytest.fixture
def expected_response_edge_rows():
    expected_response_edge_rows = [
        {
            'Edge ID': 'Import/Export Unit Test_oil_1',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'oil',
            'From Node ID': 'Import/Export Unit Test_well group_10',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_oil tank_1',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_gas_2',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'gas',
            'From Node ID': 'Import/Export Unit Test_oil tank_1',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_atmosphere_2',
            'To Port ID': '',
            'Criteria': 'Dates',
            'Period': '05/01/2023',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_gas_2',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'gas',
            'From Node ID': 'Import/Export Unit Test_oil tank_1',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_atmosphere_2',
            'To Port ID': '',
            'Criteria': 'Dates',
            'Period': '06/01/2023',
            'Allocation': 50,
        },
        {
            'Edge ID': 'Import/Export Unit Test_gas_3',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'gas',
            'From Node ID': 'Import/Export Unit Test_well group_10',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_liquids unloading_3',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_gas_4',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'gas',
            'From Node ID': 'Import/Export Unit Test_liquids unloading_3',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_flare_4',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_gas_5',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'gas',
            'From Node ID': 'Import/Export Unit Test_liquids unloading_3',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_associated gas_5',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_water_6',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'water',
            'From Node ID': 'Import/Export Unit Test_well group_10',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_econ output_6',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_gas_7',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'gas',
            'From Node ID': 'Import/Export Unit Test_associated gas_5',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_capture_7',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_link_8',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'link',
            'From Node ID': 'Import/Export Unit Test_well group_10',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_facility_8',
            'To Port ID': '',
            'Criteria': '',
            'Period': '',
            'Allocation': '',
        },
        {
            'Edge ID': 'Import/Export Unit Test_oil_9',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'oil',
            'From Node ID': 'Import/Export Unit Test_well group_10',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_facility_9',
            'To Port ID': 'Import/Export Unit Test_oil_1',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_gas_10',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'gas',
            'From Node ID': 'Import/Export Unit Test_facility_9',
            'From Port ID': 'Import/Export Unit Test_gas_4',
            'To Node ID': 'Import/Export Unit Test_atmosphere_2',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_development_11',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'development',
            'From Node ID': 'Import/Export Unit Test_completion_11',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_well group_10',
            'To Port ID': '',
            'Criteria': '',
            'Period': '',
            'Allocation': '',
        },
        {
            'Edge ID': 'Import/Export Unit Test_development_12',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'development',
            'From Node ID': 'Import/Export Unit Test_drilling_12',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_well group_10',
            'To Port ID': '',
            'Criteria': '',
            'Period': '',
            'Allocation': '',
        },
        {
            'Edge ID': 'Import/Export Unit Test_gas_13',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'gas',
            'From Node ID': 'Import/Export Unit Test_well group_10',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_flowback_13',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_gas_14',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'gas',
            'From Node ID': 'Import/Export Unit Test_flowback_13',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_econ output_6',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_link_15',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'link',
            'From Node ID': 'Import/Export Unit Test_well group_10',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_custom calculation_14',
            'To Port ID': '',
            'Criteria': '',
            'Period': '',
            'Allocation': '',
        },
        {
            'Edge ID': 'Import/Export Unit Test_oil_16',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'oil',
            'From Node ID': 'Import/Export Unit Test_well group_10',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_custom calculation_15',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_gas_17',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'gas',
            'From Node ID': 'Import/Export Unit Test_well group_10',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_custom calculation_15',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_water_18',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'water',
            'From Node ID': 'Import/Export Unit Test_well group_10',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_custom calculation_15',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
        {
            'Edge ID': 'Import/Export Unit Test_gas_19',
            'Network Name': 'Import/Export Unit Test',
            'Description': '',
            'Type': 'gas',
            'From Node ID': 'Import/Export Unit Test_custom calculation_15',
            'From Port ID': '',
            'To Node ID': 'Import/Export Unit Test_capture_7',
            'To Port ID': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Allocation': 100,
        },
    ]
    return expected_response_edge_rows


@pytest.mark.unittest
def test_network_export(test_network, expected_response_node_id_dict):
    model_id_dict = {
        '6dad314d-b52d-4203-a3d7-7bfc4deb1acd': 'oil tank_1',
        'f6de439b-f8fe-4e1c-b22c-b9601bce2925': 'atmosphere_1',
        '1e11ca31-eb09-4c57-949d-9db160208531': 'liquids unloading_1',
        'e1f4d0bd-f3d2-4242-a302-09120eb8f817': 'flare_1',
        'c24a7edf-2f6b-460d-a038-c162fd65cf26': 'associated gas_1',
        'ee06b5d7-bd7c-4c20-91cf-30af7c89855c': 'econ output_1',
        '397aaf57-e78f-476a-975f-5310530b4407': 'capture_1',
        'node1': 'Link for unit test',
        'node': 'Import/Export Unit Test',
        '93dcc305-2dfb-4ad8-af10-8e1f43de120f': 'well group_1',
        '2fcb297d-ef85-4874-99c7-9301f087fea4': 'completion_1',
        '1ca9d049-7ac3-4d97-b01f-4c0e7e982047': 'drilling_1',
        'fd24263a-bd52-4fa4-8801-280e22a0aded': 'flowback_1',
        '6ca6b299-e93f-42ce-bb83-9c133cb56f67': 'custom calculation_1',
        '75fa021a-bed5-4792-a0dd-a0013c14e9a0': 'custom calculation_2',
    }

    expected_response_export_rows = [{
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_oil tank_1',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Oil Tank',
        'Model ID': 'oil tank_1',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_atmosphere_2',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Atmosphere',
        'Model ID': 'atmosphere_1',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_liquids unloading_3',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Liquids Unloading',
        'Model ID': 'liquids unloading_1',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_flare_4',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Flare',
        'Model ID': 'flare_1',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_associated gas_5',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Associated Gas',
        'Model ID': 'associated gas_1',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_econ output_6',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Econ Output',
        'Model ID': 'econ output_1',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_capture_7',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Capture',
        'Model ID': 'capture_1',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_facility_8',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Facility',
        'Model ID': 'Link for unit test',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_facility_9',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Facility',
        'Model ID': 'Import/Export Unit Test',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_well group_10',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Well Group',
        'Model ID': 'well group_1',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_completion_11',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Completion',
        'Model ID': 'completion_1',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_drilling_12',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Drilling',
        'Model ID': 'drilling_1',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_flowback_13',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Flowback',
        'Model ID': 'flowback_1',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_custom calculation_14',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Custom Calculation',
        'Model ID': 'custom calculation_1',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }, {
        'Created At': '05/16/2023 21:28:27',
        'Created By': 'Brandon Lowe',
        'Node ID': 'Import/Export Unit Test_custom calculation_15',
        'Network Name': 'Import/Export Unit Test',
        'Node Type': 'Custom Calculation',
        'Model ID': 'custom calculation_2',
        'Last Update': '05/19/2023 00:59:25',
        'Updated By': '',
    }]

    response_export_rows, response_node_id_dict = network_export(test_network, [], model_id_dict)

    assert response_export_rows == expected_response_export_rows
    assert response_node_id_dict == expected_response_node_id_dict


# test network_edges_export for each edge type (development, link, flat stream, dates stream)
@pytest.mark.unittest
def test_network_edges_export(test_network, expected_response_node_id_dict, expected_response_edge_rows):
    node_id_dict = expected_response_node_id_dict
    port_id_dict = {
        'node': {
            '1f51f705-fa5e-4d0c-9fc0-994513a51313': 'Import/Export Unit Test_oil_1',
            '783f898c-4995-484a-a7f1-cd69feb96247': 'Import/Export Unit Test_gas_4',
        }
    }
    response = network_edges_export(test_network, node_id_dict, port_id_dict)

    assert response == expected_response_edge_rows


# test network_edges_import for each edge type (development, link, flat stream, dates stream)
@pytest.mark.unittest
def test_network_edges_import(mocker, expected_response_edge_rows):
    # mock the uuid generated in network_import
    mocker.patch('api.cc_to_cc.carbon.network.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id
    edge_df = pd.DataFrame(expected_response_edge_rows)
    one_coll_dict = {
        'Import/Export Unit Test_oil tank_1': 'oil_tank',
        'Import/Export Unit Test_atmosphere_2': 'atmosphere',
        'Import/Export Unit Test_liquids unloading_3': 'liquids_unloading',
        'Import/Export Unit Test_flare_4': 'flare',
        'Import/Export Unit Test_associated gas_5': 'associated_gas',
        'Import/Export Unit Test_econ output_6': 'econ_output',
        'Import/Export Unit Test_capture_7': 'capture',
        'Import/Export Unit Test_facility_8': 'facility',
        'Import/Export Unit Test_facility_9': 'facility',
        'Import/Export Unit Test_well group_10': 'well_group',
        'Import/Export Unit Test_completion_11': 'completion',
        'Import/Export Unit Test_drilling_12': 'drilling',
        'Import/Export Unit Test_flowback_13': 'flowback',
        'Import/Export Unit Test_custom calculation_14': 'custom_calculation',
        'Import/Export Unit Test_custom calculation_15': 'custom_calculation',
    }

    node_id_dict = {
        'Import/Export Unit Test_oil tank_1': '6dad314d-b52d-4203-a3d7-7bfc4deb1acd',
        'Import/Export Unit Test_atmosphere_2': 'f6de439b-f8fe-4e1c-b22c-b9601bce2925',
        'Import/Export Unit Test_liquids unloading_3': '1e11ca31-eb09-4c57-949d-9db160208531',
        'Import/Export Unit Test_flare_4': 'e1f4d0bd-f3d2-4242-a302-09120eb8f817',
        'Import/Export Unit Test_associated gas_5': 'c24a7edf-2f6b-460d-a038-c162fd65cf26',
        'Import/Export Unit Test_econ output_6': 'ee06b5d7-bd7c-4c20-91cf-30af7c89855c',
        'Import/Export Unit Test_capture_7': '397aaf57-e78f-476a-975f-5310530b4407',
        'Import/Export Unit Test_facility_8': 'node1',
        'Import/Export Unit Test_facility_9': 'node',
        'Import/Export Unit Test_well group_10': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'Import/Export Unit Test_completion_11': '2fcb297d-ef85-4874-99c7-9301f087fea4',
        'Import/Export Unit Test_drilling_12': '1ca9d049-7ac3-4d97-b01f-4c0e7e982047',
        'Import/Export Unit Test_flowback_13': 'fd24263a-bd52-4fa4-8801-280e22a0aded',
        'Import/Export Unit Test_custom calculation_14': '6ca6b299-e93f-42ce-bb83-9c133cb56f67',
        'Import/Export Unit Test_custom calculation_15': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
    }

    port_id_dict = {
        'Import/Export Unit Test_oil_1': '1f51f705-fa5e-4d0c-9fc0-994513a51313',
        'Import/Export Unit Test_gas_4': '783f898c-4995-484a-a7f1-cd69feb96247',
    }

    custom_node_ports_dict = {
        'Import/Export Unit Test_custom calculation_14': {
            'inputs': [],
            'outputs': []
        },
        'Import/Export Unit Test_custom calculation_15': {
            'inputs': ['oil', 'gas', 'water'],
            'outputs': ['gas']
        }
    }

    error_list = []
    fac_id_dict = {
        'Import/Export Unit Test_facility_8': 'Link for unit test',
        'Import/Export Unit Test_facility_9': 'Import/Export Unit Test'
    }

    fac_in_net_df = pd.DataFrame([{
        '_id': ObjectId('6463f60505bfb500218f9014'),
        'name': 'Link for unit test',
        'inputs': [],
        'outputs': []
    }, {
        '_id':
        ObjectId('6463f66405bfb500218f9118'),
        'name':
        'Import/Export Unit Test',
        'inputs': [{
            'id': '1f51f705-fa5e-4d0c-9fc0-994513a51313',
            'by': 'oil',
            'to': 'node',
            'toHandle': 'oil',
            'shape': {
                'vertices': []
            },
            'name': 'Input Edge'
        }],
        'outputs': [{
            'id': '783f898c-4995-484a-a7f1-cd69feb96247',
            'by': 'gas',
            'from': 'node1',
            'fromHandle': 'gas',
            'shape': {
                'vertices': []
            },
            'name': 'Output Edge'
        }]
    }])

    expected_response_edges = [{
        'id': internal_id,
        'by': 'oil',
        'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'fromHandle': 'oil',
        'to': '6dad314d-b52d-4203-a3d7-7bfc4deb1acd',
        'toHandle': 'oil',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'gas',
        'from': '6dad314d-b52d-4203-a3d7-7bfc4deb1acd',
        'fromHandle': 'gas',
        'to': 'f6de439b-f8fe-4e1c-b22c-b9601bce2925',
        'toHandle': 'gas',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'dates',
                'rows': [{
                    'period': '05/01/2023',
                    'allocation': 100
                }, {
                    'period': '06/01/2023',
                    'allocation': 50
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'gas',
        'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'fromHandle': 'gas',
        'to': '1e11ca31-eb09-4c57-949d-9db160208531',
        'toHandle': 'gas',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'gas',
        'from': '1e11ca31-eb09-4c57-949d-9db160208531',
        'fromHandle': 'gas',
        'to': 'e1f4d0bd-f3d2-4242-a302-09120eb8f817',
        'toHandle': 'gas',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'gas',
        'from': '1e11ca31-eb09-4c57-949d-9db160208531',
        'fromHandle': 'gas',
        'to': 'c24a7edf-2f6b-460d-a038-c162fd65cf26',
        'toHandle': 'gas',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'water',
        'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'fromHandle': 'water',
        'to': 'ee06b5d7-bd7c-4c20-91cf-30af7c89855c',
        'toHandle': 'water',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'gas',
        'from': 'c24a7edf-2f6b-460d-a038-c162fd65cf26',
        'fromHandle': 'gas',
        'to': '397aaf57-e78f-476a-975f-5310530b4407',
        'toHandle': 'gas',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'link',
        'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'toFacilityObjectId': '6463f60505bfb500218f9014',
        'fromHandle': 'link',
        'to': 'node1',
        'toHandle': 'link',
        'shape': {
            'vertices': []
        },
        'name': ''
    }, {
        'id': internal_id,
        'by': 'oil',
        'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'fromHandle': 'oil',
        'to': 'node',
        'toHandle': '1f51f705-fa5e-4d0c-9fc0-994513a51313',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'gas',
        'from': 'node',
        'fromHandle': '783f898c-4995-484a-a7f1-cd69feb96247',
        'to': 'f6de439b-f8fe-4e1c-b22c-b9601bce2925',
        'toHandle': 'gas',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'development',
        'from': '2fcb297d-ef85-4874-99c7-9301f087fea4',
        'to': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'shape': {
            'vertices': []
        },
        'name': ''
    }, {
        'id': internal_id,
        'by': 'development',
        'from': '1ca9d049-7ac3-4d97-b01f-4c0e7e982047',
        'to': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'shape': {
            'vertices': []
        },
        'name': ''
    }, {
        'id': internal_id,
        'by': 'gas',
        'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'fromHandle': 'gas',
        'to': 'fd24263a-bd52-4fa4-8801-280e22a0aded',
        'toHandle': 'gas',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'gas',
        'from': 'fd24263a-bd52-4fa4-8801-280e22a0aded',
        'fromHandle': 'gas',
        'to': 'ee06b5d7-bd7c-4c20-91cf-30af7c89855c',
        'toHandle': 'gas',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'link',
        'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'fromHandle': 'link',
        'to': '6ca6b299-e93f-42ce-bb83-9c133cb56f67',
        'toHandle': 'link',
        'shape': {
            'vertices': []
        },
        'name': ''
    }, {
        'id': internal_id,
        'by': 'oil',
        'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'fromHandle': 'oil',
        'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
        'toHandle': 'Oil',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'gas',
        'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'fromHandle': 'gas',
        'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
        'toHandle': 'Gas',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'water',
        'from': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'fromHandle': 'water',
        'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
        'toHandle': 'Water',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }, {
        'id': internal_id,
        'by': 'gas',
        'from': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
        'fromHandle': 'Gas',
        'to': '397aaf57-e78f-476a-975f-5310530b4407',
        'toHandle': 'gas',
        'shape': {
            'vertices': []
        },
        'name': '',
        'description': '',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'allocation': 100
                }]
            }
        }
    }]

    response_edges = network_edges_import(edge_df, one_coll_dict, node_id_dict, port_id_dict, custom_node_ports_dict,
                                          error_list, fac_id_dict, fac_in_net_df)

    assert response_edges == expected_response_edges
    assert error_list == []
