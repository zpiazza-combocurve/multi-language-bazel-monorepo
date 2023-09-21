import {
	faArrowAltFromBottom as faFilterOut,
	faArrowAltToBottom as faFilterTo,
	faTimes,
} from '@fortawesome/pro-regular-svg-icons';
import styled from 'styled-components';

import { space } from '@/helpers/styled';

import { Text as RawText } from './Text';
import { IconButton } from './v2';

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	min-height: 35px;

	& > :not(:first-child) {
		margin-left: ${space.xs};
	}
`;

const Text = styled(RawText).attrs({ type: 'secondary' })`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	margin: 0 0.75rem;
`;

interface OriginalProps {
	selectedCount: number;
	filteredOutCount?: number;
	onClearFilter: () => void;
	onFilterTo?: () => void;
	onFilterOut?: () => void;
	small?: boolean;
	clearCurrentActive?: boolean;
	labelFilterTo?: string;
	labelFilterOut?: string;
	labelClearFilter?: string;
	buttonSize?: 'small' | 'medium';
}

function SelectionActionsLegacy({
	buttonSize,
	clearCurrentActive,
	filteredOutCount,
	labelClearFilter = 'Reset',
	labelFilterOut = 'Filter Out',
	labelFilterTo = 'Filter To',
	onClearFilter,
	onFilterOut,
	onFilterTo,
	selectedCount,
}: OriginalProps) {
	const selectedActions = selectedCount ? (
		<>
			<Text>{selectedCount}</Text>
			{onFilterTo && (
				<IconButton
					tooltipTitle={labelFilterTo}
					onClick={() => onFilterTo()}
					color='secondary'
					size={buttonSize}
				>
					{faFilterTo}
				</IconButton>
			)}
			{onFilterOut && (
				<IconButton
					tooltipTitle={labelFilterOut}
					onClick={() => onFilterOut()}
					color='secondary'
					size={buttonSize}
				>
					{faFilterOut}
				</IconButton>
			)}
		</>
	) : null;
	const filteredOutActions =
		filteredOutCount || (clearCurrentActive && selectedCount) ? (
			<IconButton tooltipTitle={labelClearFilter} onClick={onClearFilter} color='secondary' size={buttonSize}>
				{faTimes}
			</IconButton>
		) : null;
	if (!selectedActions && !filteredOutActions) {
		return <div />;
	}
	return (
		<Wrapper>
			{selectedActions}
			{filteredOutActions}
			{Boolean(filteredOutCount) && <Text>Filtered Out: {filteredOutCount}</Text>}
		</Wrapper>
	);
}

type SelectionActionsProps =
	| ({
			selection: import('./hooks/useSelection').Selection | import('./hooks/useSelectionFilter').SelectionFilter;
	  } & Pick<OriginalProps, 'small' | 'filteredOutCount' | 'clearCurrentActive'>)
	| (OriginalProps & { selection?: never });

export function SelectionActions(props: SelectionActionsProps) {
	if (props.selection) {
		if ('filterTo' in props.selection && props.selection.filterTo) {
			return (
				<SelectionActionsLegacy
					// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
					onClearFilter={props.selection.resetFilter}
					// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
					onFilterOut={props.selection.filterOut}
					// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
					onFilterTo={props.selection.filterTo}
					selectedCount={props.selection.selectedSet.size}
					// @ts-expect-error TODO fix later
					filteredOutCount={props.selection.all.length - props.selection.filteredSet.size}
					{...props}
				/>
			);
		}

		return (
			<SelectionActionsLegacy
				// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
				onClearFilter={props.selection.deselectAll}
				selectedCount={props.selection.selectedSet.size}
				{...props}
			/>
		);
	}
	return <SelectionActionsLegacy {...props} />;
}
