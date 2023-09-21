import { faUndo } from '@fortawesome/pro-regular-svg-icons';
import { isEqual, round } from 'lodash';
import { useState } from 'react';
import styled from 'styled-components';

import { Divider, IconButton, InfoIcon, MenuButton, MenuButtonProps, SliderFieldItem } from '@/components/v2';
import { labelWithUnit } from '@/helpers/text';
import { fields as segParamsTemplate } from '@/inpt-shared/display-templates/segment-templates/seg_params.json';

import { DEFAULT_SPEED_STATE, MIN_MAX_SPEEDS, SpeedState } from './useKeyboardForecast';

const SPEED_STATE_KEYS = Object.keys(DEFAULT_SPEED_STATE);

const ControlsContainer = styled.section`
	align-items: center;
	column-gap: 0.5rem;
	display: flex;
`;

const MenuListContainer = styled.div`
	padding: 1rem 0.5rem;
	overflow: hidden;

	& > * {
		margin-bottom: 0.5rem;
		&:last-child {
			margin-bottom: 0;
		}
	}
`;

const PARAMS_TOOLTIPS = {
	accelerationRate:
		'Sets the exponential acceleration rate when a keyboard shortcut is pressed and held down longer than X second(s). The longer a shortcut is held down, the faster it will escalate the increment amount.',
	b: 'Sets the increment setting for the keyboard shortcut that manipulates b Factor (Shift + ↑/↓)',
	D_eff: 'Sets the increment setting for the keyboard shortcut that manipulates Di Eff-Sec (Ctrl + ↑/↓)',
	dateIncrement: 'Sets the increment setting for the keyboard shortcuts that manipulate the date parameters',
	q_start:
		'Sets the increment setting for the keyboard shortcut that manipulates q Start by a percentage of the q Start value.',
	target_D_eff_sw: 'Sets the increment setting for the keyboard shortcut that manipulates D Sw-Eff-Sec (Alt + ↑/↓) ',
};

const ManualSpeedMenuBtn = ({
	speedState,
	setSpeedState,
	...menuButtonProps
}: Omit<MenuButtonProps, 'label'> & {
	speedState?: SpeedState;
	setSpeedState: (value) => void;
}) => {
	const [viewSpeedState, setViewSpeedState] = useState<SpeedState>(speedState ?? DEFAULT_SPEED_STATE);

	const register = (key) => {
		const { min, viewLabel, units, placesPastDecimal } = MIN_MAX_SPEEDS[key];
		return {
			label: (
				<>
					<InfoIcon css='margin-right: 0.5rem;' tooltipTitle={PARAMS_TOOLTIPS[key]} />
					{labelWithUnit(viewLabel ?? segParamsTemplate?.[key]?.label, units)}
				</>
			),
			onChange: (_ev, newValue) => setViewSpeedState((prev) => ({ ...prev, [key]: newValue })),
			onChangeCommitted: (_ev, newValue) => setSpeedState({ [key]: newValue }),
			step: min === 0 ? 0.1 : min,
			value: viewSpeedState[key],
			valueLabelFormat: (value) => round(value, placesPastDecimal ?? 1),
			...MIN_MAX_SPEEDS[key],
		};
	};

	const resetToDefault = () => {
		setViewSpeedState(DEFAULT_SPEED_STATE);
		setSpeedState(DEFAULT_SPEED_STATE);
	};

	const showReset = !isEqual(speedState, DEFAULT_SPEED_STATE);
	return (
		<ControlsContainer>
			<MenuButton {...menuButtonProps} label='Speed Controls'>
				<MenuListContainer>
					{SPEED_STATE_KEYS.map((key, idx) => (
						<div
							key={`${key}-speed-adjustment`}
							css={`
								display: flex;
								flex-direction: column;
								row-gap: 0.5rem;
							`}
						>
							<SliderFieldItem
								{...register(key)}
								color='secondary'
								fullWidth
								key={`${key}-speed-adjustment`}
								minMaxLabel
								valueLabelDisplay='auto'
								variant='body2'
							/>

							{SPEED_STATE_KEYS.length !== idx + 1 && <Divider />}
						</div>
					))}
				</MenuListContainer>
			</MenuButton>

			{showReset && (
				<IconButton onClick={resetToDefault} tooltipTitle='Reset Speeds To Default'>
					{faUndo}
				</IconButton>
			)}
		</ControlsContainer>
	);
};

export default ManualSpeedMenuBtn;
