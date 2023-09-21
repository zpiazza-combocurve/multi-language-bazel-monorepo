import { useCallback, useState } from 'react';

import { Placeholder } from '@/components';
import { EmissionData } from '@/inpt-shared/econ-models/emissions';
import { useCurrentProject } from '@/projects/api';

import EconModelV2, { SharedEconModelProps } from '../EconModelV2';
import { useEscalationsInProject } from '../api';
import { useProjectEmissionModelsListQuery } from './AppendEmissionsDialog';
import EmissionTable, { DEFAULT_EMISSION_DATA, checkEmissionModelDataValid } from './EmissionTable';
import { useAllDisctintOptionsQuery } from './api';

function Emission(props: SharedEconModelProps) {
	const [state, setState] = useState<EmissionData>(DEFAULT_EMISSION_DATA);
	const { project } = useCurrentProject();

	const escalationQuery = useEscalationsInProject(project?._id);
	// cache the data at this level, so after closing the dialog, the data is still available
	useAllDisctintOptionsQuery();
	useProjectEmissionModelsListQuery(project);

	return (
		<EconModelV2
			{...props}
			assumptionKey='emission'
			state={state}
			setState={setState}
			stateIsValid={checkEmissionModelDataValid}
			assumptionName='Emission'
			defaultValue={DEFAULT_EMISSION_DATA}
			getAssumptionFromState={useCallback((data) => ({ econ_function: data }), [])}
			getStateFromAssumption={useCallback(({ econ_function }) => econ_function, [])}
		>
			{escalationQuery.isFetching ? (
				<Placeholder loading loadingText='Loading Data' />
			) : (
				<EmissionTable
					css={`
						width: 100%;
						height: 100%;
					`}
					state={state}
					setState={setState}
					escalationQuery={escalationQuery}
				/>
			)}
		</EconModelV2>
	);
}

export default Emission;
