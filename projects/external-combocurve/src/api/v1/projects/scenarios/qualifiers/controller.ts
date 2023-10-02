import { Controller } from '@src/core/controllers/base';
import { specs } from '@src/core/metadata/metadata';

import { QualifiersDelete } from './requests/delete/delete';
import { QualifiersRead } from './requests/read/read';
import { QualifiersUpsert } from './requests/upsert/upsert';

@specs.genController({ baseRoute: '/v1/projects/:projectId/scenarios/:scenarioId' })
class QualifiersController extends Controller {
	constructor() {
		super();

		this.registerGetOne('/', QualifiersRead, { description: 'Get Scenario Qualifiers' });
		this.registerInsertMany('/', QualifiersUpsert, { description: 'Insert Many Scenario Qualifiers' });
		this.registerUpdateMany('/', QualifiersUpsert, { description: 'Update Many Scenario Qualifiers' });
		this.registerDelete('/', QualifiersDelete, { description: 'Delete Many Scenario Qualifiers' });
	}
}

const controller = new QualifiersController();
export default controller;
