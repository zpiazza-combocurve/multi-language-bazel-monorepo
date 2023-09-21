import { faFileUpload, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { useState } from 'react';
import { FileInput } from 'react-md';

import { genericErrorAlert } from '@/helpers/alerts';
import { FileType, sanitizeFiles } from '@/helpers/fileHelper';

import { Box, Icon, IconButton, InfoIcon, Link, Paper } from './v2';

export const FileUpload = ({
	acceptableFileType,
	acceptableFileTypeNames,
	onUpload,
	sheetNameTooltip,
	templateLink,
}: {
	acceptableFileType: Set<string>;
	acceptableFileTypeNames: Set<string>;
	onUpload: (file: FileType) => void;
	sheetNameTooltip?: string;
	templateLink?: string;
}) => {
	const acceptableMessage = `Acceptable file types: ${[...acceptableFileType].join(', ')}`;
	const acceptableFileTypeNamesCombined = `${[...acceptableFileTypeNames].join(', ')}`;

	const [uploadedFile, setFile] = useState<FileType>();
	const handleDrop = (attachments) => {
		const checkExtension = (ex) => !acceptableFileType.has(ex.toLowerCase());

		try {
			const { sanitized } = sanitizeFiles([attachments], new Set(), false, true);

			const file = sanitized[0];
			file.extensionError = checkExtension(file.extension);
			setFile({ ...file });
			onUpload({ ...file });
		} catch (e) {
			genericErrorAlert(e);
		}
	};

	return (
		<Box className='file-upload' sx={{ display: 'flex', justifyContent: 'space-between' }}>
			<Box>
				<Box sx={{ mb: '1rem', height: '40px', display: 'flex', alignItems: 'center' }}>
					<div>Import File Type</div>
				</Box>
				<Box sx={{ margin: '1rem 0' }}>
					<div>{acceptableFileTypeNamesCombined}</div>
					<Box
						css={`
							color: ${({ theme }) => theme.palette.secondary.main};
							display: flex;
							flex-direction: column;
						`}
						sx={{ fontSize: '.75rem' }}
					>
						{`*${acceptableMessage}`}
						{templateLink && (
							<Link
								color='secondary'
								href={templateLink}
								css={`
									margin-top: 0.5rem;
									text-decoration: underline !important;
								`}
							>
								Download Template
							</Link>
						)}
					</Box>
				</Box>
			</Box>
			<Box sx={{ marginLeft: '5rem', flex: 1 }}>
				<Box sx={{ display: 'flex', borderBottom: '1px solid', justifyContent: 'space-between' }}>
					<div
						css={`
							display: flex;
							align-items: center;
						`}
					>
						Upload File
						{sheetNameTooltip && <InfoIcon withLeftMargin tooltipTitle={sheetNameTooltip} />}
					</div>
					<Box sx={{ paddingBottom: '.50rem' }}>
						<FileInput
							flat
							secondary
							iconBefore
							allowDuplicates
							label='Choose File'
							onChange={handleDrop}
							css={`
								border: 1px solid rgba(34, 138, 218, 0.5);
								border-radius: 4px;
							`}
							labelClassName='unset-text-transform'
							id='cc-mass-import-select-file'
							icon={<Icon>{faFileUpload}</Icon>}
						/>
					</Box>
				</Box>
				<Box sx={{ margin: '1rem 0', minHeight: '50px' }}>
					{uploadedFile && (
						<Paper
							css={`
								display: flex;
								align-items: center;
								justify-content: space-between;
								padding: 0 10px;
								margin-bottom: 1rem;
								background-color: ${({ theme }) => theme.palette.background.opaque};
							`}
						>
							<div>{uploadedFile.name}</div>
							<IconButton
								edge='end'
								tooltipTitle='Remove File'
								onClick={() => setFile(undefined)}
								color='default'
							>
								{faTrash}
							</IconButton>
						</Paper>
					)}
				</Box>
			</Box>
		</Box>
	);
};
