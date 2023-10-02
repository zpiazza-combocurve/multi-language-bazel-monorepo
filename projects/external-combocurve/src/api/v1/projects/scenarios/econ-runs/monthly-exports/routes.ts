import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { econRunResolver } from '@src/middleware/econ-run-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import { createMonthlyExport, getEconMonthlyHead, getMonthlyExportById } from './controllers';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('econMonthlyService'));
router.use(econRunResolver());

router.head('/', getEconMonthlyHead);
router.get('/head', getEconMonthlyHead);
router.get('/:id', getMonthlyExportById);
router.post('/', createMonthlyExport);

export default router;
