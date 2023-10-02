import { FilterQuery, Types } from 'mongoose';

import { IProjection, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IProject } from '@src/models/projects';
import { notNil } from '@src/helpers/typing';
import { REST_API_USER_ID } from '@src/constants/user';

import { CursorType, IPageData } from '../pagination';
import { ApiContextV1 } from '../context';
import { IMultiStatusResponse } from '../multi-status';

import { ApiProject, ApiProjectKey, getFilters, getSort, toApiProject } from './fields';
import { getCreatedMultiResponse } from './multi-status';

export class ProjectBaseService extends BaseService<ApiContextV1> {
	static attribute = 'projectBaseService';

	async getProjects(skip: number, take: number, sort: ISort, filters: FilterQuery<IProject>): Promise<IProject[]> {
		return await this.context.models.ProjectModel.find(filters)
			.sort(sort)
			.skip(skip)
			.limit(take + 1);
	}

	async getProjectsCount(filters: FilterQuery<IProject>): Promise<number> {
		const baseQuery = this.context.models.ProjectModel.find(filters);
		const countQuery = Object.keys(filters).length
			? baseQuery.countDocuments()
			: baseQuery.estimatedDocumentCount();
		return await countQuery;
	}

	async getById(id: Types.ObjectId, projection: IProjection<IProject> = {}): Promise<IProject | null> {
		const project = await this.context.models.ProjectModel.findOne({ _id: id }, projection);
		if (!project) {
			return null;
		}
		return project;
	}

	async existsById(id: Types.ObjectId): Promise<boolean> {
		return await this.context.models.ProjectModel.exists({ _id: id });
	}
}

export class ProjectService extends BaseService<ApiContextV1> {
	static attribute = 'projectService';

	async getProjects(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		cursor?: string,
	): Promise<IPageData<ApiProject>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, cursorFilter);
		const projects = await this.context.projectBaseService.getProjects(skip, take, sortQuery || {}, mappedFilters);

		const result = projects.slice(0, take).map(toApiProject);

		return {
			result,
			hasNext: projects.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiProjectKey] as CursorType)
					: null,
		};
	}

	async getProjectsCount(filters: ApiQueryFilters): Promise<number> {
		const mappedFilters = getFilters(filters);

		return await this.context.projectBaseService.getProjectsCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, projection: IProjection<IProject> = {}): Promise<ApiProject | null> {
		const project = await this.context.projectBaseService.getById(id, projection);
		if (!project) {
			return null;
		}

		return toApiProject(project);
	}

	async getProjectNameCollisions(names: string[]): Promise<Array<string>> {
		const result = await this.context.models.ProjectModel.find({ name: { $in: names } }).select('name');
		return result.map(({ name }) => name);
	}

	async create(projects: Array<IProject | undefined>): Promise<IMultiStatusResponse> {
		const validProjects = projects.filter(notNil);
		let created: IProject[] = [];
		if (validProjects.length > 0) {
			created = await this.context.models.ProjectModel.insertMany(validProjects);
		}

		const accessPolicies = created.map(({ _id }) => ({
			memberType: 'users',
			memberId: Types.ObjectId(REST_API_USER_ID),
			resourceType: 'project',
			resourceId: _id,
			roles: ['project.project.admin'],
		}));
		await this.context.models.AccessPolicyModel.insertMany(accessPolicies);

		return getCreatedMultiResponse(projects, created);
	}
}
