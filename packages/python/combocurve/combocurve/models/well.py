from mongoengine import (Document, ObjectIdField, StringField, BooleanField, DictField, IntField, FloatField,
                         ValidationError)

from combocurve.shared.helpers import clean_id
from combocurve.models.custom_fields import CustomDateTimeField, CustomBooleanField

SCHEMA_VERSION = 1


def get_well_model(db_name):
    class Well(Document):
        schemaVersion = IntField(default=SCHEMA_VERSION)
        api14 = StringField()
        inptID = StringField()
        chosenID = StringField()
        project = ObjectIdField(default=None, null=True)  # ref = 'projects'
        dataPool = StringField(choices=['external', 'internal'], default='internal')
        dataSource = StringField(choices=['di', 'ihs', 'phdwin', 'aries', 'internal', 'other'], default='other')

        location = DictField(default=None)
        toeLocation = DictField(default=None)
        heelLocation = DictField(default=None)
        geohash = StringField()
        copied = BooleanField(default=False)
        pad_name = StringField()
        generic = BooleanField()
        chosenKeyID = StringField()
        dataSourceCustomName = StringField()
        copiedFrom = ObjectIdField()  # ref = 'wells'
        wellCalcs = ObjectIdField()  # ref = 'well-calcs'
        mostRecentImport = ObjectIdField()  # ref = 'data-imports'
        mostRecentImportDesc = StringField()
        mostRecentImportType = StringField(choices=['db', 'api', 'spreadsheet', 'aries', 'phdwin'],
                                           default='spreadsheet')
        mostRecentImportDate = CustomDateTimeField()

        abstract = StringField()
        acre_spacing = FloatField()
        allocation_type = StringField()
        api10 = StringField()
        api12 = StringField()
        aries_id = StringField()
        azimuth = FloatField()
        basin = StringField()
        bg = FloatField()
        block = StringField()
        bo = FloatField()
        bubble_point_press = FloatField()
        casing_id = FloatField()
        choke_size = FloatField()
        completion_design = StringField()
        completion_end_date = CustomDateTimeField()
        completion_start_date = CustomDateTimeField()
        county = StringField()
        country = StringField()
        current_operator_alias = StringField()
        current_operator_code = StringField()
        current_operator_ticker = StringField()
        current_operator = StringField()
        date_rig_release = CustomDateTimeField()
        dew_point_press = FloatField()
        distance_from_base_of_zone = FloatField()
        distance_from_top_of_zone = FloatField()
        district = StringField()
        drainage_area = FloatField()
        drill_end_date = CustomDateTimeField()
        drill_start_date = CustomDateTimeField()
        drillinginfo_id = StringField()
        elevation_type = StringField()
        elevation = FloatField()
        field = StringField()
        first_additive_volume = FloatField()
        first_cluster_count = FloatField()
        first_test_flow_tbg_press = FloatField()
        first_test_gor = FloatField()
        first_test_gas_vol = FloatField()
        first_test_oil_vol = FloatField()
        first_test_water_vol = FloatField()
        first_fluid_volume = FloatField(default=None, null=True)
        first_frac_vendor = StringField()
        first_max_injection_pressure = FloatField()
        first_max_injection_rate = FloatField()
        first_prod_date = CustomDateTimeField(default=None, null=True)
        first_prop_weight = FloatField(default=None, null=True)
        first_stage_count = FloatField()
        first_treatment_type = StringField()
        flow_path = StringField()
        fluid_type = StringField()
        footage_in_landing_zone = FloatField()
        formation_thickness_mean = FloatField()
        fracture_conductivity = FloatField()
        gas_analysis_date = CustomDateTimeField()
        gas_c1 = FloatField()
        gas_c2 = FloatField()
        gas_c3 = FloatField()
        gas_co2 = FloatField()
        gas_gatherer = StringField()
        gas_h2 = FloatField()
        gas_h2o = FloatField()
        gas_h2s = FloatField()
        gas_he = FloatField()
        gas_ic4 = FloatField()
        gas_ic5 = FloatField()
        gas_n2 = FloatField()
        gas_nc4 = FloatField()
        gas_nc5 = FloatField()
        gas_nc6 = FloatField()
        gas_nc7 = FloatField()
        gas_nc8 = FloatField()
        gas_nc9 = FloatField()
        gas_nc10 = FloatField()
        gas_o2 = FloatField()
        gas_specific_gravity = FloatField()
        gross_perforated_interval = FloatField()
        ground_elevation = FloatField()
        heelLatitude = FloatField()
        heelLongitude = FloatField()
        hole_direction = StringField()
        horizontal_spacing = FloatField()
        hz_well_spacing_any_zone = FloatField()
        hz_well_spacing_same_zone = FloatField()
        ihs_id = StringField()
        initial_respress = FloatField()
        initial_restemp = FloatField()
        landing_zone_base = FloatField()
        landing_zone_top = FloatField()
        landing_zone = StringField()
        lateral_length = FloatField(default=None, null=True)
        lease_name = StringField()
        lease_number = StringField()
        lower_perforation = FloatField()
        matrix_permeability = FloatField()
        measured_depth = FloatField(default=None, null=True)
        ngl_gatherer = StringField()
        num_treatment_records = FloatField()
        oil_api_gravity = FloatField()
        oil_gatherer = StringField()
        oil_specific_gravity = FloatField()
        parent_child_any_zone = StringField()
        parent_child_same_zone = StringField()
        percent_in_zone = FloatField()
        perf_lateral_length = FloatField(default=None, null=True)
        permit_date = CustomDateTimeField()
        phdwin_id = StringField()
        play = StringField()
        porosity = FloatField()
        previous_operator_alias = StringField()
        previous_operator_code = StringField()
        previous_operator_ticker = StringField()
        previous_operator = StringField()
        primary_product = StringField(default=None, null=True)
        prms_reserves_category = StringField()
        prms_reserves_sub_category = StringField()
        prms_resources_class = StringField()
        production_method = StringField()
        proppant_mesh_size = StringField()
        proppant_type = StringField()
        range = StringField()
        recovery_method = StringField()
        refrac_additive_volume = FloatField()
        refrac_cluster_count = FloatField()
        refrac_date = CustomDateTimeField()
        refrac_fluid_volume = FloatField()
        refrac_frac_vendor = StringField()
        refrac_max_injection_pressure = FloatField()
        refrac_max_injection_rate = FloatField()
        refrac_prop_weight = FloatField()
        refrac_stage_count = FloatField()
        refrac_treatment_type = StringField()
        rig = StringField()
        rs = FloatField()
        rseg_id = StringField()
        section = StringField()
        sg = FloatField()
        so = FloatField()
        spud_date = CustomDateTimeField()
        stage_spacing = FloatField()
        state = StringField()
        status = StringField()
        subplay = StringField()
        surfaceLatitude = FloatField(default=None, null=True)
        surfaceLongitude = FloatField(default=None, null=True)
        survey = StringField()
        sw = FloatField()
        target_formation = StringField()
        tgs_id = StringField()
        thickness = FloatField()
        til = CustomDateTimeField()
        toe_in_landing_zone = StringField()
        toeLatitude = FloatField()
        toeLongitude = FloatField()
        toe_up = StringField()
        township = StringField()
        true_vertical_depth = FloatField(default=None, null=True)
        tubing_depth = FloatField()
        tubing_id = FloatField()
        type_curve_area = StringField()
        upper_perforation = FloatField()
        vertical_spacing = FloatField()
        vt_well_spacing_any_zone = FloatField()
        vt_well_spacing_same_zone = FloatField()
        well_name = StringField()
        well_number = StringField()
        well_type = StringField()
        zi = FloatField()

        # custom
        custom_string_0 = StringField()
        custom_string_1 = StringField()
        custom_string_2 = StringField()
        custom_string_3 = StringField()
        custom_string_4 = StringField()
        custom_string_5 = StringField()
        custom_string_6 = StringField()
        custom_string_7 = StringField()
        custom_string_8 = StringField()
        custom_string_9 = StringField()
        custom_string_10 = StringField()
        custom_string_11 = StringField()
        custom_string_12 = StringField()
        custom_string_13 = StringField()
        custom_string_14 = StringField()
        custom_string_15 = StringField()
        custom_string_16 = StringField()
        custom_string_17 = StringField()
        custom_string_18 = StringField()
        custom_string_19 = StringField()
        custom_number_0 = FloatField()
        custom_number_1 = FloatField()
        custom_number_2 = FloatField()
        custom_number_3 = FloatField()
        custom_number_4 = FloatField()
        custom_number_5 = FloatField()
        custom_number_6 = FloatField()
        custom_number_7 = FloatField()
        custom_number_8 = FloatField()
        custom_number_9 = FloatField()
        custom_number_10 = FloatField()
        custom_number_11 = FloatField()
        custom_number_12 = FloatField()
        custom_number_13 = FloatField()
        custom_number_14 = FloatField()
        custom_number_15 = FloatField()
        custom_number_16 = FloatField()
        custom_number_17 = FloatField()
        custom_number_18 = FloatField()
        custom_number_19 = FloatField()
        custom_date_0 = CustomDateTimeField()
        custom_date_1 = CustomDateTimeField()
        custom_date_2 = CustomDateTimeField()
        custom_date_3 = CustomDateTimeField()
        custom_date_4 = CustomDateTimeField()
        custom_date_5 = CustomDateTimeField()
        custom_date_6 = CustomDateTimeField()
        custom_date_7 = CustomDateTimeField()
        custom_date_8 = CustomDateTimeField()
        custom_date_9 = CustomDateTimeField()
        custom_bool_0 = CustomBooleanField()
        custom_bool_1 = CustomBooleanField()
        custom_bool_2 = CustomBooleanField()
        custom_bool_3 = CustomBooleanField()
        custom_bool_4 = CustomBooleanField()

        # Calcs
        first_proppant_per_fluid = FloatField(default=None, null=True)  # (first_prop_weight / first_fluid_volume) / 42
        refrac_proppant_per_perforated_interval = FloatField(default=None,
                                                             null=True)  # refrac_prop_weight / perf_lateral_length
        refrac_fluid_per_perforated_interval = FloatField(default=None,
                                                          null=True)  # refrac_fluid_volume / perf_lateral_length
        refrac_proppant_per_fluid = FloatField(default=None,
                                               null=True)  # (refrac_prop_weight / refrac_fluid_volume) / 42
        total_additive_volume = FloatField()  # first_additive_volume + refrac_additive_volume
        total_cluster_count = IntField()  # first_cluster_count + refrac_cluster_count
        total_fluid_volume = FloatField(default=None, null=True)  # first_fluid_volume + refrac_fluid_volume
        total_prop_weight = FloatField(default=None, null=True)  # first_prop_weight + refrac_prop_weight
        total_proppant_per_fluid = FloatField(default=None, null=True)  # (total_prop_weight / total_fluid_volume) / 42

        # production related calcs
        cum_boe = FloatField()
        cum_oil = FloatField()
        cum_gas = FloatField()
        cum_gor = FloatField()
        cum_water = FloatField()
        cum_mmcfge = FloatField()
        cum_boe_per_perforated_interval = FloatField()
        cum_gas_per_perforated_interval = FloatField()
        cum_oil_per_perforated_interval = FloatField()
        cum_water_per_perforated_interval = FloatField()
        cum_mmcfge_per_perforated_interval = FloatField()
        first_12_boe = FloatField()
        first_12_boe_per_perforated_interval = FloatField()
        first_12_gas = FloatField()
        first_12_gas_per_perforated_interval = FloatField()
        first_12_gor = FloatField()
        first_12_oil = FloatField()
        first_12_oil_per_perforated_interval = FloatField()
        first_12_water = FloatField()
        first_12_water_per_perforated_interval = FloatField()
        first_12_mmcfge = FloatField()
        first_12_mmcfge_per_perforated_interval = FloatField()
        first_6_boe = FloatField()
        first_6_boe_per_perforated_interval = FloatField()
        first_6_gas = FloatField()
        first_6_gas_per_perforated_interval = FloatField()
        first_6_gor = FloatField()
        first_6_mmcfge = FloatField()
        first_6_mmcfge_per_perforated_interval = FloatField()
        first_6_oil = FloatField()
        first_6_oil_per_perforated_interval = FloatField()
        first_6_water = FloatField()
        first_6_water_per_perforated_interval = FloatField()
        last_12_boe = FloatField()
        last_12_boe_per_perforated_interval = FloatField()
        last_12_gas = FloatField()
        last_12_gas_per_perforated_interval = FloatField()
        last_12_gor = FloatField()
        last_12_mmcfge = FloatField()
        last_12_mmcfge_per_perforated_interval = FloatField()
        last_12_oil = FloatField()
        last_12_oil_per_perforated_interval = FloatField()
        last_12_water = FloatField()
        last_12_water_per_perforated_interval = FloatField()
        last_month_boe = FloatField()
        last_month_boe_per_perforated_interval = FloatField()
        last_month_gas = FloatField()
        last_month_gas_per_perforated_interval = FloatField()
        last_month_gor = FloatField()
        last_month_mmcfge = FloatField()
        last_month_mmcfge_per_perforated_interval = FloatField()
        last_month_oil = FloatField()
        last_month_oil_per_perforated_interval = FloatField()
        last_month_water = FloatField()
        last_month_water_per_perforated_interval = FloatField()
        month_produced = IntField()
        last_prod_date_monthly = CustomDateTimeField()
        last_prod_date_daily = CustomDateTimeField()

        # Indexed calcs
        first_proppant_per_perforated_interval = FloatField(default=None,
                                                            null=True)  # first_prop_weight / perf_lateral_length
        first_fluid_per_perforated_interval = FloatField(default=None,
                                                         null=True)  # first_fluid_volume / perf_lateral_length
        total_fluid_per_perforated_interval = FloatField(default=None,
                                                         null=True)  # total_fluid_volume / perf_lateral_length
        total_proppant_per_perforated_interval = FloatField(default=None,
                                                            null=True)  # total_prop_weight / perf_lateral_length
        total_stage_count = IntField()  # first_stage_count + refrac_stage_count

        # production related indexed calcs
        has_daily = BooleanField()
        has_monthly = BooleanField()
        has_directional_survey = BooleanField()
        first_prod_date_daily_calc = CustomDateTimeField(default=None, null=True)
        first_prod_date_monthly_calc = CustomDateTimeField(default=None, null=True)

        # Econ run calcs
        combo_name = StringField()
        econ_run_date = CustomDateTimeField()
        wi_oil = FloatField()
        nri_oil = FloatField()
        before_income_tax_cash_flow = FloatField()
        first_discount_cash_flow = FloatField()
        econ_first_production_date = CustomDateTimeField()
        undiscounted_roi = FloatField()
        irr = FloatField()
        payout_duration = FloatField()
        oil_breakeven = FloatField()
        gas_breakeven = FloatField()
        oil_shrunk_eur = FloatField()
        gas_shrunk_eur = FloatField()
        ngl_shrunk_eur = FloatField()
        oil_shrunk_eur_over_pll = FloatField()
        gas_shrunk_eur_over_pll = FloatField()
        ngl_shrunk_eur_over_pll = FloatField()

        meta = {'collection': 'wells', 'strict': False, 'db_alias': db_name}

        def __init__(self, *args, **kwargs):
            super(Well, self).__init__(*args, **kwargs)
            self._fix_ids()
            self._remove_invalid_fields()

        def _fix_ids(self):
            self.api10 = clean_id(self.api10)
            self.api12 = clean_id(self.api12)
            self.api14 = clean_id(self.api14)
            self.chosenID = clean_id(self.chosenID)

        def _remove_invalid_fields(self):
            try:
                self.validate()
            except ValidationError as e:
                for field in e.to_dict():
                    self[field] = None

    return Well


production_calcs = {
    'cum_boe',
    'cum_oil',
    'cum_gas',
    'cum_gor',
    'cum_water',
    'cum_mmcfge',
    'cum_boe_per_perforated_interval',
    'cum_gas_per_perforated_interval',
    'cum_oil_per_perforated_interval',
    'cum_water_per_perforated_interval',
    'cum_mmcfge_per_perforated_interval',
    'first_12_boe',
    'first_12_boe_per_perforated_interval',
    'first_12_gas',
    'first_12_gas_per_perforated_interval',
    'first_12_gor',
    'first_12_oil',
    'first_12_oil_per_perforated_interval',
    'first_12_water',
    'first_12_water_per_perforated_interval',
    'first_12_mmcfge',
    'first_12_mmcfge_per_perforated_interval',
    'first_6_boe',
    'first_6_boe_per_perforated_interval',
    'first_6_gas',
    'first_6_gas_per_perforated_interval',
    'first_6_gor',
    'first_6_mmcfge',
    'first_6_mmcfge_per_perforated_interval',
    'first_6_oil',
    'first_6_oil_per_perforated_interval',
    'first_6_water',
    'first_6_water_per_perforated_interval',
    'last_12_boe',
    'last_12_boe_per_perforated_interval',
    'last_12_gas',
    'last_12_gas_per_perforated_interval',
    'last_12_gor',
    'last_12_mmcfge',
    'last_12_mmcfge_per_perforated_interval',
    'last_12_oil',
    'last_12_oil_per_perforated_interval',
    'last_12_water',
    'last_12_water_per_perforated_interval',
    'last_month_boe',
    'last_month_boe_per_perforated_interval',
    'last_month_gas',
    'last_month_gas_per_perforated_interval',
    'last_month_gor',
    'last_month_mmcfge',
    'last_month_mmcfge_per_perforated_interval',
    'last_month_oil',
    'last_month_oil_per_perforated_interval',
    'last_month_water',
    'last_month_water_per_perforated_interval',
    'month_produced',
    'last_prod_date_monthly',
    'last_prod_date_daily',
    'has_daily',
    'has_monthly',
    'first_prod_date_daily_calc',
    'first_prod_date_monthly_calc',
}
