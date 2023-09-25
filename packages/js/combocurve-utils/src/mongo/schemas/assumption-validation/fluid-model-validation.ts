enum Phase {
	gas = 'gas',
	oil = 'oil',
	water = 'water',
	ngl = 'ngl',
	drip_condensate = 'drip_condensate',
}

enum Criteria {
	flat = 'flat',
	fpd = 'fpd',
	asof = 'as of',
}

const COMPONENTS = [
	'N2',
	'CO2',
	'C1',
	'C2',
	'C3',
	'iC4',
	'nC4',
	'iC5',
	'nC5',
	'iC6',
	'nC6',
	'C7',
	'C8',
	'C9',
	'C10+',
	'H2S',
	'H2',
	'H2O',
	'He',
	'O2',
];

const PHASES: Phase[] = [Phase.oil, Phase.gas, Phase.water, Phase.ngl, Phase.drip_condensate];

interface PhaseData {
	criteria: Criteria;
	composition: Record<string, { percentage: number; price: number }>;
}

interface Data {
	[Phase.oil]: PhaseData;
	[Phase.gas]: PhaseData;
	[Phase.ngl]: PhaseData;
	[Phase.drip_condensate]: PhaseData;
	[Phase.water]: PhaseData;
}

function checkPercentageValid(percentage: number) {
	return Number.isFinite(percentage) && percentage >= 0 && percentage <= 100;
}

function checkPriceValid(price: number) {
	return Number.isFinite(price) && price >= 0;
}

function checkPhaseDataValid(phaseData: PhaseData) {
	return (
		Object.values(Criteria).includes(phaseData.criteria) &&
		COMPONENTS.every((component) => {
			return (
				checkPercentageValid(phaseData.composition?.[component]?.percentage) &&
				checkPriceValid(phaseData.composition?.[component]?.price)
			);
		})
	);
}

export function checkFluidModelDataValid(fluidModelData: Data) {
	for (const phase of PHASES) {
		if (!checkPhaseDataValid(fluidModelData[phase])) {
			return false;
		}
	}
	return true;
}
