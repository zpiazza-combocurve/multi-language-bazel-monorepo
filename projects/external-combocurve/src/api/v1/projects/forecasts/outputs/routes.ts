import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { forecastResolver } from '@src/middleware/forecast-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import { getForecastData, getForecastDataById, getForecastDataHead } from './controllers';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('forecastDataService'));
router.use(forecastResolver());

router.head('/', getForecastDataHead);
router.get('/head', getForecastDataHead);
router.get('/', getForecastData);
router.get('/:id', getForecastDataById);

export default router;
