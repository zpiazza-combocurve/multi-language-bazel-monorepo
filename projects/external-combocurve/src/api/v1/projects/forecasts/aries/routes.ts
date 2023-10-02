import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { forecastResolver } from '@src/middleware/forecast-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import { getAriesForecastData, getAriesForecastDataHead } from './controllers';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('ariesForecastDataService'));
router.use(forecastResolver());

router.head('/', getAriesForecastDataHead);
router.get('/head', getAriesForecastDataHead);
router.get('/', getAriesForecastData);

export default router;
