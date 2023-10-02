import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { projectResolver } from '@src/middleware/project-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	getProjectDailyProduction,
	getProjectDailyProductionHead,
	postProjectDailyProduction,
	putProjectDailyProduction,
} from './controllers';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('projectDailyProductionService'));
router.use(projectResolver());

router.head('/', getProjectDailyProductionHead);
router.get('/head', getProjectDailyProductionHead);
router.get('/', getProjectDailyProduction);
router.post('/', postProjectDailyProduction);
router.put('/', putProjectDailyProduction);

export default router;
