/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-commonjs */
const { range } = require('lodash');
const { Types } = require('mongoose');

const baseDailyProduction = require('../fixtures/apiFormat/daily-production.json');
const baseEmissions = require('../fixtures/apiFormat/econ-models/emissions.json');
const baseEscalations = require('../fixtures/apiFormat/econ-models/escalations.json');
const baseFluidModels = require('../fixtures/apiFormat/econ-models/fluid-models.json');
const baseMonthlyProduction = require('../fixtures/apiFormat/monthly-production.json');
const baseWell = require('../fixtures/apiFormat/well.json');
const baseOwnershipQualifier = require('../fixtures/apiFormat/ownership-qualifier.json');
const baseOwnershipReversion = require('../fixtures/apiFormat/econ-models/ownership-reversions.json');
const basePricing = require('../fixtures/apiFormat/econ-models/pricing.json');
const baseStreamProperties = require('../fixtures/apiFormat/econ-models/stream-properties.json');
const baseReservesCategory = require('../fixtures/apiFormat/econ-models/reserves-category.json');
const baseDepreciation = require('../fixtures/apiFormat/econ-models/depreciation.json');
const econMonthlies = require('../fixtures/monthly-exports.json');
const econRuns = require('../fixtures/econ-runs.json');
const forecastData = require('../fixtures/forecast-data.json');
const deterministicForecastData = require('../fixtures/deterministic-forecast-data.json');
const forecasts = require('../fixtures/forecasts.json');
const oneLiners = require('../fixtures/one-liners.json');
const projects = require('../fixtures/projects.json');
const scenarios = require('../fixtures/scenarios.json');
const tags = require('../fixtures/tags.json');
const typeCurves = require('../fixtures/type-curves.json');
const typeCurveFits = require('../fixtures/type-curve-fits.json');
const wellComments = require('../fixtures/well-comments.json');
const wells = require('../fixtures/wells.json');
const baseDifferentials = require('../fixtures/apiFormat/econ-models/differentials.json');
const baseProductionTaxes = require('../fixtures/apiFormat/econ-models/production-taxes.json');
const baseRiskings = require('../fixtures/apiFormat/econ-models/risking.json');
const baseExpenses = require('../fixtures/apiFormat/econ-models/expenses.json');
const baseCapex = require('../fixtures/apiFormat/econ-models/capex.json');
const baseActualForecast = require('../fixtures/apiFormat/econ-models/actual-or-forecast.json');
const baseDateSettings = require('../fixtures/apiFormat/econ-models/date-settings.json');
const baseGeneralOptions = require('../fixtures/apiFormat/econ-models/general-options.json');
const directionalSurvey = require('../fixtures/directional-surveys.json');

const { generateBigQueryDate, generateDate } = require('./dates');
const { randomizer, timeId } = require('./randomizer');

const base10Random9 = randomizer(10, 9);

const generateApis = () => {
	const base = base10Random9() + base10Random9();
	return {
		api10: base.slice(0, 10),
		api12: base.slice(0, 12),
		api14: base.slice(0, 14),
	};
};

const generateWell = (index) => {
	const wellName = `TEST-${index}-${timeId()}`;
	const chosenID = randomizer(10, 14)();
	return { ...baseWell, ...generateApis(), chosenID, wellName };
};

const generateWellDb = (index, { project, _id }) => {
	const baseWell = wells[0];
	const wellName = `TEST-${index}-${timeId()}`;
	const chosenID = randomizer(10, 14)();
	return { ...baseWell, ...generateApis(), chosenID, well_name: wellName, project, _id };
};

const generateMonthlyProduction = (index, { well, dataSource, chosenID }) => {
	const date = new Date(baseMonthlyProduction.date);
	date.setUTCMonth(date.getUTCMonth() + index);
	return { ...baseMonthlyProduction, well, dataSource, chosenID, date };
};

const generateDailyProduction = (index, { well, dataSource, chosenID }) => {
	const date = generateDate(baseDailyProduction.date, index);
	return { ...baseDailyProduction, well, dataSource, chosenID, date };
};

const generateEconMonthly = (index, modifiedFields) => {
	const baseEconMonthly = econMonthlies[0];
	const combo_name = `TEST-${index}-${timeId()}`;
	const well_id = Types.ObjectId().toHexString();
	const date = generateBigQueryDate(baseEconMonthly.date, index);
	return { ...baseEconMonthly, combo_name, date, well_id, ...modifiedFields };
};

const generateEconRun = (index, { project, scenario }) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { _id, ...baseEconRun } = econRuns[0];
	const runDate = generateDate(baseEconRun.runDate, index);
	const user = Types.ObjectId();
	return { ...baseEconRun, runDate, project, scenario, user };
};

const generateForecast = (index, { project, wells: wellIds, type: forecastType, tags }) => {
	const { wells, ...baseForecast } = forecasts[0];
	const name = `TEST-${index}-${timeId()}`;
	const resWells = wellIds || wells;
	const type = forecastType || 'probabilistic';
	return { ...baseForecast, name, project, user: undefined, wells: resWells, _id: undefined, type, tags: tags };
};

const generateDeterministicForecastData = (index, { project, forecast, well: wellId, typeCurve: typeCurveId }) => {
	const baseForecastData = deterministicForecastData[0];
	const name = `TEST-${index}-${timeId()}`;
	const well = wellId || Types.ObjectId();
	const typeCurve = typeCurveId || null;
	return { ...baseForecastData, name, project, forecast, well, typeCurve, _id: undefined };
};

const generateForecastData = (index, { project, forecast, well: wellId, typeCurve: typeCurveId }) => {
	const baseForecastData = forecastData[0];
	const name = `TEST-${index}-${timeId()}`;
	const well = wellId || Types.ObjectId();
	const typeCurve = typeCurveId || null;
	return { ...baseForecastData, name, project, forecast, well, typeCurve, _id: undefined };
};

const generateOneLiner = (index, { project, scenario, run }) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { _id, ...baseOneLiner } = oneLiners[0];
	const comboName = `TEST-${index}-${timeId()}`;
	const well = Types.ObjectId();
	return { ...baseOneLiner, comboName, project, scenario, run, well };
};

const generateProject = (index) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { _id, ...baseProjects } = projects[0];
	const name = `TEST-${index}-${timeId()}`;
	return { ...baseProjects, name, wells: [] };
};

const generateScenario = (index, { project }) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { _id, ...baseScenarios } = scenarios[0];
	const name = `TEST-${index}-${timeId()}`;
	return { ...baseScenarios, name, project };
};

const generateOwnershipQualifiers = (index, { well, qualifierKey, dataSource, chosenID }) => {
	const qKey = qualifierKey || `q${index}`;
	const w = well || Types.ObjectId().toString();
	return { ...baseOwnershipQualifier, well: w, dataSource, chosenID, qualifierKey: qKey };
};

const generatePricing = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...basePricing, unique: uniq, name: rcName, ...sw };
};

const generateEmissions = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseEmissions, unique: uniq, name: rcName, ...sw };
};

const generateEscalations = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseEscalations, unique: uniq, name: rcName, ...sw };
};

const generateFluidModels = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseFluidModels, unique: uniq, name: rcName, ...sw };
};

const generateStreamProperties = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseStreamProperties, unique: uniq, name: rcName, ...sw };
};

const generateReservesCategories = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseReservesCategory, unique: uniq, name: rcName, ...sw };
};

const generateOwnershipReversions = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseOwnershipReversion, unique: uniq, name: rcName, ...sw };
};

const generateDepreciation = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseDepreciation, unique: uniq, name: rcName, ...sw };
};

const generateRiskings = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseRiskings, unique: uniq, name: rcName, ...sw };
};

const generateTag = (index) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { _id, ...baseTags } = tags[0];
	const name = `TEST-${index}-${timeId()}`;
	return { ...baseTags, name };
};

const generateTypeCurve = (index, { project, fits }) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { _id, ...baseTypeCurve } = typeCurves[0];
	const name = `TEST-${index}-${timeId()}`;
	return { ...baseTypeCurve, name, project, fits };
};

const generateWellComments = (well) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { _id, ...baseWellComment } = wellComments[0];
	return { ...baseWellComment, well: well || baseWellComment.well };
};

const generateDS = (chosenID, projectID) => {
	const { ...base } = directionalSurvey[0];
	return { ...base, chosenID, projectID };
};

const generateTypeCurveFit = ({ phase, typeCurve }) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { _id, ...baseTypeCurveFit } = typeCurveFits[0];
	return { ...baseTypeCurveFit, phase, typeCurve };
};

const generateDifferentials = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseDifferentials, unique: uniq, name: rcName, ...sw };
};

const generateProductionTaxes = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseProductionTaxes, unique: uniq, name: rcName, ...sw };
};

const generateExpenses = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseExpenses, unique: uniq, name: rcName, ...sw };
};

const generateCapex = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseCapex, unique: uniq, name: rcName, ...sw };
};

const generateDateSettings = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseDateSettings, unique: uniq, name: rcName, ...sw };
};

const createDailyProductionsPayload = (count, wellReference = {}, startIndex = 0) =>
	range(count).map((i) => generateDailyProduction(i + startIndex, wellReference));

const createDeterministicForecastDataPayload = (count, scopeReference) =>
	range(count).map((i) => generateDeterministicForecastData(i, scopeReference));

const createDifferentialsPayload = (count, DifferentialsReference = {}) =>
	range(count).map((i) => generateDifferentials(i, DifferentialsReference));

const generateActualForecast = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseActualForecast, unique: uniq, name: rcName, ...sw };
};

const generateGeneralOptions = (index, { name, unique, scenario, well }) => {
	const rcName = name || `rc${index}`;
	let uniq = unique ?? false;
	let s = scenario;
	let w = well;
	if (unique) {
		s = s || Types.ObjectId().toString();
		w = w || Types.ObjectId().toString();
	}
	const sw = s && w ? { scenario: s, well: w } : {};
	return { ...baseGeneralOptions, unique: uniq, name: rcName, ...sw };
};

const createEconMonthlyPayload = (count, modifiedFields) =>
	range(count).map((i) => generateEconMonthly(i, modifiedFields));

const createEconRunPayload = (count, scopeReference) => range(count).map((i) => generateEconRun(i, scopeReference));

const createEmissionsPayload = (count, EscalationsReference = {}) =>
	range(count).map((i) => generateEmissions(i, EscalationsReference));

const createEscalationsPayload = (count, EscalationsReference = {}) =>
	range(count).map((i) => generateEscalations(i, EscalationsReference));

const createFluidModelsPayload = (count, FluidModelsReference = {}) =>
	range(count).map((i) => generateFluidModels(i, FluidModelsReference));

const createForecastDataPayload = (count, overrideProps) =>
	range(count).map((i) => generateForecastData(i, overrideProps));

const createForecastPayload = (count, scopeReference) => range(count).map((i) => generateForecast(i, scopeReference));

const createMonthlyProductionsPayload = (count, wellReference = {}, startIndex = 0) =>
	range(count).map((i) => generateMonthlyProduction(i + startIndex, wellReference));

const createOneLinerPayload = (count, scopeReference) => range(count).map((i) => generateOneLiner(i, scopeReference));

const createOwnershipQualifiersPayload = (count, OwnershipQualifierReference = {}) =>
	range(count).map((i) => generateOwnershipQualifiers(i, OwnershipQualifierReference));

const createOwnershipReversionsPayload = (count, OwnershipReversionReference = {}) =>
	range(count).map((i) => generateOwnershipReversions(i, OwnershipReversionReference));

const createPricingPayload = (count, PricingReference = {}) =>
	range(count).map((i) => generatePricing(i, PricingReference));

const createProductionTaxesPayload = (count, ProductionTaxesReference = {}) =>
	range(count).map((i) => generateProductionTaxes(i, ProductionTaxesReference));

const createProjectsPayload = (count) => range(count).map(generateProject);

const createReservesCategoriesPayload = (count, ReservesCategoryReference = {}) =>
	range(count).map((i) => generateReservesCategories(i, ReservesCategoryReference));

const createRiskingsPayload = (count, OwnershipReversionReference = {}) =>
	range(count).map((i) => generateRiskings(i, OwnershipReversionReference));

const createScenarioPayload = (count, projectReference) =>
	range(count).map((i) => generateScenario(i, projectReference));

const createStreamPropertiesPayload = (count, StreamPropertiesReference = {}) =>
	range(count).map((i) => generateStreamProperties(i, StreamPropertiesReference));

const createTagsPayload = (count) => range(count).map(generateTag);

const createTypeCurvePayload = (count, overrideProps) => range(count).map((i) => generateTypeCurve(i, overrideProps));

const createWellComments = (count, well) => range(count).map(() => generateWellComments(well));

const createDepreciationPayload = (count, ReservesCategoryReference = {}) =>
	range(count).map((i) => generateDepreciation(i, ReservesCategoryReference));

const createWellsDbPayload = (count, scopeReference) => range(count).map((i) => generateWellDb(i, scopeReference));

const createWellsPayload = (count) => range(count).map(generateWell);

const createExpensesPayload = (count, ProductionTaxesReference = {}) =>
	range(count).map((i) => generateExpenses(i, ProductionTaxesReference));

const createActualForecastPayload = (count, DifferentialsReference = {}) =>
	range(count).map((i) => generateActualForecast(i, DifferentialsReference));

const createCapexPayload = (count, CapexReference = {}) => range(count).map((i) => generateCapex(i, CapexReference));

const createDateSettingsPayload = (count, CapexReference = {}) =>
	range(count).map((i) => generateDateSettings(i, CapexReference));

const createGeneralOptionsPayload = (count, generalOptionsReference = {}) =>
	range(count).map((i) => generateGeneralOptions(i, generalOptionsReference));
const createDirectionalSurveys = (count, chosenID, projectID) =>
	range(count).map(() => generateDS(chosenID, projectID));

module.exports = {
	createDailyProductionsPayload,
	createDeterministicForecastDataPayload,
	createDifferentialsPayload,
	createEconMonthlyPayload,
	createEconRunPayload,
	createEmissionsPayload,
	createEscalationsPayload,
	createFluidModelsPayload,
	createForecastDataPayload,
	createForecastPayload,
	createMonthlyProductionsPayload,
	createOneLinerPayload,
	createOwnershipQualifiersPayload,
	createOwnershipReversionsPayload,
	createPricingPayload,
	createProductionTaxesPayload,
	createProjectsPayload,
	createReservesCategoriesPayload,
	createRiskingsPayload,
	createScenarioPayload,
	createStreamPropertiesPayload,
	createTagsPayload,
	createTypeCurvePayload,
	createWellComments,
	createWellsDbPayload,
	createWellsPayload,
	generateTypeCurveFit,
	createDepreciationPayload,
	createExpensesPayload,
	createActualForecastPayload,
	createCapexPayload,
	createDateSettingsPayload,
	createGeneralOptionsPayload,
	createDirectionalSurveys,
};
