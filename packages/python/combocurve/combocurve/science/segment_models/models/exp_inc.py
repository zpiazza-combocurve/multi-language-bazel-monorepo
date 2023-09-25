from .exp_dec import ExpDecSegment


class ExpIncSegment(ExpDecSegment):
    def cut(self, cut_idx):
        this_name = 'exp_inc'
        seg_start = self.segment['start_idx']
        q_start = self.segment['q_start']
        seg_end = self.segment['end_idx']
        q_end = self.segment['q_end']
        D_eff = self.segment['D_eff']
        D = self.segment['D']
        use_cut_idx = int(cut_idx)
        q_connect = self.predict([use_cut_idx - 1, use_cut_idx])
        ## first_segment
        first_segment = self.get_default_template(this_name)
        first_segment['D_eff'] = D_eff
        first_segment['D'] = D
        first_segment['start_idx'] = seg_start
        first_segment['end_idx'] = use_cut_idx - 1
        first_segment['q_start'] = q_start
        first_segment['q_end'] = q_connect[0]
        ## second segment
        second_segment = self.get_default_template(this_name)
        second_segment['D_eff'] = D_eff
        second_segment['D'] = D
        second_segment['start_idx'] = use_cut_idx
        second_segment['end_idx'] = seg_end
        second_segment['q_start'] = q_connect[1]
        second_segment['q_end'] = q_end

        return first_segment, second_segment
