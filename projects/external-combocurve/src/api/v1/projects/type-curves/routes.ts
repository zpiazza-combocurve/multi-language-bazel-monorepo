import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { projectResolver } from '@src/middleware/project-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	getTypeCurveById,
	getTypeCurveDailyFits,
	getTypeCurveMonthlyFits,
	getTypeCurves,
	getTypeCurvesHead,
	getWellsRep,
} from './controllers';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('typeCurvesService'));
router.use(projectResolver());

router.head('/', getTypeCurvesHead);
router.get('/head', getTypeCurvesHead);
router.get('/', getTypeCurves);
router.get('/:id', getTypeCurveById);
router.get('/:id/fits/daily', getTypeCurveDailyFits);
router.get('/:id/fits/monthly', getTypeCurveMonthlyFits);
router.get('/:id/representative-wells', getWellsRep);

export default router;
