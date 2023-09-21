import { faGripVertical } from '@fortawesome/pro-regular-svg-icons';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useQuery } from 'react-query';
import styled, { css } from 'styled-components';

import { Placeholder } from '@/components';
import { IconButton } from '@/components/v2';
import { useForecastSelection } from '@/forecasts/ForecastMerge';
import { fetchProjectForecasts } from '@/forecasts/api';
import { useAlfa } from '@/helpers/alfa';
import { ifProp, theme, themeProp } from '@/helpers/styled';
import { getFullName } from '@/helpers/user';
import { Section, SectionContent } from '@/layouts/Section';

import { VerticalDivider } from '../CustomComponents';

const FORECAST_DND_TYPES = {
	selected: 'selected',
};
const FORECAST_TYPE = 'deterministic';

const ForecastInfo = styled.label`
	width: 100%;
	display: flex;
	justify-content: space-between;
`;

const ForecastItem = styled(
	({
		draggable,
		id,
		className,
		forecast: { user, name, wells } = {},
		actions,
		forecastContentClassName,
		forecastRowClassName,
		moveForecast,
		findForecast,
	}) => {
		const wellsLength = wells.length;

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
			hover({ id: draggedId }) {
				if (draggedId !== id) {
					const { index: overIndex } = findForecast(id) || {};
					moveForecast(draggedId, overIndex);
				}
			},
		});
		const opacity = isDragging ? 0 : 1;

		return (
			<div ref={(node) => (draggable ? drag(drop(node)) : null)} style={{ opacity }} className={className}>
				{draggable && <IconButton size='small'>{faGripVertical}</IconButton>}
				<div className={forecastContentClassName} css={draggable ? '' : 'padding-left:0.25rem'}>
					<div className={forecastRowClassName}>
						<h4
							css={`
								width: 10rem;
								white-space: nowrap;
								overflow: hidden;
								text-overflow: ellipsis;
								margin-bottom: 0;
							`}
						>
							{name}
						</h4>
					</div>
					<div className={forecastRowClassName}>
						<ForecastDescription value={getFullName(user)} />
						<ForecastDescription
							value={`${wellsLength} well${wellsLength > 1 ? 's' : ''}`}
							css={`
								margin-left: 1rem;
								color: ${theme.secondaryColor};
							`}
						/>
					</div>
				</div>
				<div
					css={`
						display: flex;
						justify-content: center;
						align-items: center;
					`}
				>
					{actions}
				</div>
			</div>
		);
	}
).attrs({
	uniqueClassName: 'unique-count',
	forecastContentClassName: 'forecast-container',
	forecastRowClassName: 'forecast-row',
})`
	display: flex;
	padding: 0.2rem;
	margin: 0.5rem;
	min-height: 3rem;
	border: 1px solid gray;
	align-items: stretch;
	${ifProp('draggable', 'cursor: grab;')}
	.${themeProp('uniqueClassName')} {
		width: 10rem;
		flex-direction: column;
		padding: 0 0.4rem;
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
	}
`;

function ForecastDescription({ className, label, value }) {
	return (
		<div className={className}>
			<div>{label}</div>
			<div>{value}</div>
		</div>
	);
}

const HalfSection = styled.div``;

function ForecastSection({ forecasts = [], title = '', loading }) {
	return (
		<Section as={HalfSection}>
			<h4 css='font-size: 1rem; margin: 0 .5rem'>{title}</h4>

			<SectionContent>
				<Placeholder loading={loading}>{forecasts}</Placeholder>
			</SectionContent>
		</Section>
	);
}

export function getProjectForecastQuery(id) {
	return ['forecasts', id];
}

export const ForecastSelectionContent = forwardRef(({ setRunDisabledMessage, activeSelectedForecastRef }, ref) => {
	const {
		project: { _id: projectId },
	} = useAlfa();

	const { isFetching: loadingForecasts, data: projectForecasts = [] } = useQuery(
		getProjectForecastQuery(projectId),
		() => fetchProjectForecasts(projectId)
	);

	const [
		unselectedForecastsItems,
		selectedForecastsItems,
		selectedForecasts,
		selectedDNDRef,
		,
		rawSelectedForecasts,
	] = useForecastSelection(projectForecasts, FORECAST_TYPE, ForecastItem, activeSelectedForecastRef.current);

	const selectedIds = selectedForecasts?.map(({ _id } = {}) => _id);

	useImperativeHandle(ref, () => ({
		getSelectedIds: () => selectedIds,
		getSelectedForecasts: () => rawSelectedForecasts,
	}));

	useEffect(() => {
		if (rawSelectedForecasts[FORECAST_TYPE]?.length < 1) {
			setRunDisabledMessage('Select at least 1 forecast');
		} else {
			setRunDisabledMessage(null);
		}
	}, [setRunDisabledMessage, rawSelectedForecasts]);

	// TODO: see if we need to bring this back
	// useEffect(() => {
	// 	if (projectForecasts?.length) {
	// 		// const projectForecastIds = projectForecasts.map((f) => f._id);
	// 		// const localSelectedForecasts =
	// 		// 	local.getItem(PROXIMITY_CACHE_KEY)?.selectedForecasts?.[FORECAST_TYPE] ?? [];
	// 		// const validEntries = localSelectedForecasts
	// 		// 	.filter((value) => projectForecastIds.includes(value._id) && value.type === FORECAST_TYPE)
	// 		// 	.map((forecast) => {
	// 		// 		// return current project forecast values, not cached ones
	// 		// 		const projectForecast = projectForecasts.find((pForecast) => pForecast._id === forecast._id);
	// 		// 		return projectForecast;
	// 		// 	});

	// 		// if (validEntries.length) {
	// 		// 	const validForecasts = { [FORECAST_TYPE]: validEntries };
	// 		// 	setSelectedForecasts(validForecasts);
	// 		// } else {
	// 		// 	const current = projectForecasts.find(({ _id }) => _id === currentForecast);
	// 		// 	setSelectedForecasts({ [FORECAST_TYPE]: [current] });
	// 		// }
	// 		const current = projectForecasts.find(({ _id }) => _id === currentForecast);
	// 		setSelectedForecasts({ [FORECAST_TYPE]: [current] });
	// 	}
	// }, [projectForecasts, setSelectedForecasts, currentForecast]);

	useEffect(() => {
		if (activeSelectedForecastRef) {
			activeSelectedForecastRef.current = selectedForecasts;
		}
	}, [selectedForecasts, activeSelectedForecastRef]);

	// drag and drop across forecast sections not supported yet so removed p element
	return (
		<div css='display:flex; max-height: 25rem; overflow: auto' ref={selectedDNDRef}>
			<ForecastSection
				loading={loadingForecasts}
				title='Project Forecasts'
				forecasts={unselectedForecastsItems}
			/>
			<VerticalDivider />
			<ForecastSection title='Selected Forecasts' forecasts={selectedForecastsItems} />
		</div>
	);
});

const ForecastSelection = forwardRef((props, ref) => {
	return <ForecastSelectionContent ref={ref} {...props} />;
});

const ForecastSelectionForm = forwardRef((props, ref) => {
	return <ForecastSelection ref={ref} {...props} />;
});

export { ForecastSelectionForm };
