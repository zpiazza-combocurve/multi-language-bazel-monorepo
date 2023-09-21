import { EMPTY, LOADING } from '@/tables/Table/useAsyncRows';

export const PRIORITY_COLUMN = 'priority';
export const SCHEDULING_STATUS_COLUMN = 'scheduling_status';
export const NPV_COLUMN = 'npv';
export const EDITABLE_COLUMNS = [PRIORITY_COLUMN, SCHEDULING_STATUS_COLUMN];

export const CACHE_BLOCK_SIZE = 5000;

export const DEFAULT_COLUMN_STATES = [EMPTY, LOADING];

export const NULLABLE_VALUES = ['', undefined, null];
