import { Header } from '@/components/HelpDialog';
import ReactDataSheet from '@/components/InptDataSheet';
import { InfoTooltip } from '@/components/tooltipped';
import { FieldType } from '@/inpt-shared/constants';

import { dataRenderer, genData, valueRenderer } from '../gen-data';

const maxRowLength = 3;

const description = (
	<ul>
		<li>
			<div>
				Note: Projects imported from other platforms might default to overwrite actual production data with
				forecasts
			</div>
		</li>
	</ul>
);

const DEFAULT_REPLACE_ACTUAL = {
	criteria: {
		label: 'Never',
		value: 'never',
		staticValue: '',
		fieldType: 'static',
		fieldName: 'Never',
	},
	value: '',
	criteriaHeader: true,
};

export function ProductionVsFitModel(props) {
	const { production_vs_fit_model, fields, setProductionVsFitModel, selected, onSelect } = props;

	const setPF = () => setProductionVsFitModel(production_vs_fit_model, 'production_vs_fit_model');

	const handleChange = (properties) => {
		const { value, key } = properties;
		production_vs_fit_model[key] = value;
		if (key === 'ignore_hist_prod' && value.value === 'yes') {
			// when ignore_hist_prod is 'yes', reset replace actual to default for all phase
			const replaceActualSubitems = production_vs_fit_model.replace_actual.subItems;
			Object.keys(replaceActualSubitems).forEach((phase) => {
				replaceActualSubitems[phase] = DEFAULT_REPLACE_ACTUAL;
			});
		}
		setPF();
	};

	const handleCriteriaChange = (properties) => {
		const { value, key, subKey } = properties;
		production_vs_fit_model[key].subItems[subKey].value = value;
		setPF();
	};

	const handleCriteriaSelect = (properties) => {
		const { value, key, subKey, fullMenuItem } = properties;
		production_vs_fit_model[key].subItems[subKey].criteria = fullMenuItem || value;
		if (production_vs_fit_model[key].subItems[subKey].criteria.fieldType === FieldType.static) {
			production_vs_fit_model[key].subItems[subKey].value =
				production_vs_fit_model[key].subItems[subKey].criteria.staticValue;
		} else {
			production_vs_fit_model[key].subItems[subKey].value = '';
		}
		setPF(production_vs_fit_model, 'production_vs_fit_model');
	};

	const handlers = {
		criteria: handleCriteriaChange,
		'criteria-select': handleCriteriaSelect,
	};

	const data = genData({ fieldsObj: fields, state: production_vs_fit_model, handleChange, handlers });

	if (data.length > 1) {
		// when ignore hist prod is No
		const extra = data[1].pop();

		const appendEmptyCell = Math.max(...data.map((r) => r.length)) >= maxRowLength;

		if (appendEmptyCell) {
			data.forEach((d) => {
				if (d.length < maxRowLength) {
					d.push(extra);
				}
			});
		}
	}

	return (
		data && (
			<div id='cost-model-detail-inputs' className='production_vs_fit_sheet sub-model-detail-sheet'>
				<Header>
					<h2 className='md-text'>Actual or Forecast</h2>
					<InfoTooltip labelTooltip={description} fontSize='18px' />
				</Header>
				<ReactDataSheet
					data={data}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.production_vs_fit_sheet}
					className='on-hover-paper-2 data-sheet-paper'
					onSelect={(sel) => onSelect('production_vs_fit_sheet', sel)}
				/>
			</div>
		)
	);
}
