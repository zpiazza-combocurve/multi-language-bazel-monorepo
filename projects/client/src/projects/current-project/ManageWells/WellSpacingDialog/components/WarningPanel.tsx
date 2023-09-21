import { faExclamationTriangle } from '@fortawesome/pro-regular-svg-icons';
import { withTheme } from '@material-ui/core';
import styled from 'styled-components';

import { Box, Icon, RHFCheckboxField, Typography } from '@/components/v2';

type WarningItemProps = {
	itemName: string;
	amount?: number;
	totalAmount: number;
	itemDescriptor: string;
};

const WarningItem = ({ itemName, amount, totalAmount, itemDescriptor }: WarningItemProps) => {
	const missingData = amount !== totalAmount;

	return (
		<div style={{ marginBottom: '6px', display: missingData ? 'block' : 'none' }}>
			<Typography variant='inherit'>
				<Box fontWeight='600' display='inline'>
					{amount} / {totalAmount} {itemDescriptor}
				</Box>{' '}
				{itemName !== 'Horizontal' ? 'have' : 'are'} {itemName}
			</Typography>
		</div>
	);
};

const WarningContainer = withTheme(styled.div`
	align-items: center;
	background-color: ${({ theme }) => theme.palette.action.selected};
	border-radius: 5px;
	padding: 16px;
	width: 100%;
`);

type ValidationItemType = {
	name: string;
	amount: number;
	allWellsAmount: number;
	itemDescriptor: string;
};

export type ValidationDataType = {
	isValid: boolean;
	totalAmount: number;
	candidateWellsAmount: number;
	details: Array<ValidationItemType>;
};

type WarningPanelProps = {
	validationData: ValidationDataType;
};

type WarningPanelHeaderProps = {
	message: string;
	marginBottom?: boolean;
};

const WarningPanelHeader = ({ message, marginBottom }: WarningPanelHeaderProps) => (
	<div style={{ display: 'flex', marginBottom: marginBottom ? '16px' : '', alignItems: 'center' }}>
		<Icon style={{ color: '#FD9559', marginRight: '16px' }}>{faExclamationTriangle}</Icon>
		<Typography variant='body2' style={{ lineHeight: '24px' }}>
			{message}
		</Typography>
	</div>
);

export const WarningPanel = ({ validationData }: WarningPanelProps) => {
	const { isValid, candidateWellsAmount, details } = validationData;
	const noWellsAvailable = candidateWellsAmount === 0;

	if (noWellsAvailable)
		return (
			<div style={{ display: !isValid ? 'block' : 'none' }}>
				<WarningContainer>
					<WarningPanelHeader message='No wells within the selection have the required information to calculate well spacing.' />
				</WarningContainer>
			</div>
		);

	return (
		<div style={{ display: !isValid ? 'block' : 'none' }}>
			<WarningContainer>
				<WarningPanelHeader message='Some data is missing!' marginBottom />
				{details.map(({ name, amount, allWellsAmount, itemDescriptor }, index) => {
					return (
						<WarningItem
							key={index}
							itemName={name}
							amount={amount}
							totalAmount={allWellsAmount}
							itemDescriptor={itemDescriptor}
						/>
					);
				})}
			</WarningContainer>
			<RHFCheckboxField
				required
				name='confirmation'
				label='I understand the wells will be ignored'
				rules={{ validate: (value: boolean) => (!isValid ? value : true) }}
			/>
		</div>
	);
};
