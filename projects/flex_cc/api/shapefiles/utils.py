from time import sleep
from typing import Optional
import re
from collections.abc import Iterable, Sequence
from math import inf
from datetime import date, datetime

from shapefile import ShapeRecord
from pyproj import CRS, Transformer
from shapely.geometry import shape, mapping
from shapely.validation import make_valid

from combocurve.shared.map_calculations import EPSG_CODES

UPLOAD_PROCESSING_SHAPES_FRACTION = 0.8
EXPORT_READING_SHAPES_FRACTION = 0.8
MAPBOX_UPLOAD_RETRIES = 5
MAPBOX_UPLOAD_RETRY_DELAY = 3
MAPBOX_UPLOAD_TIME_LIMIT = 600
MAPBOX_STATUS_CHECK_DELAY = 1
MAPBOX_UPLOAD_CHECK_RETRIES = MAPBOX_UPLOAD_TIME_LIMIT // MAPBOX_STATUS_CHECK_DELAY

SHP_TO_STD_FIELD_TYPES = {
    'C': 'string',
    'N': 'number',
    'F': 'number',
    'L': 'boolean',
    'D': 'date',
}
STD_TO_SHP_FIELD_TYPES = {v: k for k, v in SHP_TO_STD_FIELD_TYPES.items()}
STD_TO_PYTHON_FIELD_TYPES = {
    'string': str,
    'number': float,
    'boolean': bool,
    'date': datetime,
}

COORDINATES_DEPTH = {
    'Point': 0,
    'MultiPoint': 1,
    'LineString': 1,
    'Polygon': 2,
    'MultiLineString': 2,
    'MultiPolygon': 3,
}

GEOJSON_TO_SHAPEFILE_TYPES = {
    'Point': 'POINT',
    'LineString': 'POLYLINE',
    'Polygon': 'POLYGON',
    'MultiPoint': None,  # not supported when uploading geojson
    'MultiLineString': None,  # not supported when uploading geojson
    'MultiPolygon': 'POLYGON',
}

WGS84_CRS = CRS.from_epsg(EPSG_CODES['WGS84'])


class InvalidZipShapefileError(Exception):
    expected = True

    def __init__(self, message: str):
        super().__init__(message)


class InvalidShapeTypeError(Exception):
    expected = True

    def __init__(self, shape_type: str):
        super().__init__(f'Invalid or unsopported shape type: {shape_type}')


class MissingShapefileError(Exception):
    expected = True

    def __init__(self):
        super().__init__('The specified shapefile does not exist')


class InvalidShapefileError(Exception):
    expected = True

    def __init__(self, operation: str):
        super().__init__(f'The specified shapefile cannot be {operation}')


class MapboxUploadError(Exception):
    expected = True

    def __init__(self, mapbox_error: str):
        super().__init__(f'Error uploading to Mapbox: {mapbox_error}')


def get_base_shape_type(shape_type: str):
    if shape_type in {'POINT', 'POINTZ', 'POINTM'}:
        return 'POINT'
    elif shape_type in {'POLYLINE', 'POLYLINEZ', 'POLYLINEM'}:
        return 'POLYLINE'
    elif shape_type in {'POLYGON', 'POLYGONZ', 'POLYGONM'}:
        return 'POLYGON'
    elif shape_type in {'MULTIPOINT', 'MULTIPOINTZ', 'MULTIPOINTM'}:
        return 'MULTIPOINT'
    else:
        raise InvalidShapeTypeError(shape_type)


def get_field_dict(field: list[str]):
    [name, field_type, _, _] = field
    return {
        'name': name,
        'fieldType': SHP_TO_STD_FIELD_TYPES[field_type],
    }


def find_shapefile_files(file_names: list[str]):
    shp = next((f for f in file_names if f.lower().endswith('.shp')), None)
    if shp is None:
        raise InvalidZipShapefileError('File does not contain a .shp file')
    base = shp[:-4]
    shx_re = re.compile(f'{base}.shx', re.IGNORECASE)
    shx = next((f for f in file_names if shx_re.match(f)), None)
    dbf_re = re.compile(f'{base}.dbf', re.IGNORECASE)
    dbf = next((f for f in file_names if dbf_re.match(f)), None)
    others_re = {'prj': re.compile(f'{base}.prj', re.IGNORECASE)}
    others = {k: next((f for f in file_names if v.match(f)), None) for k, v in others_re.items()}
    if shx is None:
        raise InvalidZipShapefileError(f'Missing required .shx file for {shp}')
    if dbf is None:
        raise InvalidZipShapefileError(f'Missing required .dbf file for {shp}')
    others = {k: v for k, v in others.items() if v is not None}
    return base, shp, shx, dbf, others


def is_valid_shape_record(shape_record: ShapeRecord, shape_type: str):
    return shape_record.shape.shapeTypeName == shape_type


def _transform_coordinates(coordinates: list, transformer: Transformer, depth: int):
    if depth == 0:
        return list(transformer.transform(*coordinates))
    return [_transform_coordinates(c, transformer, depth - 1) for c in coordinates]


def _transform_geometry(geometry: dict, transformer: Transformer):
    depth = COORDINATES_DEPTH[geometry['type']]
    return {**geometry, 'coordinates': _transform_coordinates(geometry['coordinates'], transformer, depth)}


def transform_feature_coordinates(feature: dict, transformer: Optional[Transformer]):
    if not transformer:
        return feature
    return {**feature, 'geometry': _transform_geometry(feature['geometry'], transformer)}


def _get_polygons(geometry: dict):
    geometry_type = geometry['type']
    if geometry_type == 'Polygon':
        return [geometry]
    if geometry_type == 'MultiPolygon':
        return [{
            'type': 'Polygon',
            'coordinates': polygon_coordinates
        } for polygon_coordinates in geometry['coordinates']]
    if geometry_type == 'GeometryCollection':
        return [polygon for geom in geometry['geometries'] for polygon in _get_polygons(geom)]
    return []


def _fix_invalid_polygon(geometry: dict):
    if geometry['type'] not in ('Polygon', 'MultiPolygon'):
        return geometry
    valid = mapping(make_valid(shape(geometry)))
    polygons = _get_polygons(valid)
    if len(polygons) == 1:
        return polygons[0]
    return {'type': 'MultiPolygon', 'coordinates': [polygon['coordinates'] for polygon in polygons]}


def fix_feature_invalid_polygon(feature: dict):
    return {**feature, 'geometry': _fix_invalid_polygon(feature['geometry'])}


def _merge_bboxes(bboxes: Iterable[Sequence[float]]):
    min_x, min_y, max_x, max_y = inf, inf, -inf, -inf
    for bbox in bboxes:
        min_x = min(min_x, bbox[0])
        min_y = min(min_y, bbox[1])
        max_x = max(max_x, bbox[2])
        max_y = max(max_y, bbox[3])
    return min_x, min_y, max_x, max_y


def _get_feature_bbox(feature: dict):
    return shape(feature['geometry']).bounds


def get_bbox(features: list[dict]):
    return _merge_bboxes((_get_feature_bbox(f) for f in features))


def get_all_properties(features: list[dict]):
    feature_properties = (set(f['properties'].keys()) for f in features)
    return set().union(*feature_properties)


def _get_value_type(value):
    if isinstance(value, bool):
        return 'boolean'
    if isinstance(value, int) or isinstance(value, float):
        return 'number'
    if isinstance(value, date) or isinstance(value, datetime):
        return 'date'
    if isinstance(value, str):
        return 'string'
    raise TypeError(f'Invalid record value type: {value}')


def _get_field(field_dict: dict, shapes: list[dict]):
    if 'name' not in field_dict:
        return None

    if 'fieldType' in field_dict:
        return field_dict

    field_name = field_dict['name']
    records = (s.get('properties', {}) for s in shapes)
    valid_value = next((r for r in records if r.get(field_name) is not None))[field_name]
    return {'name': field_name, 'fieldType': _get_value_type(valid_value)}


def get_valid_fields(fields: Iterable[dict], shapes: list[dict]):
    corrected_fields = (_get_field(f, shapes) for f in fields)
    return (f for f in corrected_fields if f is not None)


def _get_field_value(value, field: dict):
    if value is None:
        return None

    field_type = STD_TO_PYTHON_FIELD_TYPES[field['fieldType']]
    try:
        return field_type(value)
    except ValueError:
        return None


def get_valid_record(properties: dict, valid_fields: Iterable[dict]):
    return {f['name']: _get_field_value(properties.get(f['name']), f) for f in valid_fields}


def with_retry(retry_condition, retry_count, retry_delay):
    def inner(func):
        def wrapper(*args, **kwargs):
            retries = 0
            while True:
                try:
                    res = func(*args, **kwargs)
                    if retry_condition(res):
                        raise Exception('Retry')
                    return res
                except Exception as e:
                    if retries >= retry_count:
                        raise e
                    retries += 1
                    sleep(retry_delay)

        return wrapper

    return inner
