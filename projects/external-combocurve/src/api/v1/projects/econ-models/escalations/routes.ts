import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteEscalationById,
	getEscalationById,
	getEscalations,
	getEscalationsHead,
	postEscalations,
	putEscalations,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('escalationService'));

router.head('/', getEscalationsHead);
router.get('/head', getEscalationsHead);
router.get('/', getEscalations);
router.get('/:id', getEscalationById);
router.post('/', postEscalations);
router.put('/', putEscalations);
router.delete('/:id', deleteEscalationById);

export default router;
