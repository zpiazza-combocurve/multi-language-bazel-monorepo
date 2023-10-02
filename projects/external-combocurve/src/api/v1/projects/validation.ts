import { groupBy } from 'lodash';

import { FieldNameError, RequiredFieldError, ValidationError } from '@src/helpers/validation';
import { isNil, notNil } from '@src/helpers/typing';
import { IProject } from '@src/models/projects';

import { ValidationErrorAggregator } from '../multi-error';

import { ApiProject, ApiProjectKey, getApiProjectField, requiredFields } from './fields';

export const ERROR_ON_EXTRANEOUS_FIELDS = true;

export class ProjectNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, ProjectNotFoundError.name, statusCode);
	}
}

export class DuplicateProjectError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location, DuplicateProjectError.name);
	}
}

export class ProjectCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location, ProjectCollisionError.name);
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiProjects = (data: Record<string, unknown>, index?: number): ApiProject => {
	const project: Record<string, ApiProject[ApiProjectKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const projectField = getApiProjectField(field);

				if (!projectField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = projectField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiProject[ApiProjectKey]);

				if (write) {
					project[field] = parsedValue;
				}
			}),
		);

	requiredFields
		.filter((field) => isNil(data[field]))
		.forEach((field) =>
			errorAggregator.catch(() => {
				throw new RequiredFieldError(`Missing required field: \`${field}\``, `[${index}]`);
			}),
		);

	errorAggregator.throwAll();

	return project;
};

interface IIdIndexMapEntry {
	name: string;
	indexInList: number;
}

export const checkDuplicates = (
	projects: Array<IProject | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<IProject | undefined> => {
	const filtered = projects
		.map((project, indexInList) => ({
			name: project?.name,
			indexInList,
		}))
		.filter(({ name }) => name);

	const idIndexMap: Record<string, IIdIndexMapEntry[] | undefined> = groupBy(
		filtered,
		({ name }: IIdIndexMapEntry) => name,
	) as Record<string, IIdIndexMapEntry[] | undefined>;

	const actualErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validProjects = [...projects];

	Object.values(idIndexMap).forEach((occurrences) =>
		actualErrorAggregator.catch(() => {
			if (occurrences && occurrences.length > 1) {
				const { name } = occurrences[0];

				occurrences.forEach(({ indexInList }) => (validProjects[indexInList] = undefined));

				throw new DuplicateProjectError(
					`More than one project data supplied with name \`${name}\``,
					occurrences.map(({ indexInList }) => `[${indexInList}]`).join(', '),
				);
			}
		}),
	);

	if (!errorAggregator) {
		actualErrorAggregator.throwAll();
	}

	return validProjects;
};

export class ProjectWellLimitError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 400) {
		super(message, location, ProjectWellLimitError.name, statusCode);
	}
}

export const PROJECT_WELLS_LIMIT = 50000;

export const validateProjectWellLimit = (wellsInProject: unknown[], newWells: unknown[]): void => {
	if (wellsInProject.length + newWells.length > PROJECT_WELLS_LIMIT) {
		throw new ProjectWellLimitError(`Project wells limit exceeded, max: ${PROJECT_WELLS_LIMIT}`);
	}
};
