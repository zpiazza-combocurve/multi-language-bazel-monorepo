import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { projectResolver } from '@src/middleware/project-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	getProjectMonthlyProduction,
	getProjectMonthlyProductionHead,
	postProjectMonthlyProduction,
	putProjectMonthlyProduction,
} from './controllers';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('projectMonthlyProductionService'));
router.use(projectResolver());

router.head('/', getProjectMonthlyProductionHead);
router.get('/head', getProjectMonthlyProductionHead);
router.get('/', getProjectMonthlyProduction);
router.post('/', postProjectMonthlyProduction);
router.put('/', putProjectMonthlyProduction);

export default router;
