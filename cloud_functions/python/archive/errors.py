class InvalidArchiveOperation(Exception):
    def __init__(self, operation):
        super().__init__(f'Invalid archive operation: {operation}')
        self.expected = True
