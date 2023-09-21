import { ClickAwayListener } from '@material-ui/core';
import { useEffect } from 'react';

import { useDraggingResize } from '@/components/hooks/useDraggingResize';
import { Divider } from '@/components/v2';

import { SCOPES } from '../shared/hotkeys';
import { ScheduleSettingActivitySteps } from './ActivitySteps';
import { ScheduleSettingResources } from './Resources';

export const ScheduleSettingTable = ({ hasCyclicSteps, setHotkeyScope }) => {
	const { dividerRef, boxARef, wrapperRef } = useDraggingResize({ mode: 'horizontal', minSize: 410 });

	useEffect(() => {
		boxARef.current.style.width = '50%';
		boxARef.current.style.flexGrow = 0;
	}, [boxARef]);

	return (
		<ClickAwayListener onClickAway={() => setHotkeyScope(SCOPES.wellTable)}>
			<div
				ref={wrapperRef}
				css={`
					display: flex;
					flex-direction: row;
					flex: 1;
					height: 100%;
				`}
			>
				<div
					ref={boxARef}
					css={`
						display: flex;
						flex-direction: column;
						flex: 1 1 auto;
					`}
					onClick={() => setHotkeyScope(SCOPES.activitySteps)}
				>
					<ScheduleSettingActivitySteps hasCyclicSteps={hasCyclicSteps} enableDiagram />
				</div>
				<div
					ref={dividerRef}
					css={`
						cursor: ew-resize;
						padding: 0 1rem 0 1rem;
					`}
				>
					<Divider orientation='vertical' />
				</div>
				<div
					css={`
						display: flex;
						flex-direction: column;
						flex: 1 1 auto;
					`}
					onClick={() => setHotkeyScope(SCOPES.resources)}
				>
					<ScheduleSettingResources />
				</div>
			</div>
		</ClickAwayListener>
	);
};
