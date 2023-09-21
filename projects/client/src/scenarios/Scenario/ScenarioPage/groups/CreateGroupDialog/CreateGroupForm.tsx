import { faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import {
	RHFCheckboxField as CheckboxField,
	FormGroup,
	Icon,
	RHFMultiSelectField as MultiSelectField,
	RHFSwitchField as SwitchField,
	RHFTextField as TextField,
} from '@/components/v2';
import { useWellHeaders } from '@/helpers/headers';
import { withHalfWidthStyles, withHiddenStyles, withSpacedStyles } from '@/helpers/styled';

import { stringHeaderTypes } from '../../constants';
import GroupPropertiesForm from '../GroupProperties';
import { textFieldProps } from '../GroupProperties/helpers';
import { GroupProperties } from '../GroupProperties/types';
import { createGroupFormDefaultConfiguration } from '../constants';
import { GroupConfiguration } from '../group-configurations/types';
import { CreateGroupProperties, GroupDialogMode } from './types';

export interface CreateGroupFormRef {
	handleSubmit;
	reset;
	getValues;
}

export interface CreateGroupFormProps {
	defaultConfiguration?: Omit<GroupConfiguration, '_id'>;
	onGroupFieldsChange?(groupName): void;
	mode: GroupDialogMode;
}

export const CreateGroupForm = forwardRef<CreateGroupFormRef, CreateGroupFormProps>(
	({ defaultConfiguration, onGroupFieldsChange, mode }, ref) => {
		const defaultFormData = useMemo(() => {
			return Object.keys(defaultConfiguration ?? {}).length
				? defaultConfiguration
				: createGroupFormDefaultConfiguration;
		}, [defaultConfiguration]);

		const methods = useForm({
			defaultValues: defaultFormData,
			mode: 'onChange',
		});

		const { control, handleSubmit, watch, getValues, reset } = methods;

		useImperativeHandle(ref, () => {
			return {
				handleSubmit,
				getValues,
				reset,
			};
		});

		const massCreateGroups = watch(CreateGroupProperties.massCreateGroups);
		const headerAsName = massCreateGroups && watch(CreateGroupProperties.headerAsName);

		const groupName = watch(CreateGroupProperties.groupName);
		const econLimit = watch(GroupProperties.econLimit);
		const allocationBasis = watch(GroupProperties.allocationBasis);
		const allocationMethod = watch(GroupProperties.allocationMethod);
		const allocationMethodType = watch(GroupProperties.allocationMethodType);
		const allocationProperties = watch(GroupProperties.allocationProperties);
		const allocationTiming = watch(GroupProperties.allocationTiming);
		const selectedHeaders = watch(CreateGroupProperties.headers);

		useEffect(() => {
			onGroupFieldsChange?.({
				groupName,
				econLimit,
				allocationBasis,
				allocationMethod,
				allocationMethodType,
				allocationProperties,
				allocationTiming,
				massCreateGroups,
				headerAsName,
				headers: selectedHeaders,
			});
		}, [
			groupName,
			econLimit,
			allocationBasis,
			allocationMethod,
			allocationMethodType,
			allocationProperties,
			allocationTiming,
			massCreateGroups,
			headerAsName,
			selectedHeaders,
			onGroupFieldsChange,
		]);

		const { wellHeadersLabels, wellHeadersTypes } = useWellHeaders();
		const headers = useMemo(
			() =>
				Object.entries(wellHeadersLabels)
					.filter(([key]) => stringHeaderTypes.includes(wellHeadersTypes[key].type))
					.map(([key, label]) => ({ value: key, label })),
			[wellHeadersLabels, wellHeadersTypes]
		);

		return (
			<FormProvider {...methods}>
				{mode === GroupDialogMode.create && (
					<FormGroup css={withHalfWidthStyles()}>
						<SwitchField
							control={control}
							name={CreateGroupProperties.massCreateGroups}
							label='Mass Create Groups'
						/>
					</FormGroup>
				)}
				<FormGroup css={withSpacedStyles({ horizontal: true })} row>
					<FormGroup css={withHalfWidthStyles()}>
						<TextField
							{...textFieldProps}
							control={control}
							name={CreateGroupProperties.groupName}
							label='Group Name'
							disabled={!!headerAsName}
							helperText={
								<span
									css={`
										display: flex;
										align-items: center;
										${withSpacedStyles({ horizontal: true, margin: 0.25 })}
										${withHiddenStyles(!massCreateGroups)}
									`}
								>
									<Icon fontSize='small'>{faInfoCircle}</Icon>
									<span>The name will have a suffix to identify all the groups</span>
								</span>
							}
						/>
						<CheckboxField
							css={withHiddenStyles(!massCreateGroups)}
							label='Assign Header Criteria as the Group Name'
							control={control}
							name={CreateGroupProperties.headerAsName}
						/>
					</FormGroup>
					<MultiSelectField
						css={`
							${withHalfWidthStyles()}
							${withHiddenStyles(!massCreateGroups)}
						`}
						{...textFieldProps}
						control={control}
						name={CreateGroupProperties.headers}
						menuItems={headers}
						label='Headers'
					/>
				</FormGroup>
				<GroupPropertiesForm />
			</FormProvider>
		);
	}
);

export default CreateGroupForm;
