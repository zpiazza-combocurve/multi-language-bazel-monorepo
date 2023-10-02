import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteActualForecastById,
	getActualForecastById,
	getActualForecastCount,
	getActualForecasts,
	postActualOrForecast,
	putActualOrForecast,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('actualForecastModelService'));

router.head('/', getActualForecastCount);
router.get('/head', getActualForecastCount);
router.get('/:id', getActualForecastById);
router.get('/', getActualForecasts);
router.post('/', postActualOrForecast);
router.put('/', putActualOrForecast);
router.delete('/:id', deleteActualForecastById);

export default router;
