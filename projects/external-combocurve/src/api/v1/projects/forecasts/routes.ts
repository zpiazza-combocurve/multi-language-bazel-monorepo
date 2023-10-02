import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { projectResolver } from '@src/middleware/project-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import { addWellToForecast, getForecastById, getForecasts, getForecastsHead } from './controllers';
import ariesForecastData from './aries/routes';
import dailyForecastVolumes from './volumes/daily-volume-routes';
import forecastData from './outputs/routes';
import forecastParameters from './parameters/routes';
import monthlyForecastVolumes from './volumes/monthly-volume-routes';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('forecastService'));
router.use(projectResolver());

router.use('/:forecastId/outputs', forecastData);
router.use('/:forecastId/aries', ariesForecastData);
router.use('/:forecastId/parameters', forecastParameters);
router.use('/:forecastId/daily-volumes', dailyForecastVolumes);
router.use('/:forecastId/monthly-volumes', monthlyForecastVolumes);

router.head('/', getForecastsHead);
router.get('/head', getForecastsHead);
router.get('/', getForecasts);
router.get('/:id', getForecastById);
router.post('/:id/wells', addWellToForecast);

export default router;
