from itertools import repeat
import pandas as pd
from bson import ObjectId
from typing import TYPE_CHECKING
from pymongo import UpdateOne
import numpy as np
import numpy.ma as ma
from scipy import spatial
from pyproj import CRS
from pyproj import Transformer
from pyproj.aoi import AreaOfInterest
from pyproj.database import query_utm_crs_info
from combocurve.services.well_spacing.well_spacing_helper import (absolute_coordinates, get_min_distances,
                                                                  get_closest_wellID, last_false_idx)
from combocurve.services.well_spacing.well_spacing_helper import get_svd, get_min_dist_for_one_well
from combocurve.services.well_spacing.well_spacing_helper import get_min_distance_point_line
from combocurve.shared.db_import import bulkwrite_operation
from combocurve.utils.constants import TASK_STATUS_COMPLETED, TASK_STATUS_RUNNING

if TYPE_CHECKING:
    from apps.python_apis.api.context import APIContext

METERS_TO_FEET = 3.28084
MIN_LONG = -180.0
MAX_LONG = 180.0
CRS_WIDTH = 6.0
GRIDS = np.linspace(MIN_LONG, MAX_LONG, num=61, endpoint=True)
SURVEY_SIZE = 300
FLAT_THRESHOLD = 85
DIFF_THRESHOLD = 0.2


class WellSpacingService:
    def __init__(self, context):
        self.context: APIContext = context
        self.well_directional_surveys_collection = self.context.well_directional_surveys_collection
        self.wells_collection = self.context.wells_collection
        self.project_collection = self.context.project_collection

    def calculate_well_spacing(self, params):
        notification_id = params['notificationId']
        zone_type = params['zoneType']
        distance_type = params['distanceType']
        epsg = params['epsgNumber']
        selected_wells = params['wellIds']
        all_well_ids = params['allWellIds']

        # Send notification to flag the start of retrieving data from mongodb
        self.context.notification_service.update_notification_with_notifying_target(
            notification_id, {
                'status': TASK_STATUS_RUNNING,
                'description': 'Preparing calculation...'
            })

        # Filter out all_wells and target_wells that satisfy the data requirement
        target_wells, all_wells = self._get_target_and_all(selected_wells, all_well_ids, distance_type, zone_type)
        num_wells_calculated = len(target_wells)

        # Query data from Mongodb based on different options and call the preprocessing functions
        if distance_type == 'shl':
            data = self._get_surface_data(all_wells)
            well_ids, heads, landing_zone = self._preprocess_surface_data(data,
                                                                          zone_type_selected=zone_type,
                                                                          epsg_number=epsg)
        else:
            data = self._get_directional_survey_data(all_wells)
            well_ids, heads, toes, heels, mids, landing_zone, surveys, n_wells = \
                self._preprocess_directional_survey_data(data, zone_type_selected=zone_type, epsg_number=epsg)
            num_wells_calculated = n_wells
        if distance_type == 'mid-normal':
            for survey in data:
                if not any(num > 84.99 for num in survey['inclination']):
                    target_wells.remove(ObjectId(survey['well'][0]['_id']))
            num_wells_calculated = len(target_wells)

        # Store the post-processed data for calculation in a dataframe
        if distance_type == 'shl':
            locations = {'wellIds': well_ids, 'head': heads}
        else:
            locations = {'wellIds': well_ids, 'head': heads, 'heel': heels, 'toe': toes, 'mid': mids}
        if zone_type == 'same':
            locations['landing_zone'] = landing_zone
        well_spacing = pd.DataFrame(data=locations)
        well_spacing_copy = well_spacing.set_index('wellIds')
        well_spacing_dict = well_spacing_copy.to_dict('index')

        if distance_type == 'mid' or distance_type == 'shl':
            min_distances = self._get_closest_distance(well_spacing,
                                                       target_wells,
                                                       zone=zone_type,
                                                       distance=distance_type)
        else:
            linear_params = self._get_linear_params(surveys, well_spacing_dict)
            min_distances = self._get_closest_distance_normal(well_spacing_dict,
                                                              target_wells,
                                                              linear_params,
                                                              notification_id,
                                                              zone=zone_type)

        res = self._update_well_headers(min_distances, zone=zone_type)
        self.context.notification_service.update_notification_with_notifying_target(
            notification_id, {
                'status': TASK_STATUS_COMPLETED,
                'description': f'Calculated {num_wells_calculated}/{len(selected_wells)} wells.'
            })

        return res

    def _preprocess_surface_data(self, surface_data, zone_type_selected, epsg_number):
        """function to preproses surface well head data when the selection is "SHL"

        Args:
            surface_data (dict()): well head information from database
            zone_type_selected (string): "same" | "any
            epsg_number (int): either "0" or user input

        Returns:
            list(): heads, well_ids, landing_zone
        """
        heads, well_ids, landing_zone = [], [], []
        crs_transformers = self._crs_transformers(epsg_number, surface_data, True)

        for well_surface in surface_data:
            head_lat = well_surface['surfaceLatitude']
            head_long = well_surface['surfaceLongitude']
            elevation_ref = well_surface['elevation']
            head_abs = self._get_head_projection(head_lat, head_long, elevation_ref, *next(crs_transformers))
            heads.append(head_abs)
            well_ids.append(well_surface['_id'])
            if zone_type_selected == 'same':
                this_zone = well_surface['landing_zone']
                landing_zone.append(this_zone)
        return well_ids, heads, landing_zone

    def _preprocess_directional_survey_data(self, directional_survey_data, zone_type_selected, epsg_number):
        """function to preprocess directional survey data

        Args:
            directional_survey_data (dict()): survey data from database
            zone_type_selected (string): either "same" or "any"
            epsg_number (int): either "0" or some user input number

        Returns:
            list(): well_ids, heads, toes, heels, mids, landing_zone
            dict(): surveys
        """
        _, directional_survey_data = self._filter_surveys_non_mixed(directional_survey_data)
        crs_transformers = self._crs_transformers(epsg_number, directional_survey_data)
        n_wells = len(directional_survey_data)

        # Pre-allocate memory. This should be enough, so go with a try-except block, as opposed
        # to taking the hit at each iteration to check against the array length.
        coordinates: np.ma.masked_array = np.ma.empty((n_wells, SURVEY_SIZE, 5), dtype=float)
        coordinates.mask = np.ones_like(coordinates.data, dtype=bool)
        survey_lengths = np.empty(n_wells, dtype=int)
        has_inclination = np.zeros(n_wells, dtype=bool)
        heads = np.empty((n_wells, 3), dtype=float)
        landing_zone, well_ids, surveys = [], [], {}

        for i, survey in enumerate(directional_survey_data):
            survey_x = survey['deviationEW']
            survey_y = survey['deviationNS']
            survey_z = survey['trueVerticalDepth']
            survey_md = survey.get('measuredDepth')
            survey_inc = survey['inclination']
            survey_lat = survey['well'][0]['surfaceLatitude']
            survey_long = survey['well'][0]['surfaceLongitude']
            survey_elev = survey['well'][0]['elevation']
            well_id = survey['well'][0]['_id']
            if zone_type_selected == 'same':
                landing_zone.append(survey['well'][0]['landing_zone'])

            surveys[well_id] = survey
            well_ids.append(well_id)
            survey_length = len(survey_x)
            has_inclination[i] = len(survey_inc) > 0 and any(survey_inc)
            survey_lengths[i] = survey_length
            heads[i, :] = self._get_head_projection(survey_lat, survey_long, survey_elev, *next(crs_transformers))

            try:
                for j, series in enumerate((survey_x, survey_y, survey_z)):
                    coordinates[i, :survey_length, j] = series
                if not has_inclination[i]:
                    coordinates[i, :survey_length, 3] = survey_md
                else:
                    coordinates[i, :survey_length, 4] = survey_inc
                coordinates.mask[i, :survey_length, :] = False
            except ValueError:
                _coordinates: np.ma.masked_array = np.ma.empty((n_wells, survey_length, 5), dtype=float)
                _coordinates.mask = np.ones_like(_coordinates.data, dtype=bool)
                _coordinates[:, :coordinates.shape[1], :] = coordinates.data
                _coordinates.mask[:, :coordinates.shape[1], :] = coordinates.mask
                coordinates = _coordinates
                for j, series in enumerate((survey_x, survey_y, survey_z)):
                    coordinates[i, :survey_length, j] = series
                if not has_inclination[i]:
                    coordinates[i, :survey_length, 3] = survey_md
                else:
                    coordinates[i, :survey_length, 4] = survey_inc
                coordinates.mask[i, :survey_length, :] = False

        heels, toes, mids = self._heels_toes_midpoints(coordinates, heads, has_inclination)

        return well_ids, heads.tolist(), toes, heels, mids, landing_zone, surveys, n_wells

    def _update_well_headers(self, min_distances, zone='any'):
        use_columns = ['wellIds', 'min_dist_hz' + zone, 'min_dist_vt' + zone, 'closest_well']
        if zone == 'any':
            update_headers = ['hz_well_spacing_any_zone', 'vt_well_spacing_any_zone', 'closest_well_any_zone']
        else:
            update_headers = ['hz_well_spacing_same_zone', 'vt_well_spacing_same_zone', 'closest_well_same_zone']

        update_data = min_distances[use_columns].values.tolist()
        update_well_headers_operations = [
            UpdateOne({
                "_id": well_id,
            }, {
                '$set': {
                    update_headers[0]: round(min_dist_hz, 3),
                    update_headers[1]: round(min_dist_vt, 3),
                    update_headers[2]: closest_well
                }
            }) for well_id, min_dist_hz, min_dist_vt, closest_well in update_data
        ]

        return bulkwrite_operation(self.wells_collection, update_well_headers_operations)

    def _get_target_and_all(self, selected_wells, all_well_ids, distance_type, zone_type, validating=False):
        if (validating):
            all_wells = self._get_filtered_wells_with_directional_surveys(all_well_ids)
        else:
            all_wells = self._get_filtered_wells(all_well_ids)
        if distance_type != 'shl':
            all_wells = self._filter_on_survey_exist(all_wells)
        if zone_type == 'same':
            all_wells = self._filter_on_zone_exist(all_wells)
        target_wells = list(set([ObjectId(id) for id in selected_wells]) & set([well['_id'] for well in all_wells]))
        return target_wells, all_wells

    def _get_closest_distance(self, data, target_wells, zone='any', distance='mid'):
        """method for getting point to point distance (no normal direction is considered here)

        Args:
            data (_type_): _description_
            zone (str, optional): _description_. Defaults to 'any'.
            distance (str, optional): _description_. Defaults to 'mid'.

        Returns:
            DataFrame: calculated closest distance
        """
        if distance == 'mid':
            control = 'mid'
        elif distance == 'shl':
            control = 'head'
        output1 = "min_dist_hz" + zone
        output2 = "min_dist_vt" + zone
        output3 = "closest_well"
        all_well_coord = data[control].tolist()
        if len(target_wells) == len(all_well_coord):
            # case 1: all project wells are selected
            target_well_coord = all_well_coord
            target_well_data = data
        else:
            # case 2: need to filter out the targeting wells
            target_well_data = data[data['wellIds'].isin([ObjectId(id) for id in target_wells])]
            target_well_coord = target_well_data[control].tolist()

        if zone == 'any':
            if len(all_well_coord) < 500:
                this_method = 'vector'
            else:
                this_method = 'kdTree'
            _, coord_closest = get_min_distances(np.asarray(target_well_coord),
                                                 np.asarray(all_well_coord),
                                                 method=this_method)
        else:
            target_zones = target_well_data['landing_zone'].tolist()
            all_zones = data['landing_zone'].tolist()
            if len(all_well_coord) < 1000:
                mask_zones = [[0 if zone == i else 1 for zone in all_zones] for i in target_zones]
                _, coord_closest = get_min_distances(np.asarray(target_well_coord),
                                                     np.asarray(all_well_coord),
                                                     method='vector',
                                                     masks=mask_zones)
            else:
                target_zones_unique = list(set(target_zones))
                mask_dict = dict()
                all_well_clustered = dict()
                kdTree_dict = dict()
                for zone in target_zones_unique:
                    mask_dict[zone] = [0 if i == zone else 1 for i in all_zones]
                    masking3 = np.stack((mask_dict[zone], mask_dict[zone], mask_dict[zone]), axis=1)
                    mask_applied = ma.masked_array(all_well_coord, mask=masking3).compressed()
                    all_well_clustered[zone] = mask_applied.reshape([-1, 3])
                    if len(all_well_clustered[zone]) > 500:
                        # only use kdTree when the number of wells > 500
                        kdTree_dict[zone] = spatial.KDTree(all_well_clustered[zone], compact_nodes=False)

                coord_closest = []
                for i in range(len(target_wells)):
                    point = target_well_coord[i]
                    this_zone = target_zones[i]
                    if this_zone in kdTree_dict.keys():
                        query_idx = 2
                        distance, index = kdTree_dict[this_zone].query(point, k=query_idx)
                        while max(distance) < 0.1 and query_idx < (len(all_well_clustered[this_zone]) - 1):
                            query_idx += 1
                            distance, index = kdTree_dict[this_zone].query(point, k=query_idx)
                        min_idx = index[-1]
                        coord_closest.append(all_well_clustered[this_zone][min_idx])
                    else:
                        coord_closest.append(get_min_dist_for_one_well(point, all_well_clustered[this_zone]))

        Ids = get_closest_wellID(coord_closest, data, control=control)
        output1_list, output2_list = [], []

        for well_idx in range(len(target_well_coord)):
            [X1, Y1, Z1] = target_well_coord[well_idx]
            [X2, Y2, Z2] = coord_closest[well_idx]
            distanceXY = np.sqrt((X1 - X2)**2 + (Y1 - Y2)**2)
            distanceZ = abs(Z1 - Z2)
            output1_list.append(distanceXY)
            output2_list.append(distanceZ)

        return_dict = {
            'wellIds': target_well_data['wellIds'].tolist(),
            output1: output1_list,
            output2: output2_list,
            output3: Ids
        }

        return pd.DataFrame(data=return_dict)

    def _crs_transformers(self, epsg_number, directional_survey_data, isSHL=False):
        if epsg_number != 0:
            transformer = self._get_crs_transformer(0, 0, 0, 0, epsg_number)
            crs_transformers = repeat(transformer)
        else:
            if (isSHL):
                head_lats = list(map(lambda x: x['surfaceLatitude'], directional_survey_data))
                head_longs = list(map(lambda x: x['surfaceLongitude'], directional_survey_data))
            else:
                head_lats = list(map(lambda x: x['well'][0]['surfaceLatitude'], directional_survey_data))
                head_longs = list(map(lambda x: x['well'][0]['surfaceLongitude'], directional_survey_data))
            crs_transformers = self._crs_transformer_factory(head_longs, min(head_lats), max(head_lats))
        return crs_transformers

    def _crs_transformer_factory(self, head_longs, lat_min, lat_max):
        group_number = ((np.array(head_longs, dtype=float) - MIN_LONG) / CRS_WIDTH).astype(int)
        crs_transformers = {
            group: self._get_crs_transformer(lat_min, lat_max, GRIDS[group], GRIDS[group + 1], epsg=0)
            for group in np.unique(group_number)
        }
        for group in group_number:
            yield crs_transformers[group]

    def _get_crs_transformer(self, lat_min, lat_max, long_min, long_max, epsg):
        if epsg != 0:
            crs = CRS.from_epsg(int(epsg))
        else:
            utm_crs_list = query_utm_crs_info(
                datum_name="WGS84",
                area_of_interest=AreaOfInterest(
                    west_lon_degree=long_min,
                    south_lat_degree=lat_min,
                    east_lon_degree=long_max,
                    north_lat_degree=lat_max,
                ),
            )

            # query_utm_crs_info gives multiple crs. For us, the best area only depends on longitude.
            areas_of_use = np.array([c.area_of_use.bounds for c in utm_crs_list], dtype=float)
            errors = np.abs(areas_of_use[:, [0, 2]] - np.array([long_min, long_max])).sum(axis=1)
            crs = CRS.from_epsg(utm_crs_list[np.argmin(errors)].code)

        start_pos = str(crs.to_wkt).find('Easting') + 9
        crs_unit = str(crs.to_wkt)[start_pos:start_pos + 14]
        conversion = 1.0
        if 'metre' in crs_unit:
            conversion = METERS_TO_FEET
        return Transformer.from_crs(crs.geodetic_crs, crs), conversion

    def _get_head_projection(self, lat, long, elevation_ref, proj, conversion):
        head_projection = proj.transform(lat, long)
        return [conversion * head_projection[0], conversion * head_projection[1], elevation_ref]

    def _heels_toes_midpoints(self, coordinates: np.ma.masked_array, heads: np.ndarray, has_inclination: np.ndarray):
        n_wells = coordinates.shape[0]
        well_idx = np.arange(n_wells)
        toes = coordinates[well_idx, last_false_idx(coordinates.mask[:, :, 0]), :3]

        if np.any(has_inclination):
            heels = np.empty((n_wells, 3), dtype=float)
            flat_mask = coordinates[:, :, 4] > FLAT_THRESHOLD
            heel_idx = np.clip(last_false_idx(flat_mask) + 1, 0, flat_mask.shape[1])
            heels[has_inclination] = coordinates[well_idx[has_inclination], heel_idx[has_inclination], :3]

        if np.any(~has_inclination):
            d_tvd_d_md = np.diff(coordinates[:, :, 2], axis=1) / np.diff(coordinates[:, :, 3], axis=1)
            diff_mask = d_tvd_d_md < DIFF_THRESHOLD
            heel_idx = np.clip(last_false_idx(diff_mask) + 1, 0, flat_mask.shape[1])
            heels[~has_inclination] = coordinates[well_idx[~has_inclination], heel_idx[~has_inclination], :3]

        target_mids = ((heels + toes) / 2).reshape((-1, 1, 3))
        mid_idx = np.argmin(np.sum((coordinates[:, :, :3] - target_mids)**2, axis=2), axis=1)
        mids = coordinates[well_idx, mid_idx, :3]

        heels = absolute_coordinates(heads, heels)
        toes = absolute_coordinates(heads, toes)
        mids = absolute_coordinates(heads, mids)

        return heels.tolist(), toes.tolist(), mids.tolist()

    def _get_closest_distance_normal(self, data, targets, params_dict, notification_id, zone='any'):
        output1 = "min_dist_hz" + zone
        output2 = "min_dist_vt" + zone
        output3 = "closest_well"
        all_wells = list(data.keys())
        output1_list, output2_list, Ids = [], [], []
        target_wells = [ObjectId(id) for id in targets]
        heels = np.asarray([item['heel'] for _, item in data.items()])
        toes = np.asarray([item['toe'] for _, item in data.items()])
        v2s, datameans = self._get_all_params(params_dict)
        pointAs, pointBs = self._get_pointA_pointB(heels, toes, v2s, datameans)

        n0 = len(target_wells)
        n = 0
        for well_1 in target_wells:
            n += 1
            if n % 100 == 0:
                self.context.notification_service.update_notification_with_notifying_target(
                    notification_id, {
                        'status': TASK_STATUS_RUNNING,
                        'description': f'Calculating {n}/{n0} wells...'
                    })
            v1 = params_dict[well_1]['normal']
            mid_1 = data[well_1]['mid']

            well_1_index = all_wells.index(well_1)
            # get the distance mask for well_1
            vv1s = heels - np.asarray(mid_1)
            vv2s = toes - np.asarray(mid_1)
            distance_mask = (v1 * vv1s).sum(axis=1) * (v1 * vv2s).sum(axis=1)
            distance_mask[well_1_index] = 1.0  # exclude itself
            if zone == 'same':
                # exclude by landing_zone
                well_1_zone = data[well_1]['landing_zone']
                idx = 0
                for _, value in data.items():
                    if value['landing_zone'] != well_1_zone:
                        distance_mask[idx] = 1.0
                    idx += 1
            # if all distance_mask all positive, then append the large number
            if all(i > 0 for i in distance_mask):
                output1_list.append(1.0e9)
                output2_list.append(1.0e9)
                Ids.append(well_1)
            else:
                min_idx, min_Q = get_min_distance_point_line(pointAs, pointBs, np.asarray(mid_1), distance_mask)
                pair = all_wells[min_idx]
                QP = min_Q - np.asarray(mid_1)
                dist_Z = abs(QP[2])
                dist_XY = np.sqrt((QP[0] * QP[0] + QP[1] * QP[1]))
                Ids.append(pair)
                output1_list.append(dist_XY)
                output2_list.append(dist_Z)

        return_dict = {'wellIds': target_wells, output1: output1_list, output2: output2_list, output3: Ids}
        return pd.DataFrame(data=return_dict)

    def _get_pointA_pointB(self, heels, toes, v2s, datameans):
        """Assumes that v2s is unitary."""
        half_lateral_lengths = (np.sqrt(((np.asarray(heels) - np.asarray(toes))**2).sum(axis=1)) / 2).reshape(-1, 1)
        pointAs = -half_lateral_lengths * v2s + datameans
        pointBs = half_lateral_lengths * v2s + datameans
        return pointAs, pointBs

    def _get_all_params(self, params):
        v2s = []
        datameans = []
        for _, value in params.items():
            point = np.asarray(value['normal'])
            datamean = np.asarray(value['datamean'])
            v2s.append(point)
            datameans.append(datamean)
        return np.asarray(v2s), np.asarray(datameans)

    def _get_filtered_wells(self, all_well_ids):
        pipeline = [{
            '$match': {
                '_id': {
                    '$in': [ObjectId(well) for well in all_well_ids]
                },
                'surfaceLatitude': {
                    '$nin': [None, np.nan]
                },
                'surfaceLongitude': {
                    '$nin': [None, np.nan]
                },
                'elevation': {
                    '$nin': [None, np.nan]
                },
            }
        }, {
            '$project': {
                '_id': 1
            }
        }]
        filtered_wells = list(self.wells_collection.aggregate(pipeline))
        return filtered_wells

    def _get_filtered_wells_with_directional_surveys(self, all_well_ids):
        pipeline = [{
            '$match': {
                '_id': {
                    '$in': [ObjectId(well) for well in all_well_ids]
                },
                'has_directional_survey': {
                    '$eq': True
                }
            }
        }, {
            '$project': {
                '_id': 1
            }
        }]
        filtered_wells = list(self.wells_collection.aggregate(pipeline))
        return filtered_wells

    def _filter_on_zone_exist(self, wells):
        pipeline = [{
            '$match': {
                '_id': {
                    '$in': [well['_id'] for well in wells]
                },
                'landing_zone': {
                    '$nin': [None, '']
                }
            }
        }, {
            '$project': {
                '_id': 1
            }
        }]
        filtered_wells = list(self.wells_collection.aggregate(pipeline))
        return filtered_wells

    def _filter_on_survey_exist(self, wells):
        pipeline = [{
            '$match': {
                '_id': {
                    '$in': [well['_id'] for well in wells]
                },
                'has_directional_survey': True
            }
        }, {
            '$project': {
                '_id': 1
            }
        }]
        filtered_wells = list(self.wells_collection.aggregate(pipeline))
        return filtered_wells

    def _get_surface_data(self, wells):
        pipeline = [{
            '$match': {
                '_id': {
                    '$in': [well['_id'] for well in wells]
                }
            }
        }, {
            '$project': {
                '_id': 1,
                'landing_zone': 1,
                'surfaceLatitude': 1,
                'surfaceLongitude': 1,
                'elevation': 1
            }
        }]

        well_surface_data = list(self.wells_collection.aggregate(pipeline))
        return well_surface_data

    def _get_directional_survey_data(self, wells):
        pipeline = [{
            '$match': {
                'well': {
                    '$in': [well['_id'] for well in wells]
                }
            }
        }, {
            '$lookup': {
                'from': 'wells',
                'as': 'well',
                'localField': 'well',
                'foreignField': '_id',
            }
        }, {
            '$project': {
                '_id': 0,
                'well._id': 1,
                'well.has_directional_survey': 1,
                'well.landing_zone': 1,
                'well.surfaceLatitude': 1,
                'well.surfaceLongitude': 1,
                'well.elevation': 1,
                'measuredDepth': 1,
                'azimuth': 1,
                'inclination': 1,
                'trueVerticalDepth': 1,
                'deviationNS': 1,
                'deviationEW': 1,
            }
        }]

        wells_points = list(self.well_directional_surveys_collection.aggregate(pipeline))
        return wells_points

    def _filter_surveys_non_mixed(self, directional_survey_data, method='inc'):
        """filters the directional surveys to remove any that don't properly calculate midpoints

        Args:
            directional_survey_data (Dict): a dictionary storing the (well_id, survey data)

        Returns:
            filtered_survey_data: (Dict): a filtered version of directional_survey_data
        """
        filtered_survey_data = []
        failed_calcs = []
        for survey_dict in directional_survey_data:
            field_z = 'trueVerticalDepth'
            if method == 'inc' and len(survey_dict['inclination']) > 0 and survey_dict['inclination'][0]:
                heel_found = any(x[0] for x in enumerate(survey_dict['inclination']) if x[1] > 85)
                if heel_found:
                    filtered_survey_data.append(survey_dict)
                else:
                    failed_calcs.append(survey_dict)
            else:
                md = survey_dict['measuredDepth']
                tvd = survey_dict[field_z]
                d_tvd_d_md = np.diff(tvd) / np.diff(md)
                heel_found = any(x < 0.2 for x in d_tvd_d_md)
                if heel_found:
                    filtered_survey_data.append(survey_dict)
                else:
                    failed_calcs.append(survey_dict)
        return failed_calcs, filtered_survey_data

    def _get_linear_params(self, data_surveys, well_spacing_dict):
        """get the linear params through SVD

        Args:
            data_surveys (Dict): a dictionary storing the (wellId, survey data)
            well_spacing_df (df): the calculated df storing the control points abs locations

        Returns:
            dict: a dict storing the params through SVD
        """
        params_dict = {}
        for well_id, survey in data_surveys.items():
            head_abs = well_spacing_dict[well_id]['head']
            heel_abs = well_spacing_dict[well_id]['heel']
            heel_TVD = -heel_abs[2] + head_abs[2]
            survey_TVD = survey['trueVerticalDepth']
            new_list = list(np.around(np.array(survey_TVD), 2))
            heel_index = new_list.index(np.round(heel_TVD, 2))
            horizontal_x = survey['deviationEW'][heel_index:]
            horizontal_y = survey['deviationNS'][heel_index:]
            horizontal_z = survey['trueVerticalDepth'][heel_index:]
            # transform to the xyz coordinates
            x = np.asarray(horizontal_x) + head_abs[0]
            y = np.asarray(horizontal_y) + head_abs[1]
            z = -(np.asarray(horizontal_z) - head_abs[2])
            plane_params = get_svd(x, y, z)
            params_dict[well_id] = plane_params

        return params_dict
