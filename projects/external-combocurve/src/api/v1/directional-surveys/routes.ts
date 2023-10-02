import { Router } from 'express';

import { serviceResolver } from '@src/middleware/service-resolver';

import { ApiContextV1 } from '../context';

import {
	deleteDirectionalSurvey,
	getDirectionalSurveyByID,
	getDirectionalSurveyHead,
	getDirectionalSurveys,
	postDirectionalSurvey,
	putDirectionalSurvey,
} from './controller';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('wellDirectionalSurveysService'));

router.post('/', postDirectionalSurvey);
router.put('/:id', putDirectionalSurvey);
router.delete('/:id', deleteDirectionalSurvey);
router.get('/:id', getDirectionalSurveyByID);
router.head('/', getDirectionalSurveyHead);
router.get('/', getDirectionalSurveys);

export default router;
