import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteDateSettingsById,
	getDateSettings,
	getDateSettingsById,
	getDateSettingsHead,
	postDateSettings,
	putDateSettings,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('dateSettingsService'));

router.head('/', getDateSettingsHead);
router.get('/head', getDateSettingsHead);
router.get('/', getDateSettings);
router.get('/:id', getDateSettingsById);
router.post('/', postDateSettings);
router.put('/', putDateSettings);
router.delete('/:id', deleteDateSettingsById);

export default router;
