import { useEffect, useState } from 'react';

import { failureAlert } from '@/helpers/alerts';
import { deleteApi, getApi, postApi } from '@/helpers/routing';

type Credential = {
	apiKeyName: string;
	createdAt: Date;
	createdBy: { firstName?: string; lastName?: string };
	serviceAccountKeyId: string;
};

type CredentialWithFile = Credential & {
	file: string;
};

export const useApiProvision = () => {
	const [initialStep, setInitialStep] = useState(-1);
	const [credentials, setCredentials] = useState<Credential[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const withLoading = async (prom) => {
		try {
			setIsLoading(true);
			const response = await prom;
			setIsLoading(false);
			return response;
		} catch (e) {
			setIsLoading(false);
			failureAlert('The operation failed. Wait a few seconds and try again.');
			throw e;
		}
	};

	const getProvision = async () => {
		const { provisioned } = await withLoading(getApi('/api-provisioner/provision'));
		return provisioned;
	};

	const downloadCredential = (fileUrl) => {
		window.open(fileUrl, '_self');
	};

	const getCredentials = async () => {
		const credentials = await withLoading(getApi('/api-provisioner/credentials'));
		setCredentials(credentials);
	};

	const enableProvision = async () => {
		await withLoading(postApi('/api-provisioner/provision'));
	};

	const createCredential = async () => {
		const response: CredentialWithFile = await withLoading(postApi('/api-provisioner/credentials'));
		// Download the credential file
		downloadCredential(response.file);
		await getCredentials();
	};

	const revokeCredential = async ({ apiKeyName, serviceAccountKeyId }) => {
		await withLoading(deleteApi('/api-provisioner/credentials', { apiKeyName, serviceAccountKeyId }));
		await getCredentials();
	};

	useEffect(() => {
		const initialCheck = async () => {
			let initial = 0;
			const provisioned = await getProvision();
			if (provisioned) {
				await getCredentials();
			}
			if (provisioned) initial = initial + 1;
			setInitialStep(initial);
		};
		initialCheck();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return {
		isLoading,
		credentials,
		enableProvision,
		createCredential,
		revokeCredential,
		initialStep,
	};
};
