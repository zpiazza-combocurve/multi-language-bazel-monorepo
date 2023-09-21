import { StylesProvider } from '@material-ui/core/styles';

const snapshotFriendlyClassNameGenerator = (rule, styleSheet) => `${styleSheet.options.classNamePrefix}-${rule.key}`;

export const SnapshotFriendlyStylesProviderWrapper = ({ children }) => (
	<StylesProvider generateClassName={snapshotFriendlyClassNameGenerator}>{children}</StylesProvider>
);
