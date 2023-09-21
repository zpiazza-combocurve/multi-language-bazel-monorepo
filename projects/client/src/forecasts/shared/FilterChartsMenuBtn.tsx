import styled from 'styled-components';

import { CheckboxItem, CheckboxSelectItems, Divider, MenuButton } from '@/components/v2';
import { fields as DETERMINISTIC_FORECAST_SUB_TYPES } from '@/inpt-shared/display-templates/deterministic-forecast-data/deterministic-forecast-sub-types.json';
import { fields as DETERMINISTIC_FORECAST_TYPES } from '@/inpt-shared/display-templates/deterministic-forecast-data/deterministic-forecast-types.json';
import { fields as FORECAST_STATUS } from '@/inpt-shared/display-templates/forecast-data/forecast-status.json';

import { getItemsFromDt } from './ForecastMenuItems';

const Content = styled.div`
	max-width: 40vw;
	padding: 1.25rem;
`;

const Row = styled.div`
	column-gap: 1.25rem;
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-start;
`;

const Col = styled.div`
	margin-bottom: 1.5rem;
	min-width: 10vw;
	width: calc(33.3% - 0.875rem);
`;

const Title = styled.h2`
	font-size: 0.75rem;
	line-height: 1.5rem;
	margin-bottom: 0.5rem;
`;

function FilterChartsMenuBtn({
	applyForecastSubType,
	applyForecastType,
	applyPhases,
	applyStatuses,
	applyWarningFilter,
	disabled,
	disableWarningFilter,
	forecastSubTypes,
	forecastTypes,
	selectedPhases,
	statuses,
	warningStatus,
	...rest
}) {
	const all_phases = [
		{
			value: 'oil',
			label: 'Oil',
		},
		{
			value: 'gas',
			label: 'Gas',
		},
		{
			value: 'water',
			label: 'Water',
		},
	];

	const toggleWellFilter = () => {
		if (warningStatus) {
			disableWarningFilter();
		} else {
			applyWarningFilter();
		}
	};

	const approvalStatuses = getItemsFromDt(FORECAST_STATUS);
	const forecastTypesItems = getItemsFromDt(DETERMINISTIC_FORECAST_TYPES);
	const modelSubtype = getItemsFromDt(DETERMINISTIC_FORECAST_SUB_TYPES).sort((a, b) => (a.label < b.label ? -1 : 1));

	return (
		<MenuButton {...rest} label='Forecast Filter'>
			<Content>
				<Row>
					<Col>
						<Title>Phases with Forecast</Title>
						<Divider />
						<CheckboxSelectItems
							disabled={disabled}
							items={all_phases}
							onChange={applyPhases}
							value={selectedPhases}
						/>
					</Col>

					<Col>
						<Title>Approval Status</Title>
						<Divider />
						<CheckboxSelectItems
							disabled={disabled}
							items={approvalStatuses}
							onChange={applyStatuses}
							value={statuses}
						/>
					</Col>
					<Col>
						<Title>Forecast Model Type</Title>
						<Divider />
						<CheckboxSelectItems
							disabled={disabled}
							items={forecastTypesItems}
							onChange={applyForecastType}
							value={forecastTypes}
						/>
					</Col>
					<Col>
						<Title>Forecast Model Sub-Type</Title>
						<Divider />
						<CheckboxSelectItems
							disabled={disabled}
							items={modelSubtype}
							onChange={applyForecastSubType}
							value={forecastSubTypes}
						/>
					</Col>
					<Col>
						<Title>Auto Forecast Results</Title>
						<Divider />
						<CheckboxItem
							disabled={disabled}
							label='Show Wells with Warning'
							onChange={toggleWellFilter}
							value={warningStatus}
						/>
					</Col>
				</Row>
			</Content>
		</MenuButton>
	);
}

export default FilterChartsMenuBtn;
