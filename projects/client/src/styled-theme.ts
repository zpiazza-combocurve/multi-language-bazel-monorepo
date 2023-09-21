// Add types to `theme` proeprty in styled component, needs to be in this file .ts because other methods (using .d.ts) didn't work
// reference https://github.com/styled-components/styled-components/issues/1589
import { Theme } from '@material-ui/core';

declare module 'styled-components' {
	// This is needed for some reason
	export interface DefaultTheme extends Theme {}
}
