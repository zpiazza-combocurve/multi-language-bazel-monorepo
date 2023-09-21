import { faExpandArrows, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { useState } from 'react';
import styled, { css } from 'styled-components';

import { Button, Floater } from '@/components';
import { PhaseSelectField } from '@/components/misc';
import { Divider, IconButton } from '@/components/v2';
import {
	ControlsFormContainer,
	ManualContainer as EditingLayoutContainer,
	ManualActionsContainer as ManualActionsContainerRaw,
	ManualControlsContainer,
} from '@/forecasts/deterministic/manual/layout';
import ResolutionToggle from '@/forecasts/manual/shared/ResolutionToggle';

export { EditingLayoutContainer, ResolutionToggle, PhaseSelectField };

const ManualActionsContainer = styled(ManualActionsContainerRaw)`
	align-items: center;
`;

const FORM_HANDLE_ID = 'manual-editing-form-toolbar';

const isFloatingStyles = css`
	cursor: grab;
	&:active {
		cursor: grabbing;
	}
`;

export const getActiveMode = (modeName, modes) => modes.find(({ name }) => name === modeName);

export function ModeSwitch({ activeModeName, onChangeMode, modes }) {
	return modes.map(({ name, label, disabled }) => (
		<Button key={name} disabled={disabled} underlined={activeModeName === name} onClick={() => onChangeMode(name)}>
			{label}
		</Button>
	));
}

export function EditingForm({ actions, children }) {
	return (
		<>
			<ManualActionsContainer>{actions}</ManualActionsContainer>

			<Divider />

			<ControlsFormContainer>{children}</ControlsFormContainer>
		</>
	);
}

export function FormCard({ children, floating, onToggle, isProbabilistic, left }) {
	return (
		<Floater
			as={ManualControlsContainer}
			detached={floating}
			disableToolbar={!isProbabilistic}
			handle={FORM_HANDLE_ID}
			onToggle={onToggle}
			shouldCheckPosition={false}
			width='25rem'
			left={left}
		>
			{children}
		</Floater>
	);
}

export function EditingLayout({ actions, controls, form, leftRender, rightRender }) {
	const [floating, setFloating] = useState(false);
	const onToggle = () => setFloating((p) => !p);

	return (
		<EditingLayoutContainer>
			{leftRender}
			<FormCard floating={floating} onToggle={onToggle}>
				<div
					css={`
						align-items: center;
						display: flex;
						height: 2.75rem;
						justify-content: space-between;
						width: 100%;
						padding: ${floating ? 'unset' : '0 0.5rem;'};
					`}
				>
					<span
						css={`
							display: flex;
						`}
					>
						{controls}
					</span>

					<div
						id={FORM_HANDLE_ID}
						css={`
							flex-grow: 1;
							height: 100%;
							${floating && isFloatingStyles}
						`}
					/>

					<IconButton onClick={onToggle} size='small'>
						{floating ? faTimes : faExpandArrows}
					</IconButton>
				</div>

				<EditingForm actions={actions}>{form}</EditingForm>
			</FormCard>
			{rightRender}
		</EditingLayoutContainer>
	);
}
