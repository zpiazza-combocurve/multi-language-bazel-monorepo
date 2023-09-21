import { createTheme } from '@material-ui/core/styles';

import { withExtendedThemeProvider } from '@/helpers/theme';

export const CustomReportDialogTheme = withExtendedThemeProvider((p) =>
	createTheme({
		...p,
		props: {
			...p.props,
			MuiButton: { size: 'small' },
			MuiIconButton: { size: 'small' },
			MuiIcon: { fontSize: 'small' },
			MuiFab: { size: 'small' },
			MuiInput: { margin: 'dense' },
			MuiCheckbox: { size: 'medium' },
			MuiTextField: { variant: 'outlined', margin: 'dense' },
			MuiSelect: { variant: 'outlined', margin: 'dense' },
			MuiInputBase: { margin: 'dense' },
		},
	})
);
export default CustomReportDialogTheme;
