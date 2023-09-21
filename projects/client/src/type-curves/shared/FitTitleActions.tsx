import styled from 'styled-components';

import sassVars from '../../global-styles/vars.scss?inline';

const FitTitleActionsContainer = styled.section`
	align-items: center;
	display: flex;
	justify-content: space-around;
	.well-count {
		color: ${sassVars.grey};
		margin-right: 0.5rem;
	}
`;

export default FitTitleActionsContainer;
