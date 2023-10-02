import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { getProductionCountPipeline } from '@src/helpers/single-production';
import { MonthlyProductionService } from '@src/services/monthly-productions-service';

import { getDeleteFilters } from './fields';

export class CompanyMonthlyProductionService extends MonthlyProductionService {
	attribute = 'companyMonthlyProductionService';

	async deleteMonthlyProduction(filters: ApiQueryFilters): Promise<number> {
		const mappedFilters = getDeleteFilters(filters);
		const ids = (await this.context.models.MonthlyProductionModel.find(mappedFilters, { _id: 1 })).map(({ _id }) =>
			_id.toString(),
		);

		const pipeline = getProductionCountPipeline({
			productionKind: 'monthly',
			beforeUnwindFilters: mappedFilters,
		});

		const countResultBeforeDelete = await this.context.models.MonthlyProductionModel.aggregate<{ count: number }>(
			pipeline,
		);

		if (ids.length > 0) {
			await callCloudFunction({
				fullUrl: `${config.wellServiceUrl}/api/monthly-productions/delete`,
				headers: this.context.headers,
				body: { ids },
			});
		}

		const countResultAfterDelete = await this.context.models.MonthlyProductionModel.aggregate<{ count: number }>(
			pipeline,
		);

		return countResultBeforeDelete[0]?.count ?? 0 - countResultAfterDelete[0]?.count ?? 0;
	}
}
