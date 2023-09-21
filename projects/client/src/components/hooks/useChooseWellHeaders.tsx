import _ from 'lodash';
import { useMemo } from 'react';

import { Section } from '@/components/ChooseDialog';
import { UseChooseItemsProps, useChooseItems } from '@/components/hooks/useChooseItems';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useCustomFields, useWellHeaders } from '@/helpers/headers';
import { labelWithUnit } from '@/helpers/text';

/**
 * Standard well headers selection dialog with 3 sections. If you need to add more sections, you can use useChooseItems
 * directly
 */
export const useChooseWellHeaders = ({
	storageKey,
	storageVersion,
	enableProjectCustomHeaders,
	companyOnly,
	defaultKeys,
}: { enableProjectCustomHeaders?: boolean; companyOnly?: boolean } & Pick<
	UseChooseItemsProps,
	'storageKey' | 'storageVersion' | 'defaultKeys'
>) => {
	const { isWellsCollectionsEnabled } = useLDFeatureFlags();

	const { data: companyCustomStreams } = useCustomFields('wells');

	const { wellHeadersLabels, wellHeadersUnits, wellHeadersKeys, projectCustomHeadersKeys } = useWellHeaders({
		enableProjectCustomHeaders,
		enableScopeHeader: true,
		enableWellsCollectionHeader: !companyOnly && isWellsCollectionsEnabled,
	});

	const companyCustomStreamsKeys = useMemo(() => Object.keys(companyCustomStreams ?? {}), [companyCustomStreams]);

	const selectableHeaders = useMemo(
		() => _.pick(wellHeadersLabels, [...wellHeadersKeys, ...projectCustomHeadersKeys, ...companyCustomStreamsKeys]),
		[wellHeadersKeys, projectCustomHeadersKeys, wellHeadersLabels, companyCustomStreamsKeys]
	);

	const onlyWellHeadersKeys = useMemo(
		() => wellHeadersKeys.filter((key) => !companyCustomStreamsKeys.includes(key)),
		[wellHeadersKeys, companyCustomStreamsKeys]
	);

	const items = useMemo(
		() =>
			Object.keys(selectableHeaders).map((key) => ({
				key,
				label: labelWithUnit(selectableHeaders[key], wellHeadersUnits[key]),
			})),
		[selectableHeaders, wellHeadersUnits]
	);

	const sections: Section[] = [
		...(enableProjectCustomHeaders
			? [
					{
						key: 'Project Custom Headers',
						label: 'Project Custom Headers',
						itemKeys: projectCustomHeadersKeys,
					},
			  ]
			: []),
		{ key: 'Headers', label: 'Headers', itemKeys: onlyWellHeadersKeys },
		{ key: 'Company Custom Headers', label: 'Company Custom Headers', itemKeys: companyCustomStreamsKeys },
	];

	return useChooseItems({
		title: 'Well Headers',
		canSelectAll: false,
		defaultKeys,
		sections,
		items,
		// TODO needs to validate that headers are available, eg project custom headers can be changed by the user
		storageKey,
		storageVersion,
	});
};
