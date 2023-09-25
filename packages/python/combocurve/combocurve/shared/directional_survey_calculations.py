from typing import Optional
from collections.abc import Mapping, Iterable

import pandas as pd
import numpy as np
from pyproj import CRS
from pyproj import Transformer
from pyproj.aoi import AreaOfInterest
from pyproj.database import query_utm_crs_info

FEET_TO_METERS = 0.3048


def _checkarrays(md, inc, azi):
    '''
    Assure basic preconditions are met, and convert input (md, inc, azi) to
    numpy arrays.
    This function will ensure that:
    - All inputs are convertible to arrays-of-floats, and perform this
      conversion
    - All inputs are of the same shape
    - md is strictly increasing
    - There are no NaN values in the data
    Parameters
    ----------
    md: array_like of float
        measured depth
    inc: array_like of float
        well deviation
    azi: array_like of float
        azimuth
    Returns
    -------
    md: array_like of float
        measured depth
    inc: array_like of float
        well deviation
    azi: array_like of float
        azimuth
    Raises
    ------
    ValueError
        If md, inc, or azi, are of different shapes
        If the md values are not strictly increasing
        If NaN values are included in md, inc or azi
    '''
    md = np.asarray(md, dtype=float)
    inc = np.asarray(inc, dtype=float)
    azi = np.asarray(azi, dtype=float)

    for prop, arr in {'Measured Depth': md, 'Inclination': inc, 'Azimuth': azi}.items():
        if np.isnan(arr).any():
            raise ValueError(f'{prop} cannot contain nan values')

    if not (md.shape == inc.shape == azi.shape):
        raise ValueError('Measured Depth, Inclination, and Azimuth must be the same shape')

    if not np.all(md[1:] > md[:-1]):
        raise ValueError('Measured Depth must have strictly increasing values')

    inc %= 360
    azi %= 360

    if np.any(inc >= 180):
        raise ValueError('All Inclination values must be in range 0 <= inc < 180')

    return md, inc, azi


def _direction_vector_radians(inc, azi):
    '''(inc, azi) -> [N E V]
    Convert spherical coordinates (inc, azi) in radians to cubic coordinates
    (northing, easting, vertical depth), a unit length direction vector in a
    right handed coordinate system.
    Parameters
    ----------
    inc : array_like of float
        inclination in radians
    azi : array_like of float
        azimuth in radians
    Returns
    -------
    northing : array_like of float
    easting : array_like of float
    vd : array_like of float
        vertial direction
    See also
    --------
    direction_vector
    '''
    vd = np.cos(inc)
    northing = np.sin(inc) * np.cos(azi)
    easting = np.sin(inc) * np.sin(azi)
    return northing, easting, vd


def _normalize(v):
    '''Normalize vector or compute unit vector
    Compute the normalized (unit vector) [1]_ of v, a vector with the same
    direction, but a length of 1.
    Parameters
    ----------
    v : array_like or array_like of vectors
    Returns
    -------
    V : array_like
        normalized v
    Notes
    -----
    Normalize is in addition to zeros also sensitive to *very* small floats.
        Falsifying example: deviation_survey=(
            md = array([0.0000000e+000, 1.0000000e+000, 4.1242594e-162]),
            inc = array([0., 0., 0.]),
            azi = array([0., 0., 0.]))
    yields a dot product of 1.0712553822854385, which is outside [-1, 1]. This
    should *really* only show up in testing scenarios and not real data.
    This function works on a single vector or a set of vectors. Numpy will
    interpret any set of vectors as a matrix, so the type of norm is specified
    explicitly [2].
    References
    ----------
    .. [1] https://mathworld.wolfram.com/NormalizedVector.html
    .. [2] https://github.com/Zabamund/wellpathpy/issues/35
    Examples
    --------
    >>> a = [2, 4, 3]
    >>> b = [5, 6, 7]
    >>> normalize(a)
    [0.371391, 0.742781, 0.557086]
    >>> normalize([a, b])
    [[0.37139068 0.74278135 0.55708601]
     [0.47673129 0.57207755 0.66742381]]
    '''
    v = np.asarray(v)
    norm = np.atleast_1d(np.linalg.norm(v, ord=2, axis=v.ndim - 1))
    norm[norm == 0] = 1

    if v.ndim == 1:
        return v / norm[:]
    else:
        return v / norm[:, np.newaxis]


def _angle_between(u, v):
    '''Return the angle between (arrays of) vectors
    Parameters
    ----------
    u : array_like
    v : array_like
    Returns
    -------
    alpha : float
        Angle between vectors in radians
    Examples
    --------
    >>> angle_between((1, 0, 0), (0, 1, 0))
    1.5707963267948966
    >>> a = [[1, 0, 0]]
    >>> b = [[0, 1, 0]]
    >>> angle_between(a, b)
    [1.5707963267948966]
    '''
    ndims = np.ndim(u)
    is_1d = ndims == 1
    u = np.atleast_2d(_normalize(u))
    v = np.atleast_2d(_normalize(v))
    norm_sub = np.linalg.norm(v - u, axis=1)
    norm_add = np.linalg.norm(v + u, axis=1)
    angle = 2.0 * np.arctan(norm_sub / norm_add)
    return angle[0] if is_1d else angle


def _minimum_curvature_inner(md, inc, azi):
    '''Calculate TVD, northing, easting, and dogleg, using the minimum curvature
    method.
    This is the inner workhorse of the minimum_curvature, and only implement the
    pure mathematics. As a user, you should probably use the minimum_curvature
    function.
    This function considers md unitless, and assumes inc and azi are in radians.
    Parameters
    ----------
    md : array_like of float
        measured depth
    inc : array_like of float
        inclination in radians
    azi : array_like of float
        azimuth in radians
    Returns
    -------
    tvd : array_like of float
    northing : array_like of float
    easting : array_like of float
    dogleg : array_like of float
    '''
    # Compute the direction vectors for the surveys and organise them as
    # (upper, lower) pairs, by index in the arrays.
    dv = _direction_vector_radians(inc, azi)
    dv = np.column_stack(dv)
    upper, lower = dv[:-1], dv[1:]
    dogleg = _angle_between(upper, lower)

    # ratio factor, correct for dogleg == 0 values to avoid divide-by-zero.
    # While undefined for dl = 0 it reasonably evaluates to 1:
    #   >>> def rf(x): return (2 * np.tan(x/2))/x
    #   >>> rf(1e-10)
    #   1.0
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


def _minimum_curvature(md, inc, azi, course_length=100):
    '''Calculate TVD using minimum curvature method.
    This method uses angles from upper and lower end of survey interval to
    calculate a curve that passes through both survey points. This curve is
    smoothed by use of the ratio factor defined by the tortuosity or dogleg
    of the wellpath.
    Parameters
    ----------
    md : float
        measured depth in m or ft
    inc : float
        well deviation in degrees
    azi : float
        well azimuth in degrees
    course_length : float
        dogleg normalisation value, if passed will override md_units
    Notes
    -----
    Formulae:
    .. math::
        dls = arccos[
                  cos(inc_l - inc_u)
                - sin(inc_u) \\cdot sin(inc_l) \\cdot (1 - cos(azi_l - azi_u))
                ]
    .. math::
        rf = \\frac{2}{dls} \\cdot tan(\\frac{dls}{2})
    .. math::
        northing = \\frac{md_l - md_u}{2}
                   \\cdot [sin(inc_u)cos(azi_u) + sin(inc_l)cos(azi_l)]
                   \\cdot rf
    .. math::
        easting = \\frac{md_l - md_u}{2}
                  \\cdot [sin(inc_u)sin(azi_u) + sin(inc_l)sin(azi_l)]
                  \\cdot rf
    .. math::
        tvd = \\frac{md_l - md_u}{2}
              \\cdot [cos(inc_l) + cos(inc_u)]
              \\cdot rf
    where:
    - :math:`dls` : dog leg severity (degrees)
    - :math:`rf` : ratio factor (radians)
    - :math:`md_u` : upper survey station depth MD
    - :math:`md_l` : lower survey station depth MD
    - :math:`inc_u` : upper survey station inclination in degrees
    - :math:`inc_l` : lower survey station inclination in degrees
    - :math:`azi_u` : upper survey station azimuth in degrees
    - :math:`azi_l` : lower survey station azimuth in degrees

    Typical course_length values are:
    - m : course_length = 30
    - ft : course_length = 100
    Other values can be passed, but they are non-standard and therefore not
    explicitely supported.
    Returns
    -------
    tvd : array_like of float
        true vertical depth
    northing : array_like of float
    easting : array_like of float
    dls : array_like of float
        dog leg severity
    '''

    try:
        course_length + 0
    except TypeError:
        raise TypeError('course_length must be a float')

    md, inc, azi = _checkarrays(md, inc, azi)
    inc = np.deg2rad(inc)
    azi = np.deg2rad(azi)

    md_diff = md[1:] - md[:-1]
    tvd, northing, easting, dogleg = _minimum_curvature_inner(md, inc, azi)

    tvd = np.insert(tvd, 0, 0)
    northing = np.insert(northing, 0, 0)
    easting = np.insert(easting, 0, 0)

    dl = np.rad2deg(dogleg)
    dls = dl * (course_length / md_diff)
    dls = np.insert(dls, 0, 0)

    return tvd, northing, easting, dls


def _get_transformer(west, east, north, south, reverse=False):
    '''
    return the coordinate transformer object.
    If reverse is false: Lat, Long => X, Y
    If reverse is true:  X, Y => Lat, Long
    '''
    utm_crs_list = query_utm_crs_info(
        datum_name='WGS84',
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


def _add_curvature(df: pd.DataFrame):
    missing_curvature_idx = df['trueVerticalDepth'].isna() | df['deviationNS'].isna() | df['deviationEW'].isna()

    if not missing_curvature_idx.any():
        return

    missing_curvature_df = df[missing_curvature_idx]

    md = missing_curvature_df['measuredDepth']
    inc = missing_curvature_df['inclination']
    azi = missing_curvature_df['azimuth']
    tvd, deviationNS, deviationEW, _ = _minimum_curvature(md, inc, azi, course_length=100)

    df.loc[missing_curvature_idx, 'trueVerticalDepth'] = tvd
    df.loc[missing_curvature_idx, 'deviationNS'] = deviationNS
    df.loc[missing_curvature_idx, 'deviationEW'] = deviationEW


def _add_location(df: pd.DataFrame, well_head_loc: tuple[float, float]):
    missing_location_idx = df['latitude'].isna() | df['longitude'].isna()

    if not missing_location_idx.any():
        return

    missing_location_df = df[missing_location_idx]

    well_head_lat, well_head_long = well_head_loc
    transformer_1 = _get_transformer(well_head_long, well_head_long, well_head_lat, well_head_lat, reverse=True)
    transformer_2 = _get_transformer(well_head_long, well_head_long, well_head_lat, well_head_lat, reverse=False)
    well_head_EW, well_head_NS = transformer_1.transform(well_head_lat, well_head_long)

    deviationNS = missing_location_df['deviationNS']
    deviationEW = missing_location_df['deviationEW']
    abs_NS = deviationNS * FEET_TO_METERS + well_head_NS
    abs_EW = deviationEW * FEET_TO_METERS + well_head_EW
    new_data = [transformer_2.transform(x, y) for x, y in zip(abs_EW, abs_NS)]
    [lat, long] = [np.asarray(coords).transpose() for coords in zip(*new_data)]

    df.loc[missing_location_idx, 'latitude'] = lat
    df.loc[missing_location_idx, 'longitude'] = long


def get_missing_columns(input_data: Mapping[str, Iterable[float]], well_head_loc: Optional[tuple[float, float]]):
    df = pd.DataFrame(input_data)
    _add_curvature(df)
    if well_head_loc:
        _add_location(df, well_head_loc)
    return df.to_dict('list')


def is_valid_survey_data(input_data: Mapping[str, Iterable[float]]):
    df = pd.DataFrame(input_data)

    if df.empty:
        return False

    try:
        _checkarrays(df['measuredDepth'], df['inclination'], df['azimuth'])
    except ValueError:
        return False

    return True
