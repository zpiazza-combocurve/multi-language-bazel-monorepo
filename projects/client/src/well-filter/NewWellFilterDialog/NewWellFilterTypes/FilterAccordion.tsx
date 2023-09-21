import { TypographyProps } from '@material-ui/core';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import { styled as muiStyled } from '@mui/material/styles';
import styled from 'styled-components';

import { Typography } from '@/components/v2';

export const FilterAccordion = muiStyled((props: AccordionProps) => <MuiAccordion elevation={0} {...props} />)(
	({ theme }) => {
		return {
			backgroundColor: theme.palette.background.opaque,
			marginBottom: '0.5rem',
			'&.Mui-expanded:last-of-type': {
				marginBottom: '0.5rem',
			},
		};
	}
);

export const FilterAccordionSummary = muiStyled((props: AccordionSummaryProps) => (
	<MuiAccordionSummary expandIcon={<ExpandMoreIcon />} {...props} />
))(({ theme }) => ({
	backgroundColor: theme.palette.background.opaque,
	flexDirection: 'row-reverse',
	padding: '0 5px',
	'&.Mui-expanded': {
		minHeight: '40px',
	},
	'& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
		transform: 'rotate(-90deg)',
	},
	'& .MuiAccordionSummary-content': {
		margin: `6px 0 6px ${theme.spacing(1)}px`,
	},
}));

export const FilterAccordionSummaryNameContainer = styled.div`
	display: flex;
	justify-content: space-between;
	flex: 1;
`;

export const FilterName = muiStyled((props: TypographyProps) => <Typography {...props} />)(() => ({
	display: 'flex',
	alignItems: 'center',
	fontSize: '.90rem',
}));

export const FilterAccordionDetails = muiStyled(MuiAccordionDetails)(() => ({}));

export const textFieldCSS = `
.MuiOutlinedInput-input {
	padding: 10.5px 14px;
}
.MuiInputLabel-outlined {
	transform: translate(14px, 12px) scale(1);

	&.MuiInputLabel-shrink {
		transform: translate(14px, -6px) scale(0.75);
	}
}
`;
