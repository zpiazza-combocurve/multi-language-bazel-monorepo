import { faRadar, faTimes } from '@fortawesome/pro-regular-svg-icons';
import React, { useState } from 'react';

import { Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@/components/v2';

import SingleWellProximityView from './SingeWellProximityView';

const SingleWellProximity = ({
	chartData,
	forecastId,
	proximityPhases,
	wellId,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	chartData?: any;
	forecastId: Inpt.ObjectId<'forecast'>;
	proximityPhases: string[];
	wellId: Inpt.ObjectId<'well'>;
}) => {
	const [displayDialog, setDisplayDialog] = useState(false);

	return (
		<>
			<IconButton
				onClick={() => setDisplayDialog(true)}
				color='primary'
				size='small'
				tooltipPlacement='left'
				tooltipTitle='Proximity Info'
			>
				{faRadar}
			</IconButton>
			<Dialog open={displayDialog} onClose={() => setDisplayDialog(false)} maxWidth='md' fullWidth>
				<DialogTitle
					disableTypography
					css={{
						display: 'flex',
						alignItems: 'center',
						padding: '0.5rem 1rem',
						gap: '0.5rem',
					}}
				>
					<Typography variant='h6'> Proximity Info</Typography>
					<div css={{ flex: 1 }} />

					<IconButton onClick={() => setDisplayDialog(false)}>{faTimes}</IconButton>
				</DialogTitle>
				<DialogContent
					css={`
						height: 100vh;
						padding: 0 1rem 1rem 1rem;
					`}
				>
					<SingleWellProximityView
						chartData={chartData}
						forecastId={forecastId}
						proximityPhases={proximityPhases}
						wellId={wellId}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default React.memo(SingleWellProximity);
