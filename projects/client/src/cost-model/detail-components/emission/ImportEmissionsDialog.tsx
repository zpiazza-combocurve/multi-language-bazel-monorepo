import { yupResolver } from '@hookform/resolvers/yup';
import _ from 'lodash';
import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import * as yup from 'yup';

import { EVENTS, useTrackAnalytics } from '@/analytics/useTrackAnalytics';
import {
	Autocomplete,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	RHFForm,
} from '@/components/v2';
import { warningAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { localize } from '@/helpers/i18n';
import {
	EMISSION_CATEGORY_LABEL,
	EmissionTableData,
	ImportEmissionDailogCategorySpecialOptions,
	ImportEmissionDialogValues,
} from '@/inpt-shared/econ-models/emissions';

import { useAllDisctintOptionsQuery, useImportEmissionMutation } from './api';

const OPTION_LOADING = 'Loading';

const ERROR_TOOLTIP = 'Please fix the warning on the form first!';

const formSchema = yup.object().shape({
	company: yup.string().required(),
	year: yup.string().required(),
	basin: yup.string().required(),
	category: yup.array().min(1),
});

function ImportEmissionsDialog(props: DialogProps<EmissionTableData>) {
	const { onHide, visible, resolve } = props;
	const allDistinctOptionsQuery = useAllDisctintOptionsQuery();

	const isLoading = allDistinctOptionsQuery.isLoading;

	const importEmissionMutation = useImportEmissionMutation();

	const form = useForm<ImportEmissionDialogValues>({
		defaultValues: {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			company: null!,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			year: null!,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			basin: null!,
			category: [ImportEmissionDailogCategorySpecialOptions.all],
		},
		reValidateMode: 'onChange',
		resolver: yupResolver(formSchema),
	});

	const track = useTrackAnalytics();

	const { handleSubmit: formSubmit, control } = form;
	const {
		formState: { errors },
	} = form;

	const watchedValues = useWatch({ name: ['company', 'year', 'basin', 'category'], control });
	const [company, year, basin, category] = watchedValues;

	const handleSubmit = async (values: ImportEmissionDialogValues) => {
		const data = await importEmissionMutation.mutateAsync(values);
		if (data.length === 0) {
			warningAlert(localize.emission.import.noData());
		}
		track(EVENTS.scenario.importEmissions, _.omit(values, ['category']));
		resolve(data);
	};

	const [companyOptions, yearOptions, basinOptions, categoryOptions] = useMemo(() => {
		if (!allDistinctOptionsQuery.data) {
			return [[OPTION_LOADING], [OPTION_LOADING], [OPTION_LOADING], [OPTION_LOADING]];
		}

		const canSkipCompanyCheck = !company;
		const canSkipYearCheck = !year;
		const canSkipBasinCheck = !basin;
		const canSkipCategoryCheck =
			!category.length || category.includes(ImportEmissionDailogCategorySpecialOptions.all);

		const companyOptionsSet = new Set<string>();
		const yearOptionsSet = new Set<string>();
		const basinOptionsSet = new Set<string>();
		const categoryOptionsSet = new Set<string>();

		allDistinctOptionsQuery.data.forEach(
			({ company: rowCompany, year: rowYear, basin: rowBasin, category: rowCategory }) => {
				const companyMatch = canSkipCompanyCheck || company === rowCompany;
				const yearMatch = canSkipYearCheck || year === rowYear;
				const basinMatch = canSkipBasinCheck || basin === rowBasin;
				const categoryMatch = canSkipCategoryCheck || category.includes(rowCategory);
				if (yearMatch && basinMatch && categoryMatch) {
					companyOptionsSet.add(rowCompany);
				}

				if (companyMatch && basinMatch && categoryMatch) {
					yearOptionsSet.add(rowYear);
				}

				if (companyMatch && yearMatch && categoryMatch) {
					basinOptionsSet.add(rowBasin);
				}

				if (companyMatch && yearMatch && basinMatch) {
					categoryOptionsSet.add(rowCategory);
				}
			}
		);
		return [
			Array.from(companyOptionsSet).filter(Boolean),
			Array.from(yearOptionsSet).filter(Boolean),
			Array.from(basinOptionsSet).filter(Boolean),
			Array.from(categoryOptionsSet).filter(Boolean),
		];
	}, [allDistinctOptionsQuery, company, year, basin, category]);

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='xs'>
			<RHFForm form={form} onSubmit={handleSubmit}>
				<DialogTitle>Choose EPA Report</DialogTitle>
				<DialogContent
					css={`
						display: flex;
						flex-direction: column;
						gap: ${({ theme }) => theme.spacing(2)}px;
					`}
				>
					<Autocomplete
						label='Year'
						value={year}
						options={yearOptions}
						renderOption={(option) => <li>{option}</li>}
						autoHighlight
						onChange={(_event, value) => {
							if (yearOptions?.includes(value) || !value) {
								form.setValue('year', value ?? null);
								// HACK: after trying all mode and revalidationMode provided by rhf, none of them works
								form.trigger('year');
							}
						}}
						error={!!errors.year}
						helperText={errors.year?.message}
					/>
					<Autocomplete
						label='Company'
						value={company}
						options={companyOptions}
						renderOption={(option) => <li>{option}</li>}
						autoHighlight
						onChange={(_event, value) => {
							if (companyOptions?.includes(value) || !value) {
								form.setValue('company', value ?? null);
								// HACK: after trying all mode and revalidationMode provided by rhf, none of them works
								form.trigger('company');
							}
						}}
						error={!!errors.company}
						helperText={errors.company?.message}
					/>
					<Autocomplete
						label='Basin'
						value={basin}
						options={basinOptions}
						renderOption={(option) => <li>{option}</li>}
						autoHighlight
						onChange={(_event, value) => {
							if (basinOptions?.includes(value) || !value) {
								form.setValue('basin', value ?? null);
								// HACK: after trying all mode and revalidationMode provided by rhf, none of them works
								form.trigger('basin');
							}
						}}
						error={!!errors.basin}
						helperText={errors.basin?.message}
					/>
					<Controller
						control={control}
						name='category'
						render={({ field: { onChange, value } }) => (
							<Autocomplete
								label='Category'
								onChange={(_ev, value) => {
									onChange(value);
									// HACK: after trying all mode and revalidationMode provided by rhf, none of them works
									form.trigger('category');
								}}
								value={value}
								//@ts-expect-error TODO: Check why this type is hardcoded to false
								multiple
								disableCloseOnSelect
								getOptionDisabled={(option) => option === OPTION_LOADING}
								renderOption={(category, { selected }) => (
									<>
										<Checkbox checked={selected} />
										{EMISSION_CATEGORY_LABEL[category] ?? category}
									</>
								)}
								getOptionLabel={(category) => EMISSION_CATEGORY_LABEL[category] ?? category}
								options={[ImportEmissionDailogCategorySpecialOptions.all, ...categoryOptions]}
								error={!!errors.category}
								helperText={errors.category?.message}
							/>
						)}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={onHide}>Cancel</Button>
					<Button
						color='secondary'
						variant='outlined'
						type='submit'
						disabled={
							isLoading || importEmissionMutation.isLoading || (!_.isEmpty(errors) && ERROR_TOOLTIP)
						}
						onClick={formSubmit(handleSubmit)}
					>
						Apply
					</Button>
				</DialogActions>
			</RHFForm>
		</Dialog>
	);
}

export default ImportEmissionsDialog;
