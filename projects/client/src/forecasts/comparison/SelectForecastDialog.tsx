/* eslint react/jsx-key: warn */
import produce from 'immer';
import _, { set } from 'lodash-es';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useSelection } from '@/components/hooks/index';
import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	List,
	ListItem,
	ListItemSecondaryAction,
	ListItemText,
} from '@/components/v2';
import { SelectField } from '@/components/v2/misc';
import { KEYS } from '@/forecasts/api';
import { genericErrorAlert, warningAlert, withLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { queryClient } from '@/helpers/query-cache';
import { putApi } from '@/helpers/routing';
import { capitalize } from '@/helpers/text';
import { getFullName } from '@/helpers/user';
import { assert } from '@/helpers/utilities';

import { useAllProjectForecasts } from '../charts/components/deterministic/grid-chart/api';
import { ProjectForecastItem } from '../types';

const COMPARISON_RESOLUTION_ITEMS = [
	{ label: 'Monthly', value: 'monthly' },
	{ label: 'Daily', value: 'daily' },
];

const MAX_FORECAST_COMPARISONS = 3;

const ListItemActions = styled.section`
	align-items: center;
	column-gap: 1rem;
	display: flex;
	justify-content: space-around;
	min-width: 300px;
`;

const EMPTY_ARRAY = [];

const EMPTY_OBJECT = {};

const SelectForecastDialog = ({
	comparisonIds: parentComparisonIds = EMPTY_ARRAY,
	comparisonKey = 'view',
	comparisonResolutions: parentComparisonResolutions = EMPTY_OBJECT,
	onClose,
	onConfirm,
	refForecastId,
	visible,
}: {
	comparisonIds?: Array<string>;
	comparisonKey?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	comparisonResolutions?: Record<string, any>;
	onClose: () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onConfirm: (selected: Array<string>, retRes: Record<string, any>) => void;
	refForecastId?: string;
	visible: boolean;
}) => {
	const { project } = useAlfa();
	assert(project?._id);

	const [comparisonResolutions, setComparisonResolutions] = useState({});
	const [forecasts, setForecasts] = useState<ProjectForecastItem[] | undefined>([]);
	// @ts-expect-error -- TODO: fix later. are forecasts objects or string? useSelection hook expects array/set of strings
	const { selectedSet: selected, isSelected, select, deselect } = useSelection(forecasts, parentComparisonIds);

	const comparisonResolutionsRef = useRef(comparisonResolutions);
	const parentResolutionsRef = useRef(parentComparisonResolutions); // init: require comparisonResolutions to be initialized as the actual value

	comparisonResolutionsRef.current = comparisonResolutions;

	const confirm = useCallback(async () => {
		try {
			const selectedArr = [...selected];
			const retResolutions = _.pick(comparisonResolutionsRef.current, selectedArr);
			const body = {
				comparisonKey,
				updateValue: { ids: selectedArr, resolutions: retResolutions },
			};

			await withLoadingBar(putApi(`/forecast/${refForecastId}/update-forecast-comparisons`, body));
			// TODO: This will make the whole document to refresh which will cause the page to refresh, side effect can be really bad
			// workAround can be: do the following code when component unmounts, however this is too hard to understand for new employees
			// TODO: this causes the scenario compare forecast behave weirdly
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			queryClient.setQueryData(KEYS.forecastDocument(refForecastId), (oldData: Record<string, any>) =>
				produce(oldData, (draft) => {
					set(draft, `comparisonIds.${comparisonKey}`, { ids: selectedArr, resolutions: retResolutions });
					return draft;
				})
			);

			onConfirm(selectedArr, retResolutions);
		} catch (error) {
			genericErrorAlert(error);
		}
	}, [comparisonKey, onConfirm, refForecastId, selected]);

	const toggleForecast = useCallback(
		(checked, id) => {
			const curSelected = new Set(selected);
			if (checked) {
				if (curSelected.size >= MAX_FORECAST_COMPARISONS) {
					warningAlert(`Max allowed comparisons is ${MAX_FORECAST_COMPARISONS}`);
					return;
				}
				select(id);
			} else {
				deselect(id);
			}
		},
		[deselect, select, selected]
	);

	const setForecastResolution = useCallback(
		(id, value) => setComparisonResolutions((prevValue) => ({ ...prevValue, [id]: value })),
		[]
	);

	const allProjectForecastsQuery = useAllProjectForecasts(project._id);
	// onMount
	useEffect(() => {
		const init = async () => {
			const initForecasts = allProjectForecastsQuery.data;
			const initComparedForecasts = initForecasts?.filter((forecast) => forecast._id !== refForecastId);
			const initResolutions = initComparedForecasts?.reduce((obj, { _id }) => ({ ...obj, [_id]: 'monthly' }), {});
			setForecasts(initComparedForecasts);
			setComparisonResolutions({ ...initResolutions, ...parentResolutionsRef.current });
		};

		if (allProjectForecastsQuery.isSuccess) {
			init();
		}
	}, [allProjectForecastsQuery.data, allProjectForecastsQuery.isSuccess, project._id, refForecastId]);

	return (
		<Dialog fullWidth maxWidth='md' open={visible}>
			<DialogTitle>
				<div
					css={`
						display: flex;
						justify-content: space-between;

						// keep title lined up with "columnized" actions
						padding-left: 1rem;
						padding-right: 1.5rem;
						width: 100%;
					`}
				>
					<span>Select Forecasts (Best Series)</span>
					<span css='min-width: 300px;'>Data Used For EUR Calculation</span>
				</div>
			</DialogTitle>

			<DialogContent>
				<List>
					{!!forecasts?.length &&
						forecasts.map((forecast) => {
							const { _id, name, type, user } = forecast;
							return (
								<ListItem
									key={`forecast-selection-${_id}`}
									button
									onClick={() => toggleForecast(!isSelected(_id), _id)}
								>
									<ListItemText
										primary={name}
										primaryTypographyProps={{
											style: {
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												width: '60%',
											},
										}}
										secondary={`${getFullName(user)} | ${capitalize(type)}`}
									/>

									<ListItemSecondaryAction>
										<ListItemActions>
											<Divider css='width: 2px;' flexItem orientation='vertical' />

											<SelectField
												disabled={!isSelected(_id)}
												fullWidth
												menuItems={COMPARISON_RESOLUTION_ITEMS}
												onChange={(ev) => setForecastResolution(_id, ev.target.value)}
												value={comparisonResolutions[_id]}
											/>

											<Checkbox
												onChange={(_ev, checked) => toggleForecast(checked, _id)}
												checked={isSelected(_id)}
											/>
										</ListItemActions>
									</ListItemSecondaryAction>
								</ListItem>
							);
						})}
				</List>
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose}>Close</Button>

				<Button
					color='secondary'
					disabled={!selected?.size && comparisonKey !== 'diagnostics'}
					onClick={confirm}
					variant='contained'
				>
					{`Confirm (${selected?.size ?? 0})`}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default SelectForecastDialog;
