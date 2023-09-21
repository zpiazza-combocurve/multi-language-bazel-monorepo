import styled from 'styled-components';

import { Paper as MuiPaper } from '@/components/v2';

/**
 * Paper
 *
 * @deprecated Use material-ui directly
 */
export const Paper = styled(MuiPaper).withConfig({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	shouldForwardProp: (prop: any, defaultValidatorFn) => prop !== 'padded' && defaultValidatorFn(prop),
})<{ padded?: boolean }>`
	${({ padded }) => padded && `padding: 1rem;`}
`;
