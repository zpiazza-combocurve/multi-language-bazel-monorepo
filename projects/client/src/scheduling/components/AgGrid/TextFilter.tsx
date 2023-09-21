import { faSearch } from '@fortawesome/pro-regular-svg-icons';
import { IDoesFilterPassParams, IFilterParams } from 'ag-grid-community';
import { forwardRef, useContext, useImperativeHandle } from 'react';

import { Icon, InputAdornment, TextField } from '@/components/v2';
import { FilterContext } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/WellHeaderComponent';

const TextFilter = forwardRef(
	(
		props: IFilterParams & {
			showIcon?: boolean;
			center?: boolean;
			colId: string;
		},
		ref
	) => {
		const { colId } = props;

		const { filters, setFilters } = useContext(FilterContext);

		const value = filters?.[colId];

		const updateFilters = (value) => {
			const newFiltersModel = {
				...filters,
				[colId]: value,
			};
			const newFiltersModelValidEntries = Object.entries(newFiltersModel).filter(([, value]) => value);
			setFilters(Object.fromEntries(newFiltersModelValidEntries));
		};

		useImperativeHandle(ref, () => {
			return {
				doesFilterPass(params: IDoesFilterPassParams) {
					return params.data[props.column.getColId()]?.match(value);
				},
				isFilterActive() {
					return !!value;
				},
				getModel() {
					return value ?? '';
				},
			};
		});

		const onValueChange = (event) => {
			const newValue = event.target.value;
			updateFilters(newValue);
		};

		return (
			<TextField
				variant='outlined'
				color='secondary'
				css={`
					padding: 0 0.5rem;
					width: 100%;
					& input {
						text-align: ${props.center ? 'center' : 'inherit'};
					}
				`}
				onChange={onValueChange}
				value={value || ''}
				InputProps={{
					...(props.showIcon
						? {
								startAdornment: (
									<InputAdornment position='start'>
										<Icon
											css={`
												font-size: 20px;
											`}
										>
											{faSearch}
										</Icon>
									</InputAdornment>
								),
						  }
						: {}),
					style: {
						height: '28px',
					},
				}}
			/>
		);
	}
);

export default TextFilter;
