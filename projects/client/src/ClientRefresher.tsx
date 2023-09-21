import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import Snackbar from '@material-ui/core/Snackbar';
import { useEffect, useState } from 'react';

import { IconButton } from '@/components/v2';

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		setIsLatestVersion: (newValue: any) => void;
	}
}

export function ClientRefresher() {
	const [isLatestVersion, setIsLatestVersion] = useState(true);
	const [dismissed, setDismissed] = useState(false);
	useEffect(() => {
		window.setIsLatestVersion = (v) => {
			setIsLatestVersion(v === 'true');
		};
	}, [setIsLatestVersion]);
	return (
		<Snackbar
			open={!dismissed && !isLatestVersion}
			anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			message={
				<>
					A new ComboCurve version is available.{' '}
					<button
						css={`
							border: 0;
							background: inherit;
							color: inherit;
							text-decoration: underline;
							cursor: pointer;
						`}
						type='button'
						onClick={() => window.location.reload()}
					>
						Reload to update.
					</button>
				</>
			}
			action={
				<IconButton size='small' aria-label='close' color='inherit' onClick={() => setDismissed(true)}>
					{faTimes}
				</IconButton>
			}
		/>
	);
}
