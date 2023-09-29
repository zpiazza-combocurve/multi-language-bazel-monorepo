import io
import csv
import datetime
from bson import ObjectId
from copy import deepcopy, copy
from api.typecurve_mass_edit.well_headers_abbreviated import orginal_custom_header_dict
from api.forecast_mass_edit.shared import adjust_segments
from api.forecast_mass_edit.display_templates import display_units_dt, daily_units_dt
from api.forecast_mass_edit.forecast_export import get_convert_func
from combocurve.science.segment_models.multiple_segments import MultipleSegments

multi_seg = MultipleSegments()

REGRESSION_TYPE = {'rate': 'Rate', 'cum': 'Cumulative'}


def apply_adjust_segment(adjust, typecurve_fits):
    if adjust:
        for fits in typecurve_fits:
            for p, v in fits.get('ratio_P_dict', {}).items():
                if v.get('segments'):
                    fits['ratio_P_dict'][p]['segments'] = adjust_segments(v.get('segments'))

            for p, v in fits.get('P_dict', {}).items():
                if v.get('segments'):
                    fits['P_dict'][p]['segments'] = adjust_segments(v.get('segments'))


class TypecurveDownload:
    def __init__(self, context):
        self.context = context

    def download(self, p_req, get_data=False):
        tc = p_req['tc_id']
        user_id = p_req['user_id']
        project_id = p_req['project_id']
        adjust = p_req['adjust_segment']
        run_date = datetime.datetime.utcnow()

        project_name = self.context.project_collection.find_one({'_id': ObjectId(project_id)})['name']
        tc_id = list(map(ObjectId, tc))
        match = {'typeCurve': {'$in': tc_id}}
        sort = {'_id': 1}
        project = {'settings': 0}

        tc_pipeline = [{'$match': match}, {'$sort': sort}, {'$project': project}]
        typecurve_fits = list(self.context.type_curve_fits_collection.aggregate(tc_pipeline))

        apply_adjust_segment(adjust, typecurve_fits)

        tc_documents = list(
            self.context.type_curves_collection.aggregate([{
                '$match': {
                    '_id': {
                        '$in': tc_id
                    }
                }
            }, {
                '$sort': sort
            }, {
                '$project': {
                    'name': 1,
                    '_id': 1,
                    'wells': 1,
                    'project': 1,
                    'regressionType': 1,
                }
            }]))

        tc_well_identifiers = self.get_tc_wells(tc_documents)
        tc_project_names = self.get_projects_info(tc_documents)

        tc_id_names = {}
        tc_id_regression_type = {}
        for item in tc_documents:
            tc_id_names[item['_id']] = item['name']
            tc_id_regression_type[str(item['_id'])] = REGRESSION_TYPE.get(item.get('regressionType', 'rate'), 'Rate')

        fixed_headers = [
            "project_name", "TC Name", "tc_id", "inptID", "chosenID", "api10", "api12", "api14", "aries_id",
            "phdwin_id", "phase"
        ]

        segment_headers = [
            "regression_type", "tc_life", "align", "normalize", "resolution", "eur", "fitType", "Base Phase", "series",
            "segment", "name", "start_idx", "end_idx", "q_start", "q_end", "c", "D_eff", "D", "b", "target_D_eff_sw",
            "realized_D_eff_sw", "sw_idx", "q_sw", "k", "warning"
        ]

        customerized_headers = self.get_custom_header()
        tc_normalization_export_params, n_headers, formatted_n_headers = self.tc_normalization_download(
            tc_id, customerized_headers)

        if tc_normalization_export_params:
            self.format_custom_numercial_headers(customerized_headers, n_headers, formatted_n_headers)

        if not tc_normalization_export_params:
            n_headers = []
            formatted_n_headers = []

        header_row = fixed_headers + n_headers + segment_headers

        csv_buffer = io.StringIO()
        csv_writer = csv.DictWriter(csv_buffer,
                                    quoting=csv.QUOTE_NONNUMERIC,
                                    fieldnames=header_row,
                                    extrasaction='ignore')

        #csv_writer.writeheader()
        formatted_header_first = [
            "Project Name", "TC Name", "TC ID", "Rep Well INPT ID", "Rep Well List Chosen ID", "Rep Well API10",
            "Rep Well API12", "Rep Well API14", "Rep Well List Aries ID", "Rep Well List PHDwin ID", "Phase"
        ]

        formatted_header_second = [
            "Regression Type", "TC Life (Year)", "Align Peak", "Normalization", "Resolution", "EUR (MBBL,MMCF)",
            "Fit Type", "Base Phase", "Series", "Segment", "Segment Type", "Start of Period (Day)",
            "End of Period (Day)", "q Start (BBL/D, MCF/D, BBL/MCF, MCF/BBL, BBL/BBL)",
            "q End (BBL/D, MCF/D, BBL/MCF, MCF/BBL, BBL/BBL)", "Flat Value (BBL/D, MCF/D, BBL/MCF, MCF/BBL, BBL/BBL)",
            "Di Eff-Sec %", "Di Nominal", "b", "D Sw-Eff-Sec %", "Realized D Sw-Eff-Sec %", "Sw-Day (Day)",
            "q Sw (BBL/D, MCF/D, BBL/MCF, MCF/BBL, BBL/BBL)", "Slope (BBL/MCF/D, MCF/BBL/D, BBL/BBL/D)", 'Warning'
        ]

        formatted_header = formatted_header_first + formatted_n_headers + formatted_header_second
        writer = csv.writer(csv_buffer)
        writer.writerow(formatted_header)
        tc_fits_eur_calc = self.sort_tc_fits_for_eur_calculation(typecurve_fits)

        if get_data:
            tc_params_data = []

        typecurve_fits_in_project = []
        for tc_fit in typecurve_fits:
            if tc_fit['typeCurve'] in tc_id_names:
                tc_fit['tc_name'] = tc_id_names[tc_fit['typeCurve']]
                typecurve_fits_in_project.append(tc_fit)

        for tc_fit in sorted(typecurve_fits_in_project, key=lambda i: i['tc_name']):
            if tc_fit['typeCurve'] in tc_id_names:
                tc_id = str(tc_fit['typeCurve'])
                fit_type = tc_fit['fitType']
                p_dict = tc_fit.get('P_dict') if fit_type == "rate" else tc_fit.get('ratio_P_dict')
                normalization_fit_flag = True
                well_lists = tc_well_identifiers.pop(tc_id, None)

                if p_dict:
                    eur_dict = self.get_eur(str(tc_fit['typeCurve']), fit_type, p_dict, tc_fits_eur_calc)
                    for series in sorted(p_dict, reverse=True):
                        this_fit = deepcopy(tc_fit)
                        this_fit.pop('P_dict', None)
                        this_fit.pop('ratio_P_dict', None)
                        this_fit['series'] = series

                        if p_dict[series] and 'segments' in p_dict[series]:
                            tc_life = self.get_tc_life_of_this_series(p_dict[series]['segments'])
                            for i in range(len(p_dict[series]['segments'])):
                                this_fit['project_name'] = tc_project_names[tc_id]
                                this_fit['segment'] = i + 1
                                this_fit['TC Name'] = tc_id_names[this_fit['typeCurve']]
                                this_fit['tc_id'] = tc_id
                                this_fit['regression_type'] = tc_id_regression_type.get(tc_id, 'rate')
                                this_fit.update(p_dict[series]['segments'][i])
                                if fit_type == "rate":
                                    this_fit["Base Phase"] = "N/A"
                                else:
                                    this_fit["Base Phase"] = p_dict[series].get("basePhase")

                                this_series_line = copy(this_fit)
                                this_series_line.pop('typeCurve')

                                if well_lists:
                                    for identifier in well_lists:
                                        this_series_line[identifier] = well_lists[identifier]

                                    well_lists = None

                                if normalization_fit_flag and tc_normalization_export_params:
                                    if (this_fit['typeCurve'], this_fit['phase']) in tc_normalization_export_params:
                                        this_series_line.update(tc_normalization_export_params[(this_fit['typeCurve'],
                                                                                                this_fit['phase'])])
                                    else:
                                        this_series_line['normalization_type'] = 'no_normalization'

                                    normalization_fit_flag = False

                                this_series_line['eur'] = round(eur_dict[series] / 1000, 2)
                                this_series_line['tc_life'] = tc_life

                                self.format_d_eff(this_series_line)

                                if get_data:
                                    tc_params_data.append(this_series_line)
                                else:
                                    csv_writer.writerow(this_series_line)
        if get_data:
            return tc_params_data
        #upload to cloud storage
        else:
            gcp_name = f'tc-fit-export--{str(project_id)}--{user_id}--{run_date.isoformat()}.csv'
            file_name = f'tc-fit-export--{project_name}.csv'
            content_type = 'application/CSV'
            file_object = self.upload_file_buffer(csv_buffer, gcp_name, file_name, content_type, user_id, project_id)

            return str(file_object.get('_id'))

    def get_projects_info(self, tc_documents):
        project_ids = []
        project_id_names = {}

        for document in tc_documents:
            project_ids.append(document['project'])

        project_documents = list(
            self.context.project_collection.aggregate([{
                '$match': {
                    '_id': {
                        '$in': project_ids
                    }
                }
            }, {
                '$sort': {
                    '_id': 1
                }
            }, {
                '$project': {
                    'name': 1,
                    '_id': 1,
                }
            }]))

        for document in project_documents:
            project_id_names[document['_id']] = document['name']

        tc_project_names = {}

        for document in tc_documents:
            tc_project_names[str(document['_id'])] = project_id_names[document['project']]

        return tc_project_names

    def unit_conversion(self, this_fit, fit_type):
        phase = this_fit['Phase']
        base_phase = this_fit['Base Phase']
        headers = {}

        for key in ['q_start', 'q_end', 'q_sw', 'k']:
            if key == 'k':
                if fit_type == 'rate':
                    orig_unit = daily_units_dt['field'][f'{phase}_{key}']
                    target_unit = display_units_dt['field'][f'{phase}_{key}']
                else:
                    orig_unit = daily_units_dt['field'][f'{phase}/{base_phase}_{key}']
                    target_unit = display_units_dt['field'][f'{phase}/{base_phase}_{key}']
            else:
                if fit_type == 'rate':
                    orig_unit = daily_units_dt['field'][phase]
                    target_unit = display_units_dt['field'][phase]
                else:
                    orig_unit = daily_units_dt['field'][f'{phase}/{base_phase}']
                    target_unit = display_units_dt['field'][f'{phase}/{base_phase}']

            convert_func = get_convert_func(orig_unit, target_unit)
            headers[key] = target_unit

            if this_fit.get(key):
                this_fit[key] = convert_func(this_fit[key])

    def get_tc_life_of_this_series(self, segments):
        if len(segments) == 0:
            return 0

        tc_life = round((segments[-1]['end_idx'] - segments[0]['start_idx'] + 1) / 365.25, 2)
        return tc_life

    def format_d_eff(self, this_series_line):
        for key in ['D_eff', 'realized_D_eff_sw', 'target_D_eff_sw']:
            if this_series_line.get(key):
                this_series_line[key] = this_series_line[key] * 100

        if this_series_line.get('normalize'):
            this_series_line['normalize'] = 'Yes'
        else:
            this_series_line['normalize'] = 'No'

        if this_series_line.get('name') == 'empty':
            this_series_line['name'] = 'shut_in'

        if this_series_line.get('sw_idx'):
            this_series_line['sw_idx'] = round(this_series_line['sw_idx'])

    def get_eur(self, tc_id, fit_type, p_dict, tc_fits_eur_calc):
        eur_dict = {}
        cum_data = 0
        data_freq = 'daily'

        for series in p_dict:
            segments = p_dict[series]['segments']

            if len(segments) > 0:
                left_idx = segments[0]['start_idx']
                right_idx = segments[-1]['end_idx']
            else:
                left_idx = right_idx = 0
            end_data_idx = left_idx - 100

            if fit_type == 'rate':
                eur_dict[series] = multi_seg.eur(cum_data, end_data_idx, left_idx, right_idx, segments, data_freq)
            elif fit_type == 'ratio':
                base_phase = p_dict[series]['basePhase']
                base_phase_fit = tc_fits_eur_calc[tc_id].get(base_phase)
                if base_phase_fit and base_phase_fit['fitType'] == 'rate':
                    base_phase_segments = self.shift_base_segments(segments,
                                                                   base_phase_fit['P_dict']['best']['segments'])
                    eur_dict[series] = multi_seg.ratio_eur_interval(cum_data, end_data_idx, left_idx, right_idx,
                                                                    segments, base_phase_segments, data_freq)
                else:
                    eur_dict[series] = cum_data

        return eur_dict

    def shift_base_segments(self, ratio_segments, base_segments):
        if ratio_segments and base_segments:
            delta_t = ratio_segments[0]['start_idx'] - base_segments[0]['start_idx']
            return multi_seg.shift_segments_idx(base_segments, delta_t)

        return base_segments

    def sort_tc_fits_for_eur_calculation(self, typecurve_fits):
        tc_fits_dict = {}

        for tc_fit in typecurve_fits:
            tc_id = str(tc_fit['typeCurve'])
            if tc_id not in tc_fits_dict:
                tc_fits_dict[tc_id] = {}

            tc_fits_dict[tc_id][tc_fit['phase']] = deepcopy(tc_fit)

        return tc_fits_dict

    def upload_file_buffer(self, buffer, gcp_name, file_name, content_type, user_id, project_id):
        csv_file_info = {'gcpName': gcp_name, 'type': content_type, 'name': file_name, 'user': user_id}

        return self.context.file_service.upload_file_from_string(
            string_data=buffer.getvalue(),
            file_data=csv_file_info,
            user_id=user_id,
            project_id=project_id,
        )

    def format_custom_numercial_headers(self, customerized_headers, n_headers, formatted_n_headers):
        if customerized_headers:
            for i in range(len(n_headers)):
                if n_headers[i] in customerized_headers:
                    formatted_n_headers[i] = customerized_headers[n_headers[i]]

    def get_custom_header(self):
        customerized_headers = {}
        custom_headers = self.context.custom_header_configurations_collection.find_one({})

        if custom_headers:
            for key in orginal_custom_header_dict:
                if custom_headers.get(key) and orginal_custom_header_dict[key] != custom_headers[key]['label']:
                    customerized_headers[key] = custom_headers[key]['label']

        return customerized_headers

    def tc_normalization_download(self, tc_ids, customerized_headers):
        norm_type_ignore = {'qPeak': 'Q Peak', 'eur_and_q_peak': '2-factor Normalization'}

        tc_pipeline = [{
            '$match': {
                'typeCurve': {
                    '$in': tc_ids
                }
            }
        }, {
            '$sort': {
                '_id': 1
            }
        }, {
            '$project': {
                '_id': 0,
                'settings': 0,
                'createdAt': 0,
                'updatedAt': 0,
                '_v': 0,
            }
        }]
        tc_normalization_fits = list(self.context.type_curve_normalizations_collection.aggregate(tc_pipeline))

        tc_normalization_export_params = {}

        normalization_headers = [
            'normalization_type', 'n_slope', 'n_intercept', 'coefficient', 'exponent', 'x_label', 'y_label'
        ]
        headers_dict = set(normalization_headers)
        headers_dict.add('eur')
        formatted_normalization_headers = [
            'Normalization Type', 'Slope', 'Intercept', 'Coefficient', 'Exponent', 'x Axis', 'y Axis'
        ]

        for fit in tc_normalization_fits:
            steps = fit['steps']
            if steps:
                # TODO: Need to add functionality for 2-factor download
                overall_norm_type = steps.get('normalizationType', 'eur')
                steps = steps.get('eur', {})
                normalization_type = steps.get('type')

                if overall_norm_type in norm_type_ignore:
                    fit['normalization_type'] = overall_norm_type
                    fit['warning'] = '2-factor normalization is not supported for now. '
                elif not normalization_type or normalization_type == 'no_normalization':
                    fit['normalization_type'] = 'no_normalization'
                else:
                    fit['normalization_type'] = normalization_type

                    x_chain = steps.get('base').get('x').get('opChain')
                    x_start_feature = steps.get('base').get('x').get('startFeature')
                    y_chain = steps.get('base').get('y').get('opChain')
                    y_start_feature = steps.get('base').get('y').get('startFeature')

                    x_label = str(x_start_feature)
                    y_label = str(y_start_feature)
                    if x_label not in headers_dict:
                        normalization_headers += [x_label]
                        formatted_normalization_headers += [x_label]
                        headers_dict.add(x_label)

                    if y_label not in headers_dict:
                        normalization_headers += [y_label]
                        formatted_normalization_headers += [y_label]
                        headers_dict.add(y_label)

                    fit_target = steps.get('target')
                    if fit_target:
                        fit[x_label] = fit_target.get(x_label)
                        fit[y_label] = fit_target.get(y_label)

                    for step in x_chain:
                        x_label += step['op'] + step['opFeature']
                        if step['opFeature'] not in headers_dict:
                            normalization_headers += [step['opFeature']]
                            formatted_normalization_headers += [step['opFeature']]
                            headers_dict.add(step['opFeature'])

                        if fit_target:
                            fit[step['opFeature']] = fit_target.get(step['opFeature'])

                    for step in y_chain:
                        y_label += step['op'] + step['opFeature']
                        if step['opFeature'] not in headers_dict:
                            normalization_headers += [step['opFeature']]
                            formatted_normalization_headers += [step['opFeature']]
                            headers_dict.add(step['opFeature'])
                        if fit_target:
                            fit[step['opFeature']] = fit_target.get(step['opFeature'])

                    if x_label in customerized_headers:
                        x_label = customerized_headers[x_label]
                    if y_label in customerized_headers:
                        y_label = customerized_headers[y_label]

                    fit['x_label'] = x_label
                    fit['y_label'] = y_label
                    fit['n_slope'] = steps.get('aValue')
                    fit['n_intercept'] = steps.get('bValue')
                    self.configure_normalization_type(normalization_type, fit, steps)

                tc_normalization_export_params[(fit['typeCurve'], fit['phase'])] = deepcopy(fit)

        return tc_normalization_export_params, normalization_headers, formatted_normalization_headers

    def configure_normalization_type(self, normalization_type, fit, steps):
        if normalization_type == '1_to_1':
            fit['n_slope'] = None
            fit['n_intercept'] = None
        elif normalization_type == 'power_law_fit':
            fit['n_slope'] = None
            fit['n_intercept'] = None
            fit['coefficient'] = steps.get('aValue')
            fit['exponent'] = steps.get('bValue')

    def get_tc_wells(self, tc_documents):
        tc_dict = {}
        well_list = []
        tc_well_identifiers = {}

        for tc in tc_documents:
            tc_dict[str(tc['_id'])] = {'well_count': len(tc['wells']), 'well_ids': {}}
            for well in tc['wells']:
                tc_dict[str(tc['_id'])]['well_ids'][str(well)] = {
                    'api12': None,
                    'api10': None,
                    'api14': None,
                    'inptID': None,
                    'chosenID': None,
                    'aries_id': None,
                    'phdwin_id': None
                }

            well_list += tc['wells']

        well_documents = list(
            self.context.wells_collection.aggregate([{
                '$match': {
                    '_id': {
                        '$in': well_list
                    }
                }
            }, {
                '$project': {
                    '_id': 1,
                    'api10': 1,
                    'api12': 1,
                    'api14': 1,
                    'inptID': 1,
                    'chosenID': 1,
                    'aries_id': 1,
                    'phdwin_id': 1
                }
            }]))

        for well in well_documents:
            well_id = str(well['_id'])
            for tc_id in tc_dict:
                if well_id in tc_dict[tc_id]['well_ids']:
                    for identifier in well:
                        if identifier in tc_dict[tc_id]['well_ids'][well_id]:
                            tc_dict[tc_id]['well_ids'][well_id][identifier] = well[identifier]

        for tc_id in tc_dict:
            tc_well_identifiers[tc_id] = {
                'api12': [],
                'api10': [],
                'api14': [],
                'inptID': [],
                'chosenID': [],
                'aries_id': [],
                'phdwin_id': []
            }

            for well in tc_dict[tc_id]['well_ids']:
                for identifier in ['api12', 'api10', 'api14', 'inptID', 'chosenID', 'aries_id', 'phdwin_id']:
                    if tc_dict[tc_id]['well_ids'][well][identifier]:
                        tc_well_identifiers[tc_id][identifier].append(tc_dict[tc_id]['well_ids'][well][identifier])
                    else:
                        tc_well_identifiers[tc_id][identifier].append('')

            for identifier in ['api12', 'api10', 'api14', 'inptID', 'chosenID', 'aries_id', 'phdwin_id']:
                tc_well_identifiers[tc_id][identifier] = ', '.join(tc_well_identifiers[tc_id][identifier])

        return tc_well_identifiers
