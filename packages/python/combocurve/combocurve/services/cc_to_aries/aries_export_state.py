class UserWorkStream:
    def __init__(self):
        self.phase_category_hierarchy_dict = {
            'gas': {
                'gathering': [88, 89],
                'processing': [91, 92],
                'transportation': [161, 162],
                'marketing': [164, 301],
                'other': [303, 304]
            },
            'oil': {
                'gathering': [412, 413],
                'processing': [415, 416],
                'transportation': [418, 419],
                'marketing': [422, 423],
                'other': [425, 426]
            },
            'ngl': {
                'gathering': [613, 454],
                'processing': [614, 457],
                'transportation': [679, 604],
                'marketing': [680, 607],
                'other': [682, 610]
            },
            'drip_condensate': {
                'gathering': [],
                'processing': [1083, 1085],
                'transportation': [],
                'marketing': [],
                'other': []
            },
            'fixed_expenses': {
                'monthly_well_cost': [735, 738],
                'other_monthly_cost_1': [739, 740],
                'other_monthly_cost_2': [741, 742],
                'other_monthly_cost_3': [743, 772],
                'other_monthly_cost_4': [773, 774],
                'other_monthly_cost_5': [775, 776],
                'other_monthly_cost_6': [1082, 455],
                'other_monthly_cost_7': [1084, 602],
                'other_monthly_cost_8': [1086, 608],
                'other_monthly_cost_9': [1088, 611],
            }
        }

        self.lookup_stream_hierarchy = {
            'one_minus_nri': [90, 160, 163],
            'hundered_percent_wi': [302, 305, 414],
            'wi_minus_one': [683, 685, 734],
            'one_minus_wi': [417, 420, 424],
            'nri_minus_one': [606, 609, 612],
            'ngl_overlay': [678, 681, 735]
        }

        self.all_work_streams = [1083, 1085, 1087, 1089, 736, 737, 453, 456, 603]

    def get_expense_work_stream(self, phase, category, count):
        phase = 'fixed_expenses' if phase is None else phase
        hierarchy = self.phase_category_hierarchy_dict.get(phase, {}).get(category, [])
        if hierarchy:
            try:
                return hierarchy[count]
            except IndexError:
                return None

    def get_overlay_work_stream(self, type=None):
        hierarchy = self.lookup_stream_hierarchy.get(type, [])
        while hierarchy:
            return hierarchy.pop(0)
        while self.all_work_streams:
            return self.all_work_streams.pop(0)
