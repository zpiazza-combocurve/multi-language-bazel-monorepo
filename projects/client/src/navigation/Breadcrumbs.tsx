import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, LinkProps, Breadcrumbs as MUIBreadcrumbs } from '@material-ui/core';
import { Suspense, useEffect, useMemo } from 'react';
import { Link as ReactRouterLink, useMatches } from 'react-router-dom';
import { create } from 'zustand';

import { counter } from '@/helpers/Counter';

import { UseMatchesMatch } from './types';

interface LinkRouterProps extends LinkProps {
	to: string;
	replace?: boolean;
}

/** @see https://v4.mui.com/components/breadcrumbs/#integration-with-react-router */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const LinkRouter = (props: LinkRouterProps) => <Link {...props} component={ReactRouterLink as any} />;

/** @deprecated */
interface IBreadcrumb {
	id: string;
	url: string;
	label: string;
	enabled?: boolean;
	icon?: IconProp;
}

export const useBreadcrumbStore = create<{
	breadcrumbs: IBreadcrumb[];
	addBreadcrumb: (breadcrumb: IBreadcrumb) => void;
	enable: (breadcrumb: IBreadcrumb) => void;
	disable: (breadcrumb: IBreadcrumb) => void;
}>((set) => ({
	breadcrumbs: [],
	addBreadcrumb: (breadcrumb) => set((state) => ({ breadcrumbs: [...state.breadcrumbs, breadcrumb] })),
	enable: (breadcrumb) =>
		set((state) => ({
			breadcrumbs: state.breadcrumbs.map((_breadcrumb) =>
				breadcrumb.id === _breadcrumb.id ? { ...breadcrumb, enabled: true } : _breadcrumb
			),
		})),
	disable: ({ id }) =>
		set((state) => ({
			breadcrumbs: state.breadcrumbs.map((breadcrumb) =>
				breadcrumb.id === id ? { ...breadcrumb, enabled: false } : breadcrumb
			),
		})),
}));

/** @deprecated */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function Breadcrumb({ url, label, children, icon }: Omit<IBreadcrumb, 'id'> & { children?: any }) {
	const { breadcrumbs, addBreadcrumb, enable, disable } = useBreadcrumbStore();
	const breadcrumbsSet = useMemo(() => new Set(breadcrumbs.map(({ id }) => id)), [breadcrumbs]);
	const id = useMemo(() => counter.nextId(), []);
	const breadcrumb = useMemo(() => ({ url, label, id, icon }), [url, label, id, icon]);
	const breadcrumbExists = breadcrumbsSet.has(id);
	useEffect(() => {
		if (!breadcrumbExists) {
			addBreadcrumb(breadcrumb);
		}
	}, [breadcrumbExists, addBreadcrumb, breadcrumb]);
	useEffect(() => {
		enable(breadcrumb);
		return () => {
			disable(breadcrumb);
		};
	}, [breadcrumb, enable, disable]);
	return children ?? null;
}

export function BreadcrumbLink({ path, label, icon }: { path: string; label: string; icon? }) {
	return (
		<LinkRouter to={path}>
			{icon && (
				<span
					css={`
						margin-right: 0.5rem;
					`}
				>
					<FontAwesomeIcon icon={icon} />
				</span>
			)}
			{label}
		</LinkRouter>
	);
}

export function Breadcrumbs() {
	const { breadcrumbs } = useBreadcrumbStore();
	const matches = useMatches() as UseMatchesMatch[];

	const reactRouterBreadcrumbs = matches
		.filter((match) => Boolean(match.handle?.breadcrumb))
		.map((match, i) => (
			<Suspense key={i} fallback={null}>
				{match.handle?.breadcrumb?.(match)}
			</Suspense>
		)) as JSX.Element[];

	return (
		<MUIBreadcrumbs
			css={`
				.MuiBreadcrumbs-separator {
					color: ${({
						theme: {
							palette: {
								primary: { main },
							},
						},
					}) => main};
				}
				.MuiBreadcrumbs-li {
					max-width: 30ch;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
			`}
		>
			{reactRouterBreadcrumbs}
			{breadcrumbs
				.filter(({ enabled }) => enabled)
				.map(({ id, label, url, icon }) => (
					<BreadcrumbLink key={`${label}-${id}`} icon={icon} label={label} path={url} />
				))}
		</MUIBreadcrumbs>
	);
}

export default Breadcrumbs;
