from bson import ObjectId


class MockContext():
    # mock context for testing
    def __init__(self):
        self.economic_data_collection = MockEconomicDataCollection()
        self.big_query_client = MockBigQueryClient()
        self.tenant_info = {'big_query_dataset': None}
        self.econ_output_service = MockEconOutputService()
        self.custom_fields_service = None
        self.econ_file_service = MockEconFileService()
        self.project_custom_headers_datas_collection = MockProjectCustomHeadersDatasCollection()


class MockEconomicDataCollection():
    # mock economic data collection for testing
    def aggregate(self, pipeline):
        if 'well' in pipeline[0]['$match']['$and'][0]:
            return [{
                '_id': 'dummy_id',
                'reservesCategory': {
                    'econ_prms_resources_class': 'reserves',
                    'econ_prms_reserves_category': 'proved',
                    'econ_prms_reserves_sub_category': 'producing'
                },
                'incrementalIndex': 0,
                'project': 'dummy_id',
                'run': ObjectId('62e94b4d39c6ab0012778a8c'),
                'scenario': 'dummy_id',
                'user': 'dummy_id',
                'comboName': '01-Default 1',
                'well': {
                    '_id': 'dummy_id'
                },
                'group': None
            }]
        elif 'group' in pipeline[0]['$match']['$and'][0]:
            return []


class MockBigQueryClient():
    # mock bigquery client for testing
    def table_path(self, *args):
        return 'dummy_table_path'

    def create_table(self, *args):
        return None

    def get_table(self, *args):
        return None

    def insert_rows_df(self, *args):
        return None


class MockEconOutputService:
    # mock econ output service for testing
    def get_dataset(self):
        return 'test_dataset'


class MockEconFileService:
    # mock econ file service for testing
    def load_bq_to_storage(self, **args):
        return 'dummy_gcp_file_name'


class MockProjectCustomHeadersDatasCollection:
    # mock project custom headers datas collection for testing
    def find(self, props):
        return [{
            '_id': ObjectId('6476610749963bd6a70f1db0'),
            'project': ObjectId(props['project']),
            'well': props['well']['$in'][0],
            'customHeaders': {
                'project_custom_header': 'dummy_value'
            }
        }]
