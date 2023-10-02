import { Router } from 'express';

import { serviceResolver } from '@src/middleware/service-resolver';

import { ApiContextV1 } from '../context';

import { getWellMappings } from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('wellMappingService'));

router.get('/', getWellMappings);

export default router;
