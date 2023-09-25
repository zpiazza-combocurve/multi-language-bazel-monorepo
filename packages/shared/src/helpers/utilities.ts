import { clone, getAutoIncrementedName } from 'combocurve-utils/utilities';
import { Types } from 'mongoose';
import SUUID from 'short-unique-id';

const beginningOfTime = new Date(1900, 0, 1);
const endOfTime = new Date(2300, 0, 1);

const REF_DATE_MS = Date.UTC(1900, 0, 1);

const getSeconds = (ms: number) => ms / (1000 * 60);

const daysToMS = (days: number) => days * 24 * 60 * 60 * 1000;

const msToDays = (ms: number) => ms / (24 * 60 * 60 * 1000);

const numberWithCommas = (num: number) => {
	const parts = num.toString().split('.');
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return parts.join('.');
};

const month2num = {
	jan: 1,
	feb: 2,
	mar: 3,
	apr: 4,
	may: 5,
	jun: 6,
	jul: 7,
	aug: 8,
	sep: 9,
	oct: 10,
	nov: 11,
	dec: 12,
	january: 1,
	february: 2,
	march: 3,
	april: 4,
	june: 6,
	july: 7,
	august: 8,
	september: 9,
	october: 10,
	november: 11,
	december: 12,
	1: 1,
	2: 2,
	3: 3,
	4: 4,
	5: 5,
	6: 6,
	7: 7,
	8: 8,
	9: 9,
	10: 10,
	11: 11,
	12: 12,
};

function convertIdxToMilli(idx: number) {
	const val = idx * 24 * 60 * 60 * 1000;
	return new Date(1900, 0, 1).getTime() + val;
}

function convertIdxToDate(idx: number) {
	return new Date(convertIdxToMilli(idx));
}

function convertIdxToDateUTC(idx) {
	return new Date(REF_DATE_MS + daysToMS(idx));
}

function convertDateToIdxWithDateInput(date: Date) {
	const startDate = new Date(1900, 0, 1).getTime();
	const endDate = new Date(date).getTime();

	return Math.round(msToDays(endDate - startDate));
}

function convertUtcDateToIdx(date: Date) {
	const startMs = Date.UTC(1900, 0, 1);
	const endMs = date.getTime();

	return Math.round(msToDays(endMs - startMs));
}

function makeLocal(date: Date) {
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function convertDateToIdx(props: { year?: number; month?: number | string; date?: string | Date }, make15th = false) {
	let endDate: Date | undefined;
	const { year, month } = props;
	const startDate = beginningOfTime;
	const date = make15th ? new Date(new Date(props.date || '').setDate(15)) : new Date(props.date || '');
	const isDate = date.toString() !== 'Invalid Date';

	if (!isDate && (!year || !month)) {
		return false;
	}

	if (isDate) {
		endDate = date;
	}

	if (year && month) {
		const m = typeof month === 'string' ? month.toLowerCase() : month;
		const m2n = month2num[m];
		if (!m2n) {
			return false;
		}
		endDate = new Date(year, month2num[m], 15);
	}

	if (!endDate) {
		return false;
	}

	return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

function getYearMonthFromDate(d: Date) {
	const date = new Date(d);
	const isDate = date.toString() !== 'Invalid Date';

	if (!isDate) {
		return false;
	}

	const year = date.getFullYear();
	const month = date.getMonth() + 1;

	return { year, month };
}

const getValidQuery = (props: string[], query: Record<string, unknown>) => {
	const valid: Record<string, unknown> = {};
	props.forEach((p) => {
		if (query[p]) {
			valid[p] = query[p];
		}

		if (valid[p] === 'true') {
			valid[p] = true;
		}

		if (valid[p] === 'false') {
			valid[p] = false;
		}
	});

	return valid;
};

const splitQueryProps = (props: string[], query: Record<string, string>) => {
	const output = props.reduce<Array<string[]>>((_prev, cur) => {
		const prev = _prev;
		prev.push(query[cur] ? query[cur].split(',') : []);
		return prev;
	}, []);

	return output;
};

class InvalidIdError extends Error {
	expected: boolean;
	constructor(message: string) {
		super(message);
		this.name = InvalidIdError.name;
		this.expected = true;
	}
}

const parseObjectId = (id: string) => {
	try {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return Types.ObjectId(id);
	} catch (e) {
		throw new InvalidIdError('We can not find the record you are looking for');
	}
};

const getProjection = (fields: string[]) =>
	fields.reduce<Record<string, boolean>>((accumulator, field) => ({ ...accumulator, [field]: true }), {});

const paginator = <T>(pageSize: number) =>
	function paginate(array: T[]) {
		const numPages = Math.ceil(array.length / pageSize);
		const pages: Array<T[]> = [];
		for (let i = 0; i < numPages; i += 1) {
			pages.push(array.slice(i * pageSize, Math.min((i + 1) * pageSize, array.length)));
		}
		return pages;
	};

const objectFromKeys = <T>(keys: string[], valueResolver: (key: string, index: number) => T) =>
	keys.reduce<Record<string, T>>((accumulator, key, index) => {
		accumulator[key] = valueResolver(key, index);
		return accumulator;
	}, {});

const genInptId = () => {
	return `INPT${new SUUID().randomUUID(10)}`;
};

const removeNonAlphanumeric = (value: string) => value.replace(/[^A-Za-z0-9]/g, '');

function isObject(item: unknown): item is object {
	return !!item && typeof item === 'object' && !Array.isArray(item);
}

function deepMerge<TObject1, TObject2>(obj1: TObject1, obj2: TObject2): (TObject1 & TObject2) | TObject1 {
	const one = obj1;
	const two = obj2;
	if (isObject(one) && isObject(two)) {
		Object.keys(two).forEach((key) => {
			if (isObject(two[key])) {
				if (!one[key] || !isObject(one[key])) {
					one[key] = two[key];
				}
				deepMerge(one[key], two[key]);
			} else {
				Object.assign(one, { [key]: two[key] });
			}
		});
	}
	return one;
}

const objToBuffer = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64');
const bufferToObj = (buffer) => JSON.parse(Buffer.from(buffer, 'base64').toString('ascii'));

const mapObjectKeys = (obj: object, keyMap: (key: string) => string | undefined) =>
	Object.entries(obj).reduce<object>((res, [key, value]) => ({ ...res, [keyMap[key] ?? key]: value }), {});

function isDict(item: unknown) {
	return !!item && typeof item === 'object' && item.constructor === Object;
}

export {
	bufferToObj,
	clone,
	convertDateToIdx,
	convertDateToIdxWithDateInput,
	convertUtcDateToIdx,
	makeLocal,
	convertIdxToDate,
	convertIdxToDateUTC,
	convertIdxToMilli,
	daysToMS,
	deepMerge,
	genInptId,
	removeNonAlphanumeric,
	getAutoIncrementedName,
	getProjection,
	getSeconds,
	getValidQuery,
	getYearMonthFromDate,
	numberWithCommas,
	objToBuffer,
	paginator,
	parseObjectId,
	splitQueryProps,
	objectFromKeys,
	mapObjectKeys,
	isDict,
	beginningOfTime,
	endOfTime,
};
