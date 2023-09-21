import styled, { css } from 'styled-components';

import { SelectField } from '@/components';
import sassVars from '@/global-styles/vars.scss?inline';
import { ifProp } from '@/helpers/styled';

const ManualContainer = styled.section`
	display: flex;
	height: 100%;
	padding: 0.5rem;
	width: 100%;
`;

const ManualControlsContainer = styled.section`
	border-radius: 5px;
	box-shadow: ${sassVars.boxShadow1};
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	height: 100%;
	margin-right: 0.5rem;
	overflow-y: auto;
	padding-bottom: 0.5rem;
	padding-top: 0.5rem;
	width: 20%; // same width as well-table
	&:hover {
		box-shadow: ${sassVars.boxShadow4};
	}
`;

const ManualControlsTitle = styled.div`
	font-size: 2rem;
	text-align: center;
`;

const ManualActionsContainer = styled.section`
	display: flex;
	justify-content: space-around;
	padding: 0.5rem 0;
`;

export const smallerFonts = css`
	font-size: 0.8em;
	// smaller form components
	.md-card-text,
	// text fields
	.md-text-field.md-text-field--margin.md-full-width.md-text,
	.md-text-field,
	// checkbox
	.md-selection-control-label,
	// select fields
	.md-tile-text--primary,
	.md-icon-separator.md-text-field.md-select-field--btn {
		font-size: inherit;
	}
	.md-text-field--margin {
		margin-top: 0.25rem;
	}
	.md-list-tile {
		height: 2rem;
	}
	.md-select-field--btn {
		height: 1.5rem;
	}
	// date pickers
	.react-date-picker-container .react-datepicker-wrapper .react-date-picker-input {
		font-size: inherit;
		width: 9rem;
	}
`;

const ControlsFormContainer = styled.section`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	overflow-y: auto;
	& > * {
		margin: 0.25rem 0;
		width: 100%;
	}
	.inpt-divider {
		width: 100% !important;
	}
	${smallerFonts}
	${ifProp('noPadding', 'padding: 0;', 'padding: 0.5rem;')};
`;

const ControlsSectionContainer = styled.section<{ noPadding?: boolean }>`
	display: flex;
	flex-direction: column;
	${ifProp('noPadding', 'padding: 0;', 'padding: 0.5rem;')};
	& > * {
		margin: 0.25rem 0;
		width: 100%;
		&:first-child {
			margin-top: 0;
		}
		&:last-child {
			margin-bottom: 0;
		}
	}
`;

const SectionTitle = styled.div`
	font-size: 1.5rem;
	text-align: center;
`;

const TableContainer = styled.section`
	${ifProp('collapsed', 'width: 80%;', 'width: 20%;')};
	margin-right: 1rem;
	#well-table {
		height: 100%;
	}
`;

const ManualFormActionsContainer = styled.section`
	display: flex;
	flex-wrap: wrap;
	justify-content: space-around;
	& > * {
		margin: 0.25rem 0.5rem;
		&:first-child {
			margin-left: 0;
		}
		&:last-child {
			margin-right: 0;
		}
	}
`;

const ManualChartArea = styled.section`
	${ifProp('hidden', 'display: none !important')};
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	height: 100%;
`;

const ManualChartContainer = styled.section`
	border-radius: 5px;
	box-shadow: ${sassVars.boxShadow1};
	height: 100%;
	width: 100%;
`;

const ControlFieldContainer = styled.div`
	align-items: center;
	display: flex;
	justify-content: space-between;
`;

const ControlFieldLabel = styled.span`
	min-width: 90px;
	white-space: nowrap;
	${ifProp('small', 'font-size: 0.8rem;')};
`;

const ControlFieldUnits = styled.span`
	color: gray;
	${ifProp('small', 'font-size: 0.75rem;')}
	margin-left: 0.25rem !important;
`;

const StyledSelectField = styled(SelectField)`
	flex-grow: 1;
`;

const NoWrapText = styled.span`
	white-space: nowrap;
`;

function InlineLabeled({ label, children, noPadding }) {
	// TODO remove some levels of containers
	return (
		<ControlsSectionContainer noPadding={noPadding}>
			<ControlFieldContainer>
				<ControlFieldLabel>{label}:</ControlFieldLabel>
				{children}
			</ControlFieldContainer>
		</ControlsSectionContainer>
	);
}

export {
	ControlFieldContainer,
	ControlFieldLabel,
	ControlFieldUnits,
	ControlsFormContainer,
	ControlsSectionContainer,
	InlineLabeled,
	ManualActionsContainer,
	ManualChartArea,
	ManualChartContainer,
	ManualContainer,
	ManualControlsContainer,
	ManualControlsTitle,
	ManualFormActionsContainer,
	NoWrapText,
	SectionTitle,
	StyledSelectField,
	TableContainer,
};
