export const WELL_HEADER_COLUMNS = [
	{
		key: 'well_name',
		title: 'Well Name',
		width: 200,
		frozen: true,
	},
	{
		key: 'well_number',
		title: 'Well Number',
		width: 150,
		frozen: true,
	},
	{
		key: 'api10',
		title: 'API 10',
		width: 150,
	},
	{
		key: 'api14',
		title: 'API 14',
		width: 150,
	},
	{
		key: 'chosenID',
		title: 'Chosen ID',
		width: 150,
	},
	{
		key: 'inptID',
		title: 'Inpt ID',
		width: 150,
	},
	{
		key: 'pad_name',
		title: 'Pad Name',
		width: 130,
	},
	{
		key: 'status',
		title: 'Status',
		width: 130,
	},
	{
		key: 'scheduling_status',
		title: 'Scheduling Status',
		width: 130,
	},
	{
		key: 'state',
		title: 'State',
		width: 90,
	},
	{
		key: 'county',
		title: 'County',
		width: 130,
	},
	{
		key: 'type_curve_area',
		title: 'Type Curve Area',
		width: 170,
	},
];

export const WELL_HEADER_COLUMNS_WITH_ORDER = [
	{
		key: 'priority',
		title: 'Priority',
		width: 80,
		frozen: true,
	},
	...WELL_HEADER_COLUMNS,
];
