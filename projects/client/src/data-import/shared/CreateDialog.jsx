import { faChevronLeft, faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import styled from 'styled-components';

import { Button, Centered, Paper } from '@/components';
import { theme } from '@/helpers/styled';
import { timestamp } from '@/helpers/timestamp';

const spacing = '1rem';

const Backdrop = styled(Centered).attrs({ horizontal: true, vertical: true })`
	background-color: rgba(0, 0, 0, 0.5);
`;

export const Form = styled.form`
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	overflow: hidden;
`;

export const FormContent = styled.div`
	flex-grow: 1;
	padding: 0.5rem;
	overflow-y: auto;
`;

const StyledFooter = styled.div`
	display: flex;
	flex-shrink: 0;
	padding: 0.5rem;
	width: 100%;

	& > :last-child {
		margin-left: auto;
	}
`;

export function FormFooter({ cancel, accept }) {
	return (
		<StyledFooter>
			{cancel}
			{accept}
		</StyledFooter>
	);
}

const StyledDialogContainer = styled(Paper)`
	width: 40%;
	height: 75%;
	padding: ${spacing};
	background-color: ${theme.background};
`;

export function DialogContainer({ children }) {
	return (
		<Backdrop>
			<StyledDialogContainer>{children}</StyledDialogContainer>
		</Backdrop>
	);
}

export function getImportName(user, dataSource = 'import') {
	const name = `${user.firstName.toLowerCase()[0] ?? ''}${user.lastName.toLowerCase() ?? ''}`;
	const date = timestamp(Date.now());
	return `${dataSource}-${name}${date}`;
}

export function CreateDialog({ onCreate, onCancel, canCreate, children }) {
	return (
		<DialogContainer>
			<Form>
				<FormContent>{children}</FormContent>
				<FormFooter
					cancel={
						<Button faIcon={faChevronLeft} warning onClick={onCancel} transform>
							Cancel
						</Button>
					}
					accept={
						<Button
							onClick={onCreate}
							disabled={!canCreate}
							primary
							transform
							faIcon={faChevronRight}
							iconBefore={false}
						>
							Create
						</Button>
					}
				/>
			</Form>
		</DialogContainer>
	);
}
