import {
	FormControl as MUIFormControl,
	FormControlLabel as MUIFormControlLabel,
	InputLabel as MUIInputLabel,
	MenuItem as MUIMenuItem,
	Radio as MUIRadio,
	RadioGroup as MUIRadioGroup,
	Select as MUISelect,
	TextField as MUITextField,
} from '@mui/material';
import { createContext, useContext } from 'react';
import { Controller, Path } from 'react-hook-form';
import * as rhf from 'react-hook-form';

import { PDFExportTemplate } from './types';

export type InputData = { id?: string; label?: string; disabled?: boolean; options?: { value; label }[] };
export type FormData<T> = Partial<{ [k in Path<T>]: InputData }>;

export type PDFExportInputData = FormData<PDFExportTemplate>;
export type PDFExportContext = FormData<PDFExportTemplate>;
const FormContext = createContext<FormData<unknown> | undefined>({});

const emptyObject = {};
export function FormProvider<T extends object>({
	children,
	data,
	...props
}: { children: JSX.Element; data?: FormData<T> } & rhf.UseFormReturn<T>) {
	return (
		<rhf.FormProvider {...props}>
			<FormContext.Provider value={data ?? emptyObject}>{children}</FormContext.Provider>
		</rhf.FormProvider>
	);
}

export function useForm<T extends object>(...args: Parameters<typeof rhf.useForm<T>>) {
	const results = rhf.useForm<T>(...args);
	return { ...results };
}

export function useFormContext<T extends object>(name: Path<T>) {
	const formData = rhf.useFormContext<T>();
	const { getFieldState, formState: _formState } = formData;
	const { [name]: data } = useContext(FormContext);
	const formState = getFieldState(name, _formState);
	const { disabled } = data as InputData;
	const inputData = {
		...data,
		error: disabled ? undefined : formState.error,
		helperText: disabled ? undefined : formState.error?.message,
	};
	return {
		...formData,
		formState,
		inputData: (inputData ?? {}) as InputData & { error?: boolean; helperText?: string },
	};
}

export function TextField<T extends object>({ name }: { name: Path<T> }) {
	const { control, inputData } = useFormContext<T>(name);
	return (
		<Controller control={control} name={name} render={({ field }) => <MUITextField {...inputData} {...field} />} />
	);
}

export function RadioGroup<T extends object>({ name, row }: { name: Path<T>; row?: boolean }) {
	const {
		control,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		inputData: { options = [], helperText, ...inputData },
	} = useFormContext<T>(name);
	return (
		<Controller
			control={control}
			name={name}
			render={({ field }) => (
				<MUIRadioGroup row={row} {...field} {...inputData}>
					{options?.map(({ value, label }) => (
						<MUIFormControlLabel
							disabled={inputData.disabled}
							key={value}
							control={<MUIRadio color='secondary' />}
							value={value}
							label={label}
						/>
					))}
				</MUIRadioGroup>
			)}
		/>
	);
}

export function Select<T extends object>({ name }: { name: Path<T> }) {
	const {
		control,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		inputData: { options = [], helperText, ...inputData },
	} = useFormContext<T>(name);
	const { id, label } = inputData;
	const labelId = id + '-label';
	return (
		<MUIFormControl sx={{ m: 1, minWidth: 120 }}>
			<MUIInputLabel id={labelId}>{label}</MUIInputLabel>
			<Controller
				name={name}
				control={control}
				rules={{ required: true }}
				render={({ field }) => (
					<MUISelect labelId={labelId} {...field} {...inputData}>
						{options.map(({ value, label }) => (
							<MUIMenuItem id={value} key={value} value={value}>
								{label}
							</MUIMenuItem>
						))}
					</MUISelect>
				)}
			/>
		</MUIFormControl>
	);
}
