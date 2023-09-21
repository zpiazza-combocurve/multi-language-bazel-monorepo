import { MergedQualifier } from './models';

export const getMergedQualifierPartUniqueKey = (scenarioId: string, assumption: string, qualifierKey: string): string =>
	`${scenarioId}_${assumption}_${qualifierKey}`;

export const getQualifierDnDType = (assumption: string) => {
	return `qualifier_${assumption}`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const createMergedQualifierPart = (qualifier: any, scenario: any, assumption: string, prior: boolean) => {
	const uniqueKey = getMergedQualifierPartUniqueKey(scenario._id, assumption, qualifier.key);

	return {
		key: uniqueKey,
		originalKey: qualifier.key,
		name: qualifier.name,
		scenarioId: scenario._id,
		scenarioName: scenario.name,
		prior,
	};
};

export const createMergedQualifierFromSingleQualifier = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	scenario: any,
	assumption: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	qualifier: any
): MergedQualifier => {
	const qualifierPart = createMergedQualifierPart(qualifier, scenario, assumption, true);

	return {
		key: `${qualifierPart.key}_${Date.now()}`,
		name: qualifier.name,
		assumption,
		color: '',
		qualifiers: [qualifierPart],
	};
};
