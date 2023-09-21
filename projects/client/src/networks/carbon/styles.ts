import { GAS_COLOR, OIL_COLOR, WATER_COLOR } from '@/helpers/zing';

import { Stream } from './types';

export const STREAM_COLORS = {
	[Stream.oil]: OIL_COLOR,
	[Stream.gas]: GAS_COLOR,
	[Stream.water]: WATER_COLOR,
	[Stream.link]: '#848484',
	[Stream.development]: '#F5F5F5',
	default: 'white',
};

export const PORT_SIZE = 9;
export const EXPANDED_PORT_SIZE = 15;
