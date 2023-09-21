import { Link, Typography } from '@material-ui/core';

import { RHFNumberField } from '@/components/v2';
import { LabeledFieldContainer } from '@/components/v2/misc';

export const EpsgField = () => (
	<LabeledFieldContainer fullWidth>
		<div style={{ marginBottom: '8px' }}>
			<Typography variant='body2'>
				Enter the EPSG number (look{' '}
				<Link
					color='secondary'
					underline='always'
					href='https://wiki.spatialmanager.com/index.php/Coordinate_Systems_objects_list'
					target='_blank'
					rel='noreferrer'
				>
					here
				</Link>
				)
			</Typography>
		</div>

		<RHFNumberField
			variant='outlined'
			color='secondary'
			required
			inputProps={{ 'aria-label': 'epsg' }}
			name='advanced.epsg'
			rules={{ validate: (value: number) => value > 0 || 'EPSG is required' }}
			size='small'
		/>
	</LabeledFieldContainer>
);
