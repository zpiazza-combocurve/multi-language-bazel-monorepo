import MEditor, { OnChange } from '@monaco-editor/react';

export interface EditorProps {
	value: string;
	setValue?: OnChange;
	readOnly?: boolean;
}

export const Editor = ({ value, setValue, readOnly }: EditorProps) => {
	return (
		<MEditor
			height='50vh'
			value={value}
			defaultLanguage='yaml'
			theme='vs-dark'
			onChange={setValue}
			options={readOnly ? { readOnly: true, domReadOnly: true } : {}}
		/>
	);
};
