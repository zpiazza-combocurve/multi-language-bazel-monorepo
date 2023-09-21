import { groupBy, mapValues, omit } from 'lodash-es';
import { useCallback, useMemo } from 'react';
import { ListItem, Paper } from 'react-md';
import { useMutation, useQuery } from 'react-query';
import styled from 'styled-components';

import { useDerivedState } from '@/components/hooks/';
import { useComboSettings, useReportSettings as useReportSettingsAPI } from '@/economics/Economics/shared/api';
import { RESERVES_CATEGORY } from '@/economics/shared/shared';
import { confirmationAlert } from '@/helpers/alerts';
import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';
import { ifProp, theme } from '@/helpers/styled';
import { assert } from '@/helpers/utilities';
import { fields } from '@/inpt-shared/display-templates/general/economics_columns.json';
import { useCurrentProject } from '@/projects/api';
import { QUALIFIER_FIELDS } from '@/qualifiers/fields';

const DEFAULT_COMBO_NAME = 'Default 1';

export const OPTION_TYPE = {
	ONE_LINER_KEY: 'one_liner',
	MONTHLY_KEY: 'monthly',
	AGGREGATE_KEY: 'aggregate',
};

// similar styles to tabs
export const SidebarHeader = styled.h3`
	border-bottom: 2px solid ${theme.borderColor};
	font-size: 1.3rem;
	padding: 1rem;
	margin: 0;
	line-height: initial;
`;

export const ActionsContainer = styled.div`
	display: flex;
	align-items: center;
	padding: 0.5rem;

	& > *:not(:first-child) {
		margin-left: 0.5rem;
	}
`;

export const StyledEconColumn = styled.div`
	height: 100%;
	display: flex;
`;

export const StyledListItem = styled(ListItem)`
	${ifProp('selected', 'background-color: rgba(0, 191, 165, 0.2);')}
`;

function getMappedCombos(combos) {
	const names = new Set();
	const qualifiersNames = new Set();
	let anySelected = false;
	const newCombos = combos?.map((combo) => {
		const { name, qualifiers, selected } = combo;
		const qualifiersName = Object.keys(qualifiers)
			.map((key) => qualifiers[key].key)
			.join('-');
		const invalid = names.has(name) || qualifiersNames.has(qualifiersName);
		qualifiersNames.add(qualifiersName);
		names.add(name);
		const isSelected = combos.length === 1 || (selected && !invalid);
		anySelected = anySelected || isSelected;
		return { ...combo, invalid, selected: isSelected };
	});
	if (!anySelected && newCombos) {
		newCombos[0].selected = true;
	}
	return newCombos;
}

export const StyledSidebar = styled(Paper)`
	height: 100%;
	width: 20%;
	min-width: 18rem;
	z-index: 12; // HACK: greater than combo's text inputs z-index
`;

export function useReportSettings() {
	const { settings, mutate: setSettings, isLoading } = useReportSettingsAPI();

	const defaultCurrentSetting: { headers: string[]; _id?: string } = useMemo(
		() => ({ headers: [RESERVES_CATEGORY] }),
		[]
	);

	const [currentSetting, setCurrentSetting] = useDerivedState(defaultCurrentSetting);

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
	}, [currentSetting?._id, defaultCurrentSetting, setCurrentSetting, settings]);

	const { isLoading: updating, mutateAsync: update } = useMutation(async () => {
		assert(settings, 'settings should be defined');
		const updated = await postApi(`/economics/report-settings/${currentSetting._id}`, currentSetting);
		setSettings(
			(prevSettings) => prevSettings?.map((setting) => (setting._id === updated._id ? updated : setting)) ?? []
		);
		confirmationAlert('Saved successfully!');
	});

	const { isLoading: creating, mutateAsync: create } = useMutation(async (name) => {
		const created = await postApi('/economics/report-settings', {
			...omit(currentSetting, '_id'),
			name,
		});
		setSettings((prevSettings = []) => [created, ...prevSettings]);
		setCurrentSetting(created);
		confirmationAlert('Saved successfully!');
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { isLoading: deleting, mutateAsync: handleDelete } = useMutation(async (setting: any) => {
		await deleteApi(`/economics/report-settings/${setting._id}`);
		setSettings((prevSettings = []) => prevSettings.filter(({ _id }) => _id !== setting._id));
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
		loadingSettings: isLoading,
		setCurrentSetting,
		setSettings,
		settings,
		update,
		updating,
	};
}

const getDefaultCombo = (qualifiers) => {
	return qualifiers
		? [
				{
					name: DEFAULT_COMBO_NAME,
					qualifiers,
					selected: true,
				},
		  ]
		: null;
};

function getQualifiersOptions(qualifiersByColumn) {
	const result = {};
	Object.keys(qualifiersByColumn || {}).forEach((qualifierKey) => {
		const existingQualifiers = qualifiersByColumn?.[qualifierKey] || [];
		result[qualifierKey] = existingQualifiers.map(({ active, key, name: qualifierName }) => ({
			active,
			label: qualifierName,
			value: key,
		}));
	});
	return result;
}

export function useEconCombos(scenarioId) {
	const { project } = useCurrentProject();
	assert(project, 'Expected project to be in context');

	const { settings, mutate: setSettings, isLoading: loadingSettings } = useComboSettings(scenarioId, project._id);

	const { data: qualifiers, isLoading: loadingQualifiers } = useQuery(['economics', 'qualifiers'], () =>
		scenarioId ? getApi(`/scenarios/${scenarioId}/getQualifiers`) : Promise.resolve(null)
	);

	const qualifiersByColumn = useMemo(
		() => (scenarioId && qualifiers ? groupBy(qualifiers, 'column') : null),
		[scenarioId, qualifiers]
	);

	const qualifiersOptions = useMemo(
		() => (scenarioId && qualifiersByColumn ? getQualifiersOptions(qualifiersByColumn) : null),
		[scenarioId, qualifiersByColumn]
	);
	const defaultComboQualifiers = useMemo(
		() =>
			scenarioId && qualifiersOptions
				? mapValues(QUALIFIER_FIELDS, (_value, key) => {
						const qualifiersOption = qualifiersOptions[key]?.find(({ active }) => active);

						if (!qualifiersOption) {
							return null;
						}

						return { key: qualifiersOption.value, name: qualifiersOption.label };
				  })
				: null,
		[scenarioId, qualifiersOptions]
	);

	const defaultCurrentSetting = useMemo(
		() => ({
			_id: '',
			combos: getDefaultCombo(defaultComboQualifiers),
			name: 'Default',
		}),
		[defaultComboQualifiers]
	);
	const [currentSetting, setCurrentComboSetting] = useDerivedState(defaultCurrentSetting);
	const setCurrentSetting = useCallback(
		(setting) => {
			if (typeof setting === 'function') {
				setCurrentComboSetting((prevSetting) => {
					const newSetting = setting(prevSetting);
					return {
						...newSetting,
						combos: getMappedCombos(newSetting?.combos),
					};
				});
			} else {
				setCurrentComboSetting({
					...setting,
					combos: getMappedCombos(setting?.combos),
				});
			}
		},
		[setCurrentComboSetting]
	);

	const { isLoading: creating, mutateAsync: create } = useMutation(async (name) => {
		const created = await postApi('/econ-combo-settings', {
			projectId: project._id,
			scenarioId,
			...omit(currentSetting, '_id'),
			name,
		});
		setSettings((prevSettings = []) => [created, ...prevSettings]);
		setCurrentSetting(created);

		confirmationAlert('Saved successfully!');
	});

	const changeCombos = useCallback(
		(getNewCombos) => {
			setCurrentSetting((prevSetting) => {
				const newCombos = getNewCombos(prevSetting.combos);
				return {
					...prevSetting,
					combos: newCombos,
				};
			});
		},
		[setCurrentSetting]
	);

	const { isLoading: updating, mutateAsync: update } = useMutation(async () => {
		const updated = await putApi(`/econ-combo-settings/${currentSetting._id}`, currentSetting);
		setSettings(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			(prevSettings) => prevSettings?.map((setting) => (setting!._id === updated._id ? updated : setting)) ?? []
		);
		confirmationAlert('Saved successfully!');
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { isLoading: deleting, mutateAsync: handleDelete } = useMutation(async (setting: any) => {
		await deleteApi(`/econ-combo-settings/${setting._id}`);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		setSettings((prevSettings = []) => prevSettings.filter(({ _id }) => _id !== setting!._id));
	});

	const handleReset = useCallback(() => {
		if (currentSetting?._id) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			const originalSetting = settings.find(({ _id }) => _id === currentSetting!._id);

			if (originalSetting) {
				// need to check, since the original one could have been deleted
				setCurrentSetting(originalSetting);
				return;
			}
		}
		setCurrentSetting(defaultCurrentSetting);
	}, [currentSetting, defaultCurrentSetting, setCurrentSetting, settings]);

	const loading = updating || creating || creating || deleting;

	return {
		changeCombos,
		create,
		creating,
		currentSetting,
		defaultComboQualifiers,
		defaultCurrentSetting,
		deleting,
		handleDelete,
		handleReset,
		loading,
		loadingQualifiers,
		loadingSettings,
		qualifiersByColumn,
		qualifiersOptions,
		setCurrentSetting,
		setSettings,
		settings,
		update,
		updating,
	};
}
