import { Controller } from '@src/core/controllers/base';

import { EconModelAssignmentDelete } from './requests/delete/delete';
import { EconModelAssignmentUpsert } from './requests/upsert/upsert';
import { EconModelsAssignmentsCount } from './requests/count';
import { EconModelsAssignmentsRead } from './requests/read/read';

class EconModelsAssignmentsController extends Controller {
	constructor() {
		super();

		this.registerNoPayloadRequest('/count', 'get', EconModelsAssignmentsCount, {
			description: 'Get count of assignments for a given econ model',
		});

		this.registerNoPayloadRequest('/', 'head', EconModelsAssignmentsCount, {
			description: 'Get count of assignments for a given econ model',
		});

		this.registerNoPayloadRequest('/', 'get', EconModelsAssignmentsRead, {
			description: 'Get paginated assignments for a given econ model',
		});

		this.registerInsertMany('/', EconModelAssignmentUpsert, {
			description: 'Assign multiple wells to a given econ model',
		});

		this.registerUpdateMany('/', EconModelAssignmentUpsert, {
			description: 'Assign multiple wells to a given econ model',
		});

		this.registerDelete('/', EconModelAssignmentDelete, {
			description: 'Remove assignments from multiple wells to a given econ model',
		});
	}
}

const econModelsAssignmentsController = new EconModelsAssignmentsController();
export default econModelsAssignmentsController;
