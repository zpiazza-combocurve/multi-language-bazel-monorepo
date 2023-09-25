export const RESOLUTION = ['daily', 'monthly'] as const;

export type Resolution = (typeof RESOLUTION)[number];
