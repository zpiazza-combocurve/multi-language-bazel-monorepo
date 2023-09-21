import { CSSProperties } from 'react';
import styled from 'styled-components';

import { excludeProps } from '@/helpers/styled';

interface OwnProps {
	direction?: CSSProperties['flexDirection'];
	alignItems?: CSSProperties['alignItems'];
	justifyContent?: CSSProperties['justifyContent'];
	spacing?: string | number;
	flexWrap?: CSSProperties['flexWrap'];
}

/**
 * Mock of the Stack component from mui@v5, we cannot import it directly yet because we are on v4, but we can borrow
 * their ideas in the meantime
 *
 * @note keep the api minimal and very similar to the original Stack component to make the replacement when we upgrade seamless
 * @see https://mui.com/api/stack/
 * @todo Remove component after upgrading to mui v5
 */
const Stack = styled.div.withConfig({
	shouldForwardProp: excludeProps(['direction', 'spacing', 'justifyContent', 'alignItems', 'flexWrap']),
})<OwnProps>(({ direction = 'column', spacing = 0, theme, justifyContent, alignItems, flexWrap }) => ({
	display: 'flex',
	flexDirection: direction,
	gap: typeof spacing === 'string' ? spacing : `${theme.spacing(spacing)}px`,
	justifyContent,
	alignItems,
	flexWrap,
}));

export default Stack;
