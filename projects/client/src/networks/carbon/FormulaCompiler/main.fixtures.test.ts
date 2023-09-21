import { StreamInput } from './types';

export const TESTS = {
	validOutput: [
		{
			params: {
				formula: 'Oil * 2 + Gas',
				inputs: [StreamInput.OIL, StreamInput.GAS],
			},
			expectedResult: false,
		},
		{
			params: {
				formula: '2 + @FPD(22)',
				inputs: [StreamInput.OIL, StreamInput.GAS],
			},
			expectedResult: false,
		},
		{
			params: {
				formula: '2+2',
				inputs: [],
			},
			expectedResult: false,
		},
	],
	errorOutput: [
		{
			params: {
				formula: 'Oil * 2 + Gas',
				inputs: [StreamInput.OIL],
			},
			expectedResult: 'Gas stream needs to be selected as an input to be used',
		},
		{
			params: {
				formula: 'Oil * 2',
				inputs: [StreamInput.GAS],
			},
			expectedResult: 'Oil stream needs to be selected as an input to be used',
		},
		{
			params: {
				formula: 'Water * 2',
				inputs: [],
			},
			expectedResult: 'Water stream needs to be selected as an input to be used',
		},
		{
			params: {
				formula: '2*@FPD(123)',
				inputs: [],
			},
			expectedResult: '@FPD function is not available',
		},
	],
};
