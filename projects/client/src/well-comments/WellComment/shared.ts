export const COMMENT_LABEL_MAP = {
	project: {
		filter: 'projectId',
		label: 'Project',
	},
	scenario: {
		filter: 'scenarioId',
		label: 'Scenario',
	},
	forecast: {
		filter: 'forecastId',
		label: 'Forecast',
	},
};

export function getCommentLabel(key): string {
	return COMMENT_LABEL_MAP[key].label;
}

export function getCommentIdKey(key): string {
	return COMMENT_LABEL_MAP[key].filter;
}
