import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { CreateLookupTableDialog } from '@/lookup-tables/shared/CreateLookupTableDialog';
import { createLookupTable } from '@/lookup-tables/type-curve-lookup-table/api';

export function CreateForecastLookupTableDialog({ resolve, onHide, visible }) {
	const { project } = useAlfa();

	const onSubmit = ({ name, configuration }) =>
		createLookupTable({ name, configuration, project: project._id })
			.then((item) => resolve(item))
			.catch((error) => genericErrorAlert(error));

	return (
		<CreateLookupTableDialog
			onSubmit={onSubmit}
			title='New Type Curve Lookup Table'
			onHide={onHide}
			visible={visible}
			lookupTableType='typeCurve'
		/>
	);
}
