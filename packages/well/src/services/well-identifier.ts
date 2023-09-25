import { BaseContext, BaseService } from '@combocurve/shared';
import _ from 'lodash';
import { FilterQuery, Model, Types } from 'mongoose';

export const DATA_SOURCES = ['di', 'ihs', 'phdwin', 'aries', 'internal', 'other'] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

export const ID_FIELDS = ['inptID', 'api10', 'api12', 'api14', 'aries_id', 'phdwin_id'] as const;
export type IdField = (typeof ID_FIELDS)[number];

export const ID_FIELDS_LABELS: Record<IdField, string> = {
	inptID: 'Inpt ID',
	api10: 'API 10',
	api12: 'API 12',
	api14: 'API 14',
	aries_id: 'ARIES ID',
	phdwin_id: 'PhdWin ID',
};

export interface PartialWell {
	_id: Types.ObjectId;
	project?: Types.ObjectId | null;
	dataSource?: DataSource;
	chosenID?: string;
	inptID?: string;
	api10?: string;
	api12?: string;
	api14?: string;
	aries_id?: string;
	phdwin_id?: string;
}

export interface WellIdentifiersUpdate {
	project?: null | string;
	dataSource?: DataSource;
	chosenID?: IdField;
}

export type OperationFields = Record<
	keyof ChangeWellScopeToCompanyOperation | keyof ChangeDataSourceOperation | keyof ChangeChosenIdOperation,
	unknown
>;

type OperationEntity = {
	[Property in keyof OperationFields]?: unknown;
};

export type Operations = ChangeDataSourceOperation | ChangeWellScopeToCompanyOperation | ChangeChosenIdOperation;

export type Operation = {
	operation: Operations;
	type: 'scopeToCompany' | 'dataSource' | 'chosenId';
};

export type ChangeWellScopeToCompanyOperation = {
	wellId: string[];
	project: null | undefined;
};

export type ChangeDataSourceOperation = {
	wellId: string[];
	dataSource: DataSource;
};

export type ChangeChosenIdOperation = {
	wellId: string[];
	newChosenID: IdField;
};

export type WellIdentifierOperations = {
	changeWellScopeToCompanyOperations?: ChangeWellScopeToCompanyOperation;
	changeDataSourceOperations: ChangeDataSourceOperation[];
	changeChosenIdOperations: ChangeChosenIdOperation[];
};

export type ValidationResult = {
	collisions: Record<string, string[]>;
	missingIdentifier?: string[];
};

export type ValidationResultMetadata = {
	update: Record<string, string | null>;
	operationType: 'scopeToCompany' | 'dataSource' | 'chosenId';
	result: ValidationResult | ValidationResult[];
	path: string;
	createdBy: Types.ObjectId;
	project: string | null;
	wells: Types.ObjectId[];
};

class WellIdentifierService extends BaseService<BaseContext> {
	wellModel: Model<PartialWell>;

	constructor(context: BaseContext) {
		super(context);
		this.wellModel = this.context.models.WellModel as Model<PartialWell>;
	}

	async createValidationResult(operationTypeMetaData: ValidationResultMetadata) {
		return await this.context.models.WellIdentifiersValidationResultModel.create(operationTypeMetaData);
	}

	async changeScopeToCompany(wells: Types.ObjectId[]) {
		this.changeWellsScopeToCompany(wells);
		await this.context.models.MonthlyProductionModel.updateMany(
			{ well: { $in: wells } },
			{ $set: { project: null } }
		);
		await this.context.models.DailyProductionModel.updateMany(
			{ well: { $in: wells } },
			{ $set: { project: null } }
		);

		return wells.length;
	}

	async changeWellsScopeToCompany(wells: Types.ObjectId[]) {
		await this.wellModel.updateMany({ _id: { $in: wells } }, { $set: { project: null } });
	}

	async changeDataSource(wells: Types.ObjectId[], dataSource: DataSource) {
		await this.wellModel.updateMany({ _id: { $in: wells } }, { $set: { dataSource } });
		await this.context.models.OwnershipQualifierModel.updateMany(
			{ well: { $in: wells } },
			{ $set: { dataSource } }
		);

		return wells.length;
	}

	async changeChosenId(wells: Types.ObjectId[], idField: IdField) {
		const batchWells = await this.wellModel.find({ _id: { $in: wells } }, `_id ${idField}`).lean<PartialWell[]>();

		const wellUpdates = batchWells.map(({ _id, [idField]: newChosenId }) => ({
			updateOne: {
				filter: { _id },
				update: { $set: { chosenID: newChosenId, chosenKeyID: ID_FIELDS_LABELS[idField] } },
			},
		}));
		await this.wellModel.collection.bulkWrite(wellUpdates);

		const ownershipQualifierUpdates = batchWells.map(({ _id, [idField]: newChosenId }) => ({
			updateOne: { filter: { well: _id }, update: { $set: { chosenID: newChosenId } } },
		}));
		await this.context.models.OwnershipQualifierModel.collection.bulkWrite(ownershipQualifierUpdates);

		return wells.length;
	}

	async validateOperations(
		operations: WellIdentifierOperations
	): Promise<[(ValidationResult | null)[], (ValidationResult | null)[], ValidationResult | null]> {
		const chosenIdValidationResults = await Promise.all(
			operations.changeChosenIdOperations.map((op) => this.checkCollisionsAndMissingIdentifier(op))
		);

		const dataSourceValidationResults = await Promise.all(
			operations.changeDataSourceOperations.map((op) => this.checkOperationCollisions(op))
		);

		return [
			chosenIdValidationResults,
			dataSourceValidationResults,
			await this.checkOperationCollisions(operations.changeWellScopeToCompanyOperations),
		];
	}

	getOwnWellsProjection = (
		project: string | null | undefined,
		dataSource: DataSource | undefined,
		chosenID: IdField | undefined
	) => {
		const projectProjection = this.getProjectProjection(project);
		const dataSourceProjection = this.getDataSourceProjection(dataSource);
		const chosenIdOwnWellsProjection = this.getChosenIdOwnWellsProjection(chosenID);

		return {
			_id: 1 as const,
			...projectProjection,
			...dataSourceProjection,
			...chosenIdOwnWellsProjection,
		};
	};

	getOtherWellsProjection = (project: string | null | undefined, dataSource: DataSource) => {
		const projectProjection = this.getProjectProjection(project);
		const dataSourceProjection = this.getDataSourceProjection(dataSource);
		const chosenIdOtherWellsProjection = { chosenID: 1 as const };

		return {
			_id: 1 as const,
			...projectProjection,
			...dataSourceProjection,
			...chosenIdOtherWellsProjection,
		};
	};

	checkCollisions = async (
		wells: Types.ObjectId[],
		project: string | null | undefined,
		dataSource: DataSource | undefined,
		chosenID: IdField | undefined,
		ownWellsProjection,
		otherWellsProjection,
		arrayUnion
	) => {
		const batchWells = await this.wellModel.find({ _id: { $in: wells } }, ownWellsProjection).lean();

		const externalQuery = {
			...this._getProjectCollisionQuery(project, batchWells),
			...this._getDataSourceCollisionQuery(dataSource, batchWells),
			...this._getChosenIdCollisionQuery(chosenID, batchWells),
		};
		const externalCollisions = await this._getCollisions(
			batchWells,
			externalQuery,
			otherWellsProjection,
			chosenID,
			'chosenID'
		);

		const internalQuery = {
			_id: { $in: wells },
			...this._getProjectCollisionQuery(project, batchWells, { internal: true }),
			...this._getDataSourceCollisionQuery(dataSource, batchWells, { internal: true }),
			...this._getChosenIdCollisionQuery(chosenID, batchWells, { internal: true }),
		};
		const internalCollisions = await this._getCollisions(
			batchWells,
			internalQuery,
			ownWellsProjection,
			chosenID,
			chosenID
		);

		const results = _.mergeWith(externalCollisions, internalCollisions, arrayUnion);

		return results;
	};

	private getProjectProjection = (project: string | null | undefined) =>
		project === undefined ? { project: 1 as const } : {};
	private getDataSourceProjection = (dataSource: DataSource | undefined) =>
		dataSource === undefined ? { dataSource: 1 as const } : {};
	private getChosenIdOwnWellsProjection = (chosenID: IdField | undefined) =>
		chosenID === undefined ? { chosenID: 1 as const } : { [chosenID]: 1 as const };

	private async checkCollisionsAndMissingIdentifier(operation: Operations): Promise<ValidationResult> {
		const data = operation as OperationFields;
		const wells = data.wellId as Types.ObjectId[];

		if (!wells.length) {
			return { collisions: {} };
		}
		const missingIdentifier = (await this.getWellsWithMissingIdentifier(wells, data.newChosenID as IdField)).map(
			(wId) => wId.toString()
		);
		const collisions = await this.checkOperationCollisions(operation);
		return {
			missingIdentifier,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			...collisions!,
		};
	}

	private async checkOperationCollisions(operation: OperationEntity | undefined): Promise<ValidationResult | null> {
		if (operation === undefined) {
			return null;
		}

		const arrayUnion = <T>(a?: T[], b?: T[]) => [...new Set([...(a ?? []), ...(b ?? [])])];
		const ownWellsProjection = this.getOwnWellsProjection(
			operation.project as null,
			operation.dataSource as DataSource,
			operation.newChosenID as IdField
		);
		const otherWellsProjection = this.getOtherWellsProjection(
			operation.project as null,
			operation.dataSource as DataSource
		);
		const collisions = await this.checkCollisions(
			operation.wellId as Types.ObjectId[],
			operation.project as null | string,
			operation.dataSource as DataSource,
			operation.newChosenID as IdField,
			ownWellsProjection,
			otherWellsProjection,
			arrayUnion
		);
		return { collisions };
	}

	async getWellsWithMissingIdentifier(wells: Types.ObjectId[], idField: IdField) {
		const missingChosenIdWells = await this.wellModel.find({ _id: { $in: wells }, [idField]: null }, '_id').lean();
		return missingChosenIdWells.map(({ _id }) => _id);
	}

	private _getProjectCollisionQuery(
		project: string | null | undefined,
		wells: PartialWell[],
		{ internal = false }: { internal: boolean } = { internal: false }
	) {
		if (project !== undefined) {
			return internal ? {} : { project: project ? new Types.ObjectId(project) : null };
		}
		const allProjects = _.uniqWith(
			wells.map(({ project }) => project),
			(p1, p2) => (p1 && p2 ? p1.equals(p2) : p1 === p2)
		);
		return { project: { $in: allProjects } };
	}

	private _getDataSourceCollisionQuery(
		dataSource: DataSource | undefined,
		wells: PartialWell[],
		{ internal = false }: { internal: boolean } = { internal: false }
	) {
		if (dataSource !== undefined) {
			return internal ? {} : { dataSource };
		}
		const allDataSources = _.uniq(wells.map(({ dataSource }) => dataSource));
		return { dataSource: { $in: allDataSources } };
	}

	private _getChosenIdCollisionQuery(
		chosenId: IdField | undefined,
		wells: PartialWell[],
		{ internal = false }: { internal: boolean } = { internal: false }
	) {
		if (chosenId !== undefined) {
			const allChosenIdFieldValuess = _.uniq(
				wells.map(({ [chosenId]: chosenIdFieldValue }) => chosenIdFieldValue)
			);
			return internal
				? { [chosenId]: { $in: allChosenIdFieldValuess } }
				: { chosenID: { $in: allChosenIdFieldValuess } };
		}
		const allChosenIds = _.uniq(wells.map(({ chosenID }) => chosenID));
		return { chosenID: { $in: allChosenIds } };
	}

	private async _getCollisions(
		wells: PartialWell[],
		query: FilterQuery<PartialWell>,
		projection: { project?: 1; dataSource?: 1 },
		ownChosenIdField: IdField | 'chosenID' = 'chosenID',
		otherChosenIdField: IdField | 'chosenID' = 'chosenID'
	) {
		const potentialCollisions = await this.wellModel.find(query, projection).lean();

		return Object.fromEntries(
			wells
				.map(
					({ _id, project, dataSource, [ownChosenIdField]: chosenID }) =>
						[
							_id,
							potentialCollisions
								.filter(
									({
										_id: otherId,
										project: otherProject,
										dataSource: otherDataSource,
										[otherChosenIdField]: otherChosenId,
									}) =>
										!_id.equals(otherId) &&
										(!projection.project ||
											(otherProject === null
												? project === null
												: project?.equals(otherProject ?? ''))) &&
										(!projection.dataSource || dataSource === otherDataSource) &&
										chosenID !== null &&
										chosenID !== undefined &&
										chosenID === otherChosenId
								)
								.map(({ _id }) => _id.toString()),
						] as const
				)
				.filter(([, collisions]) => collisions.length > 0)
		);
	}
}

export { WellIdentifierService };
