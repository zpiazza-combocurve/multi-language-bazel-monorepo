import { Router } from 'express';

import { serviceResolver } from '@src/middleware/service-resolver';

import { ApiContextV1 } from '../context';

import { getTags, getTagsHead } from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('tagsService'));

router.head('/', getTagsHead);
router.get('/head', getTagsHead);
router.get('/', getTags);

export default router;
