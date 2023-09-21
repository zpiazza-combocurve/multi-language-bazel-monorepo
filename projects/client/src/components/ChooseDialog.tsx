import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelection } from '@/components/hooks';
import {
	Button,
	CheckboxField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	TextField,
	Typography,
} from '@/components/v2';
import { textFieldCSS } from '@/create-wells/shared';
import { warningAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { filterSearch } from '@/helpers/utilities';

const MAX_COLUMNS = 200;

export type SectionItem = {
	key: string;
	label?: string;
};

export type Section = {
	key: string;
	label?: string;
	itemKeys: string[];
};

const ColumnsDivider = () => <Divider css='margin: 1.5rem 0;' orientation='horizontal' />;

const CheckboxesGrid = ({ children }) => (
	<div
		css={`
			margin-top: 0.5rem;
			padding-left: 0.5rem;
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(25rem, 1fr));
			grid-auto-rows: min-content;
			justify-items: start;
			align-items: start;
		`}
	>
		{children}
	</div>
);

const ColumnsSection = ({ title, checkboxes }: { title?: string; checkboxes: JSX.Element[] }) => (
	<>
		{title && <Typography>{title}</Typography>}
		<CheckboxesGrid>{checkboxes}</CheckboxesGrid>
		<ColumnsDivider />
	</>
);

const CheckboxItem = memo(
	({
		label,
		column,
		checked,
		toggle,
	}: {
		label?: string;
		column: string;
		checked: boolean;
		toggle: (key: string) => void;
	}) => <CheckboxField checked={checked} name={column} key={column} label={label} onChange={() => toggle(column)} />
);

export type ChooseDialogProps = {
	sections: Section[];
	items: SectionItem[];
	selectedKeys: string[];
	title: string;
	selectionLimit?: number | null;
	canSelectAll?: boolean;

	applyTaggingProp?: Record<string, string>;
} & DialogProps<string[] | null>;

export function ChooseDialog({
	sections,
	items,
	selectedKeys,
	title,
	selectionLimit = null,
	canSelectAll = true,
	visible,
	resolve,
	onHide,
}: ChooseDialogProps) {
	const itemsByKey = useMemo(() => _.keyBy(items, 'key'), [items]);
	const itemKeys = useMemo(() => Object.keys(itemsByKey), [itemsByKey]);

	const getLabel = useCallback((key: string) => itemsByKey[key]?.label ?? key, [itemsByKey]);

	const selection = useSelection(itemKeys, selectedKeys);

	const [search, setSearch] = useState('');

	const tooManySelected = selectionLimit !== null && selection.selectedSet.size > selectionLimit;

	useEffect(() => {
		if (tooManySelected) {
			warningAlert(`Select only a max of ${MAX_COLUMNS} items.`);
		}
	}, [tooManySelected]);

	const filteredColumns = useMemo(() => filterSearch(itemKeys, search, getLabel), [itemKeys, search, getLabel]);

	const filteredColumnsByKey = useMemo(() => _.keyBy(filteredColumns), [filteredColumns]);

	const handleDeselectAll = () => {
		selection.deselect(filteredColumns);
	};

	const handleSelectAll = () => {
		selection.selectAll();
	};

	return (
		<Dialog open={visible} onClose={onHide} maxWidth='lg' fullWidth>
			<DialogTitle css='padding-bottom: 0;' disableTypography>
				<div css='display: flex; justify-content: space-between;'>
					<Typography css='font-size: 18px; text-transform: capitalize;'>{title}</Typography>
					<IconButton size='small' onClick={onHide}>
						{faTimes}
					</IconButton>
				</div>
				<div
					css={`
						& > *:not(:first-child) {
							margin-left: 0.5rem;
						}

						display: flex;
						align-items: baseline;
						margin-top: 1rem;
					`}
				>
					<TextField
						css={textFieldCSS}
						variant='outlined'
						value={search}
						onChange={(ev) => setSearch(ev.target.value)}
						label='Search Columns'
						debounce
					/>
					<Button color='secondary' css='text-transform: none;' onClick={handleDeselectAll}>
						Deselect All
					</Button>
					{canSelectAll && (
						<Button color='secondary' css='text-transform: none;' onClick={handleSelectAll}>
							Select All
						</Button>
					)}
				</div>
				<ColumnsDivider />
			</DialogTitle>
			<DialogContent css='padding-top: 0;'>
				{sections.map((section) => {
					const checkboxes = _.uniq(section.itemKeys)
						.filter((itemKey) => filteredColumnsByKey[itemKey])
						.map((itemKey) => (
							<CheckboxItem
								key={itemKey}
								label={getLabel(itemKey)}
								column={itemKey}
								checked={selection.isSelected(itemKey)}
								toggle={selection.toggle}
							/>
						));

					if (checkboxes.length === 0) return null;

					return <ColumnsSection key={section.key} title={section.label} checkboxes={checkboxes} />;
				})}
			</DialogContent>
			<DialogActions>
				<Button color='secondary' onClick={onHide}>
					Cancel
				</Button>
				<Button
					color='secondary'
					variant='contained'
					onClick={() => resolve([...selection.selectedSet])}
					disabled={tooManySelected}
				>
					Apply ({selection.selectedSet.size})
				</Button>
			</DialogActions>
		</Dialog>
	);
}
