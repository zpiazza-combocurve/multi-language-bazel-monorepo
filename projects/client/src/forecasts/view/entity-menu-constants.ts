import { useCustomWellHeaderNames } from '@/company/CustomColumnsRename/well-headers';

export const entityMenu = {
	default: {
		label: 'Chosen ID',
		value: 'chosenID',
	},
	menuItems: [
		{
			label: 'Chosen ID',
			value: 'chosenID',
		},
		{
			label: 'INPT ID',
			value: 'inptId',
		},
		{
			label: 'Well Name',
			value: 'well_name',
		},
		{
			label: 'Well Number',
			value: 'well_number',
		},
		{
			label: 'Lease Name',
			value: 'lease_name',
		},
		{
			label: 'API 10',
			value: 'api10',
		},
		{
			label: 'API 12',
			value: 'api12',
		},
		{
			label: 'API 14',
			value: 'api14',
		},
		{
			label: 'ARIES ID',
			value: 'aries_id',
		},
		{
			label: 'PhdWin ID',
			value: 'phdwin_id',
		},
	],
};

const useEntityMenuOptions = () => {
	// Get column names from useCustomWellHeaderNames hook
	const { columnNames } = useCustomWellHeaderNames();

	// Create a copy of entityMenu using structuredClone
	const updatedMenu = structuredClone(entityMenu);

	const customStringsKeys = Object.keys(columnNames).filter((key) => key.includes('custom_string'));
	customStringsKeys.forEach((value) => {
		updatedMenu.menuItems.push({
			value,
			label: columnNames[value],
		});
	});

	// Return the updatedMenu
	return updatedMenu;
};

export default useEntityMenuOptions;
