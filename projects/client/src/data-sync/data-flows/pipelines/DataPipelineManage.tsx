import { useCallback } from 'react';

import { Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

import { MainButton } from '../../components/MainButton';
import { TextButton } from '../../components/TextButton';
import { dumpJsonAsYaml } from './DataPipeline.hooks';
import { FormValue, usePipelineForm } from './PipelineForm.hooks';
import { PipelineOverview } from './PipelineOverview';

interface DataPipelineManageModalProps extends DialogProps {
	className?: string;
	dataFlowId: string;
	type?: 'update' | 'create';
	item?: FormValue;
	refetch: () => void;
}

function DataPipelineManageModal(props: DataPipelineManageModalProps) {
	const { visible, dataFlowId, onHide, type = 'create', item, refetch } = props;
	const pipeline = item ? item : { parameters: dumpJsonAsYaml({}), steps: dumpJsonAsYaml([]) };
	const {
		form: {
			control,
			handleSubmit,
			getValues,
			setValue,
			formState: { isValid },
		},
		mutation,
	} = usePipelineForm({ ...pipeline, dataFlowId }, type, {
		refetch,
		onHide,
	});

	const setEditorValue = useCallback(
		(editorName) => (newValue, _ev) => {
			setValue(editorName, newValue, { shouldDirty: true });
		},
		[setValue]
	);

	const handleCreate = handleSubmit((values) => mutation.mutate(values));

	return (
		<Dialog fullWidth fullScreen open={visible} onClose={onHide}>
			<DialogTitle>
				<span style={{ textAlign: 'center', display: 'block' }}>
					{type === 'update' ? 'Update' : 'Create'} Data Pipeline
				</span>
			</DialogTitle>
			<DialogContent>
				<PipelineOverview
					readOnly={false}
					control={control}
					getValues={getValues}
					setEditorValue={setEditorValue}
				/>
			</DialogContent>

			<DialogActions>
				<TextButton onClick={onHide}>Cancel</TextButton>

				<MainButton onClick={handleCreate} disabled={!isValid || mutation.isLoading}>
					{type === 'update' ? 'Update' : 'Create'}
				</MainButton>
			</DialogActions>
		</Dialog>
	);
}

export default DataPipelineManageModal;
