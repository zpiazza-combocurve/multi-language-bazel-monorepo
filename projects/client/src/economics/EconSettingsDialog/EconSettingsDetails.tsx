import { faMinusCircle, faPlusCircle } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import { groupBy, keyBy } from 'lodash';
import { Fragment, useState } from 'react';
import { TableBody, TableColumn, TableHeader, TableRow } from 'react-md';
import AutoSizer from 'react-virtualized-auto-sizer';
import styled from 'styled-components';

import { DataTable } from '@/components';
import { Checkbox, Icon, InfoTooltipWrapper } from '@/components/v2';

import { EconColumnItem } from './EconColumnItem';
import { OPTION_TYPE } from './shared';
import { createDefaultColumnValue } from './useEconSettings';

const StyledTableHeader = styled(TableHeader)`
	.md-table-column--header {
		font-size: 1.25rem;
	}
`;

const StyledTableRow = styled(TableRow)`
	cursor: pointer;
`;

// extract from removed styles // TODO: improve later
const StyledTableColumn = styled(TableColumn)`
	align-items: center;
	display: flex;

	& > *:not(:first-child) {
		margin-left: 0.5rem;
	}
`;

const CATEGORY_TOOLTIPS = {
	'Income Tax':
		'Income Tax columns will only display if "Yes" is selected in Income Tax option in the General Options',
};

export const EconSettingsDetails = (props) => {
	const [expanded, setExpanded] = useState({});

	const { setting, fields, onChange } = props;

	const handleToggleColumn = (columnKey, option) => {
		onChange({
			...setting,
			columns: setting.columns.map((column) => {
				if (column.key !== columnKey) {
					return column;
				}
				return produce(column, (draft) => {
					draft.selected_options[option] = !draft.selected_options[option];
				});
			}),
		});
	};

	const toggleCategory = (category) => {
		setExpanded((prevExpanded) => ({ ...prevExpanded, [category]: !expanded[category] }));
	};

	const changeAllInCategory = (category, option, value) => {
		onChange(
			produce(setting, (draft) => {
				draft.columns.forEach((column) => {
					if (fields[column.key].category === category && fields[column.key].options[option]) {
						column.selected_options[option] = value;
					}
				});
			})
		);
	};

	const columnsByCategory = groupBy(Object.keys(fields), (key) => fields[key].category);
	const someExpanded = !!Object.keys(expanded).find((key) => !!expanded[key]);
	const columnSettingByKey = keyBy(setting.columns, 'key');

	const renderToggleAllColumn = (category, option) => {
		const validInCategory = columnsByCategory[category].filter((column) => fields[column].options[option]);
		const allChecked =
			validInCategory.length > 0 &&
			// all checked if there are none that are not marked
			!validInCategory.find((column) => !columnSettingByKey[column].selected_options[option]);
		return (
			<TableColumn>
				<Checkbox
					disabled={validInCategory.length === 0}
					checked={allChecked}
					onChange={(ev) => {
						changeAllInCategory(category, option, ev.target.checked);
					}}
					onClick={(ev) => {
						ev.stopPropagation();
					}}
				/>
			</TableColumn>
		);
	};

	return (
		<AutoSizer disableWidth>
			{({ height }) => (
				<DataTable fixedHeight={height} fullWidth plain responsive>
					<StyledTableHeader>
						<TableRow>
							<TableColumn>{someExpanded ? 'Group / Column' : 'Group'}</TableColumn>
							<TableColumn>One-line Summary</TableColumn>
							<TableColumn>Monthly</TableColumn>
							<TableColumn>Cumulative</TableColumn>
						</TableRow>
					</StyledTableHeader>
					<TableBody>
						{Object.keys(columnsByCategory)
							.filter((category) => !!category)
							.map((category) => {
								return (
									<Fragment key={category}>
										<StyledTableRow
											onClick={() => toggleCategory(category)}
											css={`
												background-color: var(--grey-color-opaque);
											`}
										>
											<StyledTableColumn>
												<Icon>{expanded[category] ? faMinusCircle : faPlusCircle}</Icon>
												<span>
													<InfoTooltipWrapper
														tooltipTitle={CATEGORY_TOOLTIPS[category]}
														placeIconAfter
													>
														{`${category} (${columnsByCategory[category].length})`}
													</InfoTooltipWrapper>
												</span>
											</StyledTableColumn>
											{renderToggleAllColumn(category, OPTION_TYPE.ONE_LINER_KEY)}
											{renderToggleAllColumn(category, OPTION_TYPE.MONTHLY_KEY)}
											{renderToggleAllColumn(category, OPTION_TYPE.AGGREGATE_KEY)}
										</StyledTableRow>
										{expanded[category]
											? columnsByCategory[category].map((key) => (
													<EconColumnItem
														key={key}
														columnKey={key}
														columnTemplate={fields[key]}
														columnValue={
															setting.columns.find((column) => column.key === key) ||
															createDefaultColumnValue(key, fields)
														}
														onToggleColumn={handleToggleColumn}
													/>
											  ))
											: []}
									</Fragment>
								);
							})}
					</TableBody>
				</DataTable>
			)}
		</AutoSizer>
	);
};
