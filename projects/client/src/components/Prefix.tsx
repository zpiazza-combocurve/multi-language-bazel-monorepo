import { useContext } from 'react';
import * as React from 'react';

export const PrefixContext = React.createContext('');

/**
 * @example
 * 	function Field({ name }: { name: string }) {
 * 		return <FormikField name={useFieldName(name)} />;
 * 	}
 */
export function useFieldName(name: string) {
	const prevPrefix = useContext(PrefixContext);
	return `${prevPrefix}${name}`;
}

/**
 * Helper intended for form names helper
 *
 * @example
 * 	<>
 * 		<Prefix prefix='foo.'>
 * 			<Field name='baz' />
 * 			<Field name='bar' />
 * 		</Prefix>
 * 		// same as
 * 		<Field name='foo.baz' />
 * 		<Field name='foo.bar' />
 * 		// assuming Field uses the prefix context, see `useFieldName`
 * 	</>;
 */
export function Prefix({ prefix, children }: { prefix: string; children: React.ReactNode }) {
	return <PrefixContext.Provider value={useFieldName(prefix)}>{children}</PrefixContext.Provider>;
}
