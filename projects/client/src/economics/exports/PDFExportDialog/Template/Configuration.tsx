import { Accordion, AccordionDetails, AccordionSummary } from '@material-ui/core';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import _ from 'lodash';
import { useFormContext } from 'react-hook-form';

import { SelectedOption } from '@/economics/exports/CSVExportDialog/';
import { assert } from '@/helpers/utilities';

import { Option, PDFExportTemplate, PDFOptionKeyTypes, PDFOptionTypes } from '../shared/types';
import DiscountType from './Configuration/DiscountType';
import DisplayedItemSelector from './Configuration/DisplayedItemSelector';
import { useAccordionsData } from './Configuration/useAccordionsData';

const StyledAccordionDetails = styled(AccordionDetails)({
	width: '100%',
	display: 'block',
	'&> div': {
		width: '100%',
	},
	boxShadow: 'none',
});

const ConfigurationWrapper = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	flexWrap: 'wrap',
	gap: '1rem',
	'&> div': {
		width: '100%',
	},
});

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
	backgroundColor: theme.palette.grey['800'],
	borderRadius: theme.shape.borderRadius,
	borderWidth: 0,
	padding: '1rem',
	'& h4': {
		margin: 0,
	},
	'&> div': {
		margin: 0,
		'&.Mui-expanded': {
			margin: 0,
		},
	},
}));

export const Configuration = () => {
	const { getValues, setValue } = useFormContext<PDFExportTemplate>();

	const accordionsData = useAccordionsData();

	const accordionsKeys = Object.keys(accordionsData);
	const handleOptionClick = (keyToChange: string, templateKey: string, isDisabled?: boolean) => {
		const templateKeyType = templateKey as PDFOptionKeyTypes;
		return () => {
			if (isDisabled) return;
			const allOptions = accordionsData[templateKeyType].options;
			const currentOptions = getValues(templateKeyType);
			const isOptionSelected = !!_.find(currentOptions, { key: keyToChange });

			function getNewValues(): Option[] {
				if (isOptionSelected) return _.reject(currentOptions, { key: keyToChange });
				const itemToAdd = _.find(allOptions, { key: keyToChange });
				assert(itemToAdd);
				return [...currentOptions, itemToAdd];
			}

			setValue(templateKeyType, getNewValues());
		};
	};

	const handleSort = (keyType: string) => {
		const templateKeyType = keyType as PDFOptionKeyTypes;
		return (changedItems: SelectedOption[]) => {
			setValue(templateKeyType, changedItems as Option[]);
		};
	};

	const handleDeleteItem = (key: string, keyType: string) => {
		const templateKey = keyType as PDFOptionKeyTypes;
		setValue(
			templateKey,
			getValues(templateKey).filter((item) => item.key !== key)
		);
	};

	return (
		<ConfigurationWrapper>
			{accordionsKeys.map((key) => (
				<Accordion key={`accordion-${key}`}>
					<StyledAccordionSummary expandIcon={<ExpandMoreIcon />} id={`accordion-summary-${key}`}>
						<h4>{accordionsData[key].title}</h4>
					</StyledAccordionSummary>
					<StyledAccordionDetails>
						<DisplayedItemSelector
							type={key}
							placeholder={accordionsData[key].placeholder}
							options={accordionsData[key].options}
							onOptionClick={handleOptionClick}
							items={accordionsData[key].items}
							onDeleteItem={handleDeleteItem}
							onSort={handleSort}
							selectedItemsLimit={accordionsData[key].selectedItemsLimit}
						>
							{key === PDFOptionTypes.DISC_CASHFLOW ? <DiscountType /> : null}
						</DisplayedItemSelector>
					</StyledAccordionDetails>
				</Accordion>
			))}
		</ConfigurationWrapper>
	);
};

export default Configuration;
