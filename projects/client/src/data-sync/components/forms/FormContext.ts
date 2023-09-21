import { createContext } from 'react';

type IFormContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	updateValues?: (a: any) => (b: any) => void;
};

export const FormContext = createContext<IFormContext>({});
