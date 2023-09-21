import { QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';

import { companyPusherChannel, pusherChannel } from '@/helpers/__mocks__/pusher';
import { Provider } from '@/helpers/alfa';
import { queryClient } from '@/helpers/query-cache';

const store = {
	Pusher: pusherChannel,
	CompanyPusher: companyPusherChannel,
};

export default function Wrapper({ children }) {
	return (
		<Provider data={store}>
			<BrowserRouter>
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			</BrowserRouter>
		</Provider>
	);
}
