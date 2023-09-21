import { faCloudUpload } from '@fortawesome/pro-regular-svg-icons';
import styled from 'styled-components';

import { FontIcon } from '@/components';
import { useAlfa } from '@/helpers/alfa';
import { theme } from '@/helpers/styled';

import { ALL_DATA_SOURCES } from './FileImport/CreateDialog';

const ImportInfoBar = styled.div`
	display: flex;
	justify-content: space-between;
	height: 3rem;
	padding-left: 2rem;
	flex-shrink: 0;
	border-bottom: 1px solid ${theme.borderColor};
`;

const ImportNameContainer = styled.div`
	display: flex;
	align-items: center;

	& > :not(:first-child) {
		margin-left: 1rem;
	}
`;

const ImportSettingContainer = styled.div`
	display: flex;
	align-items: center;

	& > * {
		padding: 0 1rem;

		:not(:first-child) {
			border-left: 1px solid ${theme.borderColor};
		}
	}
`;

const Label = styled.span`
	color: ${theme.textColorOpaque};
	margin-right: 1rem;
`;

const ProjectName = styled.span`
	color: ${theme.primaryColor};
	margin-left: 0.5rem;
`;

function useScope(projectId, importType) {
	const { project } = useAlfa();

	if (importType === 'aries' || importType === 'phdwin') {
		return ['Import to new project', null];
	}

	if (!projectId) {
		return ['Import to Company Level', null];
	}

	return ['Import to Existing Project', project?.name];
}

export function FileImportInfo({ description, dataSource, project, importType }) {
	const [scope, projectName] = useScope(project, importType);

	return (
		<ImportInfoBar>
			<ImportNameContainer>
				<FontIcon>{faCloudUpload}</FontIcon>
				<span>{description}</span>
			</ImportNameContainer>
			<ImportSettingContainer>
				<div>
					<Label>Data Source:</Label>
					{ALL_DATA_SOURCES[dataSource]}
				</div>
				<div>
					<Label>Scope:</Label>
					{scope}
					<ProjectName>{projectName}</ProjectName>
				</div>
			</ImportSettingContainer>
		</ImportInfoBar>
	);
}
