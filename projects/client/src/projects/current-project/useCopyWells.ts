import { alerts } from '@/components/v2';
import { genericErrorAlert } from '@/helpers/alerts';
import { pluralize } from '@/helpers/text';

import api from './api';

export const useCopyWells = ({ projectId }: { projectId?: Inpt.ObjectId }) => {
	const copyWells = async ({ wells }) => {
		try {
			await api.copyWells({ wells, projectId });
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const handleCopyWells = async ({ wellIds }: { wellIds: Inpt.ObjectId[] }) => {
		const confirmed = await alerts.confirm({
			title: 'Copy',
			children: `Copy ${pluralize(wellIds.length, 'well', 'wells')} or ${pluralize(
				wellIds.length,
				'wells collection',
				'wells collections',
				false
			)}`,
		});

		if (confirmed) {
			await copyWells({ wells: wellIds });
		}
	};

	return { handleCopyWells };
};
