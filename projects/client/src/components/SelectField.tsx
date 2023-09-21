/**
 * <SelectField />
 * See react-md SelectField component: https://react-md.mlaursen.com/components/select-fields
 *
 * This wrapper aims to define in one place the default settings we use for select fields across the app to avoid
 * repetition and to keep consistency:
 *
 * - Set some default props
 * - Add `setFieldValue` for convenience using Formik
 *
 * We need to make sure we don't change the behavior or meaning of any prop described in the original documentation.
 */
import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { SelectField as MaterialSelectField } from 'react-md';
import styled, { css } from 'styled-components';

import { ifProp, theme } from '@/helpers/styled';

import { DEFAULT_ICON_SIZE, FontIcon } from './FontIcon';
import { withFakeId, withFormikField } from './shared';

const colored = (prop: string, value: string) => {
	const csscolor = css`
		color: ${value};
	`;
	// @ts-expect-error TODO findout why types are failing
	return css(({ [prop]: v }) => v && csscolor);
};

const LIST_CLASS_NAME = '_inpt-select-field-list-class-name';
const TEXT_CLASS_NAME = '_inpt-select-field-text-class-name';

/** @deprecated Use material-ui */
export const StyledSelectField = styled(MaterialSelectField).attrs<{
	$primary?: boolean;
	$secondary?: boolean;
	bigger?: boolean;
	smaller?: boolean;
}>(({ $primary, $secondary, bigger, smaller, ...props }) => {
	let forcedIconSize = DEFAULT_ICON_SIZE;
	if (smaller) {
		forcedIconSize = DEFAULT_ICON_SIZE * 0.8;
	}
	if (bigger) {
		forcedIconSize = DEFAULT_ICON_SIZE * 1.2;
	}

	return {
		bigger,
		dropdownIcon: (
			<FontIcon small rightIcon inherit primary={$primary} secondary={$secondary} forceSize={forcedIconSize}>
				{faChevronDown}
			</FontIcon>
		),
		lineDirection: 'center',
		listClassName: LIST_CLASS_NAME,
		position: MaterialSelectField.Positions.BELOW,
		simplifiedMenu: true,
		smaller,
		stripActiveItem: false,
		toggleClassName: TEXT_CLASS_NAME,
		...props,
	};
})`
	flex-grow: 0;
	.${LIST_CLASS_NAME} {
		padding-top: 0 !important;
		padding-bottom: 0 !important;
	}
	.${TEXT_CLASS_NAME} {
		span {
			${colored('primary', theme.primaryColor)}
			${colored('secondary', theme.secondaryColor)}
			${ifProp('bigger', 'font-size: 1.2rem;')}
			${ifProp('smaller', 'font-size: 0.8rem;')}
			${ifProp('fullWidth', 'flex-grow: 1;')}
		}
	}
`;

const SelectFieldCompoment = withFakeId(withFormikField(StyledSelectField));
/** @deprecated Use material-ui */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
// @ts-expect-error
export const SelectField: typeof SelectFieldCompoment & { Positions: typeof MaterialSelectField.Positions } =
	SelectFieldCompoment;

SelectField.Positions = MaterialSelectField.Positions;
