import { Router } from 'express';

import { serviceResolver } from '@src/middleware/service-resolver';

import { ApiContextV1 } from '../context';

import { getEconRunById, getEconRuns, getEconRunsHead } from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('econRunService'));

router.head('/', getEconRunsHead);
router.get('/head', getEconRunsHead);
router.get('/', getEconRuns);
router.get('/:id', getEconRunById);

export default router;
