import styled from 'styled-components';

import { Paper } from '@/components/v2';
import { ifProp } from '@/helpers/styled';

const TypeCurveControlsContainer = styled(Paper).attrs({ elevation: 3 })<{ small?: boolean }>`
	${ifProp('isProximity', 'margin-right: 0', 'margin-right: 1rem;')}
	overflow-y: auto;
	${ifProp('isProximity', 'padding-bottom: 0;', '	padding-bottom: 1.5rem;')}

	/* width: 27rem; */
	${ifProp('small', 'width: unset;', 'width: 30rem;')}
	${ifProp('isProximity', 'box-shadow: none;')}
	${ifProp('isProximity', 'height: 100%;')}
`;

const FormContainer = styled.section`
	display: flex;
	flex-direction: column;
	${ifProp('isProximity', 'padding: .5rem;', 'padding: 0 1rem;')}
	${ifProp('isProximity', 'height: 100%;')}

	& > * {
		margin: 0.25rem 0;
		&:first-child {
			margin-top: 0;
		}
		&:last-child {
			${ifProp('isProximity', 'margin: 0;')}
			${ifProp('isProximity', 'margin-top: auto;', 'margin-bottom: 0;')}
		}
	}

	// HACK: adjust attrs of the following elements when cleaning up
	.MuiFormControlLabel-labelPlacementStart {
		justify-content: space-between;
		margin-left: 0;
		width: 100%;
	}
	.MuiFormControlLabel-label,
	.MuiInputBase-root {
		font-size: 0.8rem;
	}
`;

const ActionsContainer = styled.div`
	align-items: center;
	display: flex;
	justify-content: space-around;
	width: 100%;
`;

export { ActionsContainer, FormContainer, TypeCurveControlsContainer };
