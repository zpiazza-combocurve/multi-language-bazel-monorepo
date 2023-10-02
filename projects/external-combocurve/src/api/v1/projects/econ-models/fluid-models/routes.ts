import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteFluidModelById,
	getFluidModelById,
	getFluidModels,
	getFluidModelsHead,
	postFluidModels,
	putFluidModels,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('fluidModelService'));

router.head('/', getFluidModelsHead);
router.get('/head', getFluidModelsHead);
router.get('/', getFluidModels);
router.get('/:id', getFluidModelById);
router.post('/', postFluidModels);
router.put('/', putFluidModels);
router.delete('/:id', deleteFluidModelById);

export default router;
