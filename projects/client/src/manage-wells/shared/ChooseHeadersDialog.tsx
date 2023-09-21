import { faList } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
	useCallbackRef,
	useDerivedState,
	useGetLocalStorage,
	useSelection,
	useSetLocalStorage,
} from '@/components/hooks';
import ColoredCircle from '@/components/misc/ColoredCircle';
import {
	Button,
	CheckboxField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	InfoTooltipWrapper,
	TextField,
	Typography,
} from '@/components/v2';
import { genericErrorAlert, warningAlert } from '@/helpers/alerts';
import { DialogProps, withDialog } from '@/helpers/dialog';
import { labelWithUnit } from '@/helpers/text';
import { filterSearch } from '@/helpers/utilities';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

const DEFAULT_MAX_HEADERS = 5;

const CheckboxItem = memo(
	({
		getLabel,
		getUnit,
		header,
		checked,
		toggle,
		disabled,
		isCustomHeader,
		className,
	}: {
		getLabel: (key: string) => string;
		getUnit?: (key: string) => string | undefined;
		header: string;
		checked: boolean;
		toggle: (key: string) => void;
		disabled: boolean;
		isCustomHeader?: boolean;
		className?: string;
	}) => (
		<CheckboxField
			className={className}
			checked={checked}
			name={header}
			key={header}
			label={
				<>
					{isCustomHeader && <ColoredCircle $color={projectCustomHeaderColor} />}
					{labelWithUnit(getLabel(header), getUnit?.(header))}
				</>
			}
			onChange={() => toggle(header)}
			disabled={disabled}
		/>
	)
);

const EMPTY_ARRAY = [];

const Divider = ({ children }) => (
	<h3
		css={`
			grid-column: 1 / -1;
			margin-top: 0.5rem;
			margin-bottom: 0.5rem;
		`}
	>
		{children}
	</h3>
);

type ChooseHeadersDialogProps = {
	title?: string;
	feat?: string;
	selectedHeaders: string[];
	headers?: string[];
	getLabel: (key: string) => string;
	getUnit?: (key: string) => string | undefined;
	maxHeaders?: number | null;
	disabled?: boolean;
	alwaysVisibleHeaders?: string[];
	applyTaggingProp?: Record<string, string>;
	projectCustomHeadersKeys?: string[]; // HACK for coloring project custom headers, might be better to restructure the functions parameters
} & DialogProps<string[] | null>;

export default function ChooseHeadersDialog({
	alwaysVisibleHeaders = EMPTY_ARRAY,
	disabled,
	feat = 'headers',
	getLabel,
	getUnit,
	headers: allHeaders,
	maxHeaders = DEFAULT_MAX_HEADERS,
	onHide,
	projectCustomHeadersKeys,
	resolve,
	selectedHeaders,
	title = 'Search Header',
	visible,
	applyTaggingProp = {},
}: ChooseHeadersDialogProps) {
	const selection = useSelection(allHeaders, selectedHeaders);
	const [search, setSearch] = useState('');

	const canSelectAll = maxHeaders === null && !!allHeaders;
	const tooManySelected = maxHeaders !== null && selection.selectedSet.size > maxHeaders;

	useEffect(() => {
		if (tooManySelected) {
			warningAlert(`Select only a max of ${maxHeaders} ${feat}`);
		}
	}, [maxHeaders, tooManySelected, feat]);

	const filteredHeaders = filterSearch(allHeaders ?? [], search, getLabel);
	// this is for selection purposes, alwaysVisibleHeaders won't be counted
	const actualFilteredHeaders = _.without(filteredHeaders, ...alwaysVisibleHeaders);

	const handleDeselectAll = () => {
		selection.deselect(actualFilteredHeaders);
	};

	const handleSelectAll = () => {
		selection.select(actualFilteredHeaders);
	};

	const filteredCustomHeaders = filteredHeaders.some((key) => projectCustomHeadersKeys?.includes(key));
	const filteredWellHeaders = filteredHeaders.some((key) => !projectCustomHeadersKeys?.includes(key));

	const getSortedHeadersCheckboxWithFilter = (filter) =>
		_.sortBy(filteredHeaders.filter(filter), (header) => getLabel(header).toLowerCase()).map((header) => (
			<CheckboxItem
				css={`
					margin-left: 0.5rem;
				`}
				key={header}
				getLabel={getLabel}
				getUnit={getUnit}
				header={header}
				checked={selection.isSelected(header) || alwaysVisibleHeaders.includes(header)}
				toggle={selection.toggle}
				disabled={alwaysVisibleHeaders.includes(header)}
				isCustomHeader={projectCustomHeadersKeys?.includes(header)}
			/>
		));

	return (
		<Dialog open={visible} onClose={onHide} maxWidth='lg' fullWidth>
			<DialogTitle
				css={`
					& > *:not(:first-child) {
						margin-left: 0.5rem;
					}

					display: flex;
					align-items: baseline;
				`}
				disableTypography
			>
				<TextField value={search} onChange={(ev) => setSearch(ev.target.value)} label={title} debounce />
				<Button color='secondary' variant='outlined' onClick={handleDeselectAll}>
					Deselect All
				</Button>
				{canSelectAll && (
					<Button color='secondary' variant='outlined' onClick={handleSelectAll}>
						Select All
					</Button>
				)}
			</DialogTitle>
			<DialogContent
				css={`
					height: 100vh;
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(25rem, 1fr));
					grid-auto-rows: min-content;
					justify-items: start;
					align-items: start;
				`}
			>
				{filteredCustomHeaders && (
					<Divider>
						<InfoTooltipWrapper
							placeIconAfter
							tooltipTitle='Columns below are project-specific headers created by the user. Orange dot indicates that it is a project-specific custom header'
						>
							<Typography variant='h6'>Project Headers</Typography>
						</InfoTooltipWrapper>
					</Divider>
				)}
				{getSortedHeadersCheckboxWithFilter((key) => projectCustomHeadersKeys?.includes(key))}
				{!!projectCustomHeadersKeys?.length && filteredWellHeaders && (
					<Divider>
						<Typography variant='h6'>Well Headers</Typography>
					</Divider>
				)}
				{getSortedHeadersCheckboxWithFilter((key) => !projectCustomHeadersKeys?.includes(key))}
			</DialogContent>
			<DialogActions>
				<Button color='secondary' variant='outlined' onClick={onHide}>
					Cancel
				</Button>
				<Button
					color='primary'
					variant='contained'
					onClick={() => resolve([...selection.selectedSet])}
					disabled={tooManySelected || disabled}
					{...applyTaggingProp}
				>
					Apply ({selection.selectedSet.size})
				</Button>
			</DialogActions>
		</Dialog>
	);
}

const chooseHeadersDialog = withDialog(ChooseHeadersDialog);

const DEFAULT_GET_LABEL = (key: string) => key;
const DEFAULT_GET_UNIT = () => undefined as string | undefined;

export function useSelectedHeaders({
	// TODO track down usage and remove
	// alias
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	initialHeaders = EMPTY_ARRAY,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	allHeaders = EMPTY_ARRAY,
	// props
	initialKeys = initialHeaders,
	allKeys = allHeaders,
	getLabel = DEFAULT_GET_LABEL,
	getUnit = DEFAULT_GET_UNIT,
	maxHeaders = DEFAULT_MAX_HEADERS,
	title,
	feat,
	disabled,
	alwaysVisibleHeaders: _alwaysVisibleHeaders = EMPTY_ARRAY,
	projectCustomHeadersKeys = EMPTY_ARRAY,
	applyTaggingProp = {},
}: {
	initialKeys?: string[];
	allKeys?: string[];
	getLabel?: (key: string) => string;
	getUnit?: (key: string) => string | undefined;
	maxHeaders?: number | null;
	title?: string;
	feat?: string;
	disabled?: boolean;
	alwaysVisibleHeaders?: string[];
	projectCustomHeadersKeys?: string[];
	applyTaggingProp?: Record<string, string>;
}) {
	const alwaysVisibleHeaders = useMemo(
		() => _alwaysVisibleHeaders.filter((key) => allKeys.includes(key)),
		[_alwaysVisibleHeaders, allKeys]
	);
	const [headerDialogActive, setHeaderDialogActive] = useState(false);
	const [_keys, setKeys] = useDerivedState(
		useMemo(
			() => initialKeys ?? allKeys.slice(0, maxHeaders ?? DEFAULT_MAX_HEADERS),
			[allKeys, initialKeys, maxHeaders]
		)
	);
	const keys = useMemo(() => {
		return _.uniq([..._keys, ...alwaysVisibleHeaders].filter((key) => allKeys.includes(key)));
	}, [_keys, alwaysVisibleHeaders, allKeys]);

	const handleSelectKeys = useCallback(async () => {
		try {
			setHeaderDialogActive(true);
			const selected = await chooseHeadersDialog({
				alwaysVisibleHeaders,
				disabled,
				feat,
				getLabel,
				getUnit,
				headers: allKeys,
				maxHeaders,
				projectCustomHeadersKeys,
				selectedHeaders: keys,
				title,
				applyTaggingProp,
			});
			if (selected) {
				setKeys(selected);
			}
		} catch (error) {
			genericErrorAlert(error);
		} finally {
			setHeaderDialogActive(false);
		}
	}, [
		allKeys,
		alwaysVisibleHeaders,
		disabled,
		feat,
		getLabel,
		getUnit,
		keys,
		maxHeaders,
		projectCustomHeadersKeys,
		setKeys,
		title,
		applyTaggingProp,
	]);

	return [keys, handleSelectKeys, headerDialogActive, setKeys] as const;
}

/**
 * Similar to above but aims to be simpler
 *
 * @deprecated Use useChooseItems instead
 * @example
 * 	import { useChooseHeaders } from '@/manage-wells/shared/ChooseHeadersDialog';
 *
 * 	const headers = { oil: 'Oil', gas: 'Gas', index: 'Date' };
 * 	const units = { oil: 'BBL', gas: 'MCF' };
 *
 * 	const { selectedHeaders, selectHeaders } = useChooseHeaders({ headers, units });
 * 	<button onClick={selectHeaders}>choose headers</button>;
 */
export function useChooseHeaders({
	initialHeaders = EMPTY_ARRAY,
	headers,
	units,
	storageKey,
	storageVersion,
	projectCustomHeadersKeys,
	alwaysVisibleHeaders = EMPTY_ARRAY,
	...componentProps
}: {
	initialHeaders?: string[];
	headers: Record<string, string>;
	units?: Record<string, string | never>;
	storageKey?: string;
	storageVersion?: number;
	applyTaggingProp?: Record<string, string>;
	projectCustomHeadersKeys?: string[]; // HACK for coloring project custom headers, might be better to restructure the functions parameters
} & Pick<ChooseHeadersDialogProps, 'maxHeaders' | 'title' | 'feat' | 'disabled' | 'alwaysVisibleHeaders'>) {
	initialHeaders = useGetLocalStorage(storageKey, initialHeaders, { version: storageVersion });

	const [selectedHeaders_, setSelectedHeaders] = useDerivedState(initialHeaders);

	const selectedHeaders = useMemo(
		() => (selectedHeaders_ || []).filter((key) => headers[key] && !alwaysVisibleHeaders.includes(key)),
		[selectedHeaders_, headers, alwaysVisibleHeaders]
	);

	const selectHeaders = useCallbackRef(async () => {
		const selected = await chooseHeadersDialog({
			selectedHeaders,
			headers: Object.keys(headers),
			getUnit: (key: string) => units?.[key],
			getLabel: (key: string) => headers?.[key],
			projectCustomHeadersKeys,
			alwaysVisibleHeaders,
			...componentProps,
		});
		if (selected) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			setSelectedHeaders(selected as any);
		}
	});

	useSetLocalStorage(storageKey, selectedHeaders, { version: storageVersion });

	const allVisibleHeaders = useMemo(
		() => [...alwaysVisibleHeaders, ...selectedHeaders],
		[alwaysVisibleHeaders, selectedHeaders]
	);

	return Object.assign([selectedHeaders, selectHeaders] as const, {
		selectedHeaders: allVisibleHeaders,
		selectHeaders,
		initialHeaders,
		setSelectedHeaders,
	});
}

export const chooseHeadersIcon = faList;
