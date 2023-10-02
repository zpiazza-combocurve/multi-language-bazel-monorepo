import { BASE_API_ECON_RUN_FIELDS } from '@src/api/v1/econ-runs/fields';
import { filterableReadDbFields } from '@src/api/v1/fields';

export const filterableFields = filterableReadDbFields(BASE_API_ECON_RUN_FIELDS);
