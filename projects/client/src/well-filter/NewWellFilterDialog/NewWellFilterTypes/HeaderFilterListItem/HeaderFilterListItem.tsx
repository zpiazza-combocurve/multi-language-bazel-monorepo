import { FilterBoolean } from '../BooleanFilterType/filterBoolean';
import { FilterDateRange } from '../DateRangeFilterType/filterDateRange';
import { FilterMultiCheckbox } from '../MultiCheckFilterType/filterMultiCheck';
import { FilterMultiSelect } from '../MultiSelectFilterType/filterMultiSelect';
import { FilterNumber } from '../NumberFilterType/filterNumber';
import { FilterPercent } from '../PercentFilterType/filterPercent';
import { FilterString } from '../StringFilterType/filterString';

export const HeaderFilterListItem = ({
	header,
	headerNames,
	headerTypes,
	headerState,
	onChange,
	appliedFilters,
	removeHeaderType,
}) => {
	const headerType = headerTypes[header];
	const { type, projectHeader } = headerType;
	const stateValue = headerState?.value;

	return (
		<div key={header} className='single-header-filter'>
			{['number', 'integer'].includes(type) && (
				<FilterNumber
					inputName={headerNames[header]}
					minValue={stateValue.start}
					maxValue={stateValue.end}
					exclude={stateValue.exclude}
					showNull={stateValue.showNull}
					neverNull={stateValue.neverNull}
					inputKey={header}
					onChange={(newValue, key) => onChange(newValue, key, projectHeader)}
					projectHeader={projectHeader}
					removeHeaderType={removeHeaderType}
				/>
			)}
			{type === 'percent' && (
				<FilterPercent
					inputName={headerNames[header]}
					minValue={stateValue.start}
					maxValue={stateValue.end}
					exclude={stateValue.exclude}
					showNull={stateValue.showNull}
					neverNull={stateValue.neverNull}
					inputKey={header}
					onChange={(newValue, key) => onChange(newValue, key, projectHeader)}
					projectHeader={projectHeader}
					removeHeaderType={removeHeaderType}
				/>
			)}
			{type === 'string' && (
				<FilterString
					inputName={headerNames[header]}
					value={stateValue?.value}
					exclude={stateValue?.exclude}
					exact={stateValue?.exact}
					showNull={stateValue?.showNull}
					neverNull={stateValue?.neverNull}
					inputKey={header}
					onChange={(newValue, key) => onChange(newValue, key, projectHeader)}
					projectHeader={projectHeader}
					removeHeaderType={removeHeaderType}
				/>
			)}
			{type === 'date' && (
				<FilterDateRange
					inputName={headerNames[header]}
					start_date={stateValue.start}
					end_date={stateValue.end}
					exclude={stateValue.exclude}
					showNull={stateValue.showNull}
					neverNull={stateValue.neverNull}
					inputKey={header}
					onChange={(newValue, key) => onChange(newValue, key, projectHeader)}
					projectHeader={projectHeader}
					removeHeaderType={removeHeaderType}
				/>
			)}
			{type === 'multi-select' && (
				<FilterMultiSelect
					inputName={headerNames[header]}
					inputValue={stateValue?.value}
					values={stateValue?.values}
					exclude={stateValue?.exclude}
					showNull={stateValue?.showNull}
					neverNull={stateValue?.neverNull}
					appliedFilters={appliedFilters}
					collapsed={stateValue.collapsed}
					inputKey={header}
					onChange={(newValue, key) => onChange(newValue, key, projectHeader)}
					projectHeader={projectHeader}
					removeHeaderType={removeHeaderType}
				/>
			)}
			{type === 'multi-checkbox' && (
				<FilterMultiCheckbox
					inputName={headerNames[header]}
					values={stateValue?.values}
					options={stateValue?.options}
					exclude={stateValue?.exclude}
					showNull={stateValue?.showNull}
					neverNull={stateValue?.neverNull}
					inputKey={header}
					onChange={(newValue, key) => onChange(newValue, key, projectHeader)}
					projectHeader={projectHeader}
					removeHeaderType={removeHeaderType}
				/>
			)}
			{type === 'boolean' && (
				<FilterBoolean
					inputName={headerNames[header]}
					inputKey={header}
					value={stateValue?.value}
					options={headerType?.options}
					showNull={stateValue?.showNull}
					neverNull={stateValue?.neverNull}
					onChange={(newValue, key) => onChange(newValue, key, projectHeader)}
					projectHeader={projectHeader}
					removeHeaderType={removeHeaderType}
				/>
			)}
		</div>
	);
};
