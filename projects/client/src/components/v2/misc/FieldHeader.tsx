import { faAngleDown, faAngleUp } from '@fortawesome/pro-regular-svg-icons';
import { withTheme } from '@material-ui/core';
import _ from 'lodash-es';
import styled from 'styled-components';

import IconButton from '../IconButton';
import { InfoTooltipWrapper } from './InfoIcon';

const FieldHeaderContainer = withTheme(styled.div`
	align-items: center;
	background-color: ${({ theme }) => theme.palette.action.selected};
	border-radius: 5px;
	column-gap: 0.5rem;
	cursor: pointer;
	display: flex;
	justify-content: space-between;
	padding: 0.75rem;
	width: 100%;
`);

/**
 * `FieldHeader` can be used with the `FormCollapse` (from forecast) or the mui `Collapse` components
 *
 * @example
 * 	const [isVisible, setIsVisible] = useState<boolean>(false);
 *
 * 	const toggleOpen = () => {
 * 		setIsVisible(!isVisible);
 * 	};
 *
 * 	return (
 * 		<>
 * 			<FieldHeader label='Title' open={isVisible} toggleOpen={toggleOpen} />
 * 			<FormCollapse in={isVisible}>
 * 				<SelectField />
 * 			</FormCollapse>
 * 		</>
 * 	);
 */

export function FieldHeader({
	disabled,
	label,
	open,
	toggleOpen = _.noop,
	tooltip,
}: {
	disabled?: boolean | string;
	label: string | JSX.Element;
	open?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	toggleOpen?: () => any;
	tooltip?: string;
}) {
	return (
		<FieldHeaderContainer onClick={toggleOpen}>
			<InfoTooltipWrapper tooltipTitle={disabled ?? tooltip}>
				<span
					css={`
						font-size: 14px;
						font-weight: 500;
						width: 100%;
					`}
				>
					{label}
				</span>
			</InfoTooltipWrapper>

			{open !== undefined && (
				<IconButton disabled={disabled}>{!disabled && open ? faAngleUp : faAngleDown}</IconButton>
			)}
		</FieldHeaderContainer>
	);
}
