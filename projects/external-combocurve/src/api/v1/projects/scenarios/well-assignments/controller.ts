import { Controller } from '@src/core/controllers/base';

import { ScenarioWellsDelete } from './requests/delete/delete';
import { ScenarioWellsRead } from './requests/read/read';
import { ScenarioWellsUpsert } from './requests/upsert/upsert';

class ScenarioWellAssignmentsController extends Controller {
	constructor() {
		super();

		this.registerGetOne('/', ScenarioWellsRead, { description: 'Get all scenario wells' });
		this.registerInsertMany('/', ScenarioWellsUpsert, { description: 'Asingn many wells into scenario' });
		this.registerUpdateMany('/', ScenarioWellsUpsert, { description: 'Asingn many wells into scenario' });
		this.registerDelete('/', ScenarioWellsDelete, { description: 'Delete Many Scenario Qualifiers' });
	}
}

const controller = new ScenarioWellAssignmentsController();
export default controller;
