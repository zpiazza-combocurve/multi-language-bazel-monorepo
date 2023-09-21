import { faDownload, faList } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { useRef } from 'react';

import { Placeholder } from '@/components';
import { Selection } from '@/components/hooks/useSelection';
import { IconButton, Typography } from '@/components/v2';
import TypeCurveWellTable from '@/type-curves/TypeCurveView/TypeCurveWellTable';

import { FormTitle } from '../shared/formLayout';

function TypeCurveView({ typeCurveId, selection }: { typeCurveId: string; selection: Selection }) {
	const tableRef = useRef<{
		selectHeaders(): void;
		downloadTable(): void;
	}>({ selectHeaders: _.noop, downloadTable: _.noop });

	return (
		<Placeholder minShow={50} minHide={500} forceOnFirstRender>
			<FormTitle>
				<Typography css='font-weight: 500;' variant='body1'>
					Wells Table
				</Typography>

				<div
					css={`
						align-items: center;
						column-gap: 0.5rem;
						display: flex;
					`}
				>
					<IconButton onClick={() => tableRef.current.selectHeaders()} size='small'>
						{faList}
					</IconButton>

					<IconButton onClick={() => tableRef.current.downloadTable()} size='small'>
						{faDownload}
					</IconButton>
				</div>
			</FormTitle>

			<TypeCurveWellTable isProximity={false} ref={tableRef} selection={selection} typeCurveId={typeCurveId} />
		</Placeholder>
	);
}

export default TypeCurveView;
