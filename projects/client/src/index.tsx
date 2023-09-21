/// <reference types="styled-components/cssprop" />
import '@clientio/rappid/rappid.css';

import { enableMapSet, setAutoFreeze } from 'immer';
import React from 'react';
import ReactDOM from 'react-dom';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import routes from './routes';
import * as serviceWorker from './serviceWorker';

// initialize google analytics
import './google-analytics';
// setup error handler
import './error-handler';
import './styled-theme';

const router = createBrowserRouter(routes);

enableMapSet();
setAutoFreeze(false); // TODO enable when fixes are applied on forecast manual type curve

// Wrap our app because once the store is provided it can only be modified using alfa's set function
const AppWrapper = () => {
	return (
		<React.StrictMode>
			<RouterProvider router={router} />
		</React.StrictMode>
	);
};

ReactDOM.render(<AppWrapper />, document.getElementById('root'));

serviceWorker.unregister();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA

if (process.env.NODE_ENV !== 'production') {
	Object.defineProperty(window, 'memoryStats', {
		get: () => {
			// @ts-expect-error // TODO investigate typescript error with window.performance.memory
			const { usedJSHeapSize } = window.performance.memory;
			const toMB = (bytes) => bytes / 1024 / 1024;

			return {
				// @ts-expect-error // TODO investigate typescript error with toLocaleString first argument
				used: `${toMB(usedJSHeapSize).toFixed(2).toLocaleString('en')} MB`,
			};
		},
	});
}
