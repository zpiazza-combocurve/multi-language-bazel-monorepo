import pandas as pd
import uuid
from bson import ObjectId
import datetime
import pytest
from api.cc_to_cc.carbon.facility import facility_export, facility_edges_export, facility_import, facility_edges_import


@pytest.fixture
def test_facility():
    test_facility = {
        # Only the user id is contained in the mongo doc, the dict is added in carbon_export
        'createdBy': {
            'id': ObjectId('61c0f6f4a8d7e10013a8550e'),
            'firstName': 'Brandon',
            'lastName': 'Lowe',
        },
        'name':
        'All fac nodes',
        'nodes': [{
            'id': 'node',
            'type': 'combustion',
        }, {
            'id': 'node1',
            'type': 'pneumatic_device',
        }, {
            'id': 'node2',
            'type': 'reciprocating_compressor',
        }, {
            'id': 'node3',
            'type': 'centrifugal_compressor',
        }, {
            'id': 'node4',
            'type': 'pneumatic_pump',
        }, {
            'id': 'node5',
            'type': 'oil_tank',
        }, {
            'id': 'node6',
            'type': 'associated_gas',
        }, {
            'id': 'node7',
            'type': 'econ_output',
        }, {
            'id': '6ca6b299-e93f-42ce-bb83-9c133cb56f67',
            'type': 'custom_calculation',
        }, {
            'id': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'type': 'custom_calculation',
        }],
        'edges': [{
            'id': '88700dec-ba59-4013-b351-6e0b9ac93b55',
            'by': 'gas',
            'from': 'node5',
            'fromHandle': 'gas',
            'to': 'node6',
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
            'id': 'e9531e63-767b-477b-a938-b5f9ec1e5223',
            'by': 'oil',
            'from': 'node5',
            'fromHandle': 'oil',
            'to': 'node7',
            'toHandle': 'oil',
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
        }],
        'inputs': [{
            'id': '1f51f705-fa5e-4d0c-9fc0-994513a51313',
            'by': 'oil',
            'to': 'node5',
            'toHandle': 'oil',
            'shape': {
                'vertices': [{
                    'x': 608,
                    'y': 876.5
                }]
            },
            'name': 'Input Edge'
        }, {
            'id': '6812a2bb-698f-4732-ab3d-ed0be637cdaf',
            'by': 'oil',
            'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'toHandle': 'Oil',
            'shape': {
                'vertices': []
            },
            'name': 'Custom Oil',
        }, {
            'id': '503891da-0a7c-449f-9885-30b9edfdd54f',
            'by': 'gas',
            'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'toHandle': 'Gas',
            'shape': {
                'vertices': []
            },
            'name': 'Custom Gas',
        }, {
            'id': '3d2e5fd5-397b-4f76-91ce-e584a822f7fd',
            'by': 'water',
            'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'toHandle': 'Water',
            'shape': {
                'vertices': []
            },
            'name': 'Custom Water',
        }],
        'outputs': [{
            'id': '783f898c-4995-484a-a7f1-cd69feb96247',
            'by': 'gas',
            'from': 'node6',
            'fromHandle': 'gas',
            'shape': {
                'vertices': [{
                    'x': 1459,
                    'y': 1014.5
                }]
            },
            'name': 'Output Edge'
        }, {
            'id': 'b4ca119e-2374-49a1-abf6-8c98a4e71421',
            'by': 'gas',
            'from': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'fromHandle': 'Gas',
            'shape': {
                'vertices': []
            },
            'name': 'Custom Gas Out',
        }],
        'createdAt':
        datetime.datetime(2023, 3, 21, 22, 21, 12, 495000),
        'updatedAt':
        datetime.datetime(2023, 3, 28, 19, 5, 32, 518000),
        '__v':
        0
    }
    return test_facility


@pytest.fixture
def expected_response_node_id_dict():
    expected_response_node_id_dict = {
        'node': 'All fac nodes_combustion_1',
        'node1': 'All fac nodes_pneumatic device_2',
        'node2': 'All fac nodes_reciprocating compressor_3',
        'node3': 'All fac nodes_centrifugal compressor_4',
        'node4': 'All fac nodes_pneumatic pump_5',
        'node5': 'All fac nodes_oil tank_6',
        'node6': 'All fac nodes_associated gas_7',
        'node7': 'All fac nodes_econ output_8',
        '6ca6b299-e93f-42ce-bb83-9c133cb56f67': 'All fac nodes_custom calculation_9',
        '75fa021a-bed5-4792-a0dd-a0013c14e9a0': 'All fac nodes_custom calculation_10',
    }
    return expected_response_node_id_dict


@pytest.fixture
def expected_response_edge_rows():
    expected_response_edge_rows = [{
        'Edge ID': 'All fac nodes_oil_1',
        'Facility Name': 'All fac nodes',
        'Edge Name': 'Input Edge',
        'Description': '',
        'Type': 'oil',
        'From Node ID': '',
        'To Node ID': 'All fac nodes_oil tank_6',
        'Criteria': '',
        'Period': '',
        'Allocation': '',
    }, {
        'Edge ID': 'All fac nodes_oil_2',
        'Facility Name': 'All fac nodes',
        'Edge Name': 'Custom Oil',
        'Description': '',
        'Type': 'oil',
        'From Node ID': '',
        'To Node ID': 'All fac nodes_custom calculation_10',
        'Criteria': '',
        'Period': '',
        'Allocation': '',
    }, {
        'Edge ID': 'All fac nodes_gas_3',
        'Facility Name': 'All fac nodes',
        'Edge Name': 'Custom Gas',
        'Description': '',
        'Type': 'gas',
        'From Node ID': '',
        'To Node ID': 'All fac nodes_custom calculation_10',
        'Criteria': '',
        'Period': '',
        'Allocation': '',
    }, {
        'Edge ID': 'All fac nodes_water_4',
        'Facility Name': 'All fac nodes',
        'Edge Name': 'Custom Water',
        'Description': '',
        'Type': 'water',
        'From Node ID': '',
        'To Node ID': 'All fac nodes_custom calculation_10',
        'Criteria': '',
        'Period': '',
        'Allocation': '',
    }, {
        'Edge ID': 'All fac nodes_gas_5',
        'Facility Name': 'All fac nodes',
        'Edge Name': '',
        'Description': '',
        'Type': 'gas',
        'From Node ID': 'All fac nodes_oil tank_6',
        'To Node ID': 'All fac nodes_associated gas_7',
        'Criteria': 'Flat',
        'Period': 'Flat',
        'Allocation': 100,
    }, {
        'Edge ID': 'All fac nodes_oil_6',
        'Facility Name': 'All fac nodes',
        'Edge Name': '',
        'Description': '',
        'Type': 'oil',
        'From Node ID': 'All fac nodes_oil tank_6',
        'To Node ID': 'All fac nodes_econ output_8',
        'Criteria': 'Dates',
        'Period': '05/01/2023',
        'Allocation': 100,
    }, {
        'Edge ID': 'All fac nodes_oil_6',
        'Facility Name': 'All fac nodes',
        'Edge Name': '',
        'Description': '',
        'Type': 'oil',
        'From Node ID': 'All fac nodes_oil tank_6',
        'To Node ID': 'All fac nodes_econ output_8',
        'Criteria': 'Dates',
        'Period': '06/01/2023',
        'Allocation': 50,
    }, {
        'Edge ID': 'All fac nodes_gas_7',
        'Facility Name': 'All fac nodes',
        'Edge Name': 'Output Edge',
        'Description': '',
        'Type': 'gas',
        'From Node ID': 'All fac nodes_associated gas_7',
        'To Node ID': '',
        'Criteria': '',
        'Period': '',
        'Allocation': '',
    }, {
        'Edge ID': 'All fac nodes_gas_8',
        'Facility Name': 'All fac nodes',
        'Edge Name': 'Custom Gas Out',
        'Description': '',
        'Type': 'gas',
        'From Node ID': 'All fac nodes_custom calculation_10',
        'To Node ID': '',
        'Criteria': '',
        'Period': '',
        'Allocation': '',
    }]
    return expected_response_edge_rows


@pytest.mark.unittest
def test_facility_export(test_facility, expected_response_node_id_dict):
    model_id_dict = {
        'node': 'combustion_1',
        'node1': 'pneumatic device_1',
        'node2': 'reciprocating compressor_1',
        'node3': 'centrifugal compressor_1',
        'node4': 'pneumatic pump_1',
        'node5': 'oil tank_1',
        'node6': 'associated gas_1',
        'node7': 'econ output_1',
        '6ca6b299-e93f-42ce-bb83-9c133cb56f67': 'custom calculation_1',
        '75fa021a-bed5-4792-a0dd-a0013c14e9a0': 'custom calculation_2',
    }
    expected_response_export_rows = [{
        'Created At': '03/21/2023 22:21:12',
        'Created By': 'Brandon Lowe',
        'Node ID': 'All fac nodes_combustion_1',
        'Facility Name': 'All fac nodes',
        'Node Type': 'Combustion',
        'Model ID': 'combustion_1',
        'Last Update': '03/28/2023 19:05:32',
        'Updated By': '',
    }, {
        'Created At': '03/21/2023 22:21:12',
        'Created By': 'Brandon Lowe',
        'Node ID': 'All fac nodes_pneumatic device_2',
        'Facility Name': 'All fac nodes',
        'Node Type': 'Pneumatic Device',
        'Model ID': 'pneumatic device_1',
        'Last Update': '03/28/2023 19:05:32',
        'Updated By': '',
    }, {
        'Created At': '03/21/2023 22:21:12',
        'Created By': 'Brandon Lowe',
        'Node ID': 'All fac nodes_reciprocating compressor_3',
        'Facility Name': 'All fac nodes',
        'Node Type': 'Reciprocating Compressor',
        'Model ID': 'reciprocating compressor_1',
        'Last Update': '03/28/2023 19:05:32',
        'Updated By': '',
    }, {
        'Created At': '03/21/2023 22:21:12',
        'Created By': 'Brandon Lowe',
        'Node ID': 'All fac nodes_centrifugal compressor_4',
        'Facility Name': 'All fac nodes',
        'Node Type': 'Centrifugal Compressor',
        'Model ID': 'centrifugal compressor_1',
        'Last Update': '03/28/2023 19:05:32',
        'Updated By': '',
    }, {
        'Created At': '03/21/2023 22:21:12',
        'Created By': 'Brandon Lowe',
        'Node ID': 'All fac nodes_pneumatic pump_5',
        'Facility Name': 'All fac nodes',
        'Node Type': 'Pneumatic Pump',
        'Model ID': 'pneumatic pump_1',
        'Last Update': '03/28/2023 19:05:32',
        'Updated By': '',
    }, {
        'Created At': '03/21/2023 22:21:12',
        'Created By': 'Brandon Lowe',
        'Node ID': 'All fac nodes_oil tank_6',
        'Facility Name': 'All fac nodes',
        'Node Type': 'Oil Tank',
        'Model ID': 'oil tank_1',
        'Last Update': '03/28/2023 19:05:32',
        'Updated By': '',
    }, {
        'Created At': '03/21/2023 22:21:12',
        'Created By': 'Brandon Lowe',
        'Node ID': 'All fac nodes_associated gas_7',
        'Facility Name': 'All fac nodes',
        'Node Type': 'Associated Gas',
        'Model ID': 'associated gas_1',
        'Last Update': '03/28/2023 19:05:32',
        'Updated By': '',
    }, {
        'Created At': '03/21/2023 22:21:12',
        'Created By': 'Brandon Lowe',
        'Node ID': 'All fac nodes_econ output_8',
        'Facility Name': 'All fac nodes',
        'Node Type': 'Econ Output',
        'Model ID': 'econ output_1',
        'Last Update': '03/28/2023 19:05:32',
        'Updated By': '',
    }, {
        'Created At': '03/21/2023 22:21:12',
        'Created By': 'Brandon Lowe',
        'Node ID': 'All fac nodes_custom calculation_9',
        'Facility Name': 'All fac nodes',
        'Node Type': 'Custom Calculation',
        'Model ID': 'custom calculation_1',
        'Last Update': '03/28/2023 19:05:32',
        'Updated By': '',
    }, {
        'Created At': '03/21/2023 22:21:12',
        'Created By': 'Brandon Lowe',
        'Node ID': 'All fac nodes_custom calculation_10',
        'Facility Name': 'All fac nodes',
        'Node Type': 'Custom Calculation',
        'Model ID': 'custom calculation_2',
        'Last Update': '03/28/2023 19:05:32',
        'Updated By': '',
    }]

    expected_response_facility_name = 'All fac nodes'
    response_export_rows, response_node_id_dict, response_facility_name = facility_export(
        test_facility,
        [],
        model_id_dict,
    )
    assert response_export_rows == expected_response_export_rows
    assert response_node_id_dict == expected_response_node_id_dict
    assert response_facility_name == expected_response_facility_name


# test facility_edges_export for each edge type (input, output, flat stream, dates stream)
@pytest.mark.unittest
def test_facility_edges_export(test_facility, expected_response_node_id_dict, expected_response_edge_rows):
    node_id_dict = expected_response_node_id_dict

    expected_response_edge_id_dict = {
        '1f51f705-fa5e-4d0c-9fc0-994513a51313': 'All fac nodes_oil_1',
        '6812a2bb-698f-4732-ab3d-ed0be637cdaf': 'All fac nodes_oil_2',
        '503891da-0a7c-449f-9885-30b9edfdd54f': 'All fac nodes_gas_3',
        '3d2e5fd5-397b-4f76-91ce-e584a822f7fd': 'All fac nodes_water_4',
        '783f898c-4995-484a-a7f1-cd69feb96247': 'All fac nodes_gas_7',
        'b4ca119e-2374-49a1-abf6-8c98a4e71421': 'All fac nodes_gas_8',
    }

    response_edge_rows, response_edge_id_dict = facility_edges_export(test_facility, [], node_id_dict)

    assert response_edge_rows == expected_response_edge_rows
    assert response_edge_id_dict == expected_response_edge_id_dict


fac_in_net_dfs = [
    pd.DataFrame([{
        '_id':
        ObjectId('641a2dd8af97900012063d39'),
        'name':
        'All fac nodes',
        'inputs': [{
            'id': '1f51f705-fa5e-4d0c-9fc0-994513a51313',
            'by': 'oil',
            'to': 'node5',
            'toHandle': 'oil',
            'shape': {
                'vertices': [{
                    'x': 608,
                    'y': 876.5
                }]
            },
            'name': 'Input Edge'
        }, {
            'id': '6812a2bb-698f-4732-ab3d-ed0be637cdaf',
            'by': 'oil',
            'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'toHandle': 'Oil',
            'shape': {
                'vertices': []
            },
            'name': 'Custom Oil',
        }, {
            'id': '503891da-0a7c-449f-9885-30b9edfdd54f',
            'by': 'gas',
            'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'toHandle': 'Gas',
            'shape': {
                'vertices': []
            },
            'name': 'Custom Gas',
        }, {
            'id': '3d2e5fd5-397b-4f76-91ce-e584a822f7fd',
            'by': 'water',
            'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'toHandle': 'Water',
            'shape': {
                'vertices': []
            },
            'name': 'Custom Water',
        }],
        'outputs': [{
            'id': '783f898c-4995-484a-a7f1-cd69feb96247',
            'by': 'gas',
            'from': 'node6',
            'fromHandle': 'gas',
            'shape': {
                'vertices': [{
                    'x': 1459,
                    'y': 1014.5
                }]
            },
            'name': 'Output Edge'
        }, {
            'id': 'b4ca119e-2374-49a1-abf6-8c98a4e71421',
            'by': 'gas',
            'from': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
            'fromHandle': 'Gas',
            'shape': {
                'vertices': []
            },
            'name': 'Custom Gas Out',
        }]
    }]),
    pd.DataFrame(columns=['_id', 'name', 'inputs', 'outputs'])
]

expected_response_facility_ids = [ObjectId('641a2dd8af97900012063d39'), None]

expected_response_error_lists = [[],
                                 [{
                                     'error_message':
                                     'Facility All fac nodes did not import successfully or not in project',
                                     'row_index': 0
                                 }]]


# test facility_import for a facility that does and does not exist in project
@pytest.mark.unittest
@pytest.mark.parametrize(
    'fac_in_net_df, expected_response_facility_id, expected_response_error_list, test_index',
    zip(fac_in_net_dfs, expected_response_facility_ids, expected_response_error_lists, range(len(fac_in_net_dfs))),
)
def test_facility_import(mocker, fac_in_net_df, expected_response_facility_id, expected_response_error_list,
                         test_index):
    # mock the uuid generated in facility_import
    mocker.patch('api.cc_to_cc.carbon.facility.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id

    facility_name = 'All fac nodes'
    shape_multipliers = {'x': 1, 'y': 1}
    error_list = []
    row_index = 0

    expected_response_documents = [{
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'facility',
        'name': 'All fac nodes',
        'params': {
            'facility_id': ObjectId('641a2dd8af97900012063d39')
        },
        'description': '',
    }, {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'facility',
        'name': 'All fac nodes',
        'params': {
            'facility_id': None
        },
        'description': '',
    }]

    expected_response_document = expected_response_documents[test_index]

    response_document, response_document_id, response_facility_id = facility_import(
        facility_name,
        fac_in_net_df,
        shape_multipliers,
        error_list,
        row_index,
    )

    assert response_document == expected_response_document
    assert response_document_id == internal_id
    assert response_facility_id == expected_response_facility_id
    assert error_list == expected_response_error_list


# test facility edge import for each edge type (input, output, flat stream, dates stream)
@pytest.mark.unittest
def test_facility_edges_import(mocker, expected_response_edge_rows):
    # mock the uuid generated in facility_import
    mocker.patch('api.cc_to_cc.carbon.facility.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id
    edge_df = pd.DataFrame(expected_response_edge_rows)
    one_coll_dict = {
        'All fac nodes_oil tank_6': 'oil_tank',
        'All fac nodes_associated gas_7': 'associated_gas',
        'All fac nodes_econ output_8': 'econ_output',
        'All fac nodes_custom calculation_10': 'custom_calculation',
    }
    node_id_dict = {
        'All fac nodes_oil tank_6': 'node5',
        'All fac nodes_associated gas_7': 'node6',
        'All fac nodes_econ output_8': 'node7',
        'All fac nodes_custom calculation_10': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
    }

    custom_node_ports_dict = {
        'All fac nodes_custom calculation_9': {
            'inputs': [],
            'outputs': []
        },
        'All fac nodes_custom calculation_10': {
            'inputs': ['oil', 'gas', 'water'],
            'outputs': ['gas']
        }
    }

    expected_response_edges = [{
        'id': internal_id,
        'by': 'gas',
        'from': 'node5',
        'fromHandle': 'gas',
        'to': 'node6',
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
        'by': 'oil',
        'from': 'node5',
        'fromHandle': 'oil',
        'to': 'node7',
        'toHandle': 'oil',
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
    }]
    expected_response_inputs = [{
        'id': internal_id,
        'by': 'oil',
        'to': 'node5',
        'toHandle': 'oil',
        'shape': {
            'vertices': [{
                'x': -25,
                'y': -25
            }]
        },
        'name': 'Input Edge'
    }, {
        'id': internal_id,
        'by': 'oil',
        'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
        'toHandle': 'Oil',
        'shape': {
            'vertices': [{
                'x': -25,
                'y': -50
            }]
        },
        'name': 'Custom Oil',
    }, {
        'id': internal_id,
        'by': 'gas',
        'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
        'toHandle': 'Gas',
        'shape': {
            'vertices': [{
                'x': -25,
                'y': -75
            }]
        },
        'name': 'Custom Gas',
    }, {
        'id': internal_id,
        'by': 'water',
        'to': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
        'toHandle': 'Water',
        'shape': {
            'vertices': [{
                'x': -25,
                'y': -100
            }]
        },
        'name': 'Custom Water',
    }]
    expected_response_outputs = [{
        'id': internal_id,
        'by': 'gas',
        'from': 'node6',
        'fromHandle': 'gas',
        'shape': {
            'vertices': [{
                'x': 525,
                'y': -25
            }]
        },
        'name': 'Output Edge'
    }, {
        'id': internal_id,
        'by': 'gas',
        'from': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
        'fromHandle': 'Gas',
        'shape': {
            'vertices': [{
                'x': 525,
                'y': -50
            }]
        },
        'name': 'Custom Gas Out',
    }]

    expected_response_port_id_dict = {
        'All fac nodes_oil_1': internal_id,
        'All fac nodes_oil_2': internal_id,
        'All fac nodes_gas_3': internal_id,
        'All fac nodes_water_4': internal_id,
        'All fac nodes_gas_7': internal_id,
        'All fac nodes_gas_8': internal_id,
    }
    error_list = []
    response_edges, response_inputs, response_outputs, response_port_id_dict = facility_edges_import(
        edge_df,
        one_coll_dict,
        node_id_dict,
        {},
        custom_node_ports_dict,
        error_list,
    )

    assert response_edges == expected_response_edges
    assert response_inputs == expected_response_inputs
    assert response_outputs == expected_response_outputs
    assert response_port_id_dict == expected_response_port_id_dict
    assert error_list == []
