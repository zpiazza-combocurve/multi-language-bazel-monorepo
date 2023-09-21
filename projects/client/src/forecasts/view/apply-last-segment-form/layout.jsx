import styled from 'styled-components';

import { CheckboxField, Dialog, DialogContent, Switch } from '@/components/v2';

import sassVars from '../../../global-styles/vars.scss?inline';

const StyledDialog = styled(Dialog)`
	height: 100%;
	width: 100%;
	.md-dialog {
		height: 95vh;
		width: 75vw;
		.md-dialog-content {
			height: 100%;
			width: 100%;
		}
		.md-dialog-footer {
			justify-content: space-around;
		}
	}
`;

const StyledDialogContent = styled(DialogContent)`
	height: 100%;
	width: 100%;
	padding: 0 1rem;
`;

const FormTitle = styled.div`
	font-size: 1.5rem;
	padding-bottom: 1rem;
`;

const FieldsContainer = styled.section`
	padding: 0 1.5rem 0.5rem 1.5rem;
`;

const FieldTitle = styled.div`
	align-items: center;
	display: flex;
	font-size: 1.25rem;
	margin-bottom: 0.5rem;
	.field-title-label {
		width: 15%;
	}
`;

const FieldTitleActions = styled.span`
	display: flex;
	// margin-left: 1rem;
`;

const FormContainer = styled.section`
	align-items: center;
	display: flex;
	flex-grow: 1;
	flex-wrap: wrap;
	margin: 0.5rem 0;
	.select-field-label {
		margin-right: 0.5rem;
	}
`;

const PSeriesContainer = styled.section`
	align-items: center;
	display: flex;
	padding: 0.5rem 0;
	width: 100%;
`;

const PSeriesSwitch = styled(Switch)``;

const PSeriesTitle = styled.div`
	align-items: center;
	border-right: 2px solid ${sassVars.grey};
	display: flex;
	flex-direction: column;
	padding: 0 1rem;

	.p-label {
		color: ${(props) => props.color};
		font-size: 1.15rem;
		padding: 1rem 0.5rem;
	}

	@media (max-width: 1750px) {
		border-right: 0;
	}
`;

const PSeriesTitleContainer = styled.div`
	align-items: center;
	display: flex;
	width: 15%;
`;

const PSeriesActions = styled.div`
	display: flex;
	justify-content: space-around;
	.paste-btn:hover:not(:disabled) {
		background-color: ${sassVars.secondary} !important;
	}
`;

const GeneralSelectFieldContainer = styled.div`
	align-items: center;
	display: flex;
	padding: 0 1rem;
	.inpt-select-field {
		flex-grow: 1;
	}
	.md-list--menu-contained {
		width: unset;
	}
	.md-list--menu {
		min-width: 100%;
	}
`;

const MethodSelectFieldContainer = styled.div`
	align-items: center;
	display: flex;
	padding: 0.5rem 1rem;
	.select-field-label {
		whites-space: nowrap;
	}
`;

const DatePickerContainer = styled.div`
	align-items: center;
	display: flex;
	padding: 1rem;
	.datepicker-field-label {
		margin-right: 0.5rem;
	}
`;

const NumberFieldContainer = styled.div`
	align-items: center;
	display: flex;
	padding: 0.5rem 1rem;
	width: unset;
	.number-field-label {
		margin-right: 0.5rem;
		white-space: nowrap;
	}
`;

const StyledCheckbox = styled(CheckboxField)`
	margin: 0.5rem;
	.md-selection-control-toggle {
		margin-right: 0.5rem;
	}
`;

export {
	StyledDialogContent,
	DatePickerContainer,
	FieldsContainer,
	FieldTitle,
	FieldTitleActions,
	FormContainer,
	FormTitle,
	GeneralSelectFieldContainer,
	MethodSelectFieldContainer,
	NumberFieldContainer,
	PSeriesActions,
	PSeriesContainer,
	PSeriesSwitch,
	PSeriesTitle,
	PSeriesTitleContainer,
	StyledCheckbox,
	StyledDialog,
};
