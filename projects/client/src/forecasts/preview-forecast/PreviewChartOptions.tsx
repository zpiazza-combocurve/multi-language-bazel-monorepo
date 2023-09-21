import { convertIdxToDate } from '@combocurve/forecast/helpers';
import { faCog, faRabbitFast } from '@fortawesome/pro-regular-svg-icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { Divider, Paper, SelectField } from '@/components';
import { Box, IconButton } from '@/components/v2';
import ForecastParameters, { getForecastParameterProps } from '@/forecasts/shared/ForecastParameters';
import { toLocalDate } from '@/helpers/dates';
import { FeatureIcons } from '@/helpers/features';
import { getFullName } from '@/helpers/user';
import { formatDate } from '@/helpers/utilities';
import { useCurrentProjectRoutes } from '@/projects/routes';

import { Phase } from '../forecast-form/automatic-form/types';
import { Header, Labeled } from './shared';

const QuickActions = styled.div`
	align-items: center;
	display: flex;
	justify-content: space-around;
	width: 100%;
`;

export default function PreviewChartOptions({
	forecastPreview,
	phase,
	onChangePhase,
	chartOptions: { chartType },
	setChartOption,
	className = '',
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecastPreview: any;
	phase: Phase;
	onChangePhase: (phase: Phase) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	chartOptions: any;
	setChartOption: (key: string, value: string) => void;
	className?: string;
}) {
	const navigate = useNavigate();
	const forecast = forecastPreview.forecast;
	const forecastId = forecast?._id;
	const urls = useCurrentProjectRoutes().forecast(forecastId);

	const forecastParameterProps = getForecastParameterProps(forecastPreview?.data, phase, forecast?.type);

	return (
		<Box className={className} display='flex' flexDirection='column'>
			{forecastPreview.forecast && (
				<>
					<Paper css='padding: 0.25rem 1rem'>
						<Header>Forecast Details</Header>

						<Labeled label='Name'>{forecast?.name ?? 'N/A'}</Labeled>
						<Labeled label='Created By'>{getFullName(forecast?.user)}</Labeled>
						<Labeled label='Create Date'>{toLocalDate(forecast?.createdAt)}</Labeled>
						<Labeled label='Last Updated'>{toLocalDate(forecast?.updatedAt)}</Labeled>

						<Divider />

						<QuickActions>
							<IconButton onClick={() => navigate(urls.settings)} tooltipTitle='Settings'>
								{faCog}
							</IconButton>

							<IconButton onClick={() => navigate(urls.view)} tooltipTitle='View'>
								{faRabbitFast}
							</IconButton>

							<IconButton onClick={() => navigate(urls.diagnostics)} tooltipTitle='Diagnostics'>
								{FeatureIcons.forecastDiag}
							</IconButton>

							<IconButton onClick={() => navigate(urls.manual)} tooltipTitle='Edit'>
								{FeatureIcons.forecasts}
							</IconButton>
						</QuickActions>
					</Paper>

					<Divider css='margin: 1rem 0;' />
				</>
			)}

			<Paper
				css={`
					overflow-y: auto;
					padding: 0.25rem 1rem;
				`}
			>
				<Header>Forecast Options</Header>

				{forecastParameterProps?.type === 'probabilistic' && (
					<Labeled label='Chart Type'>
						<SelectField
							menuItems={[
								{ label: 'All Phases', value: 'all' },
								{ label: 'Probabilistic', value: 'prob' },
							]}
							onChange={(val) => setChartOption('chartType', val as string)}
							value={chartType}
						/>
					</Labeled>
				)}

				{forecastPreview.fpd && (
					<Labeled label='Scheduled FPD'>{formatDate(convertIdxToDate(forecastPreview.fpd))}</Labeled>
				)}

				<section
					css={`
						display: flex;
						flex-direction: column;
						row-gap: 0.5rem;
					`}
				>
					<ForecastParameters
						dailyProduction={forecastPreview?.daily}
						monthlyProduction={forecastPreview?.monthly}
						phase={phase}
						setPhase={onChangePhase}
						{...forecastParameterProps}
					/>
				</section>
			</Paper>
		</Box>
	);
}
