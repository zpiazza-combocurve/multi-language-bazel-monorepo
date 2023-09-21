import { useMatch } from 'react-router-dom';

import { URLS } from '@/urls';

import SingleWellView from './shared/SingleWellView';

export function SingleWell() {
	const {
		params: { id: wellId },
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any -- TODO eslint fix later
	} = useMatch<any, any>(`${URLS.well(':id')}/*`)!;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	return <SingleWellView wellId={wellId!} />;
}

export default SingleWell;
