import { styled } from '@material-ui/core';

import { Button } from '@/components/v2';

export const ToolBarButton = styled(Button)(() => ({
	textTransform: 'unset',
	fontWeight: 300,
	fontSize: '.75rem',
	margin: '0 5px',
	minWidth: 'unset',
}));
