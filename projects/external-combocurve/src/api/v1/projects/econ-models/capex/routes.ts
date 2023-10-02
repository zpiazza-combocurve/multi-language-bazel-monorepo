import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import { deleteCapexById, getCapex, getCapexById, getCapexHead, postCapex, putCapex } from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('capexService'));

router.head('/', getCapexHead);
router.get('/head', getCapexHead);
router.get('/', getCapex);
router.get('/:id', getCapexById);
router.post('/', postCapex);
router.put('/', putCapex);
router.delete('/:id', deleteCapexById);

export default router;
