import bigquery from '@google-cloud/bigquery/build/src/types';
import { isEmpty } from 'lodash';
import { Job } from '@google-cloud/bigquery';

import { ValidationError } from './validation';

const GENERIC_NOT_FOUND_ERROR_NAME = {
	name: 'ExportNotFoundError',
	message: 'Export not found',
};

export class JobExpiredError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message || GENERIC_NOT_FOUND_ERROR_NAME.message, location, GENERIC_NOT_FOUND_ERROR_NAME.name, statusCode);
	}
}

export class InvalidJobAccessError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message || GENERIC_NOT_FOUND_ERROR_NAME.message, location, GENERIC_NOT_FOUND_ERROR_NAME.name, statusCode);
	}
}

const JOB_TTL = 24 * 60 * 60 * 1000; // 1 day

const validateJobExpirationTime = (jobMetadata: bigquery.IJob) => {
	const creationTime = jobMetadata.statistics?.creationTime && new Date(jobMetadata.statistics?.creationTime);
	if (creationTime && creationTime.getTime() + JOB_TTL < Date.now()) {
		throw new JobExpiredError();
	}
};

const validateRequiredLabels = (jobMetadata: bigquery.IJob, requiredLabels: { [key: string]: string }) => {
	if (!isEmpty(requiredLabels) && isEmpty(jobMetadata.configuration?.labels)) {
		throw new InvalidJobAccessError();
	}
	const currentLabels = jobMetadata.configuration?.labels as { [key: string]: string };
	if (Object.entries(requiredLabels).some(([key, value]) => !currentLabels[key] || currentLabels[key] != value)) {
		throw new InvalidJobAccessError();
	}
};

export const validateQueryJob = (job: Job, requiredLabels: { [key: string]: string }): void => {
	const metadata = job.metadata as bigquery.IJob;
	validateJobExpirationTime(metadata);
	validateRequiredLabels(metadata, requiredLabels);
};
