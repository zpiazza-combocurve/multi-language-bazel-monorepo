import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deletePricingById,
	getPricingById,
	getPricingHead,
	getPricings,
	postPricings,
	putPricings,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('pricingModelService'));

router.head('/', getPricingHead);
router.get('/head', getPricingHead);
router.get('/', getPricings);
router.get('/:id', getPricingById);
router.post('/', postPricings);
router.put('/', putPricings);
router.delete('/:id', deletePricingById);

export default router;
