import { useRef, useState } from 'react';

import { getTaggingProp } from '@/analytics/tagging';
import { AgGridRef } from '@/components/AgGrid';
import { useHotkey } from '@/components/hooks';
import { warningAlert } from '@/helpers/alerts';
import { Resource } from '@/inpt-shared/scheduling/shared';

import { MAX_RESOURCES } from '../../hooks/useScheduleSettingsForm';
import {
	ADD_ROW_SHORTCUT,
	DUPLICATE_RESOURCES_SHORTCUT,
	REMOVE_SELECTED_ROWS_SHORTCUT,
	SCOPES,
} from '../../shared/hotkeys';
import { useSchedulingFormContext } from '../shared/FormContext';
import { GridActionButtons } from '../shared/GridActionButtons';
import { createResource } from '../shared/helpers';
import { MemoizedResourcesGrid } from './ResourcesGrid';

export function ScheduleSettingResources() {
	const agGridRef = useRef<AgGridRef>(null);
	const [selectedRows, setSelectedRows] = useState<Resource[]>([]);

	const {
		setValue,
		watch,
		formState: { errors },
	} = useSchedulingFormContext();

	const resources = watch('resources');

	const addButtonDisabled = (() => {
		if (resources.length >= MAX_RESOURCES) return `Maximum of ${MAX_RESOURCES} resources reached.`;
		if (errors.resources && errors.resources.message) return errors.resources.message.toString();
	})();

	const handleCreateResource = () => {
		if (addButtonDisabled) return;

		const highestIndex = resources.reduce((prev, current) => {
			const resourceRegex = /^Resource (?<number>[\d]+)$/;
			const resourceNumber = Number(resourceRegex.exec(current.name)?.groups?.number) || 0;

			return prev > resourceNumber ? prev : resourceNumber;
		}, 0);

		const newResource = createResource(highestIndex);
		setValue('resources', [...resources, newResource], { shouldValidate: true });
		setSelectedRows([]);
	};

	useHotkey(ADD_ROW_SHORTCUT, SCOPES.resources, (e) => {
		e.preventDefault();
		handleCreateResource();
	});

	const handleRemoveResource = () => {
		const selectedRowsIds = selectedRows.map((row) => row.name);
		const filteredResources = resources.filter((value) => !selectedRowsIds.includes(value.name));

		setSelectedRows([]);
		setValue('resources', filteredResources, { shouldValidate: true });
	};

	useHotkey(REMOVE_SELECTED_ROWS_SHORTCUT, SCOPES.resources, (e) => {
		e.preventDefault();
		handleRemoveResource();
	});

	const handleDuplicateResource = () => {
		const copySuffix = ' - Copy';
		const copyRegex = / - Copy ?(\d+)?$/;

		const selectedRowsIds = selectedRows.map((row) => row.name);
		const resourcesToDuplicate = resources.filter((value) => selectedRowsIds.includes(value.name));

		const newResources: Resource[] = [];

		let maxResourcesReached = false;
		resourcesToDuplicate.forEach((resource: Resource) => {
			let newName = resource.name;

			const nameEndsWithCopy = newName.match(copyRegex);
			if (nameEndsWithCopy) {
				const copyNumber = parseInt(newName.match(copyRegex)?.[1] ?? '1');
				newName = newName.replace(copyRegex, `${copySuffix} ${copyNumber + 1}`);
			} else {
				newName += copySuffix;
			}

			let i = 2;
			while ([...resources, ...newResources].some((r) => r.name === newName)) {
				newName = newName.replace(copyRegex, `${copySuffix} ${i}`);
				i++;
			}

			maxResourcesReached = resources.length + newResources.length >= MAX_RESOURCES;
			if (maxResourcesReached) return;

			newResources.push({
				...resource,
				name: newName,
			});
		});

		if (maxResourcesReached) {
			warningAlert(`Maximum of ${MAX_RESOURCES} resources reached.`);
		}

		agGridRef.current?.api.deselectAll();
		setSelectedRows([]);
		setValue('resources', [...resources, ...newResources], { shouldValidate: true });
	};

	useHotkey(DUPLICATE_RESOURCES_SHORTCUT, SCOPES.resources, (e) => {
		e.preventDefault();
		handleDuplicateResource();
	});

	return (
		<>
			<GridActionButtons
				name='Resources'
				addButtonDisabled={addButtonDisabled}
				hasSelectedRows={Boolean(selectedRows.length)}
				addButtonText='Resource'
				addFunction={handleCreateResource}
				deleteFunction={handleRemoveResource}
				duplicateFunction={handleDuplicateResource}
				addButtonTaggingProps={getTaggingProp('schedule', 'addResource')}
			/>

			<MemoizedResourcesGrid agGridRef={agGridRef} setSelectedRows={setSelectedRows} />
		</>
	);
}
