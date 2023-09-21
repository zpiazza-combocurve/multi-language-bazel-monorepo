import { StepDefinitions, autoBindSteps, loadFeature } from 'jest-cucumber';

let featureExists = false;
let somethingHappen = false;

beforeEach(() => {
	featureExists = false;
	somethingHappen = false;
});

let thingsDone = {};
beforeEach(() => {
	thingsDone = {};
});

const stepDefinitions: StepDefinitions = ({ when, then, given }) => {
	given('Some feature exists', () => {
		featureExists = true;
	});

	when('I interact with a feature', () => {
		if (featureExists) somethingHappen = true;
	});

	then('Something should have happen', () => {
		expect(somethingHappen).toBe(true);
	});

	then('Something should not have happen', () => {
		expect(somethingHappen).toBe(false);
	});

	when(/^I do "(.*)"$/, (thing) => {
		thingsDone[thing] = true;
	});

	then(/^"(.*)" should have been done$/, (thing) => {
		expect(thingsDone[thing]).toBe(true);
	});

	then(/^"(.*)" should not have been done$/, (thing) => {
		expect(thingsDone[thing]).toBeFalsy();
	});
};

const feature = loadFeature('./some.feature', { loadRelativePath: true });

autoBindSteps([feature], [stepDefinitions]);
