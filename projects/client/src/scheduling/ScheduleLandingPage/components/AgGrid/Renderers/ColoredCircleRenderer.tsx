import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { forwardRef, useImperativeHandle, useState } from 'react';
import styled from 'styled-components';

import { Tooltip } from '@/components/v2';

import ColoredCircle from '../../ColoredCircle';

const Container = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 8px;
	gap: 8px;
`;

function ColoredCircleRenderer(props, ref) {
	const [color, setColor] = useState(props.value);

	useImperativeHandle(ref, () => {
		return {
			refresh(params) {
				setColor(params.value);
			},
		};
	});

	const content = (
		<>
			<ColoredCircle $size='20px' $color={color} />
			<FontAwesomeIcon size='1x' icon={faChevronDown} />
		</>
	);

	return <Container>{color ? <Tooltip title={color}>{content}</Tooltip> : content}</Container>;
}

export default forwardRef(ColoredCircleRenderer);
