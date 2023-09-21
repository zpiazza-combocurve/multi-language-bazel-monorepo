import { faChevronLeft, faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { useCallback, useMemo, useState } from 'react';
import { ConnectDropTarget, useDrag, useDrop } from 'react-dnd';
import { useQuery, useQueryClient } from 'react-query';
import styled, { css } from 'styled-components';

import { Button, Paper, Placeholder, SelectField } from '@/components';
import { fetchProjectForecasts } from '@/forecasts/api';
import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { postApi } from '@/helpers/routing';
import { ifProp, theme, themeProp } from '@/helpers/styled';
import { fullNameAndLocalDate } from '@/helpers/user';
import { MAX_WELLS_IN_FORECAST } from '@/inpt-shared/constants';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';

import { ProjectForecastItem } from './types';

const FORECAST_DND_TYPES = {
	selected: 'selected',
};

const forecastTypes = {
	deterministic: {
		value: 'deterministic',
		label: 'Deterministic',
	},
	probabilistic: {
		value: 'probabilistic',
		label: 'Probabilistic',
	},
};

const ForecastInfo = styled.label`
	width: 100%;
	display: flex;
	justify-content: space-between;
`;

const Note = styled.div`
	width: 50%;
	padding: 0.5rem;
	& > p {
		font-size: 1.25rem;
	}
`;

const CenteredHeader = styled.div`
	display: flex;
	align-items: baseline;
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function ForecastDescription({ className, label, value }: { className?: string; label: string; value: any }) {
	return (
		<div className={className}>
			<div>{label}</div>
			<div>{value}</div>
		</div>
	);
}

const MergeForecastItem = styled(
	({
		draggable,
		id,
		className,
		forecast: { user, createdAt, name, wells, updatedAt },
		actions,
		extraWells,
		uniqueCount,
		uniqueClassName,
		forecastContentClassName,
		forecastRowClassName,
		previousUniqueCount,
		moveForecast,
		findForecast,
	}) => {
		const wellsLength = wells.length;
		const createdInfo = fullNameAndLocalDate(user, createdAt);
		const loadingUniqueCount = uniqueCount === null;

		const originalIndex = findForecast?.(id)?.index;
		const [{ isDragging }, drag] = useDrag({
			type: FORECAST_DND_TYPES.selected,
			item: { id, originalIndex },
			collect: (monitor) => ({
				isDragging: monitor.isDragging(),
			}),
			end: (dropResult, monitor) => {
				const { id: droppedId, originalIndex: oIndex } = monitor.getItem();
				const didDrop = monitor.didDrop();
				if (!didDrop) {
					moveForecast(droppedId, oIndex);
				}
			},
		});
		const [, drop] = useDrop({
			accept: FORECAST_DND_TYPES.selected,
			canDrop: () => false,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			hover({ id: draggedId }) {
				if (draggedId !== id) {
					const { index: overIndex } = findForecast(id) || {};
					moveForecast(draggedId, overIndex);
				}
			},
		});
		const opacity = isDragging ? 0 : 1;

		return (
			<div ref={(node) => (draggable ? drag(drop(node)) : null)} style={{ opacity }}>
				<Paper className={className}>
					<div className={uniqueClassName}>
						<Placeholder
							loading={loadingUniqueCount}
							minShow={0}
							minHide={0}
							loadingIndicator={() => <h3>loading</h3>}
						>
							<ForecastInfo>
								<div>Starting:</div>
								<div>{previousUniqueCount}</div>
							</ForecastInfo>
							<ForecastInfo>
								<div>Overlap:</div>
								<div>{wellsLength - extraWells}</div>
							</ForecastInfo>
							<ForecastInfo>
								<div>Added:</div>
								<div>{extraWells}</div>
							</ForecastInfo>
							<ForecastInfo>
								<div>Ending:</div>
								<div>{uniqueCount}</div>
							</ForecastInfo>
						</Placeholder>
					</div>
					<div className={forecastContentClassName}>
						<div className={forecastRowClassName}>
							<h2>{name}</h2>
							<div>{actions}</div>
						</div>
						<div className={forecastRowClassName}>
							<ForecastDescription label='Created' value={createdInfo} />
							<ForecastDescription
								label='Last Updated'
								value={new Date(updatedAt).toLocaleDateString()}
							/>
							<ForecastDescription label='Wells' value={wellsLength} />
						</div>
					</div>
				</Paper>
			</div>
		);
	}
).attrs({
	uniqueClassName: 'unique-count',
	forecastContentClassName: 'forecast-container',
	forecastRowClassName: 'forecast-row',
})`
	display: flex;
	padding: 0.5rem;
	margin: 0.5rem;
	min-height: 5rem;
	align-items: stretch;
	${ifProp('draggable', 'cursor: grab;')}
	.${themeProp('uniqueClassName')} {
		width: 10rem;
		flex-direction: column;
		padding: 0 1rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		align-items: end;
		${({ uniqueCount }) => uniqueCount === undefined && 'display: none;'}
		${ForecastInfo}:last-child {
			${ifProp(
				'invalid',
				css`
					color: ${theme.warningColor};
				`
			)}
		}
	}
	.${themeProp('forecastContentClassName')} {
		flex: 1;
	}
	.${themeProp('forecastRowClassName')} {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
`;

const SectionContainer = styled.div`
	display: flex;
	height: 100%;
`;
const HalfSection = styled.div``;

const ScrollableContent = styled.div`
	overflow-y: scroll;
`;

const StyledHeader = styled.div`
	display: flex;
	justify-content: space-between;
	padding: 0.5rem;
	& > *:not(:first-child) {
		margin-left: 0.5rem;
	}
`;

function ForecastSection({
	forecasts,
	title = '',
	loading = false,
}: {
	forecasts: [JSX.Element[]];
	title: string;
	loading?: boolean;
}) {
	return (
		<Section as={HalfSection}>
			<SectionHeader as={StyledHeader}>
				<div>{title}</div>
			</SectionHeader>
			<SectionContent as={ScrollableContent}>
				<Placeholder loading={loading}>{forecasts}</Placeholder>
			</SectionContent>
		</Section>
	);
}

function useUniqueData(forecasts: ProjectForecastItem[] = []) {
	const newWells: number[] = [];
	const wellsSet = new Set();
	forecasts.forEach(({ wells }, forecastIndex) => {
		newWells[forecastIndex] = 0;
		wells.forEach((well) => {
			const stringWell = well.toString();
			if (!wellsSet.has(stringWell)) {
				newWells[forecastIndex]++;
				wellsSet.add(stringWell);
			}
		});
	});
	return { unique: wellsSet.size, uniqueOnForecast: newWells };
}

const EMPTY_ARR = [];
// added ForecastItem for reusability in proximity
export function useForecastSelection(
	forecasts: ProjectForecastItem[],
	forecastType: string,
	ForecastItem = MergeForecastItem,
	initialSelectedForecast: ProjectForecastItem[] = EMPTY_ARR
): [
	[JSX.Element[]],
	[JSX.Element[]],
	ProjectForecastItem[],
	ConnectDropTarget,
	() => void,
	Record<string, ProjectForecastItem[]>,
	(a: Record<string, ProjectForecastItem[]>) => void,
	ProjectForecastItem[]
] {
	const [selectedForecastsa, setSelectedForecastsa] = useState<Record<string, ProjectForecastItem[]>>({
		[forecastType]: initialSelectedForecast,
	});
	const [selectedForecasts, setSelectedForecasts] = useMemo(() => {
		return [
			selectedForecastsa[forecastType] || [],
			(fn) =>
				setSelectedForecastsa({ ...selectedForecastsa, [forecastType]: fn(selectedForecastsa[forecastType]) }),
		];
	}, [selectedForecastsa, forecastType]);
	const selectedForecastsSet = new Set(selectedForecasts.map(({ _id }) => _id));

	const { uniqueOnForecast = [] } = useUniqueData(selectedForecasts);
	const uniqueTillForecast: number[] = [];
	uniqueOnForecast.forEach((value, index) => {
		uniqueTillForecast[index] = value;
		if (index !== 0) {
			uniqueTillForecast[index] += uniqueTillForecast[index - 1];
		}
	});

	const findForecast = (id) => {
		const forecast = selectedForecasts.filter(({ _id }) => _id === id)[0];
		return {
			forecast,
			index: selectedForecasts.indexOf(forecast),
		};
	};
	const moveForecast = (id, atIndex) => {
		const { forecast, index } = findForecast(id);
		setSelectedForecasts((prevForecasts: ProjectForecastItem[] = []) => {
			const newForecasts = [...prevForecasts];
			newForecasts.splice(index, 1);
			newForecasts.splice(atIndex, 0, forecast);
			return newForecasts;
		});
	};
	const [, dropRef] = useDrop({ accept: FORECAST_DND_TYPES.selected });

	const selectForecast = (forecast) => {
		setSelectedForecasts((prevForecasts = []) => [...prevForecasts, forecast]);
	};
	const deselectForecast = ({ _id: id }: ProjectForecastItem) => {
		setSelectedForecasts((prevForecasts = []) => prevForecasts.filter(({ _id }) => _id !== id));
	};

	const forecastOfType = forecasts.filter(({ type }) => forecastType === type);
	const unselectedForecasts = forecastOfType.filter(({ _id }) => !selectedForecastsSet.has(_id));

	return [
		[
			unselectedForecasts.map((forecast) => (
				<ForecastItem
					primary
					id={forecast._id}
					key={forecast._id}
					forecast={forecast}
					actions={<Button faIcon={faChevronRight} onClick={() => selectForecast(forecast)} />}
				/>
			)),
		],
		[
			selectedForecasts.map((forecast, index) => {
				const { _id: id } = forecast || {};
				const previousUniqueCount = index > 0 ? uniqueTillForecast[index - 1] : 0;
				const uniqueCount = uniqueTillForecast[index];
				const extraWells = uniqueOnForecast[index];
				const isInvalid = uniqueTillForecast[index] > MAX_WELLS_IN_FORECAST;
				return (
					<ForecastItem
						id={id}
						primary={!isInvalid}
						key={id}
						invalid={isInvalid}
						forecast={forecast}
						actions={<Button faIcon={faChevronLeft} onClick={() => deselectForecast(forecast)} />}
						findForecast={findForecast}
						moveForecast={moveForecast}
						extraWells={extraWells ?? null}
						uniqueCount={uniqueCount ?? null}
						previousUniqueCount={previousUniqueCount}
						draggable
					/>
				);
			}),
		],
		selectedForecasts,
		dropRef,
		() => setSelectedForecastsa({}),
		selectedForecastsa,
		setSelectedForecastsa,
		unselectedForecasts,
	];
}

function getProjectForecastQuery(id?: string) {
	return ['forecasts', id];
}

export function ForecastMergeContent() {
	const { project } = useAlfa();
	const projectId = project?._id;
	const { isFetching: loadingForecasts, data: projectForecasts = [] } = useQuery<ProjectForecastItem[]>(
		getProjectForecastQuery(projectId),
		() => fetchProjectForecasts(projectId) as Promise<ProjectForecastItem[]>
	);
	const [type, setType] = useState(forecastTypes.deterministic.value);
	const [unselectedForecastsItems, selectedForecastsItems, selectedForecasts, selectedDNDRef, reset] =
		useForecastSelection(projectForecasts, type);

	const { unique } = useUniqueData(selectedForecasts);
	const queryClient = useQueryClient();

	const selectedIds = selectedForecasts?.map(({ _id }) => _id);

	const mergeForecastsNotificationCallback = useCallback(
		(notification) => {
			if (notification.status === TaskStatus.COMPLETED) {
				queryClient.invalidateQueries(getProjectForecastQuery(projectId));
			}
		},
		[queryClient, projectId]
	);
	useUserNotificationCallback(NotificationType.MERGE_FORECASTS, mergeForecastsNotificationCallback);

	const mergeForecasts = async () => {
		try {
			await postApi('/forecast/merge-forecast', {
				forecastIds: selectedIds,
			});
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	const exceedsLimit = MAX_WELLS_IN_FORECAST < unique;

	return (
		<Section ref={selectedDNDRef}>
			<SectionHeader as={StyledHeader}>
				<CenteredHeader>
					<h3>Merge Forecasts</h3>
					<SelectField
						value={type}
						onChange={(v) => setType(v as string)}
						menuItems={Object.values(forecastTypes)}
					/>
					<Button onClick={reset}>Reset</Button>
					<Button
						primary
						raised
						onClick={mergeForecasts}
						disabled={exceedsLimit || !(selectedIds?.length > 1)}
					>
						Merge
					</Button>
				</CenteredHeader>
				<Note>
					<p>Note: Sequence forecasts in order of priority top (high) to bottom (low)</p>
					<p>eg: If two forecast overlap then higher priority forecast is kept</p>
				</Note>
			</SectionHeader>
			<SectionContent as={SectionContainer}>
				<ForecastSection
					loading={loadingForecasts}
					title='Project Forecasts'
					forecasts={unselectedForecastsItems}
				/>
				<ForecastSection
					title='Forecasts To Merge (drag and drop to reorder)'
					forecasts={selectedForecastsItems}
				/>
			</SectionContent>
		</Section>
	);
}

export function ForecastMerge() {
	return <ForecastMergeContent />;
}
