from collections import defaultdict
from typing import TYPE_CHECKING, Iterable, Union
from bson import ObjectId
from combocurve.shared.constants import PHASES

if TYPE_CHECKING:
    from apps.python_apis.api.context import APIContext


class UpdateEurService():
    '''Updates already existing forecasts in the database with the most recent EUR.

    This class should be instantiated with the following parameters:

        context: The context object of the current tenant.

    Once instantiated, call the class method update_eur() with the following paramters to update the EUR of all
    forecasts-phases-wells in the database.

        forecast_ids: The ids of forecasts to be updated.
        wells: The ids of wells in the forecasts to be updated. If not included, every well in the forecast will be
        updated.
        phases: The phases to update. If not included, all phases will be updated.
        is_deterministic: Whether the forecasts are deterministic or not. All forecasts must be of the same
        deterministic/probabilistic type.
    '''
    def __init__(self, context: "APIContext"):
        self.context = context

    def update_eur(
        self,
        forecast_ids: Union[str, Iterable[str]],
        wells: Iterable[str] = None,
        phases: Iterable[str] = PHASES,
        is_deterministic: bool = True,
    ):
        if isinstance(forecast_ids, str):
            forecast_ids = [forecast_ids]
        if is_deterministic:
            forecast_service = self.context.deterministic_forecast_service
        else:
            forecast_service = self.context.forecast_service
        forecast_datas, cums_and_last_prods = self.get_forecast_datas(forecast_ids, wells, phases, is_deterministic)
        updates = []
        for forecast_id, forecast_data in forecast_datas.items():
            for well_id, well_data in forecast_data.items():
                for phase, phase_data in well_data.items():
                    P_dict = {}
                    ratio = {}
                    base_segs = []
                    forecast_type = phase_data['forecast_type']
                    data_freq = phase_data['data_freq']
                    if forecast_type == 'ratio':
                        ratio = phase_data['ratio']
                        base_segs = well_data[ratio['basePhase']]['P_dict'].get('best', {}).get('segments', [])
                    else:
                        P_dict = phase_data['P_dict']
                    cum = cums_and_last_prods[data_freq][well_id][phase]
                    last_prod_idx = cums_and_last_prods[data_freq][well_id]['last_prod']
                    updates.append(
                        forecast_service.get_update_body(ObjectId(well_id),
                                                         ObjectId(forecast_id),
                                                         phase,
                                                         P_dict=P_dict,
                                                         forecastType=forecast_type,
                                                         ratio=ratio,
                                                         data_freq=data_freq,
                                                         calc_eur=True,
                                                         cum=cum,
                                                         last_prod_idx=last_prod_idx,
                                                         base_segs=base_segs))

        forecast_service.write_forecast_data_to_db(updates)

    def get_forecast_datas(self, forecast_ids, wells, phases, is_deterministic):
        if is_deterministic:
            datas_collection = self.context.deterministic_forecast_datas_collection
        else:
            datas_collection = self.context.forecast_datas_collection

        if wells is not None:
            match = {
                'forecast': {
                    '$in': list(map(ObjectId, forecast_ids))
                },
                'well': {
                    '$in': list(map(ObjectId, wells))
                },
                'phase': {
                    '$in': list(phases)
                }
            }
        else:
            match = {'forecast': {'$in': list(map(ObjectId, forecast_ids))}, 'phase': {'$in': list(phases)}}

        pipeline = [{
            '$match': match
        }, {
            '$project': {
                '_id': 0,
                'forecast_id': '$forecast',
                'well': 1,
                'phase': 1,
                'data_freq': 1,
                'forecast_type': '$forecastType',
                'ratio_P_dict': '$ratio',
                'P_dict': 1,
                'forecastSubType': 1
            }
        }]

        forecast_datas = {_id: defaultdict(dict) for _id in forecast_ids}
        daily_wells = set()
        monthly_wells = set()
        for doc in datas_collection.aggregate(pipeline):
            forecast_id = str(doc.pop('forecast_id'))
            well = str(doc.pop('well'))
            phase = doc.pop('phase')
            if doc['data_freq'] == 'monthly':
                monthly_wells.add(well)
            elif doc['data_freq'] == 'daily':
                daily_wells.add(well)
            else:
                raise ValueError("data_freq must be either 'daily' or 'monthly'.")
            forecast_datas[forecast_id][well][phase] = doc

        cums_and_last_prods = self.context.production_service.get_cums_and_last_prods(
            daily_wells, monthly_wells, phases)

        return forecast_datas, cums_and_last_prods
