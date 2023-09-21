import produce from 'immer';
import { omit } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useMutation } from 'react-query';

import { useDerivedState } from '@/components/hooks';
import { useSettings } from '@/economics/Economics/shared/api';
import { ECON_RUN_CHECKED_SETTINGS } from '@/economics/shared/shared';
import { Setting } from '@/economics/shared/types';
import { confirmationAlert } from '@/helpers/alerts';
import { deleteApi, postApi } from '@/helpers/routing';
import { getVersionedKey, local } from '@/helpers/storage';
import { assert } from '@/helpers/utilities';
import { fields } from '@/inpt-shared/display-templates/general/economics_columns.json';

export const createDefaultColumnValue = (key, fields) => ({
	key,
	selected_options: {
		...fields[key].default_options,
	},
});

export const createDefaultBaseSetting = (fields = {}): Setting => {
	const setting = {
		columns: Object.keys(fields)
			.filter((key) => fields[key].category) // skip columns without category (i.e: Date)
			.map((key) => createDefaultColumnValue(key, fields)),
		name: 'Default',
	} as Setting;
	const checkedOptions = local.getItem(getVersionedKey(ECON_RUN_CHECKED_SETTINGS)) ?? [];
	checkedOptions.forEach((column) => {
		const indexToChange = setting.columns.findIndex(({ key }) => key === column.key);
		setting.columns[indexToChange] = column;
	});
	return setting;
};

const fillMissingColumns = (currentSetting, fields, setCurrentSetting) => {
	// update setting.columns to add missing columns (due to schema update)
	const settingColKeys = currentSetting.columns.map((col) => col.key);
	const missingColKeys = Object.keys(fields).filter((x) => x !== 'date' && !settingColKeys.includes(x));
	if (missingColKeys.length > 0) {
		setCurrentSetting(
			produce(currentSetting, (draft) => {
				missingColKeys.forEach((key) => {
					draft.columns.push({
						key,
						selected_options: fields[key].default_options,
					});
				});
			})
		);
	}
};

export function useEconSettings() {
	const { settings, mutate: setSettings, isLoading: loadingSettings } = useSettings();

	const defaultCurrentSetting = useMemo(() => createDefaultBaseSetting(fields), []);

	const [currentSetting, setCurrentSetting] = useDerivedState(defaultCurrentSetting);

	if (fields) {
		fillMissingColumns(currentSetting, fields, setCurrentSetting);
	}

	const handleReset = useCallback(() => {
		if (currentSetting?._id) {
			assert(settings, 'settings should be defined');
			const originalSetting = settings.find(({ _id }) => _id === currentSetting._id);

			if (originalSetting) {
				// need to check, since the original one could have been deleted
				setCurrentSetting(originalSetting);
				return;
			}
		}
		setCurrentSetting(defaultCurrentSetting);
	}, [currentSetting, defaultCurrentSetting, setCurrentSetting, settings]);

	const { isLoading: updating, mutateAsync: update } = useMutation(async () => {
		assert(settings, 'settings should be defined');
		const updated = await postApi(`/economics/settings/${currentSetting._id}`, currentSetting);
		setSettings(
			(prevSettings) => prevSettings?.map((setting) => (setting._id === updated._id ? updated : setting)) ?? []
		);
		confirmationAlert('Saved successfully!');
	});

	const { isLoading: creating, mutateAsync: create } = useMutation(async (name) => {
		const created = await postApi('/economics/settings', {
			...omit(currentSetting, '_id'),
			name,
		});
		setSettings((prevSettings = []) => [created, ...prevSettings]);
		setCurrentSetting(created);

		confirmationAlert('Saved successfully!');
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { isLoading: deleting, mutateAsync: handleDelete } = useMutation(async (setting: any) => {
		await deleteApi(`/economics/settings/${setting._id}`);
		setSettings((prevSettings = []) => prevSettings.filter(({ _id }) => _id !== setting._id));
		setCurrentSetting(defaultCurrentSetting);
	});

	const loading = updating || creating || creating || deleting;

	return {
		create,
		creating,
		currentSetting,
		defaultCurrentSetting,
		deleting,
		fields,
		handleDelete,
		handleReset,
		loading,
		loadingSettings,
		setCurrentSetting,
		setSettings,
		settings,
		update,
		updating,
	};
}
