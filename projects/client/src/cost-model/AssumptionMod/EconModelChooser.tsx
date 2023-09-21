import { faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { Drawer, Typography } from '@material-ui/core';
import _ from 'lodash';

import { Button, CheckboxField, Divider, FormGroup, IconButton } from '@/components/v2';
import { useDialogProps } from '@/helpers/dialog';
import { ASSUMPTION_LABELS } from '@/inpt-shared/constants';

const ALL_SIDE_BAR_KEYS = Object.keys(ASSUMPTION_LABELS);

interface EconModelDrawerProps {
	visible: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onHide?: (...args: any[]) => void;
	value: string[];
	onChange: (newValue: string[]) => void;
}

function EconModelDrawer({ visible, onHide, value, onChange }: EconModelDrawerProps) {
	return (
		<Drawer css='width: 20rem; padding: 1rem;' open={visible} onClose={onHide} anchor='right'>
			<div
				css={`
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: ${({ theme }) => theme.spacing(3)}px;
				`}
			>
				<Typography variant='h6'>Econ Models</Typography>{' '}
				<IconButton onClick={onHide}>{faChevronRight}</IconButton>
			</div>
			<CheckboxField
				label='Select All'
				checked={value.length === ALL_SIDE_BAR_KEYS.length}
				onChange={(ev) => {
					if (ev.target.checked) {
						onChange(ALL_SIDE_BAR_KEYS);
					} else {
						onChange([]);
					}
				}}
			/>
			<Divider />
			<FormGroup>
				{ALL_SIDE_BAR_KEYS.map((key) => (
					<CheckboxField
						key={key}
						label={ASSUMPTION_LABELS[key]}
						checked={value.includes(key)}
						onChange={(ev) => {
							if (ev.target.checked) {
								onChange([...value, key]);
							} else {
								onChange(_.without(value, key));
							}
						}}
					/>
				))}
			</FormGroup>
		</Drawer>
	);
}

export default function EconModelChooser({ value, onChange }) {
	const disableBackdropClick = true;
	const {
		props: { visible, onHide },
		confirm,
	} = useDialogProps(disableBackdropClick);

	return (
		<>
			<Button color='secondary' variant='outlined' onClick={confirm}>
				Econ Models ({value?.length})
			</Button>
			<EconModelDrawer visible={!!visible} onHide={onHide} value={value} onChange={onChange} />
		</>
	);
}
