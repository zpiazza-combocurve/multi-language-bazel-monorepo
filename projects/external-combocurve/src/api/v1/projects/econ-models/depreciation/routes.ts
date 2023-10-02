import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteDepreciationById,
	getDepreciation,
	getDepreciationById,
	getDepreciationHead,
	postDepreciation,
	putDepreciation,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('depreciationService'));

router.head('/', getDepreciationHead);
router.get('/head', getDepreciationHead);
router.get('/', getDepreciation);
router.get('/:id', getDepreciationById);
router.post('/', postDepreciation);
router.put('/', putDepreciation);
router.delete('/:id', deleteDepreciationById);

export default router;
