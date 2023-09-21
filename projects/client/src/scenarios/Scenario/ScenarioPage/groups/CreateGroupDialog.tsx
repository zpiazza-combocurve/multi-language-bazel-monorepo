import { faUser } from '@fortawesome/pro-solid-svg-icons';
import { CircularProgress } from '@material-ui/core';
import { capitalize, omit } from 'lodash';
import { useRef, useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@/components/v2';
import { withSpacedStyles } from '@/helpers/styled';
import { useCurrentScenarioId, useEconGroups } from '@/scenarios/api';

import { CreateGroupForm, CreateGroupFormRef } from './CreateGroupDialog/CreateGroupForm';
import { GroupDialogMode, GroupDialogProps } from './CreateGroupDialog/types';
import { createGroupFormDefaultConfiguration } from './constants';
import { useDefaultGroupConfiguration } from './group-configurations/api';
import { useGroupConfigurationDialog } from './useGroupConfigurationDialog';

export function CreateGroupDialog(props: GroupDialogProps) {
	const { resolve, onHide, visible, mode = GroupDialogMode.create, currentGroupData } = props;

	const isEditMode = mode === GroupDialogMode.edit;

	const createGroupFormRef = useRef<CreateGroupFormRef | null>(null);

	const createGroups = () => {
		createGroupFormRef?.current?.handleSubmit((values) => {
			resolve(isEditMode ? { ...values, _id: currentGroupData?._id } : omit(values, '_id'));
		})();
	};

	const [dialog, showDialog] = useGroupConfigurationDialog();

	const manageUserGroupConfigurations = async () => {
		const values = createGroupFormRef?.current?.getValues();
		const configuration = await showDialog({
			groupConfiguration: values,
		});
		if (configuration == null) return;
		createGroupFormRef?.current?.reset(configuration);
	};

	const { defaultConfiguration, isLoadingDefaultConfiguration } = useDefaultGroupConfiguration();

	let {
		properties: defaultProperties,
		configuration: { groupName, massCreateGroups, headers, headerAsName },
	} = createGroupFormDefaultConfiguration;

	if (isEditMode && currentGroupData) {
		defaultProperties = { ...currentGroupData.properties };
		groupName = currentGroupData.name;

		// no configuration when on editMode
		massCreateGroups = false;
		headers = [];
		headerAsName = false;
	}

	const defaultGroupFieldValues = {
		groupName,
		econLimit: defaultProperties.econLimit,
		allocationTiming: defaultProperties.allocation.timing,
		allocationProperties: defaultProperties.allocation.properties,
		allocationBasis: defaultProperties.allocation.basis,
		allocationMethod: defaultProperties.allocation.method,
		allocationMethodType: defaultProperties.allocation.methodType,
		massCreateGroups,
		headers,
		headerAsName,
	};

	const [groupFieldValues, setGroupFieldValues] = useState(defaultGroupFieldValues);

	const emptyNameConfiguration =
		!(groupFieldValues?.groupName ?? '').trim().length &&
		!groupFieldValues.headerAsName &&
		'Group Name is required';

	const currentScenarioId = useCurrentScenarioId();
	const { econGroups } = useEconGroups(currentScenarioId);

	const groupNameIsDuplicated =
		!!econGroups.length &&
		!!econGroups.find(({ name: existingGroupName, _id }) => {
			return isEditMode
				? groupFieldValues.groupName === existingGroupName && currentGroupData?._id !== _id
				: groupFieldValues.groupName === existingGroupName;
		});
	const duplicatedNameConfiguration = groupNameIsDuplicated && 'Duplicated Group Name';

	const getFieldValuesConfiguration = () => {
		const errorMessage = 'Missing Required Fields';

		const {
			econLimit,
			allocationTiming,
			allocationProperties,
			allocationBasis,
			allocationMethod,
			allocationMethodType,
		} = groupFieldValues;

		if (!econLimit || !allocationProperties) {
			return errorMessage;
		}

		if (allocationProperties === 'none') {
			return false;
		}

		if (
			allocationProperties === 'individual-wells' &&
			(!allocationBasis || !allocationTiming || !allocationMethod || !allocationMethodType)
		) {
			return errorMessage;
		}

		return false;
	};

	const fieldValuesConfiguration = getFieldValuesConfiguration();

	const getMassCreateValuesConfiguration = () => {
		if (groupFieldValues.massCreateGroups) {
			if (!groupFieldValues.headers?.length) {
				return "Headers can't be blank";
			}
		} else {
			return false;
		}
	};

	const massCreateValuesConfiguration = getMassCreateValuesConfiguration();

	const isCreateButtonDisabled =
		isLoadingDefaultConfiguration ||
		emptyNameConfiguration ||
		duplicatedNameConfiguration ||
		massCreateValuesConfiguration ||
		fieldValuesConfiguration;

	let initConfiguration = omit(defaultConfiguration, '_id');

	if (isEditMode && currentGroupData) {
		initConfiguration = {
			configuration: {
				...createGroupFormDefaultConfiguration.configuration,
				groupName,
			},
			properties: {
				...currentGroupData.properties,
			},
			name: groupName,
		};
	}

	return (
		<Dialog fullWidth maxWidth='md' onClose={onHide} open={!!visible}>
			{dialog}
			<DialogTitle>
				<div
					css={`
						display: flex;
						justify-content: space-between;
					`}
				>
					<span>{capitalize(mode)} Group</span>
					{!isEditMode && (
						<IconButton disabled={isLoadingDefaultConfiguration} onClick={manageUserGroupConfigurations}>
							{faUser}
						</IconButton>
					)}
				</div>
			</DialogTitle>
			<DialogContent
				css={`
					min-height: 50vh;
					${withSpacedStyles()};
					position: relative;
				`}
			>
				{isLoadingDefaultConfiguration ? (
					<CircularProgress
						css={`
							position: absolute;
							top: 40%;
							left: 50%;
						`}
					/>
				) : (
					<CreateGroupForm
						ref={createGroupFormRef}
						defaultConfiguration={initConfiguration}
						onGroupFieldsChange={setGroupFieldValues}
						mode={mode}
					/>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button variant='contained' color='secondary' disabled={isCreateButtonDisabled} onClick={createGroups}>
					{isEditMode ? 'Save' : 'Create'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default CreateGroupDialog;
