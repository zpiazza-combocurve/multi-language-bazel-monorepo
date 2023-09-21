import { get, set, transform } from 'lodash-es';
import { memo, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import {
	Box,
	Button,
	Checkbox,
	CheckboxField,
	Container,
	FormControl,
	FormLabel,
	MenuItem,
	ReactDatePicker,
	TextField,
} from '@/components/v2';
import { wellLifeMethodOptions } from '@/forecasts/forecast-form/PhaseForm';
import { withLoadingBar } from '@/helpers/alerts';
import { getApi, postApi } from '@/helpers/routing';
import { titleize } from '@/helpers/text';

/** Values to show in the form, taken from `inpt-shared/display-templates/forecast/forecast_form.json` */
const FIELDS_RECORD = {
	D_lim_eff: {
		type: 'number',
		label: 'D Sw-Eff-Sec (%)',
		name: 'D_lim_eff',
		default: 8,
		min: 0.01,
		max: 99.9,
		invalid: [],
		conversion: {
			operation: 'divide',
			value: 100,
		},
	},
	enforce_sw: {
		type: 'boolean',
		label: 'Enforce Switch',
		name: 'enforce_sw',
		default: true,
	},
	'well_life_dict.well_life_method': {
		name: 'well_life_dict.well_life_method',
		label: 'Well Life',
		type: 'select',
		default: 'fixed_date',
		menuItems: wellLifeMethodOptions,
	},
	'well_life_dict.fixed_date': {
		name: 'well_life_dict.fixed_date',
		label: 'Fixed Date',
		type: 'date',
		default: new Date(),
	},
	'well_life_dict.num': {
		name: 'well_life_dict.num',
		label: 'Years',
		type: 'number',
		min: 1,
		default: 60,
	},
	q_final: {
		name: 'q_final',
		label: 'q Final',
		type: 'number',
		min: 0,
		compact: false,
		default: 0,
	},
};

const Field = memo(
	({
		updateData,
		fieldName,
		phase,
		disableEnforce,
		enforce,
		value,
		isSavingOrLoading,
	}: {
		updateData: (fieldName, value, key) => void;
		fieldName: string;
		phase: string;
		disableEnforce?: boolean;
		enforce: boolean;
		value;
		isSavingOrLoading: boolean;
	}) => {
		const { type, name, label, menuItems } = FIELDS_RECORD[fieldName];

		const enforced = enforce;

		const onNumberTextFieldChange = (fieldName, val, key) => {
			return updateData(fieldName, val ? parseInt(val) : val, key);
		};

		const fieldElement = (() => {
			const textFieldProps = {
				name: `values.${phase}.${name}`,
				label,
				disabled: !enforced || isSavingOrLoading,
				variant: 'outlined' as const,
				size: 'small' as const,
				fullWidth: true,
				onChange: (ev) => updateData(fieldName, ev.target.value, 'values'),
			};
			if (type === 'select') {
				return (
					<TextField {...textFieldProps} select value={value}>
						{menuItems.map(({ label: menuItemLabel, value }) => (
							<MenuItem key={value} value={value}>
								{menuItemLabel}
							</MenuItem>
						))}
					</TextField>
				);
			}
			if (type === 'number') {
				return (
					<TextField
						{...textFieldProps}
						type='number'
						value={value}
						debounce
						onChange={(ev) => onNumberTextFieldChange(fieldName, ev.target.value, 'values')}
					/>
				);
			}
			if (type === 'date') {
				return (
					<ReactDatePicker
						{...textFieldProps}
						selected={value}
						onChange={(e) => {
							updateData(fieldName, e, 'values');
						}}
					/>
				);
			}
			if (type === 'boolean') {
				return (
					<CheckboxField
						name={`values.${phase}.${name}`}
						label={label}
						disabled={isSavingOrLoading || !enforce}
						labelPlacement='start'
						value={value}
						checked={value}
						onChange={() => updateData(fieldName, !value, 'values')}
					/>
				);
			}
			return null;
		})();

		return (
			<Box key={name} display='flex' mb={2}>
				<Checkbox
					name={`enforce.${phase}.${name}`}
					disabled={disableEnforce || isSavingOrLoading}
					size='small'
					value={enforce}
					checked={enforce}
					onChange={() => {
						updateData(fieldName, !enforce, 'enforce');
					}}
				/>
				{fieldElement}
			</Box>
		);
	}
);

function PhaseForm({ phase, dataValues, dataEnforce, updateData, isSavingOrLoading }) {
	// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
	if (!dataValues || !dataEnforce) return <></>;
	const fixedDateFieldName =
		dataValues.well_life_dict.well_life_method === 'fixed_date'
			? 'well_life_dict.fixed_date'
			: 'well_life_dict.num';
	const fixedDateEnforce = dataValues.well_life_dict.well_life_method === 'fixed_date' ? 'fixed_date' : 'num';

	return (
		<Box my={3}>
			<h2>{titleize(phase)}</h2>
			<Field
				fieldName='D_lim_eff'
				phase={phase}
				enforce={dataEnforce['D_lim_eff']}
				updateData={(fieldName, val, key) => {
					updateData(fieldName, val, key);
				}}
				isSavingOrLoading={isSavingOrLoading}
				value={dataValues['D_lim_eff']}
			/>
			<Field
				fieldName='enforce_sw'
				phase={phase}
				enforce={dataEnforce['enforce_sw']}
				updateData={(fieldName, val, key) => {
					updateData(fieldName, val, key);
				}}
				isSavingOrLoading={isSavingOrLoading}
				value={dataValues['enforce_sw']}
			/>
			<FormControl component='fieldset'>
				<Box mb={1} clone>
					<FormLabel component='legend'>Well Life</FormLabel>
				</Box>
				<Field
					fieldName='q_final'
					phase={phase}
					value={dataValues['q_final']}
					enforce={dataEnforce['q_final']}
					updateData={(fieldName, val, key) => {
						updateData(fieldName, val, key);
					}}
					isSavingOrLoading={isSavingOrLoading}
				/>
				<Field
					fieldName='well_life_dict.well_life_method'
					phase={phase}
					value={dataValues.well_life_dict.well_life_method}
					enforce={dataEnforce.well_life_dict.well_life_method}
					updateData={(fieldName, val, key) => {
						updateData(fieldName, val, key);
					}}
					isSavingOrLoading={isSavingOrLoading}
				/>
				<Field
					fieldName={fixedDateFieldName}
					phase={phase}
					value={dataValues.well_life_dict[fixedDateEnforce]}
					enforce={dataEnforce.well_life_dict[fixedDateEnforce]}
					updateData={(fieldName, val, key) => {
						updateData(fieldName, val, key);
					}}
					isSavingOrLoading={isSavingOrLoading}
					disableEnforce
				/>
			</FormControl>
		</Box>
	);
}

const PHASES = ['shared', 'oil', 'gas', 'water'];

/**
 * Ensure form state is correct:
 *
 * - Well life subfields will be enforced if well life is enforced
 *
 * @param values Note the objected passed will be mutated, clone it or wrap it with immer to avoid side effects
 */
function postFormChange(values) {
	PHASES.forEach((phase) => {
		if (values.enforce[phase].well_life_dict.well_life_method) {
			// if enforcing the well life option, enforce the suboptions, but only the one that is selected
			if (values.values[phase].well_life_dict.well_life_method === 'fixed_date') {
				values.enforce[phase].well_life_dict.fixed_date = true;
				values.enforce[phase].well_life_dict.num = false;
			} else {
				values.enforce[phase].well_life_dict.fixed_date = false;
				values.enforce[phase].well_life_dict.num = true;
			}
		} else {
			// if not enforcing well life don't enforce any of the suboptions
			values.enforce[phase].well_life_dict.fixed_date = false;
			values.enforce[phase].well_life_dict.num = false;
		}
	});
}
/** Transforms settings from form like state to db state */
function fromFormState(formValues) {
	return transform(
		FIELDS_RECORD,
		(acc, { name }) => {
			PHASES.forEach((phase) => {
				const path = `${phase}.${name}`;
				// send only enforced values
				if (get(formValues.enforce, path)) {
					set(acc, path, get(formValues.values, path));
				}
			});
		},
		{}
	);
}
/** Transform settings from db state to form state */
function toFormState(settings = {}) {
	const result = transform(
		PHASES,
		(acc, phase) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			acc.values[phase] = {} as any;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			acc.enforce[phase] = {} as any;
			Object.values(FIELDS_RECORD).forEach(({ name, default: defaultValue, type }) => {
				const path = `${phase}.${name}`;
				let value = get(settings, path);
				if (value !== undefined && type === 'date') {
					value = new Date(get(settings, path));
				}
				set(acc.values, path, value ?? defaultValue);
				set(acc.enforce, path, value !== undefined);
			});
			// well life fields are always
		},
		{ enforce: {}, values: {} }
	);
	postFormChange(result);
	return result;
}

interface ForecastSettings {
	settings;
}

export function ForecastConfiguration() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [data, setData] = useState<any>();
	const [saving, setSaving] = useState(false);

	const { isLoading, data: settingsData } = useQuery(['company-configuration', 'forecast'], () =>
		getApi<ForecastSettings | undefined>('/company-forecast-settings')
	);

	const configurationData = useMemo(() => toFormState(settingsData?.settings), [settingsData]);

	useEffect(() => {
		if (configurationData) {
			setData(configurationData);
		}
	}, [configurationData]);

	const { canUpdate: canUpdateCompanyForecastSettings } = usePermissions(SUBJECTS.CompanyForecastSettings, null);

	const updateDataValue = (phase, fieldName, val, key) => {
		const split = fieldName.split('.');
		let newData;
		if (split.length > 1) {
			newData = {
				...data,
				[key]: {
					...data[key],
					[phase]: {
						...data[key][phase],
						well_life_dict: {
							...data[key][phase].well_life_dict,
							[split[1]]: val,
						},
					},
				},
			};
		} else {
			newData = {
				...data,
				[key]: {
					...data[key],
					[phase]: {
						...data[key][phase],
						[fieldName]: val,
					},
				},
			};
		}
		postFormChange(newData);
		setData(newData);
	};

	return (
		<Container>
			<FormControl>
				<Box
					display='flex'
					flexDirection='row'
					css={`
						& > *:not(:first-child) {
							margin-left: 3rem;
						}
					`}
				>
					{PHASES.map((phase) => (
						<PhaseForm
							key={phase}
							phase={phase}
							dataValues={data ? data?.values[phase] : undefined}
							dataEnforce={data ? data?.enforce[phase] : undefined}
							updateData={(fieldName, value, key) => updateDataValue(phase, fieldName, value, key)}
							isSavingOrLoading={saving || isLoading}
						/>
					))}
				</Box>
				<Button
					variant='contained'
					color='primary'
					type='submit'
					css={`
						width: 64px;
					`}
					disabled={(!canUpdateCompanyForecastSettings && PERMISSIONS_TOOLTIP_MESSAGE) || saving || isLoading}
					onClick={async () => {
						if (canUpdateCompanyForecastSettings) {
							setSaving(true);
							await withLoadingBar(
								postApi('/company-forecast-settings', { settings: fromFormState(data) }),
								'Forecast Configuration Saved Successfully'
							);
							setSaving(false);
						}
					}}
				>
					Save
				</Button>
			</FormControl>
		</Container>
	);
}
