import Handlebars from 'handlebars';

import { definitionsTemplate, pathsTemplate } from './templates';

describe('templates', () => {
	it('should generate definitions', () => {
		const pricingEconModelSample = {
			objects: [
				{
					name: 'PricingModelOil',
					properties: [
						{
							name: 'cap',
							type: 'number',
							typeKey: 'type',
						},
						{
							name: 'escalationModel',
							type: 'string',
							typeKey: 'type',
						},
						{
							name: 'rows',
							type: 'array',
							typeKey: 'type',
							isArray: true,
							itemsTypeKey: '$ref',
							itemsType: '#/definitions/PricingModelOilRow',
						},
					],
				},
				{
					name: 'PricingModelOilRow',
					properties: [
						{
							name: 'price',
							type: 'number',
							typeKey: 'type',
						},
						{
							name: 'dates',
							type: '#/definitions/DateCriteria',
							typeKey: '$ref',
						},
						{
							name: 'offsetToAsOf',
							type: '#/definitions/OffsetCriteria',
							typeKey: '$ref',
						},
						{
							name: 'entireWellLife',
							type: 'string',
							typeKey: 'type',
						},
					],
				},
			],
		};

		const template = Handlebars.compile(definitionsTemplate);
		const result = template(pricingEconModelSample);

		expect(result).toMatchSnapshot();
	});

	it('should generate paths', () => {
		const paths = {
			routes: [
				{
					completeRoute: '/v1/projects/{projectId}/econ-models/pricing',
					methods: [
						{
							verb: 'post',
							id: 'post-v1-pricing',
							consumes: 'application/json',
							produces: 'application/json',
							parameters: [
								{
									fromWhere: 'path',
									name: 'projectId',
									type: 'string',
									required: true,
								},
								{
									fromWhere: 'body',
									name: 'pricing',
									schema: '#/definitions/PricingInputList',
								},
							],
							responses: [
								{
									status: 207,
									description: 'Multi-Status',
									schema: '#/definitions/PricingMultiStatusResponse',
								},
							],
						},
					],
				},
			],
		};

		const template = Handlebars.compile(pathsTemplate);
		const result = template(paths);

		expect(result).toMatchSnapshot();
	});
});
