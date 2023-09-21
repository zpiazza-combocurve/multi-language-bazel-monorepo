import {
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	TextField,
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useState } from 'react';

import { ColoredCircle } from '@/components/misc';
import { Button } from '@/components/v2';
import { DialogProps, withDialog } from '@/helpers/dialog';
import { useWellHeaders } from '@/helpers/headers';
import { titleize } from '@/helpers/text';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

import { DEFAULT_HEATMAP_OPTIONS, GridType, HeatmapOptions, validateGridCellSize, validateHeader } from './shared';

interface HeatmapDialogResult extends HeatmapOptions {
	generate: boolean;
}

interface HeatmapSettingsDialogProps extends DialogProps<HeatmapDialogResult> {
	options: HeatmapOptions;
}

function HeatmapSettingsDialog({ options, visible, resolve }: HeatmapSettingsDialogProps) {
	const reject = () => resolve(null);

	const { wellHeadersLabels, wellHeadersTypes, projectCustomHeadersKeys, wellHeadersChipDescriptions } =
		useWellHeaders({
			enableProjectCustomHeaders: true,
		});
	const numericHeaders = Object.keys(wellHeadersLabels).filter((k) =>
		['number', 'percent', 'integer'].includes(wellHeadersTypes[k]?.type)
	);

	const initialHeader = options?.header ?? DEFAULT_HEATMAP_OPTIONS.header;
	const initialGridType = options?.gridType ?? DEFAULT_HEATMAP_OPTIONS.gridType;
	const initialGridCellSize = options?.gridCellSize ?? DEFAULT_HEATMAP_OPTIONS.gridCellSize;
	const initialColorScale = options?.colorScale ?? DEFAULT_HEATMAP_OPTIONS.colorScale;

	const [header, setHeader] = useState(initialHeader);
	const [gridType, setGridType] = useState(initialGridType);
	const [gridCellSize, setGridCellSize] = useState(initialGridCellSize.toString());
	const [colorScale, setColorScale] = useState(initialColorScale);

	const resetState = () => {
		setHeader(initialHeader);
		setGridType(initialGridType);
		setGridCellSize(initialGridCellSize.toString());
		setColorScale(initialColorScale);
	};

	const [headerValid, headerMessage] = validateHeader(header, numericHeaders);
	const [gridCellSizeValid, gridCellSizeMessage] = validateGridCellSize(gridCellSize);
	const isValid = headerValid && gridCellSizeValid;

	const showChip = (header: string) => {
		if (wellHeadersChipDescriptions[header]) {
			return <Chip css='margin-left: 0.5rem;' label={titleize(`From ${wellHeadersChipDescriptions[header]}`)} />;
		}
	};

	return (
		<Dialog open={visible} onEnter={resetState} onClose={() => reject()} maxWidth='xs' fullWidth>
			<DialogTitle>Heatmap Settings</DialogTitle>
			<DialogContent>
				<FormControl fullWidth margin='dense'>
					<FormLabel>Grid Type</FormLabel>
					<RadioGroup value={gridType} row onChange={(event) => setGridType(event.target.value as GridType)}>
						<FormControlLabel value='average' label='No Interpolation' control={<Radio />} />
						<FormControlLabel value='idw' label='Interpolation (IDW)' control={<Radio />} />
					</RadioGroup>
				</FormControl>
				<FormControl fullWidth margin='dense'>
					<Autocomplete
						options={numericHeaders}
						renderOption={(value) => {
							// checks to see whether or not the value should have a chip next to the label
							return (
								<>
									{projectCustomHeadersKeys.includes(value) && (
										<ColoredCircle $color={projectCustomHeaderColor} />
									)}
									{wellHeadersLabels[value]} {showChip(value)}
								</>
							);
						}}
						getOptionLabel={(value) => wellHeadersLabels[value]}
						renderInput={(params) => (
							<TextField label='Header' {...params} error={!headerValid} helperText={headerMessage} />
						)}
						disableClearable
						value={header}
						onChange={(_event, newValue) => setHeader(newValue)}
					/>
				</FormControl>
				<FormControl fullWidth margin='dense'>
					<TextField
						label='Grid Cell Size (miles)'
						type='number'
						value={gridCellSize}
						onChange={(event) => setGridCellSize(event.target.value)}
						error={!gridCellSizeValid}
						helperText={gridCellSizeMessage}
					/>
				</FormControl>
			</DialogContent>
			<DialogActions>
				<Button id='dialog-cancel' onClick={() => reject()}>
					Cancel
				</Button>
				<Button
					id='dialog-save'
					disabled={!isValid}
					onClick={() =>
						resolve({
							header,
							gridType,
							gridCellSize: parseFloat(gridCellSize),
							colorScale,
							generate: false,
						})
					}
					color='primary'
				>
					Save
				</Button>
				<Button
					id='dialog-save-apply'
					disabled={!isValid}
					onClick={() =>
						resolve({
							header,
							gridType,
							gridCellSize: parseFloat(gridCellSize),
							colorScale,
							generate: true,
						})
					}
					color='primary'
				>
					Save and Generate
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default withDialog(HeatmapSettingsDialog);
