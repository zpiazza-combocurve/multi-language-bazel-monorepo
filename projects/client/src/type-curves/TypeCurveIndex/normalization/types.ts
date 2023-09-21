import { getSubmitFormProps } from './useNormalizationForm';

export type NormalizationMultipliers = { eur?: number | null; qPeak?: number | null };
export type NormalizationTypes = 'eur' | 'qPeak';
export type FormSubmissionBaseType = ReturnType<typeof getSubmitFormProps>;
