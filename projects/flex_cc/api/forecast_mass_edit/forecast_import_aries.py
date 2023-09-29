import re
import pandas as pd
from collections import defaultdict
from typing import (List, Dict, Sequence, Iterable, Optional)
from api.aries_phdwin_imports.aries_forecast_helpers.aries_forecast_import import AriesForecastImport
from api.aries_phdwin_imports.helpers import parallel_dic
from api.forecast_mass_edit.forecast_import import ForecastImport, IDENTIFIER_MAP
import logging
from combocurve.utils.exceptions import get_exception_info

MAJOR_OIL_SKIPS = ['GAS/OIL', '*GAS/OIL', 'WTR/OIL', '*WTR/OIL']
MAJOR_GAS_SKIPS = ['OIL/GAS', '*OIL/GAS', 'WTR/GAS', '*WTR/GAS']
WATER_SKIPS = ['WTR/OIL', '*WTR/OIL', 'WTR/GAS', '*WTR/GAS']
TEXT = ['ERROR', '*"']

# Create a default qualifier that can be overwritten later
QUALIFIER = 'QUAL'

# Total line is 94 characters
TOTAL_LEN = 94

# ARIES Production Section is 4
SEC_PRODUCTION = 4

# Template to replace a KEYWORD with a continuation
CONTINUATION = '"         '

# Formats for ARIES line types
PROPNUM = '{0}\n'
SECTION = ' {0}\n'
LINE = '  {0}\n'  # noqa: E221
CSV = '{propnum},{section},{sequence},{qualifier},{keyword},{expression}\n'
CSV_HEADER = 'PROPNUM,SEQUENCE,SEQUENCE,QUALIFIER,KEYWORD,EXPRESSION\n'

PHASES: List[str] = [
    'CUMS',
    'OIL',
    'GAS/OIL',
    'GAS',
    'NGL/GAS',
    'OIL/GAS',
    'WTR',
    'WTR/OIL',
    'WTR/GAS',
    'OIL/WTR',
    'GAS/WTR',
]

LEGAL_KEYWORDS = PHASES + ['START']

_AriesDict = Dict[str, Dict[str, Dict[str, List[str]]]]


class ForecastImportAries:
    def __init__(self, context):
        self.context = context

    def new_sorted_phases(self) -> Dict[str, List[str]]:
        return {p: list() for p in PHASES}

    def fold_aries_lines(self,
                         aries_dict: _AriesDict,
                         lines: Iterable[str],
                         phase_skips: Optional[Sequence[str]] = None) -> _AriesDict:
        if phase_skips is not None:
            phase_skips = list(phase_skips)
            phase_skips.append('TEXT')
        else:
            phase_skips = ['TEXT']

        propnum = prepropnum = ''
        section = ''
        phase = ''
        continuation = False
        start = None
        for line in lines:
            line = line.decode('utf-8')
            if re.search(r'^\S+', line):
                propnum = line.strip()
                aries_dict.setdefault(propnum, dict())

                if propnum != prepropnum:
                    start = None
                    prepropnum = propnum

            elif re.search(r'^\s\S+', line):
                section = line.strip()
                aries_dict[propnum].setdefault(section, self.new_sorted_phases())

            elif re.search(r'^\s\s\S+', line):
                expression = line.strip()
                continuation = (re.search(r'^"\s', expression) is not None)
                if not continuation:
                    m = re.search(r'^(\S+)\s', expression)
                    if m is not None:
                        line_keyword = m.groups()[0]

                        if line_keyword not in LEGAL_KEYWORDS:
                            continue
                        else:
                            phase = line_keyword

                # skip START for now unless it has a following phase
                if phase == 'START':
                    start = expression
                else:
                    # if START had a following phase, then add the START
                    if start is not None:  # and 'START' not in (s[:5] for s in aries_dict[propnum][section][phase]):
                        aries_dict[propnum][section][phase].append(start)
                    aries_dict[propnum][section][phase].append(expression)

        return aries_dict

    def clean_aries_dict(self, aries_dict: _AriesDict) -> _AriesDict:
        clean_dict: _AriesDict = {}
        for propnum, sections in aries_dict.items():
            clean_dict.setdefault(propnum, dict())

            for section, phases in sections.items():
                clean_dict[propnum].setdefault(section, self.new_sorted_phases())

                for phase, lines in phases.items():
                    new_lines: List[str] = list()

                    for i, line in enumerate(lines):
                        if i > 0 and line[:5] == 'START':
                            # only ever have one START
                            continue
                        elif i > 1:
                            # only ever have one KEYWORD
                            line = line.replace(phase, CONTINUATION[:len(phase)])

                        new_lines.append(line)

                    clean_dict[propnum][section][phase] = new_lines

        return clean_dict

    def write_aries_dict(self, aries_dict: _AriesDict, qualifier: str = QUALIFIER) -> None:
        aries_data = []
        for propnum, sections in aries_dict.items():
            sequence_dict = {}
            for section, phases in sections.items():
                if section != 'PRODUCTION':
                    continue

                for phase, lines in phases.items():
                    for line in lines:
                        keyword = (line[:10]).strip()
                        expression = (line[10:80]).strip()

                        m = re.search(r'(\S+)\s?$', line)
                        if m is not None:
                            q = m.groups()[0].strip()
                            q = 'CC_QUAL' if expression.split()[-1] == q else q
                        else:
                            q = 'CC_QUAL'

                        if q not in sequence_dict:
                            sequence_dict[q] = 10
                        else:
                            sequence_dict[q] += 10

                        aries_line = {
                            'PROPNUM': propnum,
                            'SECTION': str(SEC_PRODUCTION),
                            'SEQUENCE': sequence_dict[q],
                            'QUALIFIER': q,
                            'KEYWORD': keyword,
                            'EXPRESSION': expression
                        }

                        aries_data.append(aries_line)

        return aries_data

    def select_qualifier(self, aries_data, qualifier):
        well_qualifier = defaultdict(list)

        for line in aries_data:
            well_qualifier[line['PROPNUM']].append(line['QUALIFIER'])

        for well in well_qualifier:
            if len(well_qualifier[well]) > 1:
                if qualifier in well_qualifier[well]:
                    well_qualifier[well] = [qualifier]
                else:
                    well_qualifier[well] = [well_qualifier[well][0]]

        ret = []

        for line in aries_data:
            if line['QUALIFIER'] in well_qualifier[line['PROPNUM']]:
                ret.append(line)

        return ret

    def get_forecast_aries_df(self, file_id, qualifier):
        file_gcp_name = self.context.file_service.get_file(file_id)['gcpName']

        file_bytes = self.context.file_service.download_to_memory(file_gcp_name)
        file_bytes.seek(0)
        if '.txt' in file_gcp_name:
            fold: _AriesDict = {}
            #with open(file_bytes) as f:
            aries_lines = self.fold_aries_lines(fold, file_bytes)
            cleaned_aries_dict = self.clean_aries_dict(aries_lines)
            aries_data = self.write_aries_dict(cleaned_aries_dict, qualifier)
        elif '.csv' in file_gcp_name:
            try:
                aries_data = pd.read_csv(file_bytes, index_col=None, encoding='utf-8', dtype=str).to_dict('records')
            except Exception:
                file_bytes = self.context.file_service.download_to_memory(file_gcp_name)
                file_bytes.seek(0)
                aries_data = pd.read_csv(file_bytes, index_col=None, encoding='latin1', dtype=str).to_dict('records')
        else:
            raise Exception('Can only accept file with ".txt" or ".csv" extension.')
        file_bytes.close()
        aries_data_unique_qualifier = self.select_qualifier(aries_data, qualifier)
        aries_data_df = pd.DataFrame.from_records(aries_data_unique_qualifier)
        aries_data_df = aries_data_df.dropna(how='all')

        return aries_data_df

    def forecast_import_aries(self, params):
        qualifier = params.get('qualifier', None)
        file_id = params.get('file_id')
        user_id = params.get('user_id')
        well_identifier = params.get('well_identifier', 'inptID')

        try:
            forecast_aries_df = self.get_forecast_aries_df(file_id, qualifier)
        except Exception as e:
            error_info = get_exception_info(e)
            logging.error(error_info['message'], extra={'metadata': error_info})
            raise Exception('Errors happened in reading ARIES File!')

        aries_forecast_param_obj = AriesForecastImport(user_id, None, None, None, parallel_dic)
        aries_forecast_param_obj.pre_process()
        cc_forecast_import_df, error_log, valid_input = aries_forecast_param_obj.aries_forecast_import_parameters(
            forecast_aries_df)

        cc_forecast_import_df.rename(columns={'Chosen ID': IDENTIFIER_MAP[well_identifier]}, inplace=True)

        forecast_import = ForecastImport(self.context)

        if valid_input:
            cc_forecast_import_df['Series'] = 'best'
            forecast_import.forecast_import_with_check(params,
                                                       aries_error_log=error_log,
                                                       aries_import_df=cc_forecast_import_df)
        else:
            forecast_import.forecast_import_with_check(params, aries_error_log=error_log, aries_import_df=valid_input)
