// https://stackblitz.com/edit/react-hooks-complex-editor?file=src%2FComponents%2FEditors%2FAutoCompleteEditor.jsx
import { withDefaultProps } from '@/components/shared';
import { formatBoolean } from '@/helpers/utilities';

import AutocompleteEditor from './AutocompleteEditor';

const BooleanEditor = withDefaultProps(AutocompleteEditor, {
	options: [false, true],
	getOptionLabel: formatBoolean,
});

export default BooleanEditor;
