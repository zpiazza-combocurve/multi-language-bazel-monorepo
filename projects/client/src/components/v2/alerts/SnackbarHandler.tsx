import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { makeStyles } from '@material-ui/core/styles';
import { ProviderContext, SnackbarKey, SnackbarProvider, SnackbarProviderProps, useSnackbar } from 'notistack';
import { useEffect } from 'react';

import IconButton from '@/components/v2/IconButton';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function getFnWrapper<F extends (...params: any[]) => any>() {
	let fnRef: F | undefined;
	const setFn = (f: F | undefined) => {
		fnRef = f;
	};
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const fn: F = (...params: Parameters<F>): ReturnType<F> => fnRef?.(...params) as any as ReturnType<F>;
	return [fn, setFn] as const;
}
const [enqueueSnackbar, setEnqueueSnackbar] = getFnWrapper<ProviderContext['enqueueSnackbar']>();
const [closeSnackbar, setCloseSnackbar] = getFnWrapper<ProviderContext['closeSnackbar']>();

// exported this way for editor autocomplete suggest the ones in alerts/index.ts
export const snackbarFns = {
	enqueueSnackbar,
	closeSnackbar,
};

function Handler() {
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();
	useEffect(() => {
		setEnqueueSnackbar(enqueueSnackbar);
		setCloseSnackbar(closeSnackbar);
		return () => {
			setEnqueueSnackbar(undefined);
			setCloseSnackbar(undefined);
		};
	}, [closeSnackbar, enqueueSnackbar]);
	return null;
}
const useStyle = makeStyles((theme) => ({
	success: { backgroundColor: theme.palette.primary.main },
}));

const SnackbarCloseButton = ({ snackbarKey }: { snackbarKey: SnackbarKey }) => {
	return (
		<IconButton size='small' color='inherit' onClick={() => closeSnackbar(snackbarKey)}>
			{faTimes}
		</IconButton>
	);
};

/** @note make sure there's only one in the whole app */
export default function SnackbarHandler(props: Omit<SnackbarProviderProps, 'children'>) {
	const classes = useStyle();
	return (
		<SnackbarProvider
			// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
			action={(snackbarKey) => <SnackbarCloseButton snackbarKey={snackbarKey} />}
			{...props}
			classes={{ variantSuccess: classes.success }}
		>
			<Handler />
		</SnackbarProvider>
	);
}
