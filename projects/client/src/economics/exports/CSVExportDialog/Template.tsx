import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import produce from 'immer';
import { useCallback, useMemo } from 'react';

import AutocompleteWithCheckboxes from '@/components/AutocompleteWithCheckboxes';
import SelectedItemContainer from '@/components/SelectedItemContainer';
import { Button, TextField, Typography } from '@/components/v2';
import {
	CASHFLOW_REPORT_OPTIONS,
	EMPTY_TEMPLATE,
	HYBRID_YEAR_TYPE,
	ID,
	MAX_ECON_LIFE,
	MIN_ECON_LIFE,
} from '@/economics/Economics/shared/constants';
import { ValueOrFunction, assert } from '@/helpers/utilities';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

import { ReportingOptions } from './Template/index';
import { CSVExportTemplate, SelectedOption, isPeriodInRange, useColumnsOptions, useHeaderOptions } from './index';

export function Template({
	template,
	setTemplate,
}: // loading,
{
	template: CSVExportTemplate;
	setTemplate: (template: ValueOrFunction<CSVExportTemplate, [CSVExportTemplate]>) => void;
	loading?: boolean;
}) {
	const { cashflowOptions, type: reportType } = template;

	const updateTemplate = useCallback(
		(fn: (draft: CSVExportTemplate, value) => void): ((event) => void) => {
			return (event) => {
				setTemplate(
					produce((draft) => {
						draft.cashflowOptions ??= EMPTY_TEMPLATE.cashflowOptions;
						assert(draft.cashflowOptions);
						draft.cashflowOptions.hybridOptions ??= EMPTY_TEMPLATE.cashflowOptions.hybridOptions;
						fn(draft, event.target.value);
					})
				);
			};
		},
		[setTemplate]
	);

	const handleChangeName = useMemo(
		() =>
			updateTemplate((draft, value) => {
				draft.name = value;
			}),
		[updateTemplate]
	);

	const handleChangeCashflowReportType = useMemo(
		() =>
			updateTemplate((draft, value) => {
				assert(draft.cashflowOptions);
				draft.cashflowOptions.type = value;
			}),
		[updateTemplate]
	);

	const handleChangeTimePeriod = useMemo(
		() =>
			updateTemplate((draft, value) => {
				assert(draft.cashflowOptions);
				draft.cashflowOptions.timePeriods = value ? Math.trunc(value) : value;
			}),
		[updateTemplate]
	);

	const handleToggleTimePeriod = useMemo(
		() =>
			updateTemplate((draft) => {
				assert(draft.cashflowOptions);
				draft.cashflowOptions.useTimePeriods = !draft.cashflowOptions.useTimePeriods;
			}),
		[updateTemplate]
	);

	const handleChangeHybridYearType = useMemo(
		() =>
			updateTemplate((draft, value) => {
				assert(draft?.cashflowOptions?.hybridOptions);
				draft.cashflowOptions.hybridOptions.yearType = value;
			}),
		[updateTemplate]
	);

	const handleChangeHybridMonths = useMemo(
		() =>
			updateTemplate((draft, value) => {
				assert(draft?.cashflowOptions?.hybridOptions);
				draft.cashflowOptions.hybridOptions.months = value;
			}),
		[updateTemplate]
	);

	const isOneliner = reportType === 'oneLiner';
	const isHybrid = cashflowOptions?.type === 'hybrid';

	const isHybridMonthValid =
		isHybrid && isPeriodInRange(cashflowOptions.hybridOptions?.months, MIN_ECON_LIFE, MAX_ECON_LIFE);

	const isTimePeriodsValid =
		!cashflowOptions?.useTimePeriods || isPeriodInRange(cashflowOptions?.timePeriods, MIN_ECON_LIFE, MAX_ECON_LIFE);

	const selectedItems = template.columns;

	const isItemSelected = useMemo(() => {
		const keys = selectedItems.map(({ key }) => key);
		const selectedItemsSet = new Set(keys);
		return (key) => selectedItemsSet.has(key);
	}, [selectedItems]);

	const headerOptions = useHeaderOptions(reportType, isItemSelected);
	const columnsOptions = useColumnsOptions(reportType, cashflowOptions?.type, isItemSelected);

	const handleSelectAllHeaders = useMemo(
		() =>
			updateTemplate((draft) => {
				const prevStateHeadersKeys = draft.columns
					.filter((item) => item.keyType === 'header')
					.map(({ key }) => key);
				const headerOptionsToAdd = headerOptions.filter(({ key }) => !prevStateHeadersKeys.includes(key));
				draft.columns = [
					...draft.columns,
					...headerOptionsToAdd.map((option) => ({ ...option, selected: true })),
				];
			}),
		[headerOptions, updateTemplate]
	);

	const handleSelectAllOutputColumns = useMemo(
		() =>
			updateTemplate((draft) => {
				const prevStateColumnKeys = draft.columns
					.filter((item) => item.keyType === 'column')
					.map(({ key }) => key);
				const columnOptionsToAdd = columnsOptions.filter(({ key }) => !prevStateColumnKeys.includes(key));

				draft.columns = [
					...draft.columns,
					...columnOptionsToAdd.map((option) => ({ ...option, selected: true })),
				];
			}),
		[columnsOptions, updateTemplate]
	);

	const handleClearAllSelected = useMemo(
		() =>
			updateTemplate((draft) => {
				draft.columns = [];
			}),
		[updateTemplate]
	);

	const handleOptionCheck = useCallback(
		(keyToChange, keyType) => {
			return () => {
				const currentOption =
					keyType === 'header'
						? headerOptions.find(({ key }) => key === keyToChange)
						: columnsOptions.find(({ key }) => key === keyToChange);

				if (!currentOption) return;

				const newCheckedState = !currentOption.selected;

				if (newCheckedState) {
					setTemplate(
						produce((draft) => {
							draft.columns.push({
								...currentOption,
								selected: newCheckedState,
							});
						})
					);
				} else {
					setTemplate(
						produce((draft) => {
							draft.columns = draft.columns.filter(({ key }) => key !== keyToChange);
						})
					);
				}
			};
		},
		[headerOptions, columnsOptions, setTemplate]
	);

	const handleSort = useCallback(
		(changedItems: SelectedOption[]) => {
			setTemplate(
				produce((draft) => {
					draft.columns = changedItems;
				})
			);
		},
		[setTemplate]
	);

	const handleDeleteSelectedItem = useCallback(
		(keyToDelete: string) => {
			setTemplate(
				produce((draft) => {
					draft.columns = draft.columns.filter(({ key }) => key !== keyToDelete);
					const deletedItem = draft.columns.find(({ key }) => key === keyToDelete);

					if (deletedItem?.sortingOptions) {
						draft.columns.forEach((option) => {
							if (
								option?.sortingOptions?.priority &&
								deletedItem?.sortingOptions &&
								option.sortingOptions.priority > deletedItem.sortingOptions.priority
							) {
								option.sortingOptions.priority -= 1;
							}
						});
					}
				})
			);
		},
		[setTemplate]
	);

	const handleChangeSortingOptions = useCallback(
		(keyToChange) => {
			setTemplate(
				produce((draft) => {
					const optionIndex = draft.columns.findIndex(({ key }) => key === keyToChange);

					const optionToChange = draft.columns[optionIndex];

					const optionsWithPriority = draft.columns.filter(({ sortingOptions }) => sortingOptions);

					if (optionToChange.sortingOptions) {
						if (optionToChange.sortingOptions.direction === 'ASC') {
							optionToChange.sortingOptions.direction = 'DESC';
						} else {
							const deletedPriority = optionToChange.sortingOptions.priority;

							delete optionToChange.sortingOptions;

							draft.columns.forEach((option) => {
								if (
									option?.sortingOptions?.priority &&
									option?.sortingOptions?.priority > deletedPriority
								) {
									option.sortingOptions.priority -= 1;
								}
							});
						}
					} else {
						optionToChange.sortingOptions = {
							priority: optionsWithPriority.length,
							direction: 'ASC',
						};
					}
				})
			);
		},
		[setTemplate]
	);

	return (
		<Section disableOverflow>
			<SectionHeader
				css={`
					& > :not(:first-child) {
						margin-top: 0.5rem;
					}
				`}
			>
				<div
					css={`
						display: flex;
						& > * {
							flex: 1 1 0;
							&:not(:first-child) {
								padding-left: 1rem;
							}
						}
					`}
				>
					<div>
						<Typography variant='subtitle1'>Settings</Typography>
						<TextField
							fullWidth
							id={ID.templateName}
							label='Template Name'
							variant='outlined'
							value={template.name ?? ''}
							onChange={handleChangeName}
						/>
					</div>

					<ReportingOptions
						id={ID.cashflowReportFormGroup}
						title='Cash Flow Reporting'
						onChangeRadioButton={handleChangeCashflowReportType}
						onChangeTimePeriod={handleChangeTimePeriod}
						disabled={isOneliner}
						radioOptions={CASHFLOW_REPORT_OPTIONS}
						radioGroupName='cashflow-report-type'
						radioValue={isOneliner ? null : cashflowOptions?.type}
						timeFieldValue={cashflowOptions?.timePeriods}
						timeFieldLabel='# of Time Periods'
						isValid={isTimePeriodsValid}
						errorMessage={`# of Time Periods must be between ${MIN_ECON_LIFE} and ${MAX_ECON_LIFE}`}
						checkboxLabel='Aggregate remaining after # of periods'
						checkboxTooltip='Aggregates all remaining cash flow periods that occur after the specified amount and reports the result at the economic limit.'
						showCheckboxForInput
						checkboxStatus={cashflowOptions?.useTimePeriods}
						onChangeCheckbox={handleToggleTimePeriod}
						variant='vertical-radio-btns'
					/>
					<ReportingOptions
						id={ID.cashflowReportHybidFormGroup}
						title='Hybrid Reporting'
						onChangeRadioButton={handleChangeHybridYearType}
						onChangeTimePeriod={handleChangeHybridMonths}
						disabled={!isHybrid || isOneliner}
						radioOptions={HYBRID_YEAR_TYPE}
						radioGroupName='cashflow-hybrid-year-type'
						radioValue={cashflowOptions?.hybridOptions?.yearType}
						timeFieldValue={cashflowOptions?.hybridOptions?.months}
						timeFieldLabel='# of Months'
						isValid={!isHybrid || isHybridMonthValid}
						errorMessage={`# of Months must be between ${MIN_ECON_LIFE} and ${MAX_ECON_LIFE}`}
					/>
				</div>
				<div
					css={`
						display: flex;
						& > * {
							flex: 1 1 0;
						}
					`}
				>
					<AutocompleteWithCheckboxes
						css={`
							padding-right: 0.5rem;
						`}
						placeholder='Headers'
						type='header'
						options={headerOptions}
						onOptionClick={handleOptionCheck}
						title='Headers to Include'
						circleColor={projectCustomHeaderColor}
					/>
					<AutocompleteWithCheckboxes
						css={`
							padding-left: 0.5rem;
						`}
						placeholder='Output Columns'
						type='column'
						options={columnsOptions}
						onOptionClick={handleOptionCheck}
						title='Output Columns to Include'
					/>
				</div>
				<div
					css={`
						& > button:not(:first-child) {
							margin-left: 0.5rem;
						}
					`}
				>
					<Button
						startIcon={faPlus}
						variant='outlined'
						onClick={handleSelectAllHeaders}
						color='secondary'
						css={`
							text-transform: none;
						`}
					>
						Add All Headers
					</Button>
					<Button
						startIcon={faPlus}
						variant='outlined'
						onClick={handleSelectAllOutputColumns}
						color='secondary'
						css={`
							text-transform: none;
						`}
					>
						Add All Output Columns
					</Button>
					<Button
						variant='outlined'
						onClick={handleClearAllSelected}
						css={`
							text-transform: none;
						`}
					>
						Clear All
					</Button>
				</div>
			</SectionHeader>
			<SectionContent
				css={`
					position: relative;
					margin-top: 0.5rem;
				`}
				disableOverflow={false}
			>
				<div
					id={ID.headersAndOutputColumnsGroup}
					css={`
						position: absolute;
						top: -8rem;
						bottom: 0;
						left: 0;
						width: 100%;
					`}
				/>
				<SelectedItemContainer
					items={selectedItems}
					onDeleteItem={handleDeleteSelectedItem}
					onSort={handleSort}
					onSortPriorityChange={handleChangeSortingOptions}
					circleColor={projectCustomHeaderColor}
				/>
			</SectionContent>
		</Section>
	);
}

export default Template;
