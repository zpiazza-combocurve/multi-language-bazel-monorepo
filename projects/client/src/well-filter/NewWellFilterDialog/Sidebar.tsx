import { useCallback, useEffect, useMemo, useState } from 'react';

import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/access-policies/Can';
import { Button, CheckboxField, Divider } from '@/components/v2';
import { useDebounce } from '@/helpers/debounce';
import { usePrevious } from '@/helpers/hooks';
import { Filter } from '@/inpt-shared/filters/shared';

import { getInitialHeaderState, initHeaderState } from '../shared';
import { FilterSelect } from './NewFilterSelect/FilterSelect';
import { HeaderSelect } from './NewHeaderSelect/NewHeaderSelect';
import { HeaderFilterListItem } from './NewWellFilterTypes/HeaderFilterListItem/HeaderFilterListItem';
import styles from './new-well-filter.module.scss';

export const SidebarHeader = ({
	selectedSavedFilter,
	resetFilter,
	deleteFilter,
	setSelectedFilter,
	filters,
	selectableWellHeaders,
	selectableProjectHeaders,
	selectedHeaders,
	onHeaderSelectChange,
	canDeleteFilter,
	isExcluding = false,
	setExcludeMode,
}) => {
	return (
		<div
			css={`
				display: flex;
				flex-direction: column;
				width: 100%;
			`}
		>
			<FilterSelect
				selectedSavedFilter={selectedSavedFilter}
				savedFilters={filters.filter((filter) => filter?._id !== 0)}
				resetFilter={resetFilter}
				selectFilter={setSelectedFilter}
				deleteFilter={deleteFilter}
				canDeleteFilter={canDeleteFilter}
			/>
			<HeaderSelect
				wellHeaders={selectableWellHeaders}
				projectHeaders={selectableProjectHeaders}
				selectedHeaders={selectedHeaders}
				onHeaderSelectChange={onHeaderSelectChange}
			/>
			<CheckboxField
				label='Exclude Mode'
				checked={isExcluding}
				onChange={(ev) => setExcludeMode(ev.target.checked)}
			/>
			<Divider />
		</div>
	);
};
export const SidebarContent = (props) => {
	const {
		wellHeaderTypes,
		projectHeaderTypes,
		allWellHeaders,
		projectHeaders,
		appliedFilters,
		setWellHeadersFilter,
		setProjectHeadersFilter,
		selectedWellHeaders,
		selectedProjectHeaders,
		selectedSavedFilter,
		removeHeaderType,
		filterSettingsUpdated,
		setFilterSettingsUpdated,
	} = props;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [headerState, setHeaderState] = useState<any>({});
	const previousSelectedWellHeader = usePrevious(selectedWellHeaders);
	const previousSelectedProjectHeaders = usePrevious(selectedProjectHeaders);

	const delayedSetWellHeadersFilter = useDebounce((filter) => setWellHeadersFilter(filter), 1000);

	const delayedSetProjectHeadersFilter = useDebounce((filter) => setProjectHeadersFilter(filter), 1000);

	const getFilter = useCallback(
		(selectedHeaders, customHeaderState?) => {
			const getRangeFilter = (h, type, value) => {
				const { start, end, exclude, showNull } = value;
				return { type, key: h, filter: { start, end }, exclude, showNull };
			};

			const getMultiFilter = (h, type, value) => {
				const { values, exclude, showNull } = value;
				return { type, key: h, filter: [...values], exclude, showNull };
			};

			const getBooleanFilter = (h, type, value) => ({
				type,
				key: h,
				filter: value.value,
				showNull: value.showNull,
			});

			const getStringFilter = (h, type, value) => {
				const { value: filterValue, exact, exclude, showNull } = value;
				return { type, key: h, filter: filterValue, exact, exclude, showNull };
			};

			const headers = selectedHeaders
				?.map((h) => {
					const { type, value } = (customHeaderState ? customHeaderState[h] : headerState[h]) ?? {};

					switch (type) {
						case 'number':
						case 'integer':
						case 'date':
						case 'percent':
							return getRangeFilter(h, type, value);
						case 'multi-checkbox':
						case 'multi-select':
							return getMultiFilter(h, type, value);
						case 'boolean':
							return getBooleanFilter(h, type, value);
						case 'string':
							return getStringFilter(h, type, value);
						default:
							return undefined;
					}
				})
				?.filter((f) => f !== undefined);

			return { headers };
		},
		[headerState]
	);

	const getHeaderStateValue = (stateHeader, filterHeader) => {
		switch (stateHeader.type) {
			case 'multi-checkbox':
			case 'multi-select':
				return {
					values: new Set(filterHeader?.filter || []),
					exclude: filterHeader?.exclude ?? false,
				};
			case 'number':
			case 'integer':
			case 'date':
			case 'percent':
				return filterHeader
					? {
							...filterHeader.filter,
							exclude: filterHeader.exclude,
					  }
					: { start: '', end: '', exclude: false };
			case 'boolean':
				return {
					value: filterHeader?.filter ?? 'both',
				};
			default:
				return filterHeader
					? {
							value: filterHeader.filter,
							exact: filterHeader.exact,
							exclude: filterHeader.exclude,
					  }
					: { value: '', exact: false, exclude: false };
		}
	};

	const wellFilters = useMemo(() => {
		if (Object.keys(headerState).length) {
			const selected = [...(selectedWellHeaders ?? []), ...(selectedProjectHeaders ?? [])];
			return getFilter(selected).headers ?? [];
		}
		return [];
	}, [selectedProjectHeaders, selectedWellHeaders, headerState, getFilter]);

	useEffect(() => {
		const headers = initHeaderState({ ...wellHeaderTypes, ...projectHeaderTypes }).headerState;
		setHeaderState(headers);
	}, [wellHeaderTypes, projectHeaderTypes]);

	const onChange = useCallback(
		(value, key, projectHeader = false) => {
			const newHeaderState = { ...headerState, [key]: { ...headerState[key], value } };
			setHeaderState(newHeaderState);
			if (projectHeader) {
				delayedSetProjectHeadersFilter(getFilter(selectedProjectHeaders, newHeaderState));
			} else {
				delayedSetWellHeadersFilter(getFilter(selectedWellHeaders, newHeaderState));
			}
		},
		[
			selectedProjectHeaders,
			selectedWellHeaders,
			headerState,
			delayedSetProjectHeadersFilter,
			delayedSetWellHeadersFilter,
			getFilter,
		]
	);

	/** Listens for selected filter changes and applies the filter values to the headerState. */
	useEffect(() => {
		const filterWithHeaders = appliedFilters.find(
			(filter) => filter?.headers?.headers?.length || filter?.projectHeaders?.headers?.length
		);
		const headerStateValues = initHeaderState({ ...wellHeaderTypes, ...projectHeaderTypes }).headerState;
		if (filterWithHeaders) {
			const headers = [
				...(filterWithHeaders?.headers?.headers ?? []),
				...(filterWithHeaders?.projectHeaders?.headers ?? []),
			];
			setHeaderState((prev) => {
				const updatedHeaders = {};

				headers.forEach((header) => {
					const stateHeader = prev[header.key];

					if (!stateHeader) {
						return;
					}

					const showNull = stateHeader.value.neverNull ? undefined : header?.showNull ?? true;
					updatedHeaders[header.key] = {
						...stateHeader,
						value: { ...stateHeader.value, showNull, ...getHeaderStateValue(stateHeader, header) },
					};
				});
				return { ...headerStateValues, ...updatedHeaders };
			});
		} else {
			setHeaderState(headerStateValues);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedSavedFilter]);

	const handleRemoveHeaderType = (key, isProjectHeader) => {
		const headerTypes = { ...wellHeaderTypes, ...projectHeaderTypes };

		const { type, options, neverNull } = headerTypes[key];

		const { value } = getInitialHeaderState(type, options, neverNull);

		onChange(value, key, isProjectHeader);

		removeHeaderType(key, isProjectHeader);
	};
	const updateSelectedHeadersMadeByMultiSelectField = (
		headerState,
		selectedHeaders,
		previousHeaders,
		headerTypes
	) => {
		const difference = (selectedHeaders || [])
			?.filter((selectedHeader) => !previousHeaders?.includes(selectedHeader))
			?.concat(previousHeaders?.filter((prev) => !selectedHeaders?.includes(prev)));

		difference?.forEach((header) => {
			const { type, options, neverNull } = headerTypes[header];
			const { value } = getInitialHeaderState(type, options, neverNull);
			headerState[header] = { ...headerState[header], value };
		});
	};

	// updates headers with filter setting changes (on remove and add header)
	useEffect(() => {
		if (filterSettingsUpdated) {
			const newHeaderState = { ...headerState };
			if (previousSelectedWellHeader && selectedWellHeaders?.length >= 0) {
				updateSelectedHeadersMadeByMultiSelectField(
					newHeaderState,
					selectedWellHeaders,
					previousSelectedWellHeader,
					wellHeaderTypes
				);
			}
			if (previousSelectedProjectHeaders && selectedProjectHeaders?.length >= 0) {
				updateSelectedHeadersMadeByMultiSelectField(
					newHeaderState,
					selectedProjectHeaders,
					previousSelectedProjectHeaders,
					projectHeaderTypes
				);
			}
			setHeaderState(newHeaderState);
			delayedSetWellHeadersFilter(getFilter(selectedWellHeaders, newHeaderState));
			delayedSetProjectHeadersFilter(getFilter(selectedProjectHeaders, newHeaderState));
			setFilterSettingsUpdated(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterSettingsUpdated]);

	return (
		<div>
			{wellFilters.map((filter) => {
				return (
					<HeaderFilterListItem
						key={filter.key}
						headerTypes={{ ...wellHeaderTypes, ...projectHeaderTypes }}
						header={filter.key}
						headerState={headerState[filter.key]}
						headerNames={{ ...allWellHeaders, ...projectHeaders }}
						appliedFilters={appliedFilters}
						removeHeaderType={(key, isProjectHeader) => {
							handleRemoveHeaderType(key, isProjectHeader);
						}}
						onChange={onChange}
					/>
				);
			})}
		</div>
	);
};

type SidebarFooterProps = {
	canCreateFilter: boolean;
	canUpdateFilter: boolean;
	onApply: () => Promise<void>;
	onHide: (...args: unknown[]) => void;
	onSaveAs: () => void;
	onSave: (filter?: Filter) => void;
	projectId: Inpt.ObjectId;
	selectedSavedFilter?: Filter;
	isLoading: boolean;
};

export const SidebarFooter = (props: SidebarFooterProps) => {
	const {
		onHide,
		onApply,
		onSaveAs,
		onSave,
		canCreateFilter,
		projectId,
		selectedSavedFilter,
		canUpdateFilter,
		isLoading,
	} = props;

	return (
		<div className={styles['sidebar-footer-wrapper']}>
			<Button css='text-transform: unset;' color='secondary' variant='text' onClick={onHide}>
				Close
			</Button>
			<div>
				<Button
					css={`
						text-transform: unset;
						margin-right: 10px;
						${!projectId ? 'display: none' : ''}
					`}
					color='secondary'
					variant='contained'
					disabled={isLoading || (!canCreateFilter && PERMISSIONS_TOOLTIP_MESSAGE)}
					onClick={onSaveAs}
				>
					Save As
				</Button>
				<Button
					css={`
						text-transform: unset;
						margin-right: 10px;
						${!projectId || !selectedSavedFilter ? 'display: none' : ''}
					`}
					color='secondary'
					variant='contained'
					disabled={isLoading || (!canUpdateFilter && PERMISSIONS_TOOLTIP_MESSAGE)}
					onClick={() => onSave(selectedSavedFilter)}
				>
					Save
				</Button>
				<Button
					disabled={isLoading}
					css='text-transform: unset;'
					color='secondary'
					variant='contained'
					onClick={onApply}
				>
					Apply
				</Button>
			</div>
		</div>
	);
};
