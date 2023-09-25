import gc
import numpy as np
import pandas as pd
import datetime

import jpype
import jpype.imports

from combocurve.shared.aries_import_enums import (AC_ECONOMIC, AC_PROPERTY, AC_DAILY, AC_PRODUCT, AR_SIDEFILE,
                                                  AR_LOOKUP, PROPNUM, AC_SETUP, AC_SETUPDATA, CC_FORECAST, AR_ENDDATE)

from combocurve.services.cc_to_aries.construct_ac_df import (AC_DAILY_HEADERS, AC_PRODUCT_HEADERS, AC_PROPERTY_HEADERS,
                                                             CC_FORECAST_HEADERS)
from combocurve.services.cc_to_aries.construct_ac_setupdata import AC_SETUP_COLUMNS, AC_SETUP_DATA_COLUMNS
from combocurve.services.cc_to_aries.construct_ac_economic import (AR_SIDEFILE_HEADERS, AR_LOOKUP_HEADERS,
                                                                   AR_ENDDATE_HEADERS)

ACCESS_DB_HEADERS = {
    AC_ECONOMIC: [
        PROPNUM,
        'SECTION',
        'SEQUENCE',
        'QUALIFIER',
        'KEYWORD',
        'EXPRESSION',
    ],
    AC_PROPERTY: AC_PROPERTY_HEADERS,
    AC_DAILY: AC_DAILY_HEADERS,
    AC_PRODUCT: AC_PRODUCT_HEADERS,
    AC_SETUP: AC_SETUP_COLUMNS,
    AC_SETUPDATA: AC_SETUP_DATA_COLUMNS,
    AR_SIDEFILE: AR_SIDEFILE_HEADERS,
    CC_FORECAST: CC_FORECAST_HEADERS,
    AR_LOOKUP: AR_LOOKUP_HEADERS,
    AR_ENDDATE: AR_ENDDATE_HEADERS
}

MAX_ROWS_PER_INSERT = 500
JACKCESS_WRITE_LIMIT = 50000
WELL_HEADERS_TO_IGNORE = [
    'COPIED', 'MOSTRECENTIMPORTTYPE', 'PROJECT', 'MOSTRECENTIMPORT', 'MOSTRECENTIMPORTDESC', 'SCHEMAVERSION',
    'DATAPOOL', 'CHOSENKEYID', 'HAS_DIRECTIONAL_SURVEY'
]


def is_column_date(series):
    is_date_column = any(not pd.isnull(item) for item in pd.to_datetime(series.apply(str), errors="coerce"))
    if is_date_column:
        series = pd.to_datetime(series.apply(str), errors="coerce").dt.strftime('%m/%d/%Y')
    return series, is_date_column


def is_column_numeric(series):
    is_numeric_column = any(not pd.isnull(item) for item in pd.to_numeric(series.apply(str), errors="coerce"))
    if is_numeric_column:
        series = pd.to_numeric(series.apply(str), errors="coerce")
        # drop trailing 0's from all numbers
        series = [str(item) if pd.notna(item) else None for item in series]
    return series, is_numeric_column


def update_ac_property_db(ac_property_table, aries_result_dict):
    ac_property_updates = list(set(aries_result_dict[AC_PROPERTY].columns) - set(ACCESS_DB_HEADERS[AC_PROPERTY]))
    ac_property_updates = [update for update in ac_property_updates if update not in WELL_HEADERS_TO_IGNORE]
    for column in ac_property_updates:
        dtype_class = jpype.JClass("com.healthmarketscience.jackcess.DataType")
        use_dtype = dtype_class.TEXT
        date_series, is_date_column = is_column_date(aries_result_dict[AC_PROPERTY][column])
        numeric_series, is_numeric_column = is_column_numeric(aries_result_dict[AC_PROPERTY][column])
        if is_date_column:
            aries_result_dict[AC_PROPERTY][column] = date_series
            aries_result_dict[AC_PROPERTY][column].replace([np.nan], [None], inplace=True)
            use_dtype = dtype_class.SHORT_DATE_TIME
        elif is_numeric_column:
            aries_result_dict[AC_PROPERTY][column] = numeric_series
        else:
            aries_result_dict[AC_PROPERTY][column] = aries_result_dict[AC_PROPERTY][column].astype(str, errors="ignore")
            aries_result_dict[AC_PROPERTY][column].replace(['None'], [None], inplace=True)
        column_class = jpype.JClass("com.healthmarketscience.jackcess.ColumnBuilder")
        column_class(column).setType(use_dtype).addToTable(ac_property_table)

    return ac_property_updates


def chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


def date_col_process(str_dates):
    local_date = jpype.JClass('java.time.LocalDate')

    def date_str_to_java_local_date(date_str):
        try:
            if '-' in str(date_str):
                y, m, d = [int(part) for part in date_str.split('-')]
            elif '/' in str(date_str):
                m, d, y = [int(part) for part in date_str.split('/')]
            else:
                return None
        except ValueError:
            pd_date = pd.to_datetime(date_str)
            y, m, d = pd_date.year, pd_date.month, pd_date.day

        java_local_date = local_date.of(y, m, d)
        return java_local_date

    f = np.vectorize(date_str_to_java_local_date)

    return f(str_dates)


def jackcess_insert(db_path, aries_result_dict, user_id, notification_id, progress_range, update_progress):
    # start JVM not it is not started
    if not jpype.isJVMStarted():
        jackcess_path = './combocurve/services/cc_to_aries/jackcess-4.0.1'
        jackcess_jars = [
            f'{jackcess_path}/commons-lang3-3.12.0.jar',
            f'{jackcess_path}/commons-logging-1.2.jar',
            f'{jackcess_path}/jackcess-4.0.1.jar',
        ]
        classpath = ':'.join(jackcess_jars)
        jpype.startJVM(jpype.getDefaultJVMPath(), "-Djava.class.path=%s" % classpath)

    progress_start = progress_range[0]
    progress_end = progress_range[1]
    table_progress = (progress_end - progress_start) / len(aries_result_dict)

    import java.lang
    import java.util

    db_class = jpype.JClass('com.healthmarketscience.jackcess.DatabaseBuilder')
    jackcess_db = db_class.open(jpype.java.io.File(db_path))
    java_array_of_object = jpype.JArray(jpype.JObject)
    ac_property_table = jackcess_db.getTable("AC_PROPERTY")

    ac_property_updates = update_ac_property_db(ac_property_table, aries_result_dict)

    table_count = 1
    for table_name in aries_result_dict:
        df = aries_result_dict[table_name]
        if df.shape[0] == 0:
            continue

        df = df.where(df.notnull(), None)
        if table_name == AC_PROPERTY:
            date_col = [
                header_column for header_column in ACCESS_DB_HEADERS[table_name] + ac_property_updates
                if ac_property_table.getColumn(header_column).getType().__str__() == 'SHORT_DATE_TIME'
            ]

        else:
            date_col = list(set(['P_DATE', 'D_DATE', 'C_DATE']) & set(df))

        for col in date_col:
            df[col] = date_col_process(df[col].to_list())

        used_headers = ACCESS_DB_HEADERS[table_name][:]
        if table_name == AC_PROPERTY:
            used_headers += ac_property_updates
        records = df[used_headers].values.tolist()

        aries_result_dict[table_name] = None
        del df
        gc.collect()

        # chunk the rows to write to access by chunk, prevent hold all java rows in memory
        rows_chunks = chunks(records, JACKCESS_WRITE_LIMIT)

        for chunk in rows_chunks:
            rows = java.util.ArrayList([])
            for r in chunk:
                rows.add(java_array_of_object(r))

            table = jackcess_db.getTable(table_name)
            table.addRows(rows)

        # update progress by table
        update_progress(user_id, notification_id, progress_start + table_count * table_progress)
        table_count += 1

    jackcess_db.close()


def convert_timestamps(r):
    """Converts any timestamp values in list r to M/Y format

    Args:
        r (list): list of values to be checked
    """
    for index, value in enumerate(r):
        if type(value) is pd.Timestamp:
            r[index] = datetime.datetime.strftime(value, '%m/%Y')


HEADERS_TO_DTYPE_MAP = {
    'api14': 'str',
    'inptID': 'str',
    'chosenID ': 'str',
    'project': 'object_id',
    'dataPool': 'str',
    'dataSource': 'str',
    'geohash': 'str',
    'copied': 'bool',
    'pad_name': 'str',
    'generic': 'bool',
    'chosenKeyID': 'str',
    'dataSourceCustomName': 'str',
    'copiedFrom': 'object_id',
    'wellCalcs': 'object_id',
    'mostRecentImport': 'object_id',
    'mostRecentImportDesc': 'str',
    'mostRecentImportType': 'str',
    'abstract': 'str',
    'acre_spacing': 'float',
    'allocation_type': 'str',
    'api10': 'str',
    'api12': 'str',
    'aries_id': 'str',
    'azimuth': 'float',
    'basin': 'str',
    'bg': 'float',
    'block': 'str',
    'bo': 'float',
    'bubble_point_press': 'float',
    'casing_id': 'float',
    'choke_size': 'float',
    'completion_design': 'str',
    'county': 'str',
    'country': 'str',
    'current_operator_alias': 'str',
    'current_operator_code': 'str',
    'current_operator_ticker': 'str',
    'current_operator': 'str',
    'dew_point_press': 'float',
    'distance_from_base_of_zone': 'float',
    'distance_from_top_of_zone': 'float',
    'district': 'str',
    'drainage_area': 'float',
    'drillinginfo_id': 'str',
    'elevation_type': 'str',
    'elevation': 'float',
    'field': 'str',
    'first_additive_volume': 'float',
    'first_cluster_count': 'float',
    'first_test_flow_tbg_press': 'float',
    'first_test_gor': 'float',
    'first_test_gas_vol': 'float',
    'first_test_oil_vol': 'float',
    'first_test_water_vol': 'float',
    'first_fluid_volume': 'float',
    'first_frac_vendor': 'str',
    'first_max_injection_pressure': 'float',
    'first_max_injection_rate': 'float',
    'first_prop_weight': 'float',
    'first_stage_count': 'float',
    'first_treatment_type': 'str',
    'flow_path': 'str',
    'fluid_type': 'str',
    'footage_in_landing_zone': 'float',
    'formation_thickness_mean': 'float',
    'fracture_conductivity': 'float',
    'gas_c1': 'float',
    'gas_c2': 'float',
    'gas_c3': 'float',
    'gas_co2': 'float',
    'gas_gatherer': 'str',
    'gas_h2': 'float',
    'gas_h2o': 'float',
    'gas_h2s': 'float',
    'gas_he': 'float',
    'gas_ic4': 'float',
    'gas_ic5': 'float',
    'gas_n2': 'float',
    'gas_nc4': 'float',
    'gas_nc5': 'float',
    'gas_nc6': 'float',
    'gas_nc7': 'float',
    'gas_nc8': 'float',
    'gas_nc9': 'float',
    'gas_nc10': 'float',
    'gas_o2': 'float',
    'gas_specific_gravity': 'float',
    'gross_perforated_interval': 'float',
    'ground_elevation': 'float',
    'heelLatitude': 'float',
    'heelLongitude': 'float',
    'hole_direction': 'str',
    'horizontal_spacing': 'float',
    'hz_well_spacing_any_zone': 'float',
    'hz_well_spacing_same_zone': 'float',
    'ihs_id': 'str',
    'initial_respress': 'float',
    'initial_restemp': 'float',
    'landing_zone_base': 'float',
    'landing_zone_top': 'float',
    'landing_zone': 'str',
    'lateral_length': 'float',
    'lease_name': 'str',
    'lease_number': 'str',
    'lower_perforation': 'float',
    'matrix_permeability': 'float',
    'measured_depth': 'float',
    'ngl_gatherer': 'str',
    'num_treatment_records': 'float',
    'oil_api_gravity': 'float',
    'oil_gatherer': 'str',
    'oil_specific_gravity': 'float',
    'parent_child_any_zone': 'str',
    'parent_child_same_zone': 'str',
    'percent_in_zone': 'float',
    'perf_lateral_length': 'float',
    'phdwin_id': 'str',
    'play': 'str',
    'porosity': 'float',
    'previous_operator_alias': 'str',
    'previous_operator_code': 'str',
    'previous_operator_ticker': 'str',
    'previous_operator': 'str',
    'primary_product': 'str',
    'prms_reserves_category': 'str',
    'prms_reserves_sub_category': 'str',
    'prms_resources_class': 'str',
    'production_method': 'str',
    'proppant_mesh_size': 'str',
    'proppant_type': 'str',
    'range': 'str',
    'recovery_method': 'str',
    'refrac_additive_volume': 'float',
    'refrac_cluster_count': 'float',
    'refrac_fluid_volume': 'float',
    'refrac_frac_vendor': 'str',
    'refrac_max_injection_pressure': 'float',
    'refrac_max_injection_rate': 'float',
    'refrac_prop_weight': 'float',
    'refrac_stage_count': 'float',
    'refrac_treatment_type': 'str',
    'rig': 'str',
    'rs': 'float',
    'rseg_id': 'str',
    'section': 'str',
    'sg': 'float',
    'so': 'float',
    'stage_spacing': 'float',
    'state': 'str',
    'status': 'str',
    'subplay': 'str',
    'surfaceLatitude': 'float',
    'surfaceLongitude': 'float',
    'survey': 'str',
    'sw': 'float',
    'target_formation': 'str',
    'tgs_id': 'str',
    'thickness': 'float',
    'toe_in_landing_zone': 'str',
    'toeLatitude': 'float',
    'toeLongitude': 'float',
    'toe_up': 'str',
    'township': 'str',
    'true_vertical_depth': 'float',
    'tubing_depth': 'float',
    'tubing_id': 'float',
    'type_curve_area': 'str',
    'upper_perforation': 'float',
    'vertical_spacing': 'float',
    'vt_well_spacing_any_zone': 'float',
    'vt_well_spacing_same_zone': 'float',
    'well_name': 'str',
    'well_number': 'str',
    'well_type': 'str',
    'zi': 'float',
    'first_proppant_per_fluid': 'float',
    'refrac_proppant_per_perforated_interval': 'float',
    'refrac_fluid_per_perforated_interval': 'float',
    'refrac_proppant_per_fluid': 'float',
    'total_additive_volume': 'float',
    'total_cluster_count': 'int',
    'total_fluid_volume': 'float',
    'total_prop_weight': 'float',
    'total_proppant_per_fluid': 'float',
    'cum_boe': 'float',
    'cum_oil': 'float',
    'cum_gas': 'float',
    'cum_gor': 'float',
    'cum_water': 'float',
    'cum_mmcfge': 'float',
    'cum_boe_per_perforated_interval': 'float',
    'cum_gas_per_perforated_interval': 'float',
    'cum_oil_per_perforated_interval': 'float',
    'cum_water_per_perforated_interval': 'float',
    'cum_mmcfge_per_perforated_interval': 'float',
    'first_12_boe': 'float',
    'first_12_boe_per_perforated_interval': 'float',
    'first_12_gas': 'float',
    'first_12_gas_per_perforated_interval': 'float',
    'first_12_gor': 'float',
    'first_12_oil': 'float',
    'first_12_oil_per_perforated_interval': 'float',
    'first_12_water': 'float',
    'first_12_water_per_perforated_interval': 'float',
    'first_12_mmcfge': 'float',
    'first_12_mmcfge_per_perforated_interval': 'float',
    'first_6_boe': 'float',
    'first_6_boe_per_perforated_interval': 'float',
    'first_6_gas': 'float',
    'first_6_gas_per_perforated_interval': 'float',
    'first_6_gor': 'float',
    'first_6_mmcfge': 'float',
    'first_6_mmcfge_per_perforated_interval': 'float',
    'first_6_oil': 'float',
    'first_6_oil_per_perforated_interval': 'float',
    'first_6_water': 'float',
    'first_6_water_per_perforated_interval': 'float',
    'last_12_boe': 'float',
    'last_12_boe_per_perforated_interval': 'float',
    'last_12_gas': 'float',
    'last_12_gas_per_perforated_interval': 'float',
    'last_12_gor': 'float',
    'last_12_mmcfge': 'float',
    'last_12_mmcfge_per_perforated_interval': 'float',
    'last_12_oil': 'float',
    'last_12_oil_per_perforated_interval': 'float',
    'last_12_water': 'float',
    'last_12_water_per_perforated_interval': 'float',
    'last_month_boe': 'float',
    'last_month_boe_per_perforated_interval': 'float',
    'last_month_gas': 'float',
    'last_month_gas_per_perforated_interval': 'float',
    'last_month_gor': 'float',
    'last_month_mmcfge': 'float',
    'last_month_mmcfge_per_perforated_interval': 'float',
    'last_month_oil': 'float',
    'last_month_oil_per_perforated_interval': 'float',
    'last_month_water': 'float',
    'last_month_water_per_perforated_interval': 'float',
    'month_produced': 'int',
    'first_proppant_per_perforated_interval': 'float',
    'first_fluid_per_perforated_interval': 'float',
    'total_fluid_per_perforated_interval': 'float',
    'total_proppant_per_perforated_interval': 'float',
    'total_stage_count': 'int',
    'has_daily': 'bool',
    'has_monthly': 'bool',
    'has_directional_survey': 'bool',
    'combo_name': 'str',
    'wi_oil': 'float',
    'nri_oil': 'float',
    'before_income_tax_cash_flow': 'float',
    'first_discount_cash_flow': 'float',
    'undiscounted_roi': 'float',
    'irr': 'float',
    'payout_duration': 'float',
    'oil_breakeven': 'float',
    'gas_breakeven': 'float',
    'oil_shrunk_eur': 'float',
    'gas_shrunk_eur': 'float',
    'ngl_shrunk_eur': 'float',
    'oil_shrunk_eur_over_pll': 'float',
    'gas_shrunk_eur_over_pll': 'float',
    'ngl_shrunk_eur_over_pll': 'float'
}
