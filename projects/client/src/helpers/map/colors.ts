import { mix, toHex } from 'color2k';

export {
	BLUE_2 as WELL_DEFAULT_COLOR,
	BLUE_2 as CLUSTER_COLOR_LOW,
	YELLOW_1 as CLUSTER_COLOR_MED,
	RED_1 as CLUSTER_COLOR_HIGH,
} from '../zing';

const WHITE = '#fff';
const BLACK = '#000';
const DARK_GRAY = '#222';

const MAP_BACKGROUND = { dark: '#343332', light: '#f4f4f2' };
const DIM_INTENSITY = 0.2;

export const getTextColor = (theme) => (theme === 'dark' ? WHITE : BLACK);
export const getTextOutlineColor = (theme) => (theme === 'dark' ? DARK_GRAY : WHITE);

export const dimColor = (color, theme) => toHex(mix(MAP_BACKGROUND[theme], color, DIM_INTENSITY));
