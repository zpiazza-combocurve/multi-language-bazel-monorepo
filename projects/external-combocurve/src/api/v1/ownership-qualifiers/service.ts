import { groupBy, partition, uniq } from 'lodash';
import { Types } from 'mongoose';

import { getMixedIdsQuery, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import config from '@src/config';
import { IOwnershipQualifier } from '@src/models/econ/ownership-qualifiers';
import { IWell } from '@src/models/wells';
import { notNil } from '@src/helpers/typing';
import { RequestModule } from '@src/helpers/request';

import { CursorType, IPageData } from '../pagination';
import { ApiContextV1 } from '../context';
import { IMultiStatusResponse } from '../multi-status';

import {
	ApiOwnershipQualifier,
	ApiOwnershipQualifierKey,
	getFilters,
	getSort,
	toApiOwnershipQualifier,
} from './fields/ownership-qualifier';
import { getCreatedMultiResponse, getOkMultiResponse } from './multi-status';

export const RETRIES = 3;

const flexApi = new RequestModule(`${config.flexServerUrl}/api`);

export class OwnershipQualifierService extends BaseService<ApiContextV1> {
	static attribute = 'OwnershipQualifierService';

	async getOwnershipQualifierCount(filters: ApiQueryFilters): Promise<number> {
		const mappedFilters = getFilters(filters);

		const baseQuery = this.context.models.OwnershipQualifierModel.find(mappedFilters);
		const countQuery = Object.keys(mappedFilters).length
			? baseQuery.countDocuments()
			: baseQuery.estimatedDocumentCount();
		return await countQuery;
	}

	async getOwnershipQualifiers(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		cursor?: string,
	): Promise<IPageData<ApiOwnershipQualifier>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, cursorFilter);

		const ownershipQualifiers = await this.context.models.OwnershipQualifierModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1);

		const result = ownershipQualifiers.slice(0, take).map(toApiOwnershipQualifier);

		return {
			result,
			hasNext: ownershipQualifiers.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiOwnershipQualifierKey] as CursorType)
					: null,
		};
	}

	async getById(id: Types.ObjectId): Promise<ApiOwnershipQualifier | null> {
		const ownershipQualifier = await this.context.models.OwnershipQualifierModel.findOne({ _id: id });
		if (!ownershipQualifier) {
			return null;
		}
		return toApiOwnershipQualifier(ownershipQualifier);
	}

	async getWellsIds(
		ownershipQualifiers: Array<ApiOwnershipQualifier | undefined>,
	): Promise<Array<ApiOwnershipQualifier | undefined>> {
		const validData = ownershipQualifiers.filter(notNil);

		if (!validData.length) {
			return ownershipQualifiers;
		}

		const [idProds, noIdProds] = partition(validData, ({ well }) => notNil(well));

		const wellIds = [...new Set(idProds.map(({ well }) => well ?? Types.ObjectId()))];

		const dataSource = noIdProds[0]?.dataSource;
		const chosenIds = [...new Set(noIdProds.map(({ chosenID }) => chosenID ?? ''))];

		const query = getMixedIdsQuery(wellIds, chosenIds, dataSource);
		const wells = await this.context.models.WellModel.find(query, 'chosenID dataSource');

		const byWellId: Record<string, IWell[] | undefined> = groupBy(wells, ({ _id }: IWell) => _id.toString());
		const byChosenId: Record<string, IWell[] | undefined> = groupBy(wells, ({ chosenID }: IWell) => chosenID);

		const getWellIdentifiers = ({ well, chosenID }: ApiOwnershipQualifier) => ({
			well: (well ? byWellId[well.toString()] : chosenID ? byChosenId[chosenID] : undefined)?.[0]._id,
			chosenID: (well ? byWellId[well.toString()] : chosenID ? byChosenId[chosenID] : undefined)?.[0].chosenID,
			dataSource: (well ? byWellId[well.toString()] : chosenID ? byChosenId[chosenID] : undefined)?.[0]
				.dataSource,
		});

		return ownershipQualifiers.map((ownership) => ownership && { ...ownership, ...getWellIdentifiers(ownership) });
	}

	async findMatches(ownershipQualifiers: IOwnershipQualifier[]): Promise<IOwnershipQualifier[]> {
		if (!ownershipQualifiers.length) {
			return [];
		}

		const dataByWell = groupBy(ownershipQualifiers, ({ well }) => well);
		const query = {
			$or: Object.values(dataByWell).map((data) => ({
				well: data[0].well,
				qualifierKey: {
					$in: uniq(data.map(({ qualifierKey }) => qualifierKey)),
				},
			})),
		};

		return this.context.models.OwnershipQualifierModel.find(query, 'well qualifierKey');
	}

	async getCountByWell(ownershipQualifiers: IOwnershipQualifier[]): Promise<Record<string, number>> {
		if (!ownershipQualifiers.length) {
			return {};
		}

		const wellsCount = await this.context.models.OwnershipQualifierModel.aggregate([
			{
				$match: { well: { $in: ownershipQualifiers.map(({ well }) => well) } },
			},
			{
				$group: {
					_id: '$well',
					count: { $sum: 1 },
				},
			},
		]);

		return wellsCount.reduce((acc, { _id, count }) => {
			acc[_id] = count;
			return acc;
		}, {});
	}

	async getExistingQualifierKeys(): Promise<Array<string>> {
		const result = await this.context.models.OwnershipQualifierModel.find({}).select('qualifierKey');
		return result.map(({ qualifierKey }) => qualifierKey);
	}

	async addOptions(ownershipQualifiers: IOwnershipQualifier[]): Promise<void> {
		if (!ownershipQualifiers.length) {
			return;
		}
		flexApi.setHeaders({ ...this.context.headers });
		const options = await flexApi.postApi(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: 'ownership_reversion',
				econ_functions: ownershipQualifiers.map(({ ownership }) => ownership.econ_function),
			},
			RETRIES,
		);

		ownershipQualifiers.forEach(
			(ownershipQualifier, index) => (ownershipQualifier.ownership.options = options ? options[index] : {}),
		);
	}

	async create(ownershipQualifiers: Array<IOwnershipQualifier | undefined>): Promise<IMultiStatusResponse> {
		const validOwnershipQualifiers = ownershipQualifiers.filter(notNil);
		await this.addOptions(validOwnershipQualifiers);
		let created: IOwnershipQualifier[] = [];
		if (validOwnershipQualifiers.length > 0) {
			created = await this.context.models.OwnershipQualifierModel.insertMany(validOwnershipQualifiers);
		}
		return getCreatedMultiResponse(ownershipQualifiers, created);
	}

	async upsert(ownershipQualifiers: Array<IOwnershipQualifier | undefined>): Promise<IMultiStatusResponse> {
		const validOwnershipQualifiers = ownershipQualifiers.filter(notNil);
		await this.addOptions(validOwnershipQualifiers);

		const replaceOperations = validOwnershipQualifiers.map((ownershipQualifier) => ({
			replaceOne: {
				filter: { well: ownershipQualifier.well, qualifierKey: ownershipQualifier.qualifierKey },
				replacement: ownershipQualifier,
				upsert: true,
			},
		}));
		if (replaceOperations.length > 0) {
			await this.context.models.OwnershipQualifierModel.bulkWrite(replaceOperations);
		}

		const upserted = await this.findMatches(validOwnershipQualifiers);
		return getOkMultiResponse(ownershipQualifiers, upserted);
	}
}
