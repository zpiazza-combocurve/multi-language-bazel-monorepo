import { faCheckCircle, faCircle } from '@fortawesome/pro-regular-svg-icons';
import { Box } from '@material-ui/core';
import { SelectionControlGroup as MdSelectionControlGroup } from 'react-md';

import { useId } from '@/components/hooks';
import { InfoTooltip } from '@/components/tooltipped';

import { FontIcon } from './FontIcon';

export function SelectionControlGroup(props) {
	const id = useId();
	const name = useId();
	const ariaLabel = useId();
	const { tooltip, label } = props;
	return (
		<MdSelectionControlGroup
			id={id}
			name={name}
			// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
			labelComponent={() => (
				<Box
					css={`
						display: flex;
						align-items: center;
					`}
				>
					{label}
					{tooltip && (
						<InfoTooltip
							css={`
								margin-left: 0.5rem;
							`}
							labelTooltip={tooltip}
							fontSize='18px'
						/>
					)}
				</Box>
			)}
			aria-label={ariaLabel}
			uncheckedRadioIcon={<FontIcon>{faCircle}</FontIcon>}
			checkedRadioIcon={<FontIcon>{faCheckCircle}</FontIcon>}
			{...props}
		/>
	);
}
