import { faAngleDown, faAngleUp } from '@fortawesome/pro-regular-svg-icons';
import { ButtonProps, Collapse, Divider, withTheme } from '@material-ui/core';
import _ from 'lodash-es';
import { useFormContext } from 'react-hook-form';
import styled, { css } from 'styled-components';

import { Button, IconButton, InfoIcon } from '@/components/v2';
import { CustomBooleanField } from '@/forecasts/forecast-form/ForecastFormControl';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { scrollBarStyles } from '@/forecasts/forecast-form/phase-form/layout';
import { ifProp } from '@/helpers/styled';

const FormTitle = styled.div`
	align-items: center;
	display: flex;
	justify-content: space-between;
`;

const FormContent = withTheme(styled.section`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	height: 1rem;
	overflow-y: auto;
	padding-right: 0.5rem;
	row-gap: 0.5rem;
	${({ theme }) => scrollBarStyles({ theme, width: '10px' })}
`);

const PhaseFormCollapse = styled(Collapse).attrs({ timeout: 0 })`
	min-height: unset !important;
	${ifProp('in', '', 'display: none;')}
`;

const PhaseFormContainer = styled.section`
	display: grid;
	flex-direction: column;
	row-gap: 0.5rem;
`;

const PhaseHeaderContainer = withTheme(styled.div`
	align-items: center;
	background-color: ${({ theme }) => theme.palette.action.selected};
	border-radius: 5px;
	display: flex;
	justify-content: space-between;
	padding: 0.5rem 0.75rem;
	width: 100%;
`);

const FieldSection = styled.section<{ columns?: number }>`
	column-gap: 1rem;
	display: grid;
	row-gap: 0.5rem;
	${({ columns = 3 }) => `grid-template-columns: repeat(${columns}, minmax(0, 1fr))`};
`;

const FormFooter = styled.section`
	align-items: center;
	column-gap: 1rem;
	display: flex;
	flex-grow: 0;
	margin-left: auto;
`;

const RHFFormStyles = css`
	display: flex;
	flex-direction: column;
	height: 100%;
	row-gap: 0.5rem;
	width: 100%;
`;

function FormButton({ children, ...buttonProps }: ButtonProps) {
	return (
		<div
			css={`
				align-items: end;
				display: flex;
				justify-content: flex-end;
			`}
		>
			<Button {...buttonProps}>{children}</Button>
		</div>
	);
}

function FormInfoText({ label, value }: { label: string; value: string }) {
	return (
		<div
			css={`
				display: flex;
				flex-direction: column;
				row-gap: 0.5rem;
			`}
		>
			<span>{label}</span>
			<span css='font-weight: 500;'>{value}</span>
		</div>
	);
}

function PhaseHeader({
	additionalActions,
	disabled,
	label,
	open = true,
	phase,
	toggleOpen = _.noop,
	togglePhase,
}: {
	additionalActions?: JSX.Element;
	disabled?: boolean | string;
	label: string | JSX.Element;
	open?: boolean;
	phase: Phase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	toggleOpen?: () => any;
	togglePhase?: (inputPhase: Phase) => void;
}) {
	const { watch } = useFormContext();
	const enabledPhase = watch(`phases.${phase}`);
	const handleOnChange = togglePhase ? () => togglePhase(phase) : undefined;
	return (
		<PhaseHeaderContainer>
			<span
				css={`
					align-items: center;
					display: flex;
					font-size: 14px;
					font-weight: 500;
				`}
			>
				<CustomBooleanField
					disabled={Boolean(disabled)}
					name={`phases.${phase}`}
					onChange={handleOnChange}
					label={label}
				/>

				{typeof disabled === 'string' && <InfoIcon tooltipTitle={disabled} />}
			</span>

			<span
				css={`
					align-items: center;
					column-gap: 0.5rem;
					display: flex;
				`}
			>
				{additionalActions && (
					<>
						{additionalActions}
						<Divider orientation='vertical' flexItem />
					</>
				)}

				<IconButton onClick={toggleOpen} size='small' disabled={disabled || !enabledPhase}>
					{!disabled && enabledPhase && open ? faAngleUp : faAngleDown}
				</IconButton>
			</span>
		</PhaseHeaderContainer>
	);
}

export {
	FieldSection,
	FormButton,
	FormContent,
	FormFooter,
	FormInfoText,
	FormTitle,
	PhaseFormCollapse,
	PhaseFormContainer,
	PhaseHeader,
	PhaseHeaderContainer,
	RHFFormStyles,
};
