import { faPencil } from '@fortawesome/pro-regular-svg-icons';
import { memo, useCallback, useState } from 'react';
import styled from 'styled-components';

import { useDialog } from '@/helpers/dialog';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';
import ModuleList, { useModuleListRef } from '@/module-list/ModuleListV2';

import TableFormManage from './TableFormManage';

const CenteredTitle = styled.h2`
	text-align: left;
	margin: 0.5rem;
`;

const paginate = (collection, page, size) => {
	const firstIdx = page * size;
	const lastIdx = firstIdx + size + 1;
	return collection.slice(firstIdx, lastIdx);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const TableForm: React.FC<any> = memo((props) => {
	const [properties, setProperties] = useState(props?.properties?.map((el) => ({ ...el, _id: el.name })) ?? []);

	const { moduleListProps: stateProps, runFilters } = useModuleListRef({});
	const addProperties = (vals) => {
		setProperties((old) => {
			return [...old, { ...vals, _id: vals.name }];
		});
		runFilters();
	};

	const updateProperties = (vals) => {
		const newProperties = properties.map((el) => {
			if (el._id === vals._id) {
				return { ...vals, _id: vals.name };
			} else {
				return el;
			}
		});
		setProperties(newProperties);
		runFilters();
	};
	const [createDialog, showCreateDialog] = useDialog(TableFormManage, { onChange: addProperties });
	const [updateDialog, showUpdateDialog] = useDialog(TableFormManage, { type: 'update', onChange: updateProperties });

	const fetchProps = useCallback(
		(request) => {
			const { page } = request;
			return Promise.resolve({
				ids: paginate(
					properties.map((el) => el.name),
					page,
					20
				),
				items: paginate(properties, page, 20),
				page,
				$skip: (page + 1) * 20,
				$limit: 50,
				totalItems: properties.length,
			});
		},
		[properties]
	);

	return (
		<Section>
			<SectionHeader as={CenteredTitle}>{props.name}</SectionHeader>
			<SectionContent
				css={`
					width: 100%;
					height: 500px;
				`}
			>
				{createDialog}
				{updateDialog}
				<ModuleList
					{...stateProps}
					feat='fields'
					canCreate
					canDelete={() => true}
					onCreate={async () => {
						await showCreateDialog();
					}}
					onDelete={async (item) => {
						setProperties((old) => {
							return old.filter((el) => el._id !== item._id);
						});
					}}
					fetch={fetchProps}
					itemActions={useCallback(
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						(item: any) => [
							{
								icon: faPencil,
								label: 'Update',
								onClick: async () => {
									// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
									await showUpdateDialog({ item } as any);
								},
								color: 'warning',
							},
						],
						[showUpdateDialog]
					)}
					itemDetails={[
						{
							key: 'name',
							label: 'Name',
							value: ({ name }) => name,
							width: 220,
						},
						{
							key: 'type',
							label: 'Type',
							value: ({ type }) => type,
							width: 100,
						},

						{
							key: 'isRequired',
							label: 'Validation',
							value: ({ required }) => (required ? 'Required' : 'Not required'),
							width: 100,
						},
					]}
				/>
			</SectionContent>
		</Section>
	);
});
