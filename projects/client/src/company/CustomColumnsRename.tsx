import { useState } from 'react';

import usePermissions from '@/access-policies/usePermissions';
import { Button, Paper, Stack, Tab, Tabs, TextField, Typography } from '@/components/v2';
import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/inpt-shared/access-policies/shared';
import defaultDailyCustomHeaders from '@/inpt-shared/display-templates/wells/well_days_custom_default.json';
import defaultWellCustomHeaders from '@/inpt-shared/display-templates/wells/well_headers_custom_default.json';
import defaultMonthlyCustomHeaders from '@/inpt-shared/display-templates/wells/well_months_custom_default.json';

import { useCustomDailyFieldsNames } from './CustomColumnsRename/daily-production';
import { useCustomMonthlyFieldsNames } from './CustomColumnsRename/monthly-production';
import { useCustomWellHeaderNames } from './CustomColumnsRename/well-headers';

export function CustomColumnsRename() {
	const collections = [
		{
			name: 'wells',
			label: 'Well Headers',
			columnLabels: defaultWellCustomHeaders,
			...useCustomWellHeaderNames(),
		},
		{
			name: 'monthly-productions',
			label: 'Monthly Production',
			columnLabels: defaultMonthlyCustomHeaders,
			...useCustomMonthlyFieldsNames(),
		},
		{
			name: 'daily-productions',
			label: 'Daily Production',
			columnLabels: defaultDailyCustomHeaders,
			...useCustomDailyFieldsNames(),
		},
	];

	const [selectedCollection, setSelectedCollection] = useState('wells');

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const { columns, columnNames, columnLabels, setColumnName, save } = collections.find(
		({ name }) => name === selectedCollection
	)!;

	const { canUpdate: canUpdateCustomHeaderConfigurations } = usePermissions(
		SUBJECTS.CustomHeaderConfigurations,
		null
	);

	return (
		<Stack css={{ padding: '1rem', height: '100%' }} spacing='1rem'>
			<Paper
				css={`
					padding: 0.5rem;
					display: flex;
					gap: 1rem;
					align-items: center;
				`}
			>
				<Tabs
					color='secondary'
					value={selectedCollection}
					onChange={(_ev, v) => setSelectedCollection(v)}
					textColor='secondary'
					indicatorColor='secondary'
				>
					{collections.map(({ name, label }) => (
						<Tab key={name} value={name} label={label} />
					))}
				</Tabs>
				<Button
					disabled={!canUpdateCustomHeaderConfigurations && PERMISSIONS_TOOLTIP_MESSAGE}
					onClick={save}
					variant='contained'
					color='primary'
				>
					Save
				</Button>
			</Paper>
			<Paper
				css={`
					flex: 1;
					overflow-y: auto;
					padding: 1rem;
				`}
			>
				<Stack direction='row' spacing='1rem'>
					{Object.entries(columns).map(([key, { display, fields }]) => (
						<div
							key={key}
							css={`
								flex: 1;
								& > *:not(:first-child) {
									margin-top: 0.5rem;
								}
							`}
						>
							<Typography variant='h6'>{display}</Typography>
							{fields.map((f) => (
								<TextField
									key={f}
									value={columnNames[f]}
									onChange={(ev) => setColumnName(f, ev.target.value)}
									label={columnLabels[f]}
									fullWidth
								/>
							))}
						</div>
					))}
				</Stack>
			</Paper>
		</Stack>
	);
}
