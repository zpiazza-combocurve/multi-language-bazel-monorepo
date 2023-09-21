/**
 * <Divider />
 * See react-md Divider component: https://react-md.mlaursen.com/components/dividers
 *
 * This wrapper aims to define in one place the default settings we use for dividers across the app to avoid repetition
 * and to keep consistency:
 *
 * - Set some default props
 *
 * We need to make sure we don't change the behavior or meaning of any prop described in the original documentation.
 */
import classNames from 'classnames';
import { DividerProps, Divider as MaterialDivider } from 'react-md';

/** @deprecated Use material-ui */
export function Divider(props: DividerProps) {
	const { className } = props;
	return <MaterialDivider {...props} className={classNames(className, 'inpt-divider')} />;
}
