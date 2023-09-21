import { GetRowIdParams, RowClassParams, ValueFormatterParams } from 'ag-grid-community';
import { useCallback, useState } from 'react';
import * as React from 'react';
import { Column } from 'react-data-grid';

import { defaultValueFormatter } from '@/components/AgGrid';
import { utcDateFormatter } from '@/components/AgGrid/editors/DateEditor';
import { alerts } from '@/components/v2';
import { failureAlert } from '@/helpers/alerts';
import { makeUtc } from '@/helpers/date';
import { SUPPORTED_DATE_PARSE_FORMATS, isValidDate, parseMultipleFormats } from '@/helpers/dates';
import { WellHeadersUnits } from '@/helpers/headers';
import { formatDate, stringToColor } from '@/helpers/utilities';
import { FlexibleSelect } from '@/manage-wells/shared/ButtonGroupSelect';

import styles from './HeadersTable.module.scss';

export { fields as DIRECTIONAL_SURVEY_HEADERS } from '@/inpt-shared/display-templates/wells/well_directional_survey.json';
export { fields as DIRECTIONAL_SURVEY_HEADER_TYPES } from '@/inpt-shared/display-templates/wells/well_directional_survey_types.json';

export interface Collection {
	storageKey?: string;
	label: string;
	smallLabel?: string;
	value: string;
	downloadLimit: number;
	initialHeaders: string[];
}

export type WithToolbarLike<P = unknown> = React.ComponentType<
	{
		left?: React.ReactNode;
		center?: React.ReactNode;
		right?: React.ReactNode;
		toolbarCss?: string;
		rightCss?: string;
		opaque?: boolean;
		iconsColor?: string;
		iconsSize?: string;
		forceMaximized?: boolean;
	} & P
>;

export const PROJECT_CUSTOM_HEADERS_UPDATED_EVENT_NAME = 'project-custom-headers-updated-event';

export const WELL_HEADER_NUMBER_COLUMNS = ['number', 'integer', 'precise-number', 'percent'];

export const LONGITUDE_HEADERS = ['surfaceLongitude', 'toeLongitude', 'heelLongitude'];
export const LATITUDE_HEADERS = ['surfaceLatitude', 'toeLatitude', 'heelLatitude'];
export const LOCATION_HEADERS = [...LONGITUDE_HEADERS, ...LATITUDE_HEADERS];

export function getWellHeaderColumnType(
	header: string,
	wellHeadersTypes: Record<string, { type: string } | undefined>
) {
	if (LOCATION_HEADERS.includes(header)) {
		return 'precise-number';
	}
	const headerType = wellHeadersTypes[header];
	switch (headerType?.type) {
		case 'number':
			return 'number';
		case 'string':
		case 'multi-select':
			return 'string';
		case 'date':
			return 'date';
		case 'boolean':
			return 'boolean';
		case 'percent':
			return 'percent';
		case 'integer':
			return 'integer';
		default:
			return undefined;
	}
}

export const MAX_WELLS_SHOWING_PRODUCTION_DATA = 100;
export const MAX_WELLS_SHOWING_DIRECTIONAL_SURVEY = 500;

export const PRODUCTION_HEADERS = {
	gas: 'Gas',
	oil: 'Oil',
	index: 'Date',
	choke: 'Choke',
	water: 'Water',
	api14: 'API 14',
	chosenID: 'Chosen ID',
	inptID: 'INPT ID',
	operational_tag: 'Operational Tag',
	gasInjection: 'Gas Injection',
	waterInjection: 'Water Injection',
	co2Injection: 'CO2 Injection',
	steamInjection: 'Steam Injection',
	ngl: 'NGL',
};

export const DAILY_PRODUCTION_HEADERS = {
	...PRODUCTION_HEADERS,
	gas_lift_injection_pressure: 'Gas Lift Injection Pressure',
	bottom_hole_pressure: 'Bottom Hole Pressure',
	vessel_separator_pressure: 'Vessel Separator Pressure',
	tubing_head_pressure: 'Tubing Head Pressure',
	flowline_pressure: 'Flowline Pressure',
	casing_head_pressure: 'Casing Head Pressure',
	hours_on: 'Hours On',
};

export const MONTHLY_PRODUCTION_HEADERS = {
	...PRODUCTION_HEADERS,
	days_on: 'Days On',
};

export const PRODUCTION_HEADER_TYPES = {
	gas: { type: 'number' },
	oil: { type: 'number' },
	index: { type: 'date' },
	choke: { type: 'number' },
	water: { type: 'number' },
	hours_on: { type: 'number' },
	gas_lift_injection_pressure: { type: 'number' },
	bottom_hole_pressure: { type: 'number' },
	vessel_separator_pressure: { type: 'number' },
	tubing_head_pressure: { type: 'number' },
	flowline_pressure: { type: 'number' },
	casing_head_pressure: { type: 'number' },
	gasInjection: { type: 'number' },
	waterInjection: { type: 'number' },
	co2Injection: { type: 'number' },
	steamInjection: { type: 'number' },
	ngl: { type: 'number' },
};

/** Headers used to identify a well in other collections */
export const IDENTIFIER_HEADERS = ['well_name', 'well_number', 'api14', 'chosenID'];

export const DIRECTIONAL_SURVEY_INITIAL_FIELDS = ['measuredDepth', 'trueVerticalDepth', 'deviationNS', 'deviationEW'];

export const COLLECTIONS = {
	headers: {
		label: 'Headers',
		value: 'headers' as const,
		downloadLimit: 100_000,
		initialHeaders: IDENTIFIER_HEADERS,
	},
	customHeaders: {
		label: 'Project Headers',
		value: 'custom-headers' as const,
		downloadLimit: 100_000,
		initialHeaders: IDENTIFIER_HEADERS,
	},
	monthly: {
		label: 'Monthly Production',
		smallLabel: 'Monthly',
		value: 'monthly' as const,
		downloadLimit: 10_000,
		initialHeaders: [...IDENTIFIER_HEADERS, 'index', 'oil', 'gas', 'water'],
	},
	daily: {
		label: 'Daily Production',
		smallLabel: 'Daily',
		value: 'daily' as const,
		downloadLimit: 10_000,
		initialHeaders: [...IDENTIFIER_HEADERS, 'index', 'oil', 'gas', 'water'],
	},
	directionalSurvey: {
		label: 'Directional Survey',
		smallLabel: 'Directional Survey',
		value: 'directionalSurvey' as const,
		downloadLimit: 10_000,
		initialHeaders: [...IDENTIFIER_HEADERS, ...DIRECTIONAL_SURVEY_INITIAL_FIELDS],
	},
	monthlySingle: {
		storageKey: 'INPT_SINGLE_WELL_MONTHLY_TABLE',
		label: 'Monthly',
		value: 'monthly' as const,
		downloadLimit: 100,
		initialHeaders: ['index', 'oil', 'gas', 'water'],
	},
	dailySingle: {
		storageKey: 'INPT_SINGLE_WELL_DAILY_TABLE',
		label: 'Daily',
		value: 'daily' as const,
		downloadLimit: 100,
		initialHeaders: ['index', 'oil', 'gas', 'water'],
	},
};

export function useCollectionsSelect<T extends { label: string; value: string }>(
	collectionItems: T[],
	initialValue: string = collectionItems[0].value,
	separate = false
) {
	const [collection, setCollection] = useState<string>(initialValue);
	const [collectionEdited, setCollectionEdited] = useState(false);

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const selectedCollection = collectionItems.find(({ value }) => value === collection)!;

	const onChangeCollection = useCallback(
		async (value: string) => {
			if (collectionEdited) {
				const confirmed = await alerts.confirm({
					children: 'You have unsaved work, do you want to discard your changes?',
					confirmText: 'Discard Changes',
				});

				if (confirmed) {
					setCollection(value);
				}
			} else {
				setCollection(value);
			}
		},
		[collectionEdited]
	);

	const selectComponent =
		collectionItems.length === 1 ? null : (
			<FlexibleSelect
				value={collection}
				items={collectionItems}
				onChange={onChangeCollection}
				separate={separate}
			/>
		);

	return [selectedCollection, selectComponent, setCollectionEdited] as const;
}

export const INVALID_VALUE = Symbol('INVALID VALUE');

const TRUTHY_VALUES = ['true', 'yes'];
const FALSY_VALUES = ['false', 'no'];

export const getBooleanValue = (val: unknown) => {
	if (typeof val === 'boolean') {
		return val;
	}
	if (typeof val === 'string') {
		if (TRUTHY_VALUES.includes(val.toLowerCase())) {
			return true;
		}
		if (FALSY_VALUES.includes(val.toLowerCase())) {
			return false;
		}
	}
	return INVALID_VALUE;
};

export const getDateValue = (val: unknown) => {
	if (!val) {
		return null;
	}

	if (isValidDate(val)) {
		return val;
	}

	if (typeof val === 'string') {
		const parsed = parseMultipleFormats(val, SUPPORTED_DATE_PARSE_FORMATS);

		if (parsed) {
			const asUtc = makeUtc(parsed);
			return asUtc;
		}
	}
	return INVALID_VALUE;
};

export const getNumberValue = (val: unknown) => {
	const asNumber = Number(val);
	if (Number.isFinite(asNumber)) {
		return asNumber;
	}
	return INVALID_VALUE;
};

export const getNonNegativeNumberValue = (val: unknown) => {
	const parsed = getNumberValue(val);

	return parsed !== INVALID_VALUE && parsed >= 0 ? parsed : INVALID_VALUE;
};

export const getNumberValueInRange = (val: unknown, min: number, max: number) => {
	const parsed = getNumberValue(val);

	return parsed !== INVALID_VALUE && parsed >= min && parsed <= max ? parsed : INVALID_VALUE;
};

export const projectHeadersStorage = {
	version: 1,
	getKey: (project: Inpt.ObjectId<'project'> | undefined) => `INPT_MANAGE_WELL_HEADERS_TABLE_${project}`,
};

export const isIdValueValid = (val: string, id: string) => {
	const idStringCount = {
		api10: 10,
		api12: 12,
		api14: 14,
	};
	let isValid;
	if (idStringCount[id] && val.length !== idStringCount[id]) {
		isValid = false;
		failureAlert(`Invalid Amount of Characters`);
	} else if (/[^A-Za-z0-9]/g.test(val)) {
		isValid = false;
		failureAlert(`Invalid Characters`);
	} else {
		isValid = true;
	}
	return isValid ? val : INVALID_VALUE;
};

export const withUnits = (wellHeadersColumns: Column[], wellHeadersUnits: WellHeadersUnits) =>
	wellHeadersColumns.map((column) => ({
		...column,
		name: wellHeadersUnits[column.key] ? `${column.name} (${wellHeadersUnits[column.key]})` : column.name,
	}));

export const getWellHeaderValueFormatter =
	(
		wellHeadersTypes: Record<
			string,
			{
				type: string;
				kind?: string;
				options?: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				any[];
			}
		>
	) =>
	(params: ValueFormatterParams) => {
		const field = params?.column?.getColDef?.()?.field;
		const headerType = field ? wellHeadersTypes?.[field] : undefined;
		const items = headerType?.options ?? [];

		if (headerType?.type === 'date') {
			if (headerType.kind === 'date') {
				const formatted = utcDateFormatter(params, false);
				return formatted;
			}

			const formatted = formatDate(new Date(params.value));
			return formatted;
		}

		const formatted = defaultValueFormatter(params, items);
		return formatted;
	};

export const WELLS_COLLECTION_FIELD_KEY = 'wells_collection_items';

const AG_GRID_NODE_ID_PATH_SEPARATOR = '___';

export const getAgGridNodeIdFromWellRowData = (params: GetRowIdParams) =>
	params.level === 0
		? params.data._id
		: [...(params.parentKeys ?? []), params.data._id].join(AG_GRID_NODE_ID_PATH_SEPARATOR);

export const getAgGridNodeIdByIds = (
	wellCollectionId: Inpt.ObjectId<'wells-collection'>,
	wellId: Inpt.ObjectId<'well'>
) => `${wellCollectionId}${AG_GRID_NODE_ID_PATH_SEPARATOR}${wellId}`;

export const getWellIdFromAgGridNodeId = (agGridNodeId: string) =>
	agGridNodeId.split(AG_GRID_NODE_ID_PATH_SEPARATOR).pop() as string;

export const getAgGridNodeIdInfo = (agGridNodeId: string, wellsCollectionsQueryDataIdsSet: Set<string>) => {
	const splitted = agGridNodeId.split(AG_GRID_NODE_ID_PATH_SEPARATOR);

	if (splitted.length === 2) {
		return {
			wellsCollectionId: splitted[0],
			wellId: splitted[1],
		};
	}

	if (splitted.length === 1) {
		const id = splitted[0];
		const isWellsCollections = wellsCollectionsQueryDataIdsSet.has(id);

		return {
			wellsCollectionId: isWellsCollections ? id : undefined,
			wellId: isWellsCollections ? undefined : id,
		};
	}

	return {
		wellsCollectionId: undefined,
		wellId: undefined,
	};
};

export const getWellsTableRowStyle = (wellsCollectionsQueryDataIdsSet: Set<string>) => (params: RowClassParams) => {
	const styles = {};
	let wellsCollectionId = '';
	let addBorderTop = false;
	let addBorderLeft = true;

	if (wellsCollectionsQueryDataIdsSet.has(params.data?._id)) {
		wellsCollectionId = params.data._id;
		addBorderTop = true;
	}
	// well under wells collection
	else if (params.node.level === 1) {
		if (params.node?.parent?.data?._id) {
			wellsCollectionId = params.node.parent.data._id;
		}
	}

	if (!addBorderTop) {
		const previous = params.api.getDisplayedRowAtIndex(params.rowIndex - 1);
		const currentRowIsTopLevelRow = params.node.level === 0;
		const previousRowExists = !!previous;
		const previousRowIsCollapsedWellsCollectionRow =
			currentRowIsTopLevelRow && previousRowExists && !!previous.data?.[WELLS_COLLECTION_FIELD_KEY];
		const previousRowIsLastWellsCollectionWell =
			previousRowExists &&
			currentRowIsTopLevelRow &&
			!previousRowIsCollapsedWellsCollectionRow &&
			previous.level > 0;

		if (previousRowIsCollapsedWellsCollectionRow) {
			addBorderTop = true;
			wellsCollectionId = previous.data._id;
		} else if (previousRowIsLastWellsCollectionWell && previous.parent?.data?._id) {
			addBorderTop = true;
			wellsCollectionId = previous.parent.data._id;
		}

		if (addBorderTop) {
			addBorderLeft = false;
		}
	}

	if (wellsCollectionId) {
		const border = `${stringToColor(wellsCollectionId)} solid 3px`;

		if (addBorderTop) {
			styles['borderTop'] = border;
		}

		if (addBorderLeft) {
			styles['borderLeft'] = border;
		}
	}

	return styles;
};

/**
 * Customized header template for adding a colored circle
 *
 * @see https://www.ag-grid.com/react-data-grid/column-headers/#header-templates
 */
export const projectCustomHeaderTemplate = `\
	<div class="ag-cell-label-container" role="presentation">
		<span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>
		<div ref="eLabel" class="ag-header-cell-label" role="presentation">
			<span class="${styles['colored-circle']}"></span>
			<span ref="eText" class="ag-header-cell-text" role="columnheader"></span>
			<span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>
			<span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>
			<span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>
			<span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>
			<span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>
		</div>
	</div>
	`;
