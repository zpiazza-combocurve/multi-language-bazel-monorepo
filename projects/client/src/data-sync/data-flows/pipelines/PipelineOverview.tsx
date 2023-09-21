import { useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Box, RHFSelectField, RHFTextField, Tab, Tabs } from '@/components/v2';
import { DataPipelineForm } from '@/data-sync/components/DataPipelineForm';
import { Editor } from '@/data-sync/components/Editor';
import { TabPanel } from '@/data-sync/components/TabPanel';
import { useTemplate, useTemplates } from '@/data-sync/components/forms/PipelineForm.hooks';

import { a11yProps, useLoadDataType } from './DataPipeline.hooks';

export const PipelineOverview = ({ control, getValues, setEditorValue, readOnly = false }) => {
	const loadDataTypes = useLoadDataType();

	const [value, setVal] = useState(0);

	const handleChange = (_event, newValue: number) => {
		setVal(newValue);
	};

	const sourceTemplates = useTemplates('source', 'sourceDataSet');
	const targetTemplates = useTemplates('target', 'targetDataset');
	const sourceTemplate = useWatch({ name: `sourceDataSet.template`, control });
	const targetTemplate = useWatch({ name: `targetDataSet.template`, control });

	const sourceConfig = useTemplate('source', sourceTemplate);
	const targetConfig = useTemplate('target', targetTemplate);

	return (
		<Box sx={{ width: 900, margin: '0 auto' }}>
			<Box sx={{ margin: '10px 0px' }}>
				<RHFTextField
					fullWidth
					name='name'
					label='Name'
					control={control}
					required
					inputProps={{ readOnly }}
					rules={{ required: true }}
				/>
			</Box>

			<Box sx={{ margin: '10px 0px' }}>
				<RHFTextField
					inputProps={{ readOnly }}
					fullWidth
					name='description'
					label='Description'
					control={control}
				/>
			</Box>

			<Box sx={{ margin: '10px 0px' }}>
				<RHFTextField
					fullWidth
					name='order'
					label='Order'
					type='number'
					inputProps={{ readOnly }}
					control={control}
					required
					rules={{ required: true, max: 255, min: 0 }}
				/>
			</Box>

			<Box sx={{ margin: '10px 0px' }}>
				<RHFSelectField
					control={control}
					inputProps={{ readOnly }}
					name='loadDataTypeId'
					label='Data Load Type'
					fullWidth
					menuItems={loadDataTypes}
					required
					rules={{ required: true }}
				/>
			</Box>

			<Tabs value={value} onChange={handleChange} aria-label='basic tabs example'>
				<Tab label='Parameters' {...a11yProps(0)} />
				<Tab label='Steps' {...a11yProps(1)} />
				<Tab label='Source' {...a11yProps(2)} />
				<Tab label='Target' {...a11yProps(3)} />
			</Tabs>

			<TabPanel value={value} index={0}>
				{getValues('parameters') && (
					<Editor value={getValues('parameters')} setValue={setEditorValue('parameters')} />
				)}
			</TabPanel>

			<TabPanel value={value} index={1}>
				{getValues('steps') && <Editor value={getValues('steps')} setValue={setEditorValue('steps')} />}
			</TabPanel>

			<TabPanel value={value} index={2}>
				<Box sx={{ width: 900 }}>
					<DataPipelineForm
						readOnly={readOnly}
						prefix='sourceDataSet'
						config={sourceConfig}
						templates={sourceTemplates}
						control={control}
						getValues={getValues}
						setEditorValue={setEditorValue}
					/>
				</Box>
			</TabPanel>
			<TabPanel value={value} index={3}>
				<Box sx={{ width: 900 }}>
					<DataPipelineForm
						readOnly={readOnly}
						prefix='targetDataSet'
						config={targetConfig}
						templates={targetTemplates}
						control={control}
						getValues={getValues}
						setEditorValue={setEditorValue}
					/>
				</Box>
			</TabPanel>
		</Box>
	);
};
