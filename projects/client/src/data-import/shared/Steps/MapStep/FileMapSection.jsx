import { memo, useCallback } from 'react';
import styled from 'styled-components';

import { FieldSection } from './FieldSection';

const MAPPINGS_FILE = 'file_headers';
const MAPPINGS_CC = 'cc_headers';

const MappingSection = styled.div`
	display: flex;
	flex-grow: 1;
	height: 100%;
	${({ hidden }) => hidden && 'display: none;'}
`;

export const FileMapSection = memo(({ fileIds, ccIds, fileData, ccData, mapHeader, hidden, tooltipText }) => {
	const mapFile = useCallback(
		({ from: { data: fromId }, to: { data: toId } }) => mapHeader(fromId, toId),
		[mapHeader]
	);

	const mapCC = useCallback(({ from: { data: fromId }, to: { data: toId } }) => mapHeader(toId, fromId), [mapHeader]);

	const resetCC = useCallback((id) => mapHeader(id, null), [mapHeader]);
	const resetFile = useCallback((id) => mapHeader(fileData[id]?.mappedHeader, null), [mapHeader, fileData]);

	return (
		<MappingSection hidden={hidden}>
			<FieldSection
				ids={fileIds}
				data={fileData}
				otherData={ccData}
				resetMapping={resetFile}
				onDrop={mapFile}
				description='File Columns (Drag)'
				type={MAPPINGS_FILE}
				accept={MAPPINGS_CC}
			/>
			<FieldSection
				ids={ccIds}
				data={ccData}
				otherData={fileData}
				resetMapping={resetCC}
				onDrop={mapCC}
				description='ComboCurve Fields (Drop)'
				type={MAPPINGS_CC}
				accept={MAPPINGS_FILE}
				tooltipText={tooltipText}
			/>
		</MappingSection>
	);
});
