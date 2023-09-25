import numpy as np
from pyproj import CRS
from pyproj import Transformer
from pyproj.aoi import AreaOfInterest
from pyproj.database import query_utm_crs_info

FEET_TO_METERS = 0.3048


def checkarrays(md, inc, azi):
    md = np.asarray(md, dtype=float)
    inc = np.asarray(inc, dtype=float)
    azi = np.asarray(azi, dtype=float)

    for prop, arr in {'md': md, 'inc': inc, 'azi': azi}.items():
        if np.isnan(arr).any():
            raise ValueError('{} cannot contain nan values'.format(prop))

    if not ((0 <= inc) & (inc < 180)).all():
        raise ValueError('all inc values must be in range 0 <= inc < 180')

    if not ((0 <= azi) & (azi < 360)).all():
        raise ValueError('all azi values must be in range 0 <= azi < 360')

    if not (md.shape == inc.shape == azi.shape):
        raise ValueError('md, inc, and azi must be the same shape')

    if not np.all(md[1:] > md[:-1]):
        raise ValueError('md must have strictly increasing values')

    return md, inc, azi


def direction_vector_radians(inc, azi):
    vd = np.cos(inc)
    northing = np.sin(inc) * np.cos(azi)
    easting = np.sin(inc) * np.sin(azi)
    return northing, easting, vd


def normalize(v):
    v = np.asarray(v)
    norm = np.atleast_1d(np.linalg.norm(v, ord=2, axis=v.ndim - 1))
    norm[norm == 0] = 1

    if v.ndim == 1:
        return v / norm[:]
    else:
        return v / norm[:, np.newaxis]


def angle_between(u, v):
    ndims = np.ndim(u)
    is_1d = ndims == 1
    u = np.atleast_2d(normalize(u))
    v = np.atleast_2d(normalize(v))
    norm_sub = np.linalg.norm(v - u, axis=1)
    norm_add = np.linalg.norm(v + u, axis=1)
    angle = 2.0 * np.arctan(norm_sub / norm_add)
    return angle[0] if is_1d else angle


def minimum_curvature_inner(md, inc, azi):
    # Compute the direction vectors for the surveys and organise them as
    # (upper, lower) pairs, by index in the arrays.
    dv = direction_vector_radians(inc, azi)
    dv = np.column_stack(dv)
    upper, lower = dv[:-1], dv[1:]
    dogleg = angle_between(upper, lower)

    z = np.where(dogleg == 0)
    nz = np.where(dogleg != 0)
    rf = 2 * np.tan(dogleg / 2)
    rf[nz] /= dogleg[nz]
    rf[z] = 1

    md_diff = md[1:] - md[:-1]
    halfmd = md_diff / 2
    northing = np.cumsum(halfmd * (upper[:, 0] + lower[:, 0]) * rf)
    easting = np.cumsum(halfmd * (upper[:, 1] + lower[:, 1]) * rf)
    tvd = np.cumsum(halfmd * (upper[:, 2] + lower[:, 2]) * rf)
    return tvd, northing, easting, dogleg


def minimum_curvature(md, inc, azi, course_length=100):
    try:
        course_length + 0
    except TypeError:
        raise TypeError('course_length must be a float')

    md, inc, azi = checkarrays(md, inc, azi)
    inc = np.deg2rad(inc)
    azi = np.deg2rad(azi)

    md_diff = md[1:] - md[:-1]
    tvd, northing, easting, dogleg = minimum_curvature_inner(md, inc, azi)

    tvd = np.insert(tvd, 0, 0)
    northing = np.insert(northing, 0, 0)
    easting = np.insert(easting, 0, 0)

    dl = np.rad2deg(dogleg)
    dls = dl * (course_length / md_diff)
    dls = np.insert(dls, 0, 0)

    return tvd, northing, easting, dls


def get_transformer(west, east, north, south, reverse=False):
    """
    return the coordinate transformer object.
    If reverse is false: Lat, Long => X, Y
    If reverse is true:  X, Y => Lat, Long
    """
    utm_crs_list = query_utm_crs_info(
        datum_name="WGS84",
        area_of_interest=AreaOfInterest(
            west_lon_degree=west,
            south_lat_degree=south,
            east_lon_degree=east,
            north_lat_degree=north,
        ),
    )
    utm_crs = CRS.from_epsg(utm_crs_list[0].code)
    if reverse:
        # transformer from Lat, Long to XY
        return Transformer.from_crs(utm_crs.geodetic_crs, utm_crs)
    else:
        # transformer from XY to Lat, Long
        return Transformer.from_crs(utm_crs, utm_crs.geodetic_crs)


def get_missing_columns(input_data, well_head_loc):
    input_columns = input_data.columns
    well_head_lat, well_head_long = well_head_loc
    transformer_1 = get_transformer(well_head_long, well_head_long, well_head_lat, well_head_lat, reverse=True)
    transformer_2 = get_transformer(well_head_long, well_head_long, well_head_lat, well_head_lat, reverse=False)
    well_head_NS, well_head_EW = transformer_1.transform(well_head_lat, well_head_long)

    if "trueVerticalDepth" not in input_columns:
        MD = input_data['MeasuredDepth'].tolist()
        inc = input_data['inclination'].tolist()
        azi = input_data['azimuth'].tolist()
        tvd, deviationNS, deviationEW, _ = minimum_curvature(MD, inc, azi, course_length=100)
        input_data['trueVerticalDepth'] = tvd
        input_data['deviationNS'] = deviationNS
        input_data['deviationEW'] = deviationEW
    if "latitude" not in input_columns:
        deviationNS = np.asarray(input_data['deviationNS'].tolist())
        deviationEW = np.asarray(input_data['deviationEW'].tolist())
        abs_NS = deviationNS * FEET_TO_METERS + well_head_NS
        abs_EW = deviationEW * FEET_TO_METERS + well_head_EW
        new_data = [transformer_2.transform(y, x) for y, x in list(zip(abs_NS, abs_EW))]
        [lat, long] = [np.asarray([i for i, j in new_data]), np.asarray([j for i, j in new_data])]
        input_data['latitude'] = lat
        input_data['longitude'] = long

    return input_data
