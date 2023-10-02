import { Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { EconModelService } from '@src/api/v1/projects/econ-models/service';
import { EconName } from '@src/value-objects/econ-name';
import { IScenario } from '@src/models/scenarios';

import { emptyHttpContext, testCreateScenario } from '../../../test.exports';
import { QualifiersService } from '../../service';

import { QualifiersRead } from './read';

jest.mock('@src/helpers/request');

const createQualifierService = (): QualifiersService => {
	const context = {
		econModelService: new EconModelService({} as ApiContextV1),
	} as ApiContextV1;

	return new QualifiersService(context);
};

describe('qualifiers read request', () => {
	it('projection should be equal expected', () => {
		expect(new QualifiersRead().projection(emptyHttpContext)).toStrictEqual({
			_id: 1,
			columns: 1,
		});
	});

	it('filter should be equal expected', () => {
		const req = new QualifiersRead();

		const scenario = (req.scenarioId = Types.ObjectId('5f9d7a3b9d5f9d7a3b9d5f9d'));
		const proj = (req.projectId = Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'));

		expect(req.filter(emptyHttpContext)).toStrictEqual({
			_id: scenario,
			project: proj,
		});
	});

	describe('parseDoc', () => {
		const baseArrange = (scenario: IScenario, econNames?: string[]): unknown => {
			const req = new QualifiersRead();
			req.econName = econNames?.map((e) => new EconName(e));
			req.qualifiersService = createQualifierService();

			return req.parseDoc(scenario);
		};

		it('when undefined should parse empty', () => {
			const scenario = testCreateScenario();
			delete scenario.columns;

			const response = baseArrange(scenario);

			expect(response).toStrictEqual({});
		});

		it('when defined should parse correctly', () => {
			const scenario = testCreateScenario();
			const response = baseArrange(scenario);

			expect(response).toStrictEqual({
				capex: ['Default', 'capex'],
				dates: ['Default', 'dates'],
				depreciation: ['Default', 'depreciation'],
				escalation: ['Default', 'escalation'],
				expenses: ['Default', 'expenses', 'expenses_2'],
				actualOrForecast: ['Default', 'production_vs_fit', 'production_vs_fit_2', 'production_vs_fit_3'],
			});
		});

		it('when econNames defined should filter and parse correctly', () => {
			const scenario = testCreateScenario();
			const response = baseArrange(scenario, ['capex', 'expenses']);

			expect(response).toStrictEqual({
				capex: ['Default', 'capex'],
				expenses: ['Default', 'expenses', 'expenses_2'],
			});
		});
	});
});
