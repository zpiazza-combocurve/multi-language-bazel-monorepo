from dataclasses import dataclass
import pytest
from bson.objectid import ObjectId

from combocurve.services.well_calcs.well_calculations_service import WellCalculationsService

PRODUCTION_FIXTURE = {
    'index': [
        44209, 44240, 44268, 44299, 44329, 44360, 44390, 44421, 44452, 44482, 44513, 44543, 44574, 44605, 44633, 44664,
        44694, 44725, 44755, 44786, 44817, 44847
    ],
    'oil': [
        881.0, 6522.0, 13797.0, 13962.0, 12546.0, 10693.0, 9662.0, 8664.0, 7615.0, 7159.0, 5960.0, 6348.0, 5544.0,
        4553.0, 4783.0, 4385.0, 4212.0, 3355.0, 3904.0, 3930.0, 3309.0, 3225.0
    ],
    'gas': [
        3209.0, 21683.0, 60801.0, 61302.0, 65785.0, 59967.0, 59433.0, 55573.0, 51097.0, 51999.0, 48550.0, 47139.0,
        44087.0, 39473.0, 41607.0, 39501.0, 39106.0, 33398.0, 33096.0, 33787.0, 30587.0, 29967.0
    ],
    'water': [
        31.0, 1502.0, 4415.0, 4375.0, 3885.0, 3087.0, 2725.0, 2338.0, 2037.0, 2035.0, 1696.0, 1147.0, 1485.0, 1204.0,
        1242.0, 1096.0, 1128.0, 781.0, 120.0, 470.0, 913.0, 874.0
    ]
}

WELL_IDS = [ObjectId('63a0e8dce640e5a88bb7d9dd'), ObjectId('63a0e8dce640e5a88bb7d9de')]

DAL_FIXTURE = [{
    'date': {
        'seconds': 1610668800,
        'nanos': 0
    },
    'gas': 3209.0,
    'oil': 881.0,
    'water': 31.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1613347200,
        'nanos': 0
    },
    'gas': 21683.0,
    'oil': 6522.0,
    'water': 1502.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1615766400,
        'nanos': 0
    },
    'gas': 60801.0,
    'oil': 13797.0,
    'water': 4415.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1618444800,
        'nanos': 0
    },
    'gas': 61302.0,
    'oil': 13962.0,
    'water': 4375.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1621036800,
        'nanos': 0
    },
    'gas': 65785.0,
    'oil': 12546.0,
    'water': 3885.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1623715200,
        'nanos': 0
    },
    'gas': 59967.0,
    'oil': 10693.0,
    'water': 3087.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1626307200,
        'nanos': 0
    },
    'gas': 59433.0,
    'oil': 9662.0,
    'water': 2725.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1628985600,
        'nanos': 0
    },
    'gas': 55573.0,
    'oil': 8664.0,
    'water': 2338.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1631664000,
        'nanos': 0
    },
    'gas': 51097.0,
    'oil': 7615.0,
    'water': 2037.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1634256000,
        'nanos': 0
    },
    'gas': 51999.0,
    'oil': 7159.0,
    'water': 2035.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1636934400,
        'nanos': 0
    },
    'gas': 48550.0,
    'oil': 5960.0,
    'water': 1696.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1639526400,
        'nanos': 0
    },
    'gas': 47139.0,
    'oil': 6348.0,
    'water': 1147.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1642204800,
        'nanos': 0
    },
    'gas': 44087.0,
    'oil': 5544.0,
    'water': 1485.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1644883200,
        'nanos': 0
    },
    'gas': 39473.0,
    'oil': 4553.0,
    'water': 1204.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1647302400,
        'nanos': 0
    },
    'gas': 41607.0,
    'oil': 4783.0,
    'water': 1242.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1649980800,
        'nanos': 0
    },
    'gas': 39501.0,
    'oil': 4385.0,
    'water': 1096.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1652572800,
        'nanos': 0
    },
    'gas': 39106.0,
    'oil': 4212.0,
    'water': 1128.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1655251200,
        'nanos': 0
    },
    'gas': 33398.0,
    'oil': 3355.0,
    'water': 781.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1657843200,
        'nanos': 0
    },
    'gas': 33096.0,
    'oil': 3904.0,
    'water': 120.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1660521600,
        'nanos': 0
    },
    'gas': 33787.0,
    'oil': 3930.0,
    'water': 470.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1663200000,
        'nanos': 0
    },
    'gas': 30587.0,
    'oil': 3309.0,
    'water': 913.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1665792000,
        'nanos': 0
    },
    'gas': 29967.0,
    'oil': 3225.0,
    'water': 874.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9dd')
}, {
    'date': {
        'seconds': 1610668800,
        'nanos': 0
    },
    'gas': 3209.0,
    'oil': 881.0,
    'water': 31.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1613347200,
        'nanos': 0
    },
    'gas': 21683.0,
    'oil': 6522.0,
    'water': 1502.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1615766400,
        'nanos': 0
    },
    'gas': 60801.0,
    'oil': 13797.0,
    'water': 4415.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1618444800,
        'nanos': 0
    },
    'gas': 61302.0,
    'oil': 13962.0,
    'water': 4375.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1621036800,
        'nanos': 0
    },
    'gas': 65785.0,
    'oil': 12546.0,
    'water': 3885.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1623715200,
        'nanos': 0
    },
    'gas': 59967.0,
    'oil': 10693.0,
    'water': 3087.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1626307200,
        'nanos': 0
    },
    'gas': 59433.0,
    'oil': 9662.0,
    'water': 2725.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1628985600,
        'nanos': 0
    },
    'gas': 55573.0,
    'oil': 8664.0,
    'water': 2338.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1631664000,
        'nanos': 0
    },
    'gas': 51097.0,
    'oil': 7615.0,
    'water': 2037.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1634256000,
        'nanos': 0
    },
    'gas': 51999.0,
    'oil': 7159.0,
    'water': 2035.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1636934400,
        'nanos': 0
    },
    'gas': 48550.0,
    'oil': 5960.0,
    'water': 1696.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1639526400,
        'nanos': 0
    },
    'gas': 47139.0,
    'oil': 6348.0,
    'water': 1147.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1642204800,
        'nanos': 0
    },
    'gas': 44087.0,
    'oil': 5544.0,
    'water': 1485.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1644883200,
        'nanos': 0
    },
    'gas': 39473.0,
    'oil': 4553.0,
    'water': 1204.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1647302400,
        'nanos': 0
    },
    'gas': 41607.0,
    'oil': 4783.0,
    'water': 1242.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1649980800,
        'nanos': 0
    },
    'gas': 39501.0,
    'oil': 4385.0,
    'water': 1096.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1652572800,
        'nanos': 0
    },
    'gas': 39106.0,
    'oil': 4212.0,
    'water': 1128.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1655251200,
        'nanos': 0
    },
    'gas': 33398.0,
    'oil': 3355.0,
    'water': 781.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1657843200,
        'nanos': 0
    },
    'gas': 33096.0,
    'oil': 3904.0,
    'water': 120.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1660521600,
        'nanos': 0
    },
    'gas': 33787.0,
    'oil': 3930.0,
    'water': 470.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1663200000,
        'nanos': 0
    },
    'gas': 30587.0,
    'oil': 3309.0,
    'water': 913.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}, {
    'date': {
        'seconds': 1665792000,
        'nanos': 0
    },
    'gas': 29967.0,
    'oil': 3225.0,
    'water': 874.0,
    'well': ObjectId('63a0e8dce640e5a88bb7d9de')
}]


@dataclass
class DalDate:
    seconds: int
    nanos: int


@dataclass
class MockDalRecord:
    well: ObjectId
    oil: float
    gas: float
    water: float
    date: DalDate

    @classmethod
    def from_dict(cls, dict_: dict):
        return cls(
            well=dict_['well'],
            oil=dict_['oil'],
            gas=dict_['gas'],
            water=dict_['water'],
            date=DalDate(**dict_['date']),
        )


@pytest.fixture
def mock_dal_response():
    return (MockDalRecord.from_dict(record) for record in DAL_FIXTURE)


@pytest.mark.unittest
def test_extract_dal_records(mock_dal_response):
    records = WellCalculationsService._extract_dal_records(mock_dal_response)
    for id in WELL_IDS:
        assert records[id] == PRODUCTION_FIXTURE
    assert WellCalculationsService._extract_dal_records(iter(())) == {}
