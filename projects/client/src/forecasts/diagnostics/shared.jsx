import _ from 'lodash';
import styled from 'styled-components';

import Autocomplete from '@/components/v2/misc/Autocomplete';
import { ifProp } from '@/helpers/styled';
import { labelWithUnit } from '@/helpers/text';

export const COMPARISON_FIELDS = ['eur', 'eur_diff', 'relative_eur_diff'];
export const COMPARISON_FIELDS_TOOLTIPS = {
	eur: 'EUR of comparison forecast',
	eur_diff: 'EUR(comparison forecast) - EUR(current forecast)',
	relative_eur_diff: '[EUR(comparison forecast) - EUR(current forecast)] / EUR(current forecast)',
};

export const ChartContainer = styled.div`
	${ifProp('hidden', 'visibility: hidden;')}
`;

export const diagLabels = {
	qi: (
		<span>
			q<sub>i</sub>
		</span>
	),
	q_end: (
		<span>
			q<sub>f</sub>
		</span>
	),
	'qi/LL': (
		<span>
			q<sub>i</sub>
			/PLL
		</span>
	),
	'qi/Prop': (
		<span>
			q<sub>i</sub>
			/Prop
		</span>
	),
	qi_peak_monthly: 'Monthly Peak Rate',
	qi_peak_daily: 'Daily Peak Rate',
	time_to_qi_peak_monthly: 'Monthly Peak Rate Index',
	time_to_qi_peak_daily: 'Daily Peak Rate Index',
	'eur-cum': 'EUR - CUM',
	eur: 'EUR',
	'eur/LL': 'EUR/PLL',
	'eur/Prop': 'EUR/Prop',
	cum_diff: 'Cum Diff',
	avg_diff: 'Avg Diff',
	cum_diff_percentage: 'Cum Diff Percent',
	// r2: (
	// 	<span>
	// 		R<sup>2</sup>
	// 	</span>
	// ),
	b: 'b',
	D_eff: 'D Effective',
	eur_diff: 'EUR Diff',
	eur1: '1 Year CUM',
	eur3: '3 Year CUM',
	eur5: '5 Year CUM',
	forecast_data_count: 'Forecast Data Count',
	well_life: 'Well Life',
	last_1_month_prod_avg: 'Last 1Mo Avg Prod',
	last_3_month_prod_avg: 'Last 3Mo Avg Prod',
	mae: 'MAE',
	median_abs_ra: 'ABS Relative Error',
	median_ra: 'Relative Error',
	production_data_count: 'Production Data Count',
	realized_D_eff_sw: 'Realized D Sw-Eff-Sec',
	relative_eur_diff: 'EUR Diff',
	rmse: 'RMSE',
};

export const diagUnits = {
	qi: {
		oil: 'BBL/D',
		water: 'BBL/D',
		gas: 'MCF/D',
	},
	q_end: {
		oil: 'BBL/D',
		water: 'BBL/D',
		gas: 'MCF/D',
	},
	'qi/LL': {
		oil: 'BBL/D/1000 FT',
		water: 'BBL/D/1000 FT',
		gas: 'MCF/D/1000 FT',
	},
	'qi/Prop': {
		oil: 'BBL/D/MMLB',
		water: 'BBL/D/MMLB',
		gas: 'MCF/D/MMLB',
	},
	qi_peak_monthly: {
		oil: 'BBL/M',
		water: 'BBL/M',
		gas: 'MCF/M',
	},
	qi_peak_daily: {
		oil: 'BBL/D',
		water: 'BBL/D',
		gas: 'MCF/D',
	},
	time_to_qi_peak_monthly: { oil: 'D', water: 'D', gas: 'D' },
	time_to_qi_peak_daily: { oil: 'D', water: 'D', gas: 'D' },
	eur: {
		oil: 'MBBL',
		water: 'MBBL',
		gas: 'MMCF',
	},
	eur_diff: {
		oil: 'MBBL',
		water: 'MBBL',
		gas: 'MMCF',
	},
	relative_eur_diff: {
		oil: '%',
		water: '%',
		gas: '%',
	},
	'eur-cum': {
		oil: 'MBBL',
		water: 'MBBL',
		gas: 'MMCF',
	},
	'eur/LL': {
		oil: 'BBL/FT',
		water: 'BBL/FT',
		gas: 'MCF/FT',
	},
	'eur/Prop': {
		oil: 'BBL/1000 LB',
		water: 'BBL/1000 LB',
		gas: 'MCF/1000 LB',
	},
	cum_diff: {
		oil: 'MBBL',
		water: 'MBBL',
		gas: 'MMCF',
	},
	avg_diff: {
		oil: 'BBL/D',
		water: 'BBL/D',
		gas: 'MCF/D',
	},
	cum_diff_percentage: {
		oil: '%',
		water: '%',
		gas: '%',
	},
	// r2: { oil: '', water: '', gas: '' },
	mae: {
		oil: 'BBL/D',
		water: 'BBL/D',
		gas: 'MCF/D',
	},
	rmse: {
		oil: 'BBL/D',
		water: 'BBL/D',
		gas: 'MCF/D',
	},
	median_ra: {
		oil: '%',
		water: '%',
		gas: '%',
	},
	median_abs_ra: {
		oil: '%',
		water: '%',
		gas: '%',
	},
	b: { oil: '', water: '', gas: '' },
	D_eff: { oil: '%', water: '%', gas: '%' },
	production_data_count: { oil: '', water: '', gas: '' },
	forecast_data_count: { oil: '', water: '', gas: '' },
	well_life: { oil: 'Year', water: 'Year', gas: 'Year' },
	realized_D_eff_sw: { oil: '%', water: '%', gas: '%' },
	eur1: { oil: 'MBBL', water: 'MBBL', gas: 'MMCF' },
	eur3: { oil: 'MBBL', water: 'MBBL', gas: 'MMCF' },
	eur5: { oil: 'MBBL', water: 'MBBL', gas: 'MMCF' },
	last_1_month_prod_avg: {
		oil: 'BBL/D',
		water: 'BBL/D',
		gas: 'MCF/D',
	},
	last_3_month_prod_avg: {
		oil: 'BBL/D',
		water: 'BBL/D',
		gas: 'MCF/D',
	},
};

export const diagProps = [
	{
		header: 'qi',
		key: 'qi',
		text: diagLabels.qi,
		units: diagUnits.qi,
	},
	{
		header: 'qf',
		key: 'q_end',
		text: diagLabels.q_end,
		units: diagUnits.q_end,
	},
	{
		header: 'qi/PLL',
		key: 'qi/LL',
		text: diagLabels['qi/LL'],
		units: diagUnits['qi/LL'],
	},
	{
		header: 'qi/Prop',
		key: 'qi/Prop',
		text: diagLabels['qi/Prop'],
		units: diagUnits['qi/Prop'],
	},
	{
		header: 'Monthly Peak Rate',
		key: 'qi_peak_monthly',
		text: diagLabels.qi_peak_monthly,
		units: diagUnits.qi_peak_monthly,
	},
	{
		header: 'Daily Peak Rate',
		key: 'qi_peak_daily',
		text: diagLabels.qi_peak_daily,
		units: diagUnits.qi_peak_daily,
	},
	{
		header: 'Monthly Peak Rate Index',
		key: 'time_to_qi_peak_monthly',
		text: diagLabels.time_to_qi_peak_monthly,
		units: diagUnits.time_to_qi_peak_monthly,
	},
	{
		header: 'Daily Peak Rate Index',
		key: 'time_to_qi_peak_daily',
		text: diagLabels.time_to_qi_peak_daily,
		units: diagUnits.time_to_qi_peak_daily,
	},
	{
		header: 'EUR',
		key: 'eur',
		text: diagLabels.eur,
		units: diagUnits.eur,
	},
	{
		header: '1 Year CUM',
		key: 'eur1',
		text: diagLabels.eur1,
		units: diagUnits.eur1,
	},
	{
		header: '3 Year CUM',
		key: 'eur3',
		text: diagLabels.eur3,
		units: diagUnits.eur3,
	},
	{
		header: '5 Year CUM',
		key: 'eur5',
		text: diagLabels.eur5,
		units: diagUnits.eur5,
	},
	{
		header: 'EUR - CUM',
		key: 'eur-cum',
		text: diagLabels['eur-cum'],
		units: diagUnits['eur-cum'],
	},
	{
		header: 'EUR/PLL',
		key: 'eur/LL',
		text: diagLabels['eur/LL'],
		units: diagUnits['eur/LL'],
	},
	{
		header: 'EUR/Prop',
		key: 'eur/Prop',
		text: diagLabels['eur/Prop'],
		units: diagUnits['eur/Prop'],
	},
	{
		header: 'Cum Diff',
		key: 'cum_diff',
		text: diagLabels.cum_diff,
		units: diagUnits.cum_diff,
	},
	{
		header: 'Avg Diff',
		key: 'avg_diff',
		text: diagLabels.avg_diff,
		units: diagUnits.avg_diff,
	},
	{
		header: 'Cum Diff Percent',
		key: 'cum_diff_percentage',
		text: diagLabels.cum_diff_percentage,
		units: diagUnits.cum_diff_percentage,
	},
	// {
	// 	header: 'R2',
	// 	key: 'r2',
	// 	text: diagLabels.r2,
	// 	units: diagUnits.r2,
	// },
	{
		header: 'MAE',
		key: 'mae',
		text: diagLabels.mae,
		units: diagUnits.mae,
	},
	{
		header: 'RMSE',
		key: 'rmse',
		text: diagLabels.rmse,
		units: diagUnits.rmse,
	},
	{
		header: 'Relative Error',
		key: 'median_ra',
		text: diagLabels.median_ra,
		units: diagUnits.median_ra,
	},
	{
		header: 'Absolute Relative Error',
		key: 'median_abs_ra',
		text: diagLabels.median_abs_ra,
		units: diagUnits.median_abs_ra,
	},
	{
		header: 'b',
		key: 'b',
		text: diagLabels.b,
		units: diagUnits.b,
	},
	{
		header: 'D Effective',
		key: 'D_eff',
		text: diagLabels.D_eff,
		units: diagUnits.D_eff,
	},
	{
		header: 'Realized D Sw-Eff-Sec',
		key: 'realized_D_eff_sw',
		text: diagLabels.realized_D_eff_sw,
		units: diagUnits.realized_D_eff_sw,
	},
	{
		header: 'Production Data Count',
		key: 'production_data_count',
		text: diagLabels.production_data_count,
		units: diagUnits.production_data_count,
	},
	{
		header: 'Forecast Data Count',
		key: 'forecast_data_count',
		text: diagLabels.forecast_data_count,
		units: diagUnits.forecast_data_count,
	},
	{
		header: 'Well Life',
		key: 'well_life',
		text: diagLabels.well_life,
		units: diagUnits.well_life,
	},
	{
		header: 'Last 1Mo Avg Prod',
		key: 'last_1_month_prod_avg',
		text: diagLabels.last_1_month_prod_avg,
		units: diagUnits.last_1_month_prod_avg,
	},
	{
		header: 'Last 3Mo Avg Prod',
		key: 'last_3_month_prod_avg',
		text: diagLabels.last_3_month_prod_avg,
		units: diagUnits.last_3_month_prod_avg,
	},
];

export const DEFAULT_KEY_PROPS = {
	curVal: 'qi',
	label: diagLabels.qi,
	units: diagUnits.qi.oil,
};

export function DiagMenuBtn(props) {
	const { additionalItems = [], changeVal, curVal, phase } = props;

	const menuItems = diagProps.concat(additionalItems);

	const byKey = _.keyBy(menuItems, 'key');

	return (
		<div className='options-item'>
			<Autocomplete
				key={phase} // HACK after changing phases dropdown was not showing
				css='width: 20rem;'
				value={curVal}
				options={_.map(menuItems, 'key')}
				getOptionLabel={(value) =>
					labelWithUnit(byKey[value]?.header, diagUnits?.[value]?.[phase] ?? byKey[value]?.units)
				}
				onChange={(ev, newValue) => changeVal(newValue, byKey[newValue].header, byKey[newValue].units)}
				disableClearable
			/>
		</div>
	);
}
