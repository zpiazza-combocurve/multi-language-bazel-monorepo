import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { createLookupTable } from '@/lookup-tables/scheduling-lookup-table/api';
import { CreateLookupTableDialog } from '@/lookup-tables/shared/CreateLookupTableDialog';

export function CreateSchedulingLookupTableDialog({ resolve, onHide, visible }) {
	const { project } = useAlfa();

	const onSubmit = ({ name }) =>
		createLookupTable({ name, project: project?._id, lines: [] })
			.then((lt) => resolve(lt))
			.catch((error) => genericErrorAlert(error));

	return (
		<CreateLookupTableDialog
			onSubmit={onSubmit}
			title='New Scheduling Lookup Table'
			onHide={onHide}
			visible={visible}
			lookupTableType='scheduling'
		/>
	);
}
