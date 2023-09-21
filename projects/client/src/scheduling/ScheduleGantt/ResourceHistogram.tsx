import { DomHelper, ProjectModel, ProjectModelConfig } from '@bryntum/gantt';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'styled-components';

import { Doggo } from '@/components';
import { Box, Typography } from '@/components/v2';
import { genericErrorAlert } from '@/helpers/alerts';

import { getGanttData } from './api';
import { ResourceHistogram as BryntumResourceHistogram } from './overrides/ResourceHistogram';

export const ResourceHistogram = ({ scheduleId }) => {
	const histogramRef = useRef<BryntumResourceHistogram>();
	const projectRef = useRef<ProjectModel>();

	const theme = useTheme();
	const {
		palette: { type: themeType },
	} = theme;

	const [isLoading, setIsLoading] = useState<boolean>();
	const [schedule, setSchedule] = useState<ProjectModel>();

	useEffect(() => {
		DomHelper.setTheme(`classic-${themeType}`);
	}, [themeType]);

	useEffect(() => {
		if (!schedule) return;

		const projectModelConfig: Partial<ProjectModelConfig> = {
			calendar: 'general',
			hoursPerDay: 23,
			startDate: schedule.startDate,
			endDate: schedule.endDate,
			tasks: schedule.tasks,
			dependencies: schedule.dependencies,
			resources: schedule.resources,
			assignments: schedule.assignments,
			calendars: schedule.calendars,
		};

		projectRef.current = new ProjectModel(projectModelConfig);

		histogramRef.current = new BryntumResourceHistogram({
			appendTo: 'histogram',
			project: projectRef.current,
			startDate: schedule.startDate,
			endDate: schedule.endDate,
			showMaxEffort: false,
			columns: [
				{ type: 'resourceInfo', field: 'name', showImage: false, width: 200 },
				{
					type: 'scale',
					hidden: true,
				},
			],
		});

		return () => {
			histogramRef.current?.destroy();
		};
	}, [schedule, scheduleId]);

	useEffect(() => {
		const getInitialData = async () => {
			try {
				setIsLoading(true);
				const data = await getGanttData(scheduleId);

				setSchedule(data);
			} catch (error) {
				genericErrorAlert(error, 'Failed to retrieve the data');
			} finally {
				setIsLoading(false);
			}
		};

		getInitialData();
	}, [scheduleId]);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
			<div style={{ margin: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
				<Box
					fontSize='.75rem'
					css={`
						display: flex;
						align-items: center;
						justify-content: center;
						width: 85px;
						height: 22px;
						padding: 2px 5px;
						border-radius: 2rem;
						background-color: ${theme.palette.primary[themeType]};
						margin-right: 0.5rem;
						font-weight: 500;
					`}
				>
					Beta Feature
				</Box>
				<Typography variant='inherit'>
					Feature under development and performance degrades over 2k wells.
				</Typography>
			</div>
			<div id='histogram' style={{ display: 'flex', flex: '1 1 auto' }}>
				{isLoading && <Doggo overlay small underDog='Fetching the data...' />}
			</div>
		</div>
	);
};
