import { Button as MdButton } from 'react-md';
import styled from 'styled-components';

import { Styled } from './Styled';

/** @deprecated Use material-ui components */
export default styled(({ disabled, tooltipLabel, ...props }) => {
	if (typeof disabled === 'string' && !tooltipLabel) {
		// allow passing disabled cause through the disabled property
		return <Styled as={MdButton} {...props} disabled tooltipLabel={disabled} />;
	}
	return <Styled as={MdButton} {...props} disabled={disabled} tooltipLabel={tooltipLabel} />;
})``;
