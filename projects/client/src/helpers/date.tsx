const makeUtc = <T extends Date | undefined | null>(date: T) => {
	// allow ms or datetime string
	if (date) {
		const asDate = new Date(date);
		return new Date(Date.UTC(asDate.getFullYear(), asDate.getMonth(), asDate.getDate()));
	}
	return null;
};

const makeLocal = <T extends Date | undefined | null>(date: T) => {
	// allow ms or datetime string
	if (date) {
		const asDate = new Date(date);
		return new Date(asDate.getUTCFullYear(), asDate.getUTCMonth(), asDate.getUTCDate());
	}
	return null;
};

// feel like this needs to be included to work around daylight savings, separated it out in case there's a specific usecase for the above function
const makeLocalWithHours = <T extends Date | undefined | null>(date: T) =>
	date && new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours());

const DAYS_IN_YEAR = 365.25;

const yearsToIndex = (years: number) => Math.round(years * DAYS_IN_YEAR);

export { makeLocal, makeLocalWithHours, makeUtc, yearsToIndex };
