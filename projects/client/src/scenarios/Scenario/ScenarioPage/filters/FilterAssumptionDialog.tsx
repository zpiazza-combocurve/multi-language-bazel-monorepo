import { faSearch } from '@fortawesome/pro-regular-svg-icons';
import {
	Divider,
	IconButton,
	InputAdornment,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Typography,
} from '@material-ui/core';
import produce from 'immer';
import { escapeRegExp } from 'lodash';
import { difference, uniq } from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';

import { FontAwesomeIcon } from '@/components/FontAwesomeIcon';
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';
import { theme } from '@/helpers/styled';

const colorByAssumptionId = {
	none: theme.warningColor,
	unique: theme.purpleColor,
};
const defaultColor = theme.textColor;

function getColor(_id, lookup) {
	if (lookup) {
		return theme.secondaryColor;
	}
	return colorByAssumptionId[_id] ?? defaultColor;
}

interface Model {
	_id: Inpt.ObjectId;
	name: string;
	scenarioWellAssignments: Inpt.ObjectId[];
	scenarioWellAssignmentsCount: number;
}

interface FilterState {
	none: Inpt.ObjectId[];
	[name: string]: Inpt.ObjectId[];
}

export const FilterAssumptionDialog = ({
	assumptionName,
	allAssignments,
	filterState,
	allModels = [],
	allLookups = [],
	resolve,
	onHide,
	visible,
}: DialogProps<{
	models: Partial<FilterState>;
	scenarioWellAssignments: (string | undefined)[];
}> & {
	assumptionName: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	allAssignments: any;
	allModels: Model[];
	allLookups: Model[];
	filterState?: Partial<FilterState>;
}) => {
	const modelsAndLookups = useMemo(
		() => [...allModels, ...allLookups.map((lookup) => ({ lookup: true, ...lookup }))],
		[allModels, allLookups]
	);
	const [searchList, setSearchList] = useState<Model[] | null>(null);
	const [searchText, setSearchText] = useState('');
	const [models, setModels] = useState(filterState ?? {});

	const assignmentIdsWithAssumptions = modelsAndLookups
		.map(({ scenarioWellAssignments }) => scenarioWellAssignments)
		.flat();
	const allAssignmentIds = allAssignments.map(({ _id }) => _id);

	const allModelsWithNone = [
		{
			_id: 'none',
			name: 'Unassigned Wells',
			scenarioWellAssignments: difference(allAssignmentIds, assignmentIdsWithAssumptions),
			scenarioWellAssignmentsCount:
				allAssignments.length -
				modelsAndLookups.reduce((acc, cur) => acc + cur.scenarioWellAssignmentsCount, 0),
		},
		...modelsAndLookups,
	];

	const list = searchList || allModelsWithNone;

	const searchModels = () => {
		setSearchList(
			searchText
				? modelsAndLookups.filter((model) => new RegExp(escapeRegExp(searchText), 'i').test(model.name))
				: null
		);
	};

	useEffect(searchModels, [searchText, modelsAndLookups]);

	const onApply = () => resolve({ models, scenarioWellAssignments: uniq(Object.values(models).flat()) });

	const toggleModel = (checked, model) => {
		if (checked) {
			setModels(
				produce((draft) => {
					draft[model._id] = model.scenarioWellAssignments;
				})
			);
		} else {
			setModels(
				produce((draft) => {
					delete draft[model._id];
				})
			);
		}
	};

	const toggleAll = (checked) => {
		if (checked) {
			setModels(
				produce((draft) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					list.forEach((assumption: any) => {
						const { _id, scenarioWellAssignments } = assumption;
						draft[_id] = scenarioWellAssignments;
					});
				})
			);
		} else {
			setModels({});
		}
	};

	return (
		<Dialog onClose={onHide} open={visible} maxWidth='sm' fullWidth>
			<DialogTitle>Filter By {assumptionName}</DialogTitle>
			<DialogContent>
				<TextField
					label={`Filter By Model | ${allAssignments.length} Total Wells`}
					placeholder='Search By Model Name'
					fullWidth
					debounce
					onChange={(event) => setSearchText(event.target.value)}
					InputLabelProps={{
						shrink: true,
					}}
					InputProps={{
						endAdornment: (
							<InputAdornment position='end'>
								<IconButton edge='end' onClick={() => searchModels()}>
									<FontAwesomeIcon icon={faSearch} size='xs' />
								</IconButton>
							</InputAdornment>
						),
					}}
				/>
				{list.length ? (
					<List>
						<ListItem>
							<ListItemIcon>
								<Checkbox
									tooltipTitle='Select All'
									edge='start'
									checked={Object.keys(models).length === list.length}
									onChange={(event) => toggleAll(event.target.checked)}
									tabIndex={-1}
									disableRipple
								/>
							</ListItemIcon>
						</ListItem>
						<Divider />
						{/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later */}
						{list.map((assumption: any) => {
							const { _id, name, scenarioWellAssignmentsCount, lookup } = assumption;

							return (
								<ListItem key={_id} button onClick={() => toggleModel(!models[_id], assumption)}>
									<ListItemIcon>
										<Checkbox
											edge='start'
											checked={!!models[_id]}
											onChange={(event) => toggleModel(event.target.checked, assumption)}
											tabIndex={-1}
											disableRipple
										/>
									</ListItemIcon>
									<ListItemText
										primary={
											<Typography component='h6' css={{ color: getColor(_id, lookup) }}>
												{name}
											</Typography>
										}
										secondary={`${(
											(scenarioWellAssignmentsCount / allAssignments.length) *
											100
										).toFixed(1)}% | ${scenarioWellAssignmentsCount} ${
											scenarioWellAssignmentsCount === 1 ? 'Well' : 'Wells'
										}`}
									/>
								</ListItem>
							);
						})}
					</List>
				) : (
					<Box mt={4}>
						<Typography variant='h6'>There are no models matching your search</Typography>
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='primary' onClick={onApply} disabled={!Object.keys(models).length}>
					Apply Filter
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default FilterAssumptionDialog;
