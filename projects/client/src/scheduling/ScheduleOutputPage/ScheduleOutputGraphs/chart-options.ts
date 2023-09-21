export type Options = 'well-delivery-chart' | 'map';

export type ChartOption = {
	_id: Options;
	name: string;
};

export const CHART_OPTIONS = [
	{
		_id: 'well-delivery-chart',
		name: 'Well Delivery Chart',
	},
	{
		_id: 'map',
		name: 'Map',
	},
] as ChartOption[];
