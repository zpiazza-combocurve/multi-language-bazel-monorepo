import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { forecastResolver } from '@src/middleware/forecast-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import { deleteForecastParameters, postForecastParameters, putForecastParameters } from './controllers';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('forecastParameterService'));
router.use(forecastResolver());

router.post('/:wellId/:phase/:series', postForecastParameters);
router.delete('/:wellId/:phase/:series', deleteForecastParameters);
router.put('/:wellId/:phase/:series', putForecastParameters);

export default router;
