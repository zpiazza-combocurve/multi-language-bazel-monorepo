import styled, { css } from 'styled-components';

import { ifProp } from '@/helpers/styled';

const styles = {
	horizontal: css`
		display: flex;
		justify-content: center;
		width: 100%;
	`,
	vertical: css`
		display: flex;
		align-items: center;
		height: 100%;
	`,
};

export const Centered = styled.div<{ horizontal?: boolean; vertical?: boolean }>`
	${ifProp('horizontal', styles.horizontal)}
	${ifProp('vertical', styles.vertical)}
`;
