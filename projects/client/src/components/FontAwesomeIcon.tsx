import { FontAwesomeIcon as FortAwesomeIcon } from '@fortawesome/react-fontawesome';

export function FontAwesomeIcon(props) {
	return (
		<FortAwesomeIcon
			css={`
				&& {
					font-size: inherit;
				}
			`}
			{...props}
		/>
	);
}
