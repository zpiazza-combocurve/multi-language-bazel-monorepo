import { useEffect } from 'react';
import { useQuery } from 'react-query';

import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { connectPusher } from '@/helpers/pusher';
import { getApi } from '@/helpers/routing';

import InitialLoading from './InitialLoading';

export const getBootstrapQuery = () => ({
	queryKey: ['bootstrap'],
	queryFn: () => getApi('/user/bootstrap'),
});

export default function Bootstrap(props: { children: React.ReactNode }) {
	const { set, authenticated } = useAlfa(['set', 'authenticated']);
	const { data } = useQuery({
		...getBootstrapQuery(),
		suspense: true,
		useErrorBoundary: true,
	});

	useEffect(() => {
		if (data) {
			connectPusher(data)
				.then((pusherRes) => {
					set({
						...data,
						authenticated: true,
						Pusher: pusherRes.pusherChannel,
						CompanyPusher: pusherRes.companyPusherChannel,
					});
				})
				.catch(genericErrorAlert);
		}
	}, [data, set]);

	if (!authenticated) return <InitialLoading />;

	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{props.children}</>;
}
