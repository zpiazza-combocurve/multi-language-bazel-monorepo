import { fromBody, fromQuery } from '../metadata/metadata';
import { MetadaWrapper } from '../metadata/metada-wrapper';
import { NamingTypes } from '../common';

import { RequestStructure } from './request-structure';

import { mockExpress } from '@test/express-mocks';

class simpleModel {
	@fromQuery({ expects: 'string' })
	public queryProp?: string;

	@fromBody({ expects: 'string' })
	public bodyProp?: string;
}

describe('request-structure', () => {
	it('checkBasicStructure should check unknown fields', () => {
		const { req, res } = mockExpress();

		const model = new simpleModel();
		const metadata = new MetadaWrapper(model);
		const requestStructure = new RequestStructure(req, res, metadata, NamingTypes.ExactlyEqual);

		req.body = {
			bodyProp: 'bodyProp',
			unknownProp: 'unknownProp',
		};

		req.query = {
			queryProp: 'queryProp',
			unknownProp: 'unknownProp',
		};

		const errors = requestStructure.checkBasicStructure();

		expect(errors).toHaveLength(2);
		expect(errors.every((e) => e.message === 'Unrecognized field unknownProp')).toBeTruthy();

		expect(errors[0].details.location).toBe('body');
		expect(errors[1].details.location).toBe('query');
	});
});
