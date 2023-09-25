const UNIT_MULTIPLIERS = {
	mmbbl: {
		multiplier: 1000 * 1000,
		base: 'bbl',
	},
	mbbl: {
		multiplier: 1000,
		base: 'bbl',
	},
	bbl: {
		multiplier: 1,
		base: 'bbl',
	},
	gal: {
		multiplier: 1 / 42,
		base: 'bbl',
	},
	mmcf: {
		multiplier: 1000 * 1000,
		base: 'cf',
	},
	mcf: {
		multiplier: 1000,
		base: 'cf',
	},
	cf: {
		multiplier: 1,
		base: 'cf',
	},
	mmboe: {
		multiplier: 1000 * 1000,
		base: 'boe',
	},
	mboe: {
		multiplier: 1000,
		base: 'boe',
	},
	boe: {
		multiplier: 1,
		base: 'boe',
	},
	mmcfe: {
		multiplier: 1000 * 1000,
		base: 'cfe',
	},
	mcfe: {
		multiplier: 1000,
		base: 'cfe',
	},
	cfe: {
		multiplier: 1,
		base: 'cfe',
	},
	lb: {
		multiplier: 1,
		base: 'lb',
	},
	'1000ft': {
		multiplier: 1000,
		base: 'ft',
	},
	acre: {
		multiplier: 1,
		base: 'acre',
	},
	in: {
		multiplier: 1 / 12,
		base: 'ft',
	},
	ft: {
		multiplier: 1,
		base: 'ft',
	},
	y: {
		multiplier: 365.25,
		base: 'd',
	},
	m: {
		multiplier: 30.4375,
		base: 'd',
	},
	d: {
		multiplier: 1,
		base: 'd',
	},
};

function compareArrays(arr1, arr2) {
	// TODO improve and check if it already exists
	if (arr1.length !== arr2.length) {
		return false;
	}
	return arr1.reduce((acc, _, index) => (arr1[index] === arr2[index] ? acc && true : false), true);
}

export function getUnitNomDenomLists(unitStr) {
	const mult = unitStr.split('*');
	const div = mult.map((m) => m.split('/'));
	const nominators = div.map((p) => p[0]);
	const denominators = div.flatMap((p) => p.slice(1));
	return { nominators, denominators };
}

function getBaseMultiplier(unit) {
	const unitNomDenom = getUnitNomDenomLists(unit);
	const { nominators, denominators } = unitNomDenom;

	let ret = 1;
	nominators.forEach((unit2) => {
		ret *= UNIT_MULTIPLIERS[unit2]?.multiplier ?? 1;
	});

	denominators.forEach((unit2) => {
		ret /= UNIT_MULTIPLIERS[unit2]?.multiplier ?? 1;
	});
	return ret;
}

function getBases(unitLists) {
	return unitLists.map((x) => UNIT_MULTIPLIERS[x]?.base ?? x);
}

/**
 * @param {string} origUnit
 * @param {string} targetUnit
 */
function checkValidConversion(origUnit, targetUnit) {
	const origUnitNomDenom = getUnitNomDenomLists(origUnit);
	const targetUnitNomDenom = getUnitNomDenomLists(targetUnit);

	const origNomBase = getBases(origUnitNomDenom.nominators).sort();
	const origDenomBase = getBases(origUnitNomDenom.denominators).sort();
	const targetNomBase = getBases(targetUnitNomDenom.nominators).sort();
	const targetDenomBase = getBases(targetUnitNomDenom.denominators).sort();

	return compareArrays(origNomBase, targetNomBase) && compareArrays(origDenomBase, targetDenomBase);
}

/**
 * @param {string} origUnit
 * @param {string} targetUnit
 */
function getMultiplier(origUnit, targetUnit) {
	if (origUnit === targetUnit) {
		return 1;
	}
	if (checkValidConversion(origUnit, targetUnit)) {
		const origBaseMultiplier = getBaseMultiplier(origUnit);
		const targetBaseMultiplier = getBaseMultiplier(targetUnit);
		return origBaseMultiplier / targetBaseMultiplier;
	}
	throw new Error(`Not a valid conversion from ${origUnit} to ${targetUnit}`);
}

/**
 * Generate convert function used for type curve and forecast units conversion
 *
 * @example
 * 	const convert = getConvertFunc('bbl/m', 'mbbl/d');
 * 	covert(1);
 *
 * @param {string | undefined} origUnit Unit to convert from
 * @param {string | undefined} targetUnit Unit to convert to
 */
export function getConvertFunc(origUnit, targetUnit) {
	if (!origUnit || !targetUnit) {
		return (v) => v;
	}
	const multiplier = getMultiplier(origUnit.toLowerCase(), targetUnit.toLowerCase());
	/**
	 * @param {number | null} origNum
	 * @returns {origNum extends null ? null : number}
	 */
	const convertFn = (origNum) => {
		if (!Number.isFinite(origNum)) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			return null;
		}
		return origNum * multiplier;
	};
	return convertFn;
}
