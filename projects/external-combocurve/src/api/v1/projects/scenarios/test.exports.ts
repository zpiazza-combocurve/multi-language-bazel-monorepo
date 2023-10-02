import { Types } from 'mongoose';

import { HttpMessageContext } from '@src/core/common';
import { IScenario } from '@src/models/scenarios';
import { IScenarioWellAssignments } from '@src/models/scenario-well-assignments';

import { IScenarioQualifierResponse } from './qualifiers/service';

export const emptyHttpContext = {} as HttpMessageContext;

export const testCreateScenario = (): IScenario => {
	return {
		name: 'scenario',
		_id: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d5f9d'),
		project: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
		wells: [
			Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
			Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6566'),
			Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6567'),
		],
		columns: {
			capex: {
				qualifiers: { default: { name: 'Default' }, qualifier1: { name: 'capex' } },
				activeQualifier: 'default',
			},
			dates: {
				qualifiers: { default: { name: 'Default' }, qualifier1: { name: 'dates' } },
				activeQualifier: 'default',
			},
			depreciation: {
				qualifiers: { default: { name: 'Default' }, qualifier1: { name: 'depreciation' } },
				activeQualifier: 'default',
			},
			escalation: {
				qualifiers: { default: { name: 'Default' }, qualifier1: { name: 'escalation' } },
				activeQualifier: 'default',
			},
			expenses: {
				qualifiers: {
					default: { name: 'Default' },
					qualifier1: { name: 'expenses' },
					qualifier2: { name: 'expenses_2' },
				},
				activeQualifier: 'default',
			},
			production_vs_fit: {
				qualifiers: {
					default: { name: 'Default' },
					qualifier1: { name: 'production_vs_fit' },
					qualifier2: { name: 'production_vs_fit_2' },
					qualifier3: { name: 'production_vs_fit_3' },
				},
				activeQualifier: 'production_vs_fit_3',
			},
		},
		updatedAt: new Date(),
		createdAt: new Date(),
	} as unknown as IScenario;
};

export function testCreateWellAssingment(econModelTestID: Types.ObjectId): IScenarioWellAssignments {
	return {
		_id: Types.ObjectId('5e276e3f876cd70012ddf56f'),
		well: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
		scenario: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d5f9d'),
		project: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
		reserves_category: { default: { model: Types.ObjectId('5e27706b876cd70012ddfd25') } },
		general_options: Types.ObjectId('5e277079876cd70012ddfd26'),
		ownership_reversion: {
			default: {},
			qualifier1: { model: econModelTestID },
			qualifier2: { model: econModelTestID },
		},
		capex: {
			default: { model: econModelTestID },
			qualifier1: { model: econModelTestID },
		},
		expenses: {
			default: { model: econModelTestID },
			qualifier1: { model: econModelTestID },
			qualifier2: { model: econModelTestID },
		},
		production_taxes: { default: { model: econModelTestID } },
		forecast: { default: { model: econModelTestID } },
		dates: { default: { model: null } },
		depreciation: { default: null },
		escalation: { default: null },
		production_vs_fit: {
			default: { model: null },
			qualifier1: { model: econModelTestID },
			qualifier2: { model: econModelTestID },
			qualifier3: { model: econModelTestID },
		},
	} as unknown as IScenarioWellAssignments;
}

export const testScenarioResponse: IScenarioQualifierResponse = {
	capex: ['Default', 'capex'],
	dates: ['Default', 'dates'],
	depreciation: ['Default', 'depreciation'],
	escalation: ['Default', 'escalation'],
	expenses: ['Default', 'expenses', 'expenses_2'],
	actualOrForecast: ['Default', 'production_vs_fit', 'production_vs_fit_2', 'production_vs_fit_3'],
};
