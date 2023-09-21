import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';

import {
	Box,
	RHFCheckboxField,
	RHFRadioGroupField,
	RHFReactDatePicker,
	RHFSelectField,
	Typography,
} from '@/components/v2';
import {
	dataResolutionOptions,
	forecastSegmentEndingCondition,
	forecastUnits,
	toLifeOptions,
	wellIdKeyOptions,
} from '@/scenarios/Scenario/ScenarioPage/exports/ExportToAriesDialog';

const FormContainer = styled(Box)`
	display: flex;
	flex: 1 0 0;
	flex-direction: column;
	gap: 0.5rem;
	align-items: flex-start;
`;

const HFormContainer = styled(Box)`
	display: flex;
	flex: 1 0 0;
	gap: 1.5rem;
	align-items: flex-start;
`;

const HContainer = styled(Box)`
	display: flex;
	align-items: flex-start;
	gap: 1.5rem;
	flex: 1 0 0;
	align-self: stretch;
`;

const VContainer = styled(Box)`
	display: flex;
	align-items: flex-start;
	flex-direction: column;
	gap: 1.5rem;
	flex: 1 0 0;
	align-self: stretch;
`;

const orientationUnits = [
	{ value: 'landscape', label: 'Landscape' },
	{ value: 'portrait', label: 'Portrait' },
];

const formatUnits = [
	{ value: 'pdf', label: 'PDF' },
	{ value: 'pptx', label: 'PPTX' },
];

export const ChartExportsFormV2 = () => {
	const { control, watch } = useFormContext<Record<string, string>>();

	const [ariesEnable] = watch(['aries.include']);

	return (
		<Box>
			<VContainer>
				<HContainer>
					<FormContainer>
						<Typography>Document Type</Typography>

						<FormContainer>
							<RHFRadioGroupField name='documentFormat' control={control} options={formatUnits} />
						</FormContainer>
					</FormContainer>

					<FormContainer>
						<Typography>Format</Typography>

						<FormContainer>
							<RHFRadioGroupField name='orientation' control={control} options={orientationUnits} />
						</FormContainer>
					</FormContainer>
				</HContainer>

				<HContainer>
					<FormContainer>
						<Typography>Parameters</Typography>

						<HFormContainer>
							<FormContainer>
								<RHFCheckboxField
									name='includeCompare'
									control={control}
									label='Include Comparison Forecast'
								/>
								<RHFCheckboxField
									name='includeParameters'
									control={control}
									label='Include Forecast Output Parameters'
								/>
							</FormContainer>

							<FormContainer>
								<RHFCheckboxField
									name='aries.include'
									label='Include ARIES Forecast Parameters'
									control={control}
								/>
								<RHFCheckboxField name='includeComments' control={control} label='Include Comments' />
							</FormContainer>
						</HFormContainer>
					</FormContainer>
				</HContainer>

				{ariesEnable && (
					<FormContainer width='100%'>
						<HContainer alignItems='center'>
							<FormContainer>
								<Typography>ARIES Settings</Typography>

								<FormContainer width='100%'>
									<RHFReactDatePicker
										control={control}
										name='aries.startDate'
										label='Start Date'
										css={`
											.MuiFormControl-root {
												width: 100%;
											}
										`}
									/>
								</FormContainer>
							</FormContainer>
							<FormContainer marginTop='1.9rem'>
								<RHFSelectField
									control={control}
									label='Well Identifier'
									name='aries.selectedIdKey'
									menuItems={wellIdKeyOptions}
									fullWidth
									required
								/>
							</FormContainer>
						</HContainer>
						<HContainer>
							<RHFCheckboxField
								name='aries.includeOriginalForecast'
								label='Include Original Forecast (Ignore Start Date)'
								control={control}
							/>
						</HContainer>

						<HContainer marginTop='1.5rem'>
							<FormContainer>
								<RHFSelectField
									control={control}
									label='Forecast Unit'
									name='aries.forecastUnit'
									menuItems={forecastUnits}
									fullWidth
									required
								/>
							</FormContainer>

							<FormContainer>
								<RHFSelectField
									control={control}
									label='Segment Ending Condition'
									name='aries.endingConditions'
									menuItems={forecastSegmentEndingCondition}
									fullWidth
									required
								/>
							</FormContainer>
						</HContainer>
						<HContainer marginTop='1.5rem'>
							<FormContainer>
								<RHFSelectField
									control={control}
									label='Forecast Non Major Segment to Life'
									name='aries.toLife'
									menuItems={toLifeOptions}
									fullWidth
									required
								/>
							</FormContainer>

							<FormContainer>
								<RHFSelectField
									control={control}
									label='Data Resolution'
									name='aries.dataResolution'
									menuItems={dataResolutionOptions}
									fullWidth
									required
								/>
							</FormContainer>
						</HContainer>
					</FormContainer>
				)}
			</VContainer>
		</Box>
	);
};
