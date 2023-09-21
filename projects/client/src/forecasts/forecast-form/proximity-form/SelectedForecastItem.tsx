import { faGripVertical, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { ListItem } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import styled from 'styled-components';

import { IconButton } from '@/components/v2';
import { withTooltip } from '@/components/v2/helpers';
import { useProximityForecastList } from '@/forecasts/api';
import { useLoadingBar } from '@/helpers/alerts';
import { DEFAULT_QUERY_OPTIONS } from '@/helpers/query-cache';
import { numberWithCommas } from '@/helpers/utilities';

const LabelContainer = styled.span`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 7.5rem;
`;

const TooltipLabelContainer = withTooltip(LabelContainer);

const SelectedForecastItem = ({
	dragRef,
	dropRef,
	forecastId,
	remove,
}: {
	dragRef;
	dropRef;
	forecastId: string;
	remove;
}) => {
	const { data: forecast, isLoading } = useProximityForecastList(forecastId, DEFAULT_QUERY_OPTIONS);
	useLoadingBar(isLoading);

	if (!(forecast || isLoading)) {
		remove();
	}

	return (
		<ListItem ref={dropRef}>
			{isLoading ? (
				<Skeleton variant='text' animation='pulse' height='1.5rem' width='100%' />
			) : (
				<section
					css={`
						align-items: center;
						display: grid;
						grid-template-columns: repeat(2, 1fr) repeat(2, 0.25fr);
						row-gap: 0.5rem;
						width: 100%;
					`}
				>
					<div
						css={`
							align-items: center;
							column-gap: 0.5rem;
							display: flex;
						`}
					>
						<div ref={dragRef}>
							<IconButton size='small' iconSize='small'>
								{faGripVertical}
							</IconButton>
						</div>

						<TooltipLabelContainer
							tooltipTitle={`${forecast?.name} by ${forecast?.user?.firstName} ${forecast?.user?.lastName}`}
						>
							{forecast?.name}
						</TooltipLabelContainer>
					</div>

					<TooltipLabelContainer tooltipTitle={forecast?.project?.name}>
						{forecast?.project?.name}
					</TooltipLabelContainer>

					<span css='display: flex; justify-content: flex-end;'>
						{numberWithCommas(forecast?.wells?.length)}
					</span>

					<div css='display: flex; justify-content: flex-end;'>
						<IconButton size='small' iconSize='small' onClick={remove}>
							{faTrash}
						</IconButton>
					</div>
				</section>
			)}
		</ListItem>
	);
};

export default SelectedForecastItem;
