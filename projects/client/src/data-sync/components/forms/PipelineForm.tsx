import FormTemplate from '@data-driven-forms/mui-component-mapper/form-template';
import SubForm from '@data-driven-forms/mui-component-mapper/sub-form';
import { FormRenderer } from '@data-driven-forms/react-form-renderer';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import { Grid } from '@material-ui/core';
import { memo, useMemo } from 'react';

import { Container } from '@/components/v2';
import { loadYaml } from '@/data-sync/data-flows/pipelines/DataPipeline.hooks';

import { Editor } from '../../components/Editor';
import { FCheckbox } from './FCheckbox';
import { FDatePicker } from './FDatePicker';
import { FJsonTextArea } from './FJsonTextArea';
import { FSelectField } from './FSelectField';
import { FTextArea } from './FTextArea';
import { FTextField } from './FTextField';
import { FormContext } from './FormContext';
import { generateSchema } from './PipelineForm.hooks';
import { TableForm } from './TableForm';

const componentMapper = {
	[componentTypes.DATE_PICKER]: FDatePicker,
	[componentTypes.TEXT_FIELD]: FTextField,
	[componentTypes.TEXTAREA]: FTextArea,
	[componentTypes.SUB_FORM]: SubForm,
	[componentTypes.SELECT]: FSelectField,
	[componentTypes.CHECKBOX]: FCheckbox,
	'json-component-type': FJsonTextArea,
	table: TableForm,
};

type PipelineFormProps = {
	readOnly?: boolean;
	prefix: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	initialValues: any;
	config: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	updateValues: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setEditorValue?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	loadValues?: any;
	showEditor?: boolean;
};

const FormWrapper = ({ children }) => (
	<Grid item>
		<form noValidate>
			<Grid container spacing={2}>
				{children}
			</Grid>
		</form>
	</Grid>
);

export const PipelineForm: React.FC<PipelineFormProps> = memo(
	({ readOnly, prefix, initialValues, loadValues, showEditor, setEditorValue, config, updateValues }) => {
		const schema = useMemo(() => {
			if (config) {
				const jsonConfig = loadYaml(config);
				return generateSchema(jsonConfig);
			}
			return { fields: [] };
		}, [config]);

		return (
			// eslint-disable-next-line react/jsx-no-constructed-context-values, @typescript-eslint/no-explicit-any -- TODO eslint fix later
			<FormContext.Provider value={{ updateValues, prefix } as any}>
				<Container>
					<Grid container spacing={3}>
						{!showEditor && (
							<FormRenderer
								readOnly={readOnly}
								onSubmit={updateValues}
								initialValues={initialValues}
								componentMapper={componentMapper}
								schema={schema}
								// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
								FormTemplate={(props) => (
									<FormTemplate {...props} showFormControls={false} FormWrapper={FormWrapper} />
								)}
							/>
						)}
						{showEditor && <Editor readOnly={readOnly} value={loadValues?.()} setValue={setEditorValue} />}
					</Grid>
				</Container>
			</FormContext.Provider>
		);
	}
);
