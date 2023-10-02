import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { projectResolver } from '@src/middleware/project-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import { deleteScenarios, getScenarioById, getScenarios, getScenariosHead, upsertScenario } from './controllers';
import econRuns from './econ-runs/routes';
import qualifiersController from './qualifiers/controller';
import scenarioWellsController from './well-assignments/controller';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('scenarioService'));
router.use(projectResolver());

router.use('/:scenarioId/econ-runs', econRuns);
router.use('/:scenarioId/qualifiers', qualifiersController.routes());
router.use('/:scenarioId/well-assignments', scenarioWellsController.routes());

router.head('/', getScenariosHead);
router.get('/head', getScenariosHead);
router.get('/', getScenarios);
router.get('/:id', getScenarioById);
router.post('/', upsertScenario);
router.put('/', upsertScenario);
router.delete('/', deleteScenarios);

export default router;
