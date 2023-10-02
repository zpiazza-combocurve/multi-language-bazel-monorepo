import { Types } from 'mongoose';

import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { getDeleteFilters } from '@src/api/v1/wells/fields';
import { WellService } from '@src/services/well-service';

import { ProjectResolved } from './fields';

export class ProjectWellService extends WellService {
	attribute = 'projectWellService';

	async deleteProjectWells(filters: ApiQueryFilters, project: ProjectResolved): Promise<number> {
		const mappedFilters = getDeleteFilters(filters, {
			_id: { $in: project?.wells || [] },
			project: project._id,
		});
		const ids = (await this.context.models.WellModel.find(mappedFilters, { _id: 1 }).lean()).map(({ _id }) =>
			_id.toString(),
		);

		if (ids.length === 0) {
			return 0;
		}

		const projectUpdated = await callCloudFunction<{ wells: [] }>({
			fullUrl: `${config.wellServiceUrl}/api/project-wells/delete`,
			body: { ids, project: project._id.toString() },
			headers: this.context.headers,
		});

		return project.wells.length - (projectUpdated?.wells?.length || 0);
	}

	async deleteProjectWellById(id: Types.ObjectId, project: ProjectResolved): Promise<number> {
		const wellId = id.toString();

		if (
			(project?.wells || []).every((projectWellId) => projectWellId.toString() != wellId) ||
			!(await this.context.models.WellModel.exists({
				_id: id,
				project: project._id,
			}))
		) {
			return 0;
		}

		const projectUpdated = await callCloudFunction<{ wells: [string] }>({
			fullUrl: `${config.wellServiceUrl}/api/project-wells/delete`,
			body: { ids: [wellId], project: project._id.toString() },
			headers: this.context.headers,
		});

		return (projectUpdated?.wells || []).includes(wellId) ? 0 : 1;
	}
}
