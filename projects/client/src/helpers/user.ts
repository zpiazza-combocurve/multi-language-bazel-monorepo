import { toLocalDate, toLocalDateTime } from '@/helpers/dates';

export const getShortName = (user: { firstName: string; lastName: string }) => {
	return `${user.firstName[0]}. ${user.lastName}`;
};

export const getFullName = (user: { firstName: string; lastName: string }, defaultUserValue = 'N/A') => {
	if (!user) return defaultUserValue;
	const { firstName, lastName } = user;

	return [firstName, lastName].filter(Boolean).join(' ') || defaultUserValue;
};

export const getNameOrEmail = (user: { firstName: string; lastName: string; email: string }) => {
	const { firstName, lastName, email } = user;
	return [firstName, lastName].filter(Boolean).join(' ') || email;
};

export const getFullNameWithEmail = (user: { firstName: string; lastName: string; email: string }) => {
	const { firstName, lastName, email } = user;
	return [firstName, lastName, `<${email}>`].filter(Boolean).join(' ');
};

export const fullNameAndLocalDateTime = (
	user: { firstName: string; lastName: string } | '' | undefined | null,
	date: string | null,
	defaultUserValue = 'N/A'
) => {
	const userName = user ? getFullName(user, defaultUserValue) : defaultUserValue;
	const localDateTime = toLocalDateTime(date);

	return [userName, localDateTime].filter(Boolean).join('  |  ');
};

export const fullNameAndLocalDate = (
	user: { firstName: string; lastName: string } | '' | undefined | null,
	date: string | Date | null,
	defaultUserValue = 'N/A'
) => {
	const userName = user ? getFullName(user, defaultUserValue) : defaultUserValue;
	const localDate = toLocalDate(date);

	return [userName, localDate].filter(Boolean).join('  |  ');
};
