import { Doggo } from '@/components';

import './not-found.scss';

interface NotFoundProps {
	text?: { h1?: string; h3?: string };
}

function NotFound(props: NotFoundProps) {
	const { text } = props;

	return (
		<div id='not-found'>
			<Doggo large />
			<h1
				// TODO check what these styles are affecting and if they are needed since we'll be removing react-md
				className='md-text title'
			>
				{text?.h1 ?? '4 0 4'}
			</h1>
			<h3 className='md-text droids'>{text?.h3 ?? `We couldn't fetch the page you are looking for ... ruff`}</h3>
		</div>
	);
}

export default NotFound;
