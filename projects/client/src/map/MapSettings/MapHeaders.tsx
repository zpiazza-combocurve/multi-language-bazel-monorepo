import { faChevronDown, faLocation } from '@fortawesome/pro-regular-svg-icons';
import { Accordion, AccordionDetails, AccordionSummary } from '@material-ui/core';
import { Component, createRef } from 'react';
import styled from 'styled-components';

import { Icon, IconButton, SwitchField } from '@/components/v2';
import { AlfaStore, subscribe } from '@/helpers/alfa';
import { withWellHeaders } from '@/helpers/headers';
import MapLayers from '@/map/MapLayers';

import { ExportMap } from '../ExportMap';
import { MapShortcutsFloater } from '../MapShortcutsFloater';
import { withMapHeaderSettings } from '../hooks';
import { getProjectFilter } from '../shared';
import HeaderColorsList from './HeaderColorList';
import MapLabelSelect from './MapLabelSelect';
import SizeBySettings from './SizeBySettings';

import '../map.scss';

interface MapHeadersProps extends Pick<AlfaStore, 'project'> {
	wellDisplay;
	layersToShow;
	setWellsDisplay;
	toggleLayerActive;
	projectScope;
	setProjectScope;
}

interface MapHeadersState {
	keys: string[];
	mapLabelHeader;
	indexSelected: number;
	visible: boolean;
	valueHeader: string;
	filterValues: [];
	selectedColor: null;
	colorsFilter: [];
}

const MapSettingsSidebar = styled.div`
	width: 15%;
	overflow-x: hidden;
	overflow-y: auto;
`;

const MapSettingsSidebarSection = styled.div`
	width: 100%;

	& > :not(:first-child) {
		margin-top: 0.5rem;
	}
`;

class MapHeaders extends Component<MapHeadersProps, MapHeadersState> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	mapLayersRef = createRef<any>();

	state = {
		// TODO check for unused state
		keys: [],
		mapLabelHeader: undefined,
		indexSelected: -1,
		visible: false,
		valueHeader: '',
		selectedColor: null,
		filterValues: [],
		colorsFilter: [],
	} as MapHeadersState;

	centerMap = () => {
		this.mapLayersRef.current?.mapRef.current?.centerMap();
	};

	render() {
		const {
			project,
			wellDisplay,
			layersToShow,
			setWellsDisplay,
			toggleLayerActive,
			projectScope,
			setProjectScope,
		} = this.props;

		const wellCount = projectScope ? project?.wells?.length : undefined;

		const filters = projectScope && project ? [getProjectFilter(project)] : [];

		return (
			<>
				<MapSettingsSidebar>
					<Accordion>
						<AccordionDetails>
							<SwitchField
								label='Scope to current project'
								checked={projectScope}
								onChange={(e) => setProjectScope(e.target.checked)}
								disabled={!project}
							/>
						</AccordionDetails>
					</Accordion>
					<Accordion>
						<AccordionDetails>
							{/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later */}
							<MapLabelSelect project={project as any} />
						</AccordionDetails>
					</Accordion>
					<Accordion>
						<AccordionSummary expandIcon={<Icon>{faChevronDown}</Icon>}>Wells Size</AccordionSummary>
						<AccordionDetails>
							<MapSettingsSidebarSection>
								{/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later */}
								<SizeBySettings project={project as any} filters={filters} />
							</MapSettingsSidebarSection>
						</AccordionDetails>
					</Accordion>
					<Accordion>
						<AccordionSummary expandIcon={<Icon>{faChevronDown}</Icon>}>Wells Color</AccordionSummary>
						<AccordionDetails>
							<MapSettingsSidebarSection>
								{/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later */}
								<HeaderColorsList project={project as any} filters={filters} />
							</MapSettingsSidebarSection>
						</AccordionDetails>
					</Accordion>
				</MapSettingsSidebar>

				<section id='map-settings-main'>
					<h2
						css={`
							display: flex;
							gap: ${({ theme }) => theme.spacing(1)}px;
							flex: 0;
							align-items: baseline;
							width: 100%;
							margin-bottom: 0.5rem;
						`}
					>
						<span>{`${wellCount ?? 'All'} Wells `}</span>
						{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
						<IconButton size='small' tooltipTitle='Center on Wells' onClick={this.centerMap}>
							{faLocation}
						</IconButton>
						<div css={{ flexGrow: 1 }} />
						<MapShortcutsFloater />
						<ExportMap mapLayersRef={this.mapLayersRef} />
					</h2>
					<div id='map-settings-map-container'>
						<MapLayers
							css={`
								width: 100%;
								height: 100%;
							`}
							ref={this.mapLayersRef}
							mapVisible
							filterCount={wellCount}
							wellDisplay={wellDisplay}
							setWellsDisplay={setWellsDisplay}
							layersToShow={layersToShow}
							toggleLayerActive={toggleLayerActive}
							appliedFilters={filters}
							showDraw
						/>
					</div>
				</section>
			</>
		);
	}
}

export type MapHeadersComponent = MapHeaders;
export default subscribe(withMapHeaderSettings(withWellHeaders(MapHeaders)), ['project']);
