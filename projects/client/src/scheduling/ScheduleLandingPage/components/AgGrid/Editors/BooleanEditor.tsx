// https://stackblitz.com/edit/react-hooks-complex-editor?file=src%2FComponents%2FEditors%2FAutoCompleteEditor.jsx
import { AutocompleteEditor } from '@/components/AgGrid/editors';
import { withDefaultProps } from '@/components/shared';
import { formatBoolean } from '@/helpers/utilities';

const BooleanEditor = withDefaultProps(AutocompleteEditor, {
	options: [false, true],
	getOptionLabel: formatBoolean,
	getOptionSelected: (option, value) => option === value || value || !value,
});

export default BooleanEditor;
