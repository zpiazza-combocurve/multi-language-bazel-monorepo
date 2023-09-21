import { useCallback, useRef } from 'react';

import { Button } from '@/components/v2';
import { useDialog } from '@/helpers/dialog';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';

// import { SortableColumnList } from '@/well-sort/WellSort/WellSortingDialog/SortableColumnList';
import { EconSettingsSaveAsDialog } from './EconSettingsSaveAsDialog';
import { ActionsContainer } from './shared';
import useReportHeaders from './useReportHeaders';

export function EconSettingsReports({ loading, handleReset, update, setCurrentSetting, currentSetting, create }) {
	const [econSettingsSaveAsDialog, promptSaveAsDialog] = useDialog(EconSettingsSaveAsDialog);

	const ref = useRef();

	const onSaveAs = async () => {
		const result = await promptSaveAsDialog({
			initialName: currentSetting.name,
			renderNode: ref.current,
			disableScrollLocking: true,
		});
		if (!result) {
			return;
		}
		create(result);
	};

	const setHeaders = useCallback(
		(headersOrFunction) => {
			if (typeof headersOrFunction === 'function') {
				setCurrentSetting((currentSetting) => ({
					...currentSetting,
					headers: headersOrFunction(currentSetting.headers),
				}));
			} else {
				setCurrentSetting((currentSetting) => ({
					...currentSetting,
					headers: headersOrFunction,
				}));
			}
		},
		[setCurrentSetting]
	);
	const { addHeader, headersListComponent, sortedHeaders, availableHeadersKey } = useReportHeaders(
		currentSetting.headers,
		setHeaders
	);

	const resCatAggregation = availableHeadersKey.length === 0;
	const limitHeaders = sortedHeaders?.length >= 2;

	return (
		<Section ref={ref}>
			{econSettingsSaveAsDialog}
			<SectionHeader as={ActionsContainer}>
				<Button disabled={loading} onClick={handleReset}>
					Reset
				</Button>
				<Button disabled={loading || !currentSetting?._id} onClick={update}>
					Save
				</Button>
				<Button disabled={loading} onClick={onSaveAs}>
					Save As
				</Button>
				<Button
					disabled={
						loading ||
						(resCatAggregation &&
							'Aggregation limited to 1 criteria since Res Cat has an embedded hierarchy') ||
						(limitHeaders && 'Unable to add more than two criteria')
					}
					onClick={addHeader}
				>
					ADD HEADER
				</Button>
			</SectionHeader>

			<SectionContent>
				<div
					css={`
						margin-top: 2rem;
						max-width: 800px;
					`}
				>
					{headersListComponent}
				</div>
			</SectionContent>
		</Section>
	);
}
