import { DAYS_IN_YEAR } from '@src/constants';

export const D_eff_to_D = (D_eff: number): number => {
	return -Math.log(1 - D_eff) / DAYS_IN_YEAR;
};
