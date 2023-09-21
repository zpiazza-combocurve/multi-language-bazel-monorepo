import { ColoredCircle } from '@/components/misc';
import MultiSelectField from '@/components/v2/misc/MultiSelectField';
import { WellHeaderInfo } from '@/create-wells/models';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

interface SearchHeadersMultiselectProps {
	wellHeadersDict: Record<string, WellHeaderInfo>;
	multiSelectCSS?: string;
	selectedHeaders: string[];
	disableTags?: boolean;
	disableClearable?: boolean;
	onAddHeader: (key: string | undefined) => void;
	onRemoveHeader: (key: string | undefined) => void;
}

const SearchHeadersMultiselect = (props: SearchHeadersMultiselectProps) => {
	const {
		wellHeadersDict,
		multiSelectCSS,
		selectedHeaders,
		onAddHeader,
		onRemoveHeader,
		disableTags = false,
		disableClearable = false,
	} = props;

	const menuItems = Object.entries(wellHeadersDict)
		.map(([key, data]) => ({ value: key, label: data.label }))
		.sort((a, b) => (a.label > b.label ? 1 : b.label > a.label ? -1 : 0));

	const onChangeSelectedHeaders = (newValues: string[]) => {
		if (newValues.length > selectedHeaders.length) {
			const addedHeader = newValues.find((nv) => selectedHeaders.indexOf(nv) < 0);
			onAddHeader(addedHeader);
		} else {
			const removedHeader = selectedHeaders.find((s) => newValues.indexOf(s) < 0);
			onRemoveHeader(removedHeader);
		}
	};

	return (
		<MultiSelectField
			label='Search Headers'
			menuItems={menuItems}
			value={selectedHeaders}
			onChange={onChangeSelectedHeaders}
			disableTags={disableTags}
			variant='outlined'
			css={multiSelectCSS}
			disableClearable={disableClearable}
			onTextFieldKeyDown={(event) => {
				if (event.key === 'Backspace') {
					event.stopPropagation();
				}
			}}
			renderBeforeOptionLabel={(value) =>
				wellHeadersDict[value].isPCH ? <ColoredCircle $color={projectCustomHeaderColor} /> : null
			}
		/>
	);
};

export default SearchHeadersMultiselect;
