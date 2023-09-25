import numpy as np
from scipy import spatial
import numpy.ma as ma


def get_min_dist2(target_wells, wells):
    distances = []
    pairs = []
    for point in target_wells:
        d, point = closest_node(point, wells)
        distances.append(d)
        pairs.append(point)
    return np.asarray(distances), pairs


def closest_node_mask(node, others, mask0):
    nodes = np.asarray(others)
    dist_2 = np.sum((nodes - node)**2, axis=1)
    masked_dist2 = ma.masked_array(dist_2, mask=mask0)
    filtered = masked_dist2[masked_dist2 > 0]
    if len(filtered) == 0:
        filtered = dist_2
    min_idx = np.argwhere(dist_2 == filtered.min())[0][0]
    return np.sqrt(filtered.min()), others[min_idx].tolist()


def get_min_dist2_mask(target_wells, wells, masks):
    distances = []
    pairs = []
    for i, point in enumerate(target_wells):
        mask0 = masks[i]
        d, point = closest_node_mask(point, wells, mask0)
        distances.append(d)
        pairs.append(point)
    return np.asarray(distances), pairs


def get_min_dist_for_one_well(this_well, wells):
    d, point = closest_node(this_well, wells)
    return point


def closest_node(node, others):
    nodes = np.asarray(others)
    dist_2 = np.sum((nodes - node)**2, axis=1)
    filtered = dist_2[dist_2 > 0]
    if len(filtered) == 0:
        filtered = dist_2
    min_idx = np.argwhere(dist_2 == filtered.min())[0][0]
    return np.sqrt(filtered.min()), others[min_idx].tolist()


def get_min_kdtree(target_wells, wells):
    min_idx = []
    distances = []
    tree = spatial.KDTree(wells, compact_nodes=False)
    for point in target_wells:
        query_idx = 2
        distance, index = tree.query(point, k=query_idx)
        while max(distance) < 0.1:
            query_idx += 1
            distance, index = tree.query(point, k=query_idx)
        min_idx.append(index[-1])
        distances.append(distance[-1])
    return np.asarray(distances), wells[min_idx].tolist()


def get_overlapping_mask(coordinates, cutoff):
    controls = np.asarray(coordinates)
    coor_max = controls + cutoff
    coor_min = controls - cutoff
    bbs = np.concatenate((coor_min, coor_max), axis=1)
    c = bbs.reshape([-1, 1, 2, 3])
    p = bbs.reshape([1, -1, 2, 3])
    p1 = p[:, :, [1, 0]]
    comp = np.greater(c, p1)
    comp = np.logical_xor(comp[:, :, 0, :], comp[:, :, 1, :])
    overlap_mask = np.logical_and(comp[:, :, 0], comp[:, :, 1], comp[:, :, 2])
    np.fill_diagonal(overlap_mask, False)  # set not to overlap with itself
    # set to use 0 and 1 s
    overlap_mask = ~overlap_mask * 1
    return overlap_mask


def get_min_dist_bbs(nodes_data, cutoff):
    masking = get_overlapping_mask(nodes_data, cutoff)
    masking3 = np.stack((masking, masking, masking), axis=2)
    closest_dist = []
    pairs = []
    for i in range(len(nodes_data)):
        this_node = nodes_data[i]
        nodes_data = np.asarray(nodes_data)
        nodes_data = nodes_data.reshape([-1, 3])
        this_mask = masking3[i]
        overlapping = ma.masked_array(nodes_data, mask=this_mask).compressed().reshape([-1, 3])
        d, point = closest_node(this_node, overlapping)
        closest_dist.append(d)
        pairs.append(point)

    return np.asarray(closest_dist), pairs


def get_closest_wellID(coordinates, data, control):
    well_ids = []
    points = np.array(data[control].tolist())
    for coord in coordinates:
        idx = int(np.argwhere((points == coord).all(axis=1))[0])
        well_ids.append(data['wellIds'][idx])

    return well_ids


def get_min_distance_point_line(line_point_a, line_point_b, special_point, distance_mask):
    '''
    Find the distance from a special point to a set of lines.
    Args:
        line_point_a: A (n, d)-dimenisonal array, representing a point on each of the n lines of dimension d.
        line_point_b: A (n, d)-dimensional array, representing another point on each of the n lines of dimension d.
        special_point: A (d,)-demensional array, representing the special point from which you want to minimize the
        distance to the line set.
    Returns:
        A np.float64 representing the minimum distance from the special point to the line set.
    '''
    line_vec = (line_point_b - line_point_a) / np.sqrt(((line_point_b - line_point_a) *
                                                        (line_point_b - line_point_a)).sum(axis=1)).reshape(-1, 1)
    p_minus_a = -line_point_a + special_point
    # AQ + QP = AP ==> QP = AP - AQ  ==> AQ = (AP * line_vec) * line_vec
    vec_distances = p_minus_a - ((p_minus_a * line_vec).sum(axis=1)).reshape(-1, 1) * line_vec
    scalar_distances = np.sqrt((vec_distances * vec_distances).sum(axis=1))
    # Apply a mask
    masked = np.ma.masked_where(distance_mask > 0, scalar_distances)
    min_idx = masked.argmin()
    Q_point = special_point - vec_distances[min_idx]
    return min_idx, Q_point


def get_min_distances(targets, coordinates, method='vector', masks=None):
    if not masks:
        if method == 'vector':
            return get_min_dist2(targets, coordinates)
        if method == 'kdTree':
            return get_min_kdtree(targets, coordinates)
    else:
        if method == 'vector':
            return get_min_dist2_mask(targets, coordinates, masks)


def get_svd(x, y, z):
    """
    input:
        x: horizontal part x
        y: horizontal part y
        z: horizontal part z
        midX: X coordinate of mid point
        midY: Y coordinate of mid point
        midZ: Z coordinate of mid point
    return:
        plane parameters: v1*x + v2*y + v3*z + c = 0
        'normal': (v1, v2, v3)
        'constant': c
        'datamean': center point of all data
    """
    data = np.concatenate((x[:, np.newaxis], y[:, np.newaxis], z[:, np.newaxis]), axis=1)
    # Calculate the mean of the points, i.e. the 'center' of the cloud
    datamean = data.mean(axis=0)
    # Do an SVD on the mean-centered data.
    uu, dd, vv = np.linalg.svd(data - datamean)
    params = {}
    params['normal'] = vv[0]
    params['constant'] = -np.dot(vv[0], np.asarray(datamean))
    params['datamean'] = datamean

    return params


def last_false_idx(mat: np.ndarray) -> np.ndarray:
    if len(mat.shape) != 2:
        raise ValueError('mat must be a 2-d array.')
    return mat.shape[1] - np.argmin(mat[:, ::-1], axis=1) - 1


def absolute_coordinates(heads, relative_coordinates):
    absolute = np.empty_like(relative_coordinates)
    absolute[:, :2] = relative_coordinates[:, :2] + heads[:, :2]
    absolute[:, 2] = -relative_coordinates[:, 2] + heads[:, 2]
    return absolute
