import { faCheckCircle, faPencil, faTimesCircle } from '@fortawesome/pro-regular-svg-icons';
import { CircularProgress, InputAdornment } from '@material-ui/core';
import { useState } from 'react';

import { Icon, Stack, TextField } from '@/components/v2';

interface NetworkTitleProps {
	name: string;
	label?: string;
	onRename?: (name: string) => void;
	isRenaming: boolean;
}

export const ModelTitle = ({ name, onRename, isRenaming, label }: NetworkTitleProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const [currentName, setCurrentName] = useState(name);

	return (
		<TextField
			value={currentName}
			label={label}
			onChange={(ev) => setCurrentName(ev.target.value)}
			InputProps={{
				disableUnderline: !isEditing,
				inputProps: { disabled: !isEditing, title: name },
				endAdornment: !!onRename && (
					<InputAdornment position='end'>
						{isEditing ? (
							!isRenaming ? (
								<Stack direction='row' spacing={1}>
									<Icon
										fontSize='medium'
										onClick={async () => {
											if (isRenaming) return;
											await onRename(currentName);
											setIsEditing(false);
										}}
									>
										{faCheckCircle}
									</Icon>
									<Icon
										fontSize='medium'
										onClick={() => {
											if (isRenaming) return;
											setCurrentName(name);
											setIsEditing(false);
										}}
									>
										{faTimesCircle}
									</Icon>
								</Stack>
							) : (
								<CircularProgress size={16} />
							)
						) : (
							<Icon fontSize='medium' onClick={() => setIsEditing(true)}>
								{faPencil}
							</Icon>
						)}
					</InputAdornment>
				),
			}}
			css={`
				.MuiInput-input {
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				.MuiInputAdornment-root {
					cursor: pointer;
				}
			`}
		/>
	);
};
