import { useCallback, useState } from 'react';
import { useQuery } from 'react-query';

import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	FormGroup,
	ListItemText,
} from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';
import { useCurrentProject } from '@/projects/api';

import { formatUserInfo } from '../EconModelsList';
import { getModelsList } from '../shared';

export function getModelEmissionKey(projectId: string | undefined) {
	return ['assumptions', 'modelList', 'emission', projectId];
}

const EMISSION_LIMIT = 100;
export function useProjectEmissionModelsListQuery(project) {
	const key = getModelEmissionKey(project._id);
	return useQuery(key, () =>
		getModelsList({ assumptionKey: 'emission', project, listType: 'project', limit: EMISSION_LIMIT })
	);
}

export function AppendEmissionsDialog(props: DialogProps) {
	const { onHide, visible, resolve } = props;

	const { project } = useCurrentProject();

	const { data: emissionModelsList } = useProjectEmissionModelsListQuery(project);
	// NOTE: this only has the models that are loaded in the econ model, which is limited to 20
	// const emissionModelsList = econModelRef?.current?.loadedModelList;

	const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
	const handleSubmit = useCallback(() => {
		if (emissionModelsList) {
			const ret = emissionModelsList.filter((model) => selectedModelIds.includes(model._id));
			resolve(ret);
		}
	}, [resolve, selectedModelIds, emissionModelsList]);

	const handleChange = useCallback(
		(modelId) => {
			setSelectedModelIds((selectedModelIds) => {
				if (selectedModelIds.includes(modelId)) return selectedModelIds.filter((i) => i !== modelId);
				else return [...selectedModelIds, modelId];
			});
		},
		[setSelectedModelIds]
	);

	const isChecked = (modelId) => selectedModelIds.includes(modelId);

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='xs'>
			<DialogTitle>Select Emission Models</DialogTitle>
			<DialogContent
				css={`
					display: flex;
					flex-direction: column;
					gap: ${({ theme }) => theme.spacing(2)}px;
				`}
			>
				<FormGroup>
					{emissionModelsList &&
						emissionModelsList.map(({ name, createdBy, createdAt, _id }) => {
							return (
								<FormControlLabel
									key={_id}
									label={
										<ListItemText
											css={`
												flex: 1;
											`}
											primary={<span css='font-size: 1.25rem'>Name: {name}</span>}
											secondary={formatUserInfo(createdBy, createdAt)}
										/>
									}
									control={<Checkbox checked={isChecked(_id)} />}
									onChange={() => handleChange(_id)}
								/>
							);
						})}
				</FormGroup>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='secondary' variant='outlined' type='submit' onClick={handleSubmit}>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}
