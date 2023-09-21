import Select from 'react-select';
import styled from 'styled-components';

const SELECT_CLASSNAME = 'select-editor';

const SELECT = {
	container: SELECT_CLASSNAME,
	control: `${SELECT_CLASSNAME}__control`,
	valueContainer: `${SELECT_CLASSNAME}__value-container`,
	indicators: `${SELECT_CLASSNAME}__indicators`,
	menu: `${SELECT_CLASSNAME}__menu`,
	menuList: `${SELECT_CLASSNAME}__menu-list`,
	option: `${SELECT_CLASSNAME}__option`,
	optionFocused: `${SELECT_CLASSNAME}__option--is-focused`,
	indicator: `${SELECT_CLASSNAME}__indicator`,
	input: `${SELECT_CLASSNAME}__input`,
	singleValue: `${SELECT_CLASSNAME}__single-value`,
};

const ReactSelect = styled(Select).attrs({
	className: SELECT_CLASSNAME,
	classNamePrefix: SELECT_CLASSNAME,
	autofocus: true,
	closeMenuOnSelect: true,
	closeMenuOnScroll: true,
	menuIsOpen: true,
})`
	.${SELECT.control}, .${SELECT.menu} {
		background: ${({ theme }) => theme.palette.background.default};
	}
	.${SELECT.control} {
		min-height: 30px;
		border: none;
		background: ${({ theme }) => theme.palette.background.default};
		border: 1px double rgb(33, 133, 208);
		border-radius: 0;

		.${SELECT.input}, .${SELECT.singleValue} {
			color: ${({ theme }) => theme.palette.text.primary};
		}
		.${SELECT.valueContainer} {
			padding: 0;
		}

		.${SELECT.indicators} {
			.${SELECT.indicator} {
				padding: 4px;
			}
		}
	}
	.${SELECT.menu} {
		box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.4); // TODO: move to shared
		width: auto;
		.${SELECT.option} {
			cursor: pointer;
			background: ${({ theme }) => theme.palette.background.default};
			color: ${({ theme }) => theme.palette.text.secondary};
			&.${SELECT.optionFocused} {
				background: ${({ theme }) => theme.palette.action.hover};
			}
		}
	}
`;

/** @deprecated Use mui components */
export default ReactSelect;
