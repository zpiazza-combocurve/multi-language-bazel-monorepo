import { Divider } from '@material-ui/core';
import { useContext, useEffect } from 'react';

import { CardContext } from '@/layouts/CardsLayout';

import { ScheduleSettingActivitySteps } from '../Settings/ActivitySteps';
import { StyledAgGrid } from '../components/AgGrid/StyledAgGrid';

export const LookupTableBuilder = ({ hasCyclicSteps }) => {
	const { isMaximized, toggleMaximize } = useContext(CardContext);

	useEffect(() => {
		if (!isMaximized) toggleMaximize();

		return () => {
			toggleMaximize();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const leftSideGrid = {
		rowData: [],
		columnDefs: [{ headerName: 'Schedule Step' }, { headerName: 'Day/Well Header' }, { headerName: 'Well Header' }],
	};
	const rightSideGrid = {
		rowData: [],
		columnDefs: [{ headerName: 'Headers' }, { headerName: 'Line 1...' }, { headerName: 'Line 2...' }],
	};

	return (
		<div
			css={`
				height: 100%;
				display: flex;
				flex-direction: column;
				gap: 1rem;
			`}
		>
			<div
				css={`
					height: 100%;
				`}
			>
				<ScheduleSettingActivitySteps hasCyclicSteps={hasCyclicSteps} enableDiagram={false} />
			</div>
			<div
				css={`
					height: 100%;
					display: flex;
					flex-direction: row;
					gap: 1rem;
				`}
			>
				<StyledAgGrid {...leftSideGrid} />
				<Divider orientation='vertical' />
				<StyledAgGrid {...rightSideGrid} />
			</div>
		</div>
	);
};
