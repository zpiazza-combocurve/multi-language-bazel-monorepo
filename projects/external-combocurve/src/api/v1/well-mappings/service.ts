import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { ISort } from '@src/helpers/mongo-queries';
import { WellService } from '@src/services/well-service';

import { CursorType, IPageData } from '../pagination';

import { ApiWellMapping, ApiWellMappingKey, getFilters, getSort, projection, toApiWellMapping } from './fields';

export class WellMappingService extends WellService {
	attribute = 'wellMappingService';

	async getWellMappings({
		take,
		sort = { id: 1 },
		filters = {},
		cursor,
	}: {
		take: number;
		sort?: ISort;
		filters?: ApiQueryFilters;
		cursor?: string;
	}): Promise<IPageData<ApiWellMapping>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) ?? {};
		const mappedFilters = getFilters(filters, cursorFilter);

		const wells = await this.context.models.WellModel.find(mappedFilters, projection)
			.sort(sortQuery)
			.limit(take + 1)
			.lean();

		const result = wells.slice(0, take).map(toApiWellMapping);
		return {
			result,
			hasNext: wells.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiWellMappingKey] as CursorType)
					: null,
		};
	}
}
