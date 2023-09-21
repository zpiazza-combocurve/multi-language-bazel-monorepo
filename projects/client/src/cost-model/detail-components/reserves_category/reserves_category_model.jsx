import classNames from 'classnames';

import ReactDataSheet from '@/components/InptDataSheet';
import { AssumptionKey } from '@/inpt-shared/constants';

import { dataRenderer, valueRenderer } from '../gen-data';
import { genData } from '../helper';

export function ReservesCategoryModel(props) {
	const { reserves_category, fields, setReservesCategoryModel, onSelect, selected } = props;

	const selKey = 'reserves_category_sheet';
	const setRCM = () => setReservesCategoryModel(reserves_category, AssumptionKey.reservesCategory);

	const handleChange = (properties) => {
		const { value, key } = properties;
		reserves_category[key] = value;
		setRCM();
	};

	const data = genData({ fieldsObj: fields, state: reserves_category, handleChange });

	return (
		data && (
			<div id='cost-model-detail-inputs' className='sub-model-detail-sheet'>
				<h2 className='md-text'>Reserves Category</h2>
				<ReactDataSheet
					data={data}
					selected={selected[selKey]}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					onSelect={(sel) => onSelect(selKey, sel)}
					className={classNames(selKey, 'on-hover-paper-2 data-sheet-paper')}
				/>
			</div>
		)
	);
}
