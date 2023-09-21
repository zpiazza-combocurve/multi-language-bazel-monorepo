import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { withErrorBoundary } from '@/components';
import { getDefaultShortcutsInfo, useContextMenuItems } from '@/components/AdvancedTable/shared';
import { AdvancedTableRow } from '@/components/AdvancedTable/types';
import { AdvancedModelViewWrapper } from '@/cost-model/detail-components/AdvancedModelView/extra-components/AdvancedModelViewWrapper';
import { addValidationInfo } from '@/cost-model/detail-components/AdvancedModelView/shared';
import { AdvancedEconModelProps } from '@/cost-model/detail-components/EconModelV2';
import { useAlfa } from '@/helpers/alfa';
import { assert } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';
import { ModuleListEmbeddedLookupTableItem } from '@/lookup-tables/embedded-lookup-tables/types';
import { FilterResult } from '@/module-list/types';

import AdvancedModelView, { AdvancedModelViewRef } from '../../AdvancedModelView';
import { useCapexTemplate } from './schemaValidation';
import {
	addTreeDataInfo,
	assumptionCapexToRows,
	createOtherCapexDefaultTemplate,
	getCapexColumnsDef,
	rowsCapexToAssumption,
	validationOptions,
} from './shared';
import { CapexRow } from './types';

function CapexAdvancedView(econModelProps: AdvancedEconModelProps) {
	const { project } = useAlfa();
	assert(project, 'Expected project to be in context');

	const shortcutsConfig = {
		isELT: false,
		showRunEconomics: !!econModelProps?.wellAssignment,
		enableTimeSeries: false,
		enableOrganizeByKey: false,
	};

	const [eltsQueryData, setELTsQueryData] = useState<FilterResult<ModuleListEmbeddedLookupTableItem> | undefined>(
		undefined
	);
	const [assumptionParts, setAssumptionParts] = useState({});
	const [localAdvancedModelViewRef, setLocalAdvancedModelViewRef] = useState(
		useRef<AdvancedModelViewRef<CapexRow>>(null)
	);

	const advancedModelViewRef = useRef<AdvancedModelViewRef<CapexRow>>(null);

	useEffect(() => {
		setLocalAdvancedModelViewRef(advancedModelViewRef);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [advancedModelViewRef?.current]);

	const { templateQuery, capexRowSchema, template } = useCapexTemplate(project._id, eltsQueryData?.items ?? []);

	const { deleteSelectedRowsItem, copyRowsItem } = useContextMenuItems(
		localAdvancedModelViewRef.current?.advancedTableRef
	);

	const contextMenuItems = useMemo(
		() => [deleteSelectedRowsItem, copyRowsItem],
		[deleteSelectedRowsItem, copyRowsItem]
	);

	const getRowDataOnAdd = useCallback(() => createOtherCapexDefaultTemplate(template), [template]);

	const getStateFromAssumption = useCallback(
		(assumption) => {
			assert(template, 'Expected template to be loaded');
			assert(eltsQueryData, 'Expected embedded lookup tables to be loaded');

			return assumptionCapexToRows(assumption, template, setAssumptionParts, eltsQueryData.items);
		},
		[template, setAssumptionParts, eltsQueryData]
	);

	const getAssumptionFromState = useCallback(
		(rows) => {
			assert(template, 'Expected template to be loaded');
			assert(eltsQueryData, 'Expected embedded lookup tables to be loaded');

			const rowsWithoutLookupLines = rows.filter((r) => !r.isFromELTDataLines);

			return rowsCapexToAssumption(rowsWithoutLookupLines, template, assumptionParts, eltsQueryData.items);
		},
		[template, assumptionParts, eltsQueryData]
	);

	const adjustRowData = useCallback(
		(state: AdvancedTableRow[]) => {
			const rowsData = addValidationInfo<CapexRow>(state, () => capexRowSchema, validationOptions);
			return rowsData;
		},
		[capexRowSchema]
	);

	return (
		<AdvancedModelView<CapexRow>
			ref={advancedModelViewRef}
			project={project._id}
			assumptionKey={AssumptionKey.capex}
			econModelProps={econModelProps}
			getColumnsDef={getCapexColumnsDef}
			getRowDataOnAdd={getRowDataOnAdd}
			adjustRowData={adjustRowData}
			getStateFromAssumption={getStateFromAssumption}
			getAssumptionFromState={getAssumptionFromState}
			onELTsQueryDataChanged={setELTsQueryData}
			contextMenuItems={contextMenuItems}
			getShortcutsInfo={() => getDefaultShortcutsInfo(shortcutsConfig)}
			invalidateModelTemplateQuery={templateQuery.invalidate}
			fetchingModelTemplate={templateQuery.isFetching}
			addTreeDataInfo={addTreeDataInfo}
		/>
	);
}

function CapexAdvancedViewWrapper(econModelProps: AdvancedEconModelProps) {
	return (
		<AdvancedModelViewWrapper useTemplate={useCapexTemplate}>
			<CapexAdvancedView {...econModelProps} />
		</AdvancedModelViewWrapper>
	);
}

export default withErrorBoundary(CapexAdvancedViewWrapper);
