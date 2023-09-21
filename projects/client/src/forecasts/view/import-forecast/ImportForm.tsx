import { useCallback, useEffect } from 'react';
import { Control } from 'react-hook-form';
import styled from 'styled-components';

import { DropBox, SelectButton } from '@/components/DropBoxFileInput';
import { Button, Divider, FormLabel, RHFRadioGroupField } from '@/components/v2';
import { InfoTooltipWrapperProps } from '@/components/v2/misc/InfoIcon';
import { genericErrorAlert } from '@/helpers/alerts';
import { sanitizeFiles } from '@/helpers/fileHelper';

type FileExtension = '.csv' | '.xlsx' | '.xls' | '.txt';
const fileExtensions: FileExtension[] = ['.csv', '.xlsx', '.xls', '.txt'];
const ARIES_TOOLTIPS =
	'Import ARIES ECONOMICS DATA EXPORTER txt files with "PRODUCTION" section and not "All Economic Lines".' +
	' Only the winning qualifier from the Scenario will be imported. Any wells not present in CC will be ignored.';

const excludeFileFormats = (formatsToExclude: FileExtension[]): FileExtension[] => {
	return fileExtensions.filter((format) => !formatsToExclude.includes(format));
};

interface SourceOptions {
	label: string;
	value: string;
	acceptedFormats: FileExtension[];
	tooltipInfo?: InfoTooltipWrapperProps;
}
const SOURCE_OPTIONS: SourceOptions[] = [
	{
		label: 'ComboCurve',
		value: 'combocurve',
		acceptedFormats: excludeFileFormats(['.txt']),
	},
	{ label: 'PHDwin', value: 'phdWin', acceptedFormats: excludeFileFormats(['.txt']) },
	{
		label: 'ARIES',
		value: 'aries',
		acceptedFormats: excludeFileFormats(['.xlsx', '.xls', '.csv']),
		tooltipInfo: { tooltipTitle: ARIES_TOOLTIPS, placeIconAfter: true },
	},
];

const RESOLUTION_OPTIONS = [
	{ label: 'Monthly', value: 'monthly' },
	{ label: 'Daily', value: 'daily' },
];

const getValidFormatsFromSource = (fileSource: string): FileExtension[] => {
	const source = SOURCE_OPTIONS.find(({ value }) => value === fileSource);
	return source?.acceptedFormats ?? [];
};

const WELL_IDENTIFIER_OPTIONS = [
	{ label: 'INPT ID', value: 'inptID' },
	{ label: 'Chosen ID', value: 'chosenID' },
	{ label: 'API 10', value: 'api10' },
	{ label: 'ARIES ID', value: 'aries_id' },
	{ label: 'API 14', value: 'api14' },
	{ label: 'PHDwin ID', value: 'phdwin_id' },
	{ label: 'API 12', value: 'api12' },
];

export type FormValues = {
	source: string;
	resolution: string;
	wellIdentifier: string;
};

interface ImportFormProps {
	extensionError: string | null;
	control: Control<FormValues>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	file: any;
	fileSource: string;
	setExtensionError: (error: string | null) => void;
	setFile: (file) => void;
}

const SectionDiv = styled.div`
	display: flex;
	margin: 1rem 0;
`;

const HelperTextDiv = styled.div`
	overflow: hidden;
	text-overflow: ellipsis;
	text-align: center;
`;

const ImportForm = ({ control, extensionError, file, fileSource, setExtensionError, setFile }: ImportFormProps) => {
	const validFileExtensions = getValidFormatsFromSource(fileSource);
	const validateFile = useCallback(
		(file) => {
			if (!validFileExtensions.includes(file.extension.toLowerCase())) {
				setExtensionError(`Acceptable File Types: ${validFileExtensions.join(', ')}`);
			} else {
				setExtensionError(null);
			}
		},
		[setExtensionError, validFileExtensions]
	);

	useEffect(() => {
		if (file) {
			validateFile(file);
		}
	}, [file, fileSource, validateFile]);

	const handleFileChange = (file) => {
		try {
			const { sanitized } = sanitizeFiles([file], new Set(), false, true);
			const newFile = sanitized[0];
			validateFile(newFile);
			setFile(newFile);
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const handleDrop = (e) => {
		e.preventDefault();
		handleFileChange(e.dataTransfer.files?.[0]);
	};

	const handleClear = (e) => {
		e.preventDefault();
		setFile(null);
		setExtensionError(null);
	};

	const fileText = file ? file.name : 'Drag a file here';

	return (
		<>
			<SectionDiv>
				<RHFRadioGroupField
					control={control}
					name='source'
					options={SOURCE_OPTIONS}
					css='width: 50%'
					label='Source'
				/>
				<div
					css={`
						display: flex;
						flex-direction: column;
						width: 50%;
					`}
				>
					<FormLabel component='legend'>Forecast Parameters Upload</FormLabel>
					<DropBox
						disabled={!!file}
						onDrop={handleDrop}
						css={`
							width: 100%;
							margin: 9px 0;
							flex: 1 1 auto;
						`}
					>
						<label>
							<HelperTextDiv>{fileText}</HelperTextDiv>
							{extensionError && <HelperTextDiv css='font-size: .8rem'>{extensionError}</HelperTextDiv>}
							<div>
								{!file ? (
									<section>
										<label htmlFor='import-forecast-upload'>
											<SelectButton variant='contained' color='secondary' fullWidth>
												or select from computer
											</SelectButton>
										</label>
										<input
											css='display: none'
											id='import-forecast-upload'
											accept={validFileExtensions.join(', ')}
											onChange={(ev) => handleFileChange(ev.target.files?.[0])}
											type='file'
											hidden
										/>
									</section>
								) : (
									<Button color='warning' onClick={handleClear} fullWidth>
										Clear
									</Button>
								)}
							</div>
						</label>
					</DropBox>
				</div>
			</SectionDiv>
			<Divider />
			<SectionDiv>
				<RHFRadioGroupField
					css='width: 50%'
					control={control}
					name='resolution'
					options={RESOLUTION_OPTIONS}
					label='Forecast Resolution'
					tooltipTitle='Resolution of the production data on which the incoming forecast was generated'
				/>
			</SectionDiv>

			{['aries'].includes(fileSource) && (
				<>
					<Divider />
					<SectionDiv>
						<RHFRadioGroupField
							gridOptions={{
								xs: 6,
							}}
							control={control}
							name='wellIdentifier'
							options={WELL_IDENTIFIER_OPTIONS}
							label='Well Identifier'
						/>
					</SectionDiv>
				</>
			)}
		</>
	);
};

export default ImportForm;
