import { useCallback } from 'react';

import { SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { useDerivedState } from '@/components/hooks';
import { InfoTooltipWrapper, SwitchField } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';
import { assert } from '@/helpers/utilities';

const QuickEditButton = ({ enableQuickEdit: parentEnableQuickEdit, setEnableQuickEdit: parentSetEnableQuickEdit }) => {
	const { project } = useAlfa();
	assert(project?._id);

	const { canUpdate: canUpdateForecast } = usePermissions(SUBJECTS.Forecasts, project._id);
	const [enableQuickEdit, _setEnableQuickEdit] = useDerivedState(parentEnableQuickEdit ?? false);

	const toggleQuickEdit = useCallback(
		(ev) => {
			// removing the focus on the switch allows other events to propagate
			ev.target.blur();
			(parentSetEnableQuickEdit ?? _setEnableQuickEdit)((prev) => !prev);
		},
		[_setEnableQuickEdit, parentSetEnableQuickEdit]
	);

	return (
		<InfoTooltipWrapper tooltipTitle='Hold Alt + Select Date Range on chart to rapidly forecast data. SHIFT + S to snap the Rapid Edit Mode to your cursor for easy navigation.'>
			<SwitchField
				checked={enableQuickEdit}
				disabled={!canUpdateForecast}
				label='Rapid Edit Mode'
				labelPlacement='start'
				onClick={toggleQuickEdit}
			/>
		</InfoTooltipWrapper>
	);
};

export default QuickEditButton;
