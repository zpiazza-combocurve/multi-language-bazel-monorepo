import './ag-grid-modules-themes.scss';

import { AgGridReact, AgGridReactProps, AgReactUiProps } from '@ag-grid-community/react';
import { LicenseManager } from '@ag-grid-enterprise/core';
import Box, { BoxProps } from '@mui/material/Box';
import classNames from 'classnames';

import { AG_GRID_LICENSE_KEY } from '@/helpers/ag-grid-license';
import { useAlfa } from '@/helpers/alfa';
import { Theme } from '@/helpers/theme';

LicenseManager.setLicenseKey(AG_GRID_LICENSE_KEY);

export type ThemedAgGridProps<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- keeping any to maintain compatibility with ag-grid
	TData = any
> = (AgGridReactProps<TData> | AgReactUiProps<TData>) & {
	sx?: BoxProps['sx'];
	className?: string;
	agGridReactRef?: React.Ref<AgGridReact>;
};

/**
 * V30+ themed ag grid component
 *
 * - Support mui sx prop
 * - Ref provided by agGridReactRef
 *
 * @note uses ag-grid modules https://www.ag-grid.com/react-data-grid/modules/
 * @note keep changes to minimum
 */

export default function ThemedAgGrid<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	TData = any
>(props: ThemedAgGridProps<TData>) {
	const { sx, className, agGridReactRef, ...agGridProps } = props;

	const { theme } = useAlfa(['theme']);

	return (
		<Box sx={sx} className={classNames(className, 'cc-ag-grid-modules')}>
			<Box
				sx={{ width: '100%', height: '100%' }}
				className={classNames(theme === Theme.dark ? 'ag-theme-alpine-dark' : 'ag-theme-alpine', 'ag-theme-cc')}
			>
				<AgGridReact ref={agGridReactRef} {...agGridProps} />
			</Box>
		</Box>
	);
}
