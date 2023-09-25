### define unit conversion system
unit_multipliers = {
    'mmbbl': {
        'multiplier': 1000 * 1000,
        'base': 'bbl'
    },
    'mbbl': {
        'multiplier': 1000,
        'base': 'bbl'
    },
    'bbl': {
        'multiplier': 1,
        'base': 'bbl'
    },
    'mmcf': {
        'multiplier': 1000 * 1000,
        'base': 'cf'
    },
    'mcf': {
        'multiplier': 1000,
        'base': 'cf'
    },
    'cf': {
        'multiplier': 1,
        'base': 'cf'
    },
    'mmboe': {
        'multiplier': 1000 * 1000,
        'base': 'boe'
    },
    'mboe': {
        'multiplier': 1000,
        'base': 'boe'
    },
    'boe': {
        'multiplier': 1,
        'base': 'boe'
    },
    'mmcfe': {
        'multiplier': 1000 * 1000,
        'base': 'cfe'
    },
    'mcfe': {
        'multiplier': 1000,
        'base': 'cfe'
    },
    'cfe': {
        'multiplier': 1,
        'base': 'cfe'
    },
    'ft': {
        'multiplier': 1,
        'base': 'ft'
    }
}


class UnitConversion:
    def get_unit_nom_denom_lists(self, unit_str):
        star_separation = unit_str.split('*')
        if '/' in star_separation[-1]:
            nominators = star_separation[:(-1)]
            slash_separation = star_separation[-1].split('/')
            nominators += [slash_separation[0]]
            denominators = slash_separation[1:]
        else:
            nominators = star_separation
            denominators = []
        return {'nominators': nominators, 'denominators': denominators}

    def get_base_multiplier(self, unit):
        unit_nom_denom = self.get_unit_nom_denom_lists(unit)
        nominators = unit_nom_denom['nominators']
        denominators = unit_nom_denom['denominators']

        ret = 1
        for unit in nominators:
            ret *= unit_multipliers[unit]['multiplier']

        for unit in denominators:
            ret /= unit_multipliers[unit]['multiplier']
        return ret

    def get_bases(self, unit_lists):
        return list(map(lambda x: unit_multipliers[x]['base'], unit_lists))

    def check_valid_conversion(self, orig_unit, target_unit):
        orig_unit_nom_denom = self.get_unit_nom_denom_lists(orig_unit)
        target_unit_nom_denom = self.get_unit_nom_denom_lists(target_unit)

        orig_nom_base = self.get_bases(orig_unit_nom_denom['nominators']).sort()
        orig_denom_base = self.get_bases(orig_unit_nom_denom['denominators']).sort()
        target_nom_base = self.get_bases(target_unit_nom_denom['nominators']).sort()
        target_denom_base = self.get_bases(target_unit_nom_denom['denominators']).sort()
        return (orig_nom_base == target_nom_base) and (orig_denom_base == target_denom_base)

    def get_multiplier(self, orig_unit, target_unit):
        if self.check_valid_conversion(orig_unit, target_unit):
            orig_base_multiplier = self.get_base_multiplier(orig_unit)
            target_base_multiplier = self.get_base_multiplier(target_unit)
            return orig_base_multiplier / target_base_multiplier
        else:
            raise Exception('error')

    def convert(self, orig_num, orig_unit, target_unit):
        multiplier = self.get_multiplier(orig_unit, target_unit)
        return orig_num * multiplier
