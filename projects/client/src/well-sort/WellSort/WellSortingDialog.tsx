import { Dialog, DialogActions, DialogContent } from '@material-ui/core';
import { produce } from 'immer';

import { useDerivedState } from '@/components/hooks';
import { Button, InfoIcon } from '@/components/v2';
import { Section, SectionContent, SectionFooter } from '@/layouts/Section';

import { SortableColumnList } from './WellSortingDialog/SortableColumnList';
import { useAvailableWellColumns } from './shared';

export function WellSortingDialog({
	resolve,
	sortedColumns,
	columns,
	editSortingName,
	onHide,
	visible,
	allowEmpty,
	usesGrouping,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	resolve(value: any): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	sortedColumns: any[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	columns: any[];
	editSortingName: string;
	onHide(): void;
	visible: boolean;
	allowEmpty?: boolean;
	usesGrouping?: boolean;
}) {
	const [sortDraft, setSortDraft] = useDerivedState(sortedColumns);
	const availableColumnsKey = useAvailableWellColumns(columns, sortDraft);
	const addColumn = () =>
		setSortDraft(
			produce((draft) => {
				draft.push({ field: availableColumnsKey[0], direction: 1 });
			})
		);

	const WellSortTitle = (
		<div css='display: flex'>
			<h2
				className='md-text'
				css={`
					margin-left: 15px;
					margin-top: 15px;
				`}
			>
				{editSortingName ? `Edit ${editSortingName} sorting` : 'Well Sort'}
			</h2>
			<InfoIcon
				tooltipTitle='Grouping is now accessed in the columns pane to the right of the scenario table'
				css={`
					margin-left: 10px;
					margin-top: 25px;
				`}
			/>
		</div>
	);
	usesGrouping = false;
	return (
		<Dialog open={visible} onClose={onHide} maxWidth='md' fullWidth>
			{WellSortTitle}
			<DialogContent
				css={`
					height: 30rem;
				`}
			>
				<Section>
					<SectionContent>
						<SortableColumnList
							sortedColumns={sortDraft}
							setSortedColumns={setSortDraft}
							availableColumnsKey={availableColumnsKey}
							columns={columns}
							allowEmpty={allowEmpty}
							usesGrouping={usesGrouping}
						/>
					</SectionContent>
					<SectionFooter>
						<Button
							color='secondary'
							onClick={addColumn}
							disabled={!availableColumnsKey.length}
							variant='outlined'
						>
							Add Criteria
						</Button>
					</SectionFooter>
				</Section>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => onHide()}>Cancel</Button>
				<Button onClick={() => resolve(sortDraft)} color='primary'>
					{editSortingName ? 'Update' : 'Sort'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
