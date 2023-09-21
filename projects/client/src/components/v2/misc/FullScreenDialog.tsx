import { faTimes as faClose } from '@fortawesome/pro-regular-svg-icons';
import * as React from 'react';

import { Placeholder } from '@/components/Placeholder';
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@/components/v2';

interface FullScreenDialogProps {
	className?: string;
	onClose?: () => void;
	open: boolean;
	/** Content in the top left of the dialog, usually title or navigation tabs */
	topbar?: React.ReactNode;
	/** Content in the top right of the dialog next to the close button, usually zoho help icon */
	topbarRight?: React.ReactNode;
	children?: React.ReactNode;
	actions?: React.ReactNode;
	/**
	 * Prevents escape key closing the dialog
	 *
	 * @see https://mui.com/api/dialog/
	 */
	disableEscapeKeyDown?: boolean;
	/** Will remove the max-width constrain of material-ui so it has all the available width on larger screens */
	disableMaxWidth?: boolean;
	/** This removes the topbar entire including the close button */
	disableTopbar?: boolean;
	/** HACK for weird behavior of mui dialogs when there's no title. If there's no title the default top padding is 20px */
	disableContentExtraTopPadding?: boolean;
	enableLoading?: boolean;
	isLoading?: boolean;
}

/**
 * @example
 * 	const [selectedTab, setSelectedTab] = React.useState(0);
 *
 * 	<FullScreenDialog
 * 		open={open}
 * 		onClose={onClose}
 * 		topbar={
 * 			<Tabs value={selectedTab} onChange={(_ev, newValue) => setSelectedTab(newValue)}>
 * 				<Tab label='Forecasts' />
 * 				<Tab label='Scenarios' />
 * 			</Tabs>
 * 		}
 * 		topbarRight={<IconButton onClick={() => goToZoho('/help/dialog')}>{faQuestion}</IconButton>}
 * 	>
 * 		{selectedTab}
 * 	</FullScreenDialog>;
 */
export default function FullScreenDialog({
	className,
	onClose,
	open,
	topbar,
	topbarRight,
	children,
	disableEscapeKeyDown,
	disableMaxWidth,
	disableTopbar,
	disableContentExtraTopPadding,
	actions,
	isLoading,
	enableLoading = false,
}: FullScreenDialogProps) {
	return (
		<Dialog
			maxWidth='xl'
			fullWidth
			open={open}
			onClose={onClose}
			disableEscapeKeyDown={disableEscapeKeyDown}
			css={`
				.MuiDialog-paperWidthXl {
					${disableMaxWidth ? 'max-width: initial;' : ''}
				}
			`}
		>
			{enableLoading && isLoading && (
				<DialogContent
					css={`
						height: 100vh;
					`}
				>
					<Placeholder main loading loadingText='Loading...' minShow={50} />
				</DialogContent>
			)}
			{((enableLoading && !isLoading) || !enableLoading) && (
				<>
					{' '}
					{!disableTopbar && (
						<DialogTitle
							disableTypography
							css={{
								display: 'flex',
								alignItems: 'center',
								padding: '0.5rem 1rem',
								gap: '0.5rem',
							}}
						>
							{topbar}
							<div css={{ flex: 1 }} />
							{topbarRight}
							<IconButton onClick={onClose}>{faClose}</IconButton>
						</DialogTitle>
					)}
					<DialogContent
						css={`
							height: 100vh;
							padding: 0.5rem;
							&& {
								${disableContentExtraTopPadding ? 'padding-top: 0.5rem;' : ''}
							}
						`}
						className={className}
					>
						{children}
					</DialogContent>
					{actions && <DialogActions>{actions}</DialogActions>}
				</>
			)}
		</Dialog>
	);
}
