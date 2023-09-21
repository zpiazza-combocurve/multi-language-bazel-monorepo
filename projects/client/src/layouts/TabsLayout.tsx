import classNames from 'classnames';
import { Children, ReactNode, useState } from 'react';
import { Navigate, Route, Routes, useMatch, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import ErrorBoundary from '@/components/ErrorBoundary';
import { Button } from '@/components/v2';
import { RouteGuard } from '@/helpers/guards';
import NotFound from '@/not-found/not-found';
import { useCurrentProject } from '@/projects/api';
import { projectRoutes } from '@/projects/routes';
import { URLS } from '@/urls';

import { Section, SectionContent, SectionHeader } from './Section';

import './TabsLayout.scss';

const SpacedSectionHeader = styled(SectionHeader)`
	display: flex;
	justify-content: space-around;
`;

function TabStyled({ isActive, ...props }) {
	return (
		<div className={classNames('__inpt_tabs_layout_tab', isActive && 'active')}>
			<Button {...props} />
		</div>
	);
}

export function TabsLayout({
	active: active_ = undefined,
	onChange = undefined,
	children,
	default: def,
	...props
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
any) {
	let [active, setActive] = useState(def);

	if (onChange) {
		active = active_;
		setActive = onChange;
	}

	const tabs = Children.map(children, ({ props: { name, label } }) => {
		return (
			<TabStyled isActive={name === active} onClick={() => setActive(name)}>
				{label}
			</TabStyled>
		);
	});

	const content = Children.map(children, ({ props: { name, children: child } }) => active === name && child);
	return (
		<Section {...props}>
			<SpacedSectionHeader>{tabs}</SpacedSectionHeader>
			<SectionContent>{content}</SectionContent>
		</Section>
	);
}

interface TabProps {
	name: string;
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	children: any;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Tab(props: TabProps) {
	return null;
}

function RoutedTabStyled({ tabPath, ...props }) {
	const navigate = useNavigate();
	const project = useCurrentProject();
	const matchUrl = project?.data
		? `${projectRoutes.project(':id').dataImport(':fileImportId').root}/:tab`
		: `${URLS.dataImports}/:fileImportId/:tab`;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const match = useMatch<any, any>(matchUrl);
	const isActive = tabPath === match?.params?.tab;

	return (
		<div className={classNames('__inpt_tabs_layout_tab', isActive && 'active')}>
			<Button onClick={() => navigate(tabPath)} {...props} />
		</div>
	);
}

interface TabItem {
	path: string;
	label: string;
	exact?: boolean;
	component?;
	render?;
	disabled?: boolean;
}

interface RoutedTabsLayout {
	className?: string;
	header: ReactNode;
	default: string;
	tabs: TabItem[];
}

export function RoutedTabsLayout({ header, default: defaultTab, tabs: links, ...props }: RoutedTabsLayout) {
	const project = useCurrentProject();
	const matchUrl = project?.data
		? `${projectRoutes.project(':id').dataImport(':fileImportId').root}/*`
		: `${URLS.dataImports}/:fileImportId/*`;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const match = useMatch<any, any>(matchUrl);
	const fileImportId = match?.params?.fileImportId;

	return (
		<Section {...props}>
			{header}
			<SpacedSectionHeader>
				{links.map(({ path, label, component: _component, ...prups }) => (
					<RoutedTabStyled key={path} tabPath={path} {...prups}>
						{label}
					</RoutedTabStyled>
				))}
			</SpacedSectionHeader>
			<SectionContent>
				<Routes>
					{defaultTab && (
						<Route
							path=''
							element={
								<RouteGuard>
									<Navigate to={defaultTab} replace />
								</RouteGuard>
							}
						/>
					)}
					{links.map(({ path, render, component: _component, ...link }) => (
						<Route
							key={path}
							path={`${path}/*`}
							element={
								<RouteGuard {...link}>
									<ErrorBoundary>{render?.({ _id: fileImportId })}</ErrorBoundary>
								</RouteGuard>
							}
						/>
					))}
					<Route element={<NotFound />} />
				</Routes>
			</SectionContent>
		</Section>
	);
}
