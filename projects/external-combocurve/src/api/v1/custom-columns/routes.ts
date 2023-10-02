import { Router } from 'express';

import { serviceResolver } from '@src/middleware/service-resolver';

import { ApiContextV1 } from '../context';

import { getCollectionCustomColumns } from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('customColumnService'));

router.get('/:collection', getCollectionCustomColumns);

export default router;
