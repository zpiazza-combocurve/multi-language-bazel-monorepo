import { Size, TooltipProps } from '@material-ui/core';
import { isArray } from 'lodash';
import { Dispatch, SetStateAction, useCallback } from 'react';
import styled, { css } from 'styled-components';

import { useDerivedState } from '@/components/hooks';
import { FormControlLabel as BaseFormControlLabel, Radio as BaseRadio, RadioGroup } from '@/components/v2';
import { withTooltip } from '@/components/v2/helpers';
import { phaseColors, phases as phaseItems } from '@/helpers/zing';

import { VALID_PHASES } from '../charts/components/graphProperties';
import { Phase } from '../forecast-form/automatic-form/types';

const FormControlLabel = styled(BaseFormControlLabel)`
	margin-left: unset;
	margin-right: unset;
`;

const StyledRadio = styled(BaseRadio)<{ phase?: Phase }>`
	${({ phase }) =>
		phase &&
		css`
			color: ${phaseColors[phase]} !important;
		`}
`;

const Radio = withTooltip(StyledRadio);

const PhaseRadioSelection = ({
	allowNone = false,
	enableLabels = true,
	generateRadioTooltip,
	phases: parentPhases,
	row,
	setPhases: parentSetPhases,
	size,
	tooltipPlacement = 'bottom',
}: {
	allowNone?: boolean;
	enableLabels?: boolean;
	generateRadioTooltip?: (checked: boolean, label: string) => string;
	phases?: Set<Phase> | Array<Phase>;
	row?: boolean;
	setPhases?: Dispatch<SetStateAction<Set<Phase>>> | Dispatch<SetStateAction<Array<Phase>>>;
	size?: Size;
	tooltipPlacement?: TooltipProps['placement'];
}) => {
	const [phases, _setPhases] = useDerivedState(new Set(parentPhases) ?? new Set(VALID_PHASES));
	const setPhases = parentSetPhases ?? _setPhases;

	const togglePhase = useCallback(
		(inputPhase) => {
			setPhases((curPhases) => {
				const newPhases = new Set(curPhases);
				if (!allowNone && newPhases.size === 1 && newPhases.has(inputPhase)) {
					return curPhases;
				}

				if (newPhases.has(inputPhase)) {
					newPhases.delete(inputPhase);
				} else {
					newPhases.add(inputPhase);
				}

				// accept array input from parent set function
				if (isArray(curPhases)) {
					return [...newPhases];
				}

				return newPhases;
			});
		},
		[allowNone, setPhases]
	);

	return (
		<RadioGroup row={row}>
			{phaseItems.map(({ value, label }) => {
				const checked = phases.has(value);
				const tooltip = generateRadioTooltip?.(checked, label);
				return (
					<FormControlLabel
						key={value}
						className='phases-control-label'
						control={
							<Radio
								checked={checked}
								onClick={() => togglePhase(value)}
								phase={value}
								size={size}
								tooltipPlacement={tooltipPlacement}
								tooltipTitle={tooltip}
								value={checked}
							/>
						}
						label={enableLabels && label}
						value={value}
					/>
				);
			})}
		</RadioGroup>
	);
};

export default PhaseRadioSelection;
