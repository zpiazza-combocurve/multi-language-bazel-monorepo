import { isNil } from 'lodash';

type RangeBoundaryValue = number | Date | undefined;

/**
 * Function to check if the 2 given Date/number ranges have the intersection. Function expects lower1 <= upper1 and
 * lower2 <= upper2 for correct work. If all passed values are undefined it is treated as ranges are overlapping each
 * other, so function returns true. If both values in the range are not undefined, range is treated as a segment. If one
 * of the values in the range is undefined, range is treated as a ray.
 */
export const rangesHaveOverlap = (
	lower1: RangeBoundaryValue,
	upper1: RangeBoundaryValue,
	lower2: RangeBoundaryValue,
	upper2: RangeBoundaryValue
) => {
	let l1Ord = lower1; //lower1Ordered
	let u1Ord = upper1; //upper1Ordered
	let l2Ord = lower2; //lower2Ordered
	let u2Ord = upper2; //upper1Ordered

	if (!isNil(lower1) && !isNil(lower2) && lower1 > lower2) {
		l1Ord = lower2;
		u1Ord = upper2;
		l2Ord = lower1;
		u2Ord = upper1;
	}

	if (!isNil(l1Ord)) {
		if (!isNil(u1Ord)) {
			if (!isNil(l2Ord)) {
				if (l2Ord > u1Ord) {
					return false;
				}
			} else {
				if (!isNil(u2Ord)) {
					if (l1Ord > u2Ord) {
						return false;
					}
				} else {
					return false;
				}
			}
		} else {
			if (!isNil(l2Ord)) {
				if (!isNil(u2Ord)) {
					if (l1Ord > u2Ord) {
						return false;
					}
				}
			} else {
				if (!isNil(u2Ord)) {
					if (l1Ord > u2Ord) {
						return false;
					}
				} else {
					return false;
				}
			}
		}
	} else if (!isNil(u1Ord)) {
		if (!isNil(l2Ord)) {
			if (l2Ord > u1Ord) {
				return false;
			}
		} else {
			if (isNil(u2Ord)) {
				return false;
			}
		}
	} else if (!isNil(l2Ord) || !isNil(u2Ord)) {
		return false;
	}

	return true;
};
