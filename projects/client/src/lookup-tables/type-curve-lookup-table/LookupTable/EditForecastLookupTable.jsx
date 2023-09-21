import { faCheck, faDownload, faList, faSave } from '@fortawesome/pro-regular-svg-icons';
import styled from 'styled-components';

import { SUBJECTS } from '@/access-policies/Can';
import { usePermissionsBuilder } from '@/access-policies/usePermissions';
import { Button, Paper } from '@/components/v2';
import { StandardLookupTable } from '@/lookup-tables/components/standard-lookup-table/StandardLookupTable';
import { SubmitableTextField } from '@/lookup-tables/components/standard-lookup-table/SubmitableTextField';
import { getUpdatedRulesFromCount } from '@/lookup-tables/shared/utils';

const Container = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
	padding: 1rem;
`;

const Topbar = styled(Paper)`
	display: flex;
	flex: 0 0 auto;
	padding: 0.5rem;
	align-items: center;
	& > *:not(:first-child) {
		margin-left: 0.5rem;
	}
`;

const TableContainer = styled.div`
	flex: 1 1 0;
	overflow: auto;
	margin-top: 1rem;
`;

export default function EditForecastLookupTable({
	lookupTable,
	selectHeaders,
	saveLookup,
	headerColumns,
	assignmentColumns,
	rules,
	setRules,
	assignmentKeys,
	validateLookupTable,
	downloadAssumptions,
	minRules,
	maxRules,
}) {
	const { canUpdate } = usePermissionsBuilder(SUBJECTS.LookupTables);
	return (
		<Container>
			<Topbar>
				<Button onClick={selectHeaders} startIcon={faList}>
					Headers
				</Button>
				<Button onClick={downloadAssumptions} startIcon={faDownload}>
					Assumptions
				</Button>
				<Button onClick={validateLookupTable} startIcon={faCheck}>
					Validate
				</Button>
				<Button
					color='primary'
					variant='outlined'
					onClick={saveLookup}
					startIcon={faSave}
					disabled={!canUpdate(lookupTable)}
				>
					Save
				</Button>
				<SubmitableTextField
					css={`
						&& {
							margin-left: 1.5rem;
						}
					`}
					label='Rows'
					type='number'
					value={rules.length}
					minValue={minRules}
					maxValue={maxRules}
					onSubmit={(value) => setRules((prevRules) => getUpdatedRulesFromCount(prevRules, value))}
					disabled={!canUpdate(lookupTable)}
				/>
			</Topbar>
			<TableContainer>
				<StandardLookupTable
					headerColumns={headerColumns}
					assignmentColumns={assignmentColumns}
					rules={rules}
					setRules={setRules}
					assignmentKeys={assignmentKeys}
				/>
			</TableContainer>
		</Container>
	);
}
