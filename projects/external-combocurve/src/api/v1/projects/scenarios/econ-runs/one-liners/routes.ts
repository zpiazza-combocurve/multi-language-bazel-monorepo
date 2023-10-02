import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { econRunResolver } from '@src/middleware/econ-run-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import { getEconRunData, getEconRunDataById, getEconRunDataHead, getEconRunsComboNames } from './controllers';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('econRunDataService'));
router.use(econRunResolver());

router.head('/', getEconRunDataHead);
router.get('/head', getEconRunDataHead);
router.get('/', getEconRunData);
router.get('/combo-names', getEconRunsComboNames);
router.get('/:id', getEconRunDataById);

export default router;
