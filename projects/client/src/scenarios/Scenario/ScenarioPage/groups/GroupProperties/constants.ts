import { GroupProperties, GroupPropertiesCheckbox, GroupPropertiesMenus } from './types';

// TODO: maybe rename or get from somewhere else
type MenuItem = { label: string; value: string };

export const GROUP_PROPERTIES: {
	[key in GroupPropertiesMenus]: { label: string; menuItems: MenuItem[] };
} & {
	[key in GroupPropertiesCheckbox]: string;
} = {
	[GroupProperties.econLimit]: {
		label: 'Group Econ Limit',
		menuItems: [
			{ label: 'Well ECL Independent of Group ECL', value: 'group-independent' },
			{ label: 'Well ECL can not exceed Group ECL', value: 'cannot-exceed-group' },
			{ label: 'Well ECL must be Group ECL', value: 'must-be-group' },
		],
	},
	[GroupProperties.allocationTiming]: {
		label: 'Update Allocation Timing',
		menuItems: [
			{ label: 'Annual', value: 'annual' },
			{ label: 'Monthly', value: 'monthly' },
			{ label: 'Monthly based on Remaining', value: 'remaining' },
		],
	},
	[GroupProperties.allocationProperties]: {
		label: 'Allocation',
		menuItems: [
			{ label: 'None', value: 'none' },
			{ label: 'Individual Wells', value: 'individual-wells' },
		],
	},
	[GroupProperties.allocationBasis]: {
		label: 'Allocation Basis',
		menuItems: [
			{ label: 'Gross', value: 'gross' },
			{ label: 'Net', value: 'net' },
		],
	},
	[GroupProperties.allocationMethodType]: {
		label: 'Allocation Method Type',
		menuItems: [
			{ label: 'Gross', value: 'gross' },
			{ label: 'Net', value: 'net' },
		],
	},
	[GroupProperties.allocationMethod]: {
		label: 'Allocation Method',
		menuItems: [
			{ label: 'Well Count', value: 'well-count' },
			{ label: 'Revenue', value: 'revenue' },
			{ label: 'Income', value: 'income' },
			{ label: 'BOE', value: 'boe' },
			{ label: 'Oil', value: 'oil-volume' },
			{ label: 'Gas', value: 'gas-volume' },
		],
	},
	[GroupProperties.volumnExclusion]: {
		label: 'Volume Exclusion Options',
		menuItems: [
			{ label: 'Volumes not excluded', value: 'volumes-not-excluded' },
			{ label: 'Exclude volumes from Well Reports', value: 'volumes-excluded-from-well-reports' },
			{ label: 'Exclude volumes from Aggregate Reports', value: 'volumes-excluded-from-aggregate-reports' },
		],
	},
	[GroupProperties.excludeGroup]: 'Exclude Group',
};
