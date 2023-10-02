import { Types } from 'mongoose';

import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { WellService } from '@src/services/well-service';

import { getDeleteFilters } from './fields';

export class CompanyWellService extends WellService {
	attribute = 'companyWellService';

	async deleteWells(filters: ApiQueryFilters): Promise<number> {
		const mappedFilters = getDeleteFilters(filters);
		const ids = (await this.context.models.WellModel.find(mappedFilters, { _id: 1 })).map(({ _id }) =>
			_id.toString(),
		);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { successCount } =
			ids.length > 0
				? await callCloudFunction({
						fullUrl: `${config.wellServiceUrl}/api/wells/delete`,
						body: { ids },
						headers: this.context.headers,
				  })
				: { successCount: 0 };

		return successCount as number;
	}

	async deleteWellById(id: Types.ObjectId): Promise<number> {
		if (
			!(await this.context.models.WellModel.exists({
				_id: id,
			}))
		) {
			return 0;
		}
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { successCount } = await callCloudFunction({
			fullUrl: `${config.wellServiceUrl}/api/wells/delete`,
			body: { ids: [id.toString()] },
			headers: this.context.headers,
		});

		return successCount as number;
	}
}
