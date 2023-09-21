import { Dialog, DialogActions as MuiDialogActions } from '@material-ui/core';
import styled from 'styled-components';

import { IconButton } from '@/components/v2';
import { getMaxZIndex } from '@/components/v2/helpers';

export const DialogContainer = styled(Dialog)<{ disableMinHeight?: boolean }>`
	z-index: ${getMaxZIndex()};

	.MuiDialog-paper {
		min-width: 28rem;
		min-height: ${({ disableMinHeight }) => (disableMinHeight ? 'none' : '42rem')};
	}
`;

export const DialogHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

export const DialogTitle = styled.h2`
	margin: 24px;
`;

export const DialogActions = styled(MuiDialogActions)`
	margin: 16px;
`;

export const CloseButton = styled(IconButton)`
	margin-right: 16px;
`;
