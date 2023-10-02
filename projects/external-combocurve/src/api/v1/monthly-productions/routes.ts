import { Router } from 'express';

import { serviceResolver } from '@src/middleware/service-resolver';

import { ApiContextV1 } from '../context';

import {
	deleteMonthlyProduction,
	getMonthlyProduction,
	getMonthlyProductionHead,
	postMonthlyProduction,
	putMonthlyProduction,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('companyMonthlyProductionService'));

router.head('/', getMonthlyProductionHead);
router.get('/head', getMonthlyProductionHead);
router.get('/', getMonthlyProduction);
router.post('/', postMonthlyProduction);
router.put('/', putMonthlyProduction);
router.delete('/', deleteMonthlyProduction);

export default router;
