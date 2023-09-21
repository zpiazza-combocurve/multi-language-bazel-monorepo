import { formatValue } from '@/helpers/utilities';
import { fields as types } from '@/inpt-shared/display-templates/wells/well_header_types.json';

const DisplayHeader = ({ header, value }) => {
	const formattedValue = formatValue(value, types[header]?.type);

	return (
		<span
			css={`
				font-weight: initial;
			`}
			className='display-header-value'
			title={formattedValue}
		>
			{formattedValue}
		</span>
	);
};

export default DisplayHeader;
