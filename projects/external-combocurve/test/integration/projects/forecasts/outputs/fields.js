const { indexToDate } = require('../../../../helpers/dates');

/**
 * @param {'deterministic' | 'probabilistic'} forecastType
 */
const toApiForecastData = (forecastData, forecastType) => ({
	best: getPdict(forecastData, 'best', forecastType),
	createdAt: forecastData.createdAt,
	forecasted: forecastData.forecasted,
	forecastedAt: forecastData.forecastedAt || null,
	forecastedBy: forecastData.forecastedBy || null,
	id: forecastData._id.toString(),
	forecast: forecastData.forecast,
	p10: getPdict(forecastData, 'P10', forecastType),
	p50: getPdict(forecastData, 'P50', forecastType),
	p90: getPdict(forecastData, 'P90', forecastType),
	phase: forecastData.phase,
	ratio: getRatio(forecastData, forecastType),
	reviewedAt: forecastData.reviewedAt || null,
	reviewedBy: forecastData.reviewedBy || null,
	runDate: forecastData.runDate,
	status: forecastData.status,
	typeCurve: forecastData.typeCurve || null,
	typeCurveApplySettings: getTypeCurveApplySettings(forecastData),
	typeCurveData: getTypeCurveData(forecastData),
	updatedAt: forecastData.createdAt,
	well: forecastData.well.toString(),
	data_freq: forecastData.data_freq,
});

/**
 * @param {'best' | 'P10' | 'P50' | 'P90'} type
 * @param {'deterministic' | 'probabilistic'} forecastType
 */
const getPdict = (forecastData, type, forecastType) => {
	const segments = forecastData.P_dict && forecastData.P_dict[type] && forecastData.P_dict[type].segments;
	if (
		!segments ||
		!segments.length ||
		segments.length === 0 ||
		(forecastType === 'deterministic' && forecastData.forecastType !== 'rate')
	) {
		return undefined;
	}
	const pDictInformation = {
		segments: segments.map(toApiForecastSegment),
	};
	if (forecastData.P_dict[type]?.eur) {
		pDictInformation.eur = forecastData.P_dict[type]?.eur;
	}
	return pDictInformation;
};

const getTypeCurveApplySettings = (forecastData) => {
	const { typeCurveApplySetting } = forecastData;
	if (!typeCurveApplySetting) {
		return undefined;
	}
	return {
		applyNormalization: typeCurveApplySetting.applyNormalization,
		fpdSource: typeCurveApplySetting.fpdSource,
		riskFactor: typeCurveApplySetting.riskFactor,
	};
};

const getTypeCurveData = (forecastData) => {
	const { typeCurveData } = forecastData;
	if (!typeCurveData) {
		return undefined;
	}
	return {
		name: typeCurveData.name,
		type: typeCurveData.tcType,
	};
};

/**
 * @param {'deterministic' | 'probabilistic'} forecastType
 */
const getRatio = (forecastData, forecastType) => {
	const segments = forecastData.ratio && forecastData.ratio.segments;
	if (
		forecastType != 'deterministic' ||
		!segments ||
		!segments.length ||
		segments.length === 0 ||
		forecastData.forecastType != 'ratio'
	) {
		return undefined;
	}

	return {
		basePhase: forecastData.ratio.basePhase,
		segments: segments.map(toApiForecastSegment),
		eur: forecastData.ratio.eur,
	};
};

const toApiForecastSegment = (forecastSegment, index) => ({
	b: forecastSegment.b,
	qStart: forecastSegment.q_start,
	qEnd: forecastSegment.q_end,
	flatValue: forecastSegment.c,
	startDate: indexToDate(forecastSegment.start_idx || 0).toISOString(),
	endDate: indexToDate(forecastSegment.end_idx || 0).toISOString(),
	swDate: indexToDate(forecastSegment.sw_idx || 0).toISOString(),
	realizedDSwEffSec: forecastSegment.realized_D_eff_sw,
	segmentIndex: index + 1,
	segmentType: forecastSegment.name,
	slope: forecastSegment.k,
	diEffSec: forecastSegment.D_eff,
	diNominal: forecastSegment.D,
	targetDSwEffSec: forecastSegment.target_D_eff_sw,
});

module.exports = {
	toApiForecastData,
	toApiForecastSegment,
};
