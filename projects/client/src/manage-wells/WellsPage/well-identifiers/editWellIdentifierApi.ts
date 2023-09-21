import { getApi, postApi } from '@/helpers/routing';

type DataSource = 'di' | 'ihs' | 'phdwin' | 'aries' | 'internal' | 'other';
type IdField = 'inptID' | 'api10' | 'api12' | 'api14' | 'aries_id' | 'phdwin_id';

export interface WellIdentifiersUpdate {
	project?: null | Inpt.ObjectId;
	dataSource?: DataSource;
	chosenID?: IdField;
}

export async function validateIdentifiersChange(data) {
	return postApi(`/well/validateIdentifiersChange`, data);
}

export async function validateScopeToProject(data) {
	return postApi(`/well/validateScopeToProject`, data);
}

export async function changeScopeFromProjectToCompany(data: {
	wells: Inpt.ObjectId[];
	validationDocId: Inpt.ObjectId;
}) {
	return postApi('/well/changeScopeToCompany', data);
}

export async function generateCollisionReport(data: { collisions: Inpt.ObjectId[] }) {
	return postApi('/well/generateCollisionReport', data);
}

export async function generateMissingIdReport(data: { wells: string[] }) {
	return postApi('/well/generateMissingIdReport', data);
}

export async function changeDataSource(data: {
	wells: Inpt.ObjectId[];
	dataSource: DataSource;
	validationDocId: Inpt.ObjectId;
}) {
	return postApi('/well/changeDataSource', data);
}

export async function changeChosenId(data: {
	wells: Inpt.ObjectId[];
	chosenID: IdField;
	getWellsWithMissingIdentifier?: boolean;
	validationDocId: Inpt.ObjectId;
}) {
	return postApi('/well/changeChosenID', data);
}

export async function getValidationResult(id: string) {
	return getApi(`/well/validationResult/${id}`);
}

export async function disableValidationNotifications() {
	return postApi('/well/disableValidationNotifications');
}
