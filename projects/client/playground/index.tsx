// setup error handler
import '@/error-handler';
import '@/global-styles/index.scss';

import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { setAutoFreeze } from 'immer';
import ReactDOM from 'react-dom';
import { QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';

import SnackbarHandler from '@/components/v2/alerts/SnackbarHandler';
import { companyPusherChannel, pusherChannel } from '@/helpers/__mocks__/pusher';
import { Provider } from '@/helpers/alfa';
import { GlobalComponentsHandler } from '@/helpers/global-components';
import { HiddenReactQueryDevTools, queryClient } from '@/helpers/query-cache';
import { ThemeHandler } from '@/helpers/theme';
import * as serviceWorker from '@/serviceWorker';

import Playground from './Playground';

setAutoFreeze(false); // TODO enable when fixes are applied on forecast manual type curve

const store = {
	project: { _id: 'test-id' },
	projects: false,
	scenario: false,
	scenarios: false,
	theme: 'light',
	Pusher: pusherChannel,
	CompanyPusher: companyPusherChannel,
};

// Wrap our app because once the store is provided it can only be modified using alfa's set function
const AppWrapper = () => {
	return (
		<Provider data={store}>
			<ThemeHandler>
				<QueryClientProvider client={queryClient}>
					<MuiPickersUtilsProvider utils={DateFnsUtils}>
						<BrowserRouter>
							<SnackbarHandler />
							<Playground />
							<GlobalComponentsHandler />
						</BrowserRouter>
					</MuiPickersUtilsProvider>
					<HiddenReactQueryDevTools />
				</QueryClientProvider>
			</ThemeHandler>
		</Provider>
	);
};

ReactDOM.render(<AppWrapper />, document.getElementById('root'));

serviceWorker.unregister();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA

Object.defineProperty(window, 'memoryStats', {
	get: () => {
		const { usedJSHeapSize } = window.performance.memory;
		const toMB = (bytes) => bytes / 1024 / 1024;

		return {
			used: `${toMB(usedJSHeapSize).toFixed(2).toLocaleString('en')} MB`,
		};
	},
});
