from typing import AnyStr, List, Dict
from bson import ObjectId

from .proximity_data_models import (NormalizationBase, NormalizationBaseAxis, NormalizationHeaders,
                                    ProximityCriteriaSettings, ProximitySettings, ProximityFitSettings,
                                    ProximityNormalizationSettings, WellForecastPair)


def _create_criteria_dict(criteria: Dict) -> Dict:
    '''
        Takes a dict with camelCase keys and converts them to snake_case.

        Args:
            criteria (Dict): the dict to convert

        Returns:
            Dict: same dictionary, with keys adjusted to snake_case
        '''
    return {
        'criteria_type': criteria.get('criteriaType'),
        'mandatory': criteria.get('mandatory'),
        'absolute_range': criteria.get('absoluteRange'),
        'relative_value': criteria.get('relativeValue'),
        'relative_percentage': criteria.get('relativePercentage'),
    }


def create_settings_object(neighbor_params: Dict, normalization_params: Dict, fit_params: Dict) -> ProximitySettings:
    '''
    Takes neighbor, normalization, and fit params and prepares an instance of the 'ProximitySettings'
    dataclass.

    Args:
        neighbor_params (Dict): neighbor parameters and criteria
        normalization_params (Dict): parameters for normalization
        fit_params (Dict): proximity fit parameters

    Returns:
        ProximitySettings: contains proximity settings for writing to the db
    '''
    criteria_settings = ProximityCriteriaSettings.parse_obj({
        'search_radius':
        neighbor_params['neighbor_dict']['searchRadius'],
        'criteria': [
            _create_criteria_dict(neighbor_params['neighbor_dict'][c])
            for c in neighbor_params['neighbor_dict']['selectedFields']
        ]
    })

    phase: str = neighbor_params['phase']

    norm_params = normalization_params[phase]

    # These two probably need some data preparation before being turned into the dataclasses
    normalization_settings = ProximityNormalizationSettings(
        range_start=norm_params['pValues'][0],
        range_end=norm_params['pValues'][1],
        base=NormalizationBase(
            x=NormalizationBaseAxis.parse_obj(norm_params['xChain']),
            y=NormalizationBaseAxis.parse_obj(norm_params['yChain']),
        ),
        type=norm_params['normalizationType'],
        headers=NormalizationHeaders.parse_obj(norm_params['target']))
    fit_settings = ProximityFitSettings.parse_obj(only_keys(fit_params, ProximityFitSettings.get_field_names()))

    settings = ProximitySettings(neighbor_criteria_settings=criteria_settings,
                                 normalization_settings=normalization_settings,
                                 fit_settings=fit_settings)
    return settings


def create_well_forecast_pairs(well_forecast_map: Dict[AnyStr, AnyStr]) -> List[WellForecastPair]:
    return [WellForecastPair(well=ObjectId(k), forecast=ObjectId(v)) for k, v in well_forecast_map.items()]


def only_keys(obj: Dict, keys: List) -> Dict:
    return {k: v for k, v in obj.items() if k in keys}


def exclude_keys(obj: Dict, keys: List) -> Dict:
    return {k: v for k, v in obj.items() if k not in keys}
