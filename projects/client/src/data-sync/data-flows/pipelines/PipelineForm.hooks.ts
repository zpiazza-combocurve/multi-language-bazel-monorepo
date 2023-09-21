import { omit } from 'lodash-es';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';

import { useDataSourceTypes } from '@/data-sync/data-sources/DataSource.hooks';
import { confirmationAlert } from '@/helpers/alerts';
import { postApi, putApi } from '@/helpers/routing';
import { Item } from '@/module-list/types';

import { dumpJsonAsYaml, loadYaml, useDataDirections } from './DataPipeline.hooks';

export type DataPipelineItem = Assign<Item, Inpt.DataPipeline>;
export type DataSet = Assign<Item, Inpt.DataSet>;

export type FormValue = DataPipelineItem & {
	order: string;
	sourceDataSet?: DataSet & { template: string };
	targetDataSet?: DataSet & { template: string };
};

const getConfiguration = (values, prefix) => {
	const sourceTemplate = values[prefix].template;
	let configuration: Record<string, string>;
	if (sourceTemplate === 'other') {
		configuration = loadYaml(values[prefix].codeConfiguration);
	} else {
		configuration = values[prefix].configuration;
	}
	return configuration;
};

const buildDataSet = (values, prefix) => {
	return omit(values[prefix], ['configuration', 'codeConfiguration', 'template']);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const usePipelineForm = (item: any, type: string, { onHide, refetch }: any) => {
	const { dataFlowId } = item;

	const dataDirections = useDataDirections();
	const dataSourceTypes = useDataSourceTypes();

	const defaultValues = useMemo(
		() => ({
			name: '',
			description: '',
			loadDataTypeId: undefined,
			...(item ? item : {}),
			sourceDataSet: {
				configuration: item?.sourceDataSet?.configuration ? loadYaml(item.sourceDataSet.configuration) : {},
				codeConfiguration: item?.sourceDataSet?.configuration
					? dumpJsonAsYaml(loadYaml(item.sourceDataSet.configuration))
					: '',
			},
			targetDataSet: {
				configuration: item?.targetDataSet?.configuration ? loadYaml(item.targetDataSet?.configuration) : {},
				codeConfiguration: item?.targetDataSet?.configuration
					? dumpJsonAsYaml(loadYaml(item.targetDataSet.configuration))
					: '',
			},
		}),
		[item]
	);

	const methods = useForm<FormValue>({
		defaultValues,
		mode: 'all',
	});

	const mutation = useMutation(
		async (values: FormValue) => {
			const sourceConfiguration = getConfiguration(values, 'sourceDataSet');
			const targetConfiguration = getConfiguration(values, 'targetDataSet');
			const sourceDataSet = buildDataSet(values, 'sourceDataSet');
			const targetDataSet = buildDataSet(values, 'targetDataSet');
			const parameters = loadYaml(values.parameters);
			const steps = loadYaml(values.steps);
			const sourceDirection = dataDirections.find(({ value }) => value === 'R')?.value;
			const targetDirecton = dataDirections.find(({ value }) => value === 'W')?.value;
			const sourceTemplate = values?.sourceDataSet?.template;
			const targetTemplate = values?.targetDataSet?.template;
			const sourceDataSourceTypeId = dataSourceTypes?.find(({ key }) => key === sourceTemplate)?.id;
			const targetDataSourceTypeId = dataSourceTypes?.find(({ key }) => key === targetTemplate)?.id;
			const targetDataSource = {
				name: targetTemplate,
				dataSourceTypeId: targetDataSourceTypeId,
			};
			const sourceDataSource = {
				name: sourceTemplate,
				dataSourceTypeId: sourceDataSourceTypeId,
			};

			if (type === 'update' && item) {
				const updateRequest = {
					dataPipleline: {
						dataPipelineId: item.dataPipelineId,
						dataPipelineOrder: values.order,
						sourceDataSetId: sourceDataSet.id,
						targetDataSetId: targetDataSet.id,
						loadDataTypeId: values.loadDataTypeId,
						name: values.name,
						description: values.description,
						parameters,
					},
					sourceDataSource: {
						...item.sourceConfig.dataSource,
						id: item.sourceConfig.dataSource.id,
						dataSourceTypeId: sourceDataSourceTypeId,
						name: sourceTemplate,
					},
					targetDataSource: {
						...item.targetConfig.dataSource,
						id: item.targetConfig.dataSource.id,
						dataSourceTypeId: targetDataSourceTypeId,
						name: targetTemplate,
					},
					sourceDataSet: {
						...sourceDataSet,
						configuration: sourceConfiguration,
					},
					targetDataSet: {
						...targetDataSet,
						configuration: targetConfiguration,
					},
					steps,
				};
				return putApi(
					`/data-sync/data-flows/${dataFlowId}/data-pipelines/${item.id}`,
					updateRequest
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				) as Promise<any>;
			} else {
				const params = {
					name: values.name,
					description: values.description,
					order: values.order,
					loadDataTypeId: values.loadDataTypeId,
					parameters,
					steps,
					sourceDataSource,
					targetDataSource,
					sourceDataSet: {
						...sourceDataSet,
						dataDirectionId: sourceDirection,
						configuration: sourceConfiguration,
					},
					targetDataSet: {
						...targetDataSet,
						dataDirectionId: targetDirecton,
						configuration: targetConfiguration,
					},
				};
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				return postApi(`/data-sync/data-flows/${dataFlowId}/data-pipelines`, params) as Promise<any>;
			}
		},
		{
			onSuccess: () => {
				confirmationAlert(type === 'update' ? 'Data Pipeline updated' : 'Data Pipeline created');
				onHide();
				refetch();
			},
		}
	);

	return { form: methods, mutation };
};
