// helpers and common functions for testing

import MockAdapter from 'axios-mock-adapter';
import getCanvasWindow from 'jest-canvas-mock/lib/window';
import { Suspense } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { QueryClientProvider } from 'react-query';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import axios from '@/helpers/routing/axiosApi';
import { UnsavedWorkHandler } from '@/helpers/unsaved-work';
import { FeatureFlags } from '@/inpt-shared/feature-flags/shared';

import { companyPusherChannel, pusherChannel } from './__mocks__/pusher';
import { Provider } from './alfa';
import { GlobalComponentsHandler } from './global-components';
import { queryClient } from './query-cache';
import { API_BASE_URL } from './routing/routing-shared';
import { ThemeHandler } from './theme';

export { mockFlags } from './testing/launchdarkly';

export function getAxiosMockAdapter() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return new MockAdapter(axios as any);
}

const defaultStore = {
	project: false,
	projects: false,
	scenario: false,
	scenarios: false,
	theme: 'light',
	themeMode: 'classic',
	Pusher: pusherChannel,
	CompanyPusher: companyPusherChannel,
	user: {},
};

export function TestWrapper({
	children,
	initialEntries,
	store,
	path = '*',
}: {
	children?;
	initialEntries?;
	store?;
	path?: string;
}) {
	return (
		<RouterProvider
			router={createMemoryRouter(
				[
					{
						path,
						element: (
							<QueryClientProvider client={queryClient}>
								<DndProvider backend={HTML5Backend}>
									<GlobalComponentsHandler />
									<UnsavedWorkHandler />
									<Provider data={{ ...defaultStore, ...store }}>
										<ThemeHandler>
											<Suspense fallback='Loading'>{children}</Suspense>
										</ThemeHandler>
									</Provider>
								</DndProvider>
							</QueryClientProvider>
						),
					},
				],
				{ initialEntries }
			)}
		/>
	);
}

export function mockPermissions() {
	vi.mock('@/access-policies/usePermissions', async () => ({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		...((await vi.importActual('@/access-policies/usePermissions')) as any),

		__esModule: true,
		default: vi.fn().mockReturnValue({ canView: true }),
	}));
}

export const featureFlags: FeatureFlags = {
	isCarbonEnabled: false,
	isDataSyncEnabled: false,
	isMassImportUsersTestingEnabled: false,
	isNewWellsFilteringEnabled: false,
	isPasswordlessModeEnabled: false,
	isProbabilisticCapexEnabled: false,
	isProximityForecastEnabled: false,
	isWellSpacingEnabled: false,
	isWellsCollectionsEnabled: false,
	isCumTypeCurveFitEnabled: false,
	isCompositionalEconomicsEnabled: false,
	isDALEnabled: false,
	isSchedulingNPVEnabled: false,
	isSchedulingResourceViewEnabled: false,
	isSchedulingRunOverwriteManualEnabled: false,
	isSchedulingLookupTableEnabled: false,
	maxScheduleSize: 20000,
	isMassCreateWellCollectionsEnabled: false,
	isCustomCSVEditorNewTagEnabled: false,
	economicsExportMenuItemsVariation: 'old',
	isCustomCSVEditorTourEnabled: false,
	isCustomStreamsEnabled: false,
	isMosaicForecastExportEnabled: false,
	isCustomPDFEditorEnabled: false,
	isSharedUserConfigurationsEnabled: false,
	clusterZoomValue: 6,
	releaseInfo: {
		portalUrl: '',
		version: 0,
	},
	isVerticalDateBarsEnabled: false,
	isNodeModelsEnabled: true,
};

export function mockPDFMake() {
	// Mock pdfmake
	vi.mock('pdfmake/build/pdfmake', async () => {
		const mPdfMake = {
			createPdfKitDocument: vi.fn().mockImplementation(() => ({ a: 'b' })),
			pdfMake: vi.fn().mockImplementation(() => ({
				vfs: vi.fn().mockImplementation(() => ({})),
			})),
		};
		return { default: mPdfMake };
	});
	// Mock pdfmake/vfs_fonts
	vi.mock('pdfmake/build/vfs_fonts', async () => {
		const mPdfFonts = {
			createPdfKitDocument: vi.fn().mockImplementation(() => ({ a: 'b' })),
			pdfMake: vi.fn().mockImplementation(() => ({
				vfs: vi.fn().mockImplementation(() => ({})),
			})),
		};
		return { default: mPdfFonts };
	});
}

/**
 * @example
 * 	const mock = getAxiosMockAdapter();
 * 	mock.onGet('/query').reply(200, {}, DEFAULT_RESPONSE_HEADERS);
 */
export const DEFAULT_TESTING_RESPONSE_HEADERS = {
	'inpt-client-latest': true,
};

export function getApiUrl(path) {
	return `${API_BASE_URL}${path}`;
}

// https://github.com/vitest-dev/vitest/discussions/395
export function mockCanvas() {
	const canvasApis = [
		'Path2D',
		'CanvasGradient',
		'CanvasPattern',
		'CanvasRenderingContext2D',
		'DOMMatrix',
		'ImageData',
		'TextMetrics',
		'ImageBitmap',
		'createImageBitmap',
	] as const;

	const canvasWindow = getCanvasWindow({ document: window.document });

	canvasApis.forEach((api) => {
		global[api] = canvasWindow[api];
		global.window[api] = canvasWindow[api];
	});
}
