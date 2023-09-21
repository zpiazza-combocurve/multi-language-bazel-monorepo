import { Dialog, DialogContent, makeStyles } from '@material-ui/core';
import { matchSorter } from 'match-sorter';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'react-query';

import { useDebouncedState } from '@/components/hooks';
import { Autocomplete, Icon } from '@/components/v2';
import { AutocompleteProps } from '@/components/v2//misc/Autocomplete';
import { withDispatchComponent } from '@/helpers/global-components';

export interface ICommand {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	icon?: any;
	label: string;
	action: () => void;
}

const listItemHeight = '2.25rem';

const useAutocompleteStyles = makeStyles({
	listbox: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		height: ({ itemCount }: any) => `calc(${listItemHeight} * ${itemCount} + 1rem)`,
		transition: 'height 250ms',
	},
	option: {
		paddingLeft: '0.5rem',
		paddingRight: '0.5rem',
	},
});

function Launcher({
	visible,
	commands,
	onClose: _onClose,
	onChange,
	...props
}: Partial<Omit<AutocompleteProps, 'onChange' | 'options'>> & {
	visible: boolean;
	commands: ICommand[];
	onClose: () => void;
	onChange?: (value: string) => void;
}) {
	const optionsLabelMap = useMemo(
		() =>
			commands.reduce((acc, value) => {
				acc[value.label] = value;
				return acc;
			}, {}),
		[commands]
	);

	// https://v4.mui.com/components/autocomplete/#advanced
	const filterOptions = useCallback(
		(options, { inputValue }) => {
			const result = matchSorter(
				options.map(({ label }) => label),
				inputValue?.trim()
			).map((label) => optionsLabelMap[label]);
			return result;
		},
		[optionsLabelMap]
	);

	const [renderedInputValue, setInputValue] = useState('');

	const filteredOptions = useMemo(
		() => filterOptions(commands, { inputValue: renderedInputValue }),
		[filterOptions, commands, renderedInputValue]
	);

	const autoCompleteStyles = useAutocompleteStyles({ itemCount: filteredOptions?.length });

	const onClose = () => {
		setInputValue('');
		_onClose();
	};

	return (
		<Dialog
			css={`
				.MuiDialog-scrollPaper {
					align-items: flex-start;
				}
				.MuiDialogContent-root:first-child {
					padding: 0;
				}
			`}
			onClose={onClose}
			fullWidth
			open={visible}
			transitionDuration={0}
		>
			<DialogContent>
				<Autocomplete
					classes={autoCompleteStyles}
					autoComplete
					autoFocus
					autoHighlight
					closeIcon={null}
					forcePopupIcon={false}
					filterOptions={filterOptions}
					getOptionLabel={({ label }) => label}
					renderOption={({ label, icon }) => (
						<>
							<Icon
								css={`
									font-size: calc(1.25rem - 4px);
									margin: 2px;
								`}
							>
								{icon}
							</Icon>
							<span
								css={`
									margin-left: 0.5rem;
								`}
							>
								{label}
							</span>
						</>
					)}
					includeInputInList
					onChange={(_event, value) => {
						const { action } = value;
						action();
						onClose();
					}}
					onInputChange={(_event, value) => {
						onChange?.(value);
						setInputValue(value);
					}}
					onKeyDown={(event) => {
						const { keyCode, ctrlKey } = event;
						// TODO get this magic numbers outta here
						if (keyCode === 27 || (ctrlKey && keyCode === 80)) {
							event.preventDefault();
							onClose();
						}
					}}
					open
					openOnFocus
					options={commands}
					variant='outlined'
					{...props}
				/>
			</DialogContent>
		</Dialog>
	);
}

export function AsyncLauncher({
	visible,
	commandGetter,
	onClose,
	...props
}: Partial<AutocompleteProps> & {
	visible: boolean;
	commandGetter: (value: string) => Promise<ICommand[]>;
	onClose: () => void;
}) {
	const [search, setSearch] = useDebouncedState(100, '');
	const queryKey = ['launcher', 'quick-search', search];
	const { data: commands, isLoading } = useQuery(queryKey, () => commandGetter(search), {
		enabled: visible && !!search,
	});
	return (
		<Launcher
			visible={visible}
			commands={commands ?? []}
			onClose={() => {
				onClose();
				setSearch('');
			}}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			onChange={setSearch as any}
			loading={isLoading}
			{...props}
		/>
	);
}

export const showLauncher = withDispatchComponent(Launcher, { closeProp: 'onClose' }, { visible: true });

export const showAsyncLauncher = withDispatchComponent(AsyncLauncher, { closeProp: 'onClose' }, { visible: true });
