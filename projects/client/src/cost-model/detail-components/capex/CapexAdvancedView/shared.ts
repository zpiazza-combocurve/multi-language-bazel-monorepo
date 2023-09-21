import { ColDef, ColGroupDef } from 'ag-grid-community';
import { capitalize, isEmpty, isObject } from 'lodash';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import { eltColumnDefinition } from '@/components/AdvancedTable/ag-grid-shared';
import { ROW_ID_KEY, SUPPORTED_DATE_PARSE_FORMATS, TREE_DATA_KEY } from '@/components/AdvancedTable/constants';
import { transformDateForAdvancedView, transformDateForEconFunc } from '@/components/AdvancedTable/shared';
import { ValidationInfoOptions } from '@/cost-model/detail-components/AdvancedModelView/shared';
import {
	CAPEX_OPTIONS_COMPLEX_ROWS,
	CAPEX_OTHER_COLUMNS,
	CAPEX_TEMPLATE_QUERY_KEY,
	CRITERIA_SPECIAL_OPTIONS,
} from '@/cost-model/detail-components/capex/CapexAdvancedView/constants';
import {
	CapexAssumption,
	CapexAssumptionNotEditableParts,
	CapexColumdData,
	CapexColumns,
	CapexRow,
	CapexTemplate,
	OtherCapexAssumptionRow,
	SimpleCapexData,
} from '@/cost-model/detail-components/capex/CapexAdvancedView/types';
import { GenerateNewModelHeaders } from '@/cost-model/detail-components/gen-data';
import { DT_QUERY_BASE } from '@/cost-model/detail-components/shared';
import { parseMultipleFormats } from '@/helpers/dates';
import { FieldType } from '@/inpt-shared/constants';
import { ModuleListEmbeddedLookupTableItem } from '@/lookup-tables/embedded-lookup-tables/types';

export const CAPEX_QUERY_KEYS = [DT_QUERY_BASE, CAPEX_TEMPLATE_QUERY_KEY];

const fieldTypeWithSelect = ['select', 'schedule-criteria-select'];

export const assumptionCapexToRows = (
	assumption: CapexAssumption,
	template: CapexTemplate,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setAssumptionParts: React.Dispatch<React.SetStateAction<any>>,
	elts: ModuleListEmbeddedLookupTableItem[]
) => {
	if (assumption) {
		// Temporary solution to save parts that are not editable in Capex Advanced View
		const assumptionNotEditableParts: CapexAssumptionNotEditableParts = {
			options: { ...assumption?.options },
			econ_function: { ...assumption?.econ_function },
		};

		if (assumptionNotEditableParts?.options?.other_capex) {
			delete assumptionNotEditableParts.options.other_capex;
		}

		if (assumptionNotEditableParts?.econ_function?.other_capex) {
			delete assumptionNotEditableParts.econ_function.other_capex;
		}

		setAssumptionParts(assumptionNotEditableParts);

		const rowsDataFromAssumption = assumption.econ_function.other_capex.rows;
		const templateData = template.other_capex.row_view.columns;

		const criteriaValues = [
			'offset_to_fpd',
			'offset_to_as_of_date',
			'offset_to_discount_date',
			'offset_to_first_segment',
			'offset_to_econ_limit',
			'fromSchedule',
			'oil_rate',
			'gas_rate',
			'water_rate',
			'total_fluid_rate',
		];

		const fromScheduleValues = template.other_capex.row_view.columns.criteria.fromSchedule.menuItems.map(
			({ value }) => value
		);
		const fromHeadersValues = template.other_capex.row_view.columns.criteria.fromHeaders.menuItems.map(
			({ value }) => value
		);

		const mapAssumptionToRow = (assumptionRowData: OtherCapexAssumptionRow, templateData: CapexColumns) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			const mappedRowEntries: [string, number | string][] = Object.entries(templateData)
				.map(
					([key, columnTemplateData]: [string, Required<CapexColumdData>]):
						| [string, number | string]
						| null => {
						if (key === 'escalation_start') {
							if (isObject(assumptionRowData[key])) {
								const [newValue] = Object.values(assumptionRowData[key]);
								return [key, newValue];
							}

							return [key, (columnTemplateData.Default as SimpleCapexData).label];
						}

						if (key === 'criteria') {
							return null;
						}

						if (fieldTypeWithSelect.includes(columnTemplateData.fieldType)) {
							const newValue = columnTemplateData.menuItems.find(
								(menuItem) => menuItem.value === assumptionRowData[key]
							);
							return [key, newValue?.label ?? (columnTemplateData.Default as SimpleCapexData).label];
						}

						if (!Object.keys(assumptionRowData).includes(key)) {
							if (typeof columnTemplateData.Default === 'object')
								return [key, columnTemplateData.Default?.label];
							return [key, columnTemplateData.Default];
						}

						return [key, assumptionRowData[key]];
					}
				)
				.filter((item) => item !== null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const rowData: any = Object.fromEntries(mappedRowEntries); // TODO: improve types

			// Adding criteria data
			Object.keys(assumptionRowData).forEach((key) => {
				if (key === 'date') {
					rowData.criteria_option = 'Date';
					const dateFromAssumption = parseMultipleFormats(
						assumptionRowData[key],
						SUPPORTED_DATE_PARSE_FORMATS
					);
					if (dateFromAssumption) rowData.criteria_value = transformDateForAdvancedView(dateFromAssumption);
				}
				if (criteriaValues.includes(key)) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					rowData.criteria_option = templateData.criteria.menuItems.find(({ value }) => value === key).label;
					rowData.criteria_value = assumptionRowData[key];
				}
				if (fromScheduleValues.includes(key)) {
					rowData.criteria_option = 'From Schedule';
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					rowData.criteria_from_option = templateData.criteria.fromSchedule.menuItems.find(
						({ value }) => value === key
					).label;
					rowData.criteria_value = assumptionRowData[key];
				}
				if (fromHeadersValues.includes(key)) {
					rowData.criteria_option = 'From Headers';
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					rowData.criteria_from_option = templateData.criteria.fromHeaders.menuItems.find(
						({ value }) => value === key
					).label;
					rowData.criteria_value = assumptionRowData[key];
				}
			});

			// Adding escalation data
			const escalationStartData = assumptionRowData?.escalation_start;

			let escalationStartOption = templateData.escalation_start.Default.label;
			let escalationStartValue: number | string = templateData.escalation_start.Default.Default;

			if (escalationStartData) {
				const menuItemValue = Object.keys(escalationStartData)[0];
				escalationStartOption =
					templateData.escalation_start.menuItems.find(({ value }) => value === menuItemValue)?.label ||
					escalationStartOption;

				const dateFromAssumption = parseMultipleFormats(
					escalationStartData[menuItemValue],
					SUPPORTED_DATE_PARSE_FORMATS
				);

				switch (escalationStartOption) {
					case 'Date':
						escalationStartValue = dateFromAssumption
							? transformDateForAdvancedView(dateFromAssumption)
							: '';
						break;
					default:
						escalationStartValue = escalationStartData[menuItemValue];
				}
			}

			rowData.escalation_start_option = escalationStartOption;
			rowData.escalation_start_value = escalationStartValue;

			delete rowData.escalation_start;

			rowData[ROW_ID_KEY] = uuidv4();

			return rowData;
		};

		return [
			...rowsDataFromAssumption.map((assumptionRowData) => mapAssumptionToRow(assumptionRowData, templateData)),
			...(assumption.embeddedLookupTables ?? ([] as Inpt.ObjectId<'embedded-lookup-table'>[])).map((_id) => {
				return {
					[ROW_ID_KEY]: uuidv4(),
					isELTRow: true,
					eltId: _id,
					eltName: elts.find((elt) => elt._id === _id)?.name,
				};
			}),
		];
	}

	return [];
};

export const rowsCapexToAssumption = (rows, template, assumptionParts, elts: ModuleListEmbeddedLookupTableItem[]) => {
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	const options = GenerateNewModelHeaders(template);
	const embeddedLookupTables: Inpt.ObjectId<'embedded-lookup-table'>[] = [];

	const templateData: CapexColumns = template.other_capex.row_view.columns;

	const mapRowToAssumption = (rowData, templateData: CapexColumns) => {
		if (rowData.eltName) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			embeddedLookupTables.push(elts.find((elt) => rowData.eltName === elt.name)!._id);
			return null;
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		const mappedAssumptionEntries = Object.entries(templateData).reduce((acc: [], [key, data]) => {
			if (key === 'criteria') {
				const menuItem = data.menuItems.find(({ label }) => label === rowData.criteria_option);
				const newKey = menuItem?.value || data.Default.value;

				if (CRITERIA_SPECIAL_OPTIONS.includes(newKey)) {
					const secondaryOptionValue = data[newKey].menuItems.find(
						({ label }) => label === rowData.criteria_from_option
					).value;
					const newValue = Number(rowData.criteria_value ?? menuItem.Default);
					return [...acc, [newKey, secondaryOptionValue], [secondaryOptionValue, newValue]];
				}

				const newValue =
					newKey === 'date'
						? transformDateForEconFunc(rowData.criteria_value)
						: Number(rowData.criteria_value ?? menuItem.Default.Default);
				return [...acc, [newKey, newValue]];
			}

			if (key === 'escalation_start') {
				const escalationOption =
					data.menuItems.find(({ label }) => label === rowData.escalation_start_option)?.value ||
					data.Default.value;
				const escalationValue =
					escalationOption === 'date'
						? transformDateForEconFunc(rowData.escalation_start_value)
						: Number(rowData?.escalation_start_value || data.Default.Default);

				return [...acc, [key, { [escalationOption]: escalationValue }]];
			}

			if (fieldTypeWithSelect.includes(data?.fieldType)) {
				const newValue =
					data.menuItems.find(({ label }) => label === rowData[key])?.value || data.Default.value;
				return [...acc, [key, newValue]];
			}

			if (!rowData[key]) {
				return [...acc, [key, data?.Default ?? '']];
			}

			if (data.fieldType === FieldType.number) {
				return [...acc, [key, Number(rowData[key])]];
			}

			return [...acc, [key, rowData[key]]];
		}, []);

		return Object.fromEntries(mappedAssumptionEntries);
	};

	const generateRowForOptions = (rowData, templateColumnsData: CapexColumns) => {
		const mappedOptionsOtherCapexEntries = Object.entries(templateColumnsData).map(([key, data]) => {
			if (CAPEX_OPTIONS_COMPLEX_ROWS.includes(key)) {
				const isCriteria = key === 'criteria';
				const keyToSearch = isCriteria ? 'criteria_option' : 'escalation_start_option';
				const keyWithValue = isCriteria ? 'criteria_value' : 'escalation_start_value';

				const criteriaFromOption = isCriteria && rowData.criteria_from_option;

				const menuItem = data.menuItems.find(({ label }) => label === rowData[keyToSearch]) || {};

				let valueToPass =
					menuItem.fieldType === FieldType.date
						? `${transformDateForEconFunc(rowData[keyWithValue])}T00:00:00.000Z`
						: Number(rowData[keyWithValue]);

				if (typeof valueToPass === 'number' && isNaN(valueToPass)) {
					valueToPass = menuItem?.Default || 0;
				}

				if (criteriaFromOption) {
					const fromOptionMenuItem = data[menuItem.value].menuItems.find(
						({ label }) => label === criteriaFromOption
					);
					const keyFromValue = `${menuItem.value}Value`;
					return [
						key,
						{
							criteria: { ...menuItem },
							value: menuItem.Default,
							[menuItem.value]: fromOptionMenuItem,
							[keyFromValue]: valueToPass,
						},
					];
				}

				return [key, { criteria: { ...menuItem }, value: valueToPass }];
			}

			if (fieldTypeWithSelect.includes(data?.fieldType)) {
				const newValue = data.menuItems.find(({ label }) => label === rowData[key]) || data.Default;
				return [key, newValue];
			}

			if (!rowData[key] && data.fieldType !== FieldType.number) {
				return [key, data?.Default || ''];
			}

			if (data.fieldType === FieldType.number) {
				return [key, Number(rowData[key])];
			}

			return [key, rowData[key] ?? ''];
		});

		return Object.fromEntries(mappedOptionsOtherCapexEntries);
	};

	options.other_capex.row_view.rows = rows
		.filter((row) => !row.isELTRow)
		.map((rowData) => generateRowForOptions(rowData, templateData));

	options.drilling_cost.omitSection = true;
	options.completion_cost.omitSection = true;

	if (!isEmpty(assumptionParts)) {
		options.drilling_cost = {
			...assumptionParts.options.drilling_cost,
		};
		options.completion_cost = {
			...assumptionParts.options.completion_cost,
		};
	}

	const assumptionOtherCapexData = rows
		.map((rowData) => mapRowToAssumption(rowData, templateData))
		//null row is elt rows
		.filter((row) => row);

	return {
		options,
		econ_function: {
			...assumptionParts.econ_function,
			other_capex: {
				rows: assumptionOtherCapexData,
			},
		},
		embeddedLookupTables,
	};
};

export const getCAPEXColumnLabel = (field: string): string => {
	if (!field) {
		return '';
	}

	switch (field) {
		case 'deal_terms':
			return 'Paying WI ÷ Earning WI';

		case 'depreciation_model':
			return 'DD&A';

		case 'tangible':
			return 'Tangible ($M)';

		case 'intangible':
			return 'Intangible ($M)';

		case 'capex_expense':
			return 'CAPEX / Expense';

		default:
			return field
				.split('_')
				.map((word) => capitalize(word))
				.join(' ');
	}
};

export const getCapexColumnsDef = (enableELTColumn: boolean): ColGroupDef[] => {
	const capexChildren: ColDef[] = [];

	if (enableELTColumn) {
		capexChildren.push(eltColumnDefinition);
	}

	capexChildren.push(...CAPEX_OTHER_COLUMNS.map((field) => ({ field, headerName: getCAPEXColumnLabel(field) })));

	return [
		{
			headerName: 'CAPEX',
			children: capexChildren,
		},
	];
};

export const addCustomHeadersData = (templateFields, columnNames) => {
	const updatedTemplateFields = { ...templateFields };

	// TODO: Investigate how to get proper custom headers from DB
	// There is only 10 possible custom headers and we're can't fetch them from DB, so we need this temporary hack
	for (let i = 0; i < 10; i++) {
		const isCustomHeaderFound =
			updatedTemplateFields.other_capex.row_view.columns.criteria.fromHeaders.menuItems.some((item) => {
				if (item.value === `offset_to_custom_date_${i}`) {
					return true;
				}
				return false;
			});
		if (!isCustomHeaderFound) {
			updatedTemplateFields.other_capex.row_view.columns.criteria.fromHeaders.menuItems.push({
				Default: 0,
				required: true,
				label: columnNames[`custom_date_${i}`],
				value: `offset_to_custom_date_${i}`,
				fieldType: 'number',
				max: 20000,
				min: -20000,
				valType: 'days',
			});
		}
	}

	return updatedTemplateFields;
};

export function addTreeDataInfo(rowData: CapexRow[]): CapexRow[] {
	let eltLinesParentRow: CapexRow | null = null;

	return rowData.map((row) => {
		const path: string[] = [];

		if (row.isELTRow) {
			eltLinesParentRow = row;
		}

		if (eltLinesParentRow && row.isFromELTDataLines) {
			path.push(eltLinesParentRow[ROW_ID_KEY]);
		}

		path.push(row[ROW_ID_KEY]);

		return { ...row, [TREE_DATA_KEY]: path };
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const createOtherCapexDefaultTemplate = (template: any) => {
	const otherCapexColumnsTemplate: CapexColumdData = template.other_capex.row_view.columns;

	const defaultTemplate = Object.fromEntries(
		Object.entries(otherCapexColumnsTemplate).map(
			([columnKey, columnData]: [string, CapexColumdData]): [string, string | number] => [
				columnKey,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				columnData?.Default?.label ?? columnData?.Default,
			]
		)
	);

	defaultTemplate.description = '';

	delete defaultTemplate.criteria;

	defaultTemplate.criteria_option = 'FPD';
	defaultTemplate.criteria_value = -120;

	delete defaultTemplate.escalation_start;

	defaultTemplate.escalation_start_option = 'Apply To Criteria';
	defaultTemplate.escalation_start_value = 0;

	return defaultTemplate;
};

export const validationOptions: ValidationInfoOptions<CapexRow> = {
	skipNestedRowKeyCheck: true,
	skipRowValidationWithParentData: true,
	includeInContext: { parentRow: true, eltsCount: true },
	filterContextBy: ['parentRow', 'prevRow', 'eltsCount'],
};
