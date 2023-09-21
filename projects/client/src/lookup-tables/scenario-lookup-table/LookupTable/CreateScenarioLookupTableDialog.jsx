import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { createLookupTable } from '@/lookup-tables/scenario-lookup-table/api';
import { CreateLookupTableDialog } from '@/lookup-tables/shared/CreateLookupTableDialog';

export function CreateScenarioLookupTableDialog({ resolve, onHide, visible }) {
	const { project } = useAlfa();

	const onSubmit = ({ name, configuration }) =>
		createLookupTable({ name, configuration, project: project._id })
			.then((lt) => resolve(lt))
			.catch((error) => genericErrorAlert(error));

	return (
		<CreateLookupTableDialog
			onSubmit={onSubmit}
			title='New Scenario Lookup Table'
			onHide={onHide}
			visible={visible}
			lookupTableType='scenario'
		/>
	);
}
