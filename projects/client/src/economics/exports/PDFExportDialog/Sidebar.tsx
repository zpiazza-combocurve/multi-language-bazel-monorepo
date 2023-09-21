import { Section, SectionContent, SectionHeader } from '@/layouts/Section';

import { ProjectSelect } from './Sidebar/ProjectSelect';
import { ReportTypeSelect } from './Sidebar/ReportTypeSelect';
import { TemplateList } from './Sidebar/TemplateList';

export function Sidebar() {
	return (
		<Section>
			<SectionHeader
				css={`
					& > *:not(:first-child) {
						margin-top: 0.5rem;
					}
				`}
			>
				<ReportTypeSelect />
				<ProjectSelect />
				<hr />
			</SectionHeader>
			<SectionContent>
				<TemplateList />
			</SectionContent>
		</Section>
	);
}
