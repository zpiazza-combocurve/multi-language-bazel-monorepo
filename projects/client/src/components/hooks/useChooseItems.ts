import _ from 'lodash';
import { useMemo } from 'react';

import { withDialog } from '@/helpers/dialog';

import { ChooseDialog, ChooseDialogProps } from '../ChooseDialog';
import { useCallbackRef } from './useCallbackRef';
import { useDerivedState } from './useDerivedState';
import { useGetLocalStorage, useSetLocalStorage } from './useStorage';

const chooseDialog = withDialog(ChooseDialog);

const EMPTY_ARRAY: string[] = [];

export type UseChooseItemsProps = {
	defaultKeys?: string[];
	alwaysVisibleItemKeys?: string[];
	storageKey?: string;
	storageVersion?: number;
	applyTaggingProp?: Record<string, string>;
} & Pick<ChooseDialogProps, 'sections' | 'items' | 'title' | 'canSelectAll' | 'selectionLimit'>;

/** Easy way to use a generic selection dialog */
export const useChooseItems = ({
	defaultKeys = EMPTY_ARRAY,
	alwaysVisibleItemKeys = EMPTY_ARRAY,
	items,
	sections,
	storageKey,
	storageVersion,
	...componentProps
}: UseChooseItemsProps) => {
	const initialKeys = useGetLocalStorage(storageKey, defaultKeys, { version: storageVersion });

	const [selectedItems_, setSelectedItems_] = useDerivedState(initialKeys);

	const itemsByKeys = useMemo(() => _.keyBy(items, 'key'), [items]);

	const selectedItems = useMemo(
		() => (selectedItems_ || []).filter((key) => itemsByKeys[key] && !alwaysVisibleItemKeys.includes(key)),
		[selectedItems_, itemsByKeys, alwaysVisibleItemKeys]
	);

	const sectionsWithItemsOrdered = useMemo(
		() =>
			sections.map((section) => ({
				...section,
				itemKeys: _.sortBy(section.itemKeys, (key) => itemsByKeys[key].label?.toLowerCase()),
			})),
		[sections, itemsByKeys]
	);

	const selectItems = useCallbackRef(async () => {
		const selected = await chooseDialog({
			selectedKeys: selectedItems,
			sections: sectionsWithItemsOrdered,
			items,
			...componentProps,
		});
		if (selected) {
			setSelectedItems_(selected);
		}
	});

	useSetLocalStorage(storageKey, selectedItems, { version: storageVersion });

	const allVisibleItems = useMemo(
		() => [...alwaysVisibleItemKeys, ...selectedItems],
		[alwaysVisibleItemKeys, selectedItems]
	);

	return {
		selectedKeys: allVisibleItems,
		selectItems,
		setSelectedItems: setSelectedItems_,
	};
};
