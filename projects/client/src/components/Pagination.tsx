import { faChevronDown, faChevronLeft, faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { clamp } from 'lodash-es';
import { TextField as MdTextField, SelectField } from 'react-md';
import styled from 'styled-components';

import { useDerivedState, useId } from '@/components/hooks';
import { unlessProp } from '@/helpers/styled';

import Button from './Button';
import {
	DEFAULT_ITEMS_PER_PAGE,
	Pagination as PaginationType,
	usePaginatedArray,
	usePagination,
} from './hooks/usePagination';

export { usePagination, usePaginatedArray };

const TextField = styled(MdTextField)`
	input {
		text-align: center;
	}
	width: 2rem;
`;

function PageField({ value, onChange, max, ...props }) {
	const uniqueId = useId();
	const [state, setState] = useDerivedState(value + 1);
	const handleKeyUp = (event) => {
		if (event.keyCode === 13) {
			/* ENTER */
			onChange(clamp(state - 1, 0, max));
		}
	};
	return (
		<TextField
			id={uniqueId}
			{...props}
			type='number'
			value={state}
			onChange={setState}
			min={1}
			max={max + 1}
			onKeyUp={handleKeyUp}
		/>
	);
}

const Styled = styled.div<{ small?: boolean }>`
	align-items: center;
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	${unlessProp(
		'small',
		`
	& > *:not(:first-child) {
		margin-left: 0.75rem;
	}
`
	)}
`;

const PageControl = styled.section`
	display: flex;
	align-items: center;
`;

const StyledDisplaySection = styled.section`
	align-items: baseline;
	display: flex;
`;

const StyledSelectField = styled(SelectField)`
	width: 120px;
`;

const DisplaySelection = ({ menuItems, onChange, defaultValue, ...props }) => {
	return (
		<StyledDisplaySection {...props}>
			Items Per Page:
			<StyledSelectField
				id='__inpt_pagination_displaysection_selectfield'
				defaultValue={defaultValue}
				dropdownIcon={<FontAwesomeIcon icon={faChevronDown} />}
				menuItems={menuItems}
				onChange={onChange}
				placeholder='Select Value'
				simplifiedMenu={false}
				position={SelectField.Positions.BELOW} // HACK for styles
			/>
		</StyledDisplaySection>
	);
};

const DEFAULT_ITEMS_PER_PAGE_CHOICES = [10, 25, 50, 75, 100];

export function SmallPagination({
	className,
	pagination,
	disabled = false,
}: {
	pagination: PaginationType;
	disabled?: boolean;
	className?: string;
}) {
	const {
		itemsPerPage,

		page,
		startIndex,
		endIndex,
		total,

		onPrevPage,
		onNextPage,
		onChangePage,
	} = pagination;

	return (
		<Styled small className={className}>
			<span>
				{startIndex + 1} &mdash; {endIndex + 1}
				{total !== Infinity && ` of ${total}`}
			</span>
			<PageControl>
				<Button small onClick={onPrevPage} faIcon={faChevronLeft} disabled={disabled || startIndex === 0} />
				<PageField value={page} onChange={onChangePage} max={Math.ceil(total / itemsPerPage - 1)} />
				<Button
					small
					onClick={onNextPage}
					faIcon={faChevronRight}
					disabled={disabled || endIndex + 1 === total || endIndex === 0}
				/>
			</PageControl>
		</Styled>
	);
}

export function Pagination({
	itemsPerPageChoices = DEFAULT_ITEMS_PER_PAGE_CHOICES,
	disabled = false,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	pagination,
	disableItemsPerPage,
	...props
}: {
	disabled?: boolean;
	itemsPerPageChoices?: number[];
	disableItemsPerPage?: boolean;
} & ({ pagination: PaginationType } | PaginationType)) {
	const {
		itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
		onChangeItemsPerPage,

		page,
		startIndex,
		endIndex,
		total,

		onPrevPage,
		onNextPage,
		onChangePage,
	} = (pagination ?? props) as PaginationType;
	return (
		<Styled>
			{!disableItemsPerPage && (
				<DisplaySelection
					defaultValue={itemsPerPage}
					menuItems={itemsPerPageChoices}
					onChange={onChangeItemsPerPage}
				/>
			)}
			<span>
				Displaying: {startIndex + 1} &mdash; {endIndex + 1}
				{total !== Infinity && ` of ${total}`}
			</span>
			<PageControl>
				<Button onClick={onPrevPage} faIcon={faChevronLeft} disabled={disabled || startIndex === 0} />
				<PageField value={page} onChange={onChangePage} max={Math.ceil(total / itemsPerPage - 1)} />
				<Button
					onClick={onNextPage}
					faIcon={faChevronRight}
					disabled={disabled || endIndex + 1 === total || endIndex === 0}
				/>
			</PageControl>
		</Styled>
	);
}
