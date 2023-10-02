import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteProductionTaxesById,
	getProductionTaxes,
	getProductionTaxesById,
	getProductionTaxesHead,
	postProductionTaxes,
	putProductionTaxes,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('productionTaxesService'));

router.head('/', getProductionTaxesHead);
router.get('/head', getProductionTaxesHead);
router.get('/', getProductionTaxes);
router.get('/:id', getProductionTaxesById);
router.post('/', postProductionTaxes);
router.put('/', putProductionTaxes);
router.delete('/:id', deleteProductionTaxesById);

export default router;
