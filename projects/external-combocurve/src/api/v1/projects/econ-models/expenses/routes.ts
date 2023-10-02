import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteExpensesById,
	getExpenses,
	getExpensesById,
	getExpensesHead,
	postExpenses,
	putExpenses,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('expensesService'));

router.head('/', getExpensesHead);
router.get('/head', getExpensesHead);
router.get('/', getExpenses);
router.get('/:id', getExpensesById);
router.post('/', postExpenses);
router.put('/', putExpenses);
router.delete('/:id', deleteExpensesById);

export default router;
