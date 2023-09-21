import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { FormGroup, FormLabel, Typography } from '@/components/v2';
import { withHalfWidthStyles, withSpacedStyles } from '@/helpers/styled';

import { ControlContext, RadioGroupField, SelectField } from './GroupProperties/helpers';
import { GroupProperties, GroupPropertiesFormData } from './GroupProperties/types';

/**
 * @example
 * 	import { useForm } from 'react-hook-form';
 * 	import GroupPropertiesForm, { GroupProperties } from './GroupProperties';
 *
 * 	const { control } = useForm({
 * 		defaultValues: {
 * 			properties: {
 * 				econLimit: '',
 * 				allocation: {
 * 					timing: '',
 * 					properties: '',
 * 					basis: '',
 * 					method: '',
 * 				},
 * 				exclusion: {
 * 					volumnOptions: '',
 * 					clashFlow: '',
 * 					group: '',
 * 				},
 * 			},
 * 		},
 * 		mode: 'onChange',
 * 	});
 *
 * 	return <GroupPropertiesForm control={control} />;
 */
export function GroupPropertiesForm() {
	const { watch, control, resetField } = useFormContext<GroupPropertiesFormData>();
	const allocationProperties = watch(GroupProperties.allocationProperties);
	const areAllocationFieldsDisabled = allocationProperties === 'none';

	useEffect(() => {
		if (areAllocationFieldsDisabled) {
			resetField(GroupProperties.allocationBasis);
			resetField(GroupProperties.allocationMethod);
			resetField(GroupProperties.allocationMethodType);
			resetField(GroupProperties.allocationTiming);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [areAllocationFieldsDisabled]);

	return (
		<ControlContext.Provider value={control}>
			<FormGroup css={withSpacedStyles()}>
				<FormLabel component='legend'>
					<Typography variant='h5'>Group Properties</Typography>
				</FormLabel>
				<FormGroup css={withSpacedStyles({ horizontal: true })} row>
					<SelectField css={withHalfWidthStyles()} name={GroupProperties.econLimit} />
				</FormGroup>
				<FormGroup css={withSpacedStyles({ horizontal: false })}>
					<FormLabel component='legend'>
						<Typography variant='h6'>Allocation Properties</Typography>
					</FormLabel>
					<FormGroup css={withSpacedStyles({ horizontal: true })} row>
						<FormGroup css={withHalfWidthStyles()}>
							<RadioGroupField name={GroupProperties.allocationProperties} />
						</FormGroup>
						<FormGroup css={withHalfWidthStyles()}>
							<RadioGroupField
								disabled={areAllocationFieldsDisabled}
								name={GroupProperties.allocationMethodType}
							/>
						</FormGroup>
					</FormGroup>
					<FormGroup css={withSpacedStyles({ horizontal: true })} row>
						<FormGroup css={withHalfWidthStyles()}>
							<RadioGroupField
								disabled={areAllocationFieldsDisabled}
								name={GroupProperties.allocationBasis}
							/>
						</FormGroup>
						<FormGroup css={withHalfWidthStyles()}>
							<FormGroup css={withSpacedStyles()}>
								<SelectField
									disabled={areAllocationFieldsDisabled}
									name={GroupProperties.allocationMethod}
								/>
								<SelectField
									disabled={areAllocationFieldsDisabled}
									name={GroupProperties.allocationTiming}
								/>
							</FormGroup>
						</FormGroup>
					</FormGroup>
				</FormGroup>
			</FormGroup>
		</ControlContext.Provider>
	);
}

export default GroupPropertiesForm;
