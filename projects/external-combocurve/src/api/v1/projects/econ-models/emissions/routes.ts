import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteEmissionById,
	getEmissionById,
	getEmissions,
	getEmissionsHead,
	postEmissions,
	putEmissions,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('emissionService'));

router.head('/', getEmissionsHead);
router.get('/head', getEmissionsHead);
router.get('/', getEmissions);
router.get('/:id', getEmissionById);
router.post('/', postEmissions);
router.put('/', putEmissions);
router.delete('/:id', deleteEmissionById);

export default router;
