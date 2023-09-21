import { ReactNode } from 'react';
import styled from 'styled-components';

import MergeModuleItemsSidebar from './Sidebar';
import { ModuleBasicInfo } from './models';

const Page = styled.div`
	display: flex;
	height: 100%;
`;

const Sidebar = styled.div`
	flex: 1;
`;

const Content = styled.div`
	flex: 3;
	height: 100%;
`;

const Merge = ({
	items,
	onNameChange,
	onSortModuleItems = null,
	maxNumberOfWellsInMerged = -1,
	moduleName,
	titleDescription,
	wellsCountLabel,
	total,
	overlap,
	totalWellsCollections,
	sidebarBeforeWells = null,
	sidebarAdditionalInfo = null,
	content,
}: {
	items: ModuleBasicInfo[];
	onNameChange: (name: string) => void;
	onSortModuleItems?: ((sorted: ModuleBasicInfo[]) => void) | null;
	maxNumberOfWellsInMerged?: number;
	moduleName: string;
	titleDescription: string;
	wellsCountLabel?: ReactNode;
	total: number;
	overlap: number;
	totalWellsCollections?: number;
	sidebarBeforeWells?: ReactNode;
	sidebarAdditionalInfo?: ReactNode;
	content: ReactNode;
}) => {
	return (
		<Page>
			<Sidebar>
				<MergeModuleItemsSidebar
					items={items}
					onNameChange={onNameChange}
					onSortModuleItems={onSortModuleItems}
					maxNumberOfWellsInMerged={maxNumberOfWellsInMerged}
					moduleName={moduleName}
					titleDescription={titleDescription}
					wellsCountLabel={wellsCountLabel}
					total={total}
					overlap={overlap}
					totalWellsCollections={totalWellsCollections}
					beforeWells={sidebarBeforeWells}
					additionalInfo={sidebarAdditionalInfo}
				/>
			</Sidebar>
			<Content>{content}</Content>
		</Page>
	);
};

export default Merge;
