from pyproj import CRS, Transformer

EPSG_CODES = {'WGS84': 4326, 'NAD27': 4267, 'NAD83': 4269}
WGS84_TRANSFORMERS = {
    name: Transformer.from_crs(CRS.from_epsg(code), CRS.from_epsg(EPSG_CODES['WGS84']), always_xy=True)
    for name, code in EPSG_CODES.items()
}


def transform_to_wgs84(latitude: float, longitude: float, datum: str):
    transformed_longitude, transformed_latitude = WGS84_TRANSFORMERS[datum].transform(longitude, latitude)
    return transformed_latitude, transformed_longitude
