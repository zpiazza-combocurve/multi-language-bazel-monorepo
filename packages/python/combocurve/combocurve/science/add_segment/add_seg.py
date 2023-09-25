from copy import deepcopy
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.add_segment.add_seg_init import add_seg_init
from combocurve.science.add_segment.add_seg_start_end import get_start, get_end

multi_seg = MultipleSegments()


class add_seg:
    def body(self, general, well_PD, orig_series_forecasts):
        ret, warning = self.add_seg(general, well_PD, orig_series_forecasts)
        ret = self.T2(ret)
        return ret, warning

    def add_seg(self, general, well_PD, orig_series_forecasts):  # noqa: C901
        model_name = general['name']
        series_forecasts = deepcopy(orig_series_forecasts)

        ### edge cases
        ##### 1. relative_candidates does not exist
        ##### 2. start_idx before first_segment
        ##### 3. forecast does not exist
        ##### 4. well_life before start_idx
        ##### 5. q_final is larger/smaller than q_start for dec/inc segment
        ##### 6. start_idx after end_idx of last segment
        ##### 7. connect to previous for flat-0/empty(q_start == 0)
        ##### 8. show warnings for all series together

        ### input
        ## 1. general setting 2. well_PD 3. series_forecast
        ## get the added segment

        model_params = general['model_params']

        # ret = None
        # warning = ''
        # if len(series_forecasts) == 0:
        #     ret = None
        #     warning = 'Series forecast does not exist! Does not apply add segment.'
        # else:
        ## get_start_idx
        start_setting = general['start']
        start_method = start_setting['start_method']

        start_success, start_warning, start_idx = get_start[start_method](start_setting, well_PD, series_forecasts)
        if not start_success:
            ret = None
            warning = start_warning
        else:
            if len(series_forecasts) == 0:
                init_success, init_warning, added_seg = add_seg_init[model_name](series_forecasts, start_idx,
                                                                                 model_params)

                if not init_success:
                    ret = None
                    warning = init_warning
                else:
                    ### get end_idx of this segment
                    end_setting = general['end']
                    end_method = end_setting['end_method']
                    end_success, end_warning, end_idx = get_end(end_method, end_setting, well_PD, added_seg,
                                                                series_forecasts)

                    if not end_success:
                        ret = None
                        warning = end_warning
                    else:
                        added_seg['end_idx'] = end_idx
                        added_seg['q_end'] = multi_seg.get_segment_object(added_seg).predict([end_idx])[0]
                        ret = [added_seg]
                        warning = end_warning
            else:
                if start_idx <= series_forecasts[0]['start_idx']:
                    ret = None
                    warning = 'Adding segment at this time will eliminate all segments. Does not apply add segment'
                else:
                    if start_idx <= series_forecasts[-1]['end_idx']:
                        cut_i = None
                        for i, segment in enumerate(series_forecasts):
                            if segment['start_idx'] <= start_idx and start_idx <= segment['end_idx']:
                                cut_i = i
                                break

                        adj_series_forecasts = deepcopy(series_forecasts[:cut_i])
                        cut_segment = series_forecasts[cut_i]
                        if start_idx - 1 < cut_segment['start_idx']:
                            series_forecasts = adj_series_forecasts
                        else:
                            cut_segment['end_idx'] = start_idx - 1
                            cut_segment['q_end'] = multi_seg.get_segment_object(cut_segment).predict([start_idx - 1])[0]
                            series_forecasts = adj_series_forecasts + [cut_segment]

                    if start_idx > series_forecasts[-1]['end_idx']:
                        ## this is gauranteed after the adjustment above
                        ## reason why I do this is to simplify the logic to use the previous segment while the t_pred is
                        ## larger than the range
                        added_empty = multi_seg.get_segment_template('empty')
                        added_empty['start_idx'] = series_forecasts[-1]['end_idx'] + 1
                        added_empty['end_idx'] = start_idx + 1

                        series_forecasts += [added_empty]

                    ### get segment,params, start_related
                    init_success, init_warning, added_seg = add_seg_init[model_name](series_forecasts, start_idx,
                                                                                     model_params)

                    if not init_success:
                        ret = None
                        warning = init_warning
                    else:
                        ### get end_idx of this segment
                        end_setting = general['end']
                        end_method = end_setting['end_method']
                        end_success, end_warning, end_idx = get_end(end_method, end_setting, well_PD, added_seg,
                                                                    series_forecasts)

                        if not end_success:
                            ret = None
                            warning = end_warning
                        else:
                            added_seg['end_idx'] = end_idx
                            added_seg['q_end'] = multi_seg.get_segment_object(added_seg).predict([end_idx])[0]
                            start_idx = added_seg['start_idx']
                            cut_i = None
                            for i, segment in enumerate(series_forecasts):
                                if segment['start_idx'] <= start_idx and start_idx <= segment['end_idx']:
                                    cut_i = i
                                    break
                            ret = deepcopy(series_forecasts[:cut_i])
                            cut_segment = series_forecasts[cut_i]
                            cut_segment['end_idx'] = start_idx - 1
                            cut_segment['q_end'] = multi_seg.get_segment_object(cut_segment).predict([start_idx - 1])[0]
                            if start_idx - 1 < cut_segment['start_idx']:
                                ret += [added_seg]
                            else:
                                ret += [cut_segment, added_seg]

                            warning = end_warning

        return ret, warning

    def T2(self, ret):
        if ret is None:
            return None
        else:
            for segment in ret:
                for k, v in segment.items():
                    if type(v) != str:
                        segment[k] = float(v)

            return ret
