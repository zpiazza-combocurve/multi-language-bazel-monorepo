/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
import { ComponentType, forwardRef, useCallback, useRef } from 'react';
import {
	ControllerFieldState,
	ControllerRenderProps,
	FieldErrorsImpl,
	FieldName,
	FieldValues,
	UseControllerProps,
	UseControllerReturn,
	useController,
	useFormContext,
} from 'react-hook-form';

import { useFieldName } from '@/components/Prefix';
import { addHOCName } from '@/components/shared';

const CONTROL_PROPS_KEYS = ['defaultValue', 'name', 'rules', 'shouldUnregister'];

/**
 * Helper to make all the components using react-hook-form have the same structure
 *
 * @note `control` property must always either be passed or not, but cannot change in subsequent renders because of rule of hooks
 */
export function withRHFControl<
	P,
	FSP extends Partial<P>,
	// @ts-expect-error // the downside to this is that some components that doesn't have all the properties (onBlur, onChange, etc) those properties will still be passed and could in some cases have unwanted side effects, it should be fine for most cases no need to worry about it too much
	FP extends Partial<P> = UseControllerReturn<any>['field']
>(
	Component: ComponentType<P>,
	{
		getPropsFromFieldState,
		getPropsFromField = _.identity,
		defaultValue = '',
	}: {
		getPropsFromFieldState?(fieldState: ControllerFieldState): FSP;
		getPropsFromField?(field: ControllerRenderProps): FP;
		defaultValue?: any;
	} = {}
) {
	type WithControllerProps<T extends FieldValues = any> = Omit<UseControllerProps<T>, 'control'> &
		Omit<P, keyof UseControllerProps<any> | keyof FP> & {
			control?: UseControllerProps<T>['control'];
		} & {
			value?;
		};

	function WithController<T extends FieldValues = any>(props: WithControllerProps<T>, ref) {
		const name = useFieldName(props.name as any);
		const controlProps = { ...(_.pick(props, CONTROL_PROPS_KEYS) as any as UseControllerProps), name };
		const fieldProps = _.omit(props, CONTROL_PROPS_KEYS) as P;
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const { control } = 'control' in props ? props : useFormContext();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		const { field, fieldState } = useController({ ...controlProps, control });

		return (
			<Component
				ref={ref}
				{...fieldProps}
				{...getPropsFromField({ ...field, value: props?.value ?? field.value ?? defaultValue })} // will force it into a controlled state
				{...getPropsFromFieldState?.(fieldState)}
			/>
		);
	}
	return addHOCName(forwardRef(WithController), 'withController', Component) as any as <T extends FieldValues = any>(
		props: WithControllerProps<T>
	) => JSX.Element;
}

/**
 * Helper to get the names of all paths to fields with errors based on the errors object provided by formState from
 * useForm
 */
export function getErrorPaths<T extends FieldValues>(errors: Partial<FieldErrorsImpl<T>>): Array<FieldName<T>> {
	const paths: Array<FieldName<T>> = [];
	const recursePaths = (obj) => {
		const objKeys = _.keys(obj);
		for (let i = 0; i < objKeys.length; i++) {
			const key = objKeys[i];
			if (obj[key]?.ref) {
				paths.push(obj[key].ref.name);
			} else {
				recursePaths(obj[key]);
			}
		}
	};

	recursePaths(errors);
	return paths;
}

/** Simple cache that sets the exact error paths */
export function useErrorsCache() {
	const cache = useRef<Record<string, any>>({});

	const set = useCallback(
		<T extends FieldValues>(
			key: string,
			errors: Partial<FieldErrorsImpl<T>>,
			filter: (value) => any = _.identity
		) => {
			const paths = _.filter(getErrorPaths(errors), filter);
			cache.current[key] = paths;
		},
		[]
	);

	const get = useCallback((key: string) => cache.current[key], []);

	return { set, get };
}
