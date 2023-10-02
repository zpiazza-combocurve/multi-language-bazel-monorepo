import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { projectResolver } from '@src/middleware/project-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteProjectWellById,
	deleteProjectWells,
	getProjectWellById,
	getProjectWells,
	getProjectWellsHead,
	patchProjectWell,
	patchProjectWells,
	postProjectWells,
	putProjectWell,
	putProjectWells,
} from './controllers';
import { projectResolvedProjection } from './fields';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('projectWellService'));
router.use(projectResolver(projectResolvedProjection));

router.head('/', getProjectWellsHead);
router.get('/head', getProjectWellsHead);
router.get('/', getProjectWells);
router.get('/:id', getProjectWellById);
router.post('/', postProjectWells);
router.put('/:id', putProjectWell);
router.put('/', putProjectWells);
router.patch('/:id', patchProjectWell);
router.patch('/', patchProjectWells);
router.delete('/', deleteProjectWells);
router.delete('/:id', deleteProjectWellById);

export default router;
