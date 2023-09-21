import yup from '@/helpers/yup-helpers';

import { SCHEDULING_STATUS_OPTIONS } from './HeaderComponents/SchedulingStatusHeaderComponent/types';

export const PriorityValidation = yup.number().not([undefined]).nullable();
export const StatusValidation = yup.string().oneOf(SCHEDULING_STATUS_OPTIONS);
