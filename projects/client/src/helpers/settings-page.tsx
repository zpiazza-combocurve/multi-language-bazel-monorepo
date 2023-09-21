import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { Button as MUIButton, TextField as MUITextField } from '@/components/v2';
import { TextFieldProps } from '@/components/v2/TextField';
import { SelectField } from '@/components/v2/misc';
import RadioGroupField from '@/components/v2/misc/RadioGroupField';
import { confirmationAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { theme } from '@/helpers/styled';
import { DeleteDialog } from '@/module-list/ModuleList/components';

export function formatBoolean(value: boolean | null | undefined) {
	if (value !== undefined && value !== null) {
		return value ? 'Yes' : 'No';
	}
	return '';
}

export const SettingsInfoContainer = styled.section`
	display: flex;
	padding: 0 1rem 1rem 1rem;
`;

export const AdditionalSettingsContainer = styled.section`
	column-gap: 1rem;
	display: flex;
	padding: 1.5rem 20%;
`;

export const InputContainer = styled.div`
	display: flex;
	flex-basis: calc(50% - 2rem);
	flex-direction: column;
	flex-grow: 1;
	justify-content: flex-start;
	row-gap: 1rem;
`;

export const InputSelectField = styled(SelectField).attrs({ size: 'small', variant: 'outlined' })`
	.MuiSelect-root {
		font-size: 0.75rem;
	}
`;

export const InputRadioGroupField = styled(RadioGroupField)`
	.MuiFormLabel-root,
	.MuiTypography-root {
		font-size: 0.75rem;
	}
`;

export const SettingsContainer = styled.div`
	width: 100%;
	padding: 1rem;
`;

type SettingsTextFieldProps = Pick<TextFieldProps, 'disabled' | 'label' | 'id' | 'value'> & {
	onChange?: (newValue: string) => void;
};

export function SettingsTextField({ onChange, disabled = false, ...rest }: SettingsTextFieldProps) {
	return (
		<MUITextField
			onChange={(e) => onChange?.(e.target.value)}
			css={`
				display: flex;
				margin-right: 2rem;
				flex-grow: 1;
			`}
			InputProps={{
				readOnly: Boolean(disabled),
			}}
			{...rest}
		/>
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const coloredHover = (propToCheck: string, color: string) => css<any>`
	${({ [propToCheck]: prop }) => prop && `&:hover {border-left: 2px solid ${color};}`}
`;

const ActionContainer = styled.section`
	align-items: center;
	border-left: 2px solid transparent;
	display: flex;
	flex-direction: row;
	padding: 0.75rem;
	transition: all 0.3s linear;
	&:hover {
		border-left: 2px solid;
	}
	${coloredHover('primary', theme.primaryColor)}
	${coloredHover('secondary', theme.secondaryColor)}
	${coloredHover('warning', theme.warningColor)}
`;

const BtnContainer = styled.div`
	display: flex;
	justify-content: center;
	min-width: 300px;
`;

function formatInfo(info: string | string[]) {
	if (typeof info === 'string') {
		info = [info];
	}
	if (Array.isArray(info)) {
		return (
			<ul>
				{info.map((desc) => (
					<li key={desc}>{desc}</li>
				))}
			</ul>
		);
	}
	return info;
}
/* eslint-enable no-param-reassign */

export function SettingsButton({
	primary = false,
	secondary = false,
	warning = false,
	className = '',
	info,
	label,
	tooltipLabel,
	disabled,
	onClick,
	...restButtonProps
}) {
	const color = primary ? 'primary' : secondary ? 'secondary' : warning ? 'error' : 'default';

	return (
		<ActionContainer {...{ primary, secondary, warning, className }}>
			<BtnContainer>
				<MUIButton
					onClick={onClick}
					disabled={disabled}
					tooltipTitle={tooltipLabel}
					color={color}
					{...restButtonProps}
				>
					{label}
				</MUIButton>
			</BtnContainer>
			<div>{formatInfo(info)}</div>
		</ActionContainer>
	);
}

export function SettingsDeleteButton({
	name,
	feat,
	info,
	requireName,
	disabled,
	redirectTo,
	onDelete,
	tooltipLabel,
	extraOption = {},
}) {
	const navigate = useNavigate();
	const [deleteDialog, promptDeleteDialog] = useDialog(DeleteDialog);

	return (
		<>
			{deleteDialog}
			<SettingsButton
				warning
				info={info}
				tooltipLabel={tooltipLabel}
				disabled={disabled}
				label={`Delete ${feat}`}
				onClick={async () => {
					const deleted = await promptDeleteDialog({
						requireName,
						name,
						onDelete,
						feat,
						extraOption,
					});
					if (deleted) {
						navigate(redirectTo);
						confirmationAlert(`${feat} successfully deleted`, 6000);
					}
				}}
			/>
		</>
	);
}
