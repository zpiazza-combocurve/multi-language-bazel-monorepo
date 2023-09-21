/**
 * @file Mui v5 + react-hook-from, similar to v2/react-hook-form-fields.tsx file
 * @note convention is to use `RHF` as a prefix for react-hook-form fields, eg withRHFControl(TextField) would be RHFTextField
 */

import TextField from '@mui/material/TextField';

import { withRHFControl } from '@/components/react-hook-form-helpers';

import { getMuiPropsFromRHFFieldState } from '../v2/react-hook-form-fields';

export const RHFTextField = withRHFControl(TextField, {
	getPropsFromFieldState: getMuiPropsFromRHFFieldState,
});
