import { LinearProgress } from '@material-ui/core';
import { OptionsObject as NotificationOptionsObject, VariantType } from 'notistack';
import { createContext, useContext, useEffect } from 'react';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { create } from 'zustand';

import { useOverlay, useOverlayStore } from '@/components/Overlay';
import { useLoadingShown } from '@/components/hooks/useLoadingShown';
import * as alerts from '@/components/v2/alerts';
import { ValueOrFunction, numberWithCommas, resolveValueOrFunction } from '@/helpers/utilities';

import { getErrorMessage, getErrorTitle } from './errors';
import { redirectToZoho } from './routing';

export const ProgressBarContext = createContext<{
	progress?: number | null;
	setProgress?: (newProgress: null | undefined | number) => void;
}>({});

export const getPerformanceWarningText = (module: string, threshold: number) =>
	`Performance may be impacted by exceeding the recommended ${module} well limit of ${numberWithCommas(threshold)}`;

interface LoadingBarStore {
	currentAsyncCalls: number;
	increaseAsyncCalls(): void;
	decreaseAsyncCalls(): void;
}

const useLoadingBarStore = create<LoadingBarStore>((set) => ({
	currentAsyncCalls: 0,
	increaseAsyncCalls: () => set((state) => ({ currentAsyncCalls: state.currentAsyncCalls + 1 })),
	decreaseAsyncCalls: () => set((state) => ({ currentAsyncCalls: state.currentAsyncCalls - 1 })),
}));

/**
 * Called when needs to show loading bar. Must call `decreaseLoadingBar` the same amount of time `increaseLoadingBar`
 * was called for it to hide.
 */
const increaseLoadingBar = () => {
	useLoadingBarStore.getState().increaseAsyncCalls();
};

/** Called when doesn't need to show loading bar anymore */
const decreaseLoadingBar = () => {
	useLoadingBarStore.getState().decreaseAsyncCalls();
};

/** Main loading bar for the app */
export function LoadingBar() {
	const isLoading = useLoadingBarStore((state) => state.currentAsyncCalls > 0);
	// TODO wait a bit before showing the loading bar, see useLoadingShown hook
	return (
		<LinearProgress
			id='loading-bar'
			css={`
				${!isLoading && `display: none;`}
				width: 100vw;
				top: 0;
				margin: 0;
				position: absolute;
				z-index: 9999;
			`}
		/>
	);
}

export const confirmAddWells = async (
	wellsCount: number,
	module: string,
	includeCollections = false,
	wellsPerformanceThreshold?: number
) => alerts.confirmAddWells({ wellsCount, module, wellsPerformanceThreshold, includeCollections });

export const createConfirmAddWells =
	(module: string, includeCollections = false) =>
	(wellsCount: number, wellsPerformanceThreshold?: number) =>
		confirmAddWells(wellsCount, module, includeCollections, wellsPerformanceThreshold);

export const confirmRemoveWells = (wellsCount: number, module: string, wellsPerformanceThreshold?: number) =>
	alerts.confirmRemoveWells({ wellsCount, module, wellsPerformanceThreshold });

export const createConfirmRemoveWells = (module: string) => (wellsCount: number, wellsPerformanceThreshold?: number) =>
	confirmRemoveWells(wellsCount, module, wellsPerformanceThreshold);

const createToast =
	({ variant, defaultText }: { variant: VariantType; defaultText: string }) =>
	(titleText = defaultText, timer = 3000, toastOptions: Pick<NotificationOptionsObject, 'preventDuplicate'> = {}) => {
		const { preventDuplicate = false } = toastOptions ?? {};
		alerts.enqueueSnackbar(titleText, { variant, autoHideDuration: timer, preventDuplicate });
	};

export const confirmationAlert = createToast({ variant: 'success', defaultText: 'Success' });

export const infoAlert = createToast({ variant: 'info', defaultText: 'Info' });

export const failureAlert = createToast({ variant: 'error', defaultText: 'Something went wrong' });

export const warningAlert = createToast({ variant: 'warning', defaultText: 'Warning' });

export const genericErrorAlert = async (error: Inpt.ExpectedError, titleText?: string, timer?: number) => {
	/** Used to show an alert with text extracted from the error message and optional title */
	// stackdriver logging will be better here, once we set it up
	// eslint-disable-next-line no-console
	console.error(error);
	const text =
		(error.expected ? getErrorMessage(error) : '') || "We're working on it. Please try again or contact support.";

	const result = await swal({
		cancelButtonText: 'Dismiss',
		confirmButtonText: 'Contact Support',
		customClass: 'swal2-generic-failure-alert',
		position: 'top',
		reverseButtons: true,
		showCancelButton: true,
		showConfirmButton: !error.expected,
		text,
		timer,
		titleText: titleText || (error.expected ? getErrorTitle(error) : '') || 'Sorry, something went wrong',
	});

	if (result.value) {
		increaseLoadingBar();
		try {
			await redirectToZoho();
		} catch (e) {
			genericErrorAlert(e);
		} finally {
			decreaseLoadingBar();
		}
	}
};

/** Used to show an alert with custom text, title */
export const customErrorAlert = (titleText?: string, text?: string) => {
	// use toasts?
	const options: SweetAlertOptions = {
		type: 'error',
		position: 'top',
		showConfirmButton: false,
		text: text || 'Please try again later',
		titleText: titleText || 'Something went wrong...',
	};

	return swal(options);
};

/** @deprecated This function doesn't throw an error if it fails, use withLoadingBar instead */
export async function withProgress<T>(promise: Promise<T>, successMessage?: string): Promise<T | void> {
	try {
		increaseLoadingBar();
		const res = await promise;
		if (successMessage) {
			confirmationAlert(successMessage);
		}
		return res;
	} catch (error) {
		genericErrorAlert(error);
	} finally {
		decreaseLoadingBar();
	}
}

/**
 * Will show the loading bar while the promise is not resolved
 *
 * @example
 * 	await withAsync(callFunctionThatThrows());
 */
export function withAsync<F extends Promise<unknown>>(fn: F) {
	const wrapit = async (promise: Promise<unknown>) => {
		try {
			increaseLoadingBar();
			return await promise;
		} finally {
			decreaseLoadingBar();
		}
	};
	return wrapit(fn) as F;
}

/**
 * Alernative to `withProgress`, will throw an error if it fails, preventing the execution of consecutive code that
 * would otherwise run and probably fail.
 *
 * @example
 * 	const onClick = async () => {
 * 		const result = await withLoadingBar(getApi('/getMyData'));
 * 		await withLoadingBar(postApi('/saveMyData', { result }), 'Data Saved Successfully');
 * 	};
 */
export async function withLoadingBar<T>(promise: Promise<T>, successMessage?: string): Promise<T> {
	try {
		const res = await withAsync(promise);
		if (successMessage) {
			confirmationAlert(successMessage);
		}
		return res;
	} catch (error) {
		genericErrorAlert(error);
		throw error;
	}
}

/**
 * Similar to `withLoadingBar`, but for the doggo
 *
 * @example
 * 	const onClick = async () => {
 * 		await withDoggo(postApi('/doOperation'));
 *
 * 		await withDoggo(async () => {
 * 			await manyOperations();
 * 			await warppedInWithDoggo();
 * 		});
 * 	};
 */
export async function withDoggo<T>(promise: ValueOrFunction<Promise<T>>, doggoText?: string): Promise<T> {
	try {
		// this doesn't consider the currently open overlays
		useOverlayStore.setState({ showingOverlay: true, text: doggoText });
		return await resolveValueOrFunction(promise);
	} catch (error) {
		genericErrorAlert(error);
		throw error;
	} finally {
		useOverlayStore.setState({ showingOverlay: false, text: '' });
	}
}

export function useLoadingBar(show: boolean) {
	const { progress } = useContext(ProgressBarContext);
	const loading = useLoadingShown({ loading: show }) && !progress; // don't show loading bar while showing progress
	useEffect(() => {
		if (!loading) {
			return undefined;
		}
		increaseLoadingBar();
		return () => decreaseLoadingBar();
	}, [loading]);
}

export const useDoggo = useOverlay;
