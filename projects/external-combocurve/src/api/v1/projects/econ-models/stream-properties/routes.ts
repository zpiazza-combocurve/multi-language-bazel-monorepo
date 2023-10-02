import { Router } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { serviceResolver } from '@src/middleware/service-resolver';

import {
	deleteStreamPropertiesById,
	getStreamProperties,
	getStreamPropertiesById,
	getStreamPropertiesHead,
	postStreamProperties,
	putStreamProperties,
} from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('streamPropertiesService'));

router.head('/', getStreamPropertiesHead);
router.get('/head', getStreamPropertiesHead);
router.get('/', getStreamProperties);
router.get('/:id', getStreamPropertiesById);
router.post('/', postStreamProperties);
router.put('/', putStreamProperties);
router.delete('/:id', deleteStreamPropertiesById);

export default router;
