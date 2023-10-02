import { Router } from 'express';

import { serviceResolver } from '@src/middleware/service-resolver';

import { ApiContextV1 } from '../context';

import {
	deleteDailyProduction,
	getDailyProduction,
	getDailyProductionHead,
	postDailyProduction,
	putDailyProduction,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('companyDailyProductionService'));

router.head('/', getDailyProductionHead);
router.get('/head', getDailyProductionHead);
router.get('/', getDailyProduction);
router.post('/', postDailyProduction);
router.put('/', putDailyProduction);
router.delete('/', deleteDailyProduction);

export default router;
