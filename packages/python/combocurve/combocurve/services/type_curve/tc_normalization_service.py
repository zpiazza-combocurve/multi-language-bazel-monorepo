from collections import defaultdict
from typing import TYPE_CHECKING, Any, Union
import numpy as np
from bson import ObjectId
from pymongo import UpdateOne
from combocurve.services.type_curve.tc_normalization_data_models import (NORMALIZATION_FACTORS,
                                                                         TypeCurveNormalizationWellDocument,
                                                                         TypeCurveNormalizationDocument, StepsDocument,
                                                                         StepsItem)
from combocurve.science.type_curve.skeleton_normalize import linear, one_to_one, power_law
from combocurve.shared.feature_toggles.forecast_toggles import use_normalization_v2
if TYPE_CHECKING:
    # There are different contexts under which the service can be run, but this one works for type checking.
    from apps.python_apis.api.context import APIContext
    from pandas import DataFrame


class TypeCurveNormalizationService:
    def __init__(self, context=None):
        self.context: APIContext = context

    def get_norm_multipliers(self, tc_id: str, wells: list[str], phases: Union[str, list[str]],
                             is_nominal: bool) -> dict[str, dict[str, np.ndarray]]:
        """
        Fetches and organizes normalization factors.

        Args:
            tc_id: The id of the tc for the multipliers.
            wells: The ids of the wells whose multipliers are to be fetched
            phases: The phases that should be fetched.
            is_nominal: Whether to fetch the nominal multipliers or not. The nominal multipliers can be directly
            applied to the data. This is only available in the v2 schema.

        Returns:
            A dictionary keyed on phases whose values are dictionaries keyed on multiplier type. The final values are
            np.ndarrays containing the multipliers in the same order as the wells. E.g.,
            {
                'oil': {
                    'eur': np.array([...]),
                    'qPeak': np.array([...])
                },
                'gas':{
                    ...
                },
                ...
            }.

            Prior to v2, all multipliers will be returned under the eur key.
        """
        _phases = [phases] if isinstance(phases, str) else phases
        if use_normalization_v2():
            if is_nominal:
                mult_field = 'nominalMultipliers'
            else:
                mult_field = 'multipliers'
            pipeline = [{
                '$match': {
                    'typeCurve': ObjectId(tc_id),
                    'phase': {
                        '$in': _phases
                    },
                    'well': {
                        '$in': [ObjectId(well) for well in wells]
                    }
                }
            }, {
                '$project': {
                    '_id': 0,
                    'phase': 1,
                    'well': 1,
                    'multipliers': {
                        'eur': {
                            '$ifNull': [f'${mult_field}.eur', 1]
                        },
                        'qPeak': f'${mult_field}.qPeak'
                    }
                }
            }]
        else:
            pipeline = [{
                '$match': {
                    'typeCurve': ObjectId(tc_id),
                    'phase': {
                        '$in': _phases
                    },
                    'well': {
                        '$in': [ObjectId(well) for well in wells]
                    }
                }
            }, {
                '$project': {
                    '_id': 0,
                    'phase': 1,
                    'well': 1,
                    'multipliers': {
                        '$arrayElemAt': ['$multipliers', 0]
                    }
                }
            }]

        multipliers = list(self.context.type_curve_normalization_wells_collection.aggregate(pipeline))
        n_wells = len(wells)
        organized_mults = {
            p: {
                factor: np.ones(n_wells, dtype=float) if factor == 'eur' else np.empty(n_wells) * np.nan
                for factor in NORMALIZATION_FACTORS
            }
            for p in _phases
        }
        well_idx = {well: i for i, well in enumerate(wells)}
        for doc in multipliers:
            phase: str = doc['phase']
            loc = well_idx[str(doc['well'])]
            if use_normalization_v2():
                for factor, value in doc['multipliers'].items():
                    organized_mults[phase][factor][loc] = value
            else:
                organized_mults[phase]['eur'][loc] = doc['multipliers']

        return organized_mults

    def get_normalization_steps(self, tc_ids: list[str], phases: list[str]) -> dict[str, dict[str, StepsDocument]]:
        norm_data = defaultdict(dict)
        pipeline = [{
            '$match': {
                'typeCurve': {
                    '$in': list(map(ObjectId, tc_ids))
                },
                'phase': {
                    '$in': phases
                }
            }
        }, {
            '$project': {
                '_id': 0,
                'typeCurve': 1,
                'phase': 1,
                'steps': 1
            }
        }]
        for doc in self.context.type_curve_normalizations_collection.aggregate(pipeline):
            if use_normalization_v2():
                if not doc['steps'].get('normalizationType'):
                    doc['steps'].pop('normalizationType', None)
                norm_data[str(doc['typeCurve'])][doc['phase']] = StepsDocument.parse_obj(doc['steps'])
            else:
                norm_data[str(doc['typeCurve'])][doc['phase']] = StepsDocument(eur=StepsItem.parse_obj(doc['steps'][0]))
        return norm_data

    def apply_normalization_multipliers(self, wells: np.ndarray, multipliers: dict[str, np.ndarray]):
        """Apply set of 2 factor multipliers to set of wells:

        Args:
            wells: An n x m dimensional array, where n is the number of wells, and m is the length of each well's
            production data.
            multipliers: Multiple interfaces excepts either:
                * a dict keyed on 'eur' and 'qPeak' with each value an array of length n.

        Returns:
            An n x m dimensional array of normalized wells.
        """
        ret = []

        if isinstance(multipliers, dict):
            #EUR normalization
            if multipliers['qPeak'].shape[0] and notValid(multipliers['qPeak'][0]):
                eur_multipliers = np.array(multipliers['eur']).astype(float)
                ret = wells * eur_multipliers.reshape(-1, 1)
            #EUR and qPeak 2-factor normalization
            else:
                eur_multipliers = np.array(multipliers['eur']).astype(float)
                qPeak_multipliers = np.array(multipliers['qPeak']).astype(float)
                ret = (wells**eur_multipliers.reshape(-1, 1)) * qPeak_multipliers.reshape(-1, 1)
        else:
            raise TypeError('This type is not currently supported. See doc string.')

        return ret

    @staticmethod
    def _get_normalization_wells_update(document: TypeCurveNormalizationWellDocument,
                                        upsert: bool = False) -> UpdateOne:
        """
        Allows access to updating type_curve_normalization_wells_collection.
        """
        query = {'phase': document.phase, 'typeCurve': document.typeCurve, 'well': document.well}
        multipliers_updates: dict = document.multipliers.dict()
        nominal_multipliers_updates = document.nominalMultipliers.dict()
        return UpdateOne(
            query, {'$set': {
                'multipliers': multipliers_updates,
                'nominalMultipliers': nominal_multipliers_updates
            }}, upsert)

    @staticmethod
    def _get_normalization_update(document: TypeCurveNormalizationDocument, upsert: bool = False) -> UpdateOne:
        """
        Allows access to updating type_curve_normalization_collection.
        """
        query = {'typeCurve': document.typeCurve, 'phase': document.phase}
        if use_normalization_v2():
            updates: dict = document.steps.dict()
        else:
            updates = [document.steps[0].dict()]
        return UpdateOne(query, {'$set': {'steps': updates}}, upsert)

    def bulk_normalization_wells_update(self,
                                        updates: list[Union[dict, TypeCurveNormalizationWellDocument]],
                                        upsert: bool = False):
        """
        Writes the data in updates to the db. If the updates are given as dicts, they are first converted to
        the appropriate dataclass.
        """
        parsed_updates = []
        for update in updates:
            if isinstance(update, dict):
                parsed = TypeCurveNormalizationWellDocument.parse_obj(update)
            else:
                parsed = update
            parsed_updates.append(self._get_normalization_wells_update(parsed, upsert))
        self.context.type_curve_normalization_wells_collection.bulk_write(parsed_updates)

    def bulk_normalizations_update(self,
                                   updates: list[Union[dict, TypeCurveNormalizationDocument]],
                                   upsert: bool = False):
        """
        Writes the data in updates to the db. If the updates are given as dicts, they are first converted to
        the appropriate dataclass.
        """
        parsed_updates = []
        documents: list[TypeCurveNormalizationDocument] = []
        for update in updates:
            if isinstance(update, dict):
                parsed = TypeCurveNormalizationDocument.parse_obj(update)
            else:
                parsed = update
            documents.append(parsed)
            parsed_updates.append(self._get_normalization_update(parsed, upsert))
        self.context.type_curve_normalizations_collection.bulk_write(parsed_updates)
        if upsert:
            # In this case we may have created new normalizations documents. The new IDs get tracked in the
            # type_curves_collection as well.
            tc_ids = set(doc.typeCurve for doc in documents)
            pipeline = [{
                '$match': {
                    'typeCurve': {
                        '$in': list(tc_ids)
                    }
                }
            }, {
                '$group': {
                    '_id': '$typeCurve',
                    'norm_ids': {
                        '$push': '$_id'
                    }
                }
            }]

            tcs_and_ids = self.context.type_curve_normalizations_collection.aggregate(pipeline)
            tc_updates = []
            for tc_group in tcs_and_ids:
                tc_id = tc_group['_id']
                norm_ids = tc_group['norm_ids']
                tc_updates.append(UpdateOne({'_id': tc_id}, {'$set': {'normalizations': norm_ids}}))
            self.context.type_curves_collection.bulk_write(tc_updates)

    @staticmethod
    def normalization_interface(operation, x_chain, y_chain, norm_type, headers, target, a_value=None, b_value=None):
        # Following code from type_curve_normalization_import, it looks like mask is just hardcoded to be True.
        mask = np.ones(len(headers), dtype=bool)
        args = {'x_chain': x_chain, 'y_chain': y_chain, 'normalize_header': headers, 'target': target, 'mask': mask}
        if norm_type == '1_to_1':
            normalizer = one_to_one()
        elif norm_type == 'linear':
            args['slope'] = a_value
            normalizer = linear()
        elif norm_type == 'power_law_fit':
            args['a'] = a_value
            args['b'] = b_value
            normalizer = power_law()
        else:
            raise ValueError("norm_type must be '1_to_1', 'linear', or 'power_law_fit'.")
        if operation == 'apply':
            return normalizer.body(args, operation)['multipliers']
        elif operation == 'inverse':
            return normalizer.body(args, operation)
        else:
            raise ValueError("operation must be 'apply' or 'inverse'.")

    @staticmethod
    def calculate_norm_multipliers(steps: StepsDocument, headers: 'DataFrame', operation: str = 'apply'):
        n_wells = len(headers)
        eur_mults = np.ones(n_wells, dtype=float)
        qPeak_mults = np.ones(n_wells, dtype=float)
        if 'eur' in steps.normalizationType and steps.eur.type != 'no_normalization':
            kwargs = TypeCurveNormalizationService.unpack_steps_item(steps.eur)
            eur_mults = TypeCurveNormalizationService.normalization_interface(operation=operation,
                                                                              headers=headers,
                                                                              **kwargs)
        # TODO We need to move this to qPeak.
        if 'q_peak' in steps.normalizationType and steps.qPeak.type != 'no_normalization':
            kwargs = TypeCurveNormalizationService.unpack_steps_item(steps.qPeak)
            qPeak_mults = TypeCurveNormalizationService.normalization_interface(operation=operation,
                                                                                headers=headers,
                                                                                **kwargs)
        return {'eur': eur_mults, 'qPeak': qPeak_mults}

    @staticmethod
    def unpack_steps_item(steps: StepsItem):
        x_chain = TypeCurveNormalizationService._sanitize_chain(steps.base.x.dict())
        y_chain = TypeCurveNormalizationService._sanitize_chain(steps.base.y.dict())
        norm_type = steps.type
        target = steps.target
        a_value = steps.aValue
        b_value = steps.bValue
        return {
            'x_chain': x_chain,
            'y_chain': y_chain,
            'norm_type': norm_type,
            'target': target,
            'a_value': a_value,
            'b_value': b_value
        }

    @staticmethod
    def _sanitize_chain(chain: dict[str, Any]):
        start_feature = chain.pop('startFeature')
        chain['start_feature'] = start_feature
        op_chain: list[dict[str, str]] = chain.pop('opChain')
        chain['op_chain'] = [{'op': o['op'], 'op_feature': o['opFeature']} for o in op_chain]
        return chain


def notValid(number):
    if number is None or np.isnan(number):
        return True
    else:
        return False
