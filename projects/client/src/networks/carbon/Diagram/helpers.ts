import { FieldErrorsImpl } from 'react-hook-form';
import { create } from 'zustand';

interface TimeSeriesInputStore {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	errors: Partial<FieldErrorsImpl<any>> | undefined;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setErrors: (errors: Partial<FieldErrorsImpl<any>> | undefined) => void;
}

export const useTimeSeriesInputStore = create<TimeSeriesInputStore>((set) => ({
	errors: undefined,
	setErrors: (errors) => set(() => ({ errors })),
}));
