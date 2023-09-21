import { DialogLikeProps } from '@/helpers/dialog';
import { GroupConfiguration } from '@/scenarios/Scenario/ScenarioPage/groups/group-configurations/types';

import { GroupPropertiesFormData } from '../GroupProperties/types';

// TODO: move to shared
export enum CreateGroupProperties {
	headers = 'configuration.headers',
	groupName = 'configuration.groupName',
	massCreateGroups = 'configuration.massCreateGroups',
	headerAsName = 'configuration.headerAsName',
}

export interface FormData extends GroupPropertiesFormData {
	[CreateGroupProperties.headers]: string[];
	[CreateGroupProperties.groupName]: string;
	[CreateGroupProperties.massCreateGroups]: boolean;
	[CreateGroupProperties.headerAsName]: boolean;
}

export enum GroupDialogMode {
	create = 'create',
	edit = 'edit',
}

export type GroupDialogProps = {
	mode?: GroupDialogMode;
	currentGroupData?: GroupConfiguration;
} & DialogLikeProps;
