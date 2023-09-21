import { useState } from 'react';

import { useGetLocalStorage, useSetLocalStorage } from '@/components/hooks/useStorage';
import { Box, Paper, Tab, Tabs } from '@/components/v2';
import { ButtonItem, MenuButton } from '@/components/v2/menu';
import { getRows as getMonthlyRows } from '@/economics/shared/shared';
import EconOutputMonthlyTable, { getColumns as getMonthlyColumns } from '@/economics/tables/EconOutputMonthlyTable';
import SingleOnelinerTable, { getOneLinerRows } from '@/economics/tables/SingleOnelinerTable';
import { genericErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { FeatureIcons } from '@/helpers/features';
import { downloadExport, postApi } from '@/helpers/routing';
import { addDateTime } from '@/helpers/timestamp';
import { exportXLSX, tableToSheet } from '@/helpers/xlsx';

interface EconomicsRunCardProps {
	className?: string;
	endActions?;
	monthly;
	oneLiner;
	scenario;
	startActions?;
	title?: string;
	wellName?;
	wellId?;
}

export function useEconomicsDownload({ monthly, oneLiner, scenarioId, projectId, wellName, wellId }) {
	const handleDownload = () => {
		const fileName = addDateTime(`${wellName}_monthly_one_liner`);
		exportXLSX({
			fileName: `${fileName}.xlsx`,
			sheets: [
				tableToSheet({
					name: 'One Liner',
					columns: [
						{ key: 'header', name: 'Oneliner' },
						{ key: 'value', name: 'Value' },
					],
					rows: getOneLinerRows(oneLiner),
				}),
				tableToSheet({
					name: 'Monthly Output',
					columns: getMonthlyColumns(monthly),
					rows: getMonthlyRows(monthly),
				}),
			],
		});
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const handleDownloadPDF = async (generalOptions?: any) => {
		const fileName = `${addDateTime(`${wellName}`)}.pdf`;

		const body = {
			scenarioId,
			projectId,
			monthly,
			oneLiner,
			wellId,
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			generalOptions,
		};

		const { gcpName, error } = await withLoadingBar(postApi(`/economics/genOneWellEconReport`, body));

		if (error) {
			genericErrorAlert(error);
			return;
		}

		withLoadingBar(downloadExport(gcpName, fileName));
	};

	return { handleDownload, handleDownloadPDF };
}

export default function EconomicsRunCard({
	className,
	endActions,
	monthly,
	oneLiner,
	scenario,
	startActions,
	title,
	wellName,
	wellId,
}: EconomicsRunCardProps) {
	// HACK using the local storage for this is kind of a hack but it should be fine for now, cleanup later
	const [activeTab, setActiveTab] = useState<'oneliner' | 'monthly'>(
		useGetLocalStorage('quick-econ-run-tab', 'oneliner')
	);

	useSetLocalStorage('quick-econ-run-tab', activeTab);

	const { handleDownload, handleDownloadPDF } = useEconomicsDownload({
		scenarioId: scenario._id,
		projectId: scenario.project._id,
		monthly,
		oneLiner,
		wellName,
		wellId,
	});

	return (
		<Box className={className} display='flex' flexDirection='column' component={Paper}>
			{title != null && <div>{title}</div>}
			<Paper
				css={`
					display: flex;
					flex-direction: row;
					align-items: center;
					padding: ${({ theme }) => theme.spacing(0, 1)};
					gap: ${({ theme }) => theme.spacing(1)}px;
				`}
			>
				{startActions}
				<Tabs value={activeTab} onChange={(_ev, newValue) => setActiveTab(newValue)}>
					<Tab value='oneliner' label='One Liner' />
					<Tab value='monthly' label='Monthly' />
				</Tabs>
				<MenuButton label='Download' startIcon={FeatureIcons.download} list>
					<ButtonItem onClick={() => handleDownload()} label='One Liner and Monthly' />
					<ButtonItem onClick={() => handleDownloadPDF()} label='PDF Report' />
				</MenuButton>
				<div css={{ flex: 1 }} />
				{endActions}
			</Paper>
			{activeTab === 'oneliner' && <SingleOnelinerTable oneLiner={oneLiner} />}
			{activeTab === 'monthly' && <EconOutputMonthlyTable output={monthly} />}
		</Box>
	);
}
