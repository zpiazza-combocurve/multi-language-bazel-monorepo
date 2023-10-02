import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteReservesCategory,
	getReservesCategories,
	getReservesCategoriesHead,
	getReservesCategoryById,
	postReservesCategories,
	putReservesCategories,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('reservesCategoryService'));

router.head('/', getReservesCategoriesHead);
router.get('/head', getReservesCategoriesHead);
router.get('/', getReservesCategories);
router.get('/:id', getReservesCategoryById);
router.delete('/:id', deleteReservesCategory);
router.post('/', postReservesCategories);
router.put('/', putReservesCategories);

export default router;
