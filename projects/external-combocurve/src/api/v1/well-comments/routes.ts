import { Router } from 'express';

import { serviceResolver } from '@src/middleware/service-resolver';

import { ApiContextV1 } from '../context';

import { getWellComments, getWellCommentsHead } from './controllers';

const router = Router();

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('wellCommentService'));

router.head('/', getWellCommentsHead);
router.get('/head', getWellCommentsHead);
router.get('/', getWellComments);

export default router;
