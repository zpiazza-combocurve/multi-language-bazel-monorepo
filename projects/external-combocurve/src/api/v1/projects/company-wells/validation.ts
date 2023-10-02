import { groupBy, isString, keyBy } from 'lodash';

import {
	DifferentDataSourceError,
	FieldNameError,
	isObject,
	RequestStructureError,
	RequiredFieldError,
} from '@src/helpers/validation';
import { isNil, notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';
import { WellService } from '@src/services/well-service';

import {
	DuplicateIdentifierError,
	KeyFieldModificationError,
	ReadOnlyFieldError,
	WellExistsError,
	WellNotFoundError,
} from '../../wells/validation';
import { ProjectResolved } from '../wells/fields';

import {
	ApiProjectCompanyWell,
	ApiProjectCompanyWellKey,
	getProjectCompanyWellField,
	getRequiredFields,
	IProjectCompanyWell,
} from './fields';

export const ERROR_ON_EXTRANEOUS_FIELDS = true;

const errorLocation = (field: string, index?: number) => (index !== undefined ? `[${index}].${field}` : field);

export const parseApiProjectCompanyWell = (value: Record<string, unknown>, index?: number): ApiProjectCompanyWell => {
	const well: Record<string, ApiProjectCompanyWell[ApiProjectCompanyWellKey]> = {};
	const chosenId = isString(value['chosenID']) ? value['chosenID'] : undefined;

	const errorAggregator = new ValidationErrorAggregator();
	errorAggregator.setChosenId(chosenId);

	Object.entries(value)
		.filter(([, value]) => notNil(value))
		.forEach(([fieldName, value]) =>
			errorAggregator.catch(() => {
				const wellField = getProjectCompanyWellField(fieldName);

				if (!wellField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${fieldName}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = wellField;

				if (!write) {
					throw new ReadOnlyFieldError(
						`Cannot write to read-only field \`${fieldName}\`. Please remove it from the input data`,
						`[${index}]`,
					);
				}

				let parsedValue;
				try {
					parsedValue = parse?.(value) ?? (value as ApiProjectCompanyWell[ApiProjectCompanyWellKey]);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} catch (e: any) {
					e.details.location = errorLocation(fieldName, index);
					throw e;
				}

				well[fieldName] = parsedValue;
			}),
		);

	const requiredFields = getRequiredFields(well);

	requiredFields
		.filter((field) => isNil(value[field]))
		.forEach((field) =>
			errorAggregator.catch(() => {
				throw new RequiredFieldError(`Missing required field: \`${field}\``, `[${index}]`);
			}),
		);

	errorAggregator.throwAll();

	return well;
};

export const parsePostProjectCompanyWells = async (
	data: unknown[],
	service: WellService,
	errorAggregator: ValidationErrorAggregator,
	project: ProjectResolved,
): Promise<Array<IProjectCompanyWell | undefined>> => {
	let wells = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid well data structure', `[${index}]`);
			}

			return parseApiProjectCompanyWell(element, index);
		}),
	);

	const projectWellIds = keyBy(project.wells, (id) => id.toString());

	const firstValid = wells.find(notNil);
	wells = wells.map((w, index) =>
		errorAggregator.catch(() => {
			if (w && w.dataSource !== firstValid?.dataSource) {
				throw new DifferentDataSourceError(
					`Different data source found: \`${w.dataSource}\`. ` +
						'All wells in a request must be from the same data source.',
					`[${index}]`,
					w.chosenID,
				);
			}
			return w;
		}),
	);

	const matchingWells = await service.getMatchingWellsMixed(wells.filter(notNil), {
		projection: ['chosenID', 'dataSource'],
	});

	// check for duplicate identifiers
	const filteredIndexes = [...wells.keys()].filter((index) => wells[index] !== undefined);
	const idIndexMap = groupBy(filteredIndexes, (index: number) =>
		matchingWells.findIndex(({ _id, chosenID: matchChosenId }) =>
			wells[index]?.id
				? _id.toString() === wells[index]?.id?.toString()
				: wells[index]?.chosenID === matchChosenId,
		),
	);
	const existingDuplicates = Object.entries(idIndexMap)
		.filter(([, indexes]) => indexes && indexes.length > 1)
		.filter(([matchingIndex]) => matchingIndex !== '-1')
		.map(([matchingIndex, indexes]) => {
			const { _id, chosenID, dataSource } = matchingWells[+matchingIndex];
			return { id: _id.toString(), chosenID, dataSource, indexes };
		});
	const nonExistingChosenIdDuplicates = Object.entries(
		groupBy(
			(idIndexMap['-1'] || []).filter((index: number) => wells[index]?.chosenID),
			(index: number) => wells[index]?.chosenID,
		),
	)
		.filter(([, indexes]) => indexes && indexes.length > 1)
		.map(([chosenID, indexes]) => ({
			id: undefined,
			chosenID,
			dataSource: wells[indexes[0]]?.dataSource,
			indexes,
		}));
	const nonExistingIdDuplicates = Object.entries(
		groupBy(
			(idIndexMap['-1'] || []).filter((index: number) => wells[index]?.id),
			(index: number) => wells[index]?.id,
		),
	)
		.filter(([id, indexes]) => id && indexes && indexes.length > 1)
		.map(([id, indexes]) => ({ id, chosenID: undefined, dataSource: wells[indexes[0]]?.dataSource, indexes }));
	const duplicates = [...existingDuplicates, ...nonExistingChosenIdDuplicates, ...nonExistingIdDuplicates];
	duplicates.forEach(({ id, chosenID, dataSource, indexes }) =>
		errorAggregator.catch(() => {
			indexes.forEach((i) => (wells[i] = undefined));

			let message = `Duplicate identifier value: dataSource: \`${dataSource}\``;
			if (id) {
				message = `${message}, id: \`${id}\``;
			}
			if (chosenID) {
				message = `${message}, chosenID: \`${chosenID}\``;
			}
			throw new DuplicateIdentifierError(message, indexes.map((i) => `[${i}]`).join(', '), chosenID);
		}),
	);

	const nonExistingDuplicates = [...nonExistingChosenIdDuplicates, ...nonExistingIdDuplicates];
	nonExistingDuplicates.forEach(({ id, chosenID, dataSource, indexes }) => {
		errorAggregator.catch(() => {
			throw new WellNotFoundError(
				id
					? `No well was found with id \`${id}\` in company scope`
					: `No well was found with data source \`${dataSource}\` and chosen id \`${chosenID}\` in company scope`,
				indexes.map((i) => `[${i}]`).join(', '),
				chosenID,
			);
		});
	});

	return wells.map<IProjectCompanyWell | undefined>((w, index) =>
		errorAggregator.catch(() => {
			if (w === undefined) {
				return undefined;
			}
			const { id, chosenID, dataSource } = w;

			const matching = matchingWells.find(({ _id, chosenID: matchChosenId }) =>
				id ? _id.toString() === id.toString() : chosenID === matchChosenId,
			);

			if (!matching) {
				throw new WellNotFoundError(
					id
						? `No well was found with id \`${id}\` in company scope`
						: `No well was found with data source \`${dataSource}\` and chosen id \`${chosenID}\` in company scope`,
					`[${index}]`,
					chosenID,
				);
			}

			if (id && matching._id.toString() !== id.toString()) {
				throw new KeyFieldModificationError(
					`Invalid identifier value: id: \`${id}\`. Cannot change the identifier of an existing well`,
					`[${index}]`,
					chosenID,
				);
			}

			if (chosenID && matching.chosenID !== chosenID) {
				throw new KeyFieldModificationError(
					`Invalid identifier value: chosenID: \`${chosenID}\`. Cannot change the identifier of an existing well`,
					`[${index}]`,
					chosenID,
				);
			}

			if (projectWellIds[matching._id.toString()]) {
				throw new WellExistsError(
					`Well with identifier id: \`${matching._id}\`, dataSource: \`${matching.dataSource}\` and chosenID: \`${matching.chosenID}\` already exists in project \`${project._id}:${project.name}\``,
					`[${index}]`,
					matching.chosenID,
				);
			}

			return matching;
		}),
	);
};
