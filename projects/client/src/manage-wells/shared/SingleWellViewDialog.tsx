import { Tab, Tabs } from '@material-ui/core';
import { useState } from 'react';

import { Typography } from '@/components/v2';
import FullScreenDialog from '@/components/v2/misc/FullScreenDialog';
import { DialogProps } from '@/helpers/dialog';
import WellComment from '@/well-comments/WellComment';
import WellsCollectionWells from '@/wells-collections/WellsCollectionWells';

import SingleWellView from './SingleWellView';
import { useSingleViewHeadersData } from './singleViewHooks';

export const TABS = {
	info: 0,
	comments: 1,
	wellsCollectionWells: 2,
};

function TabPanel({ currentTab, tabKey, children }) {
	const isVisible = currentTab === tabKey;
	// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
	return isVisible ? children : <></>;
}

interface SingleWellViewDialogProps extends DialogProps<void> {
	onHeaderSubmitCallback?: () => void;
	wellId: string;
	initialTab?;
	context?;
	isWellsCollection?: boolean;
}

/** `resolved` will be called with `true` if values were changed */
export function SingleWellViewDialog(props: SingleWellViewDialogProps) {
	const {
		visible,
		wellId,
		initialTab = TABS.info,
		context,
		onHide,
		onHeaderSubmitCallback,
		isWellsCollection,
	} = props;
	const headersData = useSingleViewHeadersData(wellId, !!isWellsCollection);

	const [currentTab, setCurrentTab] = useState(initialTab);

	return (
		<FullScreenDialog
			open={visible}
			onClose={onHide}
			topbar={
				<>
					<Typography variant='h6'>
						{`${isWellsCollection ? 'Wells Collection' : 'Well'}: ${headersData?.well_name || ''} `}
					</Typography>
					<Tabs value={currentTab} onChange={(_ev, newTab) => setCurrentTab(newTab)}>
						<Tab label='Info' />
						<Tab label='Comments' />
						{isWellsCollection && <Tab label='View Wells in Collection' />}
					</Tabs>
				</>
			}
			enableLoading
			isLoading={!headersData?._id}
		>
			<TabPanel currentTab={currentTab} tabKey={TABS.info}>
				<SingleWellView
					onHeaderSubmitCallback={onHeaderSubmitCallback}
					wellId={wellId}
					isWellsCollection={isWellsCollection}
				/>
			</TabPanel>
			<TabPanel currentTab={currentTab} tabKey={TABS.comments}>
				<WellComment wellId={wellId} context={context} />
			</TabPanel>
			{isWellsCollection && (
				<TabPanel currentTab={currentTab} tabKey={TABS.wellsCollectionWells}>
					<WellsCollectionWells wellsCollectionId={wellId as Inpt.ObjectId<'wells-collection'>} />
				</TabPanel>
			)}
		</FullScreenDialog>
	);
}
