// cache by phase
export const KEYS = {
	allFitInit: (tcId) => ['tc', tcId, 'get', `/type-curve/${tcId}/getFitInit`],
	fitInit: (tcId) => [...KEYS.allFitInit(tcId)],
	tcInfo: (tcId, phase, validWells) => ['tc', tcId, 'post', `/type-curve/${tcId}/getFitInfo`, { phase, validWells }],
	tcFits: (tcId) => ['tc', tcId, 'get', `/type-curve/${tcId}/phase-fits`],
	tcRawBackgroundData: ({ phase, phaseTypes, resolution, tcId, wells }) => [
		'tc',
		tcId,
		'tcFitData',
		phase,
		resolution,
		wells,
		phaseTypes,
	],
};
