import { useCallback, useState } from 'react';
import * as React from 'react';

import { RenderProp, renderProp } from '@/components/shared';

import { dispatchComponent } from './global-components';
import { SyncResolver, resolveSyncValue } from './promise';

const DEFAULT_STATE = {
	visible: false,
	resolve: () => {
		// do nothing
	},
	onHide: () => {
		// do nothing
	},
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type DialogProps<T = any> = {
	resolve: (value: T | null) => void;
	visible: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onHide: (...args: any[]) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type DialogLikeProps<T = any> = {
	resolve: (value: T | null, _id?: string) => void;
	visible?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onHide?: (...args: any[]) => void;
};

type DialogPropsKeys = 'visible' | 'resolve' | 'onHide';

export type DialogOnlyProps<P extends DialogLikeProps> = Pick<P, DialogPropsKeys>;
export type ComponentOnlyProps<P extends DialogLikeProps> = Omit<P, DialogPropsKeys>;
export type ResolveType<P extends DialogLikeProps> = Parameters<P['resolve']>[0];

// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
export type ConfirmFn<P extends DialogLikeProps = DialogLikeProps> = {} extends ComponentOnlyProps<P>
	? (props?: SyncResolver<ComponentOnlyProps<P>, [DialogProps<ResolveType<P>>]>) => Promise<ResolveType<P>>
	: (props: SyncResolver<ComponentOnlyProps<P>, [DialogProps<ResolveType<P>>]>) => Promise<ResolveType<P>>;

/**
 * Custom backdropClose handler for dialogues not utilizing useDialog/useVisibleDialog or have a custom hide event
 *
 * @param event
 * @param reason
 * @param onHide
 * @returns
 */
export const handleBackdropClose = (event, reason, onHide) => {
	if (reason && reason === 'backdropClick') return;
	onHide();
};

export function useDialogProps<P extends DialogLikeProps = DialogLikeProps>(
	disableBackdropClick: boolean
): { confirm: ConfirmFn<P>; props: P } {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [props, setProps] = useState<P>(DEFAULT_STATE as any);

	const confirm = useCallback(
		(morePropsOrFunc?: SyncResolver<ComponentOnlyProps<P>, [DialogOnlyProps<P>]>) => {
			return new Promise<ResolveType<P>>((resolve) => {
				const onHide = (event?, reason?) => {
					if (disableBackdropClick && reason && reason === 'backdropClick') return;
					resolve(null);
				};
				const moreProps = resolveSyncValue(morePropsOrFunc, { resolve, onHide, visible: true });
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				setProps({ resolve, onHide, visible: true, ...moreProps });
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			}).finally(() => setProps(DEFAULT_STATE as any));
		},
		[disableBackdropClick]
	);

	// TODO [typescript] find out how to not ignore error below
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	return { props, confirm };
}

/**
 * @example
 * 	function MyDialog({ visible, resolve, onHide, ...OTHER_PROPS }) {
 * 		return (
 * 			<Dialog
 * 				visible={visible}
 * 				onHide={onHide}
 * 				actions={[
 * 					{ children: 'Cancel', onClick: onHide },
 * 					{ children: 'Apply', onClick: () => resolve(VALUE_RESOLVED) },
 * 				]}
 * 			/>
 * 		);
 * 	}
 *
 * 	function Component() {
 * 		const [dialog, confirmDialog] = useVisibleDialog(MyDialog);
 *
 * 		const doAction = async () => {
 * 			const OTHER_PROPS = { anyOtherPropsToPassToTheDialog: 'yes' };
 * 			const VALUE_RESOLVED = await confirmDialog(OTHER_PROPS);
 * 			// if VALUE_RESOLVED is null means the user dismissed the dialog
 * 			if (!VALUE_RESOLVED) {
 * 				return;
 * 			}
 * 			// handle VALUE_RESOLVED
 * 		};
 *
 * 		return (
 * 			<>
 * 				{dialog}
 * 				<button onClick={doAction} />
 * 			</>
 * 		);
 * 	}
 */
export function useVisibleDialog<P extends DialogLikeProps, POriginal extends Partial<P> | undefined>(
	Component: React.ComponentType<P>,
	originalProps?: POriginal,
	disableBackdropClick = true
) {
	type RequiredNonDialogProps = Omit<P, keyof POriginal>;
	type OwnDialogProps = Pick<P, DialogPropsKeys>;
	const { props, confirm } = useDialogProps<RequiredNonDialogProps & OwnDialogProps & Partial<POriginal>>(
		disableBackdropClick
	);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const wrapper = <Component {...originalProps} {...props} />;
	return [wrapper, confirm, props] as const;
}

/**
 * Same as useVisibleDialog but will not mount the react component if it is not visible, it has implications in the
 * dialogs componentDidMount/componentDidUpdate
 *
 * @see useVisibleDialog
 */
export function useDialog<P extends DialogLikeProps, POriginal extends Partial<P> | undefined>(
	Component: React.ComponentType<P>,
	originalProps?: POriginal,
	disableBackdropClick = true
) {
	const [wrapper, confirm, props] = useVisibleDialog(Component, originalProps, disableBackdropClick);
	return [props.visible ? wrapper : null, confirm, props] as const;
}

/**
 * Render props version
 *
 * @example
 * 	function MyDialog({ visible, resolve, onHide, ...OTHER_PROPS }) {
 * 		// rest of the implementation
 * 	}
 *
 * 	function Component() {
 * 		return (
 * 			<WithUseDialog Component={MyDialog}>
 * 				{({ confirm: doAction }) => <button onClick={doAction} />}
 * 			</WithUseDialog>
 * 		);
 * 	}
 */
export function WithUseDialog<
	P extends DialogLikeProps,
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	POriginal extends Partial<Omit<P, 'Component' | 'children'>> | {}
>({
	Component,
	children,
	...props
}: {
	Component: React.ComponentType<P>;
	children: SyncResolver<React.ReactNode, [{ confirm: ConfirmFn<P> }]>;
} & POriginal) {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const [dialog, confirm] = useVisibleDialog(Component, props);
	return (
		<>
			{dialog}
			{resolveSyncValue(children, { confirm }) ?? null}
		</>
	);
}

/**
 * Creates an dialog function helper
 *
 * @example
 * 	import ConfirmDialog from './ConfirmDialog';
 *
 * 	const confirm = withDialog(ConfirmDialog);
 *
 * 	function TestComponent() {
 * 		const handleSave = async () => {
 * 			if (await confirm({ title: 'Are you sure?' })) {
 * 				goAhead();
 * 			}
 * 		};
 * 		return <button onClick={handleSave} />;
 * 	}
 */
export function withDialog<P extends DialogLikeProps>(Component: React.ComponentType<P>) {
	return async (props: ComponentOnlyProps<P>): Promise<ResolveType<P>> => {
		return new Promise((resolve) => {
			dispatchComponent((unmount) => {
				const handleResolve = (value) => {
					unmount();
					resolve(value);
				};
				const handleOnHide = () => {
					handleResolve(null);
				};
				return (
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					<Component resolve={handleResolve} onHide={handleOnHide} visible {...props} />
				);
			});
		});
	};
}

/**
 * Similar to `withDialog` but will keep the dialog mounted. This is needed because some of the dialogs will crash if
 * they are mounted and visible the first time they are rendered, they should be fixed but it's easier to do this for
 * now
 */
export function withStaticDialog<P extends DialogLikeProps>(
	Component: React.ComponentType<P>,
	disableBackdropClick = true
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	let confirmFn = null as any;
	function Handler() {
		const { props, confirm } = useDialogProps<P>(disableBackdropClick);
		confirmFn = confirm;
		return <Component {...props} />;
	}
	dispatchComponent(<Handler />);
	return (props: ComponentOnlyProps<P>): Promise<ResolveType<P>> => confirmFn(props);
}

/** @deprecated Use `withDialog` or `withStaticDialog` instead */
export function createDialogHelper<P extends DialogLikeProps>(
	DialogComponent: React.ComponentType<P>,
	{ keepMounted = true } = {}
) {
	const showDialog = keepMounted ? withStaticDialog(DialogComponent) : withDialog(DialogComponent);
	return function useHelper() {
		return showDialog;
	};
}

type DialogHandlerProps<P extends DialogLikeProps> = {
	dialog: React.ComponentType<P>;
	children: RenderProp<ConfirmFn>;
} & ComponentOnlyProps<P>;

/**
 * `useDialog` for class components
 *
 * @example
 * 	function MyDialog(props: DialogProps) {
 * 		// snip
 * 	}
 *
 * 	class MyComponent {
 * 		render() {
 * 			return (
 * 				<DialogHandler dialog={MyDialog}>
 * 					{(showMyDialog) => <button onClick={() => showMyDialog()}>show dialog</button>}
 * 				</DialogHandler>
 * 			);
 * 		}
 * 	}
 */
export function DialogHandler<P extends DialogLikeProps>({ dialog: Dialog, children, ...rest }: DialogHandlerProps<P>) {
	const [dialog, confirm] = useDialog(
		Dialog,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		rest
	);
	return (
		<>
			{dialog}
			{renderProp(
				children,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				confirm
			)}
		</>
	);
}

/**
 * `useVisibleDialog` for class components
 *
 * @example
 * 	function MyDialog(props: DialogProps) {
 * 		// snip
 * 	}
 *
 * 	class MyComponent {
 * 		render() {
 * 			return (
 * 				<DialogHandler dialog={MyDialog}>
 * 					{(showMyDialog) => <button onClick={() => showMyDialog()}>show dialog</button>}
 * 				</DialogHandler>
 * 			);
 * 		}
 * 	}
 *
 * @see useVisibleDialog
 */
export function VisibleDialogHandler<P extends DialogLikeProps>({
	dialog: Dialog,
	children,
	...rest
}: DialogHandlerProps<P>) {
	const [dialog, confirm] = useVisibleDialog(
		Dialog,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		rest
	);
	return (
		<>
			{dialog}
			{renderProp(
				children,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				confirm
			)}
		</>
	);
}
