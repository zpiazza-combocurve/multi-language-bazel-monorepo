import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteRiskingById,
	getRiskingById,
	getRiskings,
	getRiskingsHead,
	postRiskings,
	putRiskings,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('riskingService'));

router.head('/', getRiskingsHead);
router.get('/head', getRiskingsHead);
router.get('/', getRiskings);
router.get('/:id', getRiskingById);
router.post('/', postRiskings);
router.put('/', putRiskings);
router.delete('/:id', deleteRiskingById);

export default router;
