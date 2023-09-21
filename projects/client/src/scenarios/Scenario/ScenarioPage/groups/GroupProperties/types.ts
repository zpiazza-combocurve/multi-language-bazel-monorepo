// TODO: check this are the properties to save in db
export enum GroupProperties {
	econLimit = 'properties.econLimit',
	allocationTiming = 'properties.allocation.timing',
	allocationProperties = 'properties.allocation.properties',
	allocationBasis = 'properties.allocation.basis',
	allocationMethod = 'properties.allocation.method',
	allocationMethodType = 'properties.allocation.methodType',
	volumnExclusion = 'properties.exclusion.volumnOptions',
	excludeGroup = 'properties.exclusion.group',
}

// to be used by react-hook-form
export interface GroupPropertiesFormData {
	[GroupProperties.econLimit]: string;
	[GroupProperties.allocationTiming]: string;
	[GroupProperties.allocationProperties]: string;
	[GroupProperties.allocationBasis]: string;
	[GroupProperties.allocationMethod]: string;
	[GroupProperties.allocationMethodType]: string;
	[GroupProperties.volumnExclusion]: string;
	[GroupProperties.excludeGroup]: string;
}

export type GroupPropertiesCheckbox = GroupProperties.excludeGroup;
export type GroupPropertiesMenus = Exclude<GroupProperties, GroupPropertiesCheckbox>;
