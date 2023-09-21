import { useMemo } from 'react';

import { useChooseItems } from '@/components/hooks/useChooseItems';
import { useCustomFields } from '@/helpers/headers';

import { Section, SectionItem } from '../../../../../components/ChooseDialog';
import { DAILY_PRODUCTION_HEADERS, MONTHLY_PRODUCTION_HEADERS } from '../shared';

export function useProductionDataColumns(
	projectId: Inpt.ObjectId<'project'> | string | undefined,
	resolution: 'monthly' | 'daily',
	initialColumns: string[],
	wellHeaderColumns: Record<string, string>,
	storageKeyPrefix: string
) {
	const storageKey = useMemo(
		() => `${storageKeyPrefix}_${projectId ?? 'COMPANY'}_production`,
		[projectId, storageKeyPrefix]
	);
	const productionFields = resolution === 'monthly' ? MONTHLY_PRODUCTION_HEADERS : DAILY_PRODUCTION_HEADERS;

	const { data: companyCustomStreams } = useCustomFields(`${resolution}-productions`);

	const projectCustomStreams = useMemo(() => ({} as Record<string, string>), []); // TODO: query project custom streams when this will be implemented

	const allColumns = { ...wellHeaderColumns, ...productionFields, ...companyCustomStreams, ...projectCustomStreams };

	const items: SectionItem[] = Object.keys(allColumns).map((key) => ({
		key,
		label: allColumns[key],
	}));

	const sections: Section[] = [
		{
			key: 'Columns',
			label: 'Columns',
			itemKeys: [...Object.keys(wellHeaderColumns), ...Object.keys(productionFields)],
		},
		{
			key: 'Custom Streams',
			label: 'Custom Streams',
			itemKeys: Object.keys(companyCustomStreams ?? {}),
		},
		{
			key: 'Project Custom Streams',
			label: 'Project Custom Streams',
			itemKeys: Object.keys(projectCustomStreams),
		},
	];

	return {
		...useChooseItems({
			title: `${resolution} Production Columns`,
			defaultKeys: initialColumns,
			items,
			sections,
			storageKey,
			storageVersion: 1,
			canSelectAll: false,
		}),
		allColumns,
	};
}
