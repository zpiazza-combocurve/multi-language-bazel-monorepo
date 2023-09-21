import { useCallback } from 'react';
import { useMutation } from 'react-query';

import { postApi } from '@/helpers/routing';
import { exportXLSX } from '@/helpers/xlsx';

export const useExportWellTable = ({
	scheduleId,
	scheduleName,
}: {
	scheduleId: Inpt.ObjectId;
	scheduleName: string;
}) => {
	const getExportSortData = useCallback(() => postApi(`/schedules/${scheduleId}/order-export`), [scheduleId]);

	const { isLoading: exportingCCSort, mutateAsync: handleExportSorting } = useMutation(async () => {
		const name = `schedule-${scheduleName}-export`;
		const { wells, headers } = await getExportSortData();
		exportXLSX({
			sheets: [
				{
					name: 'Schedule Export',
					data: wells,
					header: headers,
				},
			],
			fileName: `${name}.xlsx`,
		});
	});

	return { handleExportSorting, exportingCCSort };
};
