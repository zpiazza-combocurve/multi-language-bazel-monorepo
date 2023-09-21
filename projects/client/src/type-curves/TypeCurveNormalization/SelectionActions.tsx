import {
	faArrowAltFromBottom as faFilterOut,
	faArrowAltToBottom as faFilterTo,
	faTimes,
} from '@fortawesome/pro-regular-svg-icons';
import { useState } from 'react';
import styled from 'styled-components';

import { IconButton } from '@/components/v2';
import { SelectField } from '@/components/v2/misc';
import { theme } from '@/helpers/styled';

const Text = styled.span`
	color: ${theme.secondaryColor};
	margin: 0 0;
`;

const Wrapper = styled.div`
	align-items: center;
	column-gap: 0.5rem;
	display: flex;
	min-height: 35px;
`;

const filterActionMenuItems = [
	{ label: 'Filter Out', value: 'out' },
	{ label: 'Filter To', value: 'to' },
];

interface SelectionActionProps {
	className?: string;
	clearCurrentActive?: boolean;
	disableActionsWithoutSelection?: boolean;
	iconsOnly?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	selection: any;
	small?: boolean;
}
export default function SelectionActions({
	className,
	clearCurrentActive,
	disableActionsWithoutSelection,
	iconsOnly = true,
	selection,
	small,
}: SelectionActionProps) {
	const {
		selectedSet: { size: selectedCount },
		filteredSet: { size: filteredCount },
		allSize,
		filterTo,
		filterOut,
		resetFilter,
	} = selection;

	const size = small ? 'small' : undefined;
	const [filterAction, setFilterAction] = useState<'out' | 'to'>('out');

	const filterToRender = (
		<IconButton
			color='secondary'
			disabled={!selectedCount}
			tooltipTitle='Filter To'
			onClick={() => filterTo()}
			size={size}
		>
			{faFilterTo}
		</IconButton>
	);

	const filterOutRender = (
		<IconButton
			color='secondary'
			disabled={!selectedCount}
			tooltipTitle='Filter Out'
			onClick={() => filterOut()}
			size={size}
		>
			{faFilterOut}
		</IconButton>
	);

	const selectedActions =
		selectedCount || disableActionsWithoutSelection ? (
			<>
				<Text>{selectedCount}</Text>

				{iconsOnly ? (
					<>
						{filterTo && filterToRender}
						{filterOut && filterOutRender}
					</>
				) : (
					<>
						<SelectField
							menuItems={filterActionMenuItems}
							onChange={(ev) => setFilterAction(ev.target.value as 'out' | 'to')}
							size='small'
							value={filterAction}
							variant='outlined'
						/>

						{filterAction === 'out' ? filterOutRender : filterToRender}
					</>
				)}
			</>
		) : null;

	const isResetButtonDisabled = filteredCount === allSize && !selectedCount;
	const filterOutActions =
		(clearCurrentActive && selectedCount) || !iconsOnly ? (
			<IconButton
				color='secondary'
				disabled={isResetButtonDisabled}
				tooltipTitle='Reset'
				onClick={() => resetFilter()}
				size={size}
			>
				{faTimes}
			</IconButton>
		) : null;

	if (!selectedActions && !filterOutActions) {
		return <div />;
	}
	return (
		<Wrapper className={className}>
			{selectedActions}
			{filterOutActions}
		</Wrapper>
	);
}
