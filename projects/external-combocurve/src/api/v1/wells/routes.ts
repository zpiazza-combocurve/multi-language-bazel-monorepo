import { Router } from 'express';

import { serviceResolver } from '@src/middleware/service-resolver';

import { ApiContextV1 } from '../context';

import {
	deleteWellById,
	deleteWells,
	getWellById,
	getWells,
	getWellsHead,
	patchWell,
	patchWells,
	postWells,
	putWell,
	putWells,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('companyWellService'));

router.head('/', getWellsHead);
router.get('/head', getWellsHead);
router.get('/', getWells);
router.get('/:id', getWellById);
router.post('/', postWells);
router.put('/:id', putWell);
router.put('/', putWells);
router.patch('/:id', patchWell);
router.patch('/', patchWells);
router.delete('/', deleteWells);
router.delete('/:id', deleteWellById);

export default router;
