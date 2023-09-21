import _ from 'lodash';
import { useMemo } from 'react';

import ColoredCircle from '@/components/misc/ColoredCircle';
import { Autocomplete } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';
import { useWellHeaders } from '@/helpers/headers';
import { getEllipseStyle } from '@/helpers/styled';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

import { useWellLabel } from '../hooks';

const extraHeaders = ['well_name', 'api10', 'api12', 'api14'];
const specialHeaders = { well_name_number: 'Well Name and Number' };

interface MapLabelSelectProps {
	project: Inpt.Project;
}

function MapLabelSelect({ project }: MapLabelSelectProps) {
	const { wellHeaders } = useAlfa();
	const { wellLabel, setWellLabel } = useWellLabel(project);

	const { wellHeadersLabels, wellHeadersTypes, projectCustomHeadersKeys } = useWellHeaders({
		enableProjectCustomHeaders: true,
	});

	const headers = useMemo(
		() => _.pickBy(wellHeadersLabels, (_value, key) => wellHeadersTypes[key].type === 'multi-select'),
		[wellHeadersLabels, wellHeadersTypes]
	);

	const extraHeadersObj = {};
	extraHeaders.forEach((h) => {
		extraHeadersObj[h] = wellHeaders[h];
	});

	const allHeaders = { ...specialHeaders, ...extraHeadersObj, ...headers };

	return (
		<Autocomplete
			label='Wells Label Header'
			options={[null, ...Object.keys(allHeaders)]}
			value={wellLabel && allHeaders[wellLabel] ? wellLabel : null}
			getOptionLabel={(key) => (key === null ? 'None' : allHeaders[key])}
			renderOption={(key) =>
				key === null ? (
					'None'
				) : (
					<>
						{projectCustomHeadersKeys.includes(key) && <ColoredCircle $color={projectCustomHeaderColor} />}
						{allHeaders[key]}
					</>
				)
			}
			InputLabelProps={{
				style: { ...getEllipseStyle() },
			}}
			onChange={(_, newValue) => setWellLabel(newValue)}
			variant='outlined'
			fullWidth
		/>
	);
}

export default MapLabelSelect;
