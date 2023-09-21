import styled from 'styled-components';

const FormContainer = styled.section`
	display: flex;
	flex-direction: column;
	padding: 0 1rem;
	row-gap: 1rem;
	width: 100%;
`;

const InputContainer = styled.div`
	align-items: center;
	display: flex;
	justify-content: space-between;
	margin: 0.5rem 0;
	width: 100%;
	.input-item {
		flex-grow: 1;
	}
`;

const InputLabel = styled.span`
	flex-shrink: 1;
	margin-right: 0.5rem;
	min-width: 30%;
`;

const FooterActions = styled.section`
	column-gap: 0.5rem;
	display: flex;
	justify-content: flex-end;
	margin-top: auto;
	padding: 0.5rem 1rem;
`;

export { FormContainer, InputContainer, InputLabel, FooterActions };
