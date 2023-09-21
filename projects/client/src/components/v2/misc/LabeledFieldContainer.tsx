import styled from 'styled-components';

import { ifProp } from '@/helpers/styled';

/**
 * `LabeledFieldContainer` is useful when we want to have a custom label and its field with full width organized as a
 * column
 *
 * @example
 * 	<LabeledFieldContainer fullWidth>
 * 		<InfoTooltipWrapper tooltipTitle={tooltipTitle} placeIconAfter>
 * 			<Typography variant='body2'>{label}</Typography>
 * 		</InfoTooltipWrapper>
 *
 * 		<RHFSelectField
 * 			variant='outlined'
 * 			color='secondary'
 * 			required
 * 			type='select'
 * 			menuItems={menuItems}
 * 			size='small'
 * 		/>
 * 	</LabeledFieldContainer>;
 */

export const LabeledFieldContainer = styled.div<{ fullWidth?: boolean; fieldColumnSpan?: number }>`
	display: flex;
	flex-direction: column;
	row-gap: 0.25rem;
	${ifProp('fullWidth', 'grid-column: 1 / -1 !important;')};
	${({ fieldColumnSpan }) => (fieldColumnSpan ? `grid-column: span ${fieldColumnSpan}` : '')};
`;
