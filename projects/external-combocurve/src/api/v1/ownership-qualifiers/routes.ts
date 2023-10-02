import { Router } from 'express';

import { serviceResolver } from '@src/middleware/service-resolver';

import { ApiContextV1 } from '../context';

import {
	getOwnershipQualifierById,
	getOwnershipQualifierHead,
	getOwnershipQualifiers,
	postOwnershipQualifiers,
	putOwnershipQualifier,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('ownershipQualifierService'));

router.head('/', getOwnershipQualifierHead);
router.get('/head', getOwnershipQualifierHead);
router.get('/', getOwnershipQualifiers);
router.get('/:id', getOwnershipQualifierById);
router.post('/', postOwnershipQualifiers);
router.put('/', putOwnershipQualifier);

export default router;
