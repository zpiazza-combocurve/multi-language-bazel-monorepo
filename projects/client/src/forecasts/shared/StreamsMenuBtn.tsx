import { map, mapKeys, mapValues, truncate } from 'lodash';
import { useMemo } from 'react';
import styled from 'styled-components';

import { CheckboxSelectItems, MenuButton, MenuButtonProps } from '@/components/v2';
import { useMultipleCustomFields } from '@/helpers/headers';
import { theme } from '@/helpers/styled';

import {
	ALL_ITEMS_WITH_LABEL,
	DAILY_ITEMS,
	FORECAST_ITEMS,
	MONTHLY_ITEMS,
	VALID_BASE_CUSTOM_FIELDS,
} from '../charts/components/graphProperties';
import InfoMenuItem from './InfoMenuItem';

const Content = styled.div`
	padding: 15px;
	padding-top: 0;
	font-size: 0.75rem;
`;

export const Col = styled.div<{ withCheckboxes?: boolean }>`
	min-width: 175px;
	line-height: 38px;

	& > div {
		border-bottom: 1px solid ${theme.borderColor};
		max-height: 38px;
	}

	&:nth-of-type(1) div {
		display: block;
		width: 100%;
	}

	${({ withCheckboxes }) =>
		withCheckboxes &&
		`
		width: 80px;
		min-width: auto;

		div {
			padding: 0;
		}

		span + div {
			display: none;
		}
	`}
`;

export const Row = styled.div`
	display: flex;
	justify-content: flex-start;
`;

const StickyContainer = styled.div`
	position: sticky;
	top: -0.25px;
	z-index: 30;
	background-color: ${theme.background};

	${Col} {
		border-bottom: 1px solid ${theme.borderColor};
	}
`;

const withCustomFieldsLabels = (fieldItems: { value: string; label: string }[], customFields) =>
	fieldItems.map(({ value, label }) => ({ value, label: customFields?.[value] || label }));

// TODO: clean up collection logic / structure
const getCollectionSelectItems = (allItems, collection, keyPrefix) => {
	const collectionItems = map(collection, (item) => item.value);
	return map(allItems, (item) => ({
		key: `${keyPrefix}-${item.value}`,
		value: item.value,
		label: '',
		disabled: !collectionItems.includes(item.value),
	}));
};

// HACK: We need this to adjust the key stored in database
export const adjustedCustomFieldsKeyToData = (data, collection) => {
	if (data) {
		VALID_BASE_CUSTOM_FIELDS.forEach((key) => {
			data[`${key}${collection === 'daily' ? 'Daily' : 'Monthly'}`] = data[key];
		});
	}
	return data;
};

function StreamsMenuBtn(props) {
	const {
		daily,
		forecast,
		infoText,
		monthly,
		onChangeDaily,
		onChangeForecast,
		onChangeMonthly,
		...menuButtonProps
	}: MenuButtonProps & {
		daily: Set<string>;
		forecast: Set<string>;
		infoText?: string;
		monthly: Set<string>;
		onChangeDaily: (value) => void;
		onChangeForecast: (value) => void;
		onChangeMonthly: (value) => void;
	} = props;

	// const { data: monthlyCustomFields } = useCustomFields('monthly-productions');
	// const { data: dailyCustomFields } = useCustomFields('daily-productions');
	const customFieldsQuery = useMultipleCustomFields();

	// HACK: Adjust custom labeling and keys for just this component
	// TODO: Get together with the appropriate devs to see if we can adjust defaults so that this custom labeling / keys setup can be removed
	const items = useMemo(
		() =>
			withCustomFieldsLabels(
				withCustomFieldsLabels(
					ALL_ITEMS_WITH_LABEL,
					mapValues(
						mapKeys(customFieldsQuery?.data?.['monthly-productions'], (_value, key) => `${key}Monthly`),
						(value) => `${value} (Monthly)`
					)
				),
				mapValues(
					mapKeys(customFieldsQuery?.data?.['daily-productions'], (_value, key) => `${key}Daily`),
					(value) => `${value} (Daily)`
				)
			),
		[customFieldsQuery?.data]
	);

	const monthlySelectItems = getCollectionSelectItems(items, MONTHLY_ITEMS, 'monthly');
	const dailySelectItems = getCollectionSelectItems(items, DAILY_ITEMS, 'daily');
	const forecastSelectItems = getCollectionSelectItems(items, FORECAST_ITEMS, 'forecast');

	return (
		<MenuButton {...menuButtonProps} label='Streams'>
			<Content>
				<StickyContainer>
					<Row>
						<Col>Stream Name</Col>
						<Col withCheckboxes>Monthly</Col>
						<Col withCheckboxes>Daily</Col>
						<Col withCheckboxes>Forecast</Col>
					</Row>

					{infoText?.length && (
						<Row>
							<InfoMenuItem>{infoText}</InfoMenuItem>
						</Row>
					)}
				</StickyContainer>

				<Row>
					<Col>
						{items.map((item) => (
							<div key={`${item.label}-streams-dropdown`} title={item?.label?.length > 30 && item.label}>
								{truncate(item.label, { length: 30 })}
							</div>
						))}
					</Col>
					<Col withCheckboxes>
						<CheckboxSelectItems value={monthly} onChange={onChangeMonthly} items={monthlySelectItems} />
					</Col>
					<Col withCheckboxes>
						<CheckboxSelectItems value={daily} onChange={onChangeDaily} items={dailySelectItems} />
					</Col>
					<Col withCheckboxes>
						<CheckboxSelectItems value={forecast} onChange={onChangeForecast} items={forecastSelectItems} />
					</Col>
				</Row>
			</Content>
		</MenuButton>
	);
}

export default StreamsMenuBtn;
