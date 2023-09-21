import { clamp, get, groupBy, keyBy, map, uniq } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { Hotkey, SmallPagination as Pagination, SelectList } from '@/components';
import { usePaginatedArray } from '@/components/hooks';
import { Button, TextField } from '@/components/v2';
import { postApi } from '@/helpers/routing';
import theme from '@/helpers/styled';
import { useCurrentProjectRoutes } from '@/projects/routes';
import { getQuery } from '@/urls';

import { ActionsContainer, Header } from './shared';

const PreviewListContainer = styled.div`
	box-shadow: ${theme.boxShadow1};
	display: flex;
	flex-direction: column;
	padding: 0.5rem;
	width: 15%;
`;

function useNavigation<T>({ ids, current, setCurrent }: { ids: T[]; current: T; setCurrent: (newValue: T) => void }) {
	useEffect(() => {
		if (ids.indexOf(current) === -1) {
			setCurrent(ids[0]);
		}
	}, [setCurrent, ids, current]);

	const goPrevious = () => {
		const index = ids.indexOf(current);
		setCurrent(ids[clamp(index - 1, 0, ids.length - 1)]);
	};

	const goNext = () => {
		const index = ids.indexOf(current);
		setCurrent(ids[clamp(index + 1, 0, ids.length - 1)]);
	};

	return { current, setCurrent, goPrevious, goNext };
}

// TODO get it from somewhere else
interface Forecast {
	_id: string;
	type: string;
}

interface ForecastPreview {
	forecast?: Forecast;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	headers: any;
}

interface WellData {
	_id: string;
	well_name: string;
}

// TODO clean mapping logic needed for scenario well assignment
export default function PreviewWellList({
	adjustEdit,
	cancel,
	currentWell: currentWellData,
	forecastPreview,
	onChangeCurrentWell,
	sorting,
	wellKey,
	wells: allWellsData,
}: {
	currentWell: { _id: string; well: string };
	onChangeCurrentWell: (newWell: { _id: string; well: string }) => void;
	wells: { _id: string; well: string }[];
	wellKey?: string;
	cancel: () => void;
	adjustEdit: (adjust: boolean) => Promise<void>;
	forecastPreview: ForecastPreview;
	className?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	sorting?: any[];
}) {
	const getWell = useCallback(
		(wellOrAssignment) => (wellKey ? get(wellOrAssignment, wellKey) : wellOrAssignment),
		[wellKey]
	);
	const currentWell = useMemo(() => getWell(currentWellData), [currentWellData, getWell]);
	const allWells = useMemo(() => map(allWellsData, getWell), [allWellsData, getWell]);
	const navigate = useNavigate();
	const [search, setSearch] = useState('');
	// const forecastType = forecastPreview.forecast?.type; // TODO check if needed

	const idMap = useMemo(() => groupBy(allWellsData, getWell), [allWellsData, getWell]);

	const filteredWellsQuery = useQuery(
		['/well/searchByWellName', { wells: allWells, search }],
		() =>
			postApi('/well/searchByWellName', { wells: allWells, search }) as Promise<{
				found: string[];
			}>,
		{ initialData: { found: [] }, select: ({ found }) => found?.flatMap((id) => idMap[id]), enabled: !!search }
	);

	const unsortedWells = search ? filteredWellsQuery.data : allWellsData;

	const sortedWellsQuery = useQuery(
		['scenario-preview-sorting', { wellIds: unsortedWells, sorting }],
		() => {
			if (sorting?.length)
				return postApi('/filters/sort-well-ids', { wellIds: map(unsortedWells, getWell), sorting });
			return unsortedWells;
		},
		{ select: (ids) => ids?.flatMap((el) => idMap[el._id]) }
	);

	// TODO: remove sorting null/undefined check when sorting component is added to diagnostics
	// null / undefined sorting prop allows for backwards-compatibility. however, the sorting component is being added to diagnostics soon which will remove the need for this check
	const wells = (sorting?.length ? sortedWellsQuery.data ?? unsortedWells : unsortedWells) || [];

	const [pageWells, pagination] = usePaginatedArray(wells, { initialId: currentWellData, itemsPerPage: 13 });
	const { goPrevious: goPreviousWell, goNext: goNextWell } = useNavigation({
		ids: wells,
		current: currentWellData,
		setCurrent: onChangeCurrentWell,
	});

	const projectRoutes = useCurrentProjectRoutes();

	const navigateToEditing = async () => {
		await adjustEdit(true);

		if (!forecastPreview.forecast?._id) {
			return;
		}

		navigate(
			projectRoutes.forecast(forecastPreview.forecast._id).manual +
				getQuery({
					well: forecastPreview.headers._id,
				})
		);
	};

	const pageWellIds = useMemo(() => uniq(map(pageWells, getWell)), [pageWells, getWell]);
	const wellHeadersMapQuery = useQuery(
		['/well/getWellHeaderValues', { headers: ['well_name'], wells: pageWellIds }],
		() =>
			postApi('/well/getWellHeaderValues', { headers: ['well_name'], wells: pageWellIds }) as Promise<WellData[]>,
		{ select: (wellsData) => keyBy(wellsData, '_id') }
	);

	return (
		<PreviewListContainer>
			<Header>Preview Forecast</Header>

			<ActionsContainer>
				<Button disabled={!wells?.length} onClick={goPreviousWell} color='primary'>
					Previous
				</Button>

				<Button disabled={!wells?.length} onClick={goNextWell} color='primary'>
					Next
				</Button>

				<Button disabled={!currentWell} onClick={navigateToEditing} color='secondary'>
					Edit
				</Button>

				<Button onClick={cancel} color='warning'>
					Close
				</Button>
			</ActionsContainer>

			<TextField label='Search Wells' value={search} onChange={(ev) => setSearch(ev.target.value)} debounce />

			<Pagination pagination={pagination} css='width=100%; justify-content: space-around;' />

			{wellHeadersMapQuery.data && (
				<SelectList
					css='flex: 1; overflow: auto;'
					value={currentWellData}
					onChange={(well) => well && onChangeCurrentWell(well)}
					listItems={pageWells.map((well, i) => {
						// @ts-expect-error TODO investigate this issue
						const inc = well.index;
						const wellName = wellHeadersMapQuery.data[getWell(well)]?.well_name;
						const primaryText = (function () {
							if (!wellName) {
								return 'N/A';
							}
							if (!inc) {
								return wellName;
							}
							return `${wellName} Inc-${inc}`;
						})();
						return {
							key: `${getWell(well)}-${i}`,
							value: well,
							primaryText,
						};
					})}
					compact
				/>
			)}

			<Hotkey
				keyname='pageup'
				handler={() => {
					goPreviousWell();
					return false;
				}}
			/>
			<Hotkey
				keyname='pagedown'
				handler={() => {
					goNextWell();
					return false;
				}}
			/>
		</PreviewListContainer>
	);
}
