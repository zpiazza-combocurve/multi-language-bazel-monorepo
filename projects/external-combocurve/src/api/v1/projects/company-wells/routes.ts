import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { projectResolver } from '@src/middleware/project-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteProjectCompanyWells,
	getProjectCompanyWellById,
	getProjectCompanyWells,
	getProjectCompanyWellsHead,
	postProjectCompanyWells,
} from './controllers';
import { projectResolvedProjection } from './fields';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('projectCompanyWellService'));
router.use(projectResolver(projectResolvedProjection));

router.delete('/', deleteProjectCompanyWells);
router.head('/', getProjectCompanyWellsHead);
router.get('/head', getProjectCompanyWellsHead);
router.get('/', getProjectCompanyWells);
router.get('/:id', getProjectCompanyWellById);
router.post('/', postProjectCompanyWells);

export default router;
