import { alerts } from '@/components/v2';
import { withLoadingBar } from '@/helpers/alerts';
import { intersect } from '@/helpers/math';
import { postApi, putApi } from '@/helpers/routing';

const toggleBucket = async ({ checked, editBucket, forecastId, wellIds, suppressConfirmation }) => {
	const removedWells = [...editBucket] ?? wellIds;
	const response = suppressConfirmation
		? true
		: await alerts.confirm({
				confirmText: checked ? 'Add' : 'Remove',
				confirmColor: checked ? 'primary' : 'error',
				title: checked ? 'Adding Wells' : 'Removing Wells',
				children: checked
					? `Are you sure you want to continue with adding ${wellIds.length} ${
							wellIds.length === 1 ? 'well' : 'wells'
					  }?`
					: `Are you sure you want to continue with removing ${removedWells.length} ${
							removedWells.length === 1 ? 'well' : 'wells'
					  }?`,
		  });
	if (response) {
		const prom = checked
			? putApi(`/forecast/${forecastId}/add-to-manual`, { wellIds })
			: putApi(`/forecast/${forecastId}/remove-from-manual`, { wellIds: removedWells });

		const { bucket: retBucket } = await withLoadingBar(prom);
		return { bucket: new Set(retBucket), bucketChanged: true };
	}

	return { bucket: editBucket, bucketChanged: false };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const runFilterApi = async (filters: Record<string, any[]>) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const toIntersect: any[][] = Object.values(filters);
	const filteredIds = intersect(toIntersect);
	const wells = await withLoadingBar(
		postApi('/well/sortByHeader', {
			wells: filteredIds,
			header: 'well_name',
			dir: 'asc',
		})
	);

	return wells;
};

export { runFilterApi, toggleBucket };
