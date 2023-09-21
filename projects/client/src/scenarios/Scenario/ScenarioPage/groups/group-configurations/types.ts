export interface GroupConfiguration {
	_id: string;
	name: string;
	properties;
	configuration;
}

export type EconGroupData = GroupConfiguration & {
	_id: string;
	name: string;
	assignmentIds: string[];
	well?: Record<string, string>;
	isGroupCase?: true;
	isWellsCollectionCase?: true;
};
