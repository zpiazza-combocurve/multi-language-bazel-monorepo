import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteDifferentialById,
	getDifferentialById,
	getDifferentials,
	getDifferentialsHead,
	postDifferentials,
	putDifferentials,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('differentialsModelService'));

router.head('/', getDifferentialsHead);
router.get('/head', getDifferentialsHead);
router.get('/', getDifferentials);
router.get('/:id', getDifferentialById);
router.post('/', postDifferentials);
router.put('/', putDifferentials);
router.delete('/:id', deleteDifferentialById);

export default router;
