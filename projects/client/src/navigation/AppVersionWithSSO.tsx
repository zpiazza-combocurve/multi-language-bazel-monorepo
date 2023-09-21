import { Link } from '@material-ui/core';

import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useAlfa } from '@/helpers/alfa';

export const AppVersionWithSSO = () => {
	const { user } = useAlfa(['user']);
	const { releaseInfo } = useLDFeatureFlags();

	return (
		<div
			css={`
				padding: ${({ theme }) => theme.spacing(1)}px;
				text-align: center;
			`}
		>
			{user.isEnterpriseConnection ? 'SSO / ' : ''}
			Version{' '}
			<Link href={releaseInfo.portalUrl} target='_blank' rel='noreferrer'>
				{releaseInfo.version}
			</Link>
		</div>
	);
};
