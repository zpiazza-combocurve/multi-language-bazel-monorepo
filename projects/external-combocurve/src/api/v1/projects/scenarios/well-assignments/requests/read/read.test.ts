import { Types } from 'mongoose';

import { HttpMessageContext } from '@src/core/common';

import { testCreateScenario } from '../../../test.exports';

import { ScenarioWellsRead } from './read';

describe('ScenarioWellsRead', () => {
	it('filter method should return the correct filter', () => {
		const req = new ScenarioWellsRead();

		req.scenarioId = Types.ObjectId('5e272d72b78910dd2a1d5c16');
		req.projectId = Types.ObjectId('5e272d72b78910dd2a1d5c17');

		expect(req.filter({} as HttpMessageContext)).toStrictEqual({
			_id: req.scenarioId,
			project: req.projectId,
		});
	});

	it('projection method should return the correct projection', () => {
		const req = new ScenarioWellsRead();

		expect(req.projection({} as HttpMessageContext)).toStrictEqual({
			_id: 1,
			wells: 1,
		});
	});

	it('parseDoc method should parse correctly', () => {
		const req = new ScenarioWellsRead();

		const scenario = testCreateScenario();
		const got = req.parseDoc(scenario);

		expect(got).toStrictEqual({
			wells: scenario.wells.map((well) => well.toString()),
		});
	});
});
