class BatchFileNameGenerator:
    def __init__(self, prefix: str, index: int, padding=8):
        self.prefix = prefix
        self.index = f'{index:0{padding}}'

    def get_common_prefix(self, suffix: str):
        return f'{self.prefix}-{suffix}'

    def get_indexed_file_name(self, suffix: str, extension=''):
        return f'{self.get_common_prefix(suffix)}-{self.index}{extension}'

    def get_general_file_name(self, suffix: str, extension=''):
        return f'{self.get_common_prefix(suffix)}{extension}'
