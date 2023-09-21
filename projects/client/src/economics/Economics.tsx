import { format } from 'date-fns';
import { useState } from 'react';

import { Placeholder } from '@/components';
import { Box, Button, MenuItem, Paper, Tab, Tabs, TextField, Typography } from '@/components/v2';
import { FULL } from '@/economics/EconSettingsDialog';
import EconRunOutputMonthlyTable from '@/economics/tables/EconRunOutputMonthlyTable';
import { EconRunOutputOnelinerTable } from '@/economics/tables/EconRunOutputOnelinerTable';
import { withLoadingBar } from '@/helpers/alerts';

import { LoadingEconomicRun } from './Economics/LoadingEconomicsRun';
import { econRunHasErrors, useEconRunQuery } from './Economics/shared/helpers';
import { ScenarioTableColumn } from './exports/CSVExportDialog/types';
import { ExportButton } from './exports/ExportButton';
import { buildAndDownloadMonthly } from './exports/ExportButton/helpers';

export default function Economics({
	// expanded,
	// onToggleExpand,
	className,
	scenarioId,
	scenarioTableHeaders,
	runningEconomics,
}: {
	className?: string;
	scenarioId: Inpt.ObjectId<'scenario'>;
	scenarioTableHeaders?: ScenarioTableColumn[];
	expanded: boolean;
	onToggleExpand(): void;
	runningEconomics?: boolean;
}) {
	const [activeTab, setActiveTab] = useState<'oneliner' | 'monthly'>('oneliner');

	const {
		econRunIds,
		ghgRunQuery,
		userRunQuery,
		askDownloadDialog,
		fileNameDialog,
		promptDownload,
		combo,
		setCombo,
	} = useEconRunQuery(scenarioId);

	const runId = userRunQuery.data?.run?._id;
	const hasReservesGroups = userRunQuery.data?.run?.outputParams?.runMode === FULL;

	if (userRunQuery.isLoading || (userRunQuery.isSuccess && userRunQuery.data?.run.status === 'pending')) {
		return <LoadingEconomicRun className={className} />;
	}

	const hasMonthly = !!userRunQuery.data?.run.outputGroups?.all;
	const hasOneLiner = true;

	const dialogs = (
		<>
			{fileNameDialog}
			{askDownloadDialog}
		</>
	);

	return (
		<Box className={className} display='flex' flexDirection='column' component={Paper}>
			<Paper
				css={`
					display: flex;
					align-items: center;
					& > *:not(:first-child) {
						margin-left: 1rem;
					}
				`}
			>
				{userRunQuery.data?.run && (
					<Tabs value={activeTab} onChange={(_ev, newValue) => setActiveTab(newValue)}>
						<Tab value='oneliner' label='One Liner' />
						<Tab value='monthly' label='Monthly' />
					</Tabs>
				)}
				{userRunQuery.data?.run && userRunQuery.data.run.outputParams.combos.length > 1 && (
					<TextField
						select
						value={
							activeTab === 'monthly'
								? userRunQuery.data.run.outputParams.combos.filter(
										({ selected, invalid }) => selected && !invalid
								  )[0]?.name
								: combo
						}
						onChange={(ev) => setCombo(ev.target.value)}
						SelectProps={{ disableUnderline: true }}
						size='small'
						disabled={activeTab === 'monthly' && 'Monthly is always based on 1st Combo'}
					>
						{userRunQuery.data.run.outputParams.combos
							.filter(({ selected, invalid }) => selected && !invalid)
							.map((c) => (
								<MenuItem key={c._id} value={c.name}>
									{c.name}
								</MenuItem>
							))}
					</TextField>
				)}
				<ExportButton
					{...{
						ghgRunId: ghgRunQuery.data?._id,
						hasOneLiner,
						hasReservesGroups,
						runId,
						runningEconomics,
						scenarioId,
						scenarioTableHeaders,
					}}
				/>
			</Paper>
			{!userRunQuery.isSuccess && <Placeholder className={className} error='Could not load last run' />}

			{userRunQuery.data?.run &&
				(econRunHasErrors(userRunQuery.data.run) ? (
					<Paper className={className} css='padding: 1rem;'>
						<Typography variant='h5'>No Available Group Econ Result</Typography>
						<div>
							Either all wells encountered an error or the aggregation date was after all econ limits.
							Download the monthly file for more details
						</div>
						<Button
							css='margin-top: 1rem;'
							color='primary'
							variant='outlined'
							onClick={async () => {
								const result = await promptDownload({ type: 'error' });

								if (!result) {
									return;
								}
								await withLoadingBar(
									buildAndDownloadMonthly(userRunQuery.data.run, result.fileName, 'monthly')
								);
							}}
						>
							Download Error Files
						</Button>
						{dialogs}
					</Paper>
				) : (
					<>
						{userRunQuery.data.run.runDate && (
							<Box p={1}>Last Run Date: {format(new Date(userRunQuery.data.run?.runDate), 'Pp')}</Box>
						)}
						{activeTab === 'oneliner' && (
							<EconRunOutputOnelinerTable
								econRunDatas={econRunIds}
								lastRun={userRunQuery.data.run}
								groupingData={userRunQuery.data.groupingData}
							/>
						)}
						{activeTab === 'monthly' &&
							(hasMonthly ? (
								<EconRunOutputMonthlyTable output={userRunQuery.data?.run.outputGroups.all} />
							) : (
								'Monthly output was not aggregated in this run'
							))}
					</>
				))}
			{dialogs}
		</Box>
	);
}
