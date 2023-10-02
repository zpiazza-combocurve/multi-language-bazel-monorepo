import { TestController, TestModel } from '@src/core/test.exports';

import { DefinitionsGenHandler } from './handler';

describe('spec handler', () => {
	it('mapRequestObjects', () => {
		const model = new TestModel();
		const handler = new DefinitionsGenHandler<TestController>(new TestController());

		const definitions = handler.mapRequestObjects(model);

		expect(definitions.length).toBe(3);

		const customInputModel = definitions[0];
		const testModel = definitions[1];
		const innerModel = definitions[2];

		// Name
		expect(testModel.name).toBe('TestModel');
		expect(innerModel.name).toBe('InnerModel');
		expect(customInputModel.name).toBe('TestModelCustomInput');

		// Required
		expect(testModel.required).toEqual(['name', 'isCool', 'inner']);
		expect(innerModel.required).toEqual(['profession', 'yearsOfExperience', 'lookingForJob']);

		// Properties
		// TODO
	});

	it('mapResponseObjects', () => {
		const model = new TestModel();
		const handler = new DefinitionsGenHandler<TestController>(new TestController());

		const definitions = handler.mapResponseSamples('TestModel', model);

		expect(definitions.length).toBe(5);

		const ok = definitions[0];
		const innerOutput = definitions[1];
		const notFound = definitions[2];
		const created = definitions[3];
		const peoplesOutput = definitions[4];

		// Name
		expect(created.name).toBe('TestModelCreatedResponse');
		expect(peoplesOutput.name).toBe('TestModelPeoplesOutput');
		expect(notFound.name).toBe('TestModelNotFoundResponse');
		expect(ok.name).toBe('TestModelOKResponse');
		expect(innerOutput.name).toBe('TestModelInnerOutput');

		// Properties
		expect(created.properties.length).toBe(1);
		expect(peoplesOutput.properties.length).toBe(2);
		expect(notFound.properties.length).toBe(3);
		expect(ok.properties.length).toBe(7);
		expect(innerOutput.properties.length).toBe(3);
	});

	it('getDefinitions', () => {
		const handler = new DefinitionsGenHandler<TestController>(new TestController());

		const yaml = handler.getDefinitionSpec();

		expect(yaml).toMatchSnapshot();
	});
});
