import { memo, useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Box, RHFSelectField, RHFTextField, SwitchField, Typography } from '@/components/v2';

import { dumpJsonAsYaml, loadYaml } from '../data-flows/pipelines/DataPipeline.hooks';
import { PipelineForm } from './forms/PipelineForm';
import { makeState } from './forms/PipelineForm.hooks';

type DataPipelineFormProps = {
	readOnly: boolean;
	prefix: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	control: any;
	config: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getValues: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setEditorValue: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	templates: any;
};

export const DataPipelineForm: React.FC<DataPipelineFormProps> = memo(
	({ readOnly, config, templates, prefix, control, getValues, setEditorValue }) => {
		const snapshot = useWatch({ name: `${prefix}.snapshot`, control });
		const initialValues = useMemo(() => snapshot ?? makeState(loadYaml(config ?? '')), [config, snapshot]);

		const [checked, handleSwitch] = useState(false);

		useEffect(() => {
			if (config) {
				const state = makeState(loadYaml(config));
				setEditorValue(`${prefix}.configuration`)(state);
				setEditorValue(`${prefix}.snapshot`)(state);
			}
		}, [prefix, config, setEditorValue]);

		return (
			<Box>
				<Box sx={{ margin: '10px 0px' }}>
					<RHFTextField
						inputProps={{ readOnly }}
						fullWidth
						name={`${prefix}.name`}
						label='Name'
						control={control}
						required
						rules={{ required: true }}
					/>
				</Box>

				<Box sx={{ margin: '10px 0px' }}>
					<RHFTextField
						inputProps={{ readOnly }}
						fullWidth
						name={`${prefix}.description`}
						label='Description'
						control={control}
						rules={{}}
					/>
				</Box>

				<Box sx={{ margin: '10px 0px' }}>
					<Box sx={{ margin: '10px 0px' }}>
						<Typography data-testid='data-flow-title' variant='h5'>
							Configuration
						</Typography>
					</Box>

					<Box sx={{ margin: '10px 0px' }}>
						<RHFSelectField
							inputProps={{ readOnly }}
							control={control}
							name={`${prefix}.template`}
							label='Type'
							fullWidth
							menuItems={templates}
							required
							rules={{ required: true }}
						/>
						<SwitchField
							label='Show yaml'
							checked={checked}
							name='contents'
							onChange={() => {
								const currentConfig = getValues(`${prefix}.configuration`);
								if (checked) {
									const state = loadYaml(getValues(`${prefix}.codeConfiguration`));
									const mergedConfig = { ...currentConfig, ...state };
									setEditorValue(`${prefix}.configuration`)(mergedConfig);
									setEditorValue(`${prefix}.snapshot`)(mergedConfig);
								}
								if (!checked) {
									const state = makeState(loadYaml(getValues(`${prefix}.codeConfiguration`)));
									const mergedConfig = { ...state, ...currentConfig };
									setEditorValue(`${prefix}.codeConfiguration`)(dumpJsonAsYaml(mergedConfig));
								}

								return handleSwitch(!checked);
							}}
							inputProps={{ 'aria-label': 'controlled' }}
						/>
					</Box>

					<Box sx={{ margin: '10px 0px' }}>
						<PipelineForm
							showEditor={checked}
							setEditorValue={setEditorValue(`${prefix}.codeConfiguration`)}
							loadValues={() =>
								dumpJsonAsYaml(
									getValues(`${prefix}.configuration`) ?? makeState(loadYaml(config ?? ''))
								)
							}
							readOnly={readOnly}
							initialValues={initialValues}
							config={config ?? ''}
							prefix={`${prefix}.configuration`}
							updateValues={setEditorValue}
						/>
					</Box>
				</Box>
			</Box>
		);
	}
);
