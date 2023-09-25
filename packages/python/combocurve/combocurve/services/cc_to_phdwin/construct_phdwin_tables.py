from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME
from combocurve.shared.np_helpers import get_well_order_by_names
from combocurve.services.cc_to_phdwin.assumptions import (btu, capex, differentials, expenses, forecast, general_info,
                                                          ownership, pricing, shrink, tax)
from combocurve.services.cc_to_phdwin.error import ErrorLog
from combocurve.services.cc_to_phdwin.helpers import get_date_dict
from combocurve.services.lookup_table_service import EmbeddedLookupTableService


class CCToPhdwin:
    def __init__(self, context, user_id, notification_id, well_data_list, chosen_key, assumptions):
        els = EmbeddedLookupTableService(context)
        self.error_log = ErrorLog()
        els.fill_in_embedded_lookup(well_data_list)
        self.chosen_key = chosen_key
        self.context = context
        self.user_id = user_id
        self.notification_id = notification_id
        self.well_data_list = well_data_list
        self.assumptions = assumptions
        self.well_order_list = get_well_order_by_names([w['well'].get('well_name', '') for w in well_data_list])
        self.processed_table_dict = {}
        self.date_dict, self.use_asof_reference = get_date_dict(well_data_list, self.well_order_list, self.error_log)

    def execute(self):
        for idx, assumption in enumerate(self.assumptions):
            assumption_key = assumption['assumptionKey']
            if assumption_key not in create_phdwin_table:
                continue

            ll_progress = 10 + int((idx) * ((90 - 10) / len(self.assumptions)))
            ul_progress = 10 + int((idx + 1) * ((90 - 10) / len(self.assumptions)))
            self.context.pusher.trigger_user_channel(self.context.subdomain, self.user_id,
                                                     USER_NOTIFICATION_UPDATE_EVENT_NAME, {
                                                         'id': self.notification_id,
                                                         'progress': ll_progress
                                                     })
            # get the vital dates per well (fpd, first segment date, discount_date, asof_date)
            # also check if asof date is consistent across wells
            if assumption_key == 'shrink_btu':
                for key in ['shrink', 'btu']:
                    self.processed_table_dict[key] = create_phdwin_table[assumption_key][key](
                        self.context,
                        self.notification_id,
                        self.user_id,
                        self.date_dict,
                        self.well_order_list,
                        self.well_data_list, (ll_progress, ul_progress),
                        user_key=self.chosen_key,
                        error_log=self.error_log,
                        use_asof_reference=self.use_asof_reference)
            else:
                self.processed_table_dict[assumption_key] = create_phdwin_table[assumption_key](
                    self.context,
                    self.notification_id,
                    self.user_id,
                    self.date_dict,
                    self.well_order_list,
                    self.well_data_list, (ll_progress, ul_progress),
                    user_key=self.chosen_key,
                    error_log=self.error_log,
                    use_asof_reference=self.use_asof_reference)

        return self.processed_table_dict, self.error_log


create_phdwin_table = {
    'general_info': general_info.create_phdwin_general_info_table,
    'expenses': expenses.create_phdwin_expense_table,
    'differentials': differentials.create_phdwin_differential_table,
    'pricing': pricing.create_phdwin_pricing_table,
    'capex': capex.create_phdwin_capex_table,
    'ownership_reversion': ownership.create_phdwin_ownership_table,
    'forecast': forecast.create_phdwin_forecast_table,
    'production_taxes': tax.create_phdwin_tax_table,
    'shrink_btu': {
        'shrink': shrink.create_phdwin_shrink_table,
        'btu': btu.create_phdwin_btu_table
    }
}
