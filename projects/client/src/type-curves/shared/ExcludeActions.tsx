import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import _ from 'lodash-es';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { Button, MenuButton, MenuItem, Typography } from '@/components/v2';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import PhaseRadioSelection from '@/forecasts/shared/PhaseRadioSelection';
import { useLoadingBar } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';

import { TC_KEYS } from '../api';
import { useTypeCurveInfo } from './useTypeCurveInfo';

type Action = 'include' | 'exclude';

function useExcludeBucket({ typeCurveId, onSuccess = _.noop }: { typeCurveId: string; onSuccess(): void }) {
	const queryClient = useQueryClient();

	const includeMutation = useMutation(
		async ({ id, phases, wellIds }: { id: string; phases: Array<Phase>; wellIds: Array<string> }) => {
			await postApi(`/type-curve/${id}/includeWells`, { phases, wellIds });
			queryClient.setQueryData(
				TC_KEYS.typeCurveWellAssignments(typeCurveId),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				produce((draft: any) => {
					_.forEach(wellIds, (wellId) => {
						_.forEach(phases, (phase) => {
							draft[wellId][phase] = true;
						});
					});
				})
			);
		},
		{ onSuccess }
	);

	const excludeMutation = useMutation(
		async ({ id, phases, wellIds }: { id: string; phases: Array<Phase>; wellIds: Array<string> }) => {
			await postApi(`/type-curve/${id}/excludeWells`, { phases, wellIds });
			queryClient.setQueryData(
				TC_KEYS.typeCurveWellAssignments(typeCurveId),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				produce((draft: any) => {
					_.forEach(wellIds, (wellId) => {
						_.forEach(phases, (phase) => {
							draft[wellId][phase] = false;
						});
					});
				})
			);
		},
		{ onSuccess }
	);

	const resetExcludeMutation = useMutation(
		async ({ id, phases }: { id: string; phases: Record<Phase, boolean> }) => {
			await postApi(`/type-curve/${id}/resetExcludedWells`, { phases });
			queryClient.setQueryData(
				TC_KEYS.typeCurveWellAssignments(typeCurveId),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				produce((draft: any) => {
					_.forEach(draft, (_value, key) => {
						draft[key] = _.merge(draft[key], phases);
					});
				})
			);
		},
		{ onSuccess }
	);

	return { includeMutation, excludeMutation, resetExcludeMutation };
}

export default function ExcludeActions({ typeCurveId, selection }) {
	const { selectedSet, deselectAll } = selection;
	useTypeCurveInfo(typeCurveId);

	const [actionType, setActionType] = useState<Action>('exclude');
	const [phases, setPhases] = useState<Array<Phase>>(VALID_PHASES);

	const {
		excludeMutation: { mutateAsync: exclude, isLoading: excluding },
		includeMutation: { mutateAsync: include, isLoading: including },
		resetExcludeMutation: { mutateAsync: resetExcluded, isLoading: resetting },
	} = useExcludeBucket({ typeCurveId, onSuccess: deselectAll });

	const updating = including || excluding || resetting;

	const handleInclude = () => include({ id: typeCurveId, phases, wellIds: [...selectedSet] });
	const handleExclude = () => exclude({ id: typeCurveId, phases, wellIds: [...selectedSet] });
	const handleResetExcluded = () =>
		resetExcluded({
			id: typeCurveId,
			phases: _.reduce(
				phases,
				(acc, phase) => {
					acc[phase] = true;
					return acc;
				},
				{}
			) as Record<Phase, boolean>,
		});

	useLoadingBar(updating);

	return (
		<>
			<MenuButton
				label={<span css='text-transform: none !important;'>{_.capitalize(actionType)}</span>}
				endIcon={faChevronDown}
				hideMenuOnClick
			>
				<MenuItem onClick={() => setActionType('exclude')}>Exclude</MenuItem>
				<MenuItem onClick={() => setActionType('include')}>Include</MenuItem>
			</MenuButton>

			<PhaseRadioSelection
				enableLabels={false}
				generateRadioTooltip={(_checked, label) =>
					`${_.capitalize(actionType)} Selection ${actionType === 'include' ? 'To' : 'From'} ${label}`
				}
				phases={phases}
				row
				setPhases={setPhases}
				size='small'
			/>

			<Button disabled={updating} onClick={handleResetExcluded}>
				<Typography css='font-weight: 500;' noWrap variant='caption'>
					Reset Excluded
				</Typography>
			</Button>

			<Button
				color='secondary'
				variant='contained'
				disabled={updating || !selectedSet?.size}
				onClick={actionType === 'include' ? handleInclude : handleExclude}
			>
				{`Apply ${selectedSet?.size ? `(${selectedSet.size})` : ''}`}
			</Button>
		</>
	);
}
