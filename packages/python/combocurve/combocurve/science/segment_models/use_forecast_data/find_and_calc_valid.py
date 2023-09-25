import numpy as np
from copy import deepcopy


class DataFinderAndCalculator:
    def __init__(self, all_columns: set, start: set, initial_values):
        self.main = {'oil', 'gas', 'water'}
        self.ratio = {'oil/gas', 'gas/oil', 'water/oil', 'oil/water', 'gas/water', 'water/gas'}
        self.all_columns = deepcopy(all_columns)
        self.values = deepcopy(initial_values)
        self.valid = deepcopy(start)
        self.invalid = all_columns.difference(start)
        self.calculation = []
        self.calculated = None  ## will be a list of the same length as calculation
        self.calc_item_place = {}

    def get_add_valid(self):
        add_valid = set()
        invalid_main = {item for item in self.invalid if item in self.main}
        invalid_ratio = {item for item in self.invalid if item in self.ratio}
        ### for invalid_main
        for main in invalid_main:
            for base_phase in self.main.difference({main}):
                this_ratio = main + '/' + base_phase
                if self.valid.issuperset({base_phase, this_ratio}):
                    add_valid.add(main)
                    self.calculation += [{'target': main, 'item1': base_phase, 'item2': this_ratio, 'operation': '*'}]

        ### for ratio
        for ratio in invalid_ratio:
            ratio_main_s = ratio.split('/')
            ratio_main_s_set = set(ratio_main_s)
            if self.valid.issuperset(ratio_main_s_set):
                add_valid.add(ratio)
                self.calculation += [{
                    'target': ratio,
                    'item1': ratio_main_s[0],
                    'item2': ratio_main_s[1],
                    'operation': '/'
                }]

        return add_valid

    def get_all_valid(self):
        add_valid = self.get_add_valid()
        self.valid = self.valid.union(add_valid)
        self.invalid = self.all_columns.difference(self.valid)
        ## keep the comment because we probably will introduce this back
        # while len(add_valid) > 0:
        #     self.valid = self.valid.union(add_valid)
        #     self.invalid = self.all_columns.difference(self.valid)
        #     add_valid = self.get_add_valid()
        self.calculated = [False] * len(self.calculation)
        self.calc_item_place = {calc['target']: i for i, calc in enumerate(self.calculation)}

        return self.valid, self.invalid

    def fill_values(self):
        values = self.values
        for i, calc in enumerate(self.calculation):
            if self.calculated[i] is False:
                target = calc['target']
                item1 = calc['item1']
                item2 = calc['item2']
                operation = calc['operation']
                values[target] = self.apply_operation_np(values[item1], values[item2], operation)
                self.calculated[i] = True

    def fill_value(self, item):
        if item in self.calc_item_place:
            item_place = self.calc_item_place[item]
            if self.calculated[item_place] is False:
                calc = self.calculation[item_place]
                item1 = calc['item1']
                self.fill_value(item1)
                item2 = calc['item2']
                self.fill_value(item2)
                operation = calc['operation']
                self.values[item] = self.apply_operation_np(self.values[item1], self.values[item2], operation)
                self.calculated[item_place] = True

    def apply_operation_nonp(self, item1, item2, operation):
        ret = []
        for i in range(len(item1)):
            val_1 = item1[i]
            val_2 = item2[i]
            if operation == '*':
                if val_1 is None or val_2 is None:
                    ret += [None]
                else:
                    ret += [val_1 * val_2]
            elif operation == '/':
                if val_1 is None or val_2 is None or val_2 == 0:
                    ret += [None]
                else:
                    ret += [val_1 / val_2]
        return ret

    def apply_operation_np(self, item1, item2, operation):
        if operation == '*':
            return item1 * item2
        else:
            ret = np.array(item1)
            item2_0_mask = item2 == 0
            item2_non_0_mask = ~item2_0_mask
            ret[item2_0_mask] = np.nan
            ret[~item2_0_mask] = item1[item2_non_0_mask] / item2[item2_non_0_mask]
            return ret
