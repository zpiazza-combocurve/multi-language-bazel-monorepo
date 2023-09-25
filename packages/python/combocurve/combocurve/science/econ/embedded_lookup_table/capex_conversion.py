from combocurve.science.econ.embedded_lookup_table.conversion import EmbeddedConverter


class CAPEXConverter(EmbeddedConverter):
    def incorporate_embedded(self, capex_model):
        '''take a model and, if applicable, its embedded lookup tables and
        translate them into the format of the original expense model

        Args:
            capex_model (dict): original capex model and its connected embedded lookup tables

        Returns:
            capex_model (list): capex model with embedded lookup tables incorporated
        '''
        for table in capex_model.get('fetched_embedded', []):
            for rows in table:
                capex_model['other_capex']['rows'].append(self.lines_processor(rows, 'capex'))

        return capex_model
