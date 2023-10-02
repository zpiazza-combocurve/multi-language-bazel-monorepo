import express from 'express';

import { contentTypeValidation } from '@src/middleware/content-type-validation';
import { dbResolver } from '@src/middleware/db-resolver';
import { tenantResolver } from '@src/middleware/tenant-resolver';

import v1 from './v1';

const api = express();

api.use(tenantResolver());
api.use(dbResolver());
api.use(contentTypeValidation());

api.use('/v1', v1);

export default api;
