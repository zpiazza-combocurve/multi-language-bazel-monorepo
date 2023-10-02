import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { DailyProductionService } from '@src/services/daily-production-service';
import { getProductionCountPipeline } from '@src/helpers/single-production';

import { getDeleteFilters } from './fields';

export class CompanyDailyProductionService extends DailyProductionService {
	attribute = 'companyDailyProductionService';

	async deleteDailyProduction(filters: ApiQueryFilters): Promise<number> {
		const mappedFilters = getDeleteFilters(filters);
		const ids = (await this.context.models.DailyProductionModel.find(mappedFilters, { _id: 1 })).map(({ _id }) =>
			_id.toString(),
		);

		const pipeline = getProductionCountPipeline({
			productionKind: 'daily',
			beforeUnwindFilters: mappedFilters,
		});

		const countResultBeforeDelete = await this.context.models.DailyProductionModel.aggregate<{ count: number }>(
			pipeline,
		);

		if (ids.length > 0) {
			await callCloudFunction({
				fullUrl: `${config.wellServiceUrl}/api/daily-productions/delete`,
				headers: this.context.headers,
				body: { ids },
			});
		}

		const countResultAfterDelete = await this.context.models.DailyProductionModel.aggregate<{ count: number }>(
			pipeline,
		);

		return countResultBeforeDelete[0]?.count ?? 0 - countResultAfterDelete[0]?.count ?? 0;
	}
}
