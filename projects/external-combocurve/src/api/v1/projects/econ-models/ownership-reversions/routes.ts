import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteOwnershipReversion,
	getOwnershipReversionById,
	getOwnershipReversions,
	getOwnershipReversionsHead,
	postOwnershipReversions,
	putOwnershipReversions,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('ownershipReversionService'));

router.head('/', getOwnershipReversionsHead);
router.get('/head', getOwnershipReversionsHead);
router.get('/', getOwnershipReversions);
router.get('/:id', getOwnershipReversionById);
router.delete('/:id', deleteOwnershipReversion);
router.post('/', postOwnershipReversions);
router.put('/', putOwnershipReversions);

export default router;
