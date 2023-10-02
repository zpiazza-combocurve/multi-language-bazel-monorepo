import { Router } from 'express';

import { serviceResolver } from '@src/middleware/service-resolver';

import { ApiContextV1 } from '../context';

import { getProjectById, getProjects, getProjectsHead, postProjects } from './controllers';
import econModels from './econ-models/routes';
import forecasts from './forecasts/routes';
import projectCompanyWells from './company-wells/routes';
import projectDailyProductions from './daily-productions/routes';
import projectMonthlyProductions from './monthly-productions/routes';
import projectWells from './wells/routes';
import scenarios from './scenarios/routes';
import typeCurves from './type-curves/routes';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('projectService'));

router.use('/:projectId/company-wells', projectCompanyWells);

router.use('/:projectId/daily-productions', projectDailyProductions);

router.use('/:projectId/econ-models', econModels);

router.use('/:projectId/forecasts', forecasts);

router.use('/:projectId/monthly-productions', projectMonthlyProductions);

router.use('/:projectId/scenarios', scenarios);

router.use('/:projectId/type-curves', typeCurves);

router.use('/:projectId/wells', projectWells);

router.head('/', getProjectsHead);
router.get('/head', getProjectsHead);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', postProjects);

export default router;
