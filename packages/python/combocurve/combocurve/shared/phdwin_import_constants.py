from enum import Enum

PHDWIN_PD_ENCODING = "ISO-8859-1"


class PhdHeaderCols(Enum):
    phdwin_id = 'phdwin_id'
    lse_id = 'Lse Id'
    lse_name = 'Lse Name'
    lease_no = 'lease_number'
    date = 'Date'
    date1 = 'date1'
    date2 = 'date2'
    length = 'Length'
    sequence = 'Seq'
    year = 'Year'
    month = 'Month'
    day = 'Day'
    hours_on = 'Hours_on'
    oil = 'Oil'
    gas = 'Gas'
    water = 'Water'
    choke = 'Choke'
    ftp = 'flowing_tbg_pressure'
    fcp = 'flowing_csg_pressure'
    fbhp = 'flowing_bh_pressure'
    sitp = 'shut_in_tbg_pressure'
    index = 'index'
    sibhp = 'shut_in_bh_pressure'
    sicp = 'shut_in_csg_pressure'
    start_year = 'start Year'
    start_month = 'start Month'
    start_day = 'start Day'
    end_year = 'end Year'
    end_month = 'end Month'
    end_day = 'end Day'
    value = 'Value'
    value2 = 'Value2'
    type_ = 'Type'
    type_name = 'Type Name'
    mod_pointer = 'Modpointer'
    model_name = 'Modelname'
    model_product_key = 'modelname_productname_askey'
    currency = 'Currency'
    unit_id = 'Unitid'
    unit_str = 'Unitstr'
    model_unit = 'model_unitstr'
    type_mpv_id_key = 'Type_MpvId_asKey'
    type_mod_pointer_key = 'Type_Modpointer_asKey'
    asof_date = 'Asof Date'
    sop = 'Sop'
    product_name = 'Productname'
    product_code = 'Productcode'
    real_param_3 = 'Realparam[3]'
    real_param_4 = 'Realparam[4]'
    real_param_0 = 'Realparam[0]'
    real_param_1 = 'Realparam[1]'
    real_param_2 = 'Realparam[2]'
    bool_param_3 = 'Boolparam[3]'
    bool_param_4 = 'Boolparam[4]'
    bool_param_0 = 'Boolparam[0]'
    bool_param_1 = 'Boolparam[1]'
    bool_param_2 = 'Boolparam[2]'


class ProductCode(Enum):
    gor = 9
    ogr = 10
    wor = 29
    wgr = 34
    wc = 11


daily_prod_col_headers = [
    PhdHeaderCols.phdwin_id.value, PhdHeaderCols.lse_id.value, PhdHeaderCols.lse_name.value, PhdHeaderCols.date.value,
    PhdHeaderCols.year.value, PhdHeaderCols.month.value, PhdHeaderCols.day.value, PhdHeaderCols.hours_on.value,
    PhdHeaderCols.oil.value, PhdHeaderCols.gas.value, PhdHeaderCols.water.value, PhdHeaderCols.choke.value,
    PhdHeaderCols.ftp.value, PhdHeaderCols.fcp.value, PhdHeaderCols.fbhp.value, PhdHeaderCols.sitp.value,
    PhdHeaderCols.index.value, PhdHeaderCols.sibhp.value, PhdHeaderCols.sicp.value
]

monthly_import_header_format = [
    PhdHeaderCols.phdwin_id.name, PhdHeaderCols.lse_name.name, PhdHeaderCols.lse_id.name, PhdHeaderCols.date.name,
    PhdHeaderCols.oil.name, PhdHeaderCols.gas.name, PhdHeaderCols.water.name
]


class PhdwinPTEEnum(Enum):
    type_name = 'type_name'
    product_name = 'productname'
    variable_expense = 'Variable Expense'
    diff_perc = 'Differential Percentage'
    diff_dollar = 'Differential Dollar'
    calc_wi = 'Calcu Using WI'
    affect_econ_limit_1 = 'Affect Econ Limit1'
    affect_econ_limit_3 = 'Affect Econ Limit3'
    cap = 'Cap'
    depth = 'Depth'
    deduct_sev_tax = 'Deduct Sev Tax'
    ad_val_tax = 'ad_val_tax'
    btu = 'Btu'
    temporary_holder = 'need_to_delete'
    local_adval_tax = 'Local Tax Model (Ad Val Tax)'
    state_severance_tax = 'State Tax Model (Severance Tax)'
    reserves_class_name = 'reserves_class_name'
    reserves_sub_cat_name = 'reserves_sub_category_name'
    well_cost = 'WELL COST'
    copas = 'COPAS'
