// note CM means Command Manager

/** Key used in the CM_IGNORE payload passed to the command manager */
export const CM_IGNORE_KEY = Symbol('IGNORE');

/** Payload to pass to the command manager before cmd callback to ignore this command */
export const CM_IGNORE = { [CM_IGNORE_KEY]: true };

// note it needs to start with change: for some reason for command manager to be able to see it, investigate in the future, perhaps it can be moved to a graph or paper event and removed the change: prefix
export const INIT_BATCH_EVENT = 'change:cc_init_batch_event';

export const STORE_BATCH_EVENT = 'change:cc_store_batch_event';
