import { ProjectCustomHeader } from '@/helpers/project-custom-headers';

export interface ProjectCustomHeaderModel {
	key: string;
	originalKey: string;
	type: string;
	name: string;
	prior: boolean;
	projectName: string;
	projectId: string;
}

export interface MergedProjectCustomHeaderModel {
	key: string;
	name: string;
	color: string;
	headers: ProjectCustomHeaderModel[];
}

export interface MergeProjectsModel {
	name: string;
	duplicateNamePart: string;
	duplicateNameModifier: string;
	wellIdentifier: string;
	projects: string[];
	customHeaders: MergedProjectCustomHeaderModel[];
}

export interface ProjectToMergeModel {
	project: Assign<Inpt.Project, { createdBy: Inpt.User }> | Record<string, never>;
	customHeaders: ProjectCustomHeader[];
}

export interface CollisionModuleInfoModel {
	name: string;
	category?: string;
	createdBy?: string;
	createdAt?: Date;
}

export interface ProjectCollisionModuleInfoModel {
	[key: Inpt.ObjectId<'project'>]: CollisionModuleInfoModel;
}

interface CollisionModuleNames {
	[key: Inpt.ObjectId<'project'>]: string[];
}

export interface CollisionDetailsModel extends CollisionModuleNames {
	collisions: ProjectCollisionModuleInfoModel[];
}

export interface CollisionsModel {
	assumptions: CollisionDetailsModel;
	forecasts: CollisionDetailsModel;
	typeCurves: CollisionDetailsModel;
	scenarios: CollisionDetailsModel;
	schedules: CollisionDetailsModel;
	lookupTables: CollisionDetailsModel;
	filters: CollisionDetailsModel;
	shapefiles: CollisionDetailsModel;
}

export interface ModulesExpandStateModel {
	assumptions: boolean;
	forecasts: boolean;
	typeCurves: boolean;
	scenarios: boolean;
	schedules: boolean;
	lookupTables: boolean;
	filters: boolean;
	shapefiles: boolean;
	customHeaders: boolean;
}
