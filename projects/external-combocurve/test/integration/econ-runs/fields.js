const { toBaseApiTag } = require('../tags/fields');

const toApiEconRun = (econRun, tagsMap) => ({
	id: econRun._id.toString(),
	project: econRun.project.toString(),
	runDate: econRun.runDate && econRun.runDate.toISOString(),
	scenario: econRun.scenario.toString(),
	status: econRun.status,
	tags: tagsMap && econRun.tags?.map((tag) => toBaseApiTag(tagsMap[tag.toString()])),
	outputParams: mapOutputParams(econRun),
});

const mapOutputParams = (econRun) =>
	econRun.outputParams?.prodAnalyticsType ? { prodAnalyticsType: econRun.outputParams?.prodAnalyticsType } : {};

module.exports = {
	toApiEconRun,
};
