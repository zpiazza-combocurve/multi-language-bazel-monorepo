import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteGeneralOptionsById,
	getGeneralOptions,
	getGeneralOptionsById,
	getGeneralOptionsCount,
	postGeneralOptions,
	putGeneralOptions,
} from './controller';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('generalOptionsModelService'));

router.head('/', getGeneralOptionsCount);
router.get('/head', getGeneralOptionsCount);
router.get('/:id', getGeneralOptionsById);
router.get('/', getGeneralOptions);
router.post('/', postGeneralOptions);
router.put('/', putGeneralOptions);
router.delete('/:id', deleteGeneralOptionsById);

export default router;
