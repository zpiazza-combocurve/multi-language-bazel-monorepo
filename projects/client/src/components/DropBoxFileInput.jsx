// https://stackoverflow.com/questions/572768/styling-an-input-type-file-button/25825731#25825731
// https://stackoverflow.com/questions/8006715/drag-drop-files-into-standard-html-file-input
import { useRef, useState } from 'react';
// TODO use material-ui
import styled, { css } from 'styled-components';

import { Button } from '@/components/v2';
import { warningAlert } from '@/helpers/alerts';
import { ifProp, theme } from '@/helpers/styled';

import { useRerender } from './hooks';
import { LinearProgressWithLabel } from './v2/misc';

const space = '1rem';
const smallSpace = '0.5rem';

const HiddenInput = styled.input`
	display: none;
`;

const Box = styled.div`
	display: inline-block;
	padding: ${space};
	border: 2px dashed ${theme.textColor};
	${ifProp('dragover', `background-color: ${theme.backgroundOpaque};`)}
	${ifProp('fullWidth', 'width: 100%;', 'width: 300px;')}
`;

export function DropBox({ disabled, onDrop, ...props }) {
	const [dragover, setDragover] = useState(false);

	const handleDragOver = (ev) => {
		ev.preventDefault();
		setDragover(true);
	};

	const handleDragLeave = (ev) => {
		ev.preventDefault();
		setDragover(false);
	};

	const handleDrop = (ev) => {
		setDragover(false);
		if (onDrop) {
			return onDrop(ev);
		}
		return null;
	};

	return (
		<Box
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			dragover={disabled ? false : dragover}
			{...props}
		/>
	);
}

const InnerBox = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`;

const Title = styled.div`
	font-size: 1.25rem;
	text-align: center;
`;

const MainText = styled.div`
	font-size: 1.5rem;
	margin: 1.5rem 0;
	overflow: hidden;
	text-align: center;
	text-overflow: ellipsis;
	white-space: pre;
	${ifProp('empty', `color: ${theme.textColor};`)}
`;

// Meant to mimic AccessibleFakeButton from react-md
// https://mlaursen.github.io/react-md-v1-docs/#/components/helpers/accessible-fake-buttons
const divFunction = (props) => <div {...props} />;
const CustomAcessButton = (props) => <Button component={divFunction} {...props} />;

const buttonStyle = css`
	position: relative;
	transition: all ease 0.25s;
	padding: ${smallSpace};
	text-align: center;

	&:active {
		top: 1px;
	}
`;

export const SelectButton = styled(CustomAcessButton)`
	${buttonStyle}
`;

const ClearButton = styled(CustomAcessButton)`
	${buttonStyle}

	&:hover {
		color: ${theme.warningColor};
	}
`;

const ProgressSection = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

/** @param {{ name: string }} file */
const getExtension = (file) => {
	const nameArr = file.name.split('.');
	return nameArr.length > 1 ? `.${nameArr.pop()}`.toLowerCase() : '';
};

/**
 * @typedef Props
 * @property {string} [label]
 * @property {(files: File[] | null | undefined) => void} onChange Called with user selected files
 * @property {boolean} [uploading] If the file is uploading
 * @property {number} [progress | null] File upload progress
 * @property {boolean} [disabled]
 * @property {number} [limit] MB limit the file size can be
 * @property {string} [accept] Separated by comma string of list of extensions the file can be
 * @property {string} [fileName] Indicates if the input have a previous value, for presentational prurpose only
 * @property {string} [className]
 * @property {boolean} [fullWidth]
 * @param {Props} props
 */
export function DropBoxFileInput({
	label,
	onChange,
	className = '',
	uploading = false,
	progress = 0,
	disabled = false,
	fileName = undefined,
	accept = undefined,
	limit = undefined,
	fullWidth = false,
}) {
	const rerender = useRerender();
	const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

	const hasPrevFile = !!fileName;
	const hasFile = hasPrevFile || inputRef.current?.files?.length > 0;
	const name = hasPrevFile ? fileName : inputRef?.current?.files?.[0]?.name;

	const handleInputChange = () => {
		const file = inputRef.current?.files?.[0];
		if (!file) {
			return;
		}
		const extension = getExtension(file);
		const fileSize = file.size / 1024 / 1024;
		if (limit !== undefined && fileSize >= limit) {
			warningAlert(`Warning: File size can't exceed ${Math.round(limit * 100) / 100} MB`);
			inputRef.current.value = '';
			return;
		}
		if (accept && !accept.split(',').includes(extension)) {
			warningAlert('Warning: Invalid file type');
			inputRef.current.value = '';
			return;
		}
		if (onChange) {
			onChange(inputRef.current.files);
		}
		rerender();
	};

	const handleDrop = (ev) => {
		ev.preventDefault();
		if (disabled) {
			return;
		}
		const files = ev.dataTransfer.files;
		inputRef.current.files = files;
		handleInputChange();
	};

	const handleClear = () => {
		inputRef.current.value = '';
		rerender();
		if (onChange) {
			onChange();
		}
	};

	const noFileName = disabled ? 'File not uploaded' : 'Drag a file here';

	return (
		<DropBox className={className} onDrop={handleDrop} disabled={disabled} fullWidth={fullWidth}>
			<InnerBox>
				<Title>{label}</Title>
				<MainText empty={!hasFile} title={name}>
					{hasFile ? name : noFileName}
				</MainText>

				{uploading && (
					<ProgressSection>
						<LinearProgressWithLabel
							value={progress}
							css={{ width: '100%' }}
							color='secondary'
							labelAdjacent
						/>
					</ProgressSection>
				)}
				{hasFile && !disabled && <ClearButton onClick={handleClear}>Clear</ClearButton>}
				{/* eslint-disable-next-line */}
				<label>
					{!hasFile && !disabled && (
						<SelectButton variant='contained' color='secondary' fullWidth>
							or select from computer
						</SelectButton>
					)}
					<HiddenInput
						ref={inputRef}
						type='file'
						onChange={handleInputChange}
						disabled={disabled}
						accept={accept}
					/>
				</label>
			</InnerBox>
		</DropBox>
	);
}
