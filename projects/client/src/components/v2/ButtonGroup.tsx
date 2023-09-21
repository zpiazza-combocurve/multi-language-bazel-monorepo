import MUButtonGroup, { ButtonGroupProps as MUButtonGroupProps } from '@material-ui/core/ButtonGroup';
import { ComponentType } from 'react';

export type ButtonGroupProps = Omit<MUButtonGroupProps, 'color'> & { color?: MUButtonGroupProps['color'] | 'warning' };

const ButtonGroup = MUButtonGroup as ComponentType<ButtonGroupProps>;

export default ButtonGroup;
