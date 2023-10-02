import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { scenarioResolver } from '@src/middleware/scenario-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import { getEconRunById, getEconRuns, getEconRunsHead } from './controllers';
import econMonthly from './monthly-exports/routes';
import econRunData from './one-liners/routes';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('econRunService'));
router.use(scenarioResolver());

router.use('/:econRunId/monthly-exports', econMonthly);

router.use('/:econRunId/one-liners', econRunData);

router.head('/', getEconRunsHead);
router.get('/head', getEconRunsHead);
router.get('/', getEconRuns);
router.get('/:id', getEconRunById);

export default router;
