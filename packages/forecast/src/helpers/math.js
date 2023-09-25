export const Q_FINAL_DECIMAL = 3;

export const LARGE_NUMBER = 1.23e15;

export const dateTimeToDateStr = (date) => {
	const year = date.getFullYear();
	const month = date.getMonth();
	const monthStr = `${month < 9 ? '0' : ''}${month + 1}`;
	const day = date.getDate();
	const dayStr = `${day < 10 ? '0' : ''}${day}`;
	return `${monthStr}/${dayStr}/${year}`;
};

export const daysToMS = (days) => days * 24 * 60 * 60 * 1000;

export const msToDays = (ms) => ms / (24 * 60 * 60 * 1000);

export function convertIdxToMilli(idx) {
	const val = daysToMS(idx);
	return new Date(1900, 0, 1).getTime() + val;
}

export function convertMilliToIdx(milli) {
	return msToDays(milli - new Date(1900, 0, 1).getTime());
}

export function convertIdxToDate(idx) {
	return new Date(convertIdxToMilli(idx));
}

export function convertDateToIdx(date) {
	const startDate = new Date(1900, 0, 1).getTime();
	const endDate = new Date(date).getTime();

	return Math.round(msToDays(endDate - startDate));
}

export function convertDateToIdxFloor(date) {
	const startDate = new Date(1900, 0, 1).getTime();
	const endDate = new Date(date).getTime();

	return Math.floor(msToDays(endDate - startDate));
}

export function convertDateToMilli(date) {
	return convertIdxToMilli(convertDateToIdx(date));
}

// TODO move away from here, this is not math?
// TODO replace with lodash implementation
/**
 * @deprecated We can take advantage of lodash
 * @see lodash.isDate
 */
export const isDate = (obj) => {
	return Object.prototype.toString.call(obj) === '[object Date]';
};

/** @deprecated Use Number.isFinite instead */
export const isNumber = (val) => {
	if (val === null) {
		return false;
	}
	if (val === 0) {
		return true;
	}

	// works for negative numbers too
	return !!Number(val);
};

export const isNumberAndNotZero = (val) => {
	if (val === null) {
		return false;
	}

	// works for negative numbers too, but excludes 0
	return !!Number(val);
};

/** @deprecated Use Number.isInteger instead */
export const isInt = (val) => isNumber(val) && val % 1 === 0;

/**
 * @deprecated We can take advantage of lodash
 * @see lodash.round
 */
export const fixedFloat = (val, placesPastDecimal = 2) => {
	if (!isNumber(val)) {
		return null;
	}

	return Number(parseFloat(val).toFixed(placesPastDecimal));
};

export const fixedFloatWithFlexibleDecimal = (val, placesPastDecimal = 2, percentageThreshold = 0.001) => {
	if (!Number.isFinite(val)) {
		return null;
	}
	const origTargetValue = fixedFloat(val, placesPastDecimal);
	if (Math.abs(val) < 1e-100) {
		return origTargetValue;
	}

	if (Math.abs((val - origTargetValue) / val) < percentageThreshold) {
		return origTargetValue;
	}

	for (let decimal = placesPastDecimal; decimal < 101; decimal++) {
		const thisVal = fixedFloat(val, decimal);
		if (Math.abs((val - thisVal) / val) < percentageThreshold) {
			return thisVal;
		}
	}

	return fixedFloat(0, placesPastDecimal);
};

/**
 * Used to get a rounded number, when the final rounded number is lower than the minimum unit of that decimal will get
 * the minimum unit for the rounding result
 *
 * @example
 * 	fixedFloatWithMinimum(0.0001, 2) = 0.01 = 10**-2
 */
export const fixedFloatWithMinimum = (val, placesPastDecimal = 2) => {
	if (!Number.isFinite(val)) {
		return null;
	}
	const origTargetValue = fixedFloat(val, placesPastDecimal);
	const minimum = 10 ** -placesPastDecimal;
	if (origTargetValue < 0) {
		return Math.min(origTargetValue, -minimum);
	}
	return Math.max(origTargetValue, minimum);
};

/**
 * @deprecated We can take advantage of lodash
 * @see lodash.floor
 */
export const floorFloat = (val, placesPastDecimal = 2) => {
	const multiplier = 10 ** placesPastDecimal;
	return Math.floor(val * multiplier) / multiplier;
};

/**
 * @deprecated We can take advantage of lodash
 * @see lodash.ceil
 */
export const ceilFloat = (val, placesPastDecimal = 2) => {
	const multiplier = 10 ** placesPastDecimal;
	return Math.ceil(val * multiplier) / multiplier;
};

// TODO add some description
export const myBisect = (f, a, b, tol = 2e-6) => {
	const cur_pair = [a, b];
	const cur_val = [f(a), f(b)];
	if (cur_val[0] * cur_val[1] > 0) {
		throw new Error('bisect 2 side should have different sign');
	} else if (cur_val.findIndex((val) => val === 0) > 0) {
		return cur_pair[cur_val.findIndex((val) => val === 0)];
	}

	const negative_0_bool = Number(cur_val[0] < 0);
	let new_x = (cur_pair[0] + cur_pair[1]) / 2;
	let new_val = f(new_x);
	let i = 0;
	while (Math.abs(new_val) >= tol) {
		i += 1;
		if (i === 90) {
			break;
		}
		if (new_val < 0) {
			cur_pair[1 - negative_0_bool] = new_x;
		} else {
			cur_pair[negative_0_bool] = new_x;
		}

		new_x = (cur_pair[0] + cur_pair[1]) / 2;
		new_val = f(new_x);
	}

	return new_x;
};

export const roundToDigit = (num, digit, direction = null) => {
	const place = 10 ** digit;
	if (direction === 'down') {
		return Math.floor((num + Number.EPSILON) * place) / place;
	} else if (direction === 'up') {
		return Math.ceil((num + Number.EPSILON) * place) / place;
	} else {
		return Math.round((num + Number.EPSILON) * place) / place;
	}
};
