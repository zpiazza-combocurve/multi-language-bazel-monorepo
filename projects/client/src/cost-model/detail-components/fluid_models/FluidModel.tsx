import { useCallback, useState } from 'react';

import { AssumptionKey } from '@/inpt-shared/constants';

import EconModelV2, { SharedEconModelProps } from '../EconModelV2';
import FluidModelTable, { DEFAULT_FLUID_MODEL_DATA, Data, checkFluidModelDataValid } from './FluidModelTable';

interface FluidModelProps extends SharedEconModelProps {
	className?: string;
}

function FluidModel(props: FluidModelProps) {
	const { className, ...restProps } = props;
	const [state, setState] = useState<Data>(DEFAULT_FLUID_MODEL_DATA);

	return (
		<EconModelV2
			{...restProps}
			assumptionKey={AssumptionKey.fluidModel}
			state={state}
			setState={setState}
			stateIsValid={checkFluidModelDataValid}
			assumptionName='Fluid Model'
			defaultValue={DEFAULT_FLUID_MODEL_DATA}
			getAssumptionFromState={useCallback((data) => ({ econ_function: data }), [])}
			getStateFromAssumption={useCallback(({ econ_function }) => econ_function, [])}
		>
			<FluidModelTable
				className={className}
				css={`
					width: 100%;
					height: 100%;
				`}
				state={state}
				setState={setState}
			/>
		</EconModelV2>
	);
}

export default FluidModel;
