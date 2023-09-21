import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import styled from 'styled-components';

import { IconButton } from '@/components/v2';

const ControlsLabel = styled.span`
	font-size: 0.8rem;
	margin: 0 0.25rem;
	min-width: 3rem; // enforce a min-width so that the adjacent buttons don't move
	text-align: center;
`;

// this is to prevent the current focused element from losing focus, e.g. the manual chart in manual editing
const handleMouseDown = (e) => e.preventDefault();

export default function AxisControlSelection({
	value,
	items,
	onChange,
	id,
	className,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onChange(newValue: any): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	items: { value: any; label?: string }[];
	id?: string;
	className?: string;
}) {
	const select = (dir: number) => {
		const newIdx = _.findIndex(items, { value }) + dir;

		if (newIdx >= items.length) {
			onChange(items[0].value);
			return;
		}

		if (newIdx < 0) {
			onChange(items[items.length - 1].value);
			return;
		}

		onChange(items[newIdx].value);
	};

	const currentItem = _.find(items, { value });

	return (
		<div className={className} id={id}>
			<IconButton onClick={() => select(-1)} size='small' onMouseDown={handleMouseDown}>
				{faMinus}
			</IconButton>

			<ControlsLabel>{currentItem?.label ?? currentItem?.value ?? currentItem}</ControlsLabel>

			<IconButton onClick={() => select(1)} size='small' onMouseDown={handleMouseDown}>
				{faPlus}
			</IconButton>
		</div>
	);
}
