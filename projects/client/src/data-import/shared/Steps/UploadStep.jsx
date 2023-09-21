import { faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { Box, Container, Grid } from '@material-ui/core';
import { useCallback, useState } from 'react';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, DropBoxFileInput } from '@/components';
import { useHotkey } from '@/components/hooks/useHotkey';
import { Button as ButtonV2, Link } from '@/components/v2';
import { sanitizeFile } from '@/helpers/fileHelper';

const noop = () => null;
const emptyArr = [];

const LIMITLESS_SUBDOMAINS = ['ch4', 'ip', 'archenergy', 'hilcorp'];

export function UploadStep({
	files = emptyArr,
	uploadFiles = noop,
	addFile = noop,
	uploading,
	completed,
	onNext,
	noteAbove = '',
	note = null,
	missingRequired,
	accept = '.csv,.xlsx,.accdb,.mdb',
	normalSizeLimit,
	increasedSizeLimit,
	uploadType = '',
}) {
	const onChange = useCallback(
		(name, newFiles) => {
			// what's this for?
			if (newFiles) {
				const sanitizedFile = sanitizeFile(newFiles[0]);
				addFile((prevFiles) => ({ ...prevFiles, [name]: sanitizedFile }));
			} else {
				addFile(({ [name]: _nm, ...prevFiles }) => prevFiles);
			}
		},
		[addFile]
	);

	const subdomain = window.location.host.split('.')[0];
	const limitlessSubdomain = LIMITLESS_SUBDOMAINS.includes(subdomain);
	const [shortcutEnabled, enableShortcut] = useState(false);
	useHotkey('ctrl+shift+z', () => enableShortcut((value) => !value));
	const increaseFileLimit = limitlessSubdomain && shortcutEnabled;

	const getTagging = (uploadType, completed) => {
		if (completed) return {};

		if (uploadType === 'phdwin') {
			return getTaggingProp('dataImport', 'phdwinDataUpload');
		} else if (uploadType === 'aries') {
			return getTaggingProp('dataImport', 'ariesDataUpload');
		} else {
			return {};
		}
	};

	return (
		<>
			{noteAbove}
			<Container
				css={`
					margin-top: 1rem;
					${files?.length === 2 && `max-width: 800px;`}// TODO: improve grid alignment later
				`}
			>
				<Grid
					css={`
						padding-top: 1rem;
						padding-bottom: 1rem;
					`}
					container
					justify='space-between'
				>
					{files.map(
						({
							name,
							label,
							uploading: fileUploading,
							progress,
							fileName,
							accept: fileAccept,
							template,
							taggingProp: downloadTaggingProp,
						}) => (
							<Grid item key={name ?? fileName ?? label}>
								<div
									css={`
										display: flex;
										align-items: center;
										justify-content: center;
										flex-direction: column;
										& > *:not(:first-child) {
											margin-top: 1rem;
										}
									`}
								>
									<DropBoxFileInput
										fileName={fileName}
										uploading={fileUploading}
										progress={progress}
										key={name}
										label={label}
										onChange={(newFiles) => onChange(name, newFiles)}
										disabled={fileUploading || completed}
										accept={fileAccept || accept}
										limit={increaseFileLimit ? increasedSizeLimit : normalSizeLimit}
									/>
									{template && (
										<ButtonV2
											href={template}
											component={Link}
											color='secondary'
											{...downloadTaggingProp}
										>
											Download Template
										</ButtonV2>
									)}
								</div>
							</Grid>
						)
					)}
				</Grid>
				{note}
				<Box mt={2} display='flex' justifyContent='flex-end'>
					<Button
						disabled={uploading || missingRequired}
						onClick={completed ? onNext : uploadFiles}
						faIcon={faChevronRight}
						iconBefore={false}
						secondary
						raised
						{...getTagging(uploadType, completed)}
					>
						{completed ? 'NEXT' : 'UPLOAD'}
					</Button>
				</Box>
			</Container>
		</>
	);
}
