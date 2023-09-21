import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { useState } from 'react';

import { Box, IconButton, Menu, MenuItem, TextField } from '@/components/v2';
import { getRows as getMonthlyRows } from '@/economics/shared/shared';
import { getColumns as getMonthlyColumns } from '@/economics/tables/EconOutputMonthlyTable';
import SingleOnelinerTable, { getOneLinerRows } from '@/economics/tables/SingleOnelinerTable';
import { genericErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { downloadExport, postApi } from '@/helpers/routing';
import { addDateTime } from '@/helpers/timestamp';
import { exportXLSX, tableToSheet } from '@/helpers/xlsx';

import { TypeCurve } from '../types';

const downloadOutput = (oneLiner, monthly, typeCurve) => {
	exportXLSX({
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		fileName: `${addDateTime(typeCurve.name!)}.xlsx`,
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

const downloadPDF = async (oneLiner, monthly, typeCurve) => {
	const fileName = `${addDateTime(`${typeCurve.name}-econ-report`)}.pdf`;

	const body = {
		monthly,
		oneLiner,
		typeCurveId: typeCurve._id,
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	};

	const { gcpName, error } = await withLoadingBar(postApi(`/type-curve/genTypeCurveEconReport`, body));

	if (error) {
		genericErrorAlert(error);
		return;
	}

	withLoadingBar(downloadExport(gcpName, fileName));
};

const TypeCurveEconOneLiner = ({
	className = '',
	oneLiner,
	monthly,
	typeCurve,
}: {
	className?: string;
	oneLiner: Inpt.EconRunData['oneLinerData'];
	monthly: Inpt.EconRun['outputGroups']['all'];
	typeCurve: TypeCurve;
}) => {
	const [search, setSearch] = useState('');
	const handleDownload = () => downloadOutput(oneLiner, monthly, typeCurve);
	const handleDownloadPDF = () => downloadPDF(oneLiner, monthly, typeCurve);

	return (
		<Box className={className} display='flex' flexDirection='column'>
			<Box display='flex' alignItems='center' justifyContent='space-between' mb={1}>
				<TextField placeholder='One Liner' onChange={(ev) => setSearch(ev.target.value)} value={search} />

				<PopupState variant='popover'>
					{(popupState) => (
						<>
							<IconButton
								{...bindTrigger(popupState)}
								size='small'
								tooltipTitle='Download Output'
								tooltipPlacement='left'
							>
								{faDownload}
							</IconButton>
							<Menu {...bindMenu(popupState)}>
								<MenuItem onClick={handleDownload}>One Liner and Monthly</MenuItem>
								<MenuItem onClick={handleDownloadPDF}>PDF Report</MenuItem>
							</Menu>
						</>
					)}
				</PopupState>
			</Box>
			<SingleOnelinerTable css='flex: 1;' oneLiner={oneLiner} search={search} />
		</Box>
	);
};

export default TypeCurveEconOneLiner;
