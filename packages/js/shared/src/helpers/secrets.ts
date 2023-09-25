import { SecretManagerClient } from 'combocurve-utils/secret-manager';

import config from '../config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
// @ts-expect-error
export const secretsClient = new SecretManagerClient(config.gcpPrimaryProjectId);
