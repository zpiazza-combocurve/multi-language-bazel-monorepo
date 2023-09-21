import { createTheme } from '@material-ui/core/styles';
import styled from 'styled-components';

import { Button } from '@/components/v2';
import sassVars from '@/global-styles/vars.scss?inline';
import theme, { ifProp } from '@/helpers/styled';
import { withExtendedThemeProvider } from '@/helpers/theme';

const ViewContainer = styled.section`
	height: 100%;
	margin: 0 0.5rem;
	padding-top: 0.5rem;
	width: calc(100% - 1rem);
`;

const GridContainer = styled.section`
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
`;

const GridControlLayout = styled.section`
	align-items: center;
	border-radius: 5px;
	box-shadow: ${sassVars.boxShadow1};
	display: flex;
	height: 3.5rem;
	justify-content: space-between;
	margin-bottom: 0.5rem;
	padding: 0.25rem;
	width: 100%;
	${ifProp('hidden', 'display: none;')}
`;

const GridChartArea = styled.section`
	align-items: center;
	display: flex;
	flex-grow: 1;
	padding-bottom: 0.5rem;
	max-width: 100%;
`;

const ControlsContainer = styled.div`
	align-items: center;
	column-gap: 0.25rem;
	display: flex;
	justify-content: space-between;
`;

const ForecastToolbarTheme = withExtendedThemeProvider((p) =>
	createTheme({
		...p,
		props: {
			MuiButton: { size: 'small' },
			MuiIconButton: { size: 'small' },
			MuiIcon: { fontSize: 'small' },
			MuiFab: { size: 'small' },
			MuiInput: { margin: 'dense' },
			MuiCheckbox: { size: 'small' },
		},
		overrides: {
			MuiButton: {
				root: { textTransform: 'unset' },
				label: { fontSize: '0.75rem' },
				endIcon: { marginLeft: '0.125rem' },
			},
			MuiFormLabel: { root: { fontSize: '0.75rem' } },
			MuiInput: { input: { fontSize: '0.75rem !important' } },
			MuiOutlinedInput: {
				input: { fontSize: '0.75rem !important', height: '18px !important' },
				adornedEnd: { paddingRight: 0 },
			},
			MuiFormControlLabel: {
				label: { fontSize: '0.75rem', fontWeight: 500 },
				root: { marginLeft: 0 },
				labelPlacementStart: { marginLeft: 0, marginRight: 0 },
			},
			MuiIcon: {
				root: {
					fontSize: '1.25rem !important',
				},
			},
			MuiMenuItem: {
				root: {
					fontSize: '0.75rem !important',
				},
			},
			MuiListItem: {
				root: {
					paddingTop: 0,
					paddingBottom: 0,
					fontSize: '0.75rem',
				},
				label: { fontSize: '0.75rem' },
			},
		},
	})
);

const ControlsToolbar = styled.div`
	.fa-chevron-down {
		font-size: 0.75rem;
	}

	.forecast-toolbar-configurations span {
		svg path {
			fill: ${theme.textColor};
		}
	}

	.well-filter-button {
		p {
			font-size: 0.75rem;
		}

		svg {
			path {
				fill: ${theme.textColor};
			}
		}

		span {
			font-size: 1.25rem !important;
		}
	}

	.well-sorting-button {
		.md-list-tile {
			height: 30px;
		}

		li div {
			font-size: 0.75rem;
		}

		.md-btn--text {
			font-size: 1.25rem !important;
		}

		svg {
			path {
				fill: ${theme.textColor} !important;
			}
		}
	}

	.run-forecast-button {
		padding-left: 10px;
		padding-right: 10px;
		margin-left: 5px;
	}

	.pagination-control-button {
		span {
			font-size: 1.25rem;
		}
	}
`;

const FiltersRow = styled.div`
	align-items: center;
	column-gap: 0.25rem;
	display: flex;
`;

const PaginationControlsContainer = styled.section`
	align-items: center;
	column-gap: 0.25rem;
	display: flex;
	font-weight: 500;
	justify-content: space-between;
	${ifProp('hidden', 'visibility: hidden;')}
`;

const PaginationText = styled.span`
	font-size: 0.75rem;
	font-weight: 500;
`;

const SearchIndicatorContainer = styled.span`
	opacity: 0.5;
	top: 20px;
	transform: translateY(-50%);
	&:hover {
		cursor: pointer;
		opacity: 1;
	}
`;

// applies to both buttons and menubuttons
const ControlButtonContainer = styled.div`
	.md-btn--text {
		// font-size: 1rem !important;
		min-width: 4.5rem;
	}
`;

const ForecastViewButton = styled(Button)`
	border: 1px solid ${theme.secondaryColor};
	color: ${theme.secondaryColor};
`;

export {
	ControlButtonContainer,
	ControlsContainer,
	ControlsToolbar,
	FiltersRow,
	ForecastToolbarTheme,
	ForecastViewButton,
	GridChartArea,
	GridContainer,
	GridControlLayout,
	PaginationControlsContainer,
	PaginationText,
	SearchIndicatorContainer,
	ViewContainer,
};
