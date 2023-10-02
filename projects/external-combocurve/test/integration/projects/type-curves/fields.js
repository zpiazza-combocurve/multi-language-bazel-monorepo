const { toApiForecastSegment } = require('../forecasts/outputs/fields');

const toApiTypeCurve = (typeCurve, typeCurveFits) => ({
	id: typeCurve._id.toString(),
	fits: getTypeCurveFits(typeCurve._id, typeCurveFits),
	forecast: typeCurve.forecast.toString(),
	name: typeCurve.name,
	createdAt: typeCurve.createdAt,
	updatedAt: typeCurve.updatedAt,
});

const toApiTypeCurveFit = (typeCurveFit) => ({
	align: typeCurveFit.align,
	best: getPDictValue(typeCurveFit, 'best'),
	type: typeCurveFit.fitType,
	p10: getPDictValue(typeCurveFit, 'P10'),
	p50: getPDictValue(typeCurveFit, 'P50'),
	p90: getPDictValue(typeCurveFit, 'P90'),
	ratio: getRatioPDict(typeCurveFit),
});

const getPDictValue = (typeCurveFit, serie) => {
	const segments = typeCurveFit.P_dict && typeCurveFit.P_dict[serie] && typeCurveFit.P_dict[serie].segments;
	if (!segments || !segments.length || segments.length === 0) {
		return undefined;
	}
	return {
		segments: segments.map(toApiForecastSegment),
	};
};

const getRatioPDict = (typeCurveFit) => {
	if (typeCurveFit.ratio_P_dict === undefined) {
		return undefined;
	}
	const best = getRatioPDictValue(typeCurveFit.ratioPDict, 'best');
	const p10 = getRatioPDictValue(typeCurveFit.ratioPDict, 'P10');
	const p50 = getRatioPDictValue(typeCurveFit.ratioPDict, 'P50');
	const p90 = getRatioPDictValue(typeCurveFit.ratioPDict, 'P90');

	return (
		(best || p10 || p50 || p90) && {
			best,
			p10,
			p50,
			p90,
		}
	);
};

const getRatioPDictValue = (ratioPDict, serie) => {
	const segments = ratioPDict && ratioPDict[serie] && ratioPDict[serie].segments;
	if (!segments || !segments.length || segments.length === 0) {
		return undefined;
	}
	return {
		basePhase: ratioPDict[serie].basePhase,
		segments: segments.map(toApiForecastSegment),
	};
};

const getTypeCurveFits = (id, typeCurveFits) => {
	const fits = typeCurveFits[id];
	if (fits === undefined) {
		return undefined;
	}
	const gas = fits.gas && toApiTypeCurveFit(fits.gas);
	const oil = fits.oil && toApiTypeCurveFit(fits.oil);
	const water = fits.gas && toApiTypeCurveFit(fits.water);

	return (gas || oil || water) && { gas, oil, water };
};

module.exports = {
	toApiTypeCurve,
};
