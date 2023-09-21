// import { useState } from 'react';

// import { Collapse, Table, TableCell, TableHead, TableRow } from '@/components/v2';
// import { FieldHeader } from '@/forecasts/forecast-form/phase-form/layout';

// const ValidationPage = ({ missingWells = [], unmatchedWells = [], invalidImport = false }) => {
// 	const [unmatchedOpen, setUnmatchedOpen] = useState(false);
// 	const toggleUnmatchedOpen = () => setUnmatchedOpen(!unmatchedOpen);

// 	const [missingOpen, setMissingOpen] = useState(false);
// 	const toggleMissingOpen = () => setMissingOpen(!missingOpen);
// 	if (invalidImport) {
// 		return (
// 			<>
// 				<div>Invalid Import</div>
// 				<p>Checkout out how to export the file here</p>
// 			</>
// 		);
// 	}
// 	return (
// 		<>
// 			<FieldHeader label='Unmatched Well Identifiers' open={unmatchedOpen} toggleOpen={toggleUnmatchedOpen} />
// 			<Collapse in={unmatchedOpen} timeout='auto' css='min-height: unset !important'>
// 				<Table>
// 					<TableHead>
// 						<TableRow>
// 							<TableCell>Upload Source Id</TableCell>
// 						</TableRow>
// 					</TableHead>
// 				</Table>
// 			</Collapse>
// 			<FieldHeader label='Missing from Forecast' open={missingOpen} toggleOpen={toggleMissingOpen} />
// 			<Collapse in={missingOpen} timeout='auto' css='min-height: unset !important'>
// 				<Table>
// 					<TableHead>
// 						<TableRow>
// 							<TableCell>Chosen Id</TableCell>
// 							<TableCell>Well Name</TableCell>
// 							<TableCell>Upload Source Id</TableCell>
// 						</TableRow>
// 					</TableHead>
// 				</Table>
// 			</Collapse>
// 		</>
// 	);
// };

// export default ValidationPage;
