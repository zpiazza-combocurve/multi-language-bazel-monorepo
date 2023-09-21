import classNames from 'classnames';
import { Component } from 'react';

import { Header } from '@/components/HelpDialog';
import ReactDataSheet from '@/components/InptDataSheet';
import { InfoTooltip } from '@/components/tooltipped';
import { GenerateData, dataRenderer, valueRenderer } from '@/cost-model/detail-components/gen-data';
import { BreakevenProps } from '@/cost-model/detail-components/pricing/types';

export const BE_TOOLTIP = (
	<div>
		Breakeven cannot be run currently on reversionary ownership due to complexity. You can manually iterate by
		editing price model to achieve the desired value.
	</div>
);

const description = (
	<ul>
		<li>
			<div>
				Calculate a breakeven price to achieve a specified ROR. Make sure to select Oil Break Even and/or Gas
				Break Even outputs in the Additional Oneline Summary Options section when running economics
			</div>
		</li>
		<li>{BE_TOOLTIP}</li>
	</ul>
);

function genData(props: BreakevenProps) {
	const { fieldsObj, state } = props;
	if (state && !Object.keys(state).length) {
		return null;
	}
	const ignore = new Set(['modelName', 'list', 'selectedId', 'selectedName', 'search', 'selected']);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const data: Array<any[]> = [];
	Object.keys(state).forEach((key) => {
		if (ignore.has(key)) {
			return;
		}
		const field = fieldsObj[key];

		const reliance = field.reliance;

		if (reliance) {
			const relianceKey = Object.keys(field.reliance)[0];
			const relianceList = field.reliance[relianceKey];
			const relianceValue = (state[relianceKey].criteria || state[relianceKey]).value;
			if (!relianceList.includes(relianceValue)) {
				return;
			}
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		GenerateData({ ...props, data, field, stateKey: key, state: state[key] });
	});

	if (!data.length) {
		return false;
	}

	const lastRow = data.length - 1;

	data[0][0].readOnly = false;

	data.forEach((row, rowIndex) => {
		const lastCol = row.length - 1;

		row.forEach((col, colIndex) => {
			col.i = rowIndex;
			col.j = colIndex;
			col.lastCol = lastCol === colIndex;
			col.lastRow = lastRow === rowIndex;
			col.lastCell = lastRow === rowIndex && col.lastCol;
			col.className = classNames(
				col.className,
				`i_${rowIndex}`,
				`j_${colIndex}`,
				col.lastCol && 'last_col',
				col.lastRow && 'last_row',
				col.lastCell && 'last_cell',
				!rowIndex && !colIndex && 'read-only'
			);
		});
	});

	return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export class Breakeven extends Component<any, any> {
	setB = () => {
		const { breakeven, setBreakevent } = this.props;
		setBreakevent(breakeven, 'breakeven');
	};

	handleChange = (properties) => {
		const { value, key } = properties;
		const { breakeven } = this.props;
		breakeven[key] = value;
		this.setB();
	};

	render() {
		const { fields, breakeven, selected, onSelect } = this.props;
		const data = genData({ fieldsObj: fields, state: breakeven, handleChange: this.handleChange });

		return (
			data && (
				<div id='cost-model-detail-inputs' className='breakeven_sheet sub-model-detail-sheet'>
					<Header>
						<h2 className='md-text'>8/8ths Break Even</h2>
						<InfoTooltip labelTooltip={description} fontSize='18px' />
					</Header>
					<ReactDataSheet
						data={data}
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						selected={selected.breakeven_sheet}
						className='on-hover-paper-2 data-sheet-paper'
						onSelect={(sel) => onSelect('breakeven_sheet', sel)}
					/>
				</div>
			)
		);
	}
}
