class func5:
    def body(self, f5_input):
        is_deterministic = f5_input['is_deterministic']
        warning = {'status': True, 'message': 'Valid data not enough to generate a valid forecast.'}
        if is_deterministic:
            return {'forecastType': None, 'warning': warning, 'P_dict': None, 'ratio': None, 'forecasted': None}
        return {'forecastType': None, 'warning': warning, 'P_dict': None}
