## see https://test.combocurve.com/projects/61c38ef6b43dd00013a58fc7/network-models/643dcf6819cc1200126b4b8d

nodes = [
    {
        'id': 'drilling'
    },
    {
        'id': 'completion'
    },
    {
        'id': 'well_group_1'
    },
    {
        'id': 'well_group_2'
    },
    {
        'id': 'liquids_unloading'
    },
    {
        'id': 'facility_for_unit_test'
    },
    {
        'id': 'flare'
    },
    {
        'id': 'atmosphere'
    },
    {
        'id': 'oil_tank'
    },
    {
        'id': 'econ_output'
    },
]

edges = [
    {
        'id': 'edge1',
        'from': 'drilling',
        'to': 'well_group_1',
        'by': 'development'
    },
    {
        'id': 'edge2',
        'from': 'drilling',
        'to': 'well_group_2',
        'by': 'development'
    },
    {
        'id': 'edge3',
        'from': 'completion',
        'to': 'well_group_2',
        'by': 'development'
    },
    {
        'id': 'edge4',
        'from': 'well_group_1',
        'to': 'facility_for_unit_test',
        'by': 'oil'
    },
    {
        'id': 'edge5',
        'from': 'well_group_1',
        'to': 'facility_for_unit_test',
        'by': 'gas'
    },
    {
        'id': 'edge6',
        'from': 'well_group_1',
        'to': 'liquids_unloading',
        'by': 'gas'
    },
    {
        'id': 'edge7',
        'from': 'well_group_2',
        'to': 'liquids_unloading',
        'by': 'gas'
    },
    {
        'id': 'edge8',
        'from': 'liquids_unloading',
        'to': 'facility_for_unit_test',
        'by': 'gas'
    },
    {
        'id': 'edge9',
        'from': 'facility_for_unit_test',
        'to': 'flare',
        'by': 'gas'
    },
    {
        'id': 'edge10',
        'from': 'facility_for_unit_test',
        'to': 'atmosphere',
        'by': 'gas'
    },
    {
        'id': 'edge11',
        'from': 'oil_tank',
        'to': 'econ_output',
        'by': 'oil'
    },
]

## test_get_relevant_edges
relevant_edges_test_1 = {
    'inputs': [['well_group_1'], edges, True],
    'outputs': [{
        'id': 'edge10',
        'from': 'facility_for_unit_test',
        'to': 'atmosphere',
        'by': 'gas'
    }, {
        'id': 'edge4',
        'from': 'well_group_1',
        'to': 'facility_for_unit_test',
        'by': 'oil'
    }, {
        'id': 'edge5',
        'from': 'well_group_1',
        'to': 'facility_for_unit_test',
        'by': 'gas'
    }, {
        'id': 'edge6',
        'from': 'well_group_1',
        'to': 'liquids_unloading',
        'by': 'gas'
    }, {
        'id': 'edge8',
        'from': 'liquids_unloading',
        'to': 'facility_for_unit_test',
        'by': 'gas'
    }, {
        'id': 'edge9',
        'from': 'facility_for_unit_test',
        'to': 'flare',
        'by': 'gas'
    }]
}

## test_sort_network_nodes
sort_network_nodes_test_s = [{
    'inputs': [['well_group_1'], edges, True],
    'outputs': ['well_group_1', 'liquids_unloading', 'facility_for_unit_test', 'atmosphere', 'flare']
}, {
    'inputs': [['well_group_2'], edges, True],
    'outputs': ['well_group_2', 'liquids_unloading', 'facility_for_unit_test', 'atmosphere', 'flare']
}, {
    'inputs': [['oil_tank'], edges, True],
    'outputs': ['oil_tank', 'econ_output']
}, {
    'inputs': [['drilling'], edges, True],
    'outputs':
    ['drilling', 'well_group_1', 'well_group_2', 'liquids_unloading', 'facility_for_unit_test', 'atmosphere', 'flare']
}]
