import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { FORECAST_RESOLUTION } from '@src/models/forecast-volume';
import { forecastResolver } from '@src/middleware/forecast-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import { getForecastVolumes, getForecastVolumesHead } from './controllers';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('forecastVolumeService'));
router.use(forecastResolver());

router.head('/', getForecastVolumesHead);
router.get('/head', getForecastVolumesHead);
router.get('/', (res, req) => getForecastVolumes(res, req, FORECAST_RESOLUTION[1]));

export default router;
