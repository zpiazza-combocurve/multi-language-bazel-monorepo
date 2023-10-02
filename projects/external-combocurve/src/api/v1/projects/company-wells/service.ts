import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { notNil } from '@src/helpers/typing';
import { WellService } from '@src/services/well-service';

import { IMultiStatusResponse } from '../../multi-status';

import { getDeleteFilters, IProjectCompanyWell, ProjectResolved } from './fields';
import { getCreatedMultiResponse } from './multi-status';

export class ProjectCompanyWellService extends WellService {
	attribute = 'projectCompanyWellService';

	addCompanyWellsToProject = async (
		wells: Array<IProjectCompanyWell | undefined>,
		projectId: string,
	): Promise<IMultiStatusResponse> => {
		const validWells = wells.filter(notNil);
		const ids = validWells.map(({ _id }) => _id.toString());

		if (ids.length === 0) {
			return { results: [] };
		}

		const project = await callCloudFunction<{ wells: [] }>({
			fullUrl: `${config.wellServiceUrl}/api/project-company-wells/add`,
			body: { ids, project: projectId },
			headers: this.context.headers,
		});

		return getCreatedMultiResponse(wells, project?.wells || []);
	};

	deleteCompanyWellsFromProject = async (filters: ApiQueryFilters, project: ProjectResolved): Promise<number> => {
		const mappedFilters = getDeleteFilters(filters);
		const ids = (await this.context.models.WellModel.find(mappedFilters, { _id: 1 })).map(({ _id }) =>
			_id.toString(),
		);

		if (ids.length === 0) {
			return 0;
		}

		const projectUpdated = await callCloudFunction<{ wells: [] }>({
			fullUrl: `${config.wellServiceUrl}/api/project-company-wells/delete`,
			body: { ids, project: project._id.toString() },
			headers: this.context.headers,
		});

		return project.wells.length - (projectUpdated?.wells.length || 0);
	};
}
